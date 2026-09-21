import { NextResponse } from "next/server";
import { obterGateway } from "@/lib/pagamentos";
import { supabaseDisponivel, supabaseServidor } from "@/lib/supabase/servidor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Recebe eventos de cobrança do Asaas.
 *
 * Autenticação: o Asaas envia, em todo POST, o token configurado no painel
 * pelo header `asaas-access-token`. Sem conferir isso, qualquer um poderia
 * marcar assinaturas como pagas. Comparamos em tempo constante para não
 * vazar o token por diferença de tempo de resposta.
 */
function tokenConfere(recebido: string | null): boolean {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!esperado) return false;
  if (!recebido || recebido.length !== esperado.length) return false;

  let diferenca = 0;
  for (let i = 0; i < esperado.length; i++) {
    diferenca |= esperado.charCodeAt(i) ^ recebido.charCodeAt(i);
  }
  return diferenca === 0;
}

export async function POST(requisicao: Request) {
  if (!tokenConfere(requisicao.headers.get("asaas-access-token"))) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  let corpo: unknown;
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const gateway = obterGateway();
  const evento = gateway.interpretarWebhook(corpo);

  if (!evento) {
    return NextResponse.json({ erro: "Evento não reconhecido." }, { status: 400 });
  }

  if (!supabaseDisponivel()) {
    console.warn("[webhook] Supabase indisponível — evento descartado", evento.tipo);
    // 200 de propósito: o Asaas reenviaria indefinidamente, e o problema é nosso.
    return NextResponse.json({ recebido: true, persistido: false });
  }

  const supabase = supabaseServidor();

  // A trilha de auditoria é gravada ANTES de qualquer efeito, com o payload
  // cru. Se a atualização falhar, ainda dá para reprocessar a partir daqui.
  const { data: registro } = await supabase
    .from("eventos_gateway")
    .insert({
      gateway: gateway.nome,
      tipo: evento.tipo,
      gateway_assinatura_id: evento.assinaturaId,
      payload: corpo as Record<string, unknown>,
    })
    .select("id")
    .single();

  if (!evento.status || !evento.assinaturaId) {
    return NextResponse.json({ recebido: true, aplicado: false });
  }

  const { error } = await supabase
    .from("assinaturas")
    .update({ status: evento.status })
    .eq("gateway_assinatura_id", evento.assinaturaId);

  if (error) {
    console.error("[webhook] falha ao aplicar status", { evento, error });
    if (registro) {
      await supabase
        .from("eventos_gateway")
        .update({ erro: error.message })
        .eq("id", registro.id);
    }
    return NextResponse.json({ erro: "Falha ao aplicar evento." }, { status: 500 });
  }

  if (registro) {
    await supabase
      .from("eventos_gateway")
      .update({ processado: true })
      .eq("id", registro.id);
  }

  return NextResponse.json({ recebido: true, aplicado: true });
}
