"use client";

import { useMemo, useState } from "react";
import type { SegmentoId } from "@/lib/catalogo/tipos";
import { LISTA_SEGMENTOS } from "@/lib/catalogo/segmentos";
import { agenda, lembretesNoIntervalo, type PerfilCliente } from "@/lib/obrigacoes/motor";
import { CALENDARIO_REVISADO_EM } from "@/lib/obrigacoes/catalogo";
import { formatarBr, somarDias } from "@/lib/obrigacoes/datas";
import { SITE, linkWhatsApp } from "@/lib/config";
import { BotaoLink, Cartao, Selo, cn } from "@/components/ui/primitivos";

const JANELA_DIAS = 90;

function RotuloDestinatario({ cliente }: { cliente: boolean }) {
  return (
    <Selo tom={cliente ? "destaque" : "neutro"}>
      {cliente ? "Você paga" : "Nós transmitimos"}
    </Selo>
  );
}

export function Agenda({ hojeIso }: { hojeIso: string }) {
  const [segmentoId, setSegmentoId] = useState<SegmentoId>("simples-servicos");
  const [temEmpregados, setTemEmpregados] = useState(false);

  const perfil: PerfilCliente = useMemo(
    () => ({ segmentoId, temEmpregados }),
    [segmentoId, temEmpregados],
  );

  const resumo = useMemo(
    () => agenda(perfil, hojeIso, JANELA_DIAS),
    [perfil, hojeIso],
  );

  const lembretes = useMemo(
    () => lembretesNoIntervalo(perfil, hojeIso, somarDias(hojeIso, 30)),
    [perfil, hojeIso],
  );

  const segmento = LISTA_SEGMENTOS.find((s) => s.id === segmentoId)!;
  const guiasNoPeriodo = resumo.vencimentos.filter((v) => v.obrigacao.geraGuia).length;

  return (
    <div className="space-y-10">
      {/* Seletor de perfil */}
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold">Qual é o seu tipo de empresa?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {LISTA_SEGMENTOS.map((s) => {
              const ativo = s.id === segmentoId;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => setSegmentoId(s.id)}
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
        </div>

        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={temEmpregados}
            onChange={(e) => setTemEmpregados(e.target.checked)}
            className="size-4 accent-marca-600"
          />
          <span className="font-semibold">Tenho funcionário registrado</span>
        </label>
      </div>

      {/* Próximo vencimento */}
      {resumo.proximo ? (
        <Cartao destaque>
          <p className="text-xs font-semibold uppercase tracking-wide text-marca-600 dark:text-marca-300">
            Próximo vencimento
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-2xl font-bold">{resumo.proximo.obrigacao.nome}</h2>
            <span className="text-lg font-semibold">
              {formatarBr(resumo.proximo.vencimento)}
            </span>
          </div>
          <p className="mt-1 text-sm text-texto-suave">
            {resumo.diasAteProximo === 0
              ? "Vence hoje."
              : `Faltam ${resumo.diasAteProximo} dia(s). Competência ${resumo.proximo.competencia}.`}
          </p>
          {resumo.proximo.ajustado && (
            <p className="mt-2 text-sm">
              O dia original era {formatarBr(resumo.proximo.vencimentoNominal)}, mas caiu
              em dia sem expediente bancário —{" "}
              {resumo.proximo.obrigacao.ajuste === "antecipa"
                ? "e esta obrigação antecipa."
                : "e esta obrigação prorroga."}
            </p>
          )}
        </Cartao>
      ) : (
        <Cartao>
          <p className="text-sm text-texto-suave">
            Nenhum vencimento nos próximos {JANELA_DIAS} dias para este perfil.
          </p>
        </Cartao>
      )}

      {/* Calendário */}
      <div>
        <h2 className="text-xl font-bold">
          Seus próximos {JANELA_DIAS} dias
        </h2>
        <p className="mt-1 text-sm text-texto-suave">
          {resumo.vencimentos.length} obrigações, das quais {guiasNoPeriodo} geram guia
          para pagar. O resto nós transmitimos sem você precisar fazer nada.
        </p>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-borda">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="bg-fundo-suave text-xs uppercase tracking-wide text-texto-suave">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Vencimento</th>
                <th scope="col" className="px-4 py-3 font-semibold">Obrigação</th>
                <th scope="col" className="px-4 py-3 font-semibold">Competência</th>
                <th scope="col" className="px-4 py-3 font-semibold">Quem resolve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {resumo.vencimentos.map((v) => (
                <tr key={`${v.obrigacao.id}-${v.competencia}`}>
                  <td className="whitespace-nowrap px-4 py-4 align-top font-semibold">
                    {formatarBr(v.vencimento)}
                    {v.ajustado && (
                      <span className="block text-xs font-normal text-texto-suave">
                        era {formatarBr(v.vencimentoNominal)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="font-semibold">{v.obrigacao.nome}</p>
                    <p className="mt-1 text-texto-suave">{v.obrigacao.descricao}</p>
                    {v.obrigacao.variaPorPraca && (
                      <p className="mt-1 text-xs text-destaque-600">
                        Prazo definido pelo seu município ou estado — confirmamos no
                        onboarding.
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 align-top text-texto-suave">
                    {v.competencia}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 align-top">
                    <RotuloDestinatario cliente={v.obrigacao.geraGuia} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Régua de lembretes */}
      {lembretes.length > 0 && (
        <div>
          <h2 className="text-xl font-bold">O que você vai receber nos próximos 30 dias</h2>
          <p className="mt-1 text-sm text-texto-suave">
            Lembretes no WhatsApp, já ajustados para não cair em fim de semana ou
            feriado.
          </p>

          <ul className="mt-5 space-y-2">
            {lembretes
              .filter((l) => l.destinatario === "cliente")
              .map((l) => (
                <li
                  key={`${l.obrigacaoId}-${l.competencia}-${l.tipo}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-borda bg-superficie px-4 py-3 text-sm"
                >
                  <span className="font-semibold">{formatarBr(l.data)}</span>
                  <Selo tom="neutro">{l.tipo}</Selo>
                  <span className="text-texto-suave">{l.mensagem}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Aviso de homologação */}
      {!resumo.calendarioHomologado && (
        <div className="rounded-xl border border-borda bg-fundo-suave p-5 text-xs text-texto-suave">
          <strong className="text-texto">Calendário de referência.</strong> Os prazos
          desta página ainda não foram homologados pelo contador responsável, e os de
          ISS e SPED Fiscal variam por município e estado. Use como orientação — o
          calendário definitivo da sua empresa é montado no onboarding. Revisão dos
          parâmetros em {formatarBr(CALENDARIO_REVISADO_EM)}.
        </div>
      )}

      {/* CTA */}
      <Cartao destaque>
        <h2 className="text-xl font-bold">Quer esse calendário rodando sozinho?</h2>
        <p className="mt-2 text-sm text-texto-suave">
          Na assinatura, cada uma dessas datas vira lembrete no seu WhatsApp com o Pix
          da guia junto. As que dizem &quot;nós transmitimos&quot; você nem vê acontecer.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <BotaoLink href={`/segmentos/${segmento.slug}`} tamanho="lg">
            Ver planos para {segmento.rotuloSeletor.toLowerCase()}
          </BotaoLink>
          <BotaoLink
            href={linkWhatsApp(
              `Olá! Vi o calendário de obrigações no site da ${SITE.nome} e quero falar sobre a assinatura.`,
            )}
            variante="secundario"
            tamanho="lg"
          >
            Falar no WhatsApp
          </BotaoLink>
        </div>
      </Cartao>
    </div>
  );
}
