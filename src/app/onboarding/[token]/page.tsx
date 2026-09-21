import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { montarChecklist } from "@/lib/onboarding/checklist";
import { planoPorId } from "@/lib/catalogo/planos";
import { SEGMENTOS } from "@/lib/catalogo/segmentos";
import type { SegmentoId } from "@/lib/catalogo/tipos";
import { supabaseDisponivel, supabaseServidor } from "@/lib/supabase/servidor";
import { SITE, linkWhatsApp } from "@/lib/config";
import { BotaoLink, Cartao, Container, Selo } from "@/components/ui/primitivos";
import { ItemUpload } from "@/components/onboarding/ItemUpload";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Onboarding",
  // Página de cliente: nunca deve aparecer em busca.
  robots: { index: false, follow: false },
};

interface AssinaturaOnboarding {
  id: string;
  plano_id: string;
  segmento_id: SegmentoId;
  responsavel_nome: string;
  ja_tem_empresa: boolean;
  status: string;
  onboarding_concluido_em: string | null;
}

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!supabaseDisponivel()) {
    return (
      <Container className="py-16">
        <Cartao>
          <h1 className="text-2xl font-bold">Onboarding indisponível</h1>
          <p className="mt-2 text-texto-suave">
            O envio de documentos ainda não está configurado neste ambiente. Fale com a
            equipe pelo WhatsApp que seguimos o processo por lá.
          </p>
          <BotaoLink
            href={linkWhatsApp(`Olá! Preciso enviar meus documentos para a ${SITE.nome}.`)}
            className="mt-6"
          >
            Falar no WhatsApp
          </BotaoLink>
        </Cartao>
      </Container>
    );
  }

  const supabase = supabaseServidor();

  const { data: assinatura } = await supabase
    .from("assinaturas")
    .select(
      "id, plano_id, segmento_id, responsavel_nome, ja_tem_empresa, status, onboarding_concluido_em",
    )
    .eq("onboarding_token", token)
    .maybeSingle<AssinaturaOnboarding>();

  if (!assinatura) notFound();

  const { data: documentos } = await supabase
    .from("documentos_onboarding")
    .select("tipo, nome_arquivo")
    .eq("assinatura_id", assinatura.id);

  const enviadosPorTipo = new Map<string, string[]>();
  for (const doc of documentos ?? []) {
    const lista = enviadosPorTipo.get(doc.tipo) ?? [];
    lista.push(doc.nome_arquivo);
    enviadosPorTipo.set(doc.tipo, lista);
  }

  const plano = planoPorId(assinatura.plano_id);
  const segmento = SEGMENTOS[assinatura.segmento_id];
  const checklist = montarChecklist(assinatura.segmento_id, {
    jaTemEmpresa: assinatura.ja_tem_empresa,
    migracao: assinatura.ja_tem_empresa,
  });

  const obrigatorios = checklist.filter((item) => item.obrigatorio);
  const obrigatoriosEnviados = obrigatorios.filter((item) =>
    enviadosPorTipo.has(item.id),
  ).length;
  const progresso = obrigatorios.length
    ? Math.round((obrigatoriosEnviados / obrigatorios.length) * 100)
    : 100;

  return (
    <Container className="py-12 sm:py-16">
      <div className="max-w-3xl">
        <Selo>{segmento.nome}</Selo>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Bem-vindo, {assinatura.responsavel_nome.split(" ")[0]}!
        </h1>
        <p className="mt-3 text-lg text-texto-suave">
          Falta pouco para começarmos. Envie os documentos abaixo e a sua contabilidade
          entra em operação no próximo fechamento.
        </p>

        {assinatura.status === "aguardando-pagamento" && (
          <p className="mt-5 rounded-xl border border-destaque-400 bg-destaque-400/10 p-4 text-sm">
            <strong>Pagamento ainda não confirmado.</strong> Você já pode enviar os
            documentos — assim que a cobrança for compensada, liberamos o início da
            operação automaticamente.
          </p>
        )}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div>
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Documentos obrigatórios</span>
              <span>
                {obrigatoriosEnviados} de {obrigatorios.length}
              </span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-fundo-suave"
              role="progressbar"
              aria-valuenow={progresso}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso do envio de documentos"
            >
              <div
                className="h-full rounded-full bg-marca-600 transition-all dark:bg-marca-500"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>

          <ul className="space-y-4">
            {checklist.map((item) => (
              <ItemUpload
                key={item.id}
                token={token}
                item={item}
                arquivosExistentes={enviadosPorTipo.get(item.id) ?? []}
              />
            ))}
          </ul>
        </div>

        <aside className="lg:sticky lg:top-24">
          <Cartao>
            <h2 className="font-bold">Seu plano</h2>
            <p className="mt-1 text-sm text-texto-suave">{plano?.nome ?? assinatura.plano_id}</p>

            <h3 className="mt-5 text-sm font-semibold">O que fazemos a seguir</h3>
            <ol className="mt-2 space-y-2 text-sm text-texto-suave">
              <li>1. Conferimos os documentos em até 1 dia útil.</li>
              <li>2. Solicitamos os arquivos ao seu contador anterior, se houver.</li>
              <li>3. Apresentamos o contador responsável pela sua conta no WhatsApp.</li>
              <li>4. Assumimos as obrigações do mês corrente.</li>
            </ol>

            <BotaoLink
              href={linkWhatsApp(
                `Olá! Estou no onboarding da ${SITE.nome} e tenho uma dúvida sobre os documentos.`,
              )}
              variante="secundario"
              className="mt-6 w-full"
            >
              Tirar dúvida no WhatsApp
            </BotaoLink>

            <p className="mt-4 text-xs text-texto-suave">
              Seus arquivos ficam em armazenamento privado, acessível apenas pela equipe
              responsável pela sua conta.
            </p>
          </Cartao>
        </aside>
      </div>
    </Container>
  );
}
