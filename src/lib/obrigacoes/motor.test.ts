import { describe, expect, it } from "vitest";
import {
  agenda,
  lembretesNoIntervalo,
  reguaDeLembretes,
  vencimentosNoIntervalo,
  type PerfilCliente,
} from "./motor";

const MEI: PerfilCliente = { segmentoId: "mei", temEmpregados: false };
const SERVICOS: PerfilCliente = { segmentoId: "simples-servicos", temEmpregados: false };
const SERVICOS_COM_FOLHA: PerfilCliente = {
  segmentoId: "simples-servicos",
  temEmpregados: true,
};
const PRESUMIDO: PerfilCliente = { segmentoId: "lucro-presumido", temEmpregados: true };
const RURAL: PerfilCliente = { segmentoId: "rural", temEmpregados: false };

function acharPorId(perfil: PerfilCliente, de: string, ate: string, id: string) {
  return vencimentosNoIntervalo(perfil, de, ate).filter((v) => v.obrigacao.id === id);
}

describe("ajuste de vencimento em dia sem expediente", () => {
  // 20/12/2026 é um domingo. É o caso que separa as duas regras: o DAS do
  // Simples prorroga para segunda, a contribuição previdenciária antecipa
  // para sexta. Tratar as duas igual erra uma delas por três dias.
  it("prorroga o DAS quando o dia 20 cai no domingo", () => {
    const [das] = acharPorId(MEI, "2026-12-01", "2026-12-31", "das-mei");
    expect(das.vencimentoNominal).toBe("2026-12-20");
    expect(das.vencimento).toBe("2026-12-21");
    expect(das.ajustado).toBe(true);
  });

  it("antecipa o DARF previdenciário na mesma data", () => {
    const [darf] = acharPorId(
      PRESUMIDO,
      "2026-12-01",
      "2026-12-31",
      "darf-inss-folha",
    );
    expect(darf.vencimentoNominal).toBe("2026-12-20");
    expect(darf.vencimento).toBe("2026-12-18");
  });

  it("não marca como ajustado o vencimento que cai em dia útil", () => {
    // 20/10/2026 é uma terça comum.
    const [das] = acharPorId(MEI, "2026-10-01", "2026-10-31", "das-mei");
    expect(das.vencimento).toBe("2026-10-20");
    expect(das.ajustado).toBe(false);
  });

  // 20/11 virou feriado nacional pela Lei 14.759/2023. Em 2026 cai numa
  // sexta, então o vencimento pula o fim de semana inteiro e vai para
  // segunda — três dias depois do que uma tabela desatualizada diria.
  it("prorroga o DAS no feriado da Consciência Negra", () => {
    const [das] = acharPorId(MEI, "2026-11-01", "2026-11-30", "das-mei");
    expect(das.vencimentoNominal).toBe("2026-11-20");
    expect(das.vencimento).toBe("2026-11-23");
    expect(das.ajustado).toBe(true);
  });

  it("resolve o último dia útil do mês", () => {
    // ECD vence no último dia útil de maio; 31/05/2026 é domingo.
    const [ecd] = acharPorId(PRESUMIDO, "2026-05-01", "2026-05-31", "ecd");
    expect(ecd.vencimento).toBe("2026-05-29");
  });

  it("respeita feriado municipal da praça do cliente", () => {
    const comFeriado: PerfilCliente = {
      ...MEI,
      feriadosExtras: [{ data: "2026-10-20", nome: "Feriado local", movel: false }],
    };
    const [semFeriado] = acharPorId(MEI, "2026-10-01", "2026-10-31", "das-mei");
    const [com] = acharPorId(comFeriado, "2026-10-01", "2026-10-31", "das-mei");
    expect(semFeriado.vencimento).toBe("2026-10-20");
    expect(com.vencimento).toBe("2026-10-21");
  });
});

describe("competência", () => {
  it("volta um mês na competência mensal", () => {
    const [das] = acharPorId(SERVICOS, "2026-12-01", "2026-12-31", "das-simples");
    expect(das.competencia).toBe("2026-11");
  });

  it("volta dois meses na EFD-Contribuições", () => {
    const [efd] = acharPorId(
      PRESUMIDO,
      "2026-12-01",
      "2026-12-31",
      "efd-contribuicoes",
    );
    expect(efd.competencia).toBe("2026-10");
  });

  it("identifica o trimestre nas obrigações trimestrais", () => {
    const irpj = acharPorId(PRESUMIDO, "2026-01-01", "2026-12-31", "darf-irpj-trimestral");
    expect(irpj.map((v) => v.competencia)).toEqual(["2025-T4", "2026-T1", "2026-T2", "2026-T3"]);
  });

  it("usa o exercício anterior na competência anual", () => {
    const [dasn] = acharPorId(MEI, "2026-01-01", "2026-12-31", "dasn-simei");
    expect(dasn.competencia).toBe("2025");
  });

  it("não gera obrigação trimestral em mês que não fecha trimestre", () => {
    const irpj = acharPorId(PRESUMIDO, "2026-05-01", "2026-05-31", "darf-irpj-trimestral");
    expect(irpj).toHaveLength(0);
  });
});

describe("filtro por perfil", () => {
  it("não cobra DCTFWeb do MEI", () => {
    const ids = vencimentosNoIntervalo(MEI, "2026-01-01", "2026-12-31").map(
      (v) => v.obrigacao.id,
    );
    expect(ids).not.toContain("dctfweb");
    expect(ids).toContain("das-mei");
    expect(ids).toContain("dasn-simei");
  });

  it("só cobra FGTS de quem tem empregado", () => {
    const sem = vencimentosNoIntervalo(SERVICOS, "2026-01-01", "2026-12-31").map(
      (v) => v.obrigacao.id,
    );
    const com = vencimentosNoIntervalo(
      SERVICOS_COM_FOLHA,
      "2026-01-01",
      "2026-12-31",
    ).map((v) => v.obrigacao.id);

    expect(sem).not.toContain("fgts-digital");
    expect(com).toContain("fgts-digital");
    expect(com).toContain("esocial-periodicos");
  });

  it("dá ao rural o ITR e o IRPF com LCDPR", () => {
    const ids = vencimentosNoIntervalo(RURAL, "2026-01-01", "2026-12-31").map(
      (v) => v.obrigacao.id,
    );
    expect(ids).toContain("itr");
    expect(ids).toContain("irpf-lcdpr");
    expect(ids).not.toContain("das-simples");
  });

  it("aceita dia de vencimento próprio da praça", () => {
    const perfil: PerfilCliente = {
      segmentoId: "lucro-presumido",
      temEmpregados: false,
      diasPorPraca: { "iss-municipal": 10 },
    };
    const [iss] = acharPorId(perfil, "2026-11-01", "2026-11-30", "iss-municipal");
    expect(iss.vencimentoNominal).toBe("2026-11-10");
  });
});

describe("intervalo e ordenação", () => {
  it("devolve só o que vence dentro do intervalo", () => {
    const v = vencimentosNoIntervalo(SERVICOS, "2026-11-01", "2026-11-30");
    expect(v.length).toBeGreaterThan(0);
    for (const item of v) {
      expect(item.vencimento >= "2026-11-01").toBe(true);
      expect(item.vencimento <= "2026-11-30").toBe(true);
    }
  });

  it("ordena por data de vencimento", () => {
    const datas = vencimentosNoIntervalo(PRESUMIDO, "2026-01-01", "2026-12-31").map(
      (v) => v.vencimento,
    );
    expect([...datas].sort()).toEqual(datas);
  });

  it("devolve lista vazia num intervalo sem vencimento", () => {
    expect(vencimentosNoIntervalo(MEI, "2026-11-25", "2026-11-28")).toHaveLength(0);
  });
});

describe("régua de lembretes", () => {
  it("manda guia para o cliente e declaração para a equipe", () => {
    const [das] = acharPorId(SERVICOS, "2026-11-01", "2026-11-30", "das-simples");
    const [dctf] = acharPorId(SERVICOS, "2026-11-01", "2026-11-30", "dctfweb");

    expect(reguaDeLembretes(das, SERVICOS)[0].destinatario).toBe("cliente");
    expect(reguaDeLembretes(dctf, SERVICOS)[0].destinatario).toBe("equipe");
  });

  it("gera D-5, D-1 e D+1 para guia", () => {
    const [das] = acharPorId(SERVICOS, "2026-11-01", "2026-11-30", "das-simples");
    expect(reguaDeLembretes(das, SERVICOS).map((l) => l.tipo)).toEqual([
      "D-5",
      "D-1",
      "D+1",
    ]);
  });

  it("não gera D+1 para declaração, que não tem pagamento a confirmar", () => {
    const [dctf] = acharPorId(SERVICOS, "2026-11-01", "2026-11-30", "dctfweb");
    expect(reguaDeLembretes(dctf, SERVICOS).map((l) => l.tipo)).toEqual(["D-5", "D-1"]);
  });

  // Lembrete que chega no domingo é lembrete perdido.
  it("empurra o aviso prévio para trás até cair em dia útil", () => {
    const [das] = acharPorId(SERVICOS, "2026-11-01", "2026-11-30", "das-simples");
    const regua = reguaDeLembretes(das, SERVICOS);
    for (const lembrete of regua) {
      expect(["D-5", "D-1", "D+1"]).toContain(lembrete.tipo);
      // Nenhum lembrete pode cair em sábado ou domingo.
      const dia = new Date(`${lembrete.data}T00:00:00Z`).getUTCDay();
      expect(dia, `${lembrete.tipo} em ${lembrete.data}`).not.toBe(0);
      expect(dia, `${lembrete.tipo} em ${lembrete.data}`).not.toBe(6);
    }
  });

  it("nunca agenda aviso prévio depois do vencimento", () => {
    const vencimentos = vencimentosNoIntervalo(PRESUMIDO, "2026-01-01", "2026-12-31");
    for (const v of vencimentos) {
      for (const l of reguaDeLembretes(v, PRESUMIDO)) {
        if (l.tipo === "D+1") expect(l.data > v.vencimento).toBe(true);
        else expect(l.data <= v.vencimento).toBe(true);
      }
    }
  });

  it("recorta os lembretes pelo intervalo pedido", () => {
    const lembretes = lembretesNoIntervalo(SERVICOS_COM_FOLHA, "2026-11-01", "2026-11-30");
    expect(lembretes.length).toBeGreaterThan(0);
    for (const l of lembretes) {
      expect(l.data >= "2026-11-01").toBe(true);
      expect(l.data <= "2026-11-30").toBe(true);
    }
  });
});

describe("agenda", () => {
  it("aponta o próximo vencimento e quantos dias faltam", () => {
    const resumo = agenda(SERVICOS, "2026-11-16", 60);
    expect(resumo.proximo).not.toBeNull();
    expect(resumo.diasAteProximo).toBeGreaterThanOrEqual(0);
    expect(resumo.proximo!.vencimento >= "2026-11-16").toBe(true);
  });

  // Enquanto nenhum contador conferir o calendário, a tela precisa dizer.
  it("declara o calendário como não homologado", () => {
    expect(agenda(MEI, "2026-11-16").calendarioHomologado).toBe(false);
  });
});
