import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Renova a sessão a cada requisição e barra o acesso à área do assinante.
 *
 * O middleware é a primeira barreira, não a única: cada página da área
 * confirma o usuário de novo com `usuarioAtual()`, e o RLS cobre o banco.
 * Middleware sozinho protege a rota, não o dado.
 */
export async function middleware(requisicao: NextRequest) {
  let resposta = NextResponse.next({ request: requisicao });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sem Supabase configurado (ambiente de desenvolvimento), a área
  // exibe a própria tela de indisponível em vez de quebrar aqui.
  if (!url || !chave) return resposta;

  const supabase = createServerClient(url, chave, {
    cookies: {
      getAll: () => requisicao.cookies.getAll(),
      setAll: (lista) => {
        for (const { name, value } of lista) {
          requisicao.cookies.set(name, value);
        }
        resposta = NextResponse.next({ request: requisicao });
        for (const { name, value, options } of lista) {
          resposta.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = requisicao.nextUrl.pathname;

  if (!user && caminho.startsWith("/area")) {
    const destino = requisicao.nextUrl.clone();
    destino.pathname = "/entrar";
    // Volta para onde a pessoa queria ir depois de entrar.
    destino.searchParams.set("destino", caminho);
    return NextResponse.redirect(destino);
  }

  if (user && caminho === "/entrar") {
    const destino = requisicao.nextUrl.clone();
    destino.pathname = "/area";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  return resposta;
}

export const config = {
  matcher: ["/area/:path*", "/entrar"],
};
