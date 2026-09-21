import { NextResponse } from "next/server";
import { esquemaCheckout } from "@/lib/checkout/esquema";
import { planoPorId } from "@/lib/catalogo/planos";
import { ErroGateway, obterGateway } from "@/lib/pagamentos";
import { supabaseDisponivel, supabaseServidor } from "@/lib/supabase/servidor";

export const runtime = "nodejs";
/** Nunca cachear: cada POST cria uma venda. */
export const dynamic = "force-dynamic";

/** Primeira cobrança no dia seguinte, dando folga para o cliente pagar. */
function primeiroVencimento(): string {
  const data = new Date();
  data.setDate(data.getDate() + 1);
  return data.toISOString().slice(0, 10);
}

export async function POST(requisicao: Request) {
  let corpo: unknown;
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  }

  const validacao = esquemaCheckout.safeParse(corpo);
  if (!validacao.success) {
    return NextResponse.json(
      {
        erro: "Dados inválidos.",
        campos: validacao.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const dados = validacao.data;

  // O preço vem SEMPRE do catálogo no servidor. Nunca aceite valor vindo do
  // cliente: seria trivial abrir o devtools e assinar o Premium por R$ 1.
  const plano = planoPorId(dados.planoId);
  if (!plano) {
    return NextResponse.json({ erro: "Plano não encontrado." }, { status: 404 });
  }

  const valorMensalCentavos =
    dados.periodicidade === "anual"
      ? plano.precoAnualMensalizadoCentavos
      : plano.precoMensalCentavos;

  const gateway = obterGateway();
  const referenciaExterna = crypto.randomUUID();

  let clienteId: string;
  let assinatura: Awaited<ReturnType<typeof gateway.criarAssinatura>>;

  try {
    const cliente = await gateway.criarCliente({
      nome: dados.responsavelNome,
      email: dados.responsavelEmail,
      cpfCnpj: dados.responsavelCpfCnpj,
      celular: dados.responsavelCelular,
      cep: dados.cep || undefined,
      referenciaExterna,
    });
    clienteId = cliente.id;

    assinatura = await gateway.criarAssinatura({
      clienteId,
      valorCentavos: valorMensalCentavos,
      metodo: dados.metodo,
      descricao: `${plano.nome} — honorários contábeis (${dados.periodicidade})`,
      primeiroVencimento: primeiroVencimento(),
      referenciaExterna,
    });
  } catch (erro) {
    const mensagem =
      erro instanceof ErroGateway
        ? erro.message
        : "Não conseguimos iniciar a cobrança. Tente novamente em instantes.";
    console.error("[assinaturas] falha no gateway", erro);
    return NextResponse.json({ erro: mensagem }, { status: 502 });
  }

  // Sem banco configurado (dev), a venda segue: o cliente não pode ser
  // penalizado por configuração nossa. O aviso fica no log.
  if (!supabaseDisponivel()) {
    console.warn("[assinaturas] Supabase não configurado — venda não persistida.");
    return NextResponse.json({
      id: referenciaExterna,
      urlPagamento: assinatura.urlPagamento,
      onboardingToken: null,
      persistido: false,
    });
  }

  const supabase = supabaseServidor();
  const { data, error } = await supabase
    .from("assinaturas")
    .insert({
      plano_id: plano.id,
      segmento_id: plano.segmentoId,
      periodicidade: dados.periodicidade,
      valor_mensal_centavos: valorMensalCentavos,
      responsavel_nome: dados.responsavelNome,
      responsavel_email: dados.responsavelEmail,
      responsavel_cpf_cnpj: dados.responsavelCpfCnpj,
      responsavel_celular: dados.responsavelCelular,
      cep: dados.cep || null,
      ja_tem_empresa: dados.jaTemEmpresa,
      empresa_razao_social: dados.empresaRazaoSocial || null,
      empresa_cnpj: dados.empresaCnpj || null,
      gateway: gateway.nome,
      gateway_cliente_id: clienteId,
      gateway_assinatura_id: assinatura.id,
      url_pagamento: assinatura.urlPagamento,
      status: assinatura.status,
      aceite_ip: requisicao.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      aceite_user_agent: requisicao.headers.get("user-agent"),
    })
    .select("id, onboarding_token")
    .single();

  if (error) {
    // A cobrança já existe no gateway. Falhar aqui deixaria a venda órfã,
    // então registramos para conciliação manual e seguimos com o cliente.
    console.error("[assinaturas] cobrança criada mas não persistida", {
      gatewayAssinaturaId: assinatura.id,
      referenciaExterna,
      error,
    });
    return NextResponse.json({
      id: referenciaExterna,
      urlPagamento: assinatura.urlPagamento,
      onboardingToken: null,
      persistido: false,
    });
  }

  return NextResponse.json({
    id: data.id,
    urlPagamento: assinatura.urlPagamento,
    onboardingToken: data.onboarding_token,
    persistido: true,
  });
}
