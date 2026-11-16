"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { Botao, cn } from "@/components/ui/primitivos";

const CLASSE_INPUT =
  "w-full rounded-lg border border-borda bg-superficie px-3 py-2.5 text-sm outline-none focus:border-marca-500";

type Modo = "entrar" | "recuperar";

/**
 * O erro de login é sempre genérico de propósito.
 *
 * "E-mail não cadastrado" diria a um atacante quais endereços são
 * clientes do escritório — o que, num escritório contábil, já é
 * informação que não deveria vazar.
 */
const ERRO_GENERICO = "E-mail ou senha incorretos.";

export function FormularioLogin({ destino }: { destino: string }) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const supabase = supabaseNavegador();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        setErro(ERRO_GENERICO);
        return;
      }

      // refresh() faz o servidor reler a sessão do cookie antes de navegar.
      router.refresh();
      router.push(destino);
    } catch {
      setErro("Não conseguimos entrar agora. Tente novamente em instantes.");
    } finally {
      setEnviando(false);
    }
  }

  async function recuperar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const supabase = supabaseNavegador();
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?proximo=/redefinir-senha`,
      });

      // A mensagem não revela se o e-mail existe, pelo mesmo motivo do
      // erro genérico acima.
      setAviso(
        "Se este e-mail estiver cadastrado, você receberá um link para criar uma nova senha. Confira também a caixa de spam.",
      );
      setModo("entrar");
    } catch {
      setErro("Não conseguimos enviar o e-mail agora. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={modo === "entrar" ? entrar : recuperar} className="space-y-5" noValidate>
      <div>
        <label htmlFor="email" className="block text-sm font-semibold">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={cn(CLASSE_INPUT, "mt-1.5")}
        />
      </div>

      {modo === "entrar" && (
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="senha" className="block text-sm font-semibold">
              Senha
            </label>
            <button
              type="button"
              onClick={() => {
                setModo("recuperar");
                setErro(null);
                setAviso(null);
              }}
              className="text-xs font-semibold text-marca-700 hover:underline dark:text-marca-300"
            >
              Esqueci minha senha
            </button>
          </div>
          <input
            id="senha"
            type="password"
            autoComplete="current-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={cn(CLASSE_INPUT, "mt-1.5")}
          />
        </div>
      )}

      {modo === "recuperar" && (
        <p className="rounded-lg border border-borda bg-fundo-suave p-3 text-sm text-texto-suave">
          Informe o e-mail da sua conta e enviaremos um link para criar uma senha nova.
        </p>
      )}

      {erro && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
        >
          {erro}
        </p>
      )}

      {aviso && (
        <p className="rounded-lg border border-marca-400 bg-marca-50 p-3 text-sm dark:bg-marca-950/50">
          {aviso}
        </p>
      )}

      <Botao type="submit" tamanho="lg" className="w-full" disabled={enviando}>
        {enviando
          ? "Aguarde…"
          : modo === "entrar"
            ? "Entrar"
            : "Enviar link de recuperação"}
      </Botao>

      {modo === "recuperar" && (
        <button
          type="button"
          onClick={() => setModo("entrar")}
          className="w-full text-center text-sm font-semibold text-marca-700 hover:underline dark:text-marca-300"
        >
          Voltar para o login
        </button>
      )}
    </form>
  );
}
