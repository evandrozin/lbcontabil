"use client";

import { useRef, useState } from "react";
import type { ItemChecklist } from "@/lib/onboarding/checklist";
import { Botao, Check, Selo, cn } from "@/components/ui/primitivos";

type Estado = "pendente" | "enviando" | "enviado" | "erro";

export function ItemUpload({
  token,
  item,
  arquivosExistentes,
}: {
  token: string;
  item: ItemChecklist;
  arquivosExistentes: string[];
}) {
  const [arquivos, setArquivos] = useState<string[]>(arquivosExistentes);
  const [estado, setEstado] = useState<Estado>(
    arquivosExistentes.length > 0 ? "enviado" : "pendente",
  );
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function enviar(arquivo: File) {
    setEstado("enviando");
    setMensagemErro(null);

    const dados = new FormData();
    dados.append("arquivo", arquivo);
    dados.append("tipo", item.id);

    try {
      const resposta = await fetch(
        `/api/onboarding/${encodeURIComponent(token)}/documentos`,
        { method: "POST", body: dados },
      );
      const corpo = await resposta.json();

      if (!resposta.ok) {
        setEstado("erro");
        setMensagemErro(corpo.erro ?? "Não conseguimos enviar o arquivo.");
        return;
      }

      setArquivos((atual) => [...atual, arquivo.name]);
      setEstado("enviado");
    } catch {
      setEstado("erro");
      setMensagemErro("Falha de conexão durante o envio.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const concluido = arquivos.length > 0;

  return (
    <li
      className={cn(
        "rounded-xl border p-5 transition-colors",
        concluido ? "border-marca-400 bg-marca-50/50 dark:bg-marca-950/30" : "border-borda bg-superficie",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {concluido && <Check className="size-5" />}
            <h3 className="font-semibold">{item.nome}</h3>
            {!item.obrigatorio && <Selo tom="neutro">Opcional</Selo>}
          </div>
          <p className="mt-1.5 text-sm text-texto-suave">{item.descricao}</p>

          {arquivos.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-texto-suave">
              {arquivos.map((nome, indice) => (
                <li key={`${nome}-${indice}`} className="flex items-center gap-1.5">
                  <Check className="size-3.5" />
                  <span className="truncate">{nome}</span>
                </li>
              ))}
            </ul>
          )}

          {mensagemErro && (
            <p role="alert" className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
              {mensagemErro}
            </p>
          )}
        </div>

        <div className="shrink-0">
          <input
            ref={inputRef}
            id={`arquivo-${item.id}`}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.xml"
            className="sr-only"
            onChange={(e) => {
              const arquivo = e.target.files?.[0];
              if (arquivo) void enviar(arquivo);
            }}
          />
          <Botao
            type="button"
            variante={concluido ? "secundario" : "primario"}
            disabled={estado === "enviando"}
            onClick={() => inputRef.current?.click()}
          >
            {estado === "enviando"
              ? "Enviando…"
              : concluido
                ? "Enviar outro"
                : "Enviar arquivo"}
          </Botao>
        </div>
      </div>
    </li>
  );
}
