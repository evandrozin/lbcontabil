import { describe, expect, it } from "vitest";
import { esquemaCheckout } from "./esquema";

const VALIDO = {
  planoId: "simples-servicos-profissional",
  periodicidade: "anual" as const,
  metodo: "escolher-depois" as const,
  responsavelNome: "Maria Souza Lima",
  responsavelEmail: "maria@exemplo.com.br",
  responsavelCpfCnpj: "111.444.777-35",
  responsavelCelular: "(11) 98765-4321",
  cep: "01310-100",
  jaTemEmpresa: false,
  aceiteContrato: true as const,
};

describe("esquemaCheckout", () => {
  it("aceita uma contratação completa de empresa a abrir", () => {
    const r = esquemaCheckout.safeParse(VALIDO);
    expect(r.success).toBe(true);
  });

  it("normaliza documento, celular e CEP removendo a máscara", () => {
    const r = esquemaCheckout.parse(VALIDO);
    expect(r.responsavelCpfCnpj).toBe("11144477735");
    expect(r.responsavelCelular).toBe("11987654321");
    expect(r.cep).toBe("01310100");
  });

  it("exige nome e sobrenome", () => {
    const r = esquemaCheckout.safeParse({ ...VALIDO, responsavelNome: "Maria" });
    expect(r.success).toBe(false);
  });

  it("recusa documento com dígito verificador inválido", () => {
    const r = esquemaCheckout.safeParse({
      ...VALIDO,
      responsavelCpfCnpj: "111.444.777-36",
    });
    expect(r.success).toBe(false);
  });

  it("recusa contratação sem aceite do contrato", () => {
    const r = esquemaCheckout.safeParse({ ...VALIDO, aceiteContrato: false });
    expect(r.success).toBe(false);
  });

  it("exige CNPJ e razão social de quem já tem empresa", () => {
    const r = esquemaCheckout.safeParse({ ...VALIDO, jaTemEmpresa: true });
    expect(r.success).toBe(false);

    const campos = r.success ? {} : r.error.flatten().fieldErrors;
    expect(campos.empresaCnpj?.[0]).toMatch(/Informe o CNPJ/);
  });

  it("recusa CNPJ de empresa com dígito inválido", () => {
    const r = esquemaCheckout.safeParse({
      ...VALIDO,
      jaTemEmpresa: true,
      empresaRazaoSocial: "Fazenda Exemplo Ltda",
      empresaCnpj: "11.222.333/0001-82",
    });
    expect(r.success).toBe(false);
  });

  it("aceita empresa existente com CNPJ e razão social válidos", () => {
    const r = esquemaCheckout.safeParse({
      ...VALIDO,
      jaTemEmpresa: true,
      empresaRazaoSocial: "Fazenda Exemplo Ltda",
      empresaCnpj: "11.222.333/0001-81",
    });
    expect(r.success).toBe(true);
  });

  it("aceita CNPJ alfanumérico da empresa", () => {
    const r = esquemaCheckout.safeParse({
      ...VALIDO,
      jaTemEmpresa: true,
      empresaRazaoSocial: "Nova Empresa Ltda",
      empresaCnpj: "12.ABC.345/01DE-35",
    });
    expect(r.success).toBe(true);
  });

  it("não exige dados de empresa de quem vai abrir agora", () => {
    const r = esquemaCheckout.safeParse({ ...VALIDO, jaTemEmpresa: false });
    expect(r.success).toBe(true);
  });

  it("aceita CEP em branco", () => {
    const r = esquemaCheckout.safeParse({ ...VALIDO, cep: "" });
    expect(r.success).toBe(true);
  });
});
