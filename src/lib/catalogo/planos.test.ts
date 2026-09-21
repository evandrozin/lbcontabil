import { describe, expect, it } from "vitest";
import { PLANOS, planoPorId, planosDoSegmento, precoInicialDoSegmento } from "./planos";
import { LISTA_SEGMENTOS } from "./segmentos";
import {
  CUSTO_SOFTWARE_MEI_CENTAVOS,
  PARAMETROS_CUSTO_PADRAO,
  calcularMargemReal,
  calcularPrecoMinimo,
} from "@/lib/precificacao/custo";

function custoSoftwareDoPlano(segmentoId: string): number {
  return segmentoId === "mei"
    ? CUSTO_SOFTWARE_MEI_CENTAVOS
    : PARAMETROS_CUSTO_PADRAO.custoSoftwarePorCnpjCentavos;
}

describe("tabela de planos", () => {
  it("cobre os 5 segmentos com 3 níveis cada", () => {
    expect(PLANOS).toHaveLength(15);
    for (const segmento of LISTA_SEGMENTOS) {
      expect(planosDoSegmento(segmento.id)).toHaveLength(3);
    }
  });

  it("tem exatamente um plano em destaque por segmento", () => {
    for (const segmento of LISTA_SEGMENTOS) {
      const destaques = planosDoSegmento(segmento.id).filter((p) => p.destaque);
      expect(destaques, `segmento ${segmento.id}`).toHaveLength(1);
      // O destaque é a isca de ancoragem: precisa ser o do meio.
      expect(destaques[0].tierId).toBe("profissional");
    }
  });

  it("tem preço crescente do essencial ao premium", () => {
    for (const segmento of LISTA_SEGMENTOS) {
      const [essencial, profissional, premium] = planosDoSegmento(segmento.id);
      expect(essencial.precoMensalCentavos).toBeLessThan(profissional.precoMensalCentavos);
      expect(profissional.precoMensalCentavos).toBeLessThan(premium.precoMensalCentavos);
    }
  });

  it("tem horas de equipe crescentes junto com o preço", () => {
    for (const segmento of LISTA_SEGMENTOS) {
      const [essencial, profissional, premium] = planosDoSegmento(segmento.id);
      expect(essencial.horasEquipeMes).toBeLessThan(profissional.horasEquipeMes);
      expect(profissional.horasEquipeMes).toBeLessThan(premium.horasEquipeMes);
    }
  });

  it("usa ids únicos e resolvíveis", () => {
    const ids = new Set(PLANOS.map((p) => p.id));
    expect(ids.size).toBe(PLANOS.length);
    for (const plano of PLANOS) {
      expect(planoPorId(plano.id)).toBe(plano);
    }
  });
});

describe("viabilidade de margem", () => {
  it("nenhuma mensalidade fica abaixo do preço mínimo de custo+margem", () => {
    for (const plano of PLANOS) {
      const { precoMinimoCentavos } = calcularPrecoMinimo({
        horasEquipeMes: plano.horasEquipeMes,
        custoSoftwareCentavos: custoSoftwareDoPlano(plano.segmentoId),
      });

      expect(
        plano.precoMensalCentavos,
        `${plano.id} mensal: R$ ${plano.precoMensalCentavos / 100} < mínimo R$ ${precoMinimoCentavos / 100}`,
      ).toBeGreaterThanOrEqual(precoMinimoCentavos);
    }
  });

  it("o contrato anual com desconto também cobre custo+margem", () => {
    for (const plano of PLANOS) {
      const { precoMinimoCentavos } = calcularPrecoMinimo({
        horasEquipeMes: plano.horasEquipeMes,
        custoSoftwareCentavos: custoSoftwareDoPlano(plano.segmentoId),
      });

      expect(
        plano.precoAnualMensalizadoCentavos,
        `${plano.id} anual: R$ ${plano.precoAnualMensalizadoCentavos / 100} < mínimo R$ ${precoMinimoCentavos / 100}`,
      ).toBeGreaterThanOrEqual(precoMinimoCentavos);
    }
  });

  it("entrega margem líquida dentro da faixa do estudo (35% a 60%)", () => {
    for (const plano of PLANOS) {
      const { custoDiretoCentavos } = calcularPrecoMinimo({
        horasEquipeMes: plano.horasEquipeMes,
        custoSoftwareCentavos: custoSoftwareDoPlano(plano.segmentoId),
      });
      const { margem } = calcularMargemReal(plano.precoMensalCentavos, custoDiretoCentavos);

      expect(margem, `${plano.id} margem ${(margem * 100).toFixed(1)}%`).toBeGreaterThanOrEqual(
        0.35,
      );
      expect(margem, `${plano.id} margem ${(margem * 100).toFixed(1)}%`).toBeLessThanOrEqual(0.6);
    }
  });
});

describe("preço inicial por segmento", () => {
  it("bate com a faixa praticada no estudo de mercado", () => {
    expect(precoInicialDoSegmento("mei")).toBe(89_00);
    expect(precoInicialDoSegmento("simples-servicos")).toBe(249_00);
    expect(precoInicialDoSegmento("simples-comercio")).toBe(499_00);
    expect(precoInicialDoSegmento("lucro-presumido")).toBe(899_00);
    expect(precoInicialDoSegmento("rural")).toBe(600_00);
  });
});

describe("calcularPrecoMinimo", () => {
  it("recusa parâmetros que consomem 100% da receita", () => {
    expect(() =>
      calcularPrecoMinimo(
        { horasEquipeMes: 1, custoSoftwareCentavos: 0 },
        { ...PARAMETROS_CUSTO_PADRAO, margemAlvo: 0.9 },
      ),
    ).toThrow(/inviáveis/);
  });

  it("cobra o custo marginal das notas importadas", () => {
    const semNotas = calcularPrecoMinimo({ horasEquipeMes: 2, custoSoftwareCentavos: 35_00 });
    const comNotas = calcularPrecoMinimo({
      horasEquipeMes: 2,
      custoSoftwareCentavos: 35_00,
      notasImportadasMes: 200,
    });
    expect(comNotas.precoMinimoCentavos).toBeGreaterThan(semNotas.precoMinimoCentavos);
  });
});
