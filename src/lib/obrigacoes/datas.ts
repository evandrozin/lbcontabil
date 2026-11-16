/**
 * Aritmética de datas para prazos fiscais.
 *
 * Tudo aqui trabalha com string ISO (YYYY-MM-DD) e UTC. Nunca com Date
 * local: `new Date("2026-12-20")` é meia-noite UTC e, em UTC−3, volta um
 * dia. Num vencimento de guia isso faz o cliente pagar atrasado — já nos
 * mordeu uma vez no banner da janela do Simples híbrido.
 */

export type DataIso = string;

const MS_DIA = 86_400_000;

export function paraUtc(iso: DataIso): number {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

export function deUtc(ms: number): DataIso {
  return new Date(ms).toISOString().slice(0, 10);
}

export function somarDias(iso: DataIso, dias: number): DataIso {
  return deUtc(paraUtc(iso) + dias * MS_DIA);
}

export function diferencaEmDias(de: DataIso, ate: DataIso): number {
  return Math.round((paraUtc(ate) - paraUtc(de)) / MS_DIA);
}

/** 0 = domingo, 6 = sábado. */
export function diaDaSemana(iso: DataIso): number {
  return new Date(paraUtc(iso)).getUTCDay();
}

export function ehFimDeSemana(iso: DataIso): boolean {
  const d = diaDaSemana(iso);
  return d === 0 || d === 6;
}

export function montarData(ano: number, mes: number, dia: number): DataIso {
  return deUtc(Date.UTC(ano, mes - 1, dia));
}

export function ultimoDiaDoMes(ano: number, mes: number): DataIso {
  // Dia 0 do mês seguinte é o último dia deste mês.
  return deUtc(Date.UTC(ano, mes, 0));
}

export function anoDe(iso: DataIso): number {
  return Number(iso.slice(0, 4));
}

export function mesDe(iso: DataIso): number {
  return Number(iso.slice(5, 7));
}

export function diaDe(iso: DataIso): number {
  return Number(iso.slice(8, 10));
}

/** Avança `n` meses preservando o ano, sem estourar o dia. */
export function somarMeses(ano: number, mes: number, n: number): {
  ano: number;
  mes: number;
} {
  const total = (ano * 12 + (mes - 1)) + n;
  return { ano: Math.floor(total / 12), mes: (total % 12) + 1 };
}

/** dd/mm/aaaa, sem passar por Date — o fuso não entra na conta. */
export function formatarBr(iso: DataIso): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}
