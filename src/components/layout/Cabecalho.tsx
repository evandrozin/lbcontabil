import Link from "next/link";
import { NAVEGACAO, SITE, linkWhatsApp } from "@/lib/config";
import { BotaoLink, Container } from "@/components/ui/primitivos";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold">
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-lg bg-marca-600 text-sm font-black text-white dark:bg-marca-500 dark:text-marca-950"
      >
        LB
      </span>
      <span className="text-lg tracking-tight">{SITE.nome}</span>
    </Link>
  );
}

export function Cabecalho() {
  return (
    <header className="sticky top-0 z-50 border-b border-borda bg-fundo/85 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Principal" className="hidden items-center gap-6 lg:flex">
          {NAVEGACAO.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-texto-suave transition-colors hover:text-texto"
            >
              {item.rotulo}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <BotaoLink
            href={linkWhatsApp("Olá! Vim pelo site e quero falar sobre contabilidade.")}
            variante="secundario"
          >
            WhatsApp
          </BotaoLink>
          <BotaoLink href="/simulador">Simular meu plano</BotaoLink>
        </div>

        {/* Menu mobile sem JavaScript: <details> já dá disclosure acessível. */}
        <details className="relative sm:hidden [&[open]_svg]:rotate-90">
          <summary
            className="flex size-10 cursor-pointer list-none items-center justify-center rounded-lg border border-borda"
            aria-label="Abrir menu"
          >
            <svg viewBox="0 0 20 20" className="size-5 transition-transform" fill="currentColor" aria-hidden="true">
              <path d="M3 5.5h14v1.5H3zM3 9.25h14v1.5H3zM3 13h14v1.5H3z" />
            </svg>
          </summary>
          <div className="absolute right-0 mt-2 w-60 rounded-xl border border-borda bg-superficie p-2 shadow-xl">
            {NAVEGACAO.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-fundo-suave"
              >
                {item.rotulo}
              </Link>
            ))}
            <div className="mt-2 border-t border-borda pt-2">
              <BotaoLink href="/simulador" className="w-full">
                Simular meu plano
              </BotaoLink>
            </div>
          </div>
        </details>
      </Container>
    </header>
  );
}
