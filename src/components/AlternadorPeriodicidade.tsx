"use client";

import type { Periodicidade } from "@/lib/catalogo/tipos";
import { DESCONTO_PLANO_ANUAL } from "@/lib/catalogo/limites-fiscais";
import { cn } from "@/components/ui/primitivos";

const OPCOES: { valor: Periodicidade; rotulo: string }[] = [
  { valor: "mensal", rotulo: "Mensal" },
  { valor: "anual", rotulo: "Anual" },
];

export function AlternadorPeriodicidade({
  valor,
  aoMudar,
}: {
  valor: Periodicidade;
  aoMudar: (novo: Periodicidade) => void;
}) {
  const descontoRotulo = `-${Math.round(DESCONTO_PLANO_ANUAL * 100)}%`;

  return (
    <div
      role="radiogroup"
      aria-label="Periodicidade do contrato"
      className="inline-flex items-center rounded-full border border-borda bg-superficie p-1"
    >
      {OPCOES.map((opcao) => {
        const ativo = valor === opcao.valor;
        return (
          <button
            key={opcao.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => aoMudar(opcao.valor)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              ativo
                ? "bg-marca-600 text-white dark:bg-marca-500 dark:text-marca-950"
                : "text-texto-suave hover:text-texto",
            )}
          >
            {opcao.rotulo}
            {opcao.valor === "anual" && (
              <span
                className={cn(
                  "ml-2 rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                  ativo ? "bg-white/20" : "bg-destaque-400/20 text-destaque-600",
                )}
              >
                {descontoRotulo}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
