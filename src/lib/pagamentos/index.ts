import { GatewayAsaas } from "./asaas";
import { GatewayMock } from "./mock";
import type { GatewayPagamento } from "./tipos";

export * from "./tipos";

const URLS_ASAAS = {
  sandbox: "https://api-sandbox.asaas.com/v3",
  producao: "https://api.asaas.com/v3",
} as const;

let instancia: GatewayPagamento | null = null;

/**
 * Resolve o gateway a partir do ambiente.
 *
 * Sem ASAAS_API_KEY, cai no mock — o funil continua navegável em
 * desenvolvimento sem conta no provedor. Em produção isso é um erro:
 * um checkout "de mentira" no ar é pior do que um checkout fora do ar.
 */
export function obterGateway(): GatewayPagamento {
  if (instancia) return instancia;

  const chave = process.env.ASAAS_API_KEY;
  const ambiente = process.env.ASAAS_AMBIENTE === "producao" ? "producao" : "sandbox";

  if (!chave) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ASAAS_API_KEY ausente em produção. Configure a chave ou desative o checkout.",
      );
    }
    console.warn("[pagamentos] ASAAS_API_KEY ausente — usando gateway mock.");
    instancia = new GatewayMock();
    return instancia;
  }

  instancia = new GatewayAsaas(chave, URLS_ASAAS[ambiente]);
  return instancia;
}

/** Apenas para testes: descarta a instância memoizada. */
export function redefinirGateway(novo?: GatewayPagamento): void {
  instancia = novo ?? null;
}
