import type { Metadata } from "next";
import { Simulador } from "@/components/simulador/Simulador";
import { Secao, TituloSecao } from "@/components/ui/primitivos";

export const metadata: Metadata = {
  title: "Simulador de plano contábil",
  description:
    "Descubra em 1 minuto o regime, o plano e o preço da sua contabilidade. Simulador gratuito para MEI, Simples Nacional, Lucro Presumido, comércio e produtor rural.",
  alternates: { canonical: "/simulador" },
};

export default function SimuladorPage() {
  return (
    <Secao>
      <TituloSecao
        sobretitulo="Simulador"
        titulo="Quanto custa a sua contabilidade?"
        descricao="Responda com os números reais da sua operação. O resultado aparece na hora, com os excedentes e os alertas fiscais do seu enquadramento."
      />
      <div className="mt-10">
        <Simulador />
      </div>
    </Secao>
  );
}
