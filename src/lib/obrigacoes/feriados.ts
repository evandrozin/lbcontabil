import { deUtc, ehFimDeSemana, montarData, somarDias, type DataIso } from "./datas";

/**
 * Feriados e dias sem expediente bancário.
 *
 * O que importa para prazo fiscal não é "feriado" no sentido civil, é
 * **expediente bancário**. Carnaval, por exemplo, não é feriado nacional
 * por lei, mas banco não abre — e guia não é paga.
 *
 * Feriados municipais e estaduais NÃO estão aqui: variam por praça e
 * precisam ser injetados por quem conhece a cidade do cliente.
 */

export interface Feriado {
  data: DataIso;
  nome: string;
  /** Móvel = calculado a partir da Páscoa. */
  movel: boolean;
}

/**
 * Domingo de Páscoa pelo algoritmo de Meeus/Jones/Butcher (calendário
 * gregoriano). É a âncora de Carnaval, Sexta-feira Santa e Corpus Christi.
 */
export function domingoDePascoa(ano: number): DataIso {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return deUtc(Date.UTC(ano, mes - 1, dia));
}

/**
 * Feriados nacionais fixos.
 *
 * O 20 de novembro virou feriado nacional pela Lei 14.759/2023. Antes
 * disso era municipal em parte do país — se algum dia o sistema precisar
 * calcular prazo retroativo a 2023, esta lista precisa de recorte por ano.
 */
const FIXOS: { mes: number; dia: number; nome: string }[] = [
  { mes: 1, dia: 1, nome: "Confraternização Universal" },
  { mes: 4, dia: 21, nome: "Tiradentes" },
  { mes: 5, dia: 1, nome: "Dia do Trabalho" },
  { mes: 9, dia: 7, nome: "Independência" },
  { mes: 10, dia: 12, nome: "Nossa Senhora Aparecida" },
  { mes: 11, dia: 2, nome: "Finados" },
  { mes: 11, dia: 15, nome: "Proclamação da República" },
  { mes: 11, dia: 20, nome: "Consciência Negra" },
  { mes: 12, dia: 25, nome: "Natal" },
];

export function feriadosNacionais(ano: number): Feriado[] {
  const pascoa = domingoDePascoa(ano);

  const moveis: Feriado[] = [
    // Carnaval não é feriado nacional por lei, mas não há expediente
    // bancário — e é isso que define se a guia pode ser paga.
    { data: somarDias(pascoa, -48), nome: "Carnaval (segunda)", movel: true },
    { data: somarDias(pascoa, -47), nome: "Carnaval (terça)", movel: true },
    { data: somarDias(pascoa, -2), nome: "Sexta-feira Santa", movel: true },
    { data: somarDias(pascoa, 60), nome: "Corpus Christi", movel: true },
  ];

  const fixos: Feriado[] = FIXOS.map((f) => ({
    data: montarData(ano, f.mes, f.dia),
    nome: f.nome,
    movel: false,
  }));

  return [...fixos, ...moveis].sort((a, b) => a.data.localeCompare(b.data));
}

/** Índice de feriados cobrindo os anos pedidos, para consulta rápida. */
export function mapaDeFeriados(anos: number[], extras: Feriado[] = []): Set<DataIso> {
  const conjunto = new Set<DataIso>();
  for (const ano of anos) {
    for (const f of feriadosNacionais(ano)) conjunto.add(f.data);
  }
  for (const f of extras) conjunto.add(f.data);
  return conjunto;
}

export interface OpcoesDiaUtil {
  /** Feriados municipais/estaduais da praça do cliente. */
  feriadosExtras?: Feriado[];
}

function conjuntoPara(iso: DataIso, opcoes?: OpcoesDiaUtil): Set<DataIso> {
  const ano = Number(iso.slice(0, 4));
  // Anos vizinhos entram porque um ajuste pode atravessar a virada.
  return mapaDeFeriados([ano - 1, ano, ano + 1], opcoes?.feriadosExtras ?? []);
}

export function ehDiaUtilBancario(iso: DataIso, opcoes?: OpcoesDiaUtil): boolean {
  if (ehFimDeSemana(iso)) return false;
  return !conjuntoPara(iso, opcoes).has(iso);
}

/** Primeiro dia útil a partir da data (inclusive). */
export function proximoDiaUtil(iso: DataIso, opcoes?: OpcoesDiaUtil): DataIso {
  let atual = iso;
  // 10 passos cobrem qualquer emenda de feriado real sem risco de loop.
  for (let i = 0; i < 10; i++) {
    if (ehDiaUtilBancario(atual, opcoes)) return atual;
    atual = somarDias(atual, 1);
  }
  return atual;
}

/** Último dia útil até a data (inclusive). */
export function diaUtilAnterior(iso: DataIso, opcoes?: OpcoesDiaUtil): DataIso {
  let atual = iso;
  for (let i = 0; i < 10; i++) {
    if (ehDiaUtilBancario(atual, opcoes)) return atual;
    atual = somarDias(atual, -1);
  }
  return atual;
}

export function ultimoDiaUtilDoMes(
  ano: number,
  mes: number,
  opcoes?: OpcoesDiaUtil,
): DataIso {
  return diaUtilAnterior(deUtc(Date.UTC(ano, mes, 0)), opcoes);
}
