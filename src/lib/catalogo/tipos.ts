/**
 * Modelo de domínio do catálogo comercial da Agrotábil MS.
 *
 * Convenção: todo valor monetário é armazenado em CENTAVOS (inteiro).
 * Nunca use float para dinheiro — arredondamento de ponto flutuante em
 * cobrança recorrente vira divergência no fechamento do mês.
 */

export type SegmentoId =
  | "mei"
  | "simples-servicos"
  | "simples-comercio"
  | "lucro-presumido"
  | "rural";

export type TierId = "essencial" | "profissional" | "premium";

export type TipoAtividade = "servico" | "comercio" | "industria" | "rural";

export type RegimeTributario =
  | "mei"
  | "simples-nacional"
  | "lucro-presumido"
  | "lucro-real"
  | "produtor-rural-pf"
  | "nao-sei";

export type Periodicidade = "mensal" | "anual";

/** Gatilhos contratuais de mudança de plano. `null` = sem limite. */
export interface LimitesPlano {
  faturamentoMensalCentavos: number | null;
  notasFiscaisPorMes: number | null;
  funcionariosInclusos: number;
  sociosInclusos: number;
}

/** Cobrança por uso acima dos limites do plano. */
export interface ExcedentesPlano {
  tamanhoBlocoNotas: number;
  precoBlocoNotasCentavos: number;
  precoFuncionarioExtraCentavos: number;
  precoSocioExtraCentavos: number;
}

export interface Plano {
  id: string;
  segmentoId: SegmentoId;
  tierId: TierId;
  nome: string;
  chamada: string;
  /** Mensalidade no contrato mensal. */
  precoMensalCentavos: number;
  /** Mensalidade equivalente no contrato anual (com desconto aplicado). */
  precoAnualMensalizadoCentavos: number;
  /** Plano sugerido por padrão no seletor (o "mais vendido"). */
  destaque: boolean;
  limites: LimitesPlano;
  excedentes: ExcedentesPlano;
  incluso: string[];
  naoIncluso: string[];
  /** Horas médias da equipe por mês — usado na validação de custo/margem. */
  horasEquipeMes: number;
}

export interface Segmento {
  id: SegmentoId;
  slug: string;
  nome: string;
  /** Rótulo curto usado no seletor da home. */
  rotuloSeletor: string;
  headline: string;
  subheadline: string;
  atividades: TipoAtividade[];
  regimes: RegimeTributario[];
  /** Dores concretas do segmento — base dos criativos de anúncio e da LP. */
  dores: string[];
  /** Obrigações acessórias efetivamente executadas para este segmento. */
  obrigacoes: string[];
  /** Perfis de cliente-exemplo, para a seção de prova social da LP. */
  perfilCliente: string[];
  faq: { pergunta: string; resposta: string }[];
}

export type CategoriaAddon =
  | "societario"
  | "pessoal"
  | "fiscal"
  | "pessoa-fisica"
  | "consultivo";

export interface Addon {
  id: string;
  nome: string;
  descricao: string;
  categoria: CategoriaAddon;
  /** Cobrança única, mensal recorrente ou por hora trabalhada. */
  cobranca: "unica" | "mensal" | "hora";
  precoDeCentavos: number;
  precoAteCentavos: number;
  /** Segmentos em que este add-on é oferecido. Vazio = todos. */
  segmentos: SegmentoId[];
  /** Vira R$ 0 quando o cliente assina o plano anual. */
  gratuitoNoAnual: boolean;
}
