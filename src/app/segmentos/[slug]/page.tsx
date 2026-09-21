import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LISTA_SEGMENTOS, segmentoPorSlug } from "@/lib/catalogo/segmentos";
import { planosDoSegmento, precoInicialDoSegmento } from "@/lib/catalogo/planos";
import { moedaCurta } from "@/lib/format";
import { SITE, linkWhatsApp } from "@/lib/config";
import { GradePlanos } from "@/components/GradePlanos";
import {
  BotaoLink,
  Cartao,
  Check,
  Container,
  Secao,
  Selo,
  TituloSecao,
} from "@/components/ui/primitivos";

export function generateStaticParams() {
  return LISTA_SEGMENTOS.map((segmento) => ({ slug: segmento.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const segmento = segmentoPorSlug(slug);
  if (!segmento) return {};

  return {
    title: segmento.headline,
    description: segmento.subheadline,
    alternates: { canonical: `/segmentos/${segmento.slug}` },
    openGraph: {
      title: segmento.headline,
      description: segmento.subheadline,
      url: `/segmentos/${segmento.slug}`,
    },
  };
}

export default async function SegmentoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const segmento = segmentoPorSlug(slug);
  if (!segmento) notFound();

  const planos = planosDoSegmento(segmento.id);
  const precoInicial = precoInicialDoSegmento(segmento.id);

  // FAQPage estruturado: é o que rende rich result na busca por dúvida fiscal.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: segmento.faq.map((item) => ({
      "@type": "Question",
      name: item.pergunta,
      acceptedAnswer: { "@type": "Answer", text: item.resposta },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="border-b border-borda bg-gradient-to-b from-marca-50 to-fundo dark:from-marca-950/60 dark:to-fundo">
        <Container className="py-16 sm:py-20">
          <div className="max-w-3xl">
            <Selo>{segmento.nome}</Selo>
            <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              {segmento.headline}
            </h1>
            <p className="mt-6 text-pretty text-lg text-texto-suave">
              {segmento.subheadline}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <BotaoLink href="/simulador" tamanho="lg">
                Simular meu plano
              </BotaoLink>
              <BotaoLink
                href={linkWhatsApp(
                  `Olá! Sou ${segmento.rotuloSeletor.toLowerCase()} e quero falar com um contador da ${SITE.nome}.`,
                )}
                variante="secundario"
                tamanho="lg"
              >
                Falar no WhatsApp
              </BotaoLink>
            </div>
            <p className="mt-6 text-sm text-texto-suave">
              Planos a partir de{" "}
              <strong className="text-texto">{moedaCurta(precoInicial)}/mês</strong>
            </p>
          </div>
        </Container>
      </section>

      {/* Dores — a parte que faz o visitante se reconhecer */}
      <Secao>
        <TituloSecao
          sobretitulo="Isso soa familiar?"
          titulo="Os problemas que resolvemos nesse segmento"
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {segmento.dores.map((dor) => (
            <li
              key={dor}
              className="flex gap-3 rounded-xl border border-borda bg-superficie p-5"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-destaque-400/20 text-sm font-bold text-destaque-600"
              >
                !
              </span>
              <p className="text-sm">{dor}</p>
            </li>
          ))}
        </ul>
      </Secao>

      {/* Obrigações + perfil */}
      <Secao className="bg-fundo-suave">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">O que executamos todo mês</h2>
            <ul className="mt-6 space-y-3">
              {segmento.obrigacoes.map((obrigacao) => (
                <li key={obrigacao} className="flex gap-3 text-sm">
                  <Check />
                  <span>{obrigacao}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Quem já atendemos aqui</h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {segmento.perfilCliente.map((perfil) => (
                <span
                  key={perfil}
                  className="rounded-full border border-borda bg-superficie px-3 py-1.5 text-sm"
                >
                  {perfil}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Secao>

      {/* Planos do segmento */}
      <Secao id="planos">
        <TituloSecao
          sobretitulo="Planos"
          titulo={`Quanto custa para ${segmento.rotuloSeletor.toLowerCase()}`}
          descricao="Preço fechado por nível de serviço. O plano intermediário é o mais contratado."
          centralizado
        />
        <div className="mt-12">
          <GradePlanos planos={planos} />
        </div>
      </Secao>

      {/* FAQ */}
      <Secao className="bg-fundo-suave">
        <TituloSecao titulo="Perguntas frequentes" />
        <div className="mt-8 space-y-4">
          {segmento.faq.map((item) => (
            <Cartao key={item.pergunta}>
              <h3 className="font-bold">{item.pergunta}</h3>
              <p className="mt-2 text-sm text-texto-suave">{item.resposta}</p>
            </Cartao>
          ))}
        </div>
      </Secao>
    </>
  );
}
