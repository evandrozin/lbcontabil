import type { Metadata } from "next";
import Link from "next/link";
import { FormularioLogin } from "@/components/area/FormularioLogin";
import { supabaseConfigurado } from "@/lib/supabase/sessao";
import { SITE, linkWhatsApp } from "@/lib/config";
import { BotaoLink, Cartao, Container } from "@/components/ui/primitivos";

export const metadata: Metadata = {
  title: "Entrar na área do assinante",
  robots: { index: false, follow: false },
};

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string }>;
}) {
  const { destino } = await searchParams;

  // Só caminho interno é aceito como destino. Sem isso, um link com
  // ?destino=https://site-falso daria um redirecionamento aberto logo
  // depois do login — pescaria de credencial com a nossa própria URL.
  const destinoSeguro =
    destino && destino.startsWith("/") && !destino.startsWith("//") ? destino : "/area";

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold tracking-tight">Área do assinante</h1>
        <p className="mt-2 text-texto-suave">
          Acompanhe o que precisa ser feito, baixe suas guias e envie documentos.
        </p>

        <Cartao className="mt-8">
          {supabaseConfigurado() ? (
            <FormularioLogin destino={destinoSeguro} />
          ) : (
            <div>
              <h2 className="font-bold">Acesso indisponível neste ambiente</h2>
              <p className="mt-2 text-sm text-texto-suave">
                A autenticação ainda não está configurada. Fale com a equipe pelo
                WhatsApp que seguimos o atendimento por lá.
              </p>
              <BotaoLink
                href={linkWhatsApp(`Olá! Preciso acessar minha área na ${SITE.nome}.`)}
                className="mt-5 w-full"
              >
                Falar no WhatsApp
              </BotaoLink>
            </div>
          )}
        </Cartao>

        <p className="mt-6 text-center text-sm text-texto-suave">
          Ainda não é cliente?{" "}
          <Link
            href="/planos"
            className="font-semibold text-marca-700 underline dark:text-marca-300"
          >
            Veja os planos
          </Link>
        </p>
      </div>
    </Container>
  );
}
