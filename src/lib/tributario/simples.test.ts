import { describe, expect, it } from "vitest";
import {
  aliquotaEfetivaSimples,
  anexoPorFatorR,
  apurarSimples,
  calcularFatorR,
  faixaDoRBT12,
  folhaNecessariaParaAnexoIII,
} from "./simples";
import { ANEXOS_SIMPLES } from "./parametros";

describe("faixa do RBT12", () => {
  it("encontra a faixa pelo teto de receita", () => {
    expect(faixaDoRBT12("III", 100_000_00).indice).toBe(0);
    expect(faixaDoRBT12("III", 180_000_00).indice).toBe(0);
    expect(faixaDoRBT12("III", 180_000_01).indice).toBe(1);
    expect(faixaDoRBT12("III", 4_800_000_00).indice).toBe(5);
  });

  it("mantém a última faixa acima do teto em vez de estourar", () => {
    expect(faixaDoRBT12("III", 9_000_000_00).indice).toBe(5);
  });
});

describe("alíquota efetiva", () => {
  // Na primeira faixa a parcela a deduzir é zero, então efetiva = nominal.
  it("iguala a nominal na primeira faixa", () => {
    expect(aliquotaEfetivaSimples("III", 180_000_00)).toBeCloseTo(0.06, 10);
    expect(aliquotaEfetivaSimples("I", 180_000_00)).toBeCloseTo(0.04, 10);
    expect(aliquotaEfetivaSimples("V", 180_000_00)).toBeCloseTo(0.155, 10);
  });

  it("aplica a parcela a deduzir nas faixas seguintes", () => {
    // (360.000 × 11,2% − 9.360) ÷ 360.000 = 8,60%
    expect(aliquotaEfetivaSimples("III", 360_000_00)).toBeCloseTo(0.086, 10);
    // (360.000 × 7,3% − 5.940) ÷ 360.000 = 5,65%
    expect(aliquotaEfetivaSimples("I", 360_000_00)).toBeCloseTo(0.0565, 10);
  });

  it("fica sempre abaixo da nominal depois da primeira faixa", () => {
    for (const anexo of ["I", "II", "III", "IV", "V"] as const) {
      const tabela = ANEXOS_SIMPLES[anexo];
      for (const faixa of tabela.slice(1)) {
        const efetiva = aliquotaEfetivaSimples(anexo, faixa.ateCentavos);
        expect(efetiva, `${anexo} até ${faixa.ateCentavos}`).toBeLessThan(
          faixa.aliquotaNominal,
        );
      }
    }
  });

  it("cresce junto com o faturamento dentro do mesmo anexo", () => {
    const valores = [200_000_00, 500_000_00, 1_000_000_00, 2_000_000_00].map((rbt12) =>
      aliquotaEfetivaSimples("III", rbt12),
    );
    for (let i = 1; i < valores.length; i++) {
      expect(valores[i]).toBeGreaterThan(valores[i - 1]);
    }
  });

  it("usa a nominal da primeira faixa para empresa sem histórico", () => {
    expect(aliquotaEfetivaSimples("III", 0)).toBeCloseTo(0.06, 10);
  });

  it("nunca devolve alíquota negativa", () => {
    for (const anexo of ["I", "II", "III", "IV", "V"] as const) {
      expect(aliquotaEfetivaSimples(anexo, 1_00)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("Fator R", () => {
  it("é a razão folha sobre receita", () => {
    expect(calcularFatorR(280_000_00, 1_000_000_00)).toBeCloseTo(0.28, 10);
  });

  it("é zero quando não há receita", () => {
    expect(calcularFatorR(50_000_00, 0)).toBe(0);
  });

  it("leva ao Anexo III a partir de 28% exatos", () => {
    expect(anexoPorFatorR(0.28)).toBe("III");
    expect(anexoPorFatorR(0.2799)).toBe("V");
    expect(anexoPorFatorR(0.5)).toBe("III");
  });

  it("calcula quanto falta de folha para alcançar o Anexo III", () => {
    // 28% de 1.000.000 = 280.000; já tem 100.000 → faltam 180.000.
    expect(folhaNecessariaParaAnexoIII(100_000_00, 1_000_000_00)).toBe(180_000_00);
  });

  it("não sugere folha extra para quem já atingiu o Fator R", () => {
    expect(folhaNecessariaParaAnexoIII(300_000_00, 1_000_000_00)).toBeNull();
  });
});

describe("apuração", () => {
  it("aplica a efetiva sobre a receita do mês", () => {
    const r = apurarSimples({
      rbt12Centavos: 360_000_00,
      receitaMesCentavos: 30_000_00,
      folha12Centavos: 0,
      anexo: "III",
    });
    // 8,60% de R$ 30.000
    expect(r.dasMensalCentavos).toBe(2_580_00);
    expect(r.faixa).toBe(2);
  });

  it("não cobra INSS patronal por fora nos anexos que já embutem a CPP", () => {
    for (const anexo of ["I", "II", "III", "V"] as const) {
      const r = apurarSimples({
        rbt12Centavos: 500_000_00,
        receitaMesCentavos: 40_000_00,
        folha12Centavos: 120_000_00,
        anexo,
      });
      expect(r.cppForaDoDasCentavos, anexo).toBe(0);
      expect(r.cargaTotalMensalCentavos).toBe(r.dasMensalCentavos);
    }
  });

  // Ignorar isso é o que faz o Anexo IV parecer barato numa comparação.
  it("soma o INSS patronal por fora no Anexo IV", () => {
    const r = apurarSimples({
      rbt12Centavos: 500_000_00,
      receitaMesCentavos: 40_000_00,
      folha12Centavos: 120_000_00,
      anexo: "IV",
    });
    expect(r.cppForaDoDasCentavos).toBeGreaterThan(0);
    expect(r.cargaTotalMensalCentavos).toBeGreaterThan(r.dasMensalCentavos);
  });

  it("sinaliza faturamento acima do teto do Simples", () => {
    const r = apurarSimples({
      rbt12Centavos: 5_000_000_00,
      receitaMesCentavos: 420_000_00,
      folha12Centavos: 0,
      anexo: "I",
    });
    expect(r.acimaDoTeto).toBe(true);
  });
});
