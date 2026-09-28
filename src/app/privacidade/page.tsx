import type { Metadata } from "next";
import { SITE } from "@/lib/config";
import { Container } from "@/components/ui/primitivos";

/**
 * ⚠️ RASCUNHO JURÍDICO — REVISAR ANTES DE PUBLICAR.
 *
 * O texto descreve com fidelidade o que o código faz hoje (quais dados são
 * coletados, onde ficam, por quanto tempo). Ainda assim, a política precisa
 * de revisão por advogado e da indicação de um encarregado (DPO) real antes
 * de ir ao ar — LGPD, art. 41.
 */

export const metadata: Metadata = {
  title: "Política de Privacidade (LGPD)",
  description:
    "Como a Agrotábil MS coleta, usa, armazena e protege os dados pessoais de clientes e visitantes, conforme a Lei 13.709/2018.",
};

const SECOES: { titulo: string; paragrafos: string[]; lista?: string[] }[] = [
  {
    titulo: "1. Quem trata seus dados",
    paragrafos: [
      `O controlador dos dados é ${SITE.razaoSocial}, inscrita no CNPJ ${SITE.cnpj}. Para exercer qualquer direito previsto nesta política, escreva para ${SITE.email}.`,
    ],
  },
  {
    titulo: "2. Quais dados coletamos",
    paragrafos: [
      "Coletamos apenas o necessário para prestar o serviço contábil e para operar o site:",
    ],
    lista: [
      "Dados de contratação: nome, e-mail, celular, CPF ou CNPJ, CEP e dados da empresa.",
      "Documentos do onboarding: identidade dos sócios, contrato social, certificado digital, notas fiscais, extratos e demais documentos fiscais que você nos envia.",
      "Dados de cobrança: processados pelo nosso provedor financeiro. Números de cartão não trafegam nem são armazenados em nossos servidores.",
      "Simulações do site: os parâmetros informados no simulador (faturamento, número de notas, funcionários) são registrados sem qualquer identificação pessoal, apenas para calibrar nossa tabela de preços.",
    ],
  },
  {
    titulo: "3. Por que tratamos esses dados",
    paragrafos: [
      "Execução do contrato (art. 7º, V da LGPD): prestar os serviços contratados, emitir guias, entregar declarações e falar com você.",
      "Cumprimento de obrigação legal (art. 7º, II): a legislação fiscal e o CFC exigem a guarda de documentos e livros por prazos determinados.",
      "Legítimo interesse (art. 7º, IX): melhorar o site e entender quais segmentos têm mais demanda, sempre com dados agregados e não identificáveis.",
    ],
  },
  {
    titulo: "4. Com quem compartilhamos",
    paragrafos: [
      "Não vendemos dados pessoais. O compartilhamento ocorre apenas com:",
    ],
    lista: [
      "Órgãos públicos, para cumprir as obrigações fiscais da sua empresa (Receita Federal, prefeituras, SEFAZ, Junta Comercial).",
      "Provedor de meios de pagamento, para processar a cobrança recorrente.",
      "Provedor de infraestrutura e armazenamento, que hospeda o site e os documentos em ambiente privado.",
    ],
  },
  {
    titulo: "5. Por quanto tempo guardamos",
    paragrafos: [
      "Documentos contábeis e fiscais são mantidos pelos prazos legais de guarda, que chegam a 5 anos após o encerramento do exercício — e a 30 anos para documentos previdenciários e de folha.",
      "Encerrado o contrato e vencidos os prazos legais, os dados são eliminados ou anonimizados.",
    ],
  },
  {
    titulo: "6. Como protegemos",
    paragrafos: [
      "Os documentos enviados ficam em armazenamento privado, sem acesso público, e o banco de dados é protegido por controle de acesso em nível de linha.",
      "O acesso é restrito à equipe responsável pela sua conta e registrado para auditoria.",
    ],
  },
  {
    titulo: "7. Seus direitos",
    paragrafos: [
      "Você pode, a qualquer momento, pedir confirmação do tratamento, acesso, correção, portabilidade, anonimização ou eliminação dos seus dados, bem como informações sobre compartilhamento.",
      `Basta escrever para ${SITE.email}. Respondemos em até 15 dias.`,
      "A eliminação de documentos sujeitos a prazo legal de guarda só é possível após o decurso desse prazo.",
    ],
  },
  {
    titulo: "8. Cookies",
    paragrafos: [
      "O site usa apenas os cookies necessários ao seu funcionamento. Não utilizamos cookies de rastreamento de terceiros sem o seu consentimento explícito.",
    ],
  },
];

export default function PrivacidadePage() {
  return (
    <Container className="py-12 sm:py-16">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Política de Privacidade
        </h1>
        <p className="mt-3 text-texto-suave">
          Como tratamos seus dados pessoais, nos termos da Lei 13.709/2018 (LGPD).
        </p>

        <div className="mt-10 space-y-8">
          {SECOES.map((secao) => (
            <section key={secao.titulo}>
              <h2 className="text-xl font-bold">{secao.titulo}</h2>
              {secao.paragrafos.map((paragrafo) => (
                <p key={paragrafo} className="mt-3 text-sm text-texto-suave">
                  {paragrafo}
                </p>
              ))}
              {secao.lista && (
                <ul className="mt-3 space-y-2.5 text-sm text-texto-suave">
                  {secao.lista.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-marca-500"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </article>
    </Container>
  );
}
