"use client";

import { useMemo, useState } from "react";
import type {
  Periodicidade,
  RegimeTributario,
  TipoAtividade,
} from "@/lib/catalogo/tipos";
import { simular, type EntradaSimulacao } from "@/lib/simulador/motor";
import { addonsDoSegmento } from "@/lib/catalogo/addons";
import { moeda, moedaCurta } from "@/lib/format";
import { SITE, linkWhatsApp } from "@/lib/config";
import { AlternadorPeriodicidade } from "@/components/AlternadorPeriodicidade";
import { BotaoLink, Cartao, Check, cn } from "@/components/ui/primitivos";

const ATIVIDADES: { valor: TipoAtividade; rotulo: string; exemplo: string }[] = [
  { valor: "servico", rotulo: "Serviço", exemplo: "T.I., saúde, consultoria, obra" },
  { valor: "comercio", rotulo: "Comércio", exemplo: "Loja, e-commerce, distribuidora" },
  { valor: "industria", rotulo: "Indústria", exemplo: "Fabricação e transformação" },
  { valor: "rural", rotulo: "Rural", exemplo: "Lavoura, pecuária, agroindústria" },
];

const REGIMES: { valor: RegimeTributario; rotulo: string }[] = [
  { valor: "nao-sei", rotulo: "Não sei / vou abrir agora" },
  { valor: "mei", rotulo: "MEI" },
  { valor: "simples-nacional", rotulo: "Simples Nacional" },
  { valor: "lucro-presumido", rotulo: "Lucro Presumido" },
  { valor: "lucro-real", rotulo: "Lucro Real" },
  { valor: "produtor-rural-pf", rotulo: "Produtor rural (pessoa física)" },
];

const ESTILO_ALERTA = {
  bloqueio:
    "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100",
  atencao:
    "border-destaque-400 bg-destaque-400/10 text-texto dark:border-destaque-500/60",
  info: "border-borda bg-fundo-suave text-texto-suave",
} as const;

const ICONE_ALERTA = { bloqueio: "!", atencao: "!", info: "i" } as const;

function CampoNumero({
  id,
  rotulo,
  ajuda,
  valor,
  aoMudar,
  prefixo,
  passo = 1,
  min = 0,
}: {
  id: string;
  rotulo: string;
  ajuda?: string;
  valor: number;
  aoMudar: (n: number) => void;
  prefixo?: string;
  passo?: number;
  min?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {rotulo}
      </label>
      <div className="mt-1.5 flex items-center rounded-lg border border-borda bg-superficie focus-within:border-marca-500">
        {prefixo && (
          <span className="pl-3 text-sm text-texto-suave" aria-hidden="true">
            {prefixo}
          </span>
        )}
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          step={passo}
          value={Number.isFinite(valor) ? valor : 0}
          onChange={(e) => aoMudar(Math.max(min, Number(e.target.value) || 0))}
          className="w-full bg-transparent px-3 py-2.5 text-sm outline-none"
        />
      </div>
      {ajuda && <p className="mt-1 text-xs text-texto-suave">{ajuda}</p>}
    </div>
  );
}

export function Simulador() {
  const [atividade, setAtividade] = useState<TipoAtividade>("servico");
  const [regimeAtual, setRegimeAtual] = useState<RegimeTributario>("nao-sei");
  const [faturamento, setFaturamento] = useState(20_000);
  const [notas, setNotas] = useState(10);
  const [funcionarios, setFuncionarios] = useState(0);
  const [socios, setSocios] = useState(1);
  const [informarFolha, setInformarFolha] = useState(false);
  const [folha, setFolha] = useState(3_000);
  const [jaTemEmpresa, setJaTemEmpresa] = useState(true);
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>("anual");
  const [addonsSelecionados, setAddonsSelecionados] = useState<string[]>([]);

  const entrada: EntradaSimulacao = useMemo(
    () => ({
      atividade,
      regimeAtual,
      faturamentoMensalCentavos: Math.round(faturamento * 100),
      notasPorMes: notas,
      funcionarios,
      socios,
      folhaMensalCentavos: informarFolha ? Math.round(folha * 100) : undefined,
      jaTemEmpresa,
      periodicidade,
      addonsSelecionados,
    }),
    [
      atividade,
      regimeAtual,
      faturamento,
      notas,
      funcionarios,
      socios,
      informarFolha,
      folha,
      jaTemEmpresa,
      periodicidade,
      addonsSelecionados,
    ],
  );

  const resultado = useMemo(() => simular(entrada), [entrada]);
  const addonsDisponiveis = addonsDoSegmento(resultado.segmento.id).filter(
    (a) => a.precoAteCentavos > 0,
  );

  function alternarAddon(id: string) {
    setAddonsSelecionados((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
    );
  }

  /**
   * Registra a simulação no momento em que o visitante decide contratar.
   * Usa sendBeacon para não segurar a navegação — se falhar, o clique segue
   * normalmente: analytics nunca pode custar uma venda.
   */
  function registrarSimulacao() {
    const corpo = JSON.stringify({
      segmentoId: resultado.segmento.id,
      planoRecomendadoId: resultado.planoRecomendado.id,
      periodicidade,
      totalMensalCentavos: resultado.totalMensalCentavos,
      entrada,
      origem: typeof document !== "undefined" ? document.referrer || undefined : undefined,
    });

    try {
      navigator.sendBeacon?.(
        "/api/simulacoes",
        new Blob([corpo], { type: "application/json" }),
      );
    } catch {
      // Silencioso de propósito.
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start">
      {/* ── Formulário ─────────────────────────────────────────────── */}
      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        <fieldset>
          <legend className="text-sm font-semibold">Qual é a sua atividade?</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {ATIVIDADES.map((item) => {
              const ativo = atividade === item.valor;
              return (
                <button
                  key={item.valor}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => setAtividade(item.valor)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    ativo
                      ? "border-marca-600 bg-marca-50 dark:bg-marca-950/50"
                      : "border-borda bg-superficie hover:border-marca-400",
                  )}
                >
                  <span className="block font-semibold">{item.rotulo}</span>
                  <span className="mt-0.5 block text-xs text-texto-suave">
                    {item.exemplo}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="regime" className="block text-sm font-semibold">
            Regime tributário atual
          </label>
          <select
            id="regime"
            value={regimeAtual}
            onChange={(e) => setRegimeAtual(e.target.value as RegimeTributario)}
            className="mt-1.5 w-full rounded-lg border border-borda bg-superficie px-3 py-2.5 text-sm outline-none focus:border-marca-500"
          >
            {REGIMES.map((r) => (
              <option key={r.valor} value={r.valor}>
                {r.rotulo}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <CampoNumero
            id="faturamento"
            rotulo="Faturamento por mês"
            prefixo="R$"
            passo={1000}
            valor={faturamento}
            aoMudar={setFaturamento}
            ajuda={`Equivale a ${moedaCurta(faturamento * 12 * 100)} por ano.`}
          />
          <CampoNumero
            id="notas"
            rotulo="Notas fiscais por mês"
            valor={notas}
            aoMudar={setNotas}
            ajuda="Emitidas + recebidas de fornecedores."
          />
          <CampoNumero
            id="funcionarios"
            rotulo="Funcionários registrados"
            valor={funcionarios}
            aoMudar={setFuncionarios}
          />
          <CampoNumero
            id="socios"
            rotulo="Sócios com pró-labore"
            min={1}
            valor={socios}
            aoMudar={setSocios}
          />
        </div>

        <div className="space-y-3 rounded-xl border border-borda bg-fundo-suave p-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={informarFolha}
              onChange={(e) => setInformarFolha(e.target.checked)}
              className="mt-0.5 size-4 accent-marca-600"
            />
            <span>
              <span className="font-semibold">Quero simular o Fator R</span>
              <span className="mt-0.5 block text-xs text-texto-suave">
                Informe a folha (incluindo pró-labore) para sabermos se você está no
                Anexo III ou no Anexo V.
              </span>
            </span>
          </label>

          {informarFolha && (
            <CampoNumero
              id="folha"
              rotulo="Folha mensal + pró-labore"
              prefixo="R$"
              passo={500}
              valor={folha}
              aoMudar={setFolha}
            />
          )}

          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={!jaTemEmpresa}
              onChange={(e) => setJaTemEmpresa(!e.target.checked)}
              className="size-4 accent-marca-600"
            />
            <span className="font-semibold">Ainda não tenho empresa aberta</span>
          </label>
        </div>

        {addonsDisponiveis.length > 0 && (
          <fieldset>
            <legend className="text-sm font-semibold">
              Serviços adicionais (opcional)
            </legend>
            <div className="mt-3 space-y-2">
              {addonsDisponiveis.map((addon) => (
                <label
                  key={addon.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-borda bg-superficie p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={addonsSelecionados.includes(addon.id)}
                    onChange={() => alternarAddon(addon.id)}
                    className="mt-0.5 size-4 accent-marca-600"
                  />
                  <span className="flex-1">
                    <span className="font-semibold">{addon.nome}</span>
                    <span className="mt-0.5 block text-xs text-texto-suave">
                      a partir de {moeda(addon.precoDeCentavos)}
                      {addon.cobranca === "mensal" && "/mês"}
                      {addon.gratuitoNoAnual && " · grátis no plano anual"}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </form>

      {/* ── Resultado ──────────────────────────────────────────────── */}
      <div className="lg:sticky lg:top-24">
        <Cartao destaque className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-marca-600 dark:text-marca-300">
              Plano recomendado
            </p>
            <h2 className="mt-1 text-2xl font-bold">{resultado.planoRecomendado.nome}</h2>
            <p className="mt-1 text-sm text-texto-suave">{resultado.motivoRecomendacao}</p>
          </div>

          <AlternadorPeriodicidade valor={periodicidade} aoMudar={setPeriodicidade} />

          <div className="border-y border-borda py-4">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight">
                {moeda(resultado.totalMensalCentavos)}
              </span>
              <span className="text-sm text-texto-suave">/mês</span>
            </div>
            {periodicidade === "anual" && resultado.economiaAnualCentavos > 0 && (
              <p className="mt-1 text-sm font-semibold text-marca-700 dark:text-marca-300">
                Você economiza {moeda(resultado.economiaAnualCentavos)} no primeiro ano
              </p>
            )}
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-texto-suave">Mensalidade do plano</dt>
              <dd className="font-semibold">{moeda(resultado.precoBaseCentavos)}</dd>
            </div>

            {resultado.excedentes.map((linha) => (
              <div key={linha.descricao} className="flex justify-between gap-4">
                <dt className="text-texto-suave">{linha.descricao}</dt>
                <dd className="font-semibold">+ {moeda(linha.valorCentavos)}</dd>
              </div>
            ))}

            {resultado.addons.map((linha) => (
              <div key={linha.descricao} className="flex justify-between gap-4">
                <dt className="text-texto-suave">{linha.descricao}</dt>
                <dd className="font-semibold">+ {moeda(linha.valorCentavos)}</dd>
              </div>
            ))}

            {resultado.custosUnicosCentavos > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-texto-suave">Serviços de cobrança única</dt>
                <dd className="font-semibold">{moeda(resultado.custosUnicosCentavos)}</dd>
              </div>
            )}

            <div className="flex justify-between gap-4">
              <dt className="text-texto-suave">
                13ª mensalidade (balanço anual, cobrada em dezembro)
              </dt>
              <dd className="font-semibold">{moeda(resultado.decimaTerceiraCentavos)}</dd>
            </div>

            <div className="flex justify-between gap-4 border-t border-borda pt-2">
              <dt className="font-semibold">Total do primeiro ano</dt>
              <dd className="font-bold">{moeda(resultado.totalPrimeiroAnoCentavos)}</dd>
            </div>
          </dl>

          <div className="space-y-2">
            <BotaoLink
              href={`/checkout/${resultado.planoRecomendado.id}?periodicidade=${periodicidade}`}
              tamanho="lg"
              className="w-full"
              onClick={registrarSimulacao}
            >
              Contratar este plano
            </BotaoLink>
            <BotaoLink
              href={linkWhatsApp(
                `Olá! Simulei no site da ${SITE.nome} e o resultado foi o ${resultado.planoRecomendado.nome} por ${moeda(resultado.totalMensalCentavos)}/mês. Quero tirar uma dúvida antes de assinar.`,
              )}
              variante="secundario"
              className="w-full"
            >
              Tirar dúvida no WhatsApp
            </BotaoLink>
          </div>

          <ul className="space-y-1.5 text-xs text-texto-suave">
            {resultado.planoRecomendado.incluso.slice(0, 4).map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="size-4" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Cartao>

        {resultado.alertas.length > 0 && (
          <div className="mt-6 space-y-3">
            {resultado.alertas.map((alerta) => (
              <div
                key={alerta.id}
                className={cn("flex gap-3 rounded-xl border p-4", ESTILO_ALERTA[alerta.nivel])}
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-current text-[11px] font-bold"
                >
                  {ICONE_ALERTA[alerta.nivel]}
                </span>
                <div>
                  <p className="text-sm font-semibold">{alerta.titulo}</p>
                  <p className="mt-1 text-xs">{alerta.detalhe}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-6 text-xs text-texto-suave">
          Simulação informativa, baseada nos dados que você informou. O valor final é
          confirmado no contrato, após análise do porte e da complexidade real da
          operação.
        </p>
      </div>
    </div>
  );
}
