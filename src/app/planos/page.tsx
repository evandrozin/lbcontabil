import type { Metadata } from "next";
import { LISTA_SEGMENTOS } from "@/lib/catalogo/segmentos";
import { COBRA_DECIMA_TERCEIRA } from "@/lib/catalogo/limites-fiscais";
import { TabelaPrecos } from "@/components/TabelaPrecos";
import { Secao, TituloSecao } from "@/components/ui/primitivos";

export const metadata: Metadata = {
  title: "Planos e preços de contabilidade online",
  description:
    "Tabela pública de honorários por regime tributário: MEI a partir de R$ 89/mês, Simples Nacional, Lucro Presumido, comércio e produtor rural. Sem taxa de adesão.",
};

const REGRAS = [
  "Os limites de faturamento e de notas de cada plano são contratuais. Ao ultrapassá-los, o excedente é cobrado por bloco ou o plano é ajustado — sempre com aviso prévio.",
  "A cobrança é recorrente por cartão de crédito ou PIX com renovação automática. Não há taxa de adesão nem fidelidade no plano mensal.",
  "O contrato anual tem compromisso de 12 meses com cobrança mensal descontada, e dá direito à abertura de empresa sem honorários.",
  COBRA_DECIMA_TERCEIRA
    ? "Há cobrança de 13ª mensalidade ao final do exercício, referente ao encerramento contábil e ao balanço anual. Isso consta em contrato e é exibido no checkout."
    : "",
  "Os valores são honorários contábeis. Taxas de Junta Comercial, prefeitura, certificado digital e os tributos da sua empresa não estão incluídos.",
].filter(Boolean);

export default function PlanosPage() {
  return (
    <>
      <Secao>
        <TituloSecao
          sobretitulo="Preço transparente"
          titulo="Planos e preços"
          descricao="Escolha o seu tipo de empresa e veja exatamente o que entra em cada nível. Sem orçamento fechado por e-mail, sem reunião obrigatória de vendas."
          centralizado
        />
        <div className="mt-12">
          <TabelaPrecos segmentos={LISTA_SEGMENTOS} />
        </div>
      </Secao>

      <Secao className="bg-fundo-suave">
        <TituloSecao titulo="Regras que valem para todos os planos" />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {REGRAS.map((regra) => (
            <li
              key={regra}
              className="rounded-xl border border-borda bg-superficie p-5 text-sm text-texto-suave"
            >
              {regra}
            </li>
          ))}
        </ul>
      </Secao>
    </>
  );
}
