"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { Botao, Cartao, Container, cn } from "@/components/ui/primitivos";

const CLASSE_INPUT =
  "mt-1.5 w-full rounded-lg border border-borda bg-superficie px-3 py-2.5 text-sm outline-none focus:border-marca-500";

/** Mínimo nosso, acima do padrão do provedor. */
const MINIMO_CARACTERES = 10;

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const curta = senha.length > 0 && senha.length < MINIMO_CARACTERES;
  const diferente = confirmacao.length > 0 && senha !== confirmacao;

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (senha.length < MINIMO_CARACTERES) {
      setErro(`A senha precisa ter ao menos ${MINIMO_CARACTERES} caracteres.`);
      return;
    }
    if (senha !== confirmacao) {
      setErro("As duas senhas não são iguais.");
      return;
    }

    setEnviando(true);
    try {
      const supabase = supabaseNavegador();
      const { error } = await supabase.auth.updateUser({ password: senha });

      if (error) {
        // Chega aqui quando o link do e-mail expirou e não há sessão.
        setErro(
          "Não conseguimos salvar a senha. O link pode ter expirado — peça um novo na tela de login.",
        );
        return;
      }

      router.refresh();
      router.push("/area");
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold tracking-tight">Criar nova senha</h1>
        <p className="mt-2 text-texto-suave">
          Use ao menos {MINIMO_CARACTERES} caracteres. Evite repetir uma senha que você
          já usa em outro serviço.
        </p>

        <Cartao className="mt-8">
          <form onSubmit={salvar} className="space-y-5" noValidate>
            <div>
              <label htmlFor="senha" className="block text-sm font-semibold">
                Nova senha
              </label>
              <input
                id="senha"
                type="password"
                autoComplete="new-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className={cn(CLASSE_INPUT, curta && "border-red-400")}
              />
              {curta && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Faltam {MINIMO_CARACTERES - senha.length} caractere(s).
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmacao" className="block text-sm font-semibold">
                Repita a senha
              </label>
              <input
                id="confirmacao"
                type="password"
                autoComplete="new-password"
                required
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                className={cn(CLASSE_INPUT, diferente && "border-red-400")}
              />
              {diferente && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  As duas senhas não são iguais.
                </p>
              )}
            </div>

            {erro && (
              <p
                role="alert"
                className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
              >
                {erro}
              </p>
            )}

            <Botao type="submit" tamanho="lg" className="w-full" disabled={enviando}>
              {enviando ? "Salvando…" : "Salvar e entrar"}
            </Botao>
          </form>
        </Cartao>
      </div>
    </Container>
  );
}
