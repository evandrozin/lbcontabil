const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const BRL_INTEIRO = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** R$ 1.290,00 */
export function moeda(centavos: number): string {
  return BRL.format(centavos / 100);
}

/** R$ 1.290 — para headline, onde o centavo só polui. */
export function moedaCurta(centavos: number): string {
  return centavos % 100 === 0 ? BRL_INTEIRO.format(centavos / 100) : moeda(centavos);
}

/** Converte "1.234,56" ou "1234.56" digitado pelo usuário em centavos. */
export function paraCentavos(texto: string): number {
  const limpo = texto.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}\b)/g, "");
  const normalizado = limpo.replace(",", ".");
  const valor = Number.parseFloat(normalizado);
  return Number.isFinite(valor) ? Math.round(valor * 100) : 0;
}

export function plural(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}
