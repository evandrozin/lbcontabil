import { NextResponse } from "next/server";
import { assinaturaDoUsuario, usuarioAtual } from "@/lib/supabase/sessao";
import { declararPagamento } from "@/lib/obrigacoes/sincronizacao";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cliente declara que pagou uma guia.
 *
 * O id da linha vem do corpo, mas NÃO é ele que autoriza: a escrita é
 * filtrada pela assinatura do usuário da sessão. Saber o id da obrigação
 * de outro cliente não serve de nada.
 */
export async function POST(requisicao: Request) {
  const usuario = await usuarioAtual();
  if (!usuario) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const assinatura = await assinaturaDoUsuario(usuario.id);
  if (!assinatura) {
    return NextResponse.json({ erro: "Assinatura não encontrada." }, { status: 404 });
  }

  let corpo: unknown;
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const id = (corpo as { id?: unknown })?.id;
  if (typeof id !== "string" || id.length === 0) {
    return NextResponse.json({ erro: "Obrigação não informada." }, { status: 422 });
  }

  const ok = await declararPagamento(assinatura.id, id);
  if (!ok) {
    return NextResponse.json(
      { erro: "Não encontramos essa guia na sua conta." },
      { status: 404 },
    );
  }

  return NextResponse.json({ registrado: true });
}
