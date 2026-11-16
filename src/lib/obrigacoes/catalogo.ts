import type { SegmentoId } from "@/lib/catalogo/tipos";

/**
 * ════════════════════════════════════════════════════════════════════════
 * CALENDÁRIO DE OBRIGAÇÕES — EXIGE CONFERÊNCIA DO CONTADOR RESPONSÁVEL
 * ════════════════════════════════════════════════════════════════════════
 *
 * Cada entrada aqui vira lembrete no WhatsApp do cliente e tarefa na fila
 * da equipe. Um dia errado nesta tabela não é bug de tela: é multa.
 *
 * Nenhuma linha foi conferida contra fonte oficial ainda (`conferido`
 * false em todas). Enquanto isso não acontecer, o motor marca o calendário
 * como não homologado e a interface precisa dizer isso.
 *
 * Prazos municipais e estaduais (ISS, SPED Fiscal) variam por praça. Os
 * valores abaixo são o caso mais comum e PRECISAM de ajuste por cliente.
 */

export const CALENDARIO_REVISADO_EM = "2026-11-16";
export const CALENDARIO_CONFERIDO_POR: string | null = null;

export type Frequencia = "mensal" | "trimestral" | "anual";

/**
 * O que fazer quando o vencimento cai em dia sem expediente bancário.
 *
 * Não existe regra única no Brasil: contribuição previdenciária e FGTS
 * ANTECIPAM, o DAS do Simples PRORROGA. Por isso o comportamento é
 * declarado por obrigação, nunca assumido globalmente.
 */
export type AjusteVencimento = "antecipa" | "prorroga" | "nenhum";

export type DiaVencimento = number | "ultimo-dia-util";

export interface Obrigacao {
  id: string;
  nome: string;
  descricao: string;
  orgao: string;
  frequencia: Frequencia;
  dia: DiaVencimento;
  /** Meses entre o fim da competência e o vencimento. Só mensal/trimestral. */
  mesesApos?: number;
  /** Mês do vencimento (1-12). Só anual. */
  mesVencimento?: number;
  ajuste: AjusteVencimento;
  segmentos: SegmentoId[];
  /** Só incide sobre quem tem empregado registrado. */
  exigeEmpregados: boolean;
  /** Gera guia para o cliente pagar (vs. apenas declaração a transmitir). */
  geraGuia: boolean;
  /** Norma ou portal de referência. */
  base: string;
  /** Prazo varia por município ou estado. */
  variaPorPraca: boolean;
  /** Já foi conferido contra fonte oficial por um contador. */
  conferido: boolean;
}

const TODOS_PJ: SegmentoId[] = [
  "simples-servicos",
  "simples-comercio",
  "lucro-presumido",
];
const SIMPLES: SegmentoId[] = ["simples-servicos", "simples-comercio"];

export const OBRIGACOES: Obrigacao[] = [
  // ─── Mensais ────────────────────────────────────────────────────────
  {
    id: "das-mei",
    nome: "DAS-MEI",
    descricao:
      "Guia mensal do MEI. Valor fixo sobre o salário mínimo mais ICMS ou ISS — não varia com o faturamento.",
    orgao: "Receita Federal",
    frequencia: "mensal",
    dia: 20,
    mesesApos: 1,
    ajuste: "prorroga",
    segmentos: ["mei"],
    exigeEmpregados: false,
    geraGuia: true,
    base: "LC 123/2006, art. 18-A",
    variaPorPraca: false,
    conferido: false,
  },
  {
    id: "das-simples",
    nome: "DAS do Simples Nacional",
    descricao:
      "Guia única do Simples, apurada no PGDAS-D sobre a receita do mês.",
    orgao: "Receita Federal",
    frequencia: "mensal",
    dia: 20,
    mesesApos: 1,
    ajuste: "prorroga",
    segmentos: SIMPLES,
    exigeEmpregados: false,
    geraGuia: true,
    base: "LC 123/2006; Resolução CGSN",
    variaPorPraca: false,
    conferido: false,
  },
  {
    id: "dctfweb",
    nome: "DCTFWeb",
    descricao:
      "Declaração de débitos previdenciários e de retenções, gerada a partir do fechamento do eSocial.",
    orgao: "Receita Federal",
    frequencia: "mensal",
    dia: 15,
    mesesApos: 1,
    ajuste: "antecipa",
    segmentos: TODOS_PJ,
    exigeEmpregados: false,
    geraGuia: false,
    base: "IN RFB · DCTFWeb",
    variaPorPraca: false,
    conferido: false,
  },
  {
    id: "darf-inss-folha",
    nome: "DARF previdenciário",
    descricao: "INSS patronal e retido da folha, emitido após a DCTFWeb.",
    orgao: "Receita Federal",
    frequencia: "mensal",
    dia: 20,
    mesesApos: 1,
    ajuste: "antecipa",
    segmentos: TODOS_PJ,
    exigeEmpregados: true,
    geraGuia: true,
    base: "Lei 8.212/1991",
    variaPorPraca: false,
    conferido: false,
  },
  {
    id: "fgts-digital",
    nome: "FGTS Digital",
    descricao:
      "Guia do FGTS gerada no portal após o fechamento da folha. Sem API: exige robô assistido ou tarefa manual.",
    orgao: "Ministério do Trabalho",
    frequencia: "mensal",
    dia: 20,
    mesesApos: 1,
    ajuste: "antecipa",
    segmentos: TODOS_PJ,
    exigeEmpregados: true,
    geraGuia: true,
    base: "FGTS Digital",
    variaPorPraca: false,
    conferido: false,
  },
  {
    id: "esocial-periodicos",
    nome: "eSocial — eventos periódicos",
    descricao:
      "Remuneração e fechamento da competência (S-1299). Destrava a DCTFWeb e o FGTS.",
    orgao: "eSocial",
    frequencia: "mensal",
    dia: 15,
    mesesApos: 1,
    ajuste: "antecipa",
    segmentos: TODOS_PJ,
    exigeEmpregados: true,
    geraGuia: false,
    base: "Manual do eSocial",
    variaPorPraca: false,
    conferido: false,
  },
  {
    id: "darf-pis-cofins",
    nome: "DARF de PIS e COFINS",
    descricao:
      "Regime cumulativo do Lucro Presumido. Deixa de existir a partir de 2027, quando a CBS entra integral.",
    orgao: "Receita Federal",
    frequencia: "mensal",
    dia: 25,
    mesesApos: 1,
    ajuste: "antecipa",
    segmentos: ["lucro-presumido"],
    exigeEmpregados: false,
    geraGuia: true,
    base: "Lei 9.718/1998",
    variaPorPraca: false,
    conferido: false,
  },
  {
    id: "efd-contribuicoes",
    nome: "EFD-Contribuições",
    descricao: "Escrituração digital de PIS e COFINS.",
    orgao: "Receita Federal",
    frequencia: "mensal",
    dia: 10,
    mesesApos: 2,
    ajuste: "antecipa",
    segmentos: ["lucro-presumido"],
    exigeEmpregados: false,
    geraGuia: false,
    base: "IN RFB · EFD-Contribuições",
    variaPorPraca: false,
    conferido: false,
  },
  {
    id: "efd-reinf",
    nome: "EFD-Reinf",
    descricao: "Retenções e informações previdenciárias não cobertas pelo eSocial.",
    orgao: "Receita Federal",
    frequencia: "mensal",
    dia: 15,
    mesesApos: 1,
    ajuste: "antecipa",
    segmentos: ["lucro-presumido"],
    exigeEmpregados: false,
    geraGuia: false,
    base: "IN RFB · EFD-Reinf",
    variaPorPraca: false,
    conferido: false,
  },
  {
    id: "sped-fiscal",
    nome: "SPED Fiscal (EFD ICMS/IPI)",
    descricao:
      "Escrituração fiscal de entradas, saídas e estoque. O prazo é definido por cada estado.",
    orgao: "SEFAZ estadual",
    frequencia: "mensal",
    dia: 20,
    mesesApos: 1,
    ajuste: "prorroga",
    segmentos: ["simples-comercio", "lucro-presumido"],
    exigeEmpregados: false,
    geraGuia: false,
    base: "Convênio ICMS; legislação estadual",
    variaPorPraca: true,
    conferido: false,
  },
  {
    id: "iss-municipal",
    nome: "ISS mensal",
    descricao:
      "Imposto sobre serviços fora do Simples. Dia de vencimento definido por cada município.",
    orgao: "Prefeitura",
    frequencia: "mensal",
    dia: 15,
    mesesApos: 1,
    ajuste: "prorroga",
    segmentos: ["lucro-presumido"],
    exigeEmpregados: false,
    geraGuia: true,
    base: "LC 116/2003; legislação municipal",
    variaPorPraca: true,
    conferido: false,
  },

  // ─── Trimestrais ────────────────────────────────────────────────────
  {
    id: "darf-irpj-trimestral",
    nome: "DARF de IRPJ",
    descricao: "Apuração trimestral do Lucro Presumido, com adicional de 10%.",
    orgao: "Receita Federal",
    frequencia: "trimestral",
    dia: "ultimo-dia-util",
    mesesApos: 1,
    ajuste: "antecipa",
    segmentos: ["lucro-presumido"],
    exigeEmpregados: false,
    geraGuia: true,
    base: "Lei 9.430/1996",
    variaPorPraca: false,
    conferido: false,
  },
  {
    id: "darf-csll-trimestral",
    nome: "DARF de CSLL",
    descricao: "Apuração trimestral, na mesma base do IRPJ presumido.",
    orgao: "Receita Federal",
    frequencia: "trimestral",
    dia: "ultimo-dia-util",
    mesesApos: 1,
    ajuste: "antecipa",
    segmentos: ["lucro-presumido"],
    exigeEmpregados: false,
    geraGuia: true,
    base: "Lei 9.430/1996",
    variaPorPraca: false,
    conferido: false,
  },

  // ─── Anuais ─────────────────────────────────────────────────────────
  {
    id: "dasn-simei",
    nome: "DASN-SIMEI",
    descricao: "Declaração anual de faturamento do MEI.",
    orgao: "Receita Federal",
    frequencia: "anual",
    dia: 31,
    mesVencimento: 5,
    ajuste: "prorroga",
    segmentos: ["mei"],
    exigeEmpregados: false,
    geraGuia: false,
    base: "Resolução CGSN",
    variaPorPraca: false,
    conferido: false,
  },
  {
    id: "defis",
    nome: "DEFIS",
    descricao:
      "Declaração de informações socioeconômicas do Simples. Está migrando para dentro do PGDAS-D anual — confirmar vigência antes de 2027.",
    orgao: "Receita Federal",
    frequencia: "anual",
    dia: 31,
    mesVencimento: 3,
    ajuste: "prorroga",
    segmentos: SIMPLES,
    exigeEmpregados: false,
    geraGuia: false,
    base: "Resolução CGSN",
    variaPorPraca: false,
    conferido: false,
  },
  {
    id: "ecd",
    nome: "ECD — SPED Contábil",
    descricao: "Escrituração contábil digital do exercício anterior.",
    orgao: "Receita Federal",
    frequencia: "anual",
    dia: "ultimo-dia-util",
    mesVencimento: 5,
    ajuste: "antecipa",
    segmentos: ["lucro-presumido"],
    exigeEmpregados: false,
    geraGuia: false,
    base: "IN RFB · ECD",
    variaPorPraca: false,
    conferido: false,
  },
  {
    id: "ecf",
    nome: "ECF",
    descricao: "Escrituração contábil fiscal do exercício anterior.",
    orgao: "Receita Federal",
    frequencia: "anual",
    dia: "ultimo-dia-util",
    mesVencimento: 7,
    ajuste: "antecipa",
    segmentos: ["lucro-presumido"],
    exigeEmpregados: false,
    geraGuia: false,
    base: "IN RFB · ECF",
    variaPorPraca: false,
    conferido: false,
  },
  {
    id: "itr",
    nome: "ITR",
    descricao: "Imposto sobre a propriedade territorial rural, por imóvel.",
    orgao: "Receita Federal",
    frequencia: "anual",
    dia: "ultimo-dia-util",
    mesVencimento: 9,
    ajuste: "antecipa",
    segmentos: ["rural"],
    exigeEmpregados: false,
    geraGuia: true,
    base: "Lei 9.393/1996",
    variaPorPraca: false,
    conferido: false,
  },
  {
    id: "irpf-lcdpr",
    nome: "IRPF com LCDPR",
    descricao:
      "Declaração do produtor rural pessoa física, acompanhada do Livro Caixa Digital.",
    orgao: "Receita Federal",
    frequencia: "anual",
    dia: 31,
    mesVencimento: 5,
    ajuste: "prorroga",
    segmentos: ["rural"],
    exigeEmpregados: false,
    geraGuia: false,
    base: "IN RFB · LCDPR",
    variaPorPraca: false,
    conferido: false,
  },
];

export function obrigacaoPorId(id: string): Obrigacao | undefined {
  return OBRIGACOES.find((o) => o.id === id);
}
