import type { SegmentoId } from "@/lib/catalogo/tipos";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { somarDias } from "./datas";
import { vencimentosNoIntervalo, type PerfilCliente } from "./motor";

/**
 * Materializa as obrigações do motor em linhas no banco.
 *
 * O motor é função pura: ele sabe QUAIS obrigações existem e QUANDO
 * vencem, mas não sabe o que aconteceu com cada uma. Esta é a ponte —
 * cria a linha uma vez, e a partir daí o estado é do banco.
 *
 * A criação é idempotente por (assinatura, obrigação, competência), então
 * rodar de novo não duplica nem sobrescreve o que já foi concluído.
 */

export type StatusObrigacao =
  | "pendente"
  | "aguardando-cliente"
  | "concluida"
  | "cancelada";

export interface ObrigacaoDoCliente {
  id: string;
  obrigacao_id: string;
  nome: string;
  competencia: string;
  vencimento: string;
  vencimento_nominal: string | null;
  responsavel: "cliente" | "equipe";
  status: StatusObrigacao;
  gera_guia: boolean;
  valor_centavos: number | null;
  codigo_pix: string | null;
  url_guia: string | null;
  pagamento_declarado_em: string | null;
  concluida_em: string | null;
  observacao: string | null;
}

const JANELA_PADRAO_DIAS = 120;

export async function sincronizarObrigacoes(params: {
  assinaturaId: string;
  segmentoId: SegmentoId;
  temEmpregados: boolean;
  hojeIso: string;
  diasAFrente?: number;
}): Promise<{ previstas: number }> {
  const perfil: PerfilCliente = {
    segmentoId: params.segmentoId,
    temEmpregados: params.temEmpregados,
  };

  // Olha um pouco para trás também: uma obrigação que venceu ontem ainda
  // precisa aparecer como pendente, não sumir da tela.
  const vencimentos = vencimentosNoIntervalo(
    perfil,
    somarDias(params.hojeIso, -60),
    somarDias(params.hojeIso, params.diasAFrente ?? JANELA_PADRAO_DIAS),
  );

  if (vencimentos.length === 0) return { previstas: 0 };

  const linhas = vencimentos.map((v) => ({
    assinatura_id: params.assinaturaId,
    obrigacao_id: v.obrigacao.id,
    nome: v.obrigacao.nome,
    competencia: v.competencia,
    vencimento: v.vencimento,
    vencimento_nominal: v.vencimentoNominal,
    responsavel: v.obrigacao.geraGuia ? "cliente" : "equipe",
    gera_guia: v.obrigacao.geraGuia,
  }));

  // ignoreDuplicates mantém intacto o que já existe: uma obrigação já
  // concluída não pode voltar para pendente porque a rotina rodou de novo.
  const { error } = await supabaseServidor()
    .from("obrigacoes_cliente")
    .upsert(linhas, {
      onConflict: "assinatura_id,obrigacao_id,competencia",
      ignoreDuplicates: true,
    });

  if (error) {
    console.error("[obrigacoes] falha ao sincronizar", error);
    throw new Error("Não foi possível atualizar o calendário da empresa.");
  }

  return { previstas: linhas.length };
}

export interface PainelObrigacoes {
  pendentes: ObrigacaoDoCliente[];
  concluidas: ObrigacaoDoCliente[];
  /** Vencidas e ainda não concluídas. */
  atrasadas: ObrigacaoDoCliente[];
}

const CAMPOS =
  "id, obrigacao_id, nome, competencia, vencimento, vencimento_nominal, responsavel, status, gera_guia, valor_centavos, codigo_pix, url_guia, pagamento_declarado_em, concluida_em, observacao";

export async function painelDoAssinante(
  assinaturaId: string,
  hojeIso: string,
): Promise<PainelObrigacoes> {
  const { data } = await supabaseServidor()
    .from("obrigacoes_cliente")
    .select(CAMPOS)
    .eq("assinatura_id", assinaturaId)
    .neq("status", "cancelada")
    .order("vencimento", { ascending: true })
    .returns<ObrigacaoDoCliente[]>();

  const linhas = data ?? [];

  const concluidas = linhas
    .filter((o) => o.status === "concluida")
    .sort((a, b) => b.vencimento.localeCompare(a.vencimento));

  const abertas = linhas.filter((o) => o.status !== "concluida");

  return {
    pendentes: abertas.filter((o) => o.vencimento >= hojeIso),
    atrasadas: abertas.filter((o) => o.vencimento < hojeIso),
    concluidas,
  };
}

/**
 * Registra que o cliente declarou ter pago.
 *
 * Declaração NÃO é baixa. O status só vira "concluída" quando a equipe
 * confere o pagamento na Receita — é a diferença entre o cliente dizer
 * que pagou e o pagamento existir.
 */
export async function declararPagamento(
  assinaturaId: string,
  obrigacaoLinhaId: string,
): Promise<boolean> {
  const { error, count } = await supabaseServidor()
    .from("obrigacoes_cliente")
    .update(
      { pagamento_declarado_em: new Date().toISOString(), status: "aguardando-cliente" },
      { count: "exact" },
    )
    // O filtro por assinatura é o que impede um cliente de marcar a
    // obrigação de outro, mesmo sabendo o id da linha.
    .eq("assinatura_id", assinaturaId)
    .eq("id", obrigacaoLinhaId)
    .eq("gera_guia", true);

  if (error) {
    console.error("[obrigacoes] falha ao declarar pagamento", error);
    return false;
  }

  return (count ?? 0) > 0;
}
