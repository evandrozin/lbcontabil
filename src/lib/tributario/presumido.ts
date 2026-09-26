import {
  ALIQUOTA_COFINS_CUMULATIVO,
  ALIQUOTA_CSLL,
  ALIQUOTA_IRPJ,
  ALIQUOTA_IRPJ_ADICIONAL,
  ALIQUOTA_PIS_CUMULATIVO,
  CPP_PATRONAL_FORA_DO_SIMPLES,
  ISS_PADRAO,
  LIMITE_ADICIONAL_IRPJ_MENSAL_CENTAVOS,
  PRESUNCAO_CSLL,
  PRESUNCAO_IRPJ,
  type AtividadePresumido,
} from "./parametros";

/**
 * Apuração do Lucro Presumido.
 *
 * Comparar Presumido com Simples só faz sentido se os dois lados
 * carregarem a mesma coisa. No Simples (exceto Anexo IV) a CPP patronal
 * está dentro do DAS; no Presumido ela é paga por fora, sobre a folha.
 * Esquecer isso é o que faz o Presumido parecer barato para empresa com
 * gente registrada.
 */

export interface EntradaPresumido {
  receitaMesCentavos: number;
  atividade: AtividadePresumido;
  folhaMensalCentavos: number;
  /** Alíquota de ISS do município (0..1). Só se aplica a serviço. */
  issAliquota?: number;
  /**
   * ICMS efetivo sobre a receita de comércio/indústria (0..1). Depende do
   * estado, da substituição tributária e do crédito de entrada, então quem
   * simula precisa informar — assumir zero subestima muito a carga.
   */
  icmsEfetivo?: number;
}

export interface ResultadoPresumido {
  baseIrpjCentavos: number;
  irpjCentavos: number;
  adicionalIrpjCentavos: number;
  baseCsllCentavos: number;
  csllCentavos: number;
  pisCentavos: number;
  cofinsCentavos: number;
  issCentavos: number;
  icmsCentavos: number;
  cppPatronalCentavos: number;
  /** Só os tributos sobre receita e lucro, sem folha. */
  tributosSobreReceitaCentavos: number;
  /** Tributos + CPP patronal: o desembolso comparável ao DAS. */
  cargaTotalMensalCentavos: number;
  /** Carga total ÷ receita do mês. */
  cargaEfetiva: number;
  /** ICMS não informado numa atividade que o exige. */
  icmsNaoInformado: boolean;
}

export function apurarPresumido(entrada: EntradaPresumido): ResultadoPresumido {
  const receita = entrada.receitaMesCentavos;
  const ehServico = entrada.atividade === "servico";
  const exigeIcms = entrada.atividade === "comercio" || entrada.atividade === "industria";

  const baseIrpjCentavos = Math.round(receita * PRESUNCAO_IRPJ[entrada.atividade]);
  const irpjCentavos = Math.round(baseIrpjCentavos * ALIQUOTA_IRPJ);

  // O adicional incide sobre o que passar de R$ 20 mil de lucro presumido
  // por mês (R$ 60 mil no trimestre), não sobre a receita.
  const excedente = Math.max(
    0,
    baseIrpjCentavos - LIMITE_ADICIONAL_IRPJ_MENSAL_CENTAVOS,
  );
  const adicionalIrpjCentavos = Math.round(excedente * ALIQUOTA_IRPJ_ADICIONAL);

  const baseCsllCentavos = Math.round(receita * PRESUNCAO_CSLL[entrada.atividade]);
  const csllCentavos = Math.round(baseCsllCentavos * ALIQUOTA_CSLL);

  const pisCentavos = Math.round(receita * ALIQUOTA_PIS_CUMULATIVO);
  const cofinsCentavos = Math.round(receita * ALIQUOTA_COFINS_CUMULATIVO);

  const issCentavos = ehServico
    ? Math.round(receita * (entrada.issAliquota ?? ISS_PADRAO))
    : 0;

  const icmsCentavos = exigeIcms
    ? Math.round(receita * (entrada.icmsEfetivo ?? 0))
    : 0;

  const cppPatronalCentavos = Math.round(
    entrada.folhaMensalCentavos * CPP_PATRONAL_FORA_DO_SIMPLES,
  );

  const tributosSobreReceitaCentavos =
    irpjCentavos +
    adicionalIrpjCentavos +
    csllCentavos +
    pisCentavos +
    cofinsCentavos +
    issCentavos +
    icmsCentavos;

  const cargaTotalMensalCentavos = tributosSobreReceitaCentavos + cppPatronalCentavos;

  return {
    baseIrpjCentavos,
    irpjCentavos,
    adicionalIrpjCentavos,
    baseCsllCentavos,
    csllCentavos,
    pisCentavos,
    cofinsCentavos,
    issCentavos,
    icmsCentavos,
    cppPatronalCentavos,
    tributosSobreReceitaCentavos,
    cargaTotalMensalCentavos,
    cargaEfetiva: receita > 0 ? cargaTotalMensalCentavos / receita : 0,
    icmsNaoInformado: exigeIcms && entrada.icmsEfetivo === undefined,
  };
}
