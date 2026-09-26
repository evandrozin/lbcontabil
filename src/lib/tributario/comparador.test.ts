import { describe, expect, it } from "vitest";
import { compararRegimes, type EntradaComparador } from "./comparador";
import { apurarPresumido } from "./presumido";

const BASE: EntradaComparador = {
  atividade: "servico",
  faturamentoMensalCentavos: 30_000_00,
  folhaMensalCentavos: 0,
  proLaboreMensalCentavos: 3_000_00,
  anoReforma: 2027,
  issAliquota: 0.05,
  socios: 1,
  funcionarios: 0,
};

function entrada(patch: Partial<EntradaComparador>): EntradaComparador {
  return { ...BASE, ...patch };
}

describe("Lucro Presumido", () => {
  it("calcula serviço com adicional de IRPJ", () => {
    const r = apurarPresumido({
      receitaMesCentavos: 100_000_00,
      atividade: "servico",
      folhaMensalCentavos: 0,
      issAliquota: 0.05,
    });

    expect(r.baseIrpjCentavos).toBe(32_000_00); // 32% de 100.000
    expect(r.irpjCentavos).toBe(4_800_00); // 15%
    expect(r.adicionalIrpjCentavos).toBe(1_200_00); // 10% sobre 12.000
    expect(r.csllCentavos).toBe(2_880_00); // 9% de 32.000
    expect(r.pisCentavos).toBe(650_00);
    expect(r.cofinsCentavos).toBe(3_000_00);
    expect(r.issCentavos).toBe(5_000_00);
    expect(r.tributosSobreReceitaCentavos).toBe(17_530_00);
  });

  it("não cobra adicional abaixo do limite de R$ 20 mil de lucro presumido", () => {
    const r = apurarPresumido({
      receitaMesCentavos: 50_000_00, // base de 16.000
      atividade: "servico",
      folhaMensalCentavos: 0,
    });
    expect(r.adicionalIrpjCentavos).toBe(0);
  });

  it("soma o INSS patronal sobre a folha", () => {
    const semFolha = apurarPresumido({
      receitaMesCentavos: 100_000_00,
      atividade: "servico",
      folhaMensalCentavos: 0,
    });
    const comFolha = apurarPresumido({
      receitaMesCentavos: 100_000_00,
      atividade: "servico",
      folhaMensalCentavos: 20_000_00,
    });
    expect(comFolha.cargaTotalMensalCentavos).toBeGreaterThan(
      semFolha.cargaTotalMensalCentavos,
    );
  });

  it("avisa quando o ICMS de comércio não foi informado", () => {
    const r = apurarPresumido({
      receitaMesCentavos: 100_000_00,
      atividade: "comercio",
      folhaMensalCentavos: 0,
    });
    expect(r.icmsNaoInformado).toBe(true);
  });
});

describe("elegibilidade ao MEI", () => {
  it("aceita quem cabe no teto, sem sócio e sem funcionário", () => {
    const r = compararRegimes(entrada({ faturamentoMensalCentavos: 5_000_00 }));
    const mei = r.opcoes.find((o) => o.id === "mei")!;
    expect(mei.elegivel).toBe(true);
  });

  it("recusa acima do teto anual", () => {
    const r = compararRegimes(entrada({ faturamentoMensalCentavos: 10_000_00 }));
    const mei = r.opcoes.find((o) => o.id === "mei")!;
    expect(mei.elegivel).toBe(false);
    expect(mei.motivoInelegibilidade).toMatch(/81\.000/);
  });

  it("recusa com mais de um sócio", () => {
    const r = compararRegimes(entrada({ faturamentoMensalCentavos: 5_000_00, socios: 2 }));
    expect(r.opcoes.find((o) => o.id === "mei")!.elegivel).toBe(false);
  });

  it("recusa com mais de um funcionário", () => {
    const r = compararRegimes(
      entrada({ faturamentoMensalCentavos: 5_000_00, funcionarios: 2 }),
    );
    expect(r.opcoes.find((o) => o.id === "mei")!.elegivel).toBe(false);
  });
});

describe("escolha de anexo", () => {
  it("manda comércio para o Anexo I e indústria para o II", () => {
    expect(compararRegimes(entrada({ atividade: "comercio" })).anexoSimples).toBe("I");
    expect(compararRegimes(entrada({ atividade: "industria" })).anexoSimples).toBe("II");
  });

  it("usa o Fator R para separar Anexo III de Anexo V", () => {
    // Pró-labore de 3.000 sobre 30.000 = 10% → Anexo V.
    expect(compararRegimes(entrada({})).anexoSimples).toBe("V");
    // 9.000 sobre 30.000 = 30% → Anexo III.
    expect(
      compararRegimes(entrada({ proLaboreMensalCentavos: 9_000_00 })).anexoSimples,
    ).toBe("III");
  });

  it("respeita o Anexo IV independentemente do Fator R", () => {
    const r = compararRegimes(
      entrada({ servicoAnexoIV: true, proLaboreMensalCentavos: 15_000_00 }),
    );
    expect(r.anexoSimples).toBe("IV");
  });
});

describe("comparação entre regimes", () => {
  it("ordena os elegíveis do mais barato para o mais caro", () => {
    const r = compararRegimes(entrada({}));
    const elegiveis = r.opcoes.filter((o) => o.elegivel);
    for (let i = 1; i < elegiveis.length; i++) {
      expect(elegiveis[i].cargaMensalCentavos).toBeGreaterThanOrEqual(
        elegiveis[i - 1].cargaMensalCentavos,
      );
    }
    expect(r.recomendado.cargaMensalCentavos).toBe(elegiveis[0].cargaMensalCentavos);
  });

  it("nunca recomenda um regime inelegível", () => {
    const r = compararRegimes(entrada({ faturamentoMensalCentavos: 500_000_00 }));
    expect(r.recomendado.elegivel).toBe(true);
    expect(r.recomendado.id).toBe("presumido");
  });

  it("sempre tem saída, porque o Presumido não tem teto", () => {
    const r = compararRegimes(entrada({ faturamentoMensalCentavos: 2_000_000_00 }));
    expect(r.recomendado).toBeDefined();
  });

  it("calcula a economia anual contra o segundo colocado", () => {
    const r = compararRegimes(entrada({}));
    const elegiveis = r.opcoes
      .filter((o) => o.elegivel)
      .sort((a, b) => a.cargaMensalCentavos - b.cargaMensalCentavos);
    expect(r.economiaAnualCentavos).toBe(
      (elegiveis[1].cargaMensalCentavos - elegiveis[0].cargaMensalCentavos) * 12,
    );
  });

  it("não devolve carga negativa em nenhum regime", () => {
    for (const atividade of ["servico", "comercio", "industria"] as const) {
      const r = compararRegimes(entrada({ atividade, icmsEfetivo: 0.18 }));
      for (const opcao of r.opcoes) {
        expect(opcao.cargaMensalCentavos, `${atividade}/${opcao.id}`).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("alertas", () => {
  it("bloqueia acima do teto do Simples", () => {
    const r = compararRegimes(entrada({ faturamentoMensalCentavos: 500_000_00 }));
    const alerta = r.alertas.find((a) => a.id === "acima-do-simples");
    expect(alerta?.nivel).toBe("bloqueio");
  });

  it("avisa sobre o sublimite de ICMS/ISS", () => {
    const r = compararRegimes(entrada({ faturamentoMensalCentavos: 350_000_00 }));
    expect(r.alertas.map((a) => a.id)).toContain("sublimite-icms-iss");
  });

  it("cobra o ICMS de quem vende mercadoria", () => {
    const r = compararRegimes(entrada({ atividade: "comercio" }));
    expect(r.alertas.map((a) => a.id)).toContain("icms-nao-informado");
  });

  it("não cobra ICMS de prestador de serviço", () => {
    const r = compararRegimes(entrada({ atividade: "servico" }));
    expect(r.alertas.map((a) => a.id)).not.toContain("icms-nao-informado");
  });

  it("aponta a oportunidade de Fator R com a folha que falta", () => {
    const r = compararRegimes(entrada({}));
    expect(r.oportunidadeFatorR).not.toBeNull();
    expect(r.oportunidadeFatorR!.folhaFaltanteCentavos).toBeGreaterThan(0);
    expect(r.alertas.map((a) => a.id)).toContain("fator-r");
  });

  it("não aponta Fator R para quem já está no Anexo III", () => {
    const r = compararRegimes(entrada({ proLaboreMensalCentavos: 9_000_00 }));
    expect(r.oportunidadeFatorR).toBeNull();
  });

  // Enquanto ninguém do escritório assinar a conferência, a simulação
  // precisa se declarar não homologada na tela.
  it("marca a simulação como não homologada até alguém conferir", () => {
    const r = compararRegimes(entrada({}));
    expect(r.parametrosHomologados).toBe(false);
    expect(r.alertas.map((a) => a.id)).toContain("parametros-nao-homologados");
  });
});

describe("Simples híbrido no comparador", () => {
  it("avalia quando a empresa está no Simples", () => {
    const r = compararRegimes(entrada({ parcelaVendaParaPJ: 0.7 }));
    expect(r.simplesHibrido?.recomendacao).toBe("avaliar");
  });

  it("não avalia quando a empresa nem cabe no Simples", () => {
    const r = compararRegimes(
      entrada({ faturamentoMensalCentavos: 500_000_00, parcelaVendaParaPJ: 0.7 }),
    );
    expect(r.simplesHibrido).toBeNull();
  });
});
