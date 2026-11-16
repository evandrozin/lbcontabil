import { describe, expect, it } from "vitest";
import {
  diaUtilAnterior,
  domingoDePascoa,
  ehDiaUtilBancario,
  feriadosNacionais,
  proximoDiaUtil,
  ultimoDiaUtilDoMes,
} from "./feriados";
import { diaDaSemana } from "./datas";

describe("Páscoa", () => {
  it("calcula o domingo de Páscoa pelo algoritmo gregoriano", () => {
    expect(domingoDePascoa(2026)).toBe("2026-04-05");
    expect(domingoDePascoa(2027)).toBe("2027-03-28");
    expect(domingoDePascoa(2025)).toBe("2025-04-20");
  });

  it("sempre cai num domingo", () => {
    for (let ano = 2024; ano <= 2040; ano++) {
      expect(diaDaSemana(domingoDePascoa(ano)), String(ano)).toBe(0);
    }
  });
});

describe("feriados móveis", () => {
  const nomes = (ano: number) =>
    Object.fromEntries(feriadosNacionais(ano).map((f) => [f.nome, f.data]));

  it("ancora Carnaval, Sexta-feira Santa e Corpus Christi na Páscoa", () => {
    const f = nomes(2026);
    expect(f["Carnaval (terça)"]).toBe("2026-02-17");
    expect(f["Sexta-feira Santa"]).toBe("2026-04-03");
    expect(f["Corpus Christi"]).toBe("2026-06-04");
  });

  it("inclui o Carnaval mesmo não sendo feriado nacional por lei", () => {
    // O que importa para prazo fiscal é expediente bancário, não a lei civil.
    expect(ehDiaUtilBancario("2026-02-17")).toBe(false);
  });

  it("traz os nove feriados fixos mais quatro móveis", () => {
    expect(feriadosNacionais(2026)).toHaveLength(13);
  });

  it("devolve a lista ordenada por data", () => {
    const datas = feriadosNacionais(2026).map((f) => f.data);
    expect([...datas].sort()).toEqual(datas);
  });
});

describe("dia útil bancário", () => {
  it("recusa fim de semana", () => {
    expect(ehDiaUtilBancario("2026-12-20")).toBe(false); // domingo
    expect(ehDiaUtilBancario("2026-12-19")).toBe(false); // sábado
  });

  it("recusa feriado nacional", () => {
    expect(ehDiaUtilBancario("2026-12-25")).toBe(false);
    expect(ehDiaUtilBancario("2026-09-07")).toBe(false);
  });

  it("aceita dia comum", () => {
    expect(ehDiaUtilBancario("2026-12-18")).toBe(true); // sexta
    expect(ehDiaUtilBancario("2026-11-16")).toBe(true); // segunda
  });

  it("respeita feriado municipal injetado", () => {
    const extras = [{ data: "2026-10-26", nome: "Aniversário da cidade", movel: false }];
    expect(ehDiaUtilBancario("2026-10-26")).toBe(true);
    expect(ehDiaUtilBancario("2026-10-26", { feriadosExtras: extras })).toBe(false);
  });
});

describe("navegação entre dias úteis", () => {
  it("anda para trás até o dia útil anterior", () => {
    expect(diaUtilAnterior("2026-12-20")).toBe("2026-12-18"); // domingo → sexta
  });

  it("anda para frente até o próximo dia útil", () => {
    expect(proximoDiaUtil("2026-12-20")).toBe("2026-12-21"); // domingo → segunda
  });

  it("devolve a própria data quando ela já é útil", () => {
    expect(proximoDiaUtil("2026-12-18")).toBe("2026-12-18");
    expect(diaUtilAnterior("2026-12-18")).toBe("2026-12-18");
  });

  it("atravessa emenda de feriado", () => {
    // 25/12/2026 é sexta: o anterior útil é quinta, 24.
    expect(diaUtilAnterior("2026-12-25")).toBe("2026-12-24");
    // E o próximo útil depois do Natal é a segunda, 28.
    expect(proximoDiaUtil("2026-12-26")).toBe("2026-12-28");
  });

  it("encontra o último dia útil do mês", () => {
    // 31/05/2026 é domingo, 30 é sábado → sexta, 29.
    expect(ultimoDiaUtilDoMes(2026, 5)).toBe("2026-05-29");
    // 30/04/2026 é quinta-feira comum.
    expect(ultimoDiaUtilDoMes(2026, 4)).toBe("2026-04-30");
  });
});
