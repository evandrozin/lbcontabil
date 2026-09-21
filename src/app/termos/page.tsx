import type { Metadata } from "next";
import { SITE } from "@/lib/config";
import { COBRA_DECIMA_TERCEIRA } from "@/lib/catalogo/limites-fiscais";
import { Container } from "@/components/ui/primitivos";

/**
 * ⚠️ RASCUNHO JURÍDICO — REVISAR ANTES DE PUBLICAR.
 *
 * Este texto reflete as regras comerciais implementadas no código (limites
 * de plano, excedentes, 13ª mensalidade, cancelamento), mas NÃO substitui
 * revisão por advogado. Contrato de prestação de serviços contábeis tem
 * exigências do CFC (NBC PG 100/200) e do CDC que dependem do seu registro
 * profissional e da sua praça. Não coloque no ar sem parecer jurídico.
 */

export const metadata: Metadata = {
  title: "Termos de uso e contrato de prestação de serviços",
  description:
    "Condições gerais de contratação dos serviços contábeis da LB Contábil: escopo, limites de plano, cobrança recorrente, reajuste e cancelamento.",
};

const CLAUSULAS: { titulo: string; itens: string[] }[] = [
  {
    titulo: "1. Objeto",
    itens: [
      "A LB Contábil presta serviços de escrituração contábil e fiscal, apuração de tributos, folha de pagamento e cumprimento de obrigações acessórias, conforme o plano contratado.",
      "O escopo de cada plano é o descrito na página de planos no momento da contratação, que passa a integrar este contrato.",
      "Serviços não listados no plano são executados mediante contratação avulsa, com preço informado e aprovado previamente pelo contratante.",
    ],
  },
  {
    titulo: "2. Limites do plano e excedentes",
    itens: [
      "Cada plano tem limites contratuais de faturamento mensal, de notas fiscais processadas, de funcionários em folha e de pró-labores.",
      "Ao ultrapassar um limite, o excedente é cobrado conforme a tabela vigente ou o plano é ajustado para a faixa adequada, sempre com comunicação prévia de ao menos 10 dias.",
      "O contratante se obriga a informar mudanças relevantes de porte, atividade ou quadro de funcionários.",
    ],
  },
  {
    titulo: "3. Obrigações do contratante",
    itens: [
      "Enviar documentos, extratos e informações em até 5 dias úteis do encerramento de cada mês.",
      "Manter certificado digital válido e conceder as procurações eletrônicas necessárias.",
      "Responder pela veracidade das informações prestadas. A LB Contábil não responde por tributo apurado a menor em razão de documento não informado.",
    ],
  },
  {
    titulo: "4. Preço, cobrança e reajuste",
    itens: [
      "A mensalidade é cobrada de forma recorrente, por cartão de crédito, PIX com renovação automática ou boleto, conforme escolha no checkout.",
      COBRA_DECIMA_TERCEIRA
        ? "É devida a 13ª mensalidade, cobrada no encerramento do exercício, referente aos trabalhos de fechamento contábil e elaboração do balanço anual."
        : "",
      "Os valores são reajustados anualmente pela variação do IPCA, ou por índice que o substitua.",
      "O atraso superior a 15 dias autoriza a suspensão da execução dos serviços, após aviso, sem prejuízo dos prazos legais já assumidos.",
    ].filter(Boolean),
  },
  {
    titulo: "5. Vigência e cancelamento",
    itens: [
      "No plano mensal, o contrato é por prazo indeterminado e pode ser encerrado por qualquer das partes mediante aviso de 30 dias.",
      "No plano anual, há compromisso de 12 meses com cobrança mensal descontada. O encerramento antecipado implica a devolução do desconto concedido no período já usufruído e dos honorários de abertura, se tiverem sido dispensados.",
      "Encerrado o contrato, a LB Contábil entrega toda a documentação contábil e fiscal da empresa em até 30 dias, conforme dever profissional.",
    ],
  },
  {
    titulo: "6. Responsabilidade profissional",
    itens: [
      "Os serviços são executados por profissional registrado no Conselho Regional de Contabilidade, sob as normas do CFC.",
      "A responsabilidade da LB Contábil limita-se aos atos praticados no período de vigência do contrato e às informações efetivamente recebidas do contratante.",
      "Multas decorrentes de atraso exclusivamente imputável à LB Contábil são por ela suportadas.",
    ],
  },
  {
    titulo: "7. Proteção de dados",
    itens: [
      "O tratamento de dados pessoais observa a Lei 13.709/2018 (LGPD), nos termos da Política de Privacidade.",
      "Os documentos enviados ficam em armazenamento privado, acessível apenas à equipe responsável pela conta.",
    ],
  },
  {
    titulo: "8. Foro",
    itens: [
      "Fica eleito o foro da comarca da sede da LB Contábil para dirimir controvérsias, salvo direito do consumidor de optar pelo foro de seu domicílio.",
    ],
  },
];

export default function TermosPage() {
  return (
    <Container className="py-12 sm:py-16">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Termos de uso e contrato de prestação de serviços
        </h1>
        <p className="mt-3 text-texto-suave">
          {SITE.razaoSocial} — CNPJ {SITE.cnpj} — {SITE.crc}
        </p>

        <div className="mt-10 space-y-8">
          {CLAUSULAS.map((clausula) => (
            <section key={clausula.titulo}>
              <h2 className="text-xl font-bold">{clausula.titulo}</h2>
              <ul className="mt-3 space-y-2.5 text-sm text-texto-suave">
                {clausula.itens.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-marca-500"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-12 rounded-xl border border-borda bg-fundo-suave p-5 text-sm text-texto-suave">
          O contrato específico da sua empresa, com o plano, o valor e o escopo
          contratados, é gerado no momento da assinatura e enviado por e-mail. Em caso
          de divergência, prevalece o contrato individual.
        </p>
      </article>
    </Container>
  );
}
