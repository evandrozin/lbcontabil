import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase do navegador, com a chave pública (anon).
 *
 * Esta chave pode ir para o bundle: ela não dá acesso a nada por si só.
 * Quem decide o que cada usuário enxerga é o RLS — e as tabelas deste
 * projeto só liberam LEITURA das linhas do próprio assinante.
 *
 * Nunca use a service_role aqui. Ela ignora RLS e, no bundle, entregaria
 * o banco inteiro a quem abrisse o devtools.
 */
export function supabaseNavegador() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !chave) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createBrowserClient(url, chave);
}
