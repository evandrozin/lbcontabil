import {
  ANEXOS_SIMPLES,
  ANEXO_INCLUI_CPP,
  CPP_PATRONAL_FORA_DO_SIMPLES,
  FATOR_R_LIMITE,
  LIMITE_SIMPLES_ANUAL_CENTAVOS,
  type AnexoSimples,
  type FaixaSimples,
} from "./parametros";

/**
 * Apuração do Simples Nacional.
 *
 * O erro clássico de simulação é usar a alíquota nominal da faixa. A
 * alíquota que a empresa paga é a EFETIVA:
 *
 *   efetiva = (RBT12 × nominal − parcela a deduzir) ÷ RBT12
 *
 * Numa empresa de serviço faturando R$ 30 mil/mês, a diferença entre
 * nominal e efetiva no Anexo III passa de 3 pontos percentuais — o
 * bastante para recomendar o regime errado.
 */

export interface EntradaSimples {
  /** Receita bruta dos últimos 12 meses, em centavos. */
  rbt12Centavos: number;
  /** Receita do mês a apurar, em centavos. */
  receitaMesCentavos: number;
  /** Folha dos últimos 12 meses incluindo pró-labore, em centavos. */
  folha12Centavos: number;
  anexo: AnexoSimples;
}

export interface ResultadoSimples {
  anexo: AnexoSimples;
  faixa: number;
  aliquotaNominal: number;
  aliquotaEfetiva: number;
  dasMensalCentavos: number;
  /** CPP patronal devida por fora (só no Anexo IV). */
  cppForaDoDasCentavos: number;
  /** DAS + CPP por fora: o que a empresa realmente desembolsa. */
  cargaTotalMensalCentavos: number;
  acimaDoTeto: boolean;
}

/** Encontra a faixa do RBT12. Acima do teto, devolve a última. */
export function faixaDoRBT12(anexo: AnexoSimples, rbt12Centavos: number): {
  faixa: FaixaSimples;
  indice: number;
} {
  const tabela = ANEXOS_SIMPLES[anexo];
  const indice = tabela.findIndex((f) => rbt12Centavos <= f.ateCentavos);
  const posicao = indice === -1 ? tabela.length - 1 : indice;
  return { faixa: tabela[posicao], indice: posicao };
}

/**
 * Alíquota efetiva do Simples.
 *
 * Empresa sem histórico (RBT12 zero) paga a nominal da primeira faixa —
 * não há receita para diluir a parcela a deduzir.
 */
export function aliquotaEfetivaSimples(
  anexo: AnexoSimples,
  rbt12Centavos: number,
): number {
  const { faixa } = faixaDoRBT12(anexo, rbt12Centavos);
  if (rbt12Centavos <= 0) return faixa.aliquotaNominal;

  const efetiva =
    (rbt12Centavos * faixa.aliquotaNominal - faixa.parcelaDeduzirCentavos) / rbt12Centavos;

  // A fórmula nunca deveria dar negativo com tabela válida, mas um
  // parâmetro digitado errado não pode virar imposto negativo na tela.
  return Math.max(0, efetiva);
}

/** Razão folha/receita dos últimos 12 meses. */
export function calcularFatorR(folha12Centavos: number, rbt12Centavos: number): number {
  if (rbt12Centavos <= 0) return 0;
  return folha12Centavos / rbt12Centavos;
}

/**
 * Define o anexo de uma atividade de serviço a partir do Fator R.
 *
 * Serviços do Anexo IV (construção civil, advocacia, vigilância e afins)
 * não entram nessa regra: eles são sempre Anexo IV, e a CPP patronal é
 * recolhida por fora do DAS.
 */
export function anexoPorFatorR(fatorR: number): Extract<AnexoSimples, "III" | "V"> {
  return fatorR >= FATOR_R_LIMITE ? "III" : "V";
}

export function apurarSimples(entrada: EntradaSimples): ResultadoSimples {
  const { faixa, indice } = faixaDoRBT12(entrada.anexo, entrada.rbt12Centavos);
  const aliquotaEfetiva = aliquotaEfetivaSimples(entrada.anexo, entrada.rbt12Centavos);
  const dasMensalCentavos = Math.round(entrada.receitaMesCentavos * aliquotaEfetiva);

  // Anexo IV: o DAS não carrega a CPP, então a empresa paga INSS patronal
  // à parte. Somar isso é o que torna a comparação entre anexos honesta.
  const cppForaDoDasCentavos = ANEXO_INCLUI_CPP[entrada.anexo]
    ? 0
    : Math.round((entrada.folha12Centavos / 12) * CPP_PATRONAL_FORA_DO_SIMPLES);

  return {
    anexo: entrada.anexo,
    faixa: indice + 1,
    aliquotaNominal: faixa.aliquotaNominal,
    aliquotaEfetiva,
    dasMensalCentavos,
    cppForaDoDasCentavos,
    cargaTotalMensalCentavos: dasMensalCentavos + cppForaDoDasCentavos,
    acimaDoTeto: entrada.rbt12Centavos > LIMITE_SIMPLES_ANUAL_CENTAVOS,
  };
}

/**
 * Quanto de folha faltaria para atingir o Fator R e cair no Anexo III.
 *
 * É a pergunta que o empresário faz de verdade: "vale a pena aumentar meu
 * pró-labore?". Devolve `null` quando o Fator R já está atingido.
 */
export function folhaNecessariaParaAnexoIII(
  folha12Centavos: number,
  rbt12Centavos: number,
): number | null {
  if (rbt12Centavos <= 0) return null;

  // Arredonda o ALVO, não a diferença: 1.000.000,00 × 0,28 dá
  // 28000000.000000004 em ponto flutuante, e um Math.ceil na diferença
  // transformaria esse ruído em um centavo a mais na resposta.
  const necessaria = Math.round(rbt12Centavos * FATOR_R_LIMITE);
  if (folha12Centavos >= necessaria) return null;
  return necessaria - folha12Centavos;
}
