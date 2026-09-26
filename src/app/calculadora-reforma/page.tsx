import type { Metadata } from "next";
import { CalculadoraRegime } from "@/components/tributario/CalculadoraRegime";
import { PARAMETROS_REVISADOS_EM } from "@/lib/tributario/parametros";
import { dataIsoParaBr } from "@/lib/format";
import { Secao, TituloSecao } from "@/components/ui/primitivos";

/**
 * Regenera de hora em hora: a página exibe a contagem regressiva da janela
 * de opção pelo Simples híbrido, que muda de dia. Estática demais mostraria
 * "faltam 4 dias" durante uma semana.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Calculadora da reforma tributária — CBS, IBS e comparação de regimes",
  description:
    "Simule o impacto da CBS e do IBS no seu faturamento, compare Simples Nacional, Lucro Presumido e MEI, e descubra se vale optar pelo Simples híbrido. Gratuito.",
  alternates: { canonical: "/calculadora-reforma" },
};

export default function CalculadoraReformaPage() {
  const hojeIso = new Date().toISOString().slice(0, 10);

  return (
    <Secao>
      <TituloSecao
        sobretitulo="Calculadora gratuita"
        titulo="Quanto a reforma tributária vai custar para a sua empresa"
        descricao="Compare Simples Nacional, Lucro Presumido e MEI na mesma régua, veja sua carga de CBS/IBS ano a ano até 2033 e descubra se o Simples híbrido faz sentido no seu caso."
      />

      <div className="mt-10">
        <CalculadoraRegime hojeIso={hojeIso} />
      </div>

      <p className="mt-12 rounded-xl border border-borda bg-fundo-suave p-5 text-xs text-texto-suave">
        <strong className="text-texto">Sobre os números.</strong> As alíquotas de CBS e
        IBS são estimativas da transição prevista na reforma do consumo — a alíquota de
        referência é fixada por resolução do Senado e ainda pode mudar. A fonte oficial de
        cálculo é a calculadora do Portal RTC da Receita Federal. Esta simulação serve
        para ordem de grandeza e não substitui a análise do contador responsável.
        Parâmetros revisados em {dataIsoParaBr(PARAMETROS_REVISADOS_EM)}.
      </p>
    </Secao>
  );
}
