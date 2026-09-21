import { NextResponse } from "next/server";
import { supabaseDisponivel, supabaseServidor } from "@/lib/supabase/servidor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "documentos-onboarding";
const TAMANHO_MAXIMO = 20 * 1024 * 1024; // 20 MB, igual ao limite do bucket
const TIPOS_ACEITOS = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/xml",
  "text/xml",
]);

/**
 * Nome de arquivo seguro para o storage: sem acento, sem caminho e sem
 * caractere de controle. Um "../" aqui viraria escrita fora da pasta do
 * cliente, então nada do nome original é aproveitado sem passar por isto.
 */
function sanitizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
}

export async function POST(
  requisicao: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!supabaseDisponivel()) {
    return NextResponse.json(
      { erro: "Envio de documentos indisponível no momento." },
      { status: 503 },
    );
  }

  const supabase = supabaseServidor();

  // O token do onboarding é o que autoriza a escrita. Sem assinatura
  // correspondente, nem lemos o corpo da requisição.
  const { data: assinatura } = await supabase
    .from("assinaturas")
    .select("id, segmento_id")
    .eq("onboarding_token", token)
    .maybeSingle();

  if (!assinatura) {
    return NextResponse.json({ erro: "Onboarding não encontrado." }, { status: 404 });
  }

  const formulario = await requisicao.formData();
  const arquivo = formulario.get("arquivo");
  const tipo = formulario.get("tipo");

  if (!(arquivo instanceof File) || typeof tipo !== "string" || !tipo) {
    return NextResponse.json({ erro: "Arquivo ou tipo ausente." }, { status: 400 });
  }

  if (arquivo.size === 0) {
    return NextResponse.json({ erro: "O arquivo está vazio." }, { status: 400 });
  }

  if (arquivo.size > TAMANHO_MAXIMO) {
    return NextResponse.json(
      { erro: "Arquivo acima de 20 MB. Comprima ou divida em partes." },
      { status: 413 },
    );
  }

  if (!TIPOS_ACEITOS.has(arquivo.type)) {
    return NextResponse.json(
      { erro: "Formato não aceito. Envie PDF, JPG, PNG ou XML." },
      { status: 415 },
    );
  }

  const nomeSeguro = sanitizarNome(arquivo.name);
  const caminho = `${assinatura.id}/${sanitizarNome(tipo)}/${crypto.randomUUID()}-${nomeSeguro}`;

  const { error: erroUpload } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });

  if (erroUpload) {
    console.error("[onboarding] falha no upload", erroUpload);
    return NextResponse.json({ erro: "Falha ao enviar o arquivo." }, { status: 500 });
  }

  const { error: erroRegistro } = await supabase.from("documentos_onboarding").insert({
    assinatura_id: assinatura.id,
    tipo,
    nome_arquivo: arquivo.name,
    caminho_storage: caminho,
    tamanho_bytes: arquivo.size,
    content_type: arquivo.type,
  });

  if (erroRegistro) {
    // Arquivo sem registro vira lixo invisível no bucket — removemos.
    await supabase.storage.from(BUCKET).remove([caminho]);
    console.error("[onboarding] falha ao registrar documento", erroRegistro);
    return NextResponse.json({ erro: "Falha ao registrar o documento." }, { status: 500 });
  }

  return NextResponse.json({ enviado: true, tipo, nome: arquivo.name });
}
