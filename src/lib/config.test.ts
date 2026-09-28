import { afterEach, describe, expect, it } from "vitest";
import { resolverUrlDoSite } from "./config";

const ORIGINAIS = {
  site: process.env.NEXT_PUBLIC_SITE_URL,
  vercel: process.env.NEXT_PUBLIC_VERCEL_URL,
};

function definirAmbiente(site?: string, vercel?: string) {
  if (site === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = site;

  if (vercel === undefined) delete process.env.NEXT_PUBLIC_VERCEL_URL;
  else process.env.NEXT_PUBLIC_VERCEL_URL = vercel;
}

afterEach(() => {
  definirAmbiente(ORIGINAIS.site, ORIGINAIS.vercel);
});

describe("resolverUrlDoSite", () => {
  it("usa a variável explícita quando ela é válida", () => {
    definirAmbiente("https://agrotabilms.com.br");
    expect(resolverUrlDoSite()).toBe("https://agrotabilms.com.br");
  });

  // Este é o caso que derrubou o primeiro deploy na Vercel: a variável
  // existia no painel, mas sem valor. Com `??` a string vazia passava
  // direto para new URL("") e o build inteiro falhava.
  it("ignora variável vazia em vez de quebrar o build", () => {
    definirAmbiente("");
    expect(resolverUrlDoSite()).toBe("https://agrotabilms.com.br");
  });

  it("ignora variável só com espaços", () => {
    definirAmbiente("   ");
    expect(resolverUrlDoSite()).toBe("https://agrotabilms.com.br");
  });

  it("ignora valor que não vira URL válida", () => {
    definirAmbiente("isso não é uma url");
    expect(resolverUrlDoSite()).toBe("https://agrotabilms.com.br");
  });

  it("completa o protocolo quando o painel recebe só o host", () => {
    definirAmbiente("agrotabilms.vercel.app");
    expect(resolverUrlDoSite()).toBe("https://agrotabilms.vercel.app");
  });

  it("remove barra sobrando no fim", () => {
    definirAmbiente("https://agrotabilms.com.br/");
    expect(resolverUrlDoSite()).toBe("https://agrotabilms.com.br");
  });

  it("cai no host do deploy da Vercel quando não há variável explícita", () => {
    definirAmbiente(undefined, "agrotabilms-abc123.vercel.app");
    expect(resolverUrlDoSite()).toBe("https://agrotabilms-abc123.vercel.app");
  });

  it("prefere a variável explícita ao host da Vercel", () => {
    definirAmbiente("https://agrotabilms.com.br", "agrotabilms-abc123.vercel.app");
    expect(resolverUrlDoSite()).toBe("https://agrotabilms.com.br");
  });

  it("cai no padrão quando nada está definido", () => {
    definirAmbiente(undefined, undefined);
    expect(resolverUrlDoSite()).toBe("https://agrotabilms.com.br");
  });

  it("sempre devolve uma URL que o new URL() aceita", () => {
    for (const valor of ["", "   ", "//", "http://", "agrotabilms.com.br", undefined]) {
      definirAmbiente(valor);
      expect(() => new URL(resolverUrlDoSite())).not.toThrow();
    }
  });
});
