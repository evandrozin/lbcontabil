/**
 * Contrato do gateway de cobrança recorrente.
 *
 * A implementação real (Asaas) e a de desenvolvimento (mock) respeitam esta
 * mesma interface, então trocar de gateway não toca em nenhuma rota.
 *
 * Decisão de arquitetura: NENHUM dado de cartão passa pelo nosso servidor.
 * Criamos a assinatura e devolvemos a URL de pagamento hospedada pelo
 * gateway. Isso nos mantém fora do escopo de PCI-DSS.
 */

export type MetodoCobranca = "cartao" | "pix" | "boleto" | "escolher-depois";

export type StatusAssinatura =
  | "aguardando-pagamento"
  | "ativa"
  | "inadimplente"
  | "cancelada";

export interface DadosCliente {
  nome: string;
  email: string;
  /** Somente dígitos/letras, sem máscara. */
  cpfCnpj: string;
  celular: string;
  cep?: string;
  /** Nosso id interno, para correlacionar webhook com a venda. */
  referenciaExterna: string;
}

export interface ClienteGateway {
  id: string;
}

export interface DadosAssinatura {
  clienteId: string;
  /** Valor da mensalidade em centavos. */
  valorCentavos: number;
  metodo: MetodoCobranca;
  descricao: string;
  /** Data da primeira cobrança no formato YYYY-MM-DD. */
  primeiroVencimento: string;
  referenciaExterna: string;
}

export interface AssinaturaGateway {
  id: string;
  status: StatusAssinatura;
  /** Página de pagamento hospedada pelo gateway. */
  urlPagamento: string | null;
}

export interface EventoWebhook {
  tipo: string;
  assinaturaId: string | null;
  referenciaExterna: string | null;
  status: StatusAssinatura | null;
}

export interface GatewayPagamento {
  readonly nome: string;
  criarCliente(dados: DadosCliente): Promise<ClienteGateway>;
  criarAssinatura(dados: DadosAssinatura): Promise<AssinaturaGateway>;
  interpretarWebhook(corpo: unknown): EventoWebhook | null;
}

export class ErroGateway extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly detalhes?: unknown,
  ) {
    super(message);
    this.name = "ErroGateway";
  }
}
