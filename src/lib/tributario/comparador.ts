import {
  LIMITE_MEI_ANUAL_CENTAVOS,
  LIMITE_SIMPLES_ANUAL_CENTAVOS,
  MEI_ICMS_CENTAVOS,
  MEI_INSS_PERCENTUAL,
  MEI_ISS_CENTAVOS,
  PARAMETROS_CONFERIDOS_POR,
  SALARIO_MINIMO_CENTAVOS,
  SUBLIMITE_ICMS_ISS_ANUAL_CENTAVOS,
  type AnexoSimples,
} from "./parametros";
import {
  anexoPorFatorR,
  apurarSimples,
  calcularFatorR,
  folhaNecessariaParaAnexoIII,
} from "./simples";
import { apurarPresumido } from "./presumido";
import { avaliarSimplesHibrido, type ResultadoSimplesHibrido } from "./reforma";

/**
 * Comparador de regimes tributários (CAP-07 do projeto).
 *
 * Regra de ouro deste módulo: todos os regimes são medidos pelo MESMO
 * denominador — desembolso mensal total, já com INSS patronal. Comparar
 * DAS contra "IRPJ + CSLL" sem a folha dá vantagem artificial ao
 * Presumido e é o erro mais comum em simulador de internet.
 *
 * Função pura: nenhuma data interna, nenhuma chamada de rede.
 */

export type AtividadeComparador = "comercio" | "industria" | "servico" | "transporte";

export interface EntradaComparador {
  atividade: AtividadeComparador;
  faturamentoMensalCentavos: number;
  /** Folha de funcionários, sem o pró-labore. */
  folhaMensalCentavos: number;
  proLaboreMensalCentavos: number;
  /** Compras de insumos/mercadorias que geram crédito. */
  comprasMensaisCentavos?: number;
  /** Alíquota de ISS do município (0..1). */
  issAliquota?: number;
  /** ICMS efetivo sobre a receita (0..1), para comércio e indústria. */
  icmsEfetivo?: number;
  /** Fatia do faturamento vendida para PJ que aproveita crédito (0..1). */
  parcelaVendaParaPJ?: number;
  /** Serviço listado no Anexo IV (construção, advocacia, vigilância…). */
  servicoAnexoIV?: boolean;
  /** Ano-base da simulação da reforma. */
  anoReforma: number;
  /** Número de sócios, para checar elegibilidade ao MEI. */
  socios?: number;
  funcionarios?: number;
}

export interface LinhaDetalhe {
  rotulo: string;
  valorCentavos: number;
}

export type RegimeId = "mei" | "simples" | "presumido";

export interface OpcaoRegime {
  id: RegimeId;
  nome: string;
  elegivel: boolean;
  motivoInelegibilidade?: string;
  cargaMensalCentavos: number;
  /** Carga ÷ faturamento. */
  cargaEfetiva: number;
  detalhe: LinhaDetalhe[];
  observacoes: string[];
}

export interface OportunidadeFatorR {
  fatorRAtual: number;
  anexoAtual: AnexoSimples;
  folhaFaltanteCentavos: number;
  economiaMensalEstimadaCentavos: number;
}

export type NivelAlerta = "info" | "atencao" | "bloqueio";

export interface AlertaComparador {
  id: string;
  nivel: NivelAlerta;
  titulo: string;
  detalhe: string;
}

export interface ResultadoComparador {
  opcoes: OpcaoRegime[];
  recomendado: OpcaoRegime;
  /** Diferença anual entre o recomendado e o segundo colocado elegível. */
  economiaAnualCentavos: number;
  anexoSimples: AnexoSimples;
  fatorR: number;
  oportunidadeFatorR: OportunidadeFatorR | null;
  simplesHibrido: ResultadoSimplesHibrido | null;
  alertas: AlertaComparador[];
  /** Falso enquanto ninguém do escritório homologou os parâmetros. */
  parametrosHomologados: boolean;
}

function anexoDaAtividade(
  entrada: EntradaComparador,
  fatorR: number,
): AnexoSimples {
  if (entrada.atividade === "comercio") return "I";
  if (entrada.atividade === "industria") return "II";
  if (entrada.servicoAnexoIV) return "IV";
  return anexoPorFatorR(fatorR);
}

function avaliarMei(entrada: EntradaComparador): OpcaoRegime {
  const anual = entrada.faturamentoMensalCentavos * 12;
  const socios = entrada.socios ?? 1;
  const funcionarios = entrada.funcionarios ?? 0;

  const inss = Math.round(SALARIO_MINIMO_CENTAVOS * MEI_INSS_PERCENTUAL);
  const tributoFixo =
    entrada.atividade === "servico" ? MEI_ISS_CENTAVOS : MEI_ICMS_CENTAVOS;
  const das = inss + tributoFixo;

  let motivo: string | undefined;
  if (anual > LIMITE_MEI_ANUAL_CENTAVOS) {
    motivo = "Faturamento anual acima do teto de R$ 81.000 do MEI.";
  } else if (socios > 1) {
    motivo = "MEI não admite sociedade.";
  } else if (funcionarios > 1) {
    motivo = "MEI pode ter no máximo um funcionário.";
  } else if (entrada.atividade === "industria") {
    motivo = "Verifique se a atividade industrial consta na lista de ocupações do MEI.";
  }

  return {
    id: "mei",
    nome: "MEI",
    elegivel: !motivo,
    motivoInelegibilidade: motivo,
    cargaMensalCentavos: das,
    cargaEfetiva:
      entrada.faturamentoMensalCentavos > 0 ? das / entrada.faturamentoMensalCentavos : 0,
    detalhe: [
      { rotulo: "INSS (5% do salário mínimo)", valorCentavos: inss },
      {
        rotulo: entrada.atividade === "servico" ? "ISS fixo" : "ICMS fixo",
        valorCentavos: tributoFixo,
      },
    ],
    observacoes: [
      "Valor fixo, independente do faturamento.",
      "Não gera crédito de CBS/IBS para o cliente PJ.",
    ],
  };
}

function avaliarSimplesComo(
  entrada: EntradaComparador,
  anexo: AnexoSimples,
  folha12Centavos: number,
): OpcaoRegime {
  const anual = entrada.faturamentoMensalCentavos * 12;

  const resultado = apurarSimples({
    rbt12Centavos: anual,
    receitaMesCentavos: entrada.faturamentoMensalCentavos,
    folha12Centavos,
    anexo,
  });

  const detalhe: LinhaDetalhe[] = [
    { rotulo: `DAS — Anexo ${anexo}, faixa ${resultado.faixa}`, valorCentavos: resultado.dasMensalCentavos },
  ];
  if (resultado.cppForaDoDasCentavos > 0) {
    detalhe.push({
      rotulo: "INSS patronal (fora do DAS no Anexo IV)",
      valorCentavos: resultado.cppForaDoDasCentavos,
    });
  }

  const observacoes = [
    `Alíquota efetiva de ${(resultado.aliquotaEfetiva * 100).toFixed(2)}% — não confunda com a nominal de ${(resultado.aliquotaNominal * 100).toFixed(2)}%.`,
  ];
  if (anexo === "IV") {
    observacoes.push(
      "No Anexo IV o INSS patronal é recolhido por fora do DAS, sobre a folha.",
    );
  }

  return {
    id: "simples",
    nome: `Simples Nacional — Anexo ${anexo}`,
    elegivel: !resultado.acimaDoTeto,
    motivoInelegibilidade: resultado.acimaDoTeto
      ? "Faturamento anual acima do teto de R$ 4,8 milhões do Simples."
      : undefined,
    cargaMensalCentavos: resultado.cargaTotalMensalCentavos,
    cargaEfetiva:
      entrada.faturamentoMensalCentavos > 0
        ? resultado.cargaTotalMensalCentavos / entrada.faturamentoMensalCentavos
        : 0,
    detalhe,
    observacoes,
  };
}

function avaliarLucroPresumido(entrada: EntradaComparador): OpcaoRegime {
  const folhaTotal = entrada.folhaMensalCentavos + entrada.proLaboreMensalCentavos;

  const r = apurarPresumido({
    receitaMesCentavos: entrada.faturamentoMensalCentavos,
    atividade: entrada.atividade,
    folhaMensalCentavos: folhaTotal,
    issAliquota: entrada.issAliquota,
    icmsEfetivo: entrada.icmsEfetivo,
  });

  const detalhe: LinhaDetalhe[] = [
    { rotulo: "IRPJ", valorCentavos: r.irpjCentavos },
    { rotulo: "CSLL", valorCentavos: r.csllCentavos },
    { rotulo: "PIS", valorCentavos: r.pisCentavos },
    { rotulo: "COFINS", valorCentavos: r.cofinsCentavos },
  ];
  if (r.adicionalIrpjCentavos > 0) {
    detalhe.splice(1, 0, {
      rotulo: "Adicional de IRPJ (10%)",
      valorCentavos: r.adicionalIrpjCentavos,
    });
  }
  if (r.issCentavos > 0) detalhe.push({ rotulo: "ISS", valorCentavos: r.issCentavos });
  if (r.icmsCentavos > 0) detalhe.push({ rotulo: "ICMS", valorCentavos: r.icmsCentavos });
  if (r.cppPatronalCentavos > 0) {
    detalhe.push({
      rotulo: "INSS patronal sobre a folha",
      valorCentavos: r.cppPatronalCentavos,
    });
  }

  const observacoes: string[] = [];
  if (r.icmsNaoInformado) {
    observacoes.push(
      "ICMS não informado: a carga real de comércio e indústria é maior do que a exibida aqui.",
    );
  }
  observacoes.push("Sem teto de faturamento.");

  return {
    id: "presumido",
    nome: "Lucro Presumido",
    elegivel: true,
    cargaMensalCentavos: r.cargaTotalMensalCentavos,
    cargaEfetiva: r.cargaEfetiva,
    detalhe,
    observacoes,
  };
}

export function compararRegimes(entrada: EntradaComparador): ResultadoComparador {
  const anual = entrada.faturamentoMensalCentavos * 12;
  const folhaTotalMensal = entrada.folhaMensalCentavos + entrada.proLaboreMensalCentavos;
  const folha12 = folhaTotalMensal * 12;

  const fatorR = calcularFatorR(folha12, anual);
  const anexo = anexoDaAtividade(entrada, fatorR);

  const opcoes: OpcaoRegime[] = [
    avaliarMei(entrada),
    avaliarSimplesComo(entrada, anexo, folha12),
    avaliarLucroPresumido(entrada),
  ];

  const elegiveis = opcoes
    .filter((o) => o.elegivel)
    .sort((a, b) => a.cargaMensalCentavos - b.cargaMensalCentavos);

  // Sempre há ao menos o Lucro Presumido, que não tem teto.
  const recomendado = elegiveis[0];
  const segundo = elegiveis[1];
  const economiaAnualCentavos = segundo
    ? (segundo.cargaMensalCentavos - recomendado.cargaMensalCentavos) * 12
    : 0;

  // ── Oportunidade de Fator R ──
  let oportunidadeFatorR: OportunidadeFatorR | null = null;
  if (anexo === "V") {
    const folhaFaltante = folhaNecessariaParaAnexoIII(folha12, anual);
    if (folhaFaltante !== null) {
      const comAnexoV = avaliarSimplesComo(entrada, "V", folha12);
      const comAnexoIII = avaliarSimplesComo(entrada, "III", anual * 0.28);
      oportunidadeFatorR = {
        fatorRAtual: fatorR,
        anexoAtual: "V",
        folhaFaltanteCentavos: folhaFaltante,
        economiaMensalEstimadaCentavos: Math.max(
          0,
          comAnexoV.cargaMensalCentavos - comAnexoIII.cargaMensalCentavos,
        ),
      };
    }
  }

  // ── Simples híbrido ──
  const simplesOpcao = opcoes.find((o) => o.id === "simples")!;
  const simplesHibrido = simplesOpcao.elegivel
    ? avaliarSimplesHibrido({
        receitaMesCentavos: entrada.faturamentoMensalCentavos,
        dasMensalCentavos: simplesOpcao.detalhe[0].valorCentavos,
        anexo,
        parcelaVendaParaPJ: entrada.parcelaVendaParaPJ ?? 0,
        ano: entrada.anoReforma,
        comprasComCreditoCentavos: entrada.comprasMensaisCentavos,
      })
    : null;

  // ── Alertas ──
  const alertas: AlertaComparador[] = [];

  if (anual > LIMITE_SIMPLES_ANUAL_CENTAVOS) {
    alertas.push({
      id: "acima-do-simples",
      nivel: "bloqueio",
      titulo: "Faturamento acima do teto do Simples Nacional",
      detalhe:
        "Passando de R$ 4,8 milhões por ano a empresa vai obrigatoriamente para o Lucro Presumido ou Real.",
    });
  } else if (anual > SUBLIMITE_ICMS_ISS_ANUAL_CENTAVOS) {
    alertas.push({
      id: "sublimite-icms-iss",
      nivel: "atencao",
      titulo: "Acima do sublimite estadual de ICMS/ISS",
      detalhe:
        "A empresa segue no Simples para os tributos federais, mas passa a recolher ICMS/ISS por fora, o que muda a apuração e as obrigações acessórias.",
    });
  }

  if (entrada.atividade !== "servico" && entrada.icmsEfetivo === undefined) {
    alertas.push({
      id: "icms-nao-informado",
      nivel: "atencao",
      titulo: "ICMS não informado",
      detalhe:
        "Sem a alíquota efetiva de ICMS, o Lucro Presumido aparece mais barato do que é. Informe o percentual do seu estado para a comparação fechar.",
    });
  }

  if (oportunidadeFatorR) {
    alertas.push({
      id: "fator-r",
      nivel: "atencao",
      titulo: `Fator R em ${(fatorR * 100).toFixed(1)}% — abaixo dos 28%`,
      detalhe:
        "Seu serviço está no Anexo V, de alíquota maior. Aumentar a folha ou o pró-labore até 28% do faturamento leva a empresa ao Anexo III. O aumento de INSS costuma custar menos que a diferença de imposto, mas precisa ser calculado caso a caso.",
    });
  }

  if (!PARAMETROS_CONFERIDOS_POR) {
    alertas.push({
      id: "parametros-nao-homologados",
      nivel: "info",
      titulo: "Simulação de referência, ainda não homologada",
      detalhe:
        "As alíquotas da reforma são estimativas de transição e a alíquota de referência ainda pode mudar. Para valor oficial, a fonte é a calculadora do Portal RTC da Receita Federal. Nenhuma decisão deve ser tomada só com este resultado.",
    });
  }

  return {
    opcoes,
    recomendado,
    economiaAnualCentavos,
    anexoSimples: anexo,
    fatorR,
    oportunidadeFatorR,
    simplesHibrido,
    alertas,
    parametrosHomologados: Boolean(PARAMETROS_CONFERIDOS_POR),
  };
}
