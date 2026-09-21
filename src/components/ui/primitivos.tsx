import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>
  );
}

export function Secao({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("py-14 sm:py-20", className)}>
      <Container>{children}</Container>
    </section>
  );
}

export function TituloSecao({
  sobretitulo,
  titulo,
  descricao,
  centralizado = false,
}: {
  sobretitulo?: string;
  titulo: string;
  descricao?: string;
  centralizado?: boolean;
}) {
  return (
    <div className={cn("max-w-3xl", centralizado && "mx-auto text-center")}>
      {sobretitulo && (
        <p className="mb-2 text-sm font-semibold tracking-wide text-marca-600 uppercase dark:text-marca-300">
          {sobretitulo}
        </p>
      )}
      <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{titulo}</h2>
      {descricao && (
        <p className="mt-4 text-pretty text-lg text-texto-suave">{descricao}</p>
      )}
    </div>
  );
}

type VarianteBotao = "primario" | "secundario" | "fantasma";
type TamanhoBotao = "md" | "lg";

const VARIANTES: Record<VarianteBotao, string> = {
  primario:
    "bg-marca-600 text-white hover:bg-marca-700 active:bg-marca-800 shadow-sm dark:bg-marca-500 dark:hover:bg-marca-400 dark:text-marca-950",
  secundario:
    "bg-superficie text-texto border border-borda hover:border-marca-400 hover:text-marca-700 dark:hover:text-marca-200",
  fantasma: "text-marca-700 hover:bg-marca-50 dark:text-marca-200 dark:hover:bg-marca-900/40",
};

const TAMANHOS: Record<TamanhoBotao, string> = {
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

function classesBotao(variante: VarianteBotao, tamanho: TamanhoBotao, className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTES[variante],
    TAMANHOS[tamanho],
    className,
  );
}

export function BotaoLink({
  href,
  variante = "primario",
  tamanho = "md",
  className,
  children,
  ...props
}: {
  href: string;
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
} & Omit<ComponentProps<typeof Link>, "href">) {
  const externo = href.startsWith("http");
  const classe = classesBotao(variante, tamanho, className);

  if (externo) {
    return (
      <a href={href} className={classe} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classe} {...props}>
      {children}
    </Link>
  );
}

export function Botao({
  variante = "primario",
  tamanho = "md",
  className,
  children,
  ...props
}: {
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
} & ComponentProps<"button">) {
  return (
    <button className={classesBotao(variante, tamanho, className)} {...props}>
      {children}
    </button>
  );
}

export function Cartao({
  children,
  className,
  destaque = false,
}: {
  children: ReactNode;
  className?: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-superficie p-6",
        destaque
          ? "border-marca-500 ring-2 ring-marca-500/20 shadow-lg"
          : "border-borda shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Selo({
  children,
  tom = "marca",
}: {
  children: ReactNode;
  tom?: "marca" | "destaque" | "neutro";
}) {
  const tons = {
    marca: "bg-marca-100 text-marca-800 dark:bg-marca-900/60 dark:text-marca-100",
    destaque: "bg-destaque-400/20 text-destaque-600 dark:text-destaque-400",
    neutro: "bg-fundo-suave text-texto-suave",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        tons[tom],
      )}
    >
      {children}
    </span>
  );
}

export function Check({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={cn("size-5 shrink-0 text-marca-600 dark:text-marca-300", className)}
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 0 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function Menos({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={cn("size-5 shrink-0 text-texto-suave/50", className)}
      fill="currentColor"
    >
      <path fillRule="evenodd" d="M4 10a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Z" clipRule="evenodd" />
    </svg>
  );
}
