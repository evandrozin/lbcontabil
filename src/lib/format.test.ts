import { describe, expect, it } from "vitest";
import { dataIsoParaBr, moeda, moedaCurta, paraCentavos } from "./format";

describe("dataIsoParaBr", () => {
  // O motivo desta função existir: `new Date("2026-09-30")` é meia-noite
  // UTC, e em UTC−3 volta para 29/09. Num prazo de opção tributária, isso
  // antecipa o vencimento em um dia na cara do cliente.
  it("não desloca a data por fuso horário", () => {
    expect(dataIsoParaBr("2026-09-30")).toBe("30/09/2026");
    expect(dataIsoParaBr("2026-01-01")).toBe("01/01/2026");
    expect(dataIsoParaBr("2026-12-31")).toBe("31/12/2026");
  });

  it("devolve a entrada intacta quando não é uma data ISO", () => {
    expect(dataIsoParaBr("amanhã")).toBe("amanhã");
    expect(dataIsoParaBr("")).toBe("");
  });
});

describe("moeda", () => {
  it("formata centavos no padrão brasileiro", () => {
    expect(moeda(1_290_00).replace(/ /g, " ")).toBe("R$ 1.290,00");
    expect(moeda(0).replace(/ /g, " ")).toBe("R$ 0,00");
  });

  it("omite centavos redondos na versão curta", () => {
    expect(moedaCurta(89_00).replace(/ /g, " ")).toBe("R$ 89");
    expect(moedaCurta(89_50).replace(/ /g, " ")).toBe("R$ 89,50");
  });
});

describe("paraCentavos", () => {
  it("lê valores digitados no padrão brasileiro", () => {
    expect(paraCentavos("1.234,56")).toBe(123456);
    expect(paraCentavos("R$ 30,00")).toBe(3000);
    expect(paraCentavos("500")).toBe(50000);
  });

  it("devolve zero para entrada inválida", () => {
    expect(paraCentavos("")).toBe(0);
    expect(paraCentavos("abc")).toBe(0);
  });
});
