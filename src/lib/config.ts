/** Domínio usado quando nada foi configurado no ambiente. */
const URL_PADRAO = "https://agrotabilms.com.br";

/**
 * Normaliza uma URL vinda de variável de ambiente.
 *
 * Aceita os erros previsíveis de quem preenche painel de deploy: espaço
 * sobrando, barra no fim e host sem protocolo ("agrotabilms.vercel.app").
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
  nome: "Agrotábil MS",
  /** Assinatura que acompanha a logo. */
  tagline: "Contabilidade, Consultoria, Auditoria Contábil",
  slogan: "Contabilidade e consultoria para o agro e para empresas de todos os portes",
  descricao:
    "Contabilidade, consultoria e auditoria com preço transparente para produtor rural, MEI, Simples Nacional, Lucro Presumido e comércio. Atendimento humano por WhatsApp.",
  url: resolverUrlDoSite(),

  // TODO: substituir pelos dados reais antes de ir ao ar.
  razaoSocial: "Agrotábil MS Contabilidade e Consultoria Ltda.",
  cnpj: "00.000.000/0001-00",
  crc: "CRC-MS 000000/O-0",
  email: "contato@agrotabilms.com.br",
  /** Somente dígitos, com DDI — formato exigido pelo link wa.me. */
  whatsapp: "5500000000000",
  whatsappExibicao: "(00) 00000-0000",
  /** TODO: confirmar a praça. Inferido do "MS" da marca. */
  endereco: "Campo Grande — MS",
} as const;

export function linkWhatsApp(mensagem: string): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}

export const NAVEGACAO = [
  { href: "/calculadora-reforma", rotulo: "Calculadora da reforma" },
  { href: "/calendario", rotulo: "Calendário fiscal" },
  { href: "/planos", rotulo: "Planos e preços" },
  { href: "/simulador", rotulo: "Simulador" },
  { href: "/segmentos/produtor-rural", rotulo: "Produtor rural" },
  { href: "/abrir-empresa", rotulo: "Abrir empresa" },
] as const;
