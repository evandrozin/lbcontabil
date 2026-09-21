import { NextResponse } from "next/server";
import { esquemaSimulacao } from "@/lib/checkout/esquema";
import { supabaseDisponivel, supabaseServidor } from "@/lib/supabase/servidor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Registra a simulação no momento em que o visitante clica para contratar.
 *
 * É analytics de produto, não captura de lead: não gravamos nome, e-mail ou
 * documento aqui. Serve para responder "qual segmento simula mais e converte
 * menos?" e para recalibrar a tabela de preços com demanda real.
 */
export async function POST(requisicao: Request) {
  let corpo: unknown;
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const validacao = esquemaSimulacao.safeParse(corpo);
  if (!validacao.success) {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 422 });
  }

  if (!supabaseDisponivel()) {
    return NextResponse.json({ registrado: false });
  }

  const dados = validacao.data;
  const { error } = await supabaseServidor().from("simulacoes").insert({
    segmento_id: dados.segmentoId,
    plano_recomendado_id: dados.planoRecomendadoId,
    periodicidade: dados.periodicidade,
    total_mensal_centavos: dados.totalMensalCentavos,
    entrada: dados.entrada,
    origem: dados.origem ?? null,
  });

  if (error) {
    // Analytics nunca pode atrapalhar a navegação do visitante.
    console.error("[simulacoes] falha ao registrar", error);
    return NextResponse.json({ registrado: false });
  }

  return NextResponse.json({ registrado: true });
}
