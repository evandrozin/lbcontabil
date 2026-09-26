"use client";

import { useMemo, useState } from "react";
import {
  compararRegimes,
  type AtividadeComparador,
  type EntradaComparador,
  type OpcaoRegime,
} from "@/lib/tributario/comparador";
import { statusJanelaSimplesHibrido } from "@/lib/tributario/reforma";
import { calcularCargaReforma } from "@/lib/tributario/reforma";
import { TRANSICAO_REFORMA } from "@/lib/tributario/parametros";
import { dataIsoParaBr, moeda, moedaCurta } from "@/lib/format";
import { SITE, linkWhatsApp } from "@/lib/config";
import { BotaoLink, Cartao, Check, Selo, cn } from "@/components/ui/primitivos";

const ATIVIDADES: { valor: AtividadeComparador; rotulo: string; exemplo: string }[] = [
  { valor: "servico", rotulo: "Serviço", exemplo: "T.I., saúde, consultoria" },
  { valor: "comercio", rotulo: "Comércio", exemplo: "Loja, e-commerce" },
  { valor: "industria", rotulo: "Indústria", exemplo: "Fabricação" },
  { valor: "transporte", rotulo: "Transporte", exemplo: "Carga e passageiros" },
];

const ESTILO_ALERTA = {
  bloqueio:
    "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100",
  atencao: "border-destaque-400 bg-destaque-400/10 text-texto",
  info: "border-borda bg-fundo-suave text-texto-suave",
} as const;

const CLASSE_INPUT =
  "w-full rounded-lg border border-borda bg-superficie px-3 py-2.5 text-sm outline-none focus:border-marca-500";

function Campo({
  id,
  rotulo,
  ajuda,
  children,
}: {
  id: string;
  rotulo: string;
  ajuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {rotulo}
      </label>
      <div className="mt-1.5">{children}</div>
      {ajuda && <p className="mt-1 text-xs text-texto-suave">{ajuda}</p>}
    </div>
  );
}

function CampoMoeda({
  id,
  rotulo,
  ajuda,
  valor,
  aoMudar,
  passo = 1000,
}: {
  id: string;
  rotulo: string;
  ajuda?: string;
  valor: number;
  aoMudar: (n: number) => void;
  passo?: number;
}) {
  return (
    <Campo id={id} rotulo={rotulo} ajuda={ajuda}>
      <div className="flex items-center rounded-lg border border-borda bg-superficie focus-within:border-marca-500">
        <span className="pl-3 text-sm text-texto-suave" aria-hidden="true">
          R$
        </span>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          step={passo}
          value={Number.isFinite(valor) ? valor : 0}
          onChange={(e) => aoMudar(Math.max(0, Number(e.target.value) || 0))}
          className="w-full bg-transparent px-3 py-2.5 text-sm outline-none"
        />
      </div>
    </Campo>
  );
}

function CartaoRegime({ opcao, melhor }: { opcao: OpcaoRegime; melhor: boolean }) {
  return (
    <Cartao
      destaque={melhor}
      className={cn("flex h-full flex-col", !opcao.elegivel && "opacity-60")}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold">{opcao.nome}</h3>
        {melhor && <Selo tom="destaque">Menor carga</Selo>}
        {!opcao.elegivel && <Selo tom="neutro">Não elegível</Selo>}
      </div>

      {opcao.elegivel ? (
        <>
          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">
                {moeda(opcao.cargaMensalCentavos)}
              </span>
              <span className="text-sm text-texto-suave">/mês</span>
            </div>
            <p className="mt-1 text-sm text-texto-suave">
              {(opcao.cargaEfetiva * 100).toFixed(2)}% do faturamento
            </p>
          </div>

          <dl className="mt-4 space-y-1.5 border-t border-borda pt-4 text-sm">
            {opcao.detalhe.map((linha) => (
              <div key={linha.rotulo} className="flex justify-between gap-3">
                <dt className="text-texto-suave">{linha.rotulo}</dt>
                <dd className="shrink-0 font-medium">{moeda(linha.valorCentavos)}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <p className="mt-4 text-sm text-texto-suave">{opcao.motivoInelegibilidade}</p>
      )}

      {opcao.observacoes.length > 0 && (
        <ul className="mt-auto space-y-1.5 pt-4 text-xs text-texto-suave">
          {opcao.observacoes.map((obs) => (
            <li key={obs}>{obs}</li>
          ))}
        </ul>
      )}
    </Cartao>
  );
}

export function CalculadoraRegime({ hojeIso }: { hojeIso: string }) {
  const [atividade, setAtividade] = useState<AtividadeComparador>("servico");
  const [faturamento, setFaturamento] = useState(30_000);
  const [folha, setFolha] = useState(0);
  const [proLabore, setProLabore] = useState(3_000);
  const [compras, setCompras] = useState(0);
  const [iss, setIss] = useState(5);
  const [icms, setIcms] = useState<number | null>(null);
  const [vendaPJ, setVendaPJ] = useState(50);
  const [anexoIV, setAnexoIV] = useState(false);
  const [socios, setSocios] = useState(1);
  const [funcionarios, setFuncionarios] = useState(0);
  const [anoReforma, setAnoReforma] = useState(2027);

  const entrada: EntradaComparador = useMemo(
    () => ({
      atividade,
      faturamentoMensalCentavos: Math.round(faturamento * 100),
      folhaMensalCentavos: Math.round(folha * 100),
      proLaboreMensalCentavos: Math.round(proLabore * 100),
      comprasMensaisCentavos: Math.round(compras * 100),
      issAliquota: iss / 100,
      icmsEfetivo: icms === null ? undefined : icms / 100,
      parcelaVendaParaPJ: vendaPJ / 100,
      servicoAnexoIV: anexoIV,
      anoReforma,
      socios,
      funcionarios,
    }),
    [
      atividade,
      faturamento,
      folha,
      proLabore,
      compras,
      iss,
      icms,
      vendaPJ,
      anexoIV,
      anoReforma,
      socios,
      funcionarios,
    ],
  );

  const resultado = useMemo(() => compararRegimes(entrada), [entrada]);
  const janela = useMemo(() => statusJanelaSimplesHibrido(hojeIso), [hojeIso]);

  const linhaDoTempo = useMemo(
    () =>
      TRANSICAO_REFORMA.map((ano) => ({
        ano: ano.ano,
        nota: ano.nota,
        carga: calcularCargaReforma({
          receitaMesCentavos: entrada.faturamentoMensalCentavos,
          ano: ano.ano,
          comprasComCreditoCentavos: entrada.comprasMensaisCentavos,
        }),
      })),
    [entrada.faturamentoMensalCentavos, entrada.comprasMensaisCentavos],
  );

  const ehServico = atividade === "servico";
  const exigeIcms = atividade === "comercio" || atividade === "industria";

  return (
    <div className="space-y-12">
      {/* Janela do Simples híbrido — a urgência real do calendário */}
      {janela?.aberta && (
        <div className="rounded-2xl border-2 border-destaque-400 bg-destaque-400/10 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <Selo tom="destaque">
              {janela.diasRestantes === 0
                ? "Último dia"
                : `Faltam ${janela.diasRestantes} dia(s)`}
            </Selo>
            <h2 className="text-lg font-bold">
              Janela de opção pelo Simples híbrido está aberta
            </h2>
          </div>
          <p className="mt-2 text-sm">
            A opção por recolher CBS/IBS fora do DAS vai até{" "}
            <strong>{dataIsoParaBr(janela.janela.fechaEm)}</strong>,
            com efeito no {janela.janela.vigencia}.
            {janela.janela.desistenciaAte && (
              <>
                {" "}
                Há desistência até{" "}
                {dataIsoParaBr(janela.janela.desistenciaAte)}.
              </>
            )}{" "}
            Quem vende para empresas precisa decidir antes do prazo.
          </p>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
        {/* ── Formulário ── */}
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <fieldset>
            <legend className="text-sm font-semibold">Atividade</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {ATIVIDADES.map((item) => {
                const ativo = atividade === item.valor;
                return (
                  <button
                    key={item.valor}
                    type="button"
                    aria-pressed={ativo}
                    onClick={() => setAtividade(item.valor)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      ativo
                        ? "border-marca-600 bg-marca-50 dark:bg-marca-950/50"
                        : "border-borda bg-superficie hover:border-marca-400",
                    )}
                  >
                    <span className="block text-sm font-semibold">{item.rotulo}</span>
                    <span className="mt-0.5 block text-xs text-texto-suave">
                      {item.exemplo}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <CampoMoeda
            id="faturamento"
            rotulo="Faturamento por mês"
            valor={faturamento}
            aoMudar={setFaturamento}
            ajuda={`${moedaCurta(faturamento * 12 * 100)} por ano.`}
          />

          <CampoMoeda
            id="proLabore"
            rotulo="Pró-labore dos sócios"
            valor={proLabore}
            aoMudar={setProLabore}
            passo={500}
            ajuda={ehServico ? "Entra no Fator R junto com a folha." : undefined}
          />

          <CampoMoeda
            id="folha"
            rotulo="Folha de funcionários"
            valor={folha}
            aoMudar={setFolha}
            passo={500}
          />

          <CampoMoeda
            id="compras"
            rotulo="Compras de insumos por mês"
            valor={compras}
            aoMudar={setCompras}
            ajuda="Geram crédito de CBS/IBS na reforma."
          />

          <div className="grid grid-cols-2 gap-4">
            <Campo id="socios" rotulo="Sócios">
              <input
                id="socios"
                type="number"
                min={1}
                value={socios}
                onChange={(e) => setSocios(Math.max(1, Number(e.target.value) || 1))}
                className={CLASSE_INPUT}
              />
            </Campo>
            <Campo id="funcionarios" rotulo="Funcionários">
              <input
                id="funcionarios"
                type="number"
                min={0}
                value={funcionarios}
                onChange={(e) => setFuncionarios(Math.max(0, Number(e.target.value) || 0))}
                className={CLASSE_INPUT}
              />
            </Campo>
          </div>

          {ehServico && (
            <Campo id="iss" rotulo={`ISS do município: ${iss}%`}>
              <input
                id="iss"
                type="range"
                min={2}
                max={5}
                step={0.5}
                value={iss}
                onChange={(e) => setIss(Number(e.target.value))}
                className="w-full accent-marca-600"
              />
            </Campo>
          )}

          {exigeIcms && (
            <Campo
              id="icms"
              rotulo="ICMS efetivo sobre a receita"
              ajuda="Sem este número, o Lucro Presumido aparece mais barato do que é."
            >
              <div className="flex items-center gap-2">
                <input
                  id="icms"
                  type="number"
                  min={0}
                  max={30}
                  step={0.5}
                  value={icms ?? ""}
                  placeholder="não informado"
                  onChange={(e) =>
                    setIcms(e.target.value === "" ? null : Number(e.target.value))
                  }
                  className={CLASSE_INPUT}
                />
                <span className="text-sm text-texto-suave">%</span>
              </div>
            </Campo>
          )}

          {ehServico && (
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-borda bg-superficie p-3 text-sm">
              <input
                type="checkbox"
                checked={anexoIV}
                onChange={(e) => setAnexoIV(e.target.checked)}
                className="mt-0.5 size-4 accent-marca-600"
              />
              <span>
                <span className="font-semibold">Serviço do Anexo IV</span>
                <span className="mt-0.5 block text-xs text-texto-suave">
                  Construção civil, advocacia, vigilância e limpeza. Nesses casos o INSS
                  patronal é pago por fora do DAS.
                </span>
              </span>
            </label>
          )}

          <Campo
            id="vendaPJ"
            rotulo={`Vendas para empresas (PJ): ${vendaPJ}%`}
            ajuda="É o que define se o Simples híbrido faz sentido."
          >
            <input
              id="vendaPJ"
              type="range"
              min={0}
              max={100}
              step={5}
              value={vendaPJ}
              onChange={(e) => setVendaPJ(Number(e.target.value))}
              className="w-full accent-marca-600"
            />
          </Campo>

          <Campo id="ano" rotulo="Ano da simulação da reforma">
            <select
              id="ano"
              value={anoReforma}
              onChange={(e) => setAnoReforma(Number(e.target.value))}
              className={CLASSE_INPUT}
            >
              {TRANSICAO_REFORMA.map((t) => (
                <option key={t.ano} value={t.ano}>
                  {t.ano}
                </option>
              ))}
            </select>
          </Campo>
        </form>

        {/* ── Resultado ── */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold">Comparação de regimes</h2>
            <p className="mt-1 text-sm text-texto-suave">
              Todos os regimes medidos pelo mesmo critério: desembolso mensal total, já
              com INSS patronal sobre a folha.
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              {resultado.opcoes.map((opcao) => (
                <CartaoRegime
                  key={opcao.id}
                  opcao={opcao}
                  melhor={opcao.id === resultado.recomendado.id}
                />
              ))}
            </div>

            {resultado.economiaAnualCentavos > 0 && (
              <p className="mt-5 rounded-xl bg-marca-50 p-4 text-sm font-semibold text-marca-900 dark:bg-marca-950/60 dark:text-marca-100">
                {resultado.recomendado.nome} economiza{" "}
                {moeda(resultado.economiaAnualCentavos)} por ano frente à segunda opção.
              </p>
            )}
          </div>

          {/* Fator R */}
          {resultado.oportunidadeFatorR && (
            <Cartao>
              <h3 className="font-bold">
                Oportunidade de Fator R — você está no Anexo V
              </h3>
              <p className="mt-2 text-sm text-texto-suave">
                Seu Fator R está em{" "}
                <strong className="text-texto">
                  {(resultado.oportunidadeFatorR.fatorRAtual * 100).toFixed(1)}%
                </strong>
                . Faltam{" "}
                <strong className="text-texto">
                  {moeda(resultado.oportunidadeFatorR.folhaFaltanteCentavos)}
                </strong>{" "}
                de folha ou pró-labore ao longo de 12 meses para chegar aos 28% e migrar
                para o Anexo III.
              </p>
              {resultado.oportunidadeFatorR.economiaMensalEstimadaCentavos > 0 && (
                <p className="mt-3 text-sm">
                  Isso reduziria o imposto em cerca de{" "}
                  <strong>
                    {moeda(resultado.oportunidadeFatorR.economiaMensalEstimadaCentavos)}
                  </strong>{" "}
                  por mês — antes de considerar o INSS adicional sobre o pró-labore maior,
                  que precisa entrar na conta final.
                </p>
              )}
            </Cartao>
          )}

          {/* Simples híbrido */}
          {resultado.simplesHibrido && (
            <Cartao destaque={resultado.simplesHibrido.recomendacao === "avaliar"}>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-bold">Simples híbrido: CBS/IBS fora do DAS</h3>
                <Selo
                  tom={
                    resultado.simplesHibrido.recomendacao === "avaliar"
                      ? "destaque"
                      : "neutro"
                  }
                >
                  {
                    {
                      avaliar: "Vale avaliar",
                      "provavelmente-nao": "Provavelmente não",
                      indiferente: "Depende da carteira",
                    }[resultado.simplesHibrido.recomendacao]
                  }
                </Selo>
              </div>

              <p className="mt-3 text-sm text-texto-suave">
                {resultado.simplesHibrido.justificativa}
              </p>

              <dl className="mt-4 space-y-1.5 border-t border-borda pt-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-texto-suave">CBS/IBS recolhidos por fora</dt>
                  <dd className="font-medium">
                    {moeda(resultado.simplesHibrido.cbsIbsForaDoDasCentavos)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-texto-suave">Redução no DAS</dt>
                  <dd className="font-medium">
                    − {moeda(resultado.simplesHibrido.reducaoDoDasCentavos)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-borda pt-1.5">
                  <dt className="font-semibold">Diferença no seu bolso</dt>
                  <dd className="font-bold">
                    {resultado.simplesHibrido.custoAdicionalMensalCentavos >= 0 ? "+" : ""}
                    {moeda(resultado.simplesHibrido.custoAdicionalMensalCentavos)}/mês
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-texto-suave">Crédito gerado aos clientes PJ</dt>
                  <dd className="font-medium">
                    {moeda(resultado.simplesHibrido.creditoGeradoAoClienteCentavos)}
                  </dd>
                </div>
              </dl>

              <p className="mt-4 rounded-lg bg-fundo-suave p-3 text-xs text-texto-suave">
                O híbrido não é economia de imposto: você paga mais e ganha
                competitividade, porque seu cliente PJ passa a creditar o valor integral.
                A conta só fecha se isso virar preço ou volume.
              </p>
            </Cartao>
          )}

          {/* Linha do tempo da reforma */}
          <div>
            <h2 className="text-xl font-bold">Sua carga de CBS/IBS ano a ano</h2>
            <p className="mt-1 text-sm text-texto-suave">
              Considerando {moedaCurta(entrada.faturamentoMensalCentavos)} de faturamento
              e {moedaCurta(entrada.comprasMensaisCentavos ?? 0)} de compras com crédito
              por mês.
            </p>

            <div className="mt-5 overflow-x-auto rounded-2xl border border-borda">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="bg-fundo-suave text-xs uppercase tracking-wide text-texto-suave">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Ano</th>
                    <th scope="col" className="px-4 py-3 font-semibold">CBS + IBS</th>
                    <th scope="col" className="px-4 py-3 font-semibold">A recolher</th>
                    <th scope="col" className="px-4 py-3 font-semibold">O que muda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {linhaDoTempo.map((linha) => (
                    <tr
                      key={linha.ano}
                      className={cn(linha.ano === anoReforma && "bg-marca-50 dark:bg-marca-950/40")}
                    >
                      <td className="px-4 py-3 font-semibold">{linha.ano}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {((linha.carga.aliquotaCbs + linha.carga.aliquotaIbs) * 100).toFixed(2)}%
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium">
                        {moeda(linha.carga.cbsIbsLiquidoCentavos)}
                      </td>
                      <td className="px-4 py-3 text-texto-suave">{linha.nota}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alertas */}
          {resultado.alertas.length > 0 && (
            <div className="space-y-3">
              {resultado.alertas.map((alerta) => (
                <div
                  key={alerta.id}
                  className={cn("rounded-xl border p-4", ESTILO_ALERTA[alerta.nivel])}
                >
                  <p className="text-sm font-semibold">{alerta.titulo}</p>
                  <p className="mt-1 text-xs">{alerta.detalhe}</p>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <Cartao destaque>
            <h2 className="text-xl font-bold">
              Quer esse estudo com os seus números reais?
            </h2>
            <p className="mt-2 text-sm text-texto-suave">
              Esta simulação usa o que você digitou. Com acesso à sua situação fiscal,
              fazemos o comparativo com o faturamento, a folha e as notas que a Receita já
              tem — e o estudo fica com você.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                "Diagnóstico da situação fiscal, com pendências e débitos",
                "Comparativo dos regimes com os números reais da empresa",
                "Recomendação assinada pelo contador responsável",
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Check className="size-4" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <BotaoLink
                href={linkWhatsApp(
                  `Olá! Usei a calculadora da reforma no site da ${SITE.nome}. Minha atividade é ${atividade} e faturo cerca de ${moedaCurta(entrada.faturamentoMensalCentavos)}/mês. Quero o estudo com meus números reais.`,
                )}
                tamanho="lg"
              >
                Pedir estudo no WhatsApp
              </BotaoLink>
              <BotaoLink href="/planos" variante="secundario" tamanho="lg">
                Ver planos de contabilidade
              </BotaoLink>
            </div>
          </Cartao>
        </div>
      </div>
    </div>
  );
}
