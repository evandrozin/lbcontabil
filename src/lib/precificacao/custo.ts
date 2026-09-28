/**
 * Motor de precificação por custo + margem.
 *
 *                     custoHora × horas + custoSoftware + custoNotas
 *   precoMinimo = ───────────────────────────────────────────────────
 *                  1 − (impostos% + taxaCheckout% + margemAlvo%)
 *
 * O preço de tabela (src/lib/catalogo/planos.ts) NUNCA pode ficar abaixo do
 * mínimo calculado aqui — inclusive no contrato anual, que já vem com
 * desconto. O teste em planos.test.ts trava isso no CI.
 */

export interface ParametrosCusto {
  /** Custo-hora da equipe já com encargos, férias, 13º e ociosidade. */
  custoHoraEquipeCentavos: number;
  /** Licença do ERP contábil + portal do cliente, por CNPJ ativo/mês. */
  custoSoftwarePorCnpjCentavos: number;
  /** Custo marginal de captura/importação de cada nota fiscal. */
  custoPorNotaImportadaCentavos: number;
  /** Carga tributária da própria Agrotábil MS sobre a receita de serviço. */
  aliquotaImpostos: number;
  /** Taxa do gateway de pagamento (cartão recorrente é o pior caso). */
  taxaCheckout: number;
  /** Margem líquida alvo. O estudo pede entre 35% e 50%. */
  margemAlvo: number;
}

export const PARAMETROS_CUSTO_PADRAO: ParametrosCusto = {
  custoHoraEquipeCentavos: 45_00,
  custoSoftwarePorCnpjCentavos: 35_00,
  custoPorNotaImportadaCentavos: 30,
  aliquotaImpostos: 0.11,
  taxaCheckout: 0.035,
  margemAlvo: 0.4,
};

/**
 * MEI roda em licença de baixo custo (só DAS e declaração anual), por isso
 * não carrega a licença cheia do ERP. Sem essa distinção o piso de custo
 * inviabilizaria a faixa de R$ 89 praticada no mercado.
 */
export const CUSTO_SOFTWARE_MEI_CENTAVOS = 12_00;

export interface EntradaPrecoMinimo {
  horasEquipeMes: number;
  custoSoftwareCentavos: number;
  notasImportadasMes?: number;
}

export interface ResultadoPrecoMinimo {
  custoDiretoCentavos: number;
  /** Fração da receita que sobra depois de imposto, taxa e margem alvo. */
  divisor: number;
  precoMinimoCentavos: number;
}

export function calcularPrecoMinimo(
  entrada: EntradaPrecoMinimo,
  params: ParametrosCusto = PARAMETROS_CUSTO_PADRAO,
): ResultadoPrecoMinimo {
  const divisor =
    1 - (params.aliquotaImpostos + params.taxaCheckout + params.margemAlvo);

  if (divisor <= 0) {
    throw new Error(
      "Parâmetros inviáveis: impostos + taxa de checkout + margem alvo somam 100% ou mais da receita.",
    );
  }

  const custoDiretoCentavos =
    params.custoHoraEquipeCentavos * entrada.horasEquipeMes +
    entrada.custoSoftwareCentavos +
    params.custoPorNotaImportadaCentavos * (entrada.notasImportadasMes ?? 0);

  return {
    custoDiretoCentavos: Math.round(custoDiretoCentavos),
    divisor,
    precoMinimoCentavos: Math.ceil(custoDiretoCentavos / divisor),
  };
}

export interface MargemReal {
  receitaCentavos: number;
  impostosCentavos: number;
  taxaCheckoutCentavos: number;
  custoDiretoCentavos: number;
  lucroCentavos: number;
  /** Margem líquida efetiva (0..1). */
  margem: number;
}

/** Margem líquida efetiva de um preço já praticado. */
export function calcularMargemReal(
  precoCentavos: number,
  custoDiretoCentavos: number,
  params: ParametrosCusto = PARAMETROS_CUSTO_PADRAO,
): MargemReal {
  const impostosCentavos = Math.round(precoCentavos * params.aliquotaImpostos);
  const taxaCheckoutCentavos = Math.round(precoCentavos * params.taxaCheckout);
  const lucroCentavos =
    precoCentavos - impostosCentavos - taxaCheckoutCentavos - custoDiretoCentavos;

  return {
    receitaCentavos: precoCentavos,
    impostosCentavos,
    taxaCheckoutCentavos,
    custoDiretoCentavos,
    lucroCentavos,
    margem: precoCentavos === 0 ? 0 : lucroCentavos / precoCentavos,
  };
}
