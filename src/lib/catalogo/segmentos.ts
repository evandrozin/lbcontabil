import type { Segmento, SegmentoId } from "./tipos";

/**
 * Conteúdo canônico de cada segmento. Alimenta o seletor da home, as landing
 * pages (/segmentos/[slug]) e os criativos de anúncio — mantenha a dor do
 * cliente literal aqui para não reescrever copy em três lugares diferentes.
 */
export const SEGMENTOS: Record<SegmentoId, Segmento> = {
  mei: {
    id: "mei",
    slug: "mei",
    nome: "MEI — Microempreendedor Individual",
    rotuloSeletor: "Sou MEI",
    headline: "Contabilidade para MEI sem susto no fim do ano",
    subheadline:
      "DAS em dia, declaração anual entregue no prazo e alguém para responder quando a Receita mandar carta. A partir de R$ 89/mês.",
    atividades: ["servico", "comercio"],
    regimes: ["mei"],
    dores: [
      "Esqueceu de pagar o DAS e descobriu a dívida só quando foi tirar a certidão negativa",
      "Não sabe se ainda cabe no limite de R$ 81 mil por ano — e o desenquadramento retroage",
      "Contratou o primeiro funcionário e não sabia que agora tem folha, FGTS e eSocial",
      "Emite nota para empresa grande e toma retenção que não sabe recuperar",
    ],
    obrigacoes: [
      "Emissão e controle mensal do DAS-SIMEI",
      "DASN-SIMEI (declaração anual de faturamento)",
      "Controle do limite de receita e alerta de desenquadramento",
      "Orientação de emissão de NFS-e no portal do município",
    ],
    perfilCliente: [
      "Prestadores de serviço autônomos",
      "Pequeno comércio e lojas de bairro",
      "Motoristas de aplicativo e entregadores",
      "Profissionais de beleza e estética",
    ],
    faq: [
      {
        pergunta: "MEI é obrigado a ter contador?",
        resposta:
          "Não é obrigatório por lei. Na prática, quem não tem controle do limite de faturamento, da declaração anual e das retenções acaba pagando multa maior do que a mensalidade.",
      },
      {
        pergunta: "Estourei o limite de faturamento. E agora?",
        resposta:
          "Fazemos o desenquadramento e a migração para o Simples Nacional calculando o imposto do excedente. Quanto antes isso for feito, menor a multa.",
      },
    ],
  },

  "simples-servicos": {
    id: "simples-servicos",
    slug: "simples-nacional-servicos",
    nome: "Simples Nacional — Serviços",
    rotuloSeletor: "Presto serviço (PJ)",
    headline: "Sua PJ de serviço está pagando mais imposto do que deveria",
    subheadline:
      "Fator R bem calculado leva o serviço do Anexo V para o Anexo III. Revisamos seu enquadramento na migração, sem custo.",
    atividades: ["servico"],
    regimes: ["simples-nacional"],
    dores: [
      "Está no Anexo V pagando alíquota cheia quando o Fator R colocaria a empresa no Anexo III",
      "Pró-labore definido no chute — ou alto demais (INSS caro) ou baixo demais (perde o Fator R)",
      "Contador atual só manda a guia por e-mail e some quando a dúvida é tributária",
      "Nota emitida no portal da prefeitura errada, com ISS retido em duplicidade",
    ],
    obrigacoes: [
      "Apuração mensal do DAS e acompanhamento do Fator R",
      "Folha de pró-labore e guia de INSS do sócio",
      "DEFIS anual e declarações acessórias do município",
      "Escrituração contábil completa e balanço anual",
    ],
    perfilCliente: [
      "Desenvolvedores e empresas de T.I.",
      "Médicos, dentistas e profissionais da saúde PJ",
      "Advogados e escritórios de consultoria",
      "Agências de marketing e design",
    ],
    faq: [
      {
        pergunta: "O que é o Fator R e por que ele muda meu imposto?",
        resposta:
          "É a razão entre a folha de pagamento (incluindo pró-labore) e a receita dos últimos 12 meses. Atingindo 28%, o serviço migra do Anexo V para o Anexo III, com alíquota inicial menor.",
      },
      {
        pergunta: "Trocar de contador dá trabalho? Vou ficar sem atendimento?",
        resposta:
          "Nós fazemos a transição. Solicitamos os arquivos ao contador anterior, conferimos as pendências e assumimos as obrigações do mês corrente. Você não precisa intermediar.",
      },
    ],
  },

  "simples-comercio": {
    id: "simples-comercio",
    slug: "simples-nacional-comercio",
    nome: "Simples Nacional — Comércio e E-commerce",
    rotuloSeletor: "Tenho comércio ou e-commerce",
    headline: "ICMS, substituição tributária e DIFAL sem virar passivo",
    subheadline:
      "Conciliação de notas de entrada e saída, controle de estoque e apuração correta do ST — para o crescimento não virar autuação.",
    atividades: ["comercio"],
    regimes: ["simples-nacional"],
    dores: [
      "Vende para outro estado e não sabe se deve recolher DIFAL",
      "Paga ICMS-ST sobre produto que já veio com o imposto retido na entrada",
      "Estoque contábil não bate com o estoque real e a diferença vira receita omitida",
      "Marketplace retém imposto e o repasse não é conciliado com a nota emitida",
    ],
    obrigacoes: [
      "Apuração de ICMS, ICMS-ST e DIFAL",
      "Importação e conciliação de XML de entrada e saída",
      "SPED Fiscal e obrigações acessórias estaduais",
      "Controle de estoque e CMV para o balanço",
    ],
    perfilCliente: [
      "Lojas físicas de varejo",
      "E-commerce próprio e sellers de marketplace",
      "Distribuidoras e atacado",
      "Importadores de pequeno porte",
    ],
    faq: [
      {
        pergunta: "Vocês importam os XMLs automaticamente?",
        resposta:
          "Sim. Com o seu certificado digital A1 capturamos as notas de entrada direto da SEFAZ, sem você precisar encaminhar arquivo.",
      },
      {
        pergunta: "Vendo em marketplace. Como fica a nota?",
        resposta:
          "Conciliamos o relatório de repasse do marketplace com as notas emitidas e identificamos as retenções, para você não pagar imposto duas vezes sobre a mesma venda.",
      },
    ],
  },

  "lucro-presumido": {
    id: "lucro-presumido",
    slug: "lucro-presumido",
    nome: "Lucro Presumido",
    rotuloSeletor: "Estou no Lucro Presumido",
    headline: "Lucro Presumido com planejamento tributário, não só com guia",
    subheadline:
      "SPED, DCTF, conciliação bancária rigorosa e reunião trimestral com o contador responsável pela sua conta.",
    atividades: ["servico", "comercio", "industria"],
    regimes: ["lucro-presumido"],
    dores: [
      "Faturou acima do limite do Simples e migrou sem ninguém refazer o cálculo do imposto",
      "PIS/COFINS e IRPJ/CSLL recolhidos sem conferência da base presumida",
      "Retenções na fonte dos clientes nunca compensadas",
      "Balanço entregue meses depois do fechamento, sem servir para decisão nenhuma",
    ],
    obrigacoes: [
      "Apuração trimestral de IRPJ e CSLL",
      "PIS/COFINS mensal e conferência das retenções",
      "SPED Contábil (ECD), ECF, SPED Fiscal e EFD-Contribuições",
      "DCTF, conciliação bancária mensal e balancete fechado",
    ],
    perfilCliente: [
      "Clínicas e empresas de saúde com vários sócios",
      "Empresas de médio porte acima do teto do Simples",
      "Holdings patrimoniais e imobiliárias",
      "Indústrias e transportadoras",
    ],
    faq: [
      {
        pergunta: "Vale a pena sair do Simples para o Presumido?",
        resposta:
          "Depende da margem e da folha. Fazemos o comparativo dos cenários com os seus números reais antes de qualquer mudança de regime — e o estudo fica com você.",
      },
      {
        pergunta: "Quem atende minha empresa?",
        resposta:
          "Um contador responsável nomeado, com reunião trimestral de planejamento por videochamada. Não é fila de atendimento genérica.",
      },
    ],
  },

  rural: {
    id: "rural",
    slug: "produtor-rural",
    nome: "Produtor Rural e Agronegócio",
    rotuloSeletor: "Sou produtor rural",
    headline: "Produtor rural: você sabe se está pagando imposto indevido?",
    subheadline:
      "LCDPR, ITR, FUNRURAL e eSocial rural com quem entende de porteira para dentro. Atendimento especializado em todo o Brasil.",
    atividades: ["rural"],
    regimes: ["produtor-rural-pf", "lucro-presumido", "simples-nacional"],
    dores: [
      "Entrega o LCDPR incompleto e perde a dedução de investimentos na lavoura",
      "Paga FUNRURAL sobre receita que já teve retenção na nota do frigorífico ou da cooperativa",
      "ITR declarado com área de reserva legal errada, gerando imposto acima do devido",
      "Trabalhador rural sem registro correto no eSocial, com risco em fiscalização",
      "Não separa o que é despesa da pessoa física do que é custeio da atividade rural",
    ],
    obrigacoes: [
      "Livro Caixa Digital do Produtor Rural (LCDPR)",
      "Apuração de FUNRURAL e conferência das retenções em nota",
      "ITR anual com apuração correta de área tributável",
      "eSocial rural, folha de safra e registro de empregados",
      "IRPF com anexo da atividade rural e aproveitamento de prejuízo",
    ],
    perfilCliente: [
      "Produtores de grãos e pecuaristas",
      "Fazendas com empregados registrados e folha de safra",
      "Arrendatários e parceiros rurais",
      "Agroindústrias familiares",
    ],
    faq: [
      {
        pergunta: "Sou pessoa física com CPF. Preciso mesmo de contabilidade?",
        resposta:
          "Quem fatura acima do limite de dispensa é obrigado ao LCDPR, e a escrituração é o que permite deduzir investimento e custeio. Sem ela, o imposto incide praticamente sobre a receita bruta.",
      },
      {
        pergunta: "Vocês atendem produtor de outro estado?",
        resposta:
          "Sim, atendemos em todo o Brasil. O acompanhamento é por WhatsApp e videochamada com o contador responsável pela carteira rural.",
      },
      {
        pergunta: "Compensa abrir CNPJ para a atividade rural?",
        resposta:
          "Em alguns casos sim — depende do faturamento, do número de empregados e do perfil de investimento. Fazemos o comparativo PF x PJ antes de recomendar qualquer mudança.",
      },
    ],
  },
};

export const LISTA_SEGMENTOS = Object.values(SEGMENTOS);

export function segmentoPorSlug(slug: string): Segmento | undefined {
  return LISTA_SEGMENTOS.find((s) => s.slug === slug);
}
