import {
  ErroGateway,
  type AssinaturaGateway,
  type ClienteGateway,
  type DadosAssinatura,
  type DadosCliente,
  type EventoWebhook,
  type GatewayPagamento,
  type MetodoCobranca,
  type StatusAssinatura,
} from "./tipos";

/**
 * Adaptador do Asaas (API v3).
 *
 * Só pode ser instanciado no servidor: a chave de API dá acesso total à
 * conta financeira. Nunca importe este módulo em componente "use client".
 */

const BILLING_TYPE: Record<MetodoCobranca, string> = {
  cartao: "CREDIT_CARD",
  pix: "PIX",
  boleto: "BOLETO",
  // UNDEFINED deixa o cliente escolher na página do Asaas — melhor conversão.
  "escolher-depois": "UNDEFINED",
};

/** Mapeia o status do Asaas para o nosso vocabulário interno. */
const STATUS: Record<string, StatusAssinatura> = {
  ACTIVE: "ativa",
  PENDING: "aguardando-pagamento",
  OVERDUE: "inadimplente",
  EXPIRED: "cancelada",
  INACTIVE: "cancelada",
  CANCELLED: "cancelada",
};

const STATUS_COBRANCA: Record<string, StatusAssinatura> = {
  PAYMENT_CONFIRMED: "ativa",
  PAYMENT_RECEIVED: "ativa",
  PAYMENT_CREATED: "aguardando-pagamento",
  PAYMENT_OVERDUE: "inadimplente",
  PAYMENT_DELETED: "cancelada",
  PAYMENT_REFUNDED: "cancelada",
  PAYMENT_CHARGEBACK_REQUESTED: "inadimplente",
};

interface RespostaAsaasCliente {
  id: string;
}

interface RespostaAsaasAssinatura {
  id: string;
  status?: string;
}

interface RespostaAsaasCobrancas {
  data?: { invoiceUrl?: string }[];
}

export class GatewayAsaas implements GatewayPagamento {
  readonly nome = "asaas";

  constructor(
    private readonly chaveApi: string,
    private readonly baseUrl: string,
  ) {
    if (!chaveApi) {
      throw new ErroGateway("ASAAS_API_KEY não configurada.");
    }
  }

  private async requisitar<T>(
    caminho: string,
    init?: { method?: string; body?: unknown },
  ): Promise<T> {
    const resposta = await fetch(`${this.baseUrl}${caminho}`, {
      method: init?.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        access_token: this.chaveApi,
        // O Asaas pede identificação do integrador para suporte e rate limit.
        "User-Agent": "AgrotabilMS/1.0",
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });

    const texto = await resposta.text();
    const corpo = texto ? JSON.parse(texto) : {};

    if (!resposta.ok) {
      const descricao =
        corpo?.errors?.[0]?.description ?? `Falha na chamada ao Asaas (${resposta.status}).`;
      throw new ErroGateway(descricao, resposta.status, corpo);
    }

    return corpo as T;
  }

  async criarCliente(dados: DadosCliente): Promise<ClienteGateway> {
    const cliente = await this.requisitar<RespostaAsaasCliente>("/customers", {
      method: "POST",
      body: {
        name: dados.nome,
        email: dados.email,
        cpfCnpj: dados.cpfCnpj,
        mobilePhone: dados.celular,
        postalCode: dados.cep,
        externalReference: dados.referenciaExterna,
        notificationDisabled: false,
      },
    });

    return { id: cliente.id };
  }

  async criarAssinatura(dados: DadosAssinatura): Promise<AssinaturaGateway> {
    const assinatura = await this.requisitar<RespostaAsaasAssinatura>("/subscriptions", {
      method: "POST",
      body: {
        customer: dados.clienteId,
        billingType: BILLING_TYPE[dados.metodo],
        // O Asaas trabalha em reais com 2 casas; convertemos só na fronteira.
        value: Number((dados.valorCentavos / 100).toFixed(2)),
        nextDueDate: dados.primeiroVencimento,
        cycle: "MONTHLY",
        description: dados.descricao,
        externalReference: dados.referenciaExterna,
      },
    });

    return {
      id: assinatura.id,
      status: STATUS[assinatura.status ?? "PENDING"] ?? "aguardando-pagamento",
      urlPagamento: await this.buscarLinkPrimeiraCobranca(assinatura.id),
    };
  }

  /**
   * A assinatura em si não tem URL de pagamento — quem tem é a primeira
   * cobrança gerada por ela. Se ainda não existir, o cliente recebe o link
   * por e-mail do próprio Asaas, então a falha aqui não é fatal.
   */
  private async buscarLinkPrimeiraCobranca(assinaturaId: string): Promise<string | null> {
    try {
      const cobrancas = await this.requisitar<RespostaAsaasCobrancas>(
        `/subscriptions/${assinaturaId}/payments?limit=1`,
      );
      return cobrancas.data?.[0]?.invoiceUrl ?? null;
    } catch {
      return null;
    }
  }

  interpretarWebhook(corpo: unknown): EventoWebhook | null {
    if (typeof corpo !== "object" || corpo === null) return null;

    const evento = corpo as {
      event?: string;
      payment?: { subscription?: string; externalReference?: string };
      subscription?: { id?: string; externalReference?: string; status?: string };
    };

    if (!evento.event) return null;

    const porAssinatura = evento.subscription;
    const porCobranca = evento.payment;

    return {
      tipo: evento.event,
      assinaturaId: porAssinatura?.id ?? porCobranca?.subscription ?? null,
      referenciaExterna:
        porAssinatura?.externalReference ?? porCobranca?.externalReference ?? null,
      status:
        STATUS_COBRANCA[evento.event] ??
        (porAssinatura?.status ? STATUS[porAssinatura.status] : null) ??
        null,
    };
  }
}
