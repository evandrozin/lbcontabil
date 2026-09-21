"use client";

import { useState } from "react";
import Link from "next/link";
import type { Periodicidade, Plano } from "@/lib/catalogo/tipos";
import type { MetodoCobranca } from "@/lib/pagamentos/tipos";
import { esquemaCheckout } from "@/lib/checkout/esquema";
import {
  formatarCEP,
  formatarCelular,
  formatarCNPJ,
  formatarCpfOuCnpj,
} from "@/lib/validacao/documentos";
import { moeda } from "@/lib/format";
import { Botao, cn } from "@/components/ui/primitivos";

const METODOS: { valor: MetodoCobranca; rotulo: string; ajuda: string }[] = [
  {
    valor: "escolher-depois",
    rotulo: "Decidir na hora de pagar",
    ajuda: "Você escolhe entre PIX, cartão ou boleto na página segura de pagamento.",
  },
  {
    valor: "cartao",
    rotulo: "Cartão de crédito",
    ajuda: "Cobrança recorrente automática, sem ocupar o limite de uma vez só.",
  },
  {
    valor: "pix",
    rotulo: "PIX",
    ajuda: "Você recebe um QR Code novo todo mês, antes do vencimento.",
  },
  {
    valor: "boleto",
    rotulo: "Boleto",
    ajuda: "Boleto mensal enviado por e-mail com 3 dias de antecedência.",
  },
];

type Erros = Record<string, string[] | undefined>;

function Campo({
  id,
  rotulo,
  erro,
  ajuda,
  children,
}: {
  id: string;
  rotulo: string;
  erro?: string[];
  ajuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {rotulo}
      </label>
      <div className="mt-1.5">{children}</div>
      {erro?.[0] ? (
        <p role="alert" className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
          {erro[0]}
        </p>
      ) : (
        ajuda && <p className="mt-1 text-xs text-texto-suave">{ajuda}</p>
      )}
    </div>
  );
}

const CLASSE_INPUT =
  "w-full rounded-lg border border-borda bg-superficie px-3 py-2.5 text-sm outline-none focus:border-marca-500";

export function FormularioCheckout({
  plano,
  periodicidade,
}: {
  plano: Plano;
  periodicidade: Periodicidade;
}) {
  const [metodo, setMetodo] = useState<MetodoCobranca>("escolher-depois");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [celular, setCelular] = useState("");
  const [cep, setCep] = useState("");
  const [jaTemEmpresa, setJaTemEmpresa] = useState(true);
  const [razaoSocial, setRazaoSocial] = useState("");
  const [empresaCnpj, setEmpresaCnpj] = useState("");
  const [aceite, setAceite] = useState(false);

  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const valorCentavos =
    periodicidade === "anual"
      ? plano.precoAnualMensalizadoCentavos
      : plano.precoMensalCentavos;

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErroGeral(null);

    const bruto = {
      planoId: plano.id,
      periodicidade,
      metodo,
      responsavelNome: nome,
      responsavelEmail: email,
      responsavelCpfCnpj: cpfCnpj,
      responsavelCelular: celular,
      cep,
      jaTemEmpresa,
      empresaRazaoSocial: razaoSocial || undefined,
      empresaCnpj: empresaCnpj || undefined,
      aceiteContrato: aceite,
    };

    const validacao = esquemaCheckout.safeParse(bruto);
    if (!validacao.success) {
      setErros(validacao.error.flatten().fieldErrors as Erros);
      return;
    }

    setErros({});
    setEnviando(true);

    try {
      const resposta = await fetch("/api/assinaturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validacao.data),
      });
      const corpo = await resposta.json();

      if (!resposta.ok) {
        setErros((corpo.campos ?? {}) as Erros);
        setErroGeral(corpo.erro ?? "Não conseguimos concluir a contratação.");
        return;
      }

      // O pagamento acontece na página do gateway — nenhum dado de cartão
      // passa por nós. Sem link, caímos na confirmação com instruções.
      const destino =
        corpo.urlPagamento ??
        `/checkout/confirmacao?assinatura=${encodeURIComponent(corpo.id)}`;
      window.location.assign(destino);
    } catch {
      setErroGeral("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-8" noValidate>
      <fieldset className="space-y-4">
        <legend className="text-lg font-bold">Quem está contratando</legend>

        <Campo id="nome" rotulo="Nome completo" erro={erros.responsavelNome}>
          <input
            id="nome"
            className={CLASSE_INPUT}
            value={nome}
            autoComplete="name"
            onChange={(e) => setNome(e.target.value)}
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="email" rotulo="E-mail" erro={erros.responsavelEmail}>
            <input
              id="email"
              type="email"
              inputMode="email"
              className={CLASSE_INPUT}
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </Campo>

          <Campo
            id="celular"
            rotulo="Celular (WhatsApp)"
            erro={erros.responsavelCelular}
            ajuda="É por aqui que o contador vai falar com você."
          >
            <input
              id="celular"
              inputMode="tel"
              className={CLASSE_INPUT}
              value={celular}
              autoComplete="tel"
              onChange={(e) => setCelular(formatarCelular(e.target.value))}
            />
          </Campo>

          <Campo
            id="cpfCnpj"
            rotulo="CPF ou CNPJ do responsável"
            erro={erros.responsavelCpfCnpj}
          >
            <input
              id="cpfCnpj"
              className={CLASSE_INPUT}
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(formatarCpfOuCnpj(e.target.value))}
            />
          </Campo>

          <Campo id="cep" rotulo="CEP (opcional)" erro={erros.cep}>
            <input
              id="cep"
              inputMode="numeric"
              className={CLASSE_INPUT}
              value={cep}
              autoComplete="postal-code"
              onChange={(e) => setCep(formatarCEP(e.target.value))}
            />
          </Campo>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-bold">A empresa</legend>

        <div className="flex gap-2">
          {[
            { valor: true, rotulo: "Já tenho empresa" },
            { valor: false, rotulo: "Vou abrir agora" },
          ].map((opcao) => (
            <button
              key={String(opcao.valor)}
              type="button"
              aria-pressed={jaTemEmpresa === opcao.valor}
              onClick={() => setJaTemEmpresa(opcao.valor)}
              className={cn(
                "flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors",
                jaTemEmpresa === opcao.valor
                  ? "border-marca-600 bg-marca-50 text-marca-800 dark:bg-marca-950/60 dark:text-marca-100"
                  : "border-borda bg-superficie text-texto-suave hover:border-marca-400",
              )}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>

        {jaTemEmpresa ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="razaoSocial" rotulo="Razão social" erro={erros.empresaRazaoSocial}>
              <input
                id="razaoSocial"
                className={CLASSE_INPUT}
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
              />
            </Campo>
            <Campo id="empresaCnpj" rotulo="CNPJ" erro={erros.empresaCnpj}>
              <input
                id="empresaCnpj"
                className={CLASSE_INPUT}
                value={empresaCnpj}
                onChange={(e) => setEmpresaCnpj(formatarCNPJ(e.target.value))}
              />
            </Campo>
          </div>
        ) : (
          <p className="rounded-lg border border-borda bg-fundo-suave p-4 text-sm text-texto-suave">
            Sem problema — os dados da empresa são definidos no onboarding, junto com a
            escolha do nome, do CNAE e do capital social.
            {periodicidade === "anual" && (
              <strong className="mt-1 block text-texto">
                No plano anual, a abertura sai sem honorários.
              </strong>
            )}
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-lg font-bold">Como prefere pagar</legend>
        {METODOS.map((opcao) => (
          <label
            key={opcao.valor}
            className={cn(
              "flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors",
              metodo === opcao.valor
                ? "border-marca-600 bg-marca-50 dark:bg-marca-950/50"
                : "border-borda bg-superficie hover:border-marca-400",
            )}
          >
            <input
              type="radio"
              name="metodo"
              checked={metodo === opcao.valor}
              onChange={() => setMetodo(opcao.valor)}
              className="mt-0.5 size-4 accent-marca-600"
            />
            <span>
              <span className="block text-sm font-semibold">{opcao.rotulo}</span>
              <span className="mt-0.5 block text-xs text-texto-suave">{opcao.ajuda}</span>
            </span>
          </label>
        ))}

        <p className="rounded-lg border border-borda bg-fundo-suave p-3 text-xs text-texto-suave">
          O pagamento é processado em ambiente seguro do nosso provedor financeiro.
          Dados de cartão não passam nem ficam armazenados nos servidores da LB
          Contábil.
        </p>
      </fieldset>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={aceite}
            onChange={(e) => setAceite(e.target.checked)}
            className="mt-0.5 size-4 accent-marca-600"
          />
          <span>
            Li e aceito o{" "}
            <Link href="/termos" className="font-semibold underline">
              contrato de prestação de serviços contábeis
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" className="font-semibold underline">
              política de privacidade
            </Link>
            . Estou ciente da cobrança da 13ª mensalidade referente ao encerramento do
            exercício.
          </span>
        </label>
        {erros.aceiteContrato?.[0] && (
          <p role="alert" className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
            {erros.aceiteContrato[0]}
          </p>
        )}
      </div>

      {erroGeral && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
        >
          {erroGeral}
        </p>
      )}

      <Botao type="submit" tamanho="lg" className="w-full" disabled={enviando}>
        {enviando ? "Processando…" : `Contratar por ${moeda(valorCentavos)}/mês`}
      </Botao>

      <p className="text-center text-xs text-texto-suave">
        Sem taxa de adesão. No plano mensal você pode cancelar a qualquer momento.
      </p>
    </form>
  );
}
