import { describe, expect, it } from "vitest";
import { definirSegmento, simular, type EntradaSimulacao } from "./motor";

const BASE: EntradaSimulacao = {
  atividade: "servico",
  regimeAtual: "simples-nacional",
  faturamentoMensalCentavos: 20_000_00,
  notasPorMes: 10,
  funcionarios: 0,
  socios: 1,
  jaTemEmpresa: true,
  periodicidade: "mensal",
};

function entrada(patch: Partial<EntradaSimulacao>): EntradaSimulacao {
  return { ...BASE, ...patch };
}

describe("definirSegmento", () => {
  it("manda atividade rural para o segmento rural, mesmo em outro regime", () => {
    const { segmentoId } = definirSegmento(
      entrada({ atividade: "rural", regimeAtual: "lucro-presumido" }),
    );
    expect(segmentoId).toBe("rural");
  });

  it("reconhece produtor rural pessoa física", () => {
    const { segmentoId } = definirSegmento(
      entrada({ atividade: "servico", regimeAtual: "produtor-rural-pf" }),
    );
    expect(segmentoId).toBe("rural");
  });

  it("joga faturamento acima do teto do Simples para o Lucro Presumido", () => {
    const { segmentoId } = definirSegmento(
      entrada({ faturamentoMensalCentavos: 500_000_00 }),
    );
    expect(segmentoId).toBe("lucro-presumido");
  });

  it("sugere MEI para quem não sabe o regime e cabe no porte", () => {
    const { segmentoId } = definirSegmento(
      entrada({
        regimeAtual: "nao-sei",
        faturamentoMensalCentavos: 5_000_00,
        funcionarios: 0,
        socios: 1,
      }),
    );
    expect(segmentoId).toBe("mei");
  });

  it("não sugere MEI para quem não sabe o regime mas tem dois sócios", () => {
    const { segmentoId } = definirSegmento(
      entrada({ regimeAtual: "nao-sei", faturamentoMensalCentavos: 5_000_00, socios: 2 }),
    );
    expect(segmentoId).toBe("simples-servicos");
  });

  it("separa comércio de serviço dentro do Simples", () => {
    expect(definirSegmento(entrada({ atividade: "comercio" })).segmentoId).toBe(
      "simples-comercio",
    );
    expect(definirSegmento(entrada({ atividade: "industria" })).segmentoId).toBe(
      "simples-comercio",
    );
    expect(definirSegmento(entrada({ atividade: "servico" })).segmentoId).toBe(
      "simples-servicos",
    );
  });
});

describe("escolha de plano", () => {
  it("recomenda o plano mais barato que comporta o volume", () => {
    const r = simular(entrada({ faturamentoMensalCentavos: 20_000_00, notasPorMes: 10 }));
    expect(r.planoRecomendado.id).toBe("simples-servicos-essencial");
    expect(r.excedentes).toHaveLength(0);
  });

  it("sobe de plano quando entra funcionário na folha", () => {
    const r = simular(entrada({ funcionarios: 2 }));
    expect(r.planoRecomendado.id).toBe("simples-servicos-profissional");
    expect(r.excedentes).toHaveLength(0);
  });

  it("fica no plano topo e cobra excedente quando o volume estoura tudo", () => {
    const r = simular(entrada({ notasPorMes: 300, funcionarios: 12, socios: 6 }));
    expect(r.planoRecomendado.id).toBe("simples-servicos-premium");
    expect(r.excedentes.length).toBeGreaterThan(0);
    expect(r.totalMensalCentavos).toBeGreaterThan(r.precoBaseCentavos);
  });

  it("cobra bloco fechado de notas excedentes", () => {
    // Premium inclui 120 notas; 121 já consome um bloco inteiro de 20.
    const r = simular(entrada({ notasPorMes: 121, funcionarios: 8, socios: 4 }));
    const linha = r.excedentes.find((l) => l.descricao.includes("bloco"));
    expect(linha?.valorCentavos).toBe(39_00);
  });
});

describe("preço e periodicidade", () => {
  it("aplica o desconto do contrato anual sobre a mensalidade", () => {
    const mensal = simular(entrada({ periodicidade: "mensal" }));
    const anual = simular(entrada({ periodicidade: "anual" }));
    expect(anual.precoBaseCentavos).toBeLessThan(mensal.precoBaseCentavos);
    expect(anual.precoBaseCentavos).toBe(224_00);
  });

  it("cobra a 13ª mensalidade e a soma no total do primeiro ano", () => {
    const r = simular(entrada({}));
    expect(r.decimaTerceiraCentavos).toBe(r.precoBaseCentavos);
    expect(r.totalPrimeiroAnoCentavos).toBe(r.totalMensalCentavos * 12 + r.precoBaseCentavos);
  });

  it("calcula a economia do anual sobre 13 parcelas", () => {
    const r = simular(entrada({ periodicidade: "anual" }));
    expect(r.economiaAnualCentavos).toBe((249_00 - 224_00) * 13);
  });

  it("zera a abertura de empresa no contrato anual e cobra no mensal", () => {
    const anual = simular(
      entrada({
        jaTemEmpresa: false,
        periodicidade: "anual",
        addonsSelecionados: ["abertura-empresa"],
      }),
    );
    const mensal = simular(
      entrada({
        jaTemEmpresa: false,
        periodicidade: "mensal",
        addonsSelecionados: ["abertura-empresa"],
      }),
    );
    expect(anual.custosUnicosCentavos).toBe(0);
    expect(mensal.custosUnicosCentavos).toBe(300_00);
  });

  it("separa add-on mensal de cobrança única", () => {
    const r = simular(
      entrada({
        atividade: "comercio",
        addonsSelecionados: ["bpo-financeiro", "certificado-digital"],
      }),
    );
    expect(r.addons.map((a) => a.descricao)).toContain("BPO financeiro");
    expect(r.custosUnicosCentavos).toBe(180_00);
  });

  it("ignora add-on inexistente sem quebrar a simulação", () => {
    const r = simular(entrada({ addonsSelecionados: ["nao-existe"] }));
    expect(r.addons).toHaveLength(0);
    expect(r.custosUnicosCentavos).toBe(0);
  });
});

describe("alertas fiscais", () => {
  it("bloqueia MEI que estourou o limite anual", () => {
    const r = simular(entrada({ regimeAtual: "mei", faturamentoMensalCentavos: 9_000_00 }));
    const alerta = r.alertas.find((a) => a.id === "mei-acima-do-limite");
    expect(alerta?.nivel).toBe("bloqueio");
  });

  it("avisa o MEI que passou de 80% do teto", () => {
    const r = simular(entrada({ regimeAtual: "mei", faturamentoMensalCentavos: 6_000_00 }));
    expect(r.alertas.map((a) => a.id)).toContain("mei-proximo-do-limite");
  });

  it("bloqueia MEI com mais de um funcionário", () => {
    const r = simular(
      entrada({ regimeAtual: "mei", faturamentoMensalCentavos: 5_000_00, funcionarios: 2 }),
    );
    expect(r.alertas.map((a) => a.id)).toContain("mei-multiplos-funcionarios");
  });

  it("aponta Fator R abaixo de 28% como oportunidade", () => {
    const r = simular(
      entrada({ faturamentoMensalCentavos: 50_000_00, folhaMensalCentavos: 5_000_00 }),
    );
    const alerta = r.alertas.find((a) => a.id === "fator-r-abaixo");
    expect(alerta?.nivel).toBe("atencao");
    expect(alerta?.titulo).toContain("10.0%");
  });

  it("confirma Fator R adequado quando a folha passa de 28%", () => {
    const r = simular(
      entrada({ faturamentoMensalCentavos: 50_000_00, folhaMensalCentavos: 20_000_00 }),
    );
    expect(r.alertas.map((a) => a.id)).toContain("fator-r-ok");
  });

  it("pede a folha quando ela não foi informada", () => {
    const r = simular(entrada({}));
    expect(r.alertas.map((a) => a.id)).toContain("fator-r-sem-folha");
  });

  it("avisa sobre o sublimite estadual de ICMS/ISS", () => {
    const r = simular(
      entrada({ atividade: "comercio", faturamentoMensalCentavos: 350_000_00 }),
    );
    expect(r.alertas.map((a) => a.id)).toContain("sublimite-icms-iss");
  });

  it("oferece abertura grátis para quem ainda não tem empresa", () => {
    const r = simular(entrada({ jaTemEmpresa: false }));
    expect(r.alertas.map((a) => a.id)).toContain("abertura-gratuita");
  });

  it("não sugere abertura para quem já tem empresa", () => {
    const r = simular(entrada({ jaTemEmpresa: true }));
    expect(r.alertas.map((a) => a.id)).not.toContain("abertura-gratuita");
  });
});

describe("integridade do resultado", () => {
  it("devolve os outros dois planos do segmento para comparação", () => {
    const r = simular(entrada({}));
    expect(r.outrosPlanos).toHaveLength(2);
    expect(r.outrosPlanos.map((p) => p.id)).not.toContain(r.planoRecomendado.id);
  });

  it("nunca devolve total negativo ou fracionado em centavos", () => {
    const r = simular(entrada({ notasPorMes: 999, funcionarios: 30, socios: 9 }));
    expect(r.totalMensalCentavos).toBeGreaterThan(0);
    expect(Number.isInteger(r.totalMensalCentavos)).toBe(true);
    expect(Number.isInteger(r.totalPrimeiroAnoCentavos)).toBe(true);
  });
});
