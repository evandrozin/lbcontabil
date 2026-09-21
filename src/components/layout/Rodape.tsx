import Link from "next/link";
import { SITE, linkWhatsApp } from "@/lib/config";
import { LISTA_SEGMENTOS } from "@/lib/catalogo/segmentos";
import { Container } from "@/components/ui/primitivos";

export function Rodape() {
  const ano = new Date().getFullYear();

  return (
    <footer className="border-t border-borda bg-fundo-suave">
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-bold">{SITE.nome}</p>
            <p className="mt-2 text-sm text-texto-suave">{SITE.slogan}</p>
            <p className="mt-4 text-sm text-texto-suave">
              {SITE.razaoSocial}
              <br />
              CNPJ {SITE.cnpj}
              <br />
              {SITE.crc}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold">Para quem atendemos</p>
            <ul className="mt-3 space-y-2 text-sm">
              {LISTA_SEGMENTOS.map((segmento) => (
                <li key={segmento.id}>
                  <Link
                    href={`/segmentos/${segmento.slug}`}
                    className="text-texto-suave transition-colors hover:text-texto"
                  >
                    {segmento.rotuloSeletor}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Serviços</p>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                { href: "/planos", rotulo: "Planos e preços" },
                { href: "/simulador", rotulo: "Simulador de plano" },
                { href: "/abrir-empresa", rotulo: "Abertura de empresa" },
                { href: "/trocar-de-contador", rotulo: "Trocar de contador" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-texto-suave transition-colors hover:text-texto"
                  >
                    {item.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Fale com a gente</p>
            <ul className="mt-3 space-y-2 text-sm text-texto-suave">
              <li>
                <a
                  href={linkWhatsApp("Olá! Vim pelo site da LB Contábil.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-texto"
                >
                  WhatsApp {SITE.whatsappExibicao}
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-texto">
                  {SITE.email}
                </a>
              </li>
              <li>{SITE.endereco}</li>
              <li>Atendimento em todo o Brasil</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-borda pt-6 text-xs text-texto-suave sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {ano} {SITE.nome}. Todos os direitos reservados.
          </p>
          <div className="flex gap-4">
            <Link href="/termos" className="hover:text-texto">
              Termos de uso
            </Link>
            <Link href="/privacidade" className="hover:text-texto">
              Privacidade (LGPD)
            </Link>
          </div>
        </div>

        <p className="mt-6 text-xs text-texto-suave/80">
          Os valores exibidos são honorários contábeis e não incluem taxas de órgãos
          públicos (Junta Comercial, prefeitura, Receita Federal) nem os tributos da
          sua empresa. Simulações têm caráter informativo e não substituem análise
          individual do contador responsável.
        </p>
      </Container>
    </footer>
  );
}
