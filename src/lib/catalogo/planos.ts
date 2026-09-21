import type { Plano, SegmentoId, TierId } from "./tipos";
import { DESCONTO_PLANO_ANUAL } from "./limites-fiscais";

/**
 * Tabela de preços. Três níveis por segmento para induzir o cliente ao plano
 * intermediário (destaque = true).
 *
 * As horas de equipe de cada plano não são estimativa de vitrine: são o
 * insumo da validação de custo/margem. Se a operação passar a gastar mais
 * horas do que o declarado aqui, o teste quebra e o preço precisa subir.
 *
 * A 13ª mensalidade contábil (encerramento de exercício) não entra nesta
 * conta — é folga de margem sobre o piso calculado, não receita presumida.
 */

/** Desconto anual arredondado para o real cheio, para não exibir centavo quebrado. */
function mensalidadeAnual(precoMensalCentavos: number): number {
  const comDesconto = precoMensalCentavos * (1 - DESCONTO_PLANO_ANUAL);
  return Math.round(comDesconto / 100) * 100;
}

interface EsbocoPlano {
  tierId: TierId;
  nome: string;
  chamada: string;
  precoMensalCentavos: number;
  destaque: boolean;
  horasEquipeMes: number;
  limites: Plano["limites"];
  excedentes: Plano["excedentes"];
  incluso: string[];
  naoIncluso: string[];
}

const ESBOCOS: Record<SegmentoId, EsbocoPlano[]> = {
  mei: [
    {
      tierId: "essencial",
      nome: "MEI Essencial",
      chamada: "Para quem quer só ficar em dia, sem funcionário.",
      precoMensalCentavos: 89_00,
      destaque: false,
      horasEquipeMes: 0.5,
      limites: {
        faturamentoMensalCentavos: 6_750_00,
        notasFiscaisPorMes: 20,
        funcionariosInclusos: 0,
        sociosInclusos: 1,
      },
      excedentes: {
        tamanhoBlocoNotas: 20,
        precoBlocoNotasCentavos: 39_00,
        precoFuncionarioExtraCentavos: 45_00,
        precoSocioExtraCentavos: 79_00,
      },
      incluso: [
        "DAS-SIMEI emitido e enviado todo mês",
        "DASN-SIMEI (declaração anual)",
        "Alerta de limite de faturamento",
        "Suporte por e-mail e chamado em até 2 dias úteis",
      ],
      naoIncluso: [
        "Folha de pagamento de funcionário",
        "Emissão de nota pela contabilidade",
        "Atendimento por WhatsApp",
      ],
    },
    {
      tierId: "profissional",
      nome: "MEI Profissional",
      chamada: "Para o MEI que já tem funcionário ou emite nota todo dia.",
      precoMensalCentavos: 119_00,
      destaque: true,
      horasEquipeMes: 0.7,
      limites: {
        faturamentoMensalCentavos: 6_750_00,
        notasFiscaisPorMes: 40,
        funcionariosInclusos: 1,
        sociosInclusos: 1,
      },
      excedentes: {
        tamanhoBlocoNotas: 20,
        precoBlocoNotasCentavos: 39_00,
        precoFuncionarioExtraCentavos: 39_00,
        precoSocioExtraCentavos: 79_00,
      },
      incluso: [
        "Tudo do Essencial",
        "Folha do funcionário MEI com FGTS e eSocial",
        "Suporte por WhatsApp em horário comercial",
        "Conferência de retenções nas notas emitidas",
      ],
      naoIncluso: ["Emissão de nota pela contabilidade", "Consultoria tributária dedicada"],
    },
    {
      tierId: "premium",
      nome: "MEI Premium",
      chamada: "Para quem está perto do limite e vai virar ME.",
      precoMensalCentavos: 149_00,
      destaque: false,
      horasEquipeMes: 1.0,
      limites: {
        faturamentoMensalCentavos: 6_750_00,
        notasFiscaisPorMes: null,
        funcionariosInclusos: 1,
        sociosInclusos: 1,
      },
      excedentes: {
        tamanhoBlocoNotas: 20,
        precoBlocoNotasCentavos: 0,
        precoFuncionarioExtraCentavos: 35_00,
        precoSocioExtraCentavos: 79_00,
      },
      incluso: [
        "Tudo do Profissional",
        "Notas ilimitadas",
        "Estudo de desenquadramento e migração para ME",
        "IRPF do titular incluso",
      ],
      naoIncluso: ["BPO financeiro"],
    },
  ],

  "simples-servicos": [
    {
      tierId: "essencial",
      nome: "Serviços Essencial",
      chamada: "PJ de um sócio, sem funcionário.",
      precoMensalCentavos: 249_00,
      destaque: false,
      horasEquipeMes: 1.4,
      limites: {
        faturamentoMensalCentavos: 30_000_00,
        notasFiscaisPorMes: 20,
        funcionariosInclusos: 0,
        sociosInclusos: 1,
      },
      excedentes: {
        tamanhoBlocoNotas: 20,
        precoBlocoNotasCentavos: 49_00,
        precoFuncionarioExtraCentavos: 45_00,
        precoSocioExtraCentavos: 89_00,
      },
      incluso: [
        "Apuração mensal do DAS",
        "Pró-labore de 1 sócio",
        "Acompanhamento do Fator R",
        "DEFIS e balanço anual",
        "Suporte por chamado em até 1 dia útil",
      ],
      naoIncluso: [
        "Folha de funcionários",
        "Conciliação bancária mensal",
        "Atendimento por WhatsApp",
      ],
    },
    {
      tierId: "profissional",
      nome: "Serviços Profissional",
      chamada: "O mais contratado por empresas de T.I., saúde e consultoria.",
      precoMensalCentavos: 349_00,
      destaque: true,
      horasEquipeMes: 2.2,
      limites: {
        faturamentoMensalCentavos: 80_000_00,
        notasFiscaisPorMes: 50,
        funcionariosInclusos: 3,
        sociosInclusos: 2,
      },
      excedentes: {
        tamanhoBlocoNotas: 20,
        precoBlocoNotasCentavos: 49_00,
        precoFuncionarioExtraCentavos: 39_00,
        precoSocioExtraCentavos: 79_00,
      },
      incluso: [
        "Tudo do Essencial",
        "Folha de até 3 funcionários com eSocial",
        "Suporte prioritário por WhatsApp",
        "DRE simplificada trimestral",
        "Otimização do Fator R com simulação de pró-labore",
      ],
      naoIncluso: ["BPO financeiro", "Reunião de planejamento tributário"],
    },
    {
      tierId: "premium",
      nome: "Serviços Premium",
      chamada: "Consultivo, com contador responsável nomeado.",
      precoMensalCentavos: 499_00,
      destaque: false,
      horasEquipeMes: 3.5,
      limites: {
        faturamentoMensalCentavos: 200_000_00,
        notasFiscaisPorMes: 120,
        funcionariosInclusos: 8,
        sociosInclusos: 4,
      },
      excedentes: {
        tamanhoBlocoNotas: 20,
        precoBlocoNotasCentavos: 39_00,
        precoFuncionarioExtraCentavos: 35_00,
        precoSocioExtraCentavos: 69_00,
      },
      incluso: [
        "Tudo do Profissional",
        "Reunião trimestral de planejamento tributário",
        "Conciliação bancária mensal",
        "Contador responsável nomeado, com telefone direto",
        "IRPF dos sócios incluso",
      ],
      naoIncluso: ["BPO financeiro completo (contas a pagar e receber)"],
    },
  ],

  "simples-comercio": [
    {
      tierId: "essencial",
      nome: "Comércio Essencial",
      chamada: "Loja pequena, volume baixo de notas.",
      precoMensalCentavos: 499_00,
      destaque: false,
      horasEquipeMes: 3.5,
      limites: {
        faturamentoMensalCentavos: 50_000_00,
        notasFiscaisPorMes: 60,
        funcionariosInclusos: 1,
        sociosInclusos: 2,
      },
      excedentes: {
        tamanhoBlocoNotas: 50,
        precoBlocoNotasCentavos: 89_00,
        precoFuncionarioExtraCentavos: 45_00,
        precoSocioExtraCentavos: 89_00,
      },
      incluso: [
        "Apuração de DAS, ICMS e ICMS-ST",
        "Captura automática de XML na SEFAZ",
        "Folha de 1 funcionário",
        "SPED Fiscal e balanço anual",
      ],
      naoIncluso: ["Controle de estoque e CMV", "Conciliação de marketplace"],
    },
    {
      tierId: "profissional",
      nome: "Comércio Profissional",
      chamada: "Para e-commerce e loja com equipe.",
      precoMensalCentavos: 649_00,
      destaque: true,
      horasEquipeMes: 5.0,
      limites: {
        faturamentoMensalCentavos: 150_000_00,
        notasFiscaisPorMes: 200,
        funcionariosInclusos: 5,
        sociosInclusos: 3,
      },
      excedentes: {
        tamanhoBlocoNotas: 50,
        precoBlocoNotasCentavos: 79_00,
        precoFuncionarioExtraCentavos: 39_00,
        precoSocioExtraCentavos: 79_00,
      },
      incluso: [
        "Tudo do Essencial",
        "Folha de até 5 funcionários",
        "Apuração de DIFAL em venda interestadual",
        "Conciliação de repasse de marketplace",
        "Suporte prioritário por WhatsApp",
      ],
      naoIncluso: ["BPO financeiro", "Inventário físico"],
    },
    {
      tierId: "premium",
      nome: "Comércio Premium",
      chamada: "Alto volume, multicanal e controle de estoque.",
      precoMensalCentavos: 899_00,
      destaque: false,
      horasEquipeMes: 7.0,
      limites: {
        faturamentoMensalCentavos: 400_000_00,
        notasFiscaisPorMes: 600,
        funcionariosInclusos: 12,
        sociosInclusos: 5,
      },
      excedentes: {
        tamanhoBlocoNotas: 100,
        precoBlocoNotasCentavos: 119_00,
        precoFuncionarioExtraCentavos: 35_00,
        precoSocioExtraCentavos: 69_00,
      },
      incluso: [
        "Tudo do Profissional",
        "Controle de estoque contábil e CMV",
        "Reunião trimestral de planejamento tributário",
        "Revisão de ST e recuperação de crédito",
        "Contador responsável nomeado",
      ],
      naoIncluso: ["Auditoria de inventário presencial"],
    },
  ],

  "lucro-presumido": [
    {
      tierId: "essencial",
      nome: "Presumido Essencial",
      chamada: "Empresa recém-migrada do Simples.",
      precoMensalCentavos: 899_00,
      destaque: false,
      horasEquipeMes: 7.0,
      limites: {
        faturamentoMensalCentavos: 150_000_00,
        notasFiscaisPorMes: 80,
        funcionariosInclusos: 3,
        sociosInclusos: 2,
      },
      excedentes: {
        tamanhoBlocoNotas: 50,
        precoBlocoNotasCentavos: 129_00,
        precoFuncionarioExtraCentavos: 45_00,
        precoSocioExtraCentavos: 99_00,
      },
      incluso: [
        "IRPJ e CSLL trimestrais",
        "PIS/COFINS mensal com conferência de retenções",
        "SPED Contábil (ECD), ECF e EFD-Contribuições",
        "DCTF e balancete mensal",
        "Folha de até 3 funcionários",
      ],
      naoIncluso: ["Conciliação bancária diária", "Planejamento tributário"],
    },
    {
      tierId: "profissional",
      nome: "Presumido Profissional",
      chamada: "Operação estruturada, com equipe e vários sócios.",
      precoMensalCentavos: 1_290_00,
      destaque: true,
      horasEquipeMes: 10.5,
      limites: {
        faturamentoMensalCentavos: 400_000_00,
        notasFiscaisPorMes: 250,
        funcionariosInclusos: 10,
        sociosInclusos: 4,
      },
      excedentes: {
        tamanhoBlocoNotas: 100,
        precoBlocoNotasCentavos: 179_00,
        precoFuncionarioExtraCentavos: 39_00,
        precoSocioExtraCentavos: 89_00,
      },
      incluso: [
        "Tudo do Essencial",
        "Folha de até 10 funcionários",
        "Conciliação bancária mensal completa",
        "Reunião trimestral de planejamento tributário",
        "Contador responsável nomeado",
      ],
      naoIncluso: ["BPO financeiro completo"],
    },
    {
      tierId: "premium",
      nome: "Presumido Premium",
      chamada: "Com BPO financeiro e comparativo de regime anual.",
      precoMensalCentavos: 1_800_00,
      destaque: false,
      horasEquipeMes: 15.0,
      limites: {
        faturamentoMensalCentavos: null,
        notasFiscaisPorMes: null,
        funcionariosInclusos: 25,
        sociosInclusos: 6,
      },
      excedentes: {
        tamanhoBlocoNotas: 100,
        precoBlocoNotasCentavos: 0,
        precoFuncionarioExtraCentavos: 35_00,
        precoSocioExtraCentavos: 79_00,
      },
      incluso: [
        "Tudo do Profissional",
        "BPO financeiro: contas a pagar e a receber",
        "Comparativo anual Simples x Presumido x Real",
        "Reunião mensal com o contador responsável",
        "IRPF de todos os sócios incluso",
      ],
      naoIncluso: ["Auditoria independente"],
    },
  ],

  rural: [
    {
      tierId: "essencial",
      nome: "Rural Essencial",
      chamada: "Produtor pessoa física, sem empregado registrado.",
      precoMensalCentavos: 600_00,
      destaque: false,
      horasEquipeMes: 4.5,
      limites: {
        faturamentoMensalCentavos: 80_000_00,
        notasFiscaisPorMes: 40,
        funcionariosInclusos: 2,
        sociosInclusos: 1,
      },
      excedentes: {
        tamanhoBlocoNotas: 50,
        precoBlocoNotasCentavos: 99_00,
        precoFuncionarioExtraCentavos: 49_00,
        precoSocioExtraCentavos: 89_00,
      },
      incluso: [
        "LCDPR escriturado e entregue",
        "Apuração de FUNRURAL com conferência de retenção",
        "ITR anual",
        "IRPF com anexo da atividade rural",
        "eSocial de até 2 empregados",
      ],
      naoIncluso: ["Folha de safra com alta rotatividade", "Comparativo PF x PJ"],
    },
    {
      tierId: "profissional",
      nome: "Rural Profissional",
      chamada: "Fazenda com empregados registrados e folha de safra.",
      precoMensalCentavos: 950_00,
      destaque: true,
      horasEquipeMes: 7.5,
      limites: {
        faturamentoMensalCentavos: 250_000_00,
        notasFiscaisPorMes: 150,
        funcionariosInclusos: 8,
        sociosInclusos: 2,
      },
      excedentes: {
        tamanhoBlocoNotas: 50,
        precoBlocoNotasCentavos: 89_00,
        precoFuncionarioExtraCentavos: 45_00,
        precoSocioExtraCentavos: 79_00,
      },
      incluso: [
        "Tudo do Essencial",
        "Folha de safra e eSocial rural de até 8 empregados",
        "Controle de custeio e investimento por talhão",
        "Suporte prioritário por WhatsApp",
        "Comparativo PF x PJ da atividade rural",
      ],
      naoIncluso: ["BPO financeiro", "Regularização de área e georreferenciamento"],
    },
    {
      tierId: "premium",
      nome: "Rural Premium",
      chamada: "Agronegócio estruturado, com planejamento de safra.",
      precoMensalCentavos: 1_500_00,
      destaque: false,
      horasEquipeMes: 12.5,
      limites: {
        faturamentoMensalCentavos: 600_000_00,
        notasFiscaisPorMes: 400,
        funcionariosInclusos: 20,
        sociosInclusos: 4,
      },
      excedentes: {
        tamanhoBlocoNotas: 100,
        precoBlocoNotasCentavos: 129_00,
        precoFuncionarioExtraCentavos: 39_00,
        precoSocioExtraCentavos: 69_00,
      },
      incluso: [
        "Tudo do Profissional",
        "Planejamento tributário de safra por videochamada",
        "BPO financeiro da atividade rural",
        "Apoio em crédito rural e documentação bancária",
        "IRPF de todo o núcleo familiar produtor",
      ],
      naoIncluso: ["Georreferenciamento e regularização fundiária"],
    },
  ],
};

export const PLANOS: Plano[] = Object.entries(ESBOCOS).flatMap(
  ([segmentoId, esbocos]) =>
    esbocos.map((esboco) => ({
      id: `${segmentoId}-${esboco.tierId}`,
      segmentoId: segmentoId as SegmentoId,
      tierId: esboco.tierId,
      nome: esboco.nome,
      chamada: esboco.chamada,
      precoMensalCentavos: esboco.precoMensalCentavos,
      precoAnualMensalizadoCentavos: mensalidadeAnual(esboco.precoMensalCentavos),
      destaque: esboco.destaque,
      limites: esboco.limites,
      excedentes: esboco.excedentes,
      incluso: esboco.incluso,
      naoIncluso: esboco.naoIncluso,
      horasEquipeMes: esboco.horasEquipeMes,
    })),
);

export function planosDoSegmento(segmentoId: SegmentoId): Plano[] {
  return PLANOS.filter((p) => p.segmentoId === segmentoId);
}

export function planoPorId(id: string): Plano | undefined {
  return PLANOS.find((p) => p.id === id);
}

/** Menor mensalidade do segmento — usada nos "a partir de R$ X" das LPs. */
export function precoInicialDoSegmento(segmentoId: SegmentoId): number {
  return Math.min(...planosDoSegmento(segmentoId).map((p) => p.precoMensalCentavos));
}
