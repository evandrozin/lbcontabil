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

/**
 * Formata uma data ISO (YYYY-MM-DD) como dd/mm/aaaa.
 *
 * NÃO use `new Date(iso).toLocaleDateString()` para isto: a string sem
 * horário é interpretada como meia-noite UTC, e em UTC−3 a data volta um
 * dia. Num prazo legal — "a opção vai até 30/09" virando 29/09 — isso faz
 * o cliente perder a janela.
 */
export function dataIsoParaBr(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}
