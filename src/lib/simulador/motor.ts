import { SEGMENTOS } from "@/lib/catalogo/segmentos";
import { planosDoSegmento } from "@/lib/catalogo/planos";
import { addonPorId } from "@/lib/catalogo/addons";
import {
  COBRA_DECIMA_TERCEIRA,
  FATOR_R_PERCENTUAL,
  LIMITE_MEI_ANUAL_CENTAVOS,
  LIMITE_SIMPLES_ANUAL_CENTAVOS,
  SUBLIMITE_ICMS_ISS_ANUAL_CENTAVOS,
} from "@/lib/catalogo/limites-fiscais";
import type {
  Periodicidade,
  Plano,
  RegimeTributario,
  Segmento,
  SegmentoId,
  TipoAtividade,
} from "@/lib/catalogo/tipos";

/**
 * Motor do simulador de planos. Função pura: roda igual no servidor (API,
 * SEO) e no cliente (interação em tempo real), sem I/O e sem data de hoje
 * embutida — o que mantém o resultado reproduzível e testável.
 */

export interface EntradaSimulacao {
  atividade: TipoAtividade;
  regimeAtual: RegimeTributario;
  faturamentoMensalCentavos: number;
  notasPorMes: number;
  funcionarios: number;
  socios: number;
  /** Folha mensal incluindo pró-labore. Habilita a análise de Fator R. */
  folhaMensalCentavos?: number;
  jaTemEmpresa: boolean;
  periodicidade: Periodicidade;
  addonsSelecionados?: string[];
}

export type NivelAlerta = "info" | "atencao" | "bloqueio";

export interface Alerta {
  id: string;
  nivel: NivelAlerta;
  titulo: string;
  detalhe: string;
}

export interface LinhaValor {
  descricao: string;
  valorCentavos: number;
}

export interface ResultadoSimulacao {
  segmento: Segmento;
  planoRecomendado: Plano;
  motivoRecomendacao: string;
  outrosPlanos: Plano[];
  periodicidade: Periodicidade;
  /** Mensalidade do plano já na periodicidade escolhida. */
  precoBaseCentavos: number;
  excedentes: LinhaValor[];
  addons: LinhaValor[];
  /** Base + excedentes + add-ons mensais. */
  totalMensalCentavos: number;
  /** Cobranças de uma vez só (abertura, certificado, etc.). */
  custosUnicosCentavos: number;
  /** 13ª mensalidade contábil — encerramento de exercício. */
  decimaTerceiraCentavos: number;
  totalPrimeiroAnoCentavos: number;
  /** Quanto o contrato anual economiza em 12 meses frente ao mensal. */
  economiaAnualCentavos: number;
  alertas: Alerta[];
}

const MESES_NO_ANO = 12;

function anualizar(mensalCentavos: number): number {
  return mensalCentavos * MESES_NO_ANO;
}

/**
 * Enquadra o cliente em um dos 5 segmentos comerciais.
 *
 * A ordem importa: atividade rural manda em qualquer regime, porque o
 * operacional (LCDPR, FUNRURAL, eSocial rural) é o que define o custo.
 */
export function definirSegmento(entrada: EntradaSimulacao): {
  segmentoId: SegmentoId;
  motivo: string;
} {
  const faturamentoAnual = anualizar(entrada.faturamentoMensalCentavos);

  if (entrada.atividade === "rural" || entrada.regimeAtual === "produtor-rural-pf") {
    return {
      segmentoId: "rural",
      motivo: "Atividade rural exige LCDPR, FUNRURAL e eSocial rural — operação específica.",
    };
  }

  if (entrada.regimeAtual === "lucro-presumido" || entrada.regimeAtual === "lucro-real") {
    return {
      segmentoId: "lucro-presumido",
      motivo: "Você já está fora do Simples, então a rotina é de SPED, DCTF e apuração trimestral.",
    };
  }

  if (faturamentoAnual > LIMITE_SIMPLES_ANUAL_CENTAVOS) {
    return {
      segmentoId: "lucro-presumido",
      motivo: "Seu faturamento anual ultrapassa o teto do Simples Nacional.",
    };
  }

  const cabeNoMei =
    faturamentoAnual <= LIMITE_MEI_ANUAL_CENTAVOS &&
    entrada.funcionarios <= 1 &&
    entrada.socios <= 1;

  if (entrada.regimeAtual === "mei" || (entrada.regimeAtual === "nao-sei" && cabeNoMei)) {
    return {
      segmentoId: "mei",
      motivo: "Porte e faturamento compatíveis com o MEI, de rotina mais enxuta.",
    };
  }

  if (entrada.atividade === "comercio" || entrada.atividade === "industria") {
    return {
      segmentoId: "simples-comercio",
      motivo: "Comércio e indústria movimentam ICMS, ST e notas de entrada — operação fiscal pesada.",
    };
  }

  return {
    segmentoId: "simples-servicos",
    motivo: "Prestação de serviço no Simples, com acompanhamento de Fator R.",
  };
}

/** Menor plano do segmento que comporta o volume informado. */
function escolherPlano(segmentoId: SegmentoId, entrada: EntradaSimulacao): Plano {
  const planos = planosDoSegmento(segmentoId);

  const cabe = planos.find((plano) => {
    const { limites } = plano;
    const faturamentoOk =
      limites.faturamentoMensalCentavos === null ||
      entrada.faturamentoMensalCentavos <= limites.faturamentoMensalCentavos;
    const notasOk =
      limites.notasFiscaisPorMes === null || entrada.notasPorMes <= limites.notasFiscaisPorMes;
    const funcionariosOk = entrada.funcionarios <= limites.funcionariosInclusos;
    const sociosOk = entrada.socios <= limites.sociosInclusos;
    return faturamentoOk && notasOk && funcionariosOk && sociosOk;
  });

  // Nada comporta o volume: fica no topo e o excedente é cobrado à parte.
  return cabe ?? planos[planos.length - 1];
}

function calcularExcedentes(plano: Plano, entrada: EntradaSimulacao): LinhaValor[] {
  const linhas: LinhaValor[] = [];
  const { limites, excedentes } = plano;

  if (limites.notasFiscaisPorMes !== null && entrada.notasPorMes > limites.notasFiscaisPorMes) {
    const excedente = entrada.notasPorMes - limites.notasFiscaisPorMes;
    const blocos = Math.ceil(excedente / excedentes.tamanhoBlocoNotas);
    const valor = blocos * excedentes.precoBlocoNotasCentavos;
    if (valor > 0) {
      linhas.push({
        descricao: `${blocos} bloco(s) de ${excedentes.tamanhoBlocoNotas} notas acima do limite do plano`,
        valorCentavos: valor,
      });
    }
  }

  if (entrada.funcionarios > limites.funcionariosInclusos) {
    const extras = entrada.funcionarios - limites.funcionariosInclusos;
    linhas.push({
      descricao: `${extras} funcionário(s) adicional(is) na folha`,
      valorCentavos: extras * excedentes.precoFuncionarioExtraCentavos,
    });
  }

  if (entrada.socios > limites.sociosInclusos) {
    const extras = entrada.socios - limites.sociosInclusos;
    linhas.push({
      descricao: `${extras} pró-labore(s) adicional(is)`,
      valorCentavos: extras * excedentes.precoSocioExtraCentavos,
    });
  }

  return linhas;
}

function montarAlertas(
  segmentoId: SegmentoId,
  entrada: EntradaSimulacao,
): Alerta[] {
  const alertas: Alerta[] = [];
  const faturamentoAnual = anualizar(entrada.faturamentoMensalCentavos);

  if (entrada.regimeAtual === "mei" && faturamentoAnual > LIMITE_MEI_ANUAL_CENTAVOS) {
    alertas.push({
      id: "mei-acima-do-limite",
      nivel: "bloqueio",
      titulo: "Seu faturamento já estourou o limite do MEI",
      detalhe:
        "Acima de R$ 81.000 por ano o desenquadramento é obrigatório e retroage ao início do excesso. Quanto antes fizermos a migração, menor o imposto e a multa.",
    });
  } else if (
    segmentoId === "mei" &&
    faturamentoAnual > LIMITE_MEI_ANUAL_CENTAVOS * 0.8
  ) {
    alertas.push({
      id: "mei-proximo-do-limite",
      nivel: "atencao",
      titulo: "Você está perto do teto do MEI",
      detalhe:
        "Já passou de 80% do limite anual. Vale planejar a migração para ME antes de estourar e pagar imposto retroativo.",
    });
  }

  if (entrada.regimeAtual === "mei" && entrada.funcionarios > 1) {
    alertas.push({
      id: "mei-multiplos-funcionarios",
      nivel: "bloqueio",
      titulo: "MEI só pode ter um funcionário",
      detalhe:
        "Com mais de um empregado registrado o enquadramento como MEI não se sustenta. Precisamos migrar a empresa para ME no Simples Nacional.",
    });
  }

  if (
    faturamentoAnual > SUBLIMITE_ICMS_ISS_ANUAL_CENTAVOS &&
    faturamentoAnual <= LIMITE_SIMPLES_ANUAL_CENTAVOS
  ) {
    alertas.push({
      id: "sublimite-icms-iss",
      nivel: "atencao",
      titulo: "Você passou do sublimite estadual de ICMS/ISS",
      detalhe:
        "Acima de R$ 3,6 milhões por ano a empresa continua no Simples para os tributos federais, mas passa a recolher ICMS/ISS por fora. Isso muda a apuração e as obrigações acessórias.",
    });
  }

  if (faturamentoAnual > LIMITE_SIMPLES_ANUAL_CENTAVOS) {
    alertas.push({
      id: "acima-do-simples",
      nivel: "atencao",
      titulo: "Faturamento acima do teto do Simples Nacional",
      detalhe:
        "Passando de R$ 4,8 milhões por ano a empresa vai para o Lucro Presumido ou Real. Fazemos o comparativo dos regimes antes da virada.",
    });
  }

  if (segmentoId === "simples-servicos") {
    if (entrada.folhaMensalCentavos === undefined) {
      alertas.push({
        id: "fator-r-sem-folha",
        nivel: "info",
        titulo: "Informe sua folha para simularmos o Fator R",
        detalhe:
          "Com folha e pró-labore somando 28% da receita, seu serviço sai do Anexo V e vai para o Anexo III, com alíquota inicial bem menor.",
      });
    } else if (entrada.faturamentoMensalCentavos > 0) {
      const fatorR = entrada.folhaMensalCentavos / entrada.faturamentoMensalCentavos;
      if (fatorR < FATOR_R_PERCENTUAL) {
        alertas.push({
          id: "fator-r-abaixo",
          nivel: "atencao",
          titulo: `Seu Fator R está em ${(fatorR * 100).toFixed(1)}% — abaixo dos 28%`,
          detalhe:
            "Isso provavelmente coloca seu serviço no Anexo V, com alíquota inicial maior. Ajustar o pró-labore costuma custar menos do que a diferença de imposto. Simulamos isso na migração.",
        });
      } else {
        alertas.push({
          id: "fator-r-ok",
          nivel: "info",
          titulo: `Seu Fator R está em ${(fatorR * 100).toFixed(1)}% — dentro do Anexo III`,
          detalhe:
            "Mantendo a folha nesse patamar você segue na alíquota menor. Acompanhamos esse índice todo mês para não escorregar.",
        });
      }
    }
  }

  if (segmentoId === "rural") {
    alertas.push({
      id: "rural-lcdpr",
      nivel: "info",
      titulo: "LCDPR, FUNRURAL e ITR entram no plano",
      detalhe:
        "A escrituração do Livro Caixa é o que permite deduzir custeio e investimento. Sem ela, o imposto incide praticamente sobre a receita bruta da atividade.",
    });
  }

  if (segmentoId === "simples-comercio") {
    alertas.push({
      id: "comercio-xml",
      nivel: "info",
      titulo: "Captura automática de notas exige certificado A1",
      detalhe:
        "Com o e-CNPJ A1 buscamos suas notas de entrada direto na SEFAZ. Sem ele, você precisaria encaminhar cada XML manualmente.",
    });
  }

  if (!entrada.jaTemEmpresa) {
    alertas.push({
      id: "abertura-gratuita",
      nivel: "info",
      titulo: "Abertura de empresa grátis no plano anual",
      detalhe:
        "Assinando o contrato anual, a abertura sai sem honorários — você paga apenas as taxas da Junta Comercial e do município.",
    });
  }

  return alertas;
}

export function simular(entrada: EntradaSimulacao): ResultadoSimulacao {
  const { segmentoId, motivo } = definirSegmento(entrada);
  const segmento = SEGMENTOS[segmentoId];
  const planoRecomendado = escolherPlano(segmentoId, entrada);

  const precoBaseCentavos =
    entrada.periodicidade === "anual"
      ? planoRecomendado.precoAnualMensalizadoCentavos
      : planoRecomendado.precoMensalCentavos;

  const excedentes = calcularExcedentes(planoRecomendado, entrada);

  const addonsMensais: LinhaValor[] = [];
  let custosUnicosCentavos = 0;

  for (const addonId of entrada.addonsSelecionados ?? []) {
    const addon = addonPorId(addonId);
    if (!addon) continue;

    const gratuito = addon.gratuitoNoAnual && entrada.periodicidade === "anual";
    // Exibimos o piso da faixa: é o compromisso que o checkout pode honrar.
    const valor = gratuito ? 0 : addon.precoDeCentavos;

    if (addon.cobranca === "mensal") {
      addonsMensais.push({ descricao: addon.nome, valorCentavos: valor });
    } else {
      custosUnicosCentavos += valor;
    }
  }

  const totalMensalCentavos =
    precoBaseCentavos +
    excedentes.reduce((soma, l) => soma + l.valorCentavos, 0) +
    addonsMensais.reduce((soma, l) => soma + l.valorCentavos, 0);

  const decimaTerceiraCentavos = COBRA_DECIMA_TERCEIRA ? precoBaseCentavos : 0;

  const totalPrimeiroAnoCentavos =
    anualizar(totalMensalCentavos) + decimaTerceiraCentavos + custosUnicosCentavos;

  // A economia compara sempre contra a tabela mensal cheia, incluindo a 13ª.
  const parcelasNoAno = COBRA_DECIMA_TERCEIRA ? MESES_NO_ANO + 1 : MESES_NO_ANO;
  const economiaAnualCentavos =
    (planoRecomendado.precoMensalCentavos - planoRecomendado.precoAnualMensalizadoCentavos) *
    parcelasNoAno;

  return {
    segmento,
    planoRecomendado,
    motivoRecomendacao: motivo,
    outrosPlanos: planosDoSegmento(segmentoId).filter((p) => p.id !== planoRecomendado.id),
    periodicidade: entrada.periodicidade,
    precoBaseCentavos,
    excedentes,
    addons: addonsMensais,
    totalMensalCentavos,
    custosUnicosCentavos,
    decimaTerceiraCentavos,
    totalPrimeiroAnoCentavos,
    economiaAnualCentavos,
    alertas: montarAlertas(segmentoId, entrada),
  };
}
