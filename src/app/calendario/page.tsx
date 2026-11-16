import type { Metadata } from "next";
import { Agenda } from "@/components/obrigacoes/Agenda";
import { Secao, TituloSecao } from "@/components/ui/primitivos";

/**
 * Regenera uma vez por dia: a página conta dias até o próximo vencimento,
 * e esse número precisa estar certo todo dia de manhã.
 */
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Calendário de obrigações fiscais",
  description:
    "Veja todas as obrigações do seu regime nos próximos 90 dias, com as datas já ajustadas para fim de semana e feriado. MEI, Simples Nacional, Lucro Presumido e produtor rural.",
  alternates: { canonical: "/calendario" },
};

export default function CalendarioPage() {
  const hojeIso = new Date().toISOString().slice(0, 10);

  return (
    <Secao>
      <TituloSecao
        sobretitulo="Calendário"
        titulo="Todas as suas obrigações, com a data certa"
        descricao="Escolha o seu regime e veja o que vence nos próximos 90 dias. As datas já vêm ajustadas: o DAS prorroga quando cai em feriado, a contribuição previdenciária antecipa — e quase ninguém sabe dessa diferença."
      />
      <div className="mt-10">
        <Agenda hojeIso={hojeIso} />
      </div>
    </Secao>
  );
}
