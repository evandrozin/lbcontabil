import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";
import { LISTA_SEGMENTOS } from "@/lib/catalogo/segmentos";

/**
 * Só entram páginas públicas de conteúdo. Checkout e onboarding ficam de
 * fora de propósito — são páginas de sessão, marcadas com noindex.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const agora = new Date();

  const fixas: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, priority: 1, changeFrequency: "weekly" },
    { url: `${SITE.url}/planos`, priority: 0.9, changeFrequency: "weekly" },
    { url: `${SITE.url}/simulador`, priority: 0.9, changeFrequency: "monthly" },
    {
      url: `${SITE.url}/calculadora-reforma`,
      priority: 0.9,
      changeFrequency: "monthly",
    },
    { url: `${SITE.url}/abrir-empresa`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${SITE.url}/trocar-de-contador`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${SITE.url}/termos`, priority: 0.2, changeFrequency: "yearly" },
    { url: `${SITE.url}/privacidade`, priority: 0.2, changeFrequency: "yearly" },
  ];

  const segmentos: MetadataRoute.Sitemap = LISTA_SEGMENTOS.map((segmento) => ({
    url: `${SITE.url}/segmentos/${segmento.slug}`,
    priority: 0.9,
    changeFrequency: "monthly" as const,
  }));

  return [...fixas, ...segmentos].map((item) => ({ ...item, lastModified: agora }));
}
