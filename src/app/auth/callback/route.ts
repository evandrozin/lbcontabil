import { NextResponse, type NextRequest } from "next/server";
import { clienteDaSessao, supabaseConfigurado } from "@/lib/supabase/sessao";

export const dynamic = "force-dynamic";

/**
 * Troca o código do e-mail por uma sessão.
 *
 * É para onde o link de recuperação de senha aponta. O código é de uso
 * único e tem validade curta — quem chegar aqui com um link já usado cai
 * de volta no login com aviso, não numa tela branca.
 */
export async function GET(requisicao: NextRequest) {
  const { searchParams, origin } = requisicao.nextUrl;
  const codigo = searchParams.get("code");
  const proximo = searchParams.get("proximo");

  // Mesmo cuidado do login: só caminho interno vira destino.
  const destino =
    proximo && proximo.startsWith("/") && !proximo.startsWith("//") ? proximo : "/area";

  if (!codigo || !supabaseConfigurado()) {
    return NextResponse.redirect(`${origin}/entrar?erro=link-invalido`);
  }

  const supabase = await clienteDaSessao();
  const { error } = await supabase.auth.exchangeCodeForSession(codigo);

  if (error) {
    return NextResponse.redirect(`${origin}/entrar?erro=link-expirado`);
  }

  return NextResponse.redirect(`${origin}${destino}`);
}
