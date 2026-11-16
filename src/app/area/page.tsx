import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  assinaturaDoUsuario,
  supabaseConfigurado,
  usuarioAtual,
} from "@/lib/supabase/sessao";
import {
  painelDoAssinante,
  sincronizarObrigacoes,
  type ObrigacaoDoCliente,
} from "@/lib/obrigacoes/sincronizacao";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { planoPorId } from "@/lib/catalogo/planos";
import { SEGMENTOS } from "@/lib/catalogo/segmentos";
import type { SegmentoId } from "@/lib/catalogo/tipos";
import { formatarBr } from "@/lib/obrigacoes/datas";
import { moeda } from "@/lib/format";
import { formatarCpfOuCnpj } from "@/lib/validacao/documentos";
import { SITE, linkWhatsApp } from "@/lib/config";
import { BotaoJaPaguei } from "@/components/area/BotaoJaPaguei";
import {
  BotaoLink,
  Cartao,
  Check,
  Container,
  Selo,
  cn,
} from "@/components/ui/primitivos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Área do assinante",
  robots: { index: false, follow: false },
};

function LinhaObrigacao({
  obrigacao,
  atrasada = false,
}: {
  obrigacao: ObrigacaoDoCliente;
  atrasada?: boolean;
}) {
  const doCliente = obrigacao.responsavel === "cliente";

  return (
    <li
      className={cn(
        "rounded-xl border p-4",
        atrasada
          ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
          : "border-borda bg-superficie",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{obrigacao.nome}</h3>
            <Selo tom={doCliente ? "destaque" : "neutro"}>
              {doCliente ? "Você paga" : "Nós transmitimos"}
            </Selo>
          </div>
          <p className="mt-1 text-sm text-texto-suave">
            Competência {obrigacao.competencia} · vence em{" "}
            <strong className="text-texto">{formatarBr(obrigacao.vencimento)}</strong>
            {obrigacao.vencimento_nominal &&
              obrigacao.vencimento_nominal !== obrigacao.vencimento && (
                <> (o dia original era {formatarBr(obrigacao.vencimento_nominal)})</>
              )}
          </p>

          {obrigacao.valor_centavos !== null && (
            <p className="mt-1 text-sm font-semibold">
              {moeda(obrigacao.valor_centavos)}
            </p>
          )}

          {obrigacao.codigo_pix && (
            <p className="mt-2 break-all rounded-lg bg-fundo-suave p-2 font-mono text-xs">
              {obrigacao.codigo_pix}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {obrigacao.url_guia && (
            <BotaoLink href={obrigacao.url_guia} variante="secundario">
              Baixar guia
            </BotaoLink>
          )}
          {obrigacao.gera_guia && (
            <BotaoJaPaguei
              obrigacaoLinhaId={obrigacao.id}
              declaradoEm={obrigacao.pagamento_declarado_em}
            />
          )}
        </div>
      </div>
    </li>
  );
}

export default async function AreaPage() {
  if (!supabaseConfigurado()) {
    return (
      <Container className="py-16">
        <Cartao>
          <h1 className="text-2xl font-bold">Área indisponível neste ambiente</h1>
          <p className="mt-2 text-texto-suave">
            A autenticação ainda não está configurada. Fale com a equipe pelo WhatsApp.
          </p>
          <BotaoLink
            href={linkWhatsApp(`Olá! Preciso acessar minha área na ${SITE.nome}.`)}
            className="mt-6"
          >
            Falar no WhatsApp
          </BotaoLink>
        </Cartao>
      </Container>
    );
  }

  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar");

  const assinatura = await assinaturaDoUsuario(usuario.id);

  // Usuário autenticado sem assinatura vinculada: conta criada antes do
  // contrato, ou vínculo que a equipe ainda não fez.
  if (!assinatura) {
    return (
      <Container className="py-16">
        <Cartao>
          <h1 className="text-2xl font-bold">Conta ainda não vinculada</h1>
          <p className="mt-2 text-texto-suave">
            Seu acesso existe, mas ainda não está ligado a uma empresa. Isso costuma
            acontecer quando o contrato acabou de ser assinado. Nos chame que resolvemos
            em minutos.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <BotaoLink
              href={linkWhatsApp(
                `Olá! Entrei na área da ${SITE.nome} com o e-mail ${usuario.email}, mas minha empresa não aparece.`,
              )}
            >
              Falar no WhatsApp
            </BotaoLink>
            <form action="/sair" method="post">
              <BotaoLink href="/entrar" variante="secundario">
                Trocar de conta
              </BotaoLink>
            </form>
          </div>
        </Cartao>
      </Container>
    );
  }

  const hojeIso = new Date().toISOString().slice(0, 10);
  const segmentoId = assinatura.segmento_id as SegmentoId;
  const segmento = SEGMENTOS[segmentoId];
  const plano = planoPorId(assinatura.plano_id);

  // Materializa o que o motor prevê antes de ler. É idempotente, então
  // rodar a cada visita não duplica nem reabre o que já foi concluído.
  const temEmpregados = (plano?.limites.funcionariosInclusos ?? 0) > 0;
  try {
    await sincronizarObrigacoes({
      assinaturaId: assinatura.id,
      segmentoId,
      temEmpregados,
      hojeIso,
    });
  } catch {
    // Falhar a sincronização não pode esconder o que já existe no painel.
  }

  const painel = await painelDoAssinante(assinatura.id, hojeIso);

  const { data: documentos } = await supabaseServidor()
    .from("documentos_onboarding")
    .select("tipo, nome_arquivo, criado_em")
    .eq("assinatura_id", assinatura.id)
    .order("criado_em", { ascending: false })
    .limit(20);

  const doCliente = painel.pendentes.filter((o) => o.responsavel === "cliente");
  const daEquipe = painel.pendentes.filter((o) => o.responsavel === "equipe");

  return (
    <Container className="py-10 sm:py-14">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-texto-suave">{segmento.nome}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {assinatura.empresa_razao_social ?? assinatura.responsavel_nome}
          </h1>
          <p className="mt-1 text-sm text-texto-suave">{usuario.email}</p>
        </div>
        <form action="/sair" method="post">
          <button
            type="submit"
            className="rounded-lg border border-borda px-4 py-2 text-sm font-semibold text-texto-suave transition-colors hover:text-texto"
          >
            Sair
          </button>
        </form>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="space-y-10">
          {/* Atrasadas */}
          {painel.atrasadas.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-red-700 dark:text-red-300">
                Em atraso ({painel.atrasadas.length})
              </h2>
              <p className="mt-1 text-sm text-texto-suave">
                Resolva primeiro estas. Multa por atraso cresce por dia.
              </p>
              <ul className="mt-4 space-y-3">
                {painel.atrasadas.map((o) => (
                  <LinhaObrigacao key={o.id} obrigacao={o} atrasada />
                ))}
              </ul>
            </section>
          )}

          {/* O que você precisa fazer */}
          <section>
            <h2 className="text-xl font-bold">O que depende de você</h2>
            {doCliente.length > 0 ? (
              <>
                <p className="mt-1 text-sm text-texto-suave">
                  {doCliente.length} guia(s) para pagar nos próximos dias.
                </p>
                <ul className="mt-4 space-y-3">
                  {doCliente.map((o) => (
                    <LinhaObrigacao key={o.id} obrigacao={o} />
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-3 flex items-center gap-2 rounded-xl border border-borda bg-fundo-suave p-4 text-sm">
                <Check className="size-4" />
                Nada pendente do seu lado agora.
              </p>
            )}
          </section>

          {/* O que estamos fazendo */}
          {daEquipe.length > 0 && (
            <section>
              <h2 className="text-xl font-bold">O que estamos fazendo por você</h2>
              <p className="mt-1 text-sm text-texto-suave">
                Você não precisa fazer nada nestas — é só para você saber que estão no
                nosso radar.
              </p>
              <ul className="mt-4 space-y-3">
                {daEquipe.map((o) => (
                  <LinhaObrigacao key={o.id} obrigacao={o} />
                ))}
              </ul>
            </section>
          )}

          {/* Histórico */}
          <section>
            <h2 className="text-xl font-bold">O que já foi feito</h2>
            {painel.concluidas.length > 0 ? (
              <div className="mt-4 overflow-x-auto rounded-2xl border border-borda">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <thead className="bg-fundo-suave text-xs uppercase tracking-wide text-texto-suave">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">Obrigação</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Competência</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Concluída em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borda">
                    {painel.concluidas.map((o) => (
                      <tr key={o.id}>
                        <td className="px-4 py-3 font-medium">{o.nome}</td>
                        <td className="px-4 py-3 text-texto-suave">{o.competencia}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-texto-suave">
                          {o.concluida_em
                            ? formatarBr(o.concluida_em.slice(0, 10))
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 rounded-xl border border-borda bg-fundo-suave p-4 text-sm text-texto-suave">
                Ainda não há obrigações concluídas. Assim que fecharmos a primeira
                competência, ela aparece aqui.
              </p>
            )}
          </section>
        </div>

        {/* Lateral */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <Cartao>
            <h2 className="font-bold">Seu plano</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-texto-suave">Plano</dt>
                <dd className="text-right font-medium">
                  {plano?.nome ?? assinatura.plano_id}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-texto-suave">Mensalidade</dt>
                <dd className="font-medium">
                  {moeda(assinatura.valor_mensal_centavos)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-texto-suave">Periodicidade</dt>
                <dd className="font-medium capitalize">{assinatura.periodicidade}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-texto-suave">Situação</dt>
                <dd>
                  <Selo tom={assinatura.status === "ativa" ? "marca" : "destaque"}>
                    {assinatura.status}
                  </Selo>
                </dd>
              </div>
            </dl>
          </Cartao>

          <Cartao>
            <h2 className="font-bold">Sua empresa</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {assinatura.empresa_cnpj && (
                <div className="flex justify-between gap-3">
                  <dt className="text-texto-suave">CNPJ</dt>
                  <dd className="font-medium">
                    {formatarCpfOuCnpj(assinatura.empresa_cnpj)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-texto-suave">Responsável</dt>
                <dd className="text-right font-medium">
                  {assinatura.responsavel_nome}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-texto-suave">Cliente desde</dt>
                <dd className="font-medium">
                  {formatarBr(assinatura.criado_em.slice(0, 10))}
                </dd>
              </div>
            </dl>
          </Cartao>

          <Cartao>
            <h2 className="font-bold">Documentos</h2>
            {documentos && documentos.length > 0 ? (
              <ul className="mt-3 space-y-1.5 text-sm text-texto-suave">
                {documentos.slice(0, 6).map((d, i) => (
                  <li key={`${d.nome_arquivo}-${i}`} className="flex gap-2">
                    <Check className="size-4" />
                    <span className="truncate">{d.nome_arquivo}</span>
                  </li>
                ))}
                {documentos.length > 6 && (
                  <li className="text-xs">e mais {documentos.length - 6}…</li>
                )}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-texto-suave">
                Você ainda não enviou documentos.
              </p>
            )}
            <BotaoLink
              href={`/onboarding/${assinatura.onboarding_token}`}
              variante="secundario"
              className="mt-4 w-full"
            >
              Enviar documentos
            </BotaoLink>
          </Cartao>

          <Cartao>
            <h2 className="font-bold">Precisa falar com alguém?</h2>
            <p className="mt-2 text-sm text-texto-suave">
              Seu contador responde no WhatsApp em horário comercial.
            </p>
            <BotaoLink
              href={linkWhatsApp(
                `Olá! Sou cliente ${SITE.nome}${
                  assinatura.empresa_razao_social
                    ? ` (${assinatura.empresa_razao_social})`
                    : ""
                } e tenho uma dúvida.`,
              )}
              className="mt-4 w-full"
            >
              Falar no WhatsApp
            </BotaoLink>
          </Cartao>

          <p className="text-xs text-texto-suave">
            As datas seguem o calendário fiscal e já vêm ajustadas para feriado e fim de
            semana.{" "}
            <Link href="/calendario" className="underline">
              Ver o calendário completo
            </Link>
            .
          </p>
        </aside>
      </div>
    </Container>
  );
}
