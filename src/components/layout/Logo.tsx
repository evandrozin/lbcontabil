import { cn } from "@/components/ui/primitivos";

/**
 * Marca Agrotábil MS desenhada em SVG.
 *
 * Por que não usar o arquivo de imagem: o material recebido é um mockup 3D
 * aplicado numa parede — fundo opaco, textura, relevo e perspectiva. Num
 * cabeçalho ele apareceria como um retângulo bege sobre o site.
 *
 * ⚠️ Esta é uma RECONSTRUÇÃO fiel aos elementos (espiga, barras crescentes,
 * seta e laço), não o arquivo original do designer. Quando conseguir o
 * vetor (.ai, .eps ou .svg) com quem criou a logo, substitua este
 * componente — o traço da espiga e o laço têm nuances que só o original
 * reproduz.
 *
 * O símbolo carrega as cores da marca; o texto herda `currentColor`, para
 * continuar legível no tema claro e no escuro.
 */
export function SimboloAgrotabil({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-hidden="true"
      className={cn("size-9", className)}
    >
      <defs>
        <linearGradient id="agro-verde" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--color-agro-700)" />
          <stop offset="100%" stopColor="var(--color-agro-400)" />
        </linearGradient>
        <linearGradient id="agro-azul" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-marca-700)" />
          <stop offset="55%" stopColor="var(--color-marca-400)" />
          <stop offset="100%" stopColor="var(--color-marca-600)" />
        </linearGradient>
      </defs>

      {/* Espiga de trigo */}
      <path
        d="M8 42V16"
        stroke="url(#agro-verde)"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
      <g fill="url(#agro-verde)">
        <ellipse cx="8" cy="14" rx="1.6" ry="3.2" />
        {[19, 24, 29, 34].map((y) => (
          <g key={y}>
            <ellipse cx="5.2" cy={y} rx="2.6" ry="1.45" transform={`rotate(-38 5.2 ${y})`} />
            <ellipse cx="10.8" cy={y} rx="2.6" ry="1.45" transform={`rotate(38 10.8 ${y})`} />
          </g>
        ))}
      </g>

      {/* Barras crescentes */}
      <g fill="url(#agro-verde)">
        <rect x="15" y="30" width="5" height="12" rx="1" />
        <rect x="21" y="24" width="5" height="18" rx="1" />
        <rect x="27" y="18" width="5" height="24" rx="1" />
      </g>

      {/* Seta de crescimento. A base da ponta fica 5 unidades acima do topo
          da barra mais alta — encostada, ela lê como um triângulo apoiado
          na barra em vez de uma seta. */}
      <path
        d="M34.5 42V13h4.5v29zM36.75 4 42 13H31.5z"
        fill="url(#agro-verde)"
      />

      {/* Laço azul, por cima */}
      <path
        d="M3.5 33c5.5 7.5 15 6.5 22-0.5C32 26 38 17.5 45.5 12"
        stroke="url(#agro-azul)"
        strokeWidth="3.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M6.5 39.5c6.5 4 14.5 2 20.5-4C33 29.5 38.5 23 44.5 18.5"
        stroke="url(#agro-azul)"
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
    </svg>
  );
}

export function Logo({
  className,
  comTagline = false,
}: {
  className?: string;
  comTagline?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <SimboloAgrotabil />
      <span className="leading-none">
        <span className="block text-lg font-black tracking-tight">
          AGROTÁBIL{" "}
          <span className="text-marca-600 dark:text-marca-300">MS</span>
        </span>
        {comTagline && (
          <span className="mt-1 block text-[10px] font-medium tracking-wide text-texto-suave">
            Contabilidade · Consultoria · Auditoria
          </span>
        )}
      </span>
    </span>
  );
}
