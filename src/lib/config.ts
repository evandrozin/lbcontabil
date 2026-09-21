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
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://lbcontabil.com.br",

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
  { href: "/planos", rotulo: "Planos e preços" },
  { href: "/simulador", rotulo: "Simulador" },
  { href: "/segmentos/produtor-rural", rotulo: "Produtor rural" },
  { href: "/abrir-empresa", rotulo: "Abrir empresa" },
] as const;
