import type { Metadata } from "next";
import { LISTA_SEGMENTOS } from "@/lib/catalogo/segmentos";
import { addonPorId } from "@/lib/catalogo/addons";
import { moeda } from "@/lib/format";
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

export const metadata: Metadata = {
  title: "Abrir empresa grátis — abertura de CNPJ online",
  description:
    "Abertura de empresa sem honorários para quem assina o plano anual de contabilidade. Viabilidade, contrato social, CNPJ, inscrições e alvará em todo o Brasil.",
  alternates: { canonical: "/abrir-empresa" },
};

const ETAPAS = [
  {
    titulo: "Consulta de viabilidade",
    texto:
      "Checamos se o nome escolhido está disponível e se a atividade é permitida no endereço — inclusive para empresa em casa.",
    prazo: "1 a 3 dias úteis",
  },
  {
    titulo: "Definição do enquadramento",
    texto:
      "Escolhemos CNAE, natureza jurídica, capital social e regime tributário com base no seu faturamento projetado.",
    prazo: "no mesmo dia",
  },
  {
    titulo: "Registro na Junta Comercial",
    texto:
      "Montamos o contrato social, colhemos a assinatura digital dos sócios e protocolamos o registro.",
    prazo: "1 a 5 dias úteis",
  },
  {
    titulo: "CNPJ, inscrições e alvará",
    texto:
      "Saem o CNPJ, a inscrição municipal e — para comércio e indústria — a inscrição estadual, além do alvará de funcionamento.",
    prazo: "2 a 10 dias úteis",
  },
  {
    titulo: "Certificado digital e primeira nota",
    texto:
      "Emitimos o e-CNPJ A1, habilitamos a emissão de nota fiscal e ensinamos você a emitir a primeira.",
    prazo: "1 dia útil",
  },
];

const INCLUSO = [
  "Consulta de viabilidade de nome e endereço",
  "Elaboração do contrato social ou requerimento de empresário",
  "Registro na Junta Comercial do seu estado",
  "Emissão do CNPJ na Receita Federal",
  "Inscrição municipal e estadual quando aplicável",
  "Enquadramento tributário com estudo de regime",
  "Orientação para emissão da primeira nota fiscal",
];

const NAO_INCLUSO = [
  "Taxas da Junta Comercial (variam por estado, tipicamente R$ 100 a R$ 400)",
  "Taxa de alvará e de licenças da prefeitura",
  "Certificado digital e-CNPJ A1",
  "Licenças específicas (vigilância sanitária, bombeiros, ambiental)",
];

export default function AbrirEmpresaPage() {
  const abertura = addonPorId("abertura-empresa")!;

  return (
    <>
      <section className="border-b border-borda bg-gradient-to-b from-marca-50 to-fundo dark:from-marca-950/60 dark:to-fundo">
        <Container className="py-16 sm:py-20">
          <div className="max-w-3xl">
            <Selo tom="destaque">Abertura grátis no plano anual</Selo>
            <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              Abrir empresa sem pagar honorários de abertura
            </h1>
            <p className="mt-6 text-pretty text-lg text-texto-suave">
              Assinando o plano anual de contabilidade, a abertura do seu CNPJ sai sem
              custo de honorários. Você paga apenas as taxas dos órgãos públicos — e nós
              cuidamos de todo o resto, em qualquer município do Brasil.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <BotaoLink href="/simulador" tamanho="lg">
                Ver quanto custa o plano
              </BotaoLink>
              <BotaoLink
                href={linkWhatsApp(
                  `Olá! Quero abrir uma empresa com a ${SITE.nome} e ter a abertura grátis no plano anual.`,
                )}
                variante="secundario"
                tamanho="lg"
              >
                Tirar dúvida no WhatsApp
              </BotaoLink>
            </div>
            <p className="mt-6 text-sm text-texto-suave">
              No plano mensal, a abertura custa a partir de{" "}
              <strong className="text-texto">{moeda(abertura.precoDeCentavos)}</strong>.
            </p>
          </div>
        </Container>
      </section>

      <Secao>
        <TituloSecao
          sobretitulo="Passo a passo"
          titulo="Como funciona a abertura"
          descricao="O prazo total costuma ficar entre 5 e 20 dias úteis, dependendo da Junta Comercial do seu estado e da exigência de licenças."
        />
        <ol className="mt-10 space-y-4">
          {ETAPAS.map((etapa, indice) => (
            <li key={etapa.titulo}>
              <Cartao className="flex flex-wrap items-start gap-4 sm:flex-nowrap">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-marca-600 text-sm font-bold text-white dark:bg-marca-500 dark:text-marca-950">
                  {indice + 1}
                </span>
                <div className="flex-1">
                  <h3 className="font-bold">{etapa.titulo}</h3>
                  <p className="mt-1 text-sm text-texto-suave">{etapa.texto}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-texto-suave">
                  {etapa.prazo}
                </span>
              </Cartao>
            </li>
          ))}
        </ol>
      </Secao>

      <Secao className="bg-fundo-suave">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">O que está incluído</h2>
            <ul className="mt-5 space-y-2.5 text-sm">
              {INCLUSO.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Check />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold">O que você paga à parte</h2>
            <p className="mt-2 text-sm text-texto-suave">
              São custos de terceiros, cobrados diretamente pelos órgãos. Informamos os
              valores exatos do seu estado antes de qualquer protocolo.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-texto-suave">
              {NAO_INCLUSO.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-texto-suave/50" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Secao>

      <Secao>
        <TituloSecao
          titulo="Qual tipo de empresa você vai abrir?"
          descricao="O enquadramento muda o imposto, a obrigação e o preço da contabilidade. Escolha para ver os planos do seu caso."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LISTA_SEGMENTOS.map((segmento) => (
            <Cartao key={segmento.id}>
              <h3 className="font-bold">{segmento.nome}</h3>
              <p className="mt-2 text-sm text-texto-suave">{segmento.subheadline}</p>
              <BotaoLink
                href={`/segmentos/${segmento.slug}`}
                variante="secundario"
                className="mt-4 w-full"
              >
                Ver planos
              </BotaoLink>
            </Cartao>
          ))}
        </div>
      </Secao>
    </>
  );
}
