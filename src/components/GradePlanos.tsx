"use client";

import { useState } from "react";
import type { Periodicidade, Plano } from "@/lib/catalogo/tipos";
import { CardPlano } from "@/components/CardPlano";
import { AlternadorPeriodicidade } from "@/components/AlternadorPeriodicidade";

export function GradePlanos({
  planos,
  periodicidadeInicial = "mensal",
}: {
  planos: Plano[];
  periodicidadeInicial?: Periodicidade;
}) {
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>(periodicidadeInicial);

  return (
    <div>
      <div className="flex justify-center">
        <AlternadorPeriodicidade valor={periodicidade} aoMudar={setPeriodicidade} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {planos.map((plano) => (
          <CardPlano key={plano.id} plano={plano} periodicidade={periodicidade} />
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-texto-suave">
        No contrato anual a abertura da empresa sai sem honorários e o compromisso é de
        12 meses, com cobrança mensal.
      </p>
    </div>
  );
}
