import type { SegmentoId } from "@/lib/catalogo/tipos";
import {
  CALENDARIO_CONFERIDO_POR,
  OBRIGACOES,
  type Obrigacao,
} from "./catalogo";
import {
  diaUtilAnterior,
  ehDiaUtilBancario,
  proximoDiaUtil,
  ultimoDiaUtilDoMes,
  type Feriado,
  type OpcoesDiaUtil,
} from "./feriados";
import {
  diferencaEmDias,
  montarData,
  somarDias,
  somarMeses,
  ultimoDiaDoMes,
  type DataIso,
} from "./datas";

/**
 * Motor de obrigações: transforma o catálogo em datas concretas para um
 * cliente específico.
 *
 * Função pura — nenhuma data "de hoje" embutida. Quem chama informa o
 * intervalo. É o que torna o resultado reproduzível e permite simular
 * qualquer mês sem mexer no relógio.
 */

export interface PerfilCliente {
  segmentoId: SegmentoId;
  temEmpregados: boolean;
  /** Feriados municipais e estaduais da praça do cliente. */
  feriadosExtras?: Feriado[];
  /**
   * Dia de vencimento próprio da praça, por obrigação. Usado onde o prazo
   * é estadual ou municipal (SPED Fiscal, ISS) e o padrão não serve.
   */
  diasPorPraca?: Record<string, number>;
}

export interface Vencimento {
  obrigacao: Obrigacao;
  /** "2026-03" para mensal, "2026-T1" para trimestral, "2026" para anual. */
  competencia: string;
  /** Data antes do ajuste de dia útil. */
  vencimentoNominal: DataIso;
  /** Data efetiva, já ajustada por fim de semana e feriado. */
  vencimento: DataIso;
  ajustado: boolean;
}

const MESES_FINAIS_DE_TRIMESTRE = [3, 6, 9, 12];

function aplicaAoPerfil(obrigacao: Obrigacao, perfil: PerfilCliente): boolean {
  if (!obrigacao.segmentos.includes(perfil.segmentoId)) return false;
  if (obrigacao.exigeEmpregados && !perfil.temEmpregados) return false;
  return true;
}

function ajustar(
  data: DataIso,
  ajuste: Obrigacao["ajuste"],
  opcoes: OpcoesDiaUtil,
): DataIso {
  if (ajuste === "nenhum") return data;
  if (ehDiaUtilBancario(data, opcoes)) return data;
  return ajuste === "antecipa"
    ? diaUtilAnterior(data, opcoes)
    : proximoDiaUtil(data, opcoes);
}

function diaEfetivo(obrigacao: Obrigacao, perfil: PerfilCliente): number | "ultimo-dia-util" {
  const daPraca = perfil.diasPorPraca?.[obrigacao.id];
  return daPraca ?? obrigacao.dia;
}

function montarVencimento(
  obrigacao: Obrigacao,
  perfil: PerfilCliente,
  ano: number,
  mes: number,
  competencia: string,
  opcoes: OpcoesDiaUtil,
): Vencimento {
  const dia = diaEfetivo(obrigacao, perfil);

  const nominal =
    dia === "ultimo-dia-util"
      ? ultimoDiaDoMes(ano, mes)
      // Dia 31 num mês de 30 não existe: cai no último dia do mês.
      : montarData(ano, mes, Math.min(dia, Number(ultimoDiaDoMes(ano, mes).slice(8))));

  const vencimento =
    dia === "ultimo-dia-util"
      ? ultimoDiaUtilDoMes(ano, mes, opcoes)
      : ajustar(nominal, obrigacao.ajuste, opcoes);

  return {
    obrigacao,
    competencia,
    vencimentoNominal: nominal,
    vencimento,
    ajustado: vencimento !== nominal,
  };
}

/**
 * Todos os vencimentos de um cliente num intervalo.
 *
 * Varre os meses de vencimento e volta para descobrir a competência, em
 * vez do contrário — assim uma obrigação com `mesesApos` 2 não precisa de
 * tratamento especial na borda do intervalo.
 */
export function vencimentosNoIntervalo(
  perfil: PerfilCliente,
  deIso: DataIso,
  ateIso: DataIso,
): Vencimento[] {
  const opcoes: OpcoesDiaUtil = { feriadosExtras: perfil.feriadosExtras };
  const aplicaveis = OBRIGACOES.filter((o) => aplicaAoPerfil(o, perfil));
  const resultado: Vencimento[] = [];

  const anoDe = Number(deIso.slice(0, 4));
  const mesDe = Number(deIso.slice(5, 7));
  const anoAte = Number(ateIso.slice(0, 4));
  const mesAte = Number(ateIso.slice(5, 7));

  const primeiro = anoDe * 12 + (mesDe - 1);
  const ultimo = anoAte * 12 + (mesAte - 1);

  for (let indice = primeiro; indice <= ultimo; indice++) {
    const ano = Math.floor(indice / 12);
    const mes = (indice % 12) + 1;

    for (const obrigacao of aplicaveis) {
      if (obrigacao.frequencia === "mensal") {
        const comp = somarMeses(ano, mes, -(obrigacao.mesesApos ?? 1));
        resultado.push(
          montarVencimento(
            obrigacao,
            perfil,
            ano,
            mes,
            `${comp.ano}-${String(comp.mes).padStart(2, "0")}`,
            opcoes,
          ),
        );
        continue;
      }

      if (obrigacao.frequencia === "trimestral") {
        const fim = somarMeses(ano, mes, -(obrigacao.mesesApos ?? 1));
        if (!MESES_FINAIS_DE_TRIMESTRE.includes(fim.mes)) continue;
        resultado.push(
          montarVencimento(
            obrigacao,
            perfil,
            ano,
            mes,
            `${fim.ano}-T${fim.mes / 3}`,
            opcoes,
          ),
        );
        continue;
      }

      if (obrigacao.mesVencimento === mes) {
        resultado.push(
          montarVencimento(obrigacao, perfil, ano, mes, String(ano - 1), opcoes),
        );
      }
    }
  }

  return resultado
    .filter((v) => v.vencimento >= deIso && v.vencimento <= ateIso)
    .sort(
      (a, b) =>
        a.vencimento.localeCompare(b.vencimento) ||
        a.obrigacao.nome.localeCompare(b.obrigacao.nome),
    );
}

// ─── Régua de lembretes ────────────────────────────────────────────────

export type TipoLembrete = "D-5" | "D-1" | "D+1";
export type Destinatario = "cliente" | "equipe";

export interface Lembrete {
  obrigacaoId: string;
  competencia: string;
  tipo: TipoLembrete;
  data: DataIso;
  vencimento: DataIso;
  destinatario: Destinatario;
  mensagem: string;
}

/**
 * Régua D-5, D-1 e D+1.
 *
 * Quem recebe depende da natureza da obrigação: guia que o cliente paga
 * vira mensagem para ele; declaração que a equipe transmite vira tarefa
 * interna. Mandar "entregue sua EFD-Contribuições" para o empresário só
 * gera ligação de dúvida.
 *
 * Os avisos prévios andam para trás até cair em dia útil — lembrete que
 * chega no domingo é lembrete perdido. O D+1 anda para frente, porque só
 * faz sentido depois que houve expediente para pagar.
 */
export function reguaDeLembretes(
  vencimento: Vencimento,
  perfil: PerfilCliente,
): Lembrete[] {
  const opcoes: OpcoesDiaUtil = { feriadosExtras: perfil.feriadosExtras };
  const { obrigacao } = vencimento;
  const destinatario: Destinatario = obrigacao.geraGuia ? "cliente" : "equipe";

  const previos: { tipo: TipoLembrete; dias: number }[] = [
    { tipo: "D-5", dias: -5 },
    { tipo: "D-1", dias: -1 },
  ];

  const lembretes: Lembrete[] = previos.map(({ tipo, dias }) => ({
    obrigacaoId: obrigacao.id,
    competencia: vencimento.competencia,
    tipo,
    data: diaUtilAnterior(somarDias(vencimento.vencimento, dias), opcoes),
    vencimento: vencimento.vencimento,
    destinatario,
    mensagem:
      destinatario === "cliente"
        ? `${obrigacao.nome} da competência ${vencimento.competencia} vence em breve.`
        : `Transmitir ${obrigacao.nome} da competência ${vencimento.competencia}.`,
  }));

  // O D+1 só existe onde há pagamento a confirmar.
  if (obrigacao.geraGuia) {
    lembretes.push({
      obrigacaoId: obrigacao.id,
      competencia: vencimento.competencia,
      tipo: "D+1",
      data: proximoDiaUtil(somarDias(vencimento.vencimento, 1), opcoes),
      vencimento: vencimento.vencimento,
      destinatario: "cliente",
      mensagem: `Confirmar pagamento de ${obrigacao.nome} da competência ${vencimento.competencia}.`,
    });
  }

  return lembretes;
}

export function lembretesNoIntervalo(
  perfil: PerfilCliente,
  deIso: DataIso,
  ateIso: DataIso,
): Lembrete[] {
  // A janela de vencimentos é alargada porque um D-5 do mês seguinte pode
  // cair dentro do intervalo pedido, e um D+1 do anterior também.
  const vencimentos = vencimentosNoIntervalo(
    perfil,
    somarDias(deIso, -10),
    somarDias(ateIso, 10),
  );

  return vencimentos
    .flatMap((v) => reguaDeLembretes(v, perfil))
    .filter((l) => l.data >= deIso && l.data <= ateIso)
    .sort((a, b) => a.data.localeCompare(b.data));
}

// ─── Apoio à agenda ────────────────────────────────────────────────────

export interface ResumoAgenda {
  vencimentos: Vencimento[];
  /** Quantos dias faltam para o próximo vencimento, a partir de `hoje`. */
  diasAteProximo: number | null;
  proximo: Vencimento | null;
  /** O calendário ainda não foi conferido por um contador. */
  calendarioHomologado: boolean;
}

export function agenda(
  perfil: PerfilCliente,
  hojeIso: DataIso,
  diasAFrente = 60,
): ResumoAgenda {
  const vencimentos = vencimentosNoIntervalo(
    perfil,
    hojeIso,
    somarDias(hojeIso, diasAFrente),
  );
  const proximo = vencimentos[0] ?? null;

  return {
    vencimentos,
    proximo,
    diasAteProximo: proximo ? diferencaEmDias(hojeIso, proximo.vencimento) : null,
    calendarioHomologado: Boolean(CALENDARIO_CONFERIDO_POR),
  };
}
