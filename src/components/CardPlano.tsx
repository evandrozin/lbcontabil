import type { Periodicidade, Plano } from "@/lib/catalogo/tipos";
import { moeda, moedaCurta } from "@/lib/format";
import { BotaoLink, Cartao, Check, Menos, Selo } from "@/components/ui/primitivos";

function descreverLimite(plano: Plano): string[] {
  const { limites } = plano;
  const linhas: string[] = [];

  linhas.push(
    limites.faturamentoMensalCentavos === null
      ? "Faturamento sem limite de plano"
      : `Até ${moedaCurta(limites.faturamentoMensalCentavos)} de faturamento/mês`,
  );
  linhas.push(
    limites.notasFiscaisPorMes === null
      ? "Notas fiscais ilimitadas"
      : `Até ${limites.notasFiscaisPorMes} notas/mês`,
  );
  linhas.push(
    limites.funcionariosInclusos === 0
      ? "Sem funcionários na folha"
      : `Até ${limites.funcionariosInclusos} funcionário(s) na folha`,
  );
  linhas.push(`${limites.sociosInclusos} pró-labore(s) incluso(s)`);

  return linhas;
}

export function CardPlano({
  plano,
  periodicidade,
}: {
  plano: Plano;
  periodicidade: Periodicidade;
}) {
  const preco =
    periodicidade === "anual"
      ? plano.precoAnualMensalizadoCentavos
      : plano.precoMensalCentavos;

  return (
    <Cartao destaque={plano.destaque} className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{plano.nome}</h3>
          <p className="mt-1 text-sm text-texto-suave">{plano.chamada}</p>
        </div>
        {plano.destaque && <Selo tom="destaque">Mais contratado</Selo>}
      </div>

      <div className="mt-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold tracking-tight">{moedaCurta(preco)}</span>
          <span className="text-sm text-texto-suave">/mês</span>
        </div>
        {periodicidade === "anual" ? (
          <p className="mt-1 text-sm text-marca-700 dark:text-marca-300">
            No contrato anual — de {moedaCurta(plano.precoMensalCentavos)} por mês
          </p>
        ) : (
          <p className="mt-1 text-sm text-texto-suave">
            {moedaCurta(plano.precoAnualMensalizadoCentavos)}/mês no contrato anual
          </p>
        )}
      </div>

      <ul className="mt-6 space-y-2 border-y border-borda py-4 text-sm text-texto-suave">
        {descreverLimite(plano).map((linha) => (
          <li key={linha}>{linha}</li>
        ))}
      </ul>

      <ul className="mt-5 space-y-2.5 text-sm">
        {plano.incluso.map((item) => (
          <li key={item} className="flex gap-2.5">
            <Check />
            <span>{item}</span>
          </li>
        ))}
        {plano.naoIncluso.map((item) => (
          <li key={item} className="flex gap-2.5 text-texto-suave">
            <Menos />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <BotaoLink
          href={`/checkout/${plano.id}?periodicidade=${periodicidade}`}
          variante={plano.destaque ? "primario" : "secundario"}
          tamanho="lg"
          className="w-full"
        >
          Contratar {plano.nome}
        </BotaoLink>
        <p className="mt-3 text-center text-xs text-texto-suave">
          Excedentes: {moeda(plano.excedentes.precoBlocoNotasCentavos)} por bloco de{" "}
          {plano.excedentes.tamanhoBlocoNotas} notas ·{" "}
          {moeda(plano.excedentes.precoFuncionarioExtraCentavos)} por funcionário extra
        </p>
      </div>
    </Cartao>
  );
}
