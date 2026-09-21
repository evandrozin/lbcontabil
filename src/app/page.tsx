import Link from "next/link";
import { LISTA_SEGMENTOS } from "@/lib/catalogo/segmentos";
import { precoInicialDoSegmento } from "@/lib/catalogo/planos";
import { moedaCurta } from "@/lib/format";
import { SITE, linkWhatsApp } from "@/lib/config";
import {
  BotaoLink,
  Cartao,
  Check,
  Container,
  Secao,
  Selo,
  TituloSecao,
} from "@/components/ui/primitivos";

const PASSOS = [
  {
    titulo: "Escolha seu plano",
    texto:
      "Use o simulador ou a tabela de preços. O valor aparece na tela, sem reunião de vendas e sem orçamento por e-mail.",
  },
  {
    titulo: "Assine e pague online",
    texto:
      "Cartão recorrente ou PIX com renovação automática. Contrato digital assinado na hora.",
  },
  {
    titulo: "Envie seus documentos",
    texto:
      "Formulário guiado de onboarding. Se você já tem contador, nós pedimos os arquivos para ele — você não precisa intermediar.",
  },
  {
    titulo: "Operação rodando",
    texto:
      "Guias e obrigações no prazo, com um contador responsável no WhatsApp para as dúvidas do dia a dia.",
  },
];

const DIFERENCIAIS = [
  {
    titulo: "Preço na tela, sem enrolação",
    texto:
      "Tabela pública por regime e porte. Você sabe quanto custa antes de falar com qualquer pessoa.",
  },
  {
    titulo: "Atendimento humano por WhatsApp",
    texto:
      "Contador responsável nomeado nos planos Profissional e Premium. Não é fila de chatbot.",
  },
  {
    titulo: "Especialistas em agronegócio",
    texto:
      "LCDPR, FUNRURAL, ITR e eSocial rural — poucas contabilidades online atendem produtor rural de verdade.",
  },
  {
    titulo: "Migração de contador sem custo",
    texto:
      "Nós solicitamos os arquivos, conferimos pendências e assumimos as obrigações do mês corrente.",
  },
  {
    titulo: "Abertura grátis no plano anual",
    texto:
      "Assinando o contrato anual você não paga honorários de abertura — apenas as taxas dos órgãos públicos.",
  },
  {
    titulo: "Atendimento em todo o Brasil",
    texto:
      "Operamos com certificado digital A1 e captura automática de notas, de qualquer município.",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-borda bg-gradient-to-b from-marca-50 to-fundo dark:from-marca-950/60 dark:to-fundo">
        <Container className="py-16 sm:py-24">
          <div className="max-w-3xl">
            <Selo>Contabilidade online · Brasil inteiro</Selo>
            <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Contabilidade com preço na tela e contador de verdade no WhatsApp
            </h1>
            <p className="mt-6 text-pretty text-lg text-texto-suave sm:text-xl">
              MEI, Simples Nacional, Lucro Presumido, comércio e produtor rural. Simule
              seu plano em 1 minuto, assine online e deixe as obrigações com a gente.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <BotaoLink href="/simulador" tamanho="lg">
                Simular meu plano
              </BotaoLink>
              <BotaoLink href="/planos" variante="secundario" tamanho="lg">
                Ver tabela de preços
              </BotaoLink>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-texto-suave">
              {[
                "Sem taxa de adesão",
                "Migração de contador grátis",
                "Cancele quando quiser no plano mensal",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="size-4" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* Seletor de segmento — a porta de entrada do funil */}
      <Secao id="segmentos">
        <TituloSecao
          sobretitulo="Comece por aqui"
          titulo="Qual é o seu tipo de empresa?"
          descricao="Cada regime tem rotina, obrigação e preço diferentes. Escolha o seu para ver exatamente o que entra no plano."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LISTA_SEGMENTOS.map((segmento) => (
            <Link
              key={segmento.id}
              href={`/segmentos/${segmento.slug}`}
              className="group rounded-2xl border border-borda bg-superficie p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-marca-400 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-marca-600 dark:text-marca-300">
                {segmento.rotuloSeletor}
              </p>
              <h3 className="mt-2 text-lg font-bold">{segmento.nome}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-texto-suave">
                {segmento.subheadline}
              </p>
              <p className="mt-4 text-sm font-semibold">
                a partir de {moedaCurta(precoInicialDoSegmento(segmento.id))}
                <span className="font-normal text-texto-suave">/mês</span>
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-marca-700 group-hover:gap-2 dark:text-marca-300">
                Ver o que inclui
                <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}

          <Link
            href="/simulador"
            className="group flex flex-col justify-center rounded-2xl border border-dashed border-marca-400 bg-marca-50/50 p-6 transition-colors hover:bg-marca-50 dark:bg-marca-950/30 dark:hover:bg-marca-950/60"
          >
            <h3 className="text-lg font-bold">Não sei meu enquadramento</h3>
            <p className="mt-2 text-sm text-texto-suave">
              Responde 6 perguntas e o simulador diz o regime, o plano e quanto custa.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-marca-700 group-hover:gap-2 dark:text-marca-300">
              Abrir simulador
              <span aria-hidden="true">→</span>
            </span>
          </Link>
        </div>
      </Secao>

      {/* Como funciona */}
      <Secao className="bg-fundo-suave">
        <TituloSecao
          sobretitulo="Como funciona"
          titulo="Quatro passos até estar 100% regularizado"
          centralizado
        />
        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PASSOS.map((passo, indice) => (
            <li key={passo.titulo} className="relative">
              <span className="grid size-10 place-items-center rounded-full bg-marca-600 text-sm font-bold text-white dark:bg-marca-500 dark:text-marca-950">
                {indice + 1}
              </span>
              <h3 className="mt-4 font-bold">{passo.titulo}</h3>
              <p className="mt-2 text-sm text-texto-suave">{passo.texto}</p>
            </li>
          ))}
        </ol>
      </Secao>

      {/* Diferenciais */}
      <Secao>
        <TituloSecao
          sobretitulo="Por que a LB"
          titulo="O que muda quando a contabilidade é feita direito"
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DIFERENCIAIS.map((item) => (
            <Cartao key={item.titulo}>
              <div className="flex items-start gap-3">
                <Check />
                <div>
                  <h3 className="font-bold">{item.titulo}</h3>
                  <p className="mt-1.5 text-sm text-texto-suave">{item.texto}</p>
                </div>
              </div>
            </Cartao>
          ))}
        </div>
      </Secao>

      {/* CTA final */}
      <Secao className="bg-marca-900 text-white dark:bg-marca-950">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold sm:text-4xl">
            Quer saber quanto vai custar no seu caso?
          </h2>
          <p className="mt-4 text-lg text-marca-100">
            O simulador leva um minuto e já mostra o plano, os excedentes e os alertas
            fiscais do seu enquadramento.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <BotaoLink
              href="/simulador"
              tamanho="lg"
              className="bg-white text-marca-900 hover:bg-marca-50 dark:bg-white dark:text-marca-900"
            >
              Simular agora
            </BotaoLink>
            <BotaoLink
              href={linkWhatsApp(
                `Olá! Vim pelo site da ${SITE.nome} e quero falar com um contador.`,
              )}
              tamanho="lg"
              variante="secundario"
              className="border-white/30 bg-transparent text-white hover:border-white hover:text-white"
            >
              Falar com um contador
            </BotaoLink>
          </div>
        </div>
      </Secao>
    </>
  );
}
