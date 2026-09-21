import type { Metadata } from "next";
import { SITE, linkWhatsApp } from "@/lib/config";
import { BotaoLink, Cartao, Container } from "@/components/ui/primitivos";

export const metadata: Metadata = {
  title: "Contratação recebida",
  robots: { index: false, follow: false },
};

const PASSOS = [
  {
    titulo: "Confirme o pagamento",
    texto:
      "Você recebeu por e-mail o link da primeira cobrança. Enquanto ela não compensa, a assinatura fica como aguardando pagamento.",
  },
  {
    titulo: "Envie seus documentos",
    texto:
      "O link do onboarding chega no mesmo e-mail. Lá está a lista exata do que precisamos, já filtrada pelo seu segmento.",
  },
  {
    titulo: "Conheça seu contador",
    texto:
      "Em até 1 dia útil apresentamos o responsável pela sua conta no WhatsApp, com os próximos prazos.",
  },
];

export default async function ConfirmacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ assinatura?: string; simulado?: string }>;
}) {
  const { assinatura, simulado } = await searchParams;

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-2xl text-center">
        <div
          aria-hidden="true"
          className="mx-auto grid size-14 place-items-center rounded-full bg-marca-600 text-2xl text-white dark:bg-marca-500 dark:text-marca-950"
        >
          ✓
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          Contratação recebida
        </h1>
        <p className="mt-3 text-lg text-texto-suave">
          Já registramos sua assinatura. Agora são três passos até a operação começar.
        </p>
        {assinatura && (
          <p className="mt-2 text-sm text-texto-suave">
            Protocolo: <code className="font-mono">{assinatura}</code>
          </p>
        )}
      </div>

      {simulado === "1" && (
        <p className="mx-auto mt-8 max-w-2xl rounded-xl border border-destaque-400 bg-destaque-400/10 p-4 text-sm">
          <strong>Ambiente de desenvolvimento.</strong> Nenhuma cobrança real foi
          gerada — o gateway de pagamento está em modo simulado.
        </p>
      )}

      <ol className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
        {PASSOS.map((passo, indice) => (
          <li key={passo.titulo}>
            <Cartao className="h-full">
              <span className="grid size-8 place-items-center rounded-full bg-marca-100 text-sm font-bold text-marca-800 dark:bg-marca-900 dark:text-marca-100">
                {indice + 1}
              </span>
              <h2 className="mt-3 font-bold">{passo.titulo}</h2>
              <p className="mt-1.5 text-sm text-texto-suave">{passo.texto}</p>
            </Cartao>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <BotaoLink
          href={linkWhatsApp(
            `Olá! Acabei de contratar um plano na ${SITE.nome}${
              assinatura ? ` (protocolo ${assinatura})` : ""
            } e quero confirmar os próximos passos.`,
          )}
          tamanho="lg"
        >
          Falar com a equipe no WhatsApp
        </BotaoLink>
        <BotaoLink href="/" variante="secundario" tamanho="lg">
          Voltar ao início
        </BotaoLink>
      </div>
    </Container>
  );
}
