import type { Addon, SegmentoId } from "./tipos";

/**
 * Serviços avulsos. O estudo é explícito: nem tudo entra na mensalidade —
 * é a tabela de avulsos que rentabiliza a carteira depois da venda.
 *
 * Faixas (de/até) porque o preço final depende da complexidade do caso; o
 * checkout apresenta a faixa e o fechamento é feito no atendimento.
 */
export const ADDONS: Addon[] = [
  {
    id: "abertura-empresa",
    nome: "Abertura de empresa",
    descricao:
      "Consulta de viabilidade, contrato social, CNPJ, inscrições estadual/municipal e alvará. Grátis para quem assina o plano anual — você paga apenas as taxas da Junta Comercial.",
    categoria: "societario",
    cobranca: "unica",
    precoDeCentavos: 300_00,
    precoAteCentavos: 600_00,
    segmentos: [],
    gratuitoNoAnual: true,
  },
  {
    id: "migracao-contador",
    nome: "Migração de contador",
    descricao:
      "Solicitação dos arquivos ao contador anterior, diagnóstico de pendências e assunção das obrigações do mês corrente.",
    categoria: "societario",
    cobranca: "unica",
    precoDeCentavos: 0,
    precoAteCentavos: 0,
    segmentos: [],
    gratuitoNoAnual: false,
  },
  {
    id: "alteracao-contratual",
    nome: "Alteração contratual",
    descricao:
      "Mudança de sócios, capital social, endereço ou atividade (CNAE), com registro na Junta Comercial.",
    categoria: "societario",
    cobranca: "unica",
    precoDeCentavos: 400_00,
    precoAteCentavos: 1_200_00,
    segmentos: ["simples-servicos", "simples-comercio", "lucro-presumido", "rural"],
    gratuitoNoAnual: false,
  },
  {
    id: "funcionario-extra",
    nome: "Funcionário adicional na folha",
    descricao:
      "Por funcionário além do incluso no plano: admissão, folha mensal, férias, rescisão e eSocial.",
    categoria: "pessoal",
    cobranca: "mensal",
    precoDeCentavos: 30_00,
    precoAteCentavos: 50_00,
    segmentos: [],
    gratuitoNoAnual: false,
  },
  {
    id: "irpf-socio",
    nome: "IRPF do sócio ou titular",
    descricao:
      "Declaração de Imposto de Renda Pessoa Física, com apuração de ganho de capital e bens da atividade.",
    categoria: "pessoa-fisica",
    cobranca: "unica",
    precoDeCentavos: 200_00,
    precoAteCentavos: 600_00,
    segmentos: [],
    gratuitoNoAnual: false,
  },
  {
    id: "regularizacao-pendencias",
    nome: "Regularização de pendências passadas",
    descricao:
      "Auditoria de períodos anteriores, recálculo de guias vencidas, parcelamento e entrega de declarações em atraso. Cobrado por hora de trabalho.",
    categoria: "fiscal",
    cobranca: "hora",
    precoDeCentavos: 180_00,
    precoAteCentavos: 280_00,
    segmentos: [],
    gratuitoNoAnual: false,
  },
  {
    id: "certificado-digital",
    nome: "Certificado digital e-CNPJ A1",
    descricao:
      "Emissão do certificado A1 com videoconferência de validação. Obrigatório para captura automática de notas e assinatura de obrigações.",
    categoria: "fiscal",
    cobranca: "unica",
    precoDeCentavos: 180_00,
    precoAteCentavos: 280_00,
    segmentos: [],
    gratuitoNoAnual: false,
  },
  {
    id: "bpo-financeiro",
    nome: "BPO financeiro",
    descricao:
      "Gestão de contas a pagar e a receber, conciliação bancária diária e fluxo de caixa projetado.",
    categoria: "consultivo",
    cobranca: "mensal",
    precoDeCentavos: 690_00,
    precoAteCentavos: 2_400_00,
    segmentos: ["simples-comercio", "lucro-presumido", "rural"],
    gratuitoNoAnual: false,
  },
  {
    id: "planejamento-tributario",
    nome: "Planejamento tributário avulso",
    descricao:
      "Estudo comparativo Simples x Presumido x Real com os seus números reais e recomendação formal por escrito.",
    categoria: "consultivo",
    cobranca: "unica",
    precoDeCentavos: 1_200_00,
    precoAteCentavos: 4_500_00,
    segmentos: ["simples-servicos", "simples-comercio", "lucro-presumido", "rural"],
    gratuitoNoAnual: false,
  },
  {
    id: "lcdpr-retroativo",
    nome: "LCDPR retroativo",
    descricao:
      "Escrituração e entrega do Livro Caixa Digital do Produtor Rural de exercícios anteriores, com retificação do IRPF.",
    categoria: "fiscal",
    cobranca: "unica",
    precoDeCentavos: 900_00,
    precoAteCentavos: 3_500_00,
    segmentos: ["rural"],
    gratuitoNoAnual: false,
  },
  {
    id: "itr-avulso",
    nome: "ITR avulso",
    descricao:
      "Declaração do Imposto sobre a Propriedade Territorial Rural por imóvel, com apuração de área tributável.",
    categoria: "fiscal",
    cobranca: "unica",
    precoDeCentavos: 400_00,
    precoAteCentavos: 1_500_00,
    segmentos: ["rural"],
    gratuitoNoAnual: false,
  },
];

export function addonsDoSegmento(segmentoId: SegmentoId): Addon[] {
  return ADDONS.filter(
    (a) => a.segmentos.length === 0 || a.segmentos.includes(segmentoId),
  );
}

export function addonPorId(id: string): Addon | undefined {
  return ADDONS.find((a) => a.id === id);
}
