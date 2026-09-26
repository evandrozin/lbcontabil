/** Domínio usado quando nada foi configurado no ambiente. */
const URL_PADRAO = "https://lbcontabil.com.br";

/**
 * Normaliza uma URL vinda de variável de ambiente.
 *
 * Aceita os erros previsíveis de quem preenche painel de deploy: espaço
 * sobrando, barra no fim e host sem protocolo ("lbcontabil.vercel.app").
 * Devolve `null` para qualquer coisa que não vire URL válida.
 */
function normalizarUrl(valor: string | undefined): string | null {
  const limpo = valor?.trim().replace(/\/+$/, "");
  if (!limpo) return null;

  const comProtocolo = /^https?:\/\//i.test(limpo) ? limpo : `https://${limpo}`;
  try {
    return new URL(comProtocolo).origin;
  } catch {
    return null;
  }
}

/**
 * Resolve a URL pública do site.
 *
 * Um valor vazio ou inválido NÃO pode derrubar o build: `metadataBase` faz
 * `new URL()` em tempo de compilação, e um `NEXT_PUBLIC_SITE_URL=""` no
 * painel do deploy quebrava a geração de páginas inteira. A ordem de
 * precedência é: variável explícita → host do deploy na Vercel → padrão.
 */
export function resolverUrlDoSite(): string {
  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL;
  return (
    normalizarUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizarUrl(vercel) ??
    URL_PADRAO
  );
}

/**
 * Dados institucionais exibidos no site. Preencha com os dados reais do
 * escritório antes de publicar — CRC e razão social são exigidos pela
 * Resolução CFC para divulgação de serviços contábeis.
 */
export const SITE = {
  nome: "LB Contábil",
  slogan: "Contabilidade online para todo o Brasil",
  descricao:
    "Contabilidade online com preço transparente para MEI, Simples Nacional, Lucro Presumido, comércio e produtor rural. Atendimento humano por WhatsApp em todo o Brasil.",
  url: resolverUrlDoSite(),

  // TODO: substituir pelos dados reais antes de ir ao ar.
  razaoSocial: "LB Contábil Serviços Contábeis Ltda.",
  cnpj: "00.000.000/0001-00",
  crc: "CRC-XX 000000/O-0",
  email: "contato@lbcontabil.com.br",
  /** Somente dígitos, com DDI — formato exigido pelo link wa.me. */
  whatsapp: "5500000000000",
  whatsappExibicao: "(00) 00000-0000",
  endereco: "Cidade — UF",
} as const;

export function linkWhatsApp(mensagem: string): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}

export const NAVEGACAO = [
  { href: "/calculadora-reforma", rotulo: "Calculadora da reforma" },
  { href: "/planos", rotulo: "Planos e preços" },
  { href: "/simulador", rotulo: "Simulador" },
  { href: "/segmentos/produtor-rural", rotulo: "Produtor rural" },
  { href: "/abrir-empresa", rotulo: "Abrir empresa" },
] as const;
