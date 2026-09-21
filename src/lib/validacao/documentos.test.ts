import { describe, expect, it } from "vitest";
import {
  formatarCNPJ,
  formatarCPF,
  formatarCelular,
  validarCEP,
  validarCNPJ,
  validarCPF,
  validarCelular,
  validarCpfOuCnpj,
} from "./documentos";

describe("CPF", () => {
  it("aceita CPF com dígitos verificadores corretos", () => {
    expect(validarCPF("111.444.777-35")).toBe(true);
    expect(validarCPF("11144477735")).toBe(true);
    expect(validarCPF("529.982.247-25")).toBe(true);
  });

  it("recusa dígito verificador errado", () => {
    expect(validarCPF("111.444.777-36")).toBe(false);
    expect(validarCPF("529.982.247-20")).toBe(false);
  });

  it("recusa sequência repetida e tamanho errado", () => {
    expect(validarCPF("111.111.111-11")).toBe(false);
    expect(validarCPF("000.000.000-00")).toBe(false);
    expect(validarCPF("1114447773")).toBe(false);
    expect(validarCPF("")).toBe(false);
  });

  it("formata progressivamente enquanto o usuário digita", () => {
    expect(formatarCPF("111")).toBe("111");
    expect(formatarCPF("111444")).toBe("111.444");
    expect(formatarCPF("11144477735")).toBe("111.444.777-35");
  });
});

describe("CNPJ numérico", () => {
  it("aceita CNPJ válido com e sem máscara", () => {
    expect(validarCNPJ("11.222.333/0001-81")).toBe(true);
    expect(validarCNPJ("11222333000181")).toBe(true);
  });

  it("recusa dígito verificador errado", () => {
    expect(validarCNPJ("11.222.333/0001-82")).toBe(false);
  });

  it("recusa sequência repetida e tamanho errado", () => {
    expect(validarCNPJ("11111111111111")).toBe(false);
    expect(validarCNPJ("1122233300018")).toBe(false);
  });

  it("formata progressivamente", () => {
    expect(formatarCNPJ("11222333000181")).toBe("11.222.333/0001-81");
  });
});

describe("CNPJ alfanumérico (IN RFB 2.229/2024)", () => {
  it("valida o exemplo oficial 12.ABC.345/01DE-35", () => {
    expect(validarCNPJ("12ABC34501DE35")).toBe(true);
    expect(validarCNPJ("12.ABC.345/01DE-35")).toBe(true);
  });

  it("normaliza minúsculas antes de validar", () => {
    expect(validarCNPJ("12abc34501de35")).toBe(true);
  });

  it("recusa dígito verificador errado no alfanumérico", () => {
    expect(validarCNPJ("12ABC34501DE36")).toBe(false);
  });

  it("recusa letra nos dois dígitos verificadores", () => {
    expect(validarCNPJ("12ABC34501DEAB")).toBe(false);
  });
});

describe("validarCpfOuCnpj", () => {
  it("resolve pelo tamanho do documento", () => {
    expect(validarCpfOuCnpj("111.444.777-35")).toBe(true);
    expect(validarCpfOuCnpj("11.222.333/0001-81")).toBe(true);
    expect(validarCpfOuCnpj("123")).toBe(false);
  });
});

describe("celular e CEP", () => {
  it("exige DDD e nono dígito no celular", () => {
    expect(validarCelular("(11) 98765-4321")).toBe(true);
    expect(validarCelular("11987654321")).toBe(true);
    expect(validarCelular("1187654321")).toBe(false);
    expect(validarCelular("01987654321")).toBe(false);
  });

  it("formata celular durante a digitação", () => {
    expect(formatarCelular("11987654321")).toBe("(11) 98765-4321");
  });

  it("valida CEP de 8 dígitos", () => {
    expect(validarCEP("01310-100")).toBe(true);
    expect(validarCEP("0131010")).toBe(false);
  });
});
