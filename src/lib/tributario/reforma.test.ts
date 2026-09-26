import { describe, expect, it } from "vitest";
import {
  anoDaTransicao,
  avaliarSimplesHibrido,
  calcularCargaReforma,
  statusJanelaSimplesHibrido,
} from "./reforma";
import { ALIQUOTA_REFERENCIA_PLENA, TRANSICAO_REFORMA } from "./parametros";

describe("cronograma da transição", () => {
  it("cobre de 2026 a 2033 sem buraco", () => {
    const anos = TRANSICAO_REFORMA.map((t) => t.ano);
    expect(anos).toEqual([2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]);
  });

  it("extingue PIS/COFINS a partir de 2027", () => {
    expect(anoDaTransicao(2026).mantemPisCofins).toBe(true);
    expect(anoDaTransicao(2027).mantemPisCofins).toBe(false);
  });

  it("chega ao modelo pleno em 2033, sem ICMS e ISS", () => {
    const pleno = anoDaTransicao(2033);
    expect(pleno.mantemIcmsIss).toBe(false);
    expect(pleno.proporcaoIcmsIss).toBe(0);
    expect(pleno.cbs + pleno.ibs).toBeCloseTo(ALIQUOTA_REFERENCIA_PLENA, 3);
  });

  it("aumenta o IBS de forma monotônica ao longo da transição", () => {
    for (let i = 1; i < TRANSICAO_REFORMA.length; i++) {
      expect(TRANSICAO_REFORMA[i].ibs).toBeGreaterThanOrEqual(
        TRANSICAO_REFORMA[i - 1].ibs,
      );
    }
  });

  it("reduz ICMS/ISS conforme o IBS entra", () => {
    for (let i = 1; i < TRANSICAO_REFORMA.length; i++) {
      expect(TRANSICAO_REFORMA[i].proporcaoIcmsIss).toBeLessThanOrEqual(
        TRANSICAO_REFORMA[i - 1].proporcaoIcmsIss,
      );
    }
  });

  it("usa o ano mais próximo quando pedem um ano fora da tabela", () => {
    expect(anoDaTransicao(2020).ano).toBe(2026);
    expect(anoDaTransicao(2050).ano).toBe(2033);
  });
});

describe("carga de CBS/IBS", () => {
  it("cobra apenas 1% no ano-teste de 2026", () => {
    const r = calcularCargaReforma({ receitaMesCentavos: 100_000_00, ano: 2026 });
    expect(r.cbsDebitoCentavos).toBe(900_00);
    expect(r.ibsDebitoCentavos).toBe(100_00);
    expect(r.cargaEfetiva).toBeCloseTo(0.01, 6);
  });

  it("abate o crédito das compras", () => {
    const semCredito = calcularCargaReforma({
      receitaMesCentavos: 100_000_00,
      ano: 2033,
    });
    const comCredito = calcularCargaReforma({
      receitaMesCentavos: 100_000_00,
      ano: 2033,
      comprasComCreditoCentavos: 60_000_00,
    });
    expect(comCredito.cbsIbsLiquidoCentavos).toBeLessThan(
      semCredito.cbsIbsLiquidoCentavos,
    );
    // 26,5% sobre a diferença de 40.000 de valor agregado.
    expect(comCredito.cbsIbsLiquidoCentavos).toBe(10_600_00);
  });

  it("não devolve imposto negativo quando o crédito supera o débito", () => {
    const r = calcularCargaReforma({
      receitaMesCentavos: 10_000_00,
      ano: 2033,
      comprasComCreditoCentavos: 90_000_00,
    });
    expect(r.cbsIbsLiquidoCentavos).toBe(0);
  });
});

describe("janela do Simples híbrido", () => {
  it("reconhece a janela aberta e conta os dias restantes", () => {
    const s = statusJanelaSimplesHibrido("2026-09-26");
    expect(s?.aberta).toBe(true);
    expect(s?.diasRestantes).toBe(4);
    expect(s?.janela.vigencia).toBe("1º semestre de 2027");
  });

  it("aponta a próxima janela quando nenhuma está aberta", () => {
    const s = statusJanelaSimplesHibrido("2026-12-15");
    expect(s?.aberta).toBe(false);
    expect(s?.janela.abreEm).toBe("2027-03-01");
  });

  it("considera aberto o último dia da janela", () => {
    const s = statusJanelaSimplesHibrido("2026-09-30");
    expect(s?.aberta).toBe(true);
    expect(s?.diasRestantes).toBe(0);
  });

  it("fecha no dia seguinte ao prazo", () => {
    const s = statusJanelaSimplesHibrido("2026-10-01");
    expect(s?.aberta).toBe(false);
  });
});

describe("avaliação do Simples híbrido", () => {
  const base = {
    receitaMesCentavos: 100_000_00,
    dasMensalCentavos: 8_000_00,
    anexo: "III" as const,
    ano: 2027,
  };

  it("recomenda avaliar quando a maior parte das vendas vai para PJ", () => {
    const r = avaliarSimplesHibrido({ ...base, parcelaVendaParaPJ: 0.8 });
    expect(r.recomendacao).toBe("avaliar");
    expect(r.creditoGeradoAoClienteCentavos).toBeGreaterThan(0);
  });

  it("desaconselha para quem vende a consumidor final", () => {
    const r = avaliarSimplesHibrido({ ...base, parcelaVendaParaPJ: 0.05 });
    expect(r.recomendacao).toBe("provavelmente-nao");
  });

  it("fica indiferente numa carteira mista", () => {
    const r = avaliarSimplesHibrido({ ...base, parcelaVendaParaPJ: 0.3 });
    expect(r.recomendacao).toBe("indiferente");
  });

  // O ponto central: híbrido não é economia de imposto, é competitividade.
  it("mostra custo adicional mesmo quando recomenda avaliar", () => {
    const r = avaliarSimplesHibrido({ ...base, parcelaVendaParaPJ: 0.9 });
    expect(r.custoAdicionalMensalCentavos).toBeGreaterThan(0);
  });

  it("gera mais crédito ao cliente quanto maior a fatia PJ", () => {
    const pouco = avaliarSimplesHibrido({ ...base, parcelaVendaParaPJ: 0.2 });
    const muito = avaliarSimplesHibrido({ ...base, parcelaVendaParaPJ: 0.9 });
    expect(muito.creditoGeradoAoClienteCentavos).toBeGreaterThan(
      pouco.creditoGeradoAoClienteCentavos,
    );
  });
});
