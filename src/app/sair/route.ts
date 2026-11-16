import { NextResponse, type NextRequest } from "next/server";
import { clienteDaSessao, supabaseConfigurado } from "@/lib/supabase/sessao";

export const dynamic = "force-dynamic";

/**
 * Sair é POST, não GET.
 *
 * Com GET, qualquer `<img src="/sair">` numa página de terceiro
 * derrubaria a sessão do cliente — irritante, e evitável.
 */
export async function POST(requisicao: NextRequest) {
  if (supabaseConfigurado()) {
    const supabase = await clienteDaSessao();
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(new URL("/entrar", requisicao.nextUrl.origin), {
    status: 303,
  });
}
