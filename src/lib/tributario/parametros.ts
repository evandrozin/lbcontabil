/**
 * ════════════════════════════════════════════════════════════════════════
 * PARÂMETROS TRIBUTÁRIOS — EXIGEM VALIDAÇÃO DO CONTADOR RESPONSÁVEL
 * ════════════════════════════════════════════════════════════════════════
 *
 * Este arquivo concentra TODA alíquota, faixa e presunção usada pelo
 * comparador de regimes. Nenhum número fiscal deve viver espalhado no
 * código — quando a lei muda, muda aqui e o resto acompanha.
 *
 * Os valores da reforma (CBS/IBS) são ESTIMATIVAS de transição. A alíquota
 * de referência é fixada por resolução do Senado e ainda se move. Para
 * número oficial, a fonte é a calculadora do Portal RTC da Receita — nosso
 * cálculo serve para captação e ordem de grandeza, não para apuração.
 *
 * Responsável pela última conferência: (preencher)
 * Data da última conferência: (preencher)
 */

export const PARAMETROS_REVISADOS_EM = "2026-09-26";

/**
 * Quem assinou a conferência destes números. Enquanto estiver vazio, a
 * interface exibe o aviso de "parâmetros não homologados".
 */
export const PARAMETROS_CONFERIDOS_POR: string | null = null;

// ─── Simples Nacional ──────────────────────────────────────────────────

export type AnexoSimples = "I" | "II" | "III" | "IV" | "V";

export interface FaixaSimples {
  /** Teto de receita bruta em 12 meses (RBT12), em centavos. */
  ateCentavos: number;
  /** Alíquota nominal da faixa (0..1). */
  aliquotaNominal: number;
  /** Parcela a deduzir, em centavos. */
  parcelaDeduzirCentavos: number;
}

/**
 * Tabelas da LC 123/2006. A alíquota EFETIVA é sempre
 * (RBT12 × nominal − parcela a deduzir) / RBT12 — nunca a nominal direta.
 */
export const ANEXOS_SIMPLES: Record<AnexoSimples, FaixaSimples[]> = {
  I: [
    { ateCentavos: 180_000_00, aliquotaNominal: 0.04, parcelaDeduzirCentavos: 0 },
    { ateCentavos: 360_000_00, aliquotaNominal: 0.073, parcelaDeduzirCentavos: 5_940_00 },
    { ateCentavos: 720_000_00, aliquotaNominal: 0.095, parcelaDeduzirCentavos: 13_860_00 },
    { ateCentavos: 1_800_000_00, aliquotaNominal: 0.107, parcelaDeduzirCentavos: 22_500_00 },
    { ateCentavos: 3_600_000_00, aliquotaNominal: 0.143, parcelaDeduzirCentavos: 87_300_00 },
    { ateCentavos: 4_800_000_00, aliquotaNominal: 0.19, parcelaDeduzirCentavos: 378_000_00 },
  ],
  II: [
    { ateCentavos: 180_000_00, aliquotaNominal: 0.045, parcelaDeduzirCentavos: 0 },
    { ateCentavos: 360_000_00, aliquotaNominal: 0.078, parcelaDeduzirCentavos: 5_940_00 },
    { ateCentavos: 720_000_00, aliquotaNominal: 0.1, parcelaDeduzirCentavos: 13_860_00 },
    { ateCentavos: 1_800_000_00, aliquotaNominal: 0.112, parcelaDeduzirCentavos: 22_500_00 },
    { ateCentavos: 3_600_000_00, aliquotaNominal: 0.147, parcelaDeduzirCentavos: 85_500_00 },
    { ateCentavos: 4_800_000_00, aliquotaNominal: 0.3, parcelaDeduzirCentavos: 720_000_00 },
  ],
  III: [
    { ateCentavos: 180_000_00, aliquotaNominal: 0.06, parcelaDeduzirCentavos: 0 },
    { ateCentavos: 360_000_00, aliquotaNominal: 0.112, parcelaDeduzirCentavos: 9_360_00 },
    { ateCentavos: 720_000_00, aliquotaNominal: 0.135, parcelaDeduzirCentavos: 17_640_00 },
    { ateCentavos: 1_800_000_00, aliquotaNominal: 0.16, parcelaDeduzirCentavos: 35_640_00 },
    { ateCentavos: 3_600_000_00, aliquotaNominal: 0.21, parcelaDeduzirCentavos: 125_640_00 },
    { ateCentavos: 4_800_000_00, aliquotaNominal: 0.33, parcelaDeduzirCentavos: 648_000_00 },
  ],
  IV: [
    { ateCentavos: 180_000_00, aliquotaNominal: 0.045, parcelaDeduzirCentavos: 0 },
    { ateCentavos: 360_000_00, aliquotaNominal: 0.09, parcelaDeduzirCentavos: 8_100_00 },
    { ateCentavos: 720_000_00, aliquotaNominal: 0.102, parcelaDeduzirCentavos: 12_420_00 },
    { ateCentavos: 1_800_000_00, aliquotaNominal: 0.14, parcelaDeduzirCentavos: 39_780_00 },
    { ateCentavos: 3_600_000_00, aliquotaNominal: 0.22, parcelaDeduzirCentavos: 183_780_00 },
    { ateCentavos: 4_800_000_00, aliquotaNominal: 0.33, parcelaDeduzirCentavos: 828_000_00 },
  ],
  V: [
    { ateCentavos: 180_000_00, aliquotaNominal: 0.155, parcelaDeduzirCentavos: 0 },
    { ateCentavos: 360_000_00, aliquotaNominal: 0.18, parcelaDeduzirCentavos: 4_500_00 },
    { ateCentavos: 720_000_00, aliquotaNominal: 0.195, parcelaDeduzirCentavos: 9_900_00 },
    { ateCentavos: 1_800_000_00, aliquotaNominal: 0.205, parcelaDeduzirCentavos: 17_100_00 },
    { ateCentavos: 3_600_000_00, aliquotaNominal: 0.23, parcelaDeduzirCentavos: 62_100_00 },
    { ateCentavos: 4_800_000_00, aliquotaNominal: 0.305, parcelaDeduzirCentavos: 540_000_00 },
  ],
};

/**
 * O Anexo IV NÃO inclui a CPP (INSS patronal) no DAS — a empresa recolhe a
 * contribuição patronal por fora. Ignorar isso subestima a carga do Anexo
 * IV em torno de 20% da folha, que é justamente o erro que faz uma
 * comparação de regime dar o resultado invertido.
 */
export const ANEXO_INCLUI_CPP: Record<AnexoSimples, boolean> = {
  I: true,
  II: true,
  III: true,
  IV: false,
  V: true,
};

/** Alíquota patronal de INSS fora do Simples (CPP + terceiros + RAT médio). */
export const CPP_PATRONAL_FORA_DO_SIMPLES = 0.268;

/** Razão folha/receita que leva o serviço do Anexo V para o Anexo III. */
export const FATOR_R_LIMITE = 0.28;

// ─── Lucro Presumido ───────────────────────────────────────────────────

export type AtividadePresumido = "comercio" | "industria" | "servico" | "transporte";

/** Percentuais de presunção do lucro sobre a receita bruta. */
export const PRESUNCAO_IRPJ: Record<AtividadePresumido, number> = {
  comercio: 0.08,
  industria: 0.08,
  transporte: 0.16,
  servico: 0.32,
};

export const PRESUNCAO_CSLL: Record<AtividadePresumido, number> = {
  comercio: 0.12,
  industria: 0.12,
  transporte: 0.12,
  servico: 0.32,
};

export const ALIQUOTA_IRPJ = 0.15;
/** Adicional de 10% sobre o lucro presumido que exceder o limite trimestral. */
export const ALIQUOTA_IRPJ_ADICIONAL = 0.1;
export const LIMITE_ADICIONAL_IRPJ_MENSAL_CENTAVOS = 20_000_00;

export const ALIQUOTA_CSLL = 0.09;

/** PIS e COFINS cumulativos, próprios do Lucro Presumido. */
export const ALIQUOTA_PIS_CUMULATIVO = 0.0065;
export const ALIQUOTA_COFINS_CUMULATIVO = 0.03;

/**
 * ISS municipal. Varia de 2% a 5% por município e por serviço — quem
 * simula precisa poder informar o seu. Usamos 5% como pior caso.
 */
export const ISS_PADRAO = 0.05;
export const ISS_MINIMO = 0.02;
export const ISS_MAXIMO = 0.05;

// ─── Reforma tributária do consumo (CBS e IBS) ─────────────────────────

export interface AnoDaTransicao {
  ano: number;
  /** Alíquota de CBS no ano (0..1). */
  cbs: number;
  /** Alíquota de IBS no ano (0..1). */
  ibs: number;
  /** PIS/COFINS ainda são devidos neste ano? */
  mantemPisCofins: boolean;
  /** ICMS/ISS ainda são devidos neste ano (ainda que reduzidos)? */
  mantemIcmsIss: boolean;
  /** Proporção de ICMS/ISS ainda vigente (0..1), na transição do IBS. */
  proporcaoIcmsIss: number;
  nota: string;
}

/**
 * ⚠️ ESTIMATIVA. A alíquota de referência é fixada por resolução do Senado
 * e vinha sendo revisada. Os anos de 2026 a 2028 são os mais firmes; de
 * 2029 em diante é a curva de transição prevista, não alíquota publicada.
 *
 * Confira contra o Portal RTC antes de apresentar número a cliente.
 */
export const TRANSICAO_REFORMA: AnoDaTransicao[] = [
  {
    ano: 2026,
    cbs: 0.009,
    ibs: 0.001,
    mantemPisCofins: true,
    mantemIcmsIss: true,
    proporcaoIcmsIss: 1,
    nota: "Ano-teste: alíquotas simbólicas, compensáveis com PIS/COFINS. Serve para calibrar sistemas.",
  },
  {
    ano: 2027,
    cbs: 0.088,
    ibs: 0.001,
    mantemPisCofins: false,
    mantemIcmsIss: true,
    proporcaoIcmsIss: 1,
    nota: "CBS entra integral e PIS/COFINS são extintos. IBS segue simbólico e ICMS/ISS continuam.",
  },
  {
    ano: 2028,
    cbs: 0.088,
    ibs: 0.001,
    mantemPisCofins: false,
    mantemIcmsIss: true,
    proporcaoIcmsIss: 1,
    nota: "Mesma configuração de 2027.",
  },
  {
    ano: 2029,
    cbs: 0.088,
    ibs: 0.0177,
    mantemPisCofins: false,
    mantemIcmsIss: true,
    proporcaoIcmsIss: 0.9,
    nota: "Início da transição do IBS: 10% da alíquota cheia, com ICMS/ISS reduzidos a 90%.",
  },
  {
    ano: 2030,
    cbs: 0.088,
    ibs: 0.0354,
    mantemPisCofins: false,
    mantemIcmsIss: true,
    proporcaoIcmsIss: 0.8,
    nota: "IBS em 20%, ICMS/ISS em 80%.",
  },
  {
    ano: 2031,
    cbs: 0.088,
    ibs: 0.0531,
    mantemPisCofins: false,
    mantemIcmsIss: true,
    proporcaoIcmsIss: 0.7,
    nota: "IBS em 30%, ICMS/ISS em 70%.",
  },
  {
    ano: 2032,
    cbs: 0.088,
    ibs: 0.0708,
    mantemPisCofins: false,
    mantemIcmsIss: true,
    proporcaoIcmsIss: 0.6,
    nota: "IBS em 40%, ICMS/ISS em 60%.",
  },
  {
    ano: 2033,
    cbs: 0.088,
    ibs: 0.177,
    mantemPisCofins: false,
    mantemIcmsIss: false,
    proporcaoIcmsIss: 0,
    nota: "Modelo pleno: CBS e IBS integrais, ICMS, ISS, PIS e COFINS extintos.",
  },
];

/** Soma CBS + IBS no modelo pleno — a "alíquota de referência" estimada. */
export const ALIQUOTA_REFERENCIA_PLENA = 0.265;

/**
 * Fatia do DAS que corresponde aos tributos sobre consumo substituídos
 * pela reforma (PIS, COFINS, ICMS e ISS).
 *
 * ⚠️ APROXIMAÇÃO. A repartição real muda por anexo E por faixa — a tabela
 * completa está nos anexos da LC 123/2006. Usamos um valor médio por
 * anexo porque o objetivo é dimensionar a decisão do Simples híbrido, não
 * apurar imposto. Refine com a repartição da faixa real do cliente antes
 * de levar número a uma reunião.
 */
export const PARCELA_DAS_TRIBUTOS_CONSUMO: Record<AnexoSimples, number> = {
  I: 0.46,
  II: 0.44,
  III: 0.49,
  IV: 0.62,
  V: 0.35,
};

/**
 * Janelas de opção pelo Simples híbrido (recolher CBS/IBS fora do DAS).
 * Datas em ISO para comparação direta; a interface avisa quando a janela
 * está aberta e quantos dias faltam.
 */
export interface JanelaSimplesHibrido {
  abreEm: string;
  fechaEm: string;
  /** Prazo para desistir depois de optar. */
  desistenciaAte: string | null;
  vigencia: string;
}

export const JANELAS_SIMPLES_HIBRIDO: JanelaSimplesHibrido[] = [
  {
    abreEm: "2026-09-01",
    fechaEm: "2026-09-30",
    desistenciaAte: "2026-11-30",
    vigencia: "1º semestre de 2027",
  },
  {
    abreEm: "2027-03-01",
    fechaEm: "2027-03-31",
    desistenciaAte: null,
    vigencia: "2º semestre de 2027",
  },
];

// ─── MEI ───────────────────────────────────────────────────────────────

/**
 * ⚠️ CONFERIR TODO JANEIRO. O DAS-MEI é calculado sobre o salário mínimo,
 * então ele muda de valor na virada de todo ano.
 */
export const SALARIO_MINIMO_CENTAVOS = 1_621_00;

/** INSS do MEI: 5% do salário mínimo. */
export const MEI_INSS_PERCENTUAL = 0.05;
/** ICMS fixo do MEI comércio/indústria. */
export const MEI_ICMS_CENTAVOS = 1_00;
/** ISS fixo do MEI serviço. */
export const MEI_ISS_CENTAVOS = 5_00;

// ─── Limites gerais ────────────────────────────────────────────────────

export const LIMITE_MEI_ANUAL_CENTAVOS = 81_000_00;
export const LIMITE_SIMPLES_ANUAL_CENTAVOS = 4_800_000_00;
export const SUBLIMITE_ICMS_ISS_ANUAL_CENTAVOS = 3_600_000_00;
