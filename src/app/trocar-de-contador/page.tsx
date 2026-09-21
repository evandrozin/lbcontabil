import type { Metadata } from "next";
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
  title: "Trocar de contador sem dor de cabeça",
  description:
    "Migração de contabilidade sem custo: solicitamos os arquivos ao contador anterior, conferimos pendências e assumimos as obrigações do mês corrente.",
  alternates: { canonical: "/trocar-de-contador" },
};

const MITOS = [
  {
    mito: "Preciso esperar o fim do ano para trocar",
    verdade:
      "Não. A troca pode ser feita em qualquer mês. O que existe é um período de transição, em que combinamos quem entrega o quê — e isso nós organizamos com o contador anterior.",
  },
  {
    mito: "Vou perder o histórico da empresa",
    verdade:
      "O histórico é da empresa, não do escritório. Os livros, balancetes e arquivos do SPED são seus por direito, e a entrega deles é obrigação profissional do contador que sai.",
  },
  {
    mito: "Meu contador atual pode se recusar a entregar os documentos",
    verdade:
      "A entrega da documentação é dever previsto no Código de Ética do contabilista. Se houver resistência, orientamos o caminho formal — incluindo notificação e registro no CRC.",
  },
  {
    mito: "Vou ficar sem ninguém responsável durante a troca",
    verdade:
      "Assumimos as obrigações do mês corrente desde o primeiro dia. Nenhum prazo fica descoberto durante a transição.",
  },
];

const ETAPAS = [
  {
    titulo: "Diagnóstico gratuito",
    texto:
      "Olhamos a situação fiscal da empresa nos portais da Receita e do seu município: pendências, parcelamentos, declarações em atraso e malha.",
  },
  {
    titulo: "Carta de transferência",
    texto:
      "Enviamos a solicitação formal ao contador anterior pedindo os arquivos. Você não precisa ter essa conversa.",
  },
  {
    titulo: "Conferência do que veio",
    texto:
      "Checamos se os arquivos batem com o que foi efetivamente entregue aos órgãos e apontamos o que precisa de correção.",
  },
  {
    titulo: "Assunção das obrigações",
    texto:
      "Passamos a responder pela empresa já no mês corrente, com procuração eletrônica no e-CAC e acesso aos portais.",
  },
];

export default function TrocarDeContadorPage() {
  return (
    <>
      <section className="border-b border-borda bg-gradient-to-b from-marca-50 to-fundo dark:from-marca-950/60 dark:to-fundo">
        <Container className="py-16 sm:py-20">
          <div className="max-w-3xl">
            <Selo>Migração sem custo</Selo>
            <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              Trocar de contador é mais simples do que parece
            </h1>
            <p className="mt-6 text-pretty text-lg text-texto-suave">
              Nós conduzimos a transição inteira: pedimos os arquivos ao contador
              anterior, conferimos as pendências e assumimos as obrigações do mês
              corrente. Você não precisa intermediar nenhuma conversa.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <BotaoLink href="/simulador" tamanho="lg">
                Ver quanto vou pagar
              </BotaoLink>
              <BotaoLink
                href={linkWhatsApp(
                  `Olá! Quero trocar de contador e migrar para a ${SITE.nome}.`,
                )}
                variante="secundario"
                tamanho="lg"
              >
                Falar com um contador
              </BotaoLink>
            </div>
          </div>
        </Container>
      </section>

      <Secao>
        <TituloSecao sobretitulo="Como conduzimos" titulo="A migração, passo a passo" />
        <ol className="mt-10 grid gap-5 sm:grid-cols-2">
          {ETAPAS.map((etapa, indice) => (
            <li key={etapa.titulo}>
              <Cartao className="h-full">
                <span className="grid size-9 place-items-center rounded-full bg-marca-600 text-sm font-bold text-white dark:bg-marca-500 dark:text-marca-950">
                  {indice + 1}
                </span>
                <h3 className="mt-4 font-bold">{etapa.titulo}</h3>
                <p className="mt-1.5 text-sm text-texto-suave">{etapa.texto}</p>
              </Cartao>
            </li>
          ))}
        </ol>
      </Secao>

      <Secao className="bg-fundo-suave">
        <TituloSecao
          sobretitulo="O que te seguram"
          titulo="Os quatro medos de quem quer trocar"
        />
        <div className="mt-10 space-y-4">
          {MITOS.map((item) => (
            <Cartao key={item.mito}>
              <p className="font-bold text-texto-suave line-through decoration-2">
                {item.mito}
              </p>
              <div className="mt-2 flex gap-2.5">
                <Check />
                <p className="text-sm">{item.verdade}</p>
              </div>
            </Cartao>
          ))}
        </div>
      </Secao>

      <Secao>
        <div className="rounded-2xl border border-borda bg-superficie p-8 sm:p-12">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Quer um diagnóstico antes de decidir?
            </h2>
            <p className="mt-3 text-texto-suave">
              Mande o CNPJ pelo WhatsApp. Consultamos as pendências públicas da empresa e
              devolvemos um retrato do que está em aberto — sem compromisso de
              contratação.
            </p>
            <BotaoLink
              href={linkWhatsApp(
                `Olá! Quero um diagnóstico fiscal antes de trocar de contador. Meu CNPJ é: `,
              )}
              tamanho="lg"
              className="mt-6"
            >
              Pedir diagnóstico gratuito
            </BotaoLink>
          </div>
        </div>
      </Secao>
    </>
  );
}
