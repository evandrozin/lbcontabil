import {
  JANELAS_SIMPLES_HIBRIDO,
  PARCELA_DAS_TRIBUTOS_CONSUMO,
  TRANSICAO_REFORMA,
  type AnexoSimples,
  type AnoDaTransicao,
  type JanelaSimplesHibrido,
} from "./parametros";

/**
 * Reforma tributária do consumo: CBS e IBS.
 *
 * Duas perguntas diferentes vivem aqui:
 *
 * 1. "Quanto vou pagar em cada ano da transição?" — regime regular.
 * 2. "Vale a pena optar pelo Simples híbrido?" — que NÃO é uma pergunta
 *    de economia de imposto. No híbrido a empresa paga mais, e ganha em
 *    competitividade, porque o cliente PJ passa a creditar integralmente.
 *    Tratar isso como economia tributária leva à recomendação errada.
 */

export function anoDaTransicao(ano: number): AnoDaTransicao {
  const exato = TRANSICAO_REFORMA.find((t) => t.ano === ano);
  if (exato) return exato;

  const primeiro = TRANSICAO_REFORMA[0];
  const ultimo = TRANSICAO_REFORMA[TRANSICAO_REFORMA.length - 1];
  return ano < primeiro.ano ? primeiro : ultimo;
}

export interface EntradaCargaReforma {
  receitaMesCentavos: number;
  ano: number;
  /**
   * Compras de insumos e mercadorias que geram crédito, em centavos.
   * No modelo não cumulativo, é o crédito que define a carga real — uma
   * revenda com margem pequena paga muito menos do que a alíquota cheia
   * sugere.
   */
  comprasComCreditoCentavos?: number;
}

export interface ResultadoCargaReforma {
  ano: number;
  aliquotaCbs: number;
  aliquotaIbs: number;
  cbsDebitoCentavos: number;
  ibsDebitoCentavos: number;
  creditoCentavos: number;
  /** CBS + IBS a recolher, já descontado o crédito. */
  cbsIbsLiquidoCentavos: number;
  /** Carga líquida ÷ receita do mês. */
  cargaEfetiva: number;
  nota: string;
}

export function calcularCargaReforma(
  entrada: EntradaCargaReforma,
): ResultadoCargaReforma {
  const ano = anoDaTransicao(entrada.ano);
  const receita = entrada.receitaMesCentavos;
  const compras = entrada.comprasComCreditoCentavos ?? 0;

  const cbsDebitoCentavos = Math.round(receita * ano.cbs);
  const ibsDebitoCentavos = Math.round(receita * ano.ibs);
  const creditoCentavos = Math.round(compras * (ano.cbs + ano.ibs));

  // Saldo credor não vira imposto negativo: acumula para o mês seguinte.
  const cbsIbsLiquidoCentavos = Math.max(
    0,
    cbsDebitoCentavos + ibsDebitoCentavos - creditoCentavos,
  );

  return {
    ano: ano.ano,
    aliquotaCbs: ano.cbs,
    aliquotaIbs: ano.ibs,
    cbsDebitoCentavos,
    ibsDebitoCentavos,
    creditoCentavos,
    cbsIbsLiquidoCentavos,
    cargaEfetiva: receita > 0 ? cbsIbsLiquidoCentavos / receita : 0,
    nota: ano.nota,
  };
}

// ─── Janela de opção pelo Simples híbrido ──────────────────────────────

export interface StatusJanela {
  janela: JanelaSimplesHibrido;
  aberta: boolean;
  /** Dias até o fechamento, quando aberta. */
  diasRestantes: number | null;
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * Situação da janela de opção na data informada.
 *
 * A data entra por parâmetro (e não `new Date()` interno) para o teste ser
 * determinístico e para a página poder simular outra data.
 */
export function statusJanelaSimplesHibrido(hojeIso: string): StatusJanela | null {
  const aberta = JANELAS_SIMPLES_HIBRIDO.find(
    (j) => hojeIso >= j.abreEm && hojeIso <= j.fechaEm,
  );

  if (aberta) {
    const diff = Date.parse(aberta.fechaEm) - Date.parse(hojeIso);
    return {
      janela: aberta,
      aberta: true,
      diasRestantes: Math.max(0, Math.round(diff / MS_POR_DIA)),
    };
  }

  const proxima = JANELAS_SIMPLES_HIBRIDO.find((j) => j.abreEm > hojeIso);
  return proxima ? { janela: proxima, aberta: false, diasRestantes: null } : null;
}

// ─── Avaliação do Simples híbrido ──────────────────────────────────────

export interface EntradaSimplesHibrido {
  receitaMesCentavos: number;
  dasMensalCentavos: number;
  anexo: AnexoSimples;
  /** Fatia do faturamento vendida para PJ que aproveita crédito (0..1). */
  parcelaVendaParaPJ: number;
  ano: number;
  comprasComCreditoCentavos?: number;
}

export type RecomendacaoHibrido = "avaliar" | "provavelmente-nao" | "indiferente";

export interface ResultadoSimplesHibrido {
  /** CBS/IBS recolhidos por fora do DAS. */
  cbsIbsForaDoDasCentavos: number;
  /** Parcela do DAS que deixa de ser devida por já estar fora. */
  reducaoDoDasCentavos: number;
  /** Diferença de desembolso no mês: positivo = paga mais no híbrido. */
  custoAdicionalMensalCentavos: number;
  /** Crédito integral que os clientes PJ passam a aproveitar. */
  creditoGeradoAoClienteCentavos: number;
  recomendacao: RecomendacaoHibrido;
  justificativa: string;
}

/**
 * Limiar de venda para PJ a partir do qual o híbrido merece análise.
 * Não é regra legal: é critério comercial do escritório, e por isso fica
 * explícito aqui em vez de escondido num `if`.
 */
export const LIMIAR_VENDA_PJ_PARA_HIBRIDO = 0.4;

export function avaliarSimplesHibrido(
  entrada: EntradaSimplesHibrido,
): ResultadoSimplesHibrido {
  const carga = calcularCargaReforma({
    receitaMesCentavos: entrada.receitaMesCentavos,
    ano: entrada.ano,
    comprasComCreditoCentavos: entrada.comprasComCreditoCentavos,
  });

  const cbsIbsForaDoDasCentavos = carga.cbsIbsLiquidoCentavos;

  // Optando pelo híbrido, a fatia do DAS referente a PIS/COFINS/ICMS/ISS
  // deixa de ser recolhida dentro dele.
  const reducaoDoDasCentavos = Math.round(
    entrada.dasMensalCentavos * PARCELA_DAS_TRIBUTOS_CONSUMO[entrada.anexo],
  );

  const custoAdicionalMensalCentavos = cbsIbsForaDoDasCentavos - reducaoDoDasCentavos;

  // O comprador PJ credita CBS/IBS destacados na nota — mas só sobre a
  // parcela que ele efetivamente compra.
  const creditoGeradoAoClienteCentavos = Math.round(
    (carga.cbsDebitoCentavos + carga.ibsDebitoCentavos) * entrada.parcelaVendaParaPJ,
  );

  let recomendacao: RecomendacaoHibrido;
  let justificativa: string;

  if (entrada.parcelaVendaParaPJ >= LIMIAR_VENDA_PJ_PARA_HIBRIDO) {
    recomendacao = "avaliar";
    justificativa =
      "Boa parte do seu faturamento vai para empresas, que vão querer crédito integral de CBS/IBS. Sem o híbrido, o crédito que você repassa é menor e o seu preço fica menos competitivo do que o de um concorrente fora do Simples. Vale sentar com o consultor antes da janela fechar.";
  } else if (entrada.parcelaVendaParaPJ <= 0.15) {
    recomendacao = "provavelmente-nao";
    justificativa =
      "Você vende quase tudo para consumidor final, que não aproveita crédito. No híbrido você pagaria mais sem ganhar competitividade em troca.";
  } else {
    recomendacao = "indiferente";
    justificativa =
      "Sua carteira é mista. O resultado depende de quais clientes PJ pesam mais no faturamento e de quanto você conseguiria repassar em preço. Precisa de análise caso a caso.";
  }

  return {
    cbsIbsForaDoDasCentavos,
    reducaoDoDasCentavos,
    custoAdicionalMensalCentavos,
    creditoGeradoAoClienteCentavos,
    recomendacao,
    justificativa,
  };
}
