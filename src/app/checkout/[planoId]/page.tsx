import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PLANOS, planoPorId } from "@/lib/catalogo/planos";
import { SEGMENTOS } from "@/lib/catalogo/segmentos";
import { COBRA_DECIMA_TERCEIRA } from "@/lib/catalogo/limites-fiscais";
import type { Periodicidade } from "@/lib/catalogo/tipos";
import { moeda } from "@/lib/format";
import { FormularioCheckout } from "@/components/checkout/FormularioCheckout";
import { Cartao, Check, Container, Selo } from "@/components/ui/primitivos";

export function generateStaticParams() {
  return PLANOS.map((plano) => ({ planoId: plano.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ planoId: string }>;
}): Promise<Metadata> {
  const { planoId } = await params;
  const plano = planoPorId(planoId);
  if (!plano) return {};

  return {
    title: `Contratar ${plano.nome}`,
    description: plano.chamada,
    // Página de conversão não deve competir com as LPs na busca orgânica.
    robots: { index: false, follow: true },
  };
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ planoId: string }>;
  searchParams: Promise<{ periodicidade?: string }>;
}) {
  const { planoId } = await params;
  const { periodicidade: periodicidadeBruta } = await searchParams;

  const plano = planoPorId(planoId);
  if (!plano) notFound();

  const periodicidade: Periodicidade =
    periodicidadeBruta === "anual" ? "anual" : "mensal";
  const segmento = SEGMENTOS[plano.segmentoId];

  const valorMensal =
    periodicidade === "anual"
      ? plano.precoAnualMensalizadoCentavos
      : plano.precoMensalCentavos;
  const parcelasNoAno = COBRA_DECIMA_TERCEIRA ? 13 : 12;
  const totalPrimeiroAno = valorMensal * parcelasNoAno;
  const economia =
    (plano.precoMensalCentavos - plano.precoAnualMensalizadoCentavos) * parcelasNoAno;

  return (
    <Container className="py-12 sm:py-16">
      <Link
        href={`/segmentos/${segmento.slug}`}
        className="text-sm font-semibold text-marca-700 hover:underline dark:text-marca-300"
      >
        ← Voltar para {segmento.rotuloSeletor.toLowerCase()}
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        Contratar {plano.nome}
      </h1>
      <p className="mt-2 text-texto-suave">
        Preencha os dados abaixo. O pagamento é feito em seguida, em ambiente seguro.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <FormularioCheckout plano={plano} periodicidade={periodicidade} />

        <aside className="lg:sticky lg:top-24">
          <Cartao destaque>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-marca-600 dark:text-marca-300">
                  Resumo
                </p>
                <h2 className="mt-1 text-xl font-bold">{plano.nome}</h2>
              </div>
              <Selo tom={periodicidade === "anual" ? "destaque" : "neutro"}>
                {periodicidade === "anual" ? "Anual" : "Mensal"}
              </Selo>
            </div>

            <dl className="mt-5 space-y-2 border-y border-borda py-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-texto-suave">Mensalidade</dt>
                <dd className="font-semibold">{moeda(valorMensal)}</dd>
              </div>
              {COBRA_DECIMA_TERCEIRA && (
                <div className="flex justify-between gap-4">
                  <dt className="text-texto-suave">13ª mensalidade (dezembro)</dt>
                  <dd className="font-semibold">{moeda(valorMensal)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 pt-2 font-bold">
                <dt>Total do primeiro ano</dt>
                <dd>{moeda(totalPrimeiroAno)}</dd>
              </div>
            </dl>

            {periodicidade === "anual" ? (
              <p className="mt-4 rounded-lg bg-marca-50 p-3 text-sm font-semibold text-marca-800 dark:bg-marca-950/60 dark:text-marca-100">
                Você economiza {moeda(economia)} no primeiro ano e não paga honorários
                de abertura.
              </p>
            ) : (
              <p className="mt-4 text-sm text-texto-suave">
                No contrato anual sairia por {moeda(plano.precoAnualMensalizadoCentavos)}
                /mês —{" "}
                <Link
                  href={`/checkout/${plano.id}?periodicidade=anual`}
                  className="font-semibold text-marca-700 underline dark:text-marca-300"
                >
                  trocar para anual
                </Link>
                .
              </p>
            )}

            <ul className="mt-5 space-y-2 text-sm">
              {plano.incluso.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Check className="size-4" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-xs text-texto-suave">
              Limites do plano:{" "}
              {plano.limites.notasFiscaisPorMes === null
                ? "notas ilimitadas"
                : `até ${plano.limites.notasFiscaisPorMes} notas/mês`}
              ,{" "}
              {plano.limites.funcionariosInclusos === 0
                ? "sem funcionários"
                : `até ${plano.limites.funcionariosInclusos} funcionário(s)`}
              . Excedentes são cobrados conforme a tabela, sempre com aviso prévio.
            </p>
          </Cartao>
        </aside>
      </div>
    </Container>
  );
}
