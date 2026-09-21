import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com service_role — ignora RLS e enxerga tudo.
 *
 * NUNCA importe este módulo em componente "use client": a chave daria
 * acesso irrestrito ao banco a quem abrisse o bundle. Todas as tabelas
 * deste projeto têm RLS ligado sem policy, então só este cliente lê.
 */

let clienteMemo: SupabaseClient | null = null;

export function supabaseServidor(): SupabaseClient {
  if (clienteMemo) return clienteMemo;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chave) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  clienteMemo = createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return clienteMemo;
}

/** Permite que o funil rode em dev sem banco, sem derrubar a aplicação. */
export function supabaseDisponivel(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
