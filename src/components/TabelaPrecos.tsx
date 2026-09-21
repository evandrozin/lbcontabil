"use client";

import { useState } from "react";
import Link from "next/link";
import type { Periodicidade, Segmento, SegmentoId } from "@/lib/catalogo/tipos";
import { planosDoSegmento } from "@/lib/catalogo/planos";
import { addonsDoSegmento } from "@/lib/catalogo/addons";
import { moeda } from "@/lib/format";
import { CardPlano } from "@/components/CardPlano";
import { AlternadorPeriodicidade } from "@/components/AlternadorPeriodicidade";
import { cn } from "@/components/ui/primitivos";

function rotuloCobranca(cobranca: "unica" | "mensal" | "hora"): string {
  return { unica: "cobrança única", mensal: "por mês", hora: "por hora" }[cobranca];
}

export function TabelaPrecos({
  segmentos,
  segmentoInicial,
}: {
  segmentos: Segmento[];
  segmentoInicial?: SegmentoId;
}) {
  const [segmentoAtivo, setSegmentoAtivo] = useState<SegmentoId>(
    segmentoInicial ?? segmentos[0].id,
  );
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>("mensal");

  const planos = planosDoSegmento(segmentoAtivo);
  const addons = addonsDoSegmento(segmentoAtivo);
  const segmento = segmentos.find((s) => s.id === segmentoAtivo)!;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Segmento"
        className="flex flex-wrap justify-center gap-2"
      >
        {segmentos.map((s) => {
          const ativo = s.id === segmentoAtivo;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => setSegmentoAtivo(s.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                ativo
                  ? "border-marca-600 bg-marca-600 text-white dark:border-marca-500 dark:bg-marca-500 dark:text-marca-950"
                  : "border-borda bg-superficie text-texto-suave hover:border-marca-400 hover:text-texto",
              )}
            >
              {s.rotuloSeletor}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <AlternadorPeriodicidade valor={periodicidade} aoMudar={setPeriodicidade} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {planos.map((plano) => (
          <CardPlano key={plano.id} plano={plano} periodicidade={periodicidade} />
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-texto-suave">
        Precisa de ajuda para escolher?{" "}
        <Link href="/simulador" className="font-semibold text-marca-700 underline dark:text-marca-300">
          Use o simulador
        </Link>{" "}
        ou veja{" "}
        <Link
          href={`/segmentos/${segmento.slug}`}
          className="font-semibold text-marca-700 underline dark:text-marca-300"
        >
          tudo que fazemos para {segmento.rotuloSeletor.toLowerCase()}
        </Link>
        .
      </p>

      {/* Avulsos — transparência do que NÃO está na mensalidade */}
      <div className="mt-14">
        <h3 className="text-xl font-bold">Serviços avulsos</h3>
        <p className="mt-2 text-sm text-texto-suave">
          Nem tudo entra na mensalidade. Estes são os valores de referência — o preço
          final depende da complexidade e é confirmado antes da execução.
        </p>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-borda">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-fundo-suave text-xs uppercase tracking-wide text-texto-suave">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Serviço
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {addons.map((addon) => {
                const gratis = addon.precoAteCentavos === 0;
                const faixa =
                  addon.precoDeCentavos === addon.precoAteCentavos
                    ? moeda(addon.precoDeCentavos)
                    : `${moeda(addon.precoDeCentavos)} a ${moeda(addon.precoAteCentavos)}`;

                return (
                  <tr key={addon.id}>
                    <td className="px-4 py-4 align-top">
                      <p className="font-semibold">{addon.nome}</p>
                      <p className="mt-1 text-texto-suave">{addon.descricao}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 align-top font-semibold">
                      {gratis ? (
                        <span className="text-marca-700 dark:text-marca-300">Sem custo</span>
                      ) : (
                        <>
                          {faixa}
                          <span className="block text-xs font-normal text-texto-suave">
                            {rotuloCobranca(addon.cobranca)}
                            {addon.gratuitoNoAnual && " · grátis no plano anual"}
                          </span>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
