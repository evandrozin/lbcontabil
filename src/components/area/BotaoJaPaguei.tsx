"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@/components/ui/primitivos";

export function BotaoJaPaguei({
  obrigacaoLinhaId,
  declaradoEm,
}: {
  obrigacaoLinhaId: string;
  declaradoEm: string | null;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [declarado, setDeclarado] = useState(Boolean(declaradoEm));

  async function declarar() {
    setEnviando(true);
    setErro(null);

    try {
      const resposta = await fetch("/api/area/pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: obrigacaoLinhaId }),
      });

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => ({}));
        setErro(corpo.erro ?? "Não conseguimos registrar agora.");
        return;
      }

      setDeclarado(true);
      router.refresh();
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setEnviando(false);
    }
  }

  if (declarado) {
    return (
      <p className="text-xs text-texto-suave">
        Pagamento informado. Vamos conferir na Receita e dar baixa.
      </p>
    );
  }

  return (
    <div>
      <Botao variante="secundario" onClick={declarar} disabled={enviando}>
        {enviando ? "Registrando…" : "Já paguei"}
      </Botao>
      {erro && (
        <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
          {erro}
        </p>
      )}
    </div>
  );
}
