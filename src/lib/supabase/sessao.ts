import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseServidor } from "./servidor";

/**
 * Sessão do assinante no servidor.
 *
 * Duas coisas diferentes vivem aqui e não devem ser confundidas:
 *
 * - `clienteDaSessao()` fala como o USUÁRIO, com a chave pública. O RLS
 *   se aplica, então ele só enxerga as próprias linhas.
 * - `supabaseServidor()` (no outro módulo) fala como service_role e vê
 *   tudo. Só é usado depois de confirmar a sessão e sempre com o id da
 *   assinatura do próprio usuário no filtro.
 */

export function supabaseConfigurado(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function clienteDaSessao() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const armazem = await cookies();

  return createServerClient(url, chave, {
    cookies: {
      getAll: () => armazem.getAll(),
      setAll: (lista) => {
        try {
          for (const { name, value, options } of lista) {
            armazem.set(name, value, options);
          }
        } catch {
          // Server Component não pode escrever cookie. O middleware já
          // renovou a sessão nesta requisição, então ignorar é seguro.
        }
      },
    },
  });
}

export interface UsuarioAutenticado {
  id: string;
  email: string;
}

/**
 * Usuário da requisição, validado no servidor de autenticação.
 *
 * Usa `getUser()` e não `getSession()`: a sessão vem do cookie e o cookie
 * pode ter sido forjado. `getUser()` confere o token com o Supabase antes
 * de devolver qualquer coisa.
 */
export async function usuarioAtual(): Promise<UsuarioAutenticado | null> {
  if (!supabaseConfigurado()) return null;

  const supabase = await clienteDaSessao();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user?.email) return null;
  return { id: data.user.id, email: data.user.email };
}

export interface AssinaturaDoUsuario {
  id: string;
  plano_id: string;
  segmento_id: string;
  periodicidade: string;
  valor_mensal_centavos: number;
  status: string;
  responsavel_nome: string;
  responsavel_email: string;
  empresa_razao_social: string | null;
  empresa_cnpj: string | null;
  ja_tem_empresa: boolean;
  onboarding_token: string;
  criado_em: string;
}

/**
 * Assinatura ligada ao usuário logado.
 *
 * A consulta roda como service_role, mas SEMPRE filtrando por
 * `usuario_id` igual ao id confirmado por `usuarioAtual()`. O RLS ainda
 * cobre o caso de a consulta vir de outro caminho.
 */
export async function assinaturaDoUsuario(
  usuarioId: string,
): Promise<AssinaturaDoUsuario | null> {
  const { data } = await supabaseServidor()
    .from("assinaturas")
    .select(
      "id, plano_id, segmento_id, periodicidade, valor_mensal_centavos, status, responsavel_nome, responsavel_email, empresa_razao_social, empresa_cnpj, ja_tem_empresa, onboarding_token, criado_em",
    )
    .eq("usuario_id", usuarioId)
    .maybeSingle<AssinaturaDoUsuario>();

  return data ?? null;
}
