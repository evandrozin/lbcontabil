import type {
  AssinaturaGateway,
  ClienteGateway,
  DadosAssinatura,
  DadosCliente,
  EventoWebhook,
  GatewayPagamento,
} from "./tipos";

/**
 * Gateway de desenvolvimento. Não cobra nada e não chama rede — serve para
 * rodar o funil inteiro (checkout → onboarding) antes de existir conta no
 * Asaas, e para os testes de integração das rotas.
 */
export class GatewayMock implements GatewayPagamento {
  readonly nome = "mock";

  /** Registro em memória, para inspeção em teste. */
  readonly clientes: (DadosCliente & { id: string })[] = [];
  readonly assinaturas: (DadosAssinatura & { id: string })[] = [];

  async criarCliente(dados: DadosCliente): Promise<ClienteGateway> {
    const id = `cus_mock_${this.clientes.length + 1}`;
    this.clientes.push({ ...dados, id });
    return { id };
  }

  async criarAssinatura(dados: DadosAssinatura): Promise<AssinaturaGateway> {
    const id = `sub_mock_${this.assinaturas.length + 1}`;
    this.assinaturas.push({ ...dados, id });
    return {
      id,
      status: "aguardando-pagamento",
      // Em dev a "página de pagamento" é a própria confirmação do site.
      urlPagamento: `/checkout/confirmacao?assinatura=${id}&simulado=1`,
    };
  }

  interpretarWebhook(corpo: unknown): EventoWebhook | null {
    if (typeof corpo !== "object" || corpo === null) return null;
    const evento = corpo as Partial<EventoWebhook>;
    if (!evento.tipo) return null;

    return {
      tipo: evento.tipo,
      assinaturaId: evento.assinaturaId ?? null,
      referenciaExterna: evento.referenciaExterna ?? null,
      status: evento.status ?? null,
    };
  }
}
