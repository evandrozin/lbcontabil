/**
 * Parâmetros fiscais usados pelo simulador para enquadramento.
 *
 * ATENÇÃO: estes valores mudam por lei. Revise a cada virada de exercício
 * e sempre que houver alteração na LC 123/2006. A data abaixo registra a
 * última conferência feita — o simulador exibe alerta se estiver defasada.
 */
export const VIGENCIA_PARAMETROS = "2026-01-01";

/** Receita bruta anual máxima do MEI (LC 123/2006, art. 18-A). */
export const LIMITE_MEI_ANUAL_CENTAVOS = 81_000_00;

/** Receita bruta anual máxima do Simples Nacional (LC 123/2006, art. 3º, II). */
export const LIMITE_SIMPLES_ANUAL_CENTAVOS = 4_800_000_00;

/**
 * Sublimite estadual de ICMS/ISS no Simples. Acima dele a empresa continua
 * no Simples para tributos federais, mas recolhe ICMS/ISS por fora.
 */
export const SUBLIMITE_ICMS_ISS_ANUAL_CENTAVOS = 3_600_000_00;

/**
 * Fator R: razão folha/receita dos últimos 12 meses que define se o serviço
 * é tributado pelo Anexo III (alíquota menor) ou pelo Anexo V.
 */
export const FATOR_R_PERCENTUAL = 0.28;

/** Teto de faturamento anual do produtor rural PF para dispensa do LCDPR. */
export const LIMITE_LCDPR_ANUAL_CENTAVOS = 4_800_000_00;

/** Desconto aplicado ao contrato anual (pagamento recorrente de 12 meses). */
export const DESCONTO_PLANO_ANUAL = 0.1;

/**
 * 13ª mensalidade contábil — encerramento de exercício e balanço anual.
 * Deve constar em contrato e ser exibida no checkout antes do aceite.
 */
export const COBRA_DECIMA_TERCEIRA = true;
