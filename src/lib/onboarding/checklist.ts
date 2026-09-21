import type { SegmentoId } from "@/lib/catalogo/tipos";

/**
 * Checklist de documentos do onboarding.
 *
 * O que trava a entrada de um cliente novo é sempre documento faltando, não
 * o pagamento. Por isso a lista é explícita por segmento: o cliente sabe de
 * antemão o que precisa juntar, e a equipe não fica cobrando por WhatsApp.
 */
export interface ItemChecklist {
  id: string;
  nome: string;
  descricao: string;
  obrigatorio: boolean;
  /** Só aparece para quem está migrando de outro contador. */
  apenasMigracao?: boolean;
  /** Só aparece para quem já tem empresa aberta. */
  apenasEmpresaExistente?: boolean;
}

const COMUNS: ItemChecklist[] = [
  {
    id: "identidade-socios",
    nome: "Documento de identidade dos sócios",
    descricao: "RG ou CNH de cada sócio, frente e verso, legível.",
    obrigatorio: true,
  },
  {
    id: "comprovante-endereco",
    nome: "Comprovante de endereço",
    descricao:
      "Conta de luz, água ou telefone do endereço da empresa, emitida nos últimos 3 meses.",
    obrigatorio: true,
  },
  {
    id: "contrato-social",
    nome: "Contrato social ou certificado MEI",
    descricao:
      "Última alteração contratual consolidada, ou o Certificado de Condição de MEI.",
    obrigatorio: true,
    apenasEmpresaExistente: true,
  },
  {
    id: "cartao-cnpj",
    nome: "Cartão CNPJ",
    descricao: "Comprovante de inscrição atualizado, emitido no site da Receita Federal.",
    obrigatorio: true,
    apenasEmpresaExistente: true,
  },
  {
    id: "certificado-a1",
    nome: "Certificado digital e-CNPJ A1",
    descricao:
      "Arquivo .pfx e senha, ou autorização para emitirmos um novo. É ele que permite buscar suas notas automaticamente.",
    obrigatorio: true,
    apenasEmpresaExistente: true,
  },
  {
    id: "balancete-anterior",
    nome: "Balancete e guias do contador anterior",
    descricao:
      "Último balancete, guias dos 12 meses anteriores e arquivos do SPED. Se preferir, nós solicitamos direto ao seu contador.",
    obrigatorio: false,
    apenasMigracao: true,
  },
];

const POR_SEGMENTO: Record<SegmentoId, ItemChecklist[]> = {
  mei: [
    {
      id: "senha-gov",
      nome: "Acesso gov.br (nível prata ou ouro)",
      descricao:
        "Necessário para emissão do DAS e para a declaração anual. Orientamos a elevação do nível, se precisar.",
      obrigatorio: true,
    },
  ],

  "simples-servicos": [
    {
      id: "acesso-prefeitura",
      nome: "Acesso ao portal da prefeitura (NFS-e)",
      descricao:
        "Login e senha do sistema de nota do seu município, para conferirmos o ISS e as retenções.",
      obrigatorio: true,
    },
    {
      id: "notas-emitidas",
      nome: "Notas emitidas nos últimos 3 meses",
      descricao: "PDF ou XML das notas de serviço, para calibrarmos o Fator R.",
      obrigatorio: false,
    },
    {
      id: "folha-atual",
      nome: "Folha de pagamento atual",
      descricao: "Última folha e o valor do pró-labore praticado hoje.",
      obrigatorio: false,
    },
  ],

  "simples-comercio": [
    {
      id: "xml-entradas",
      nome: "XMLs de entrada e saída (3 meses)",
      descricao:
        "Se você já tem o certificado A1 conosco, buscamos direto na SEFAZ e você pode pular este item.",
      obrigatorio: false,
    },
    {
      id: "inventario-estoque",
      nome: "Inventário de estoque",
      descricao:
        "Posição de estoque do último fechamento, com quantidade e custo por item.",
      obrigatorio: true,
    },
    {
      id: "inscricao-estadual",
      nome: "Inscrição estadual e regime de ICMS",
      descricao: "Comprovante de inscrição estadual e eventual regime especial.",
      obrigatorio: true,
    },
    {
      id: "relatorio-marketplace",
      nome: "Relatórios de repasse dos marketplaces",
      descricao:
        "Extrato de repasse dos últimos 3 meses de cada canal (Mercado Livre, Shopee, Amazon…).",
      obrigatorio: false,
    },
  ],

  "lucro-presumido": [
    {
      id: "sped-anteriores",
      nome: "SPED Contábil e Fiscal dos últimos exercícios",
      descricao: "Arquivos ECD, ECF e EFD entregues, para dar continuidade à escrita.",
      obrigatorio: true,
    },
    {
      id: "extratos-bancarios",
      nome: "Extratos bancários do exercício",
      descricao:
        "OFX ou PDF de todas as contas PJ, para a conciliação bancária do período.",
      obrigatorio: true,
    },
    {
      id: "contratos-vigentes",
      nome: "Contratos vigentes com clientes e fornecedores",
      descricao: "Necessários para o reconhecimento correto de receita e de retenções.",
      obrigatorio: false,
    },
  ],

  rural: [
    {
      id: "matricula-imovel",
      nome: "Matrícula do imóvel ou contrato de arrendamento",
      descricao:
        "Documento que comprova a posse ou o arrendamento de cada área explorada.",
      obrigatorio: true,
    },
    {
      id: "itr-anteriores",
      nome: "ITR dos últimos exercícios",
      descricao:
        "Recibos de entrega do ITR, com a área total, de reserva legal e de produção.",
      obrigatorio: true,
    },
    {
      id: "notas-producao",
      nome: "Notas de venda da produção",
      descricao:
        "Notas do frigorífico, da cooperativa ou do cerealista — é nelas que conferimos a retenção de FUNRURAL.",
      obrigatorio: true,
    },
    {
      id: "lcdpr-anterior",
      nome: "LCDPR do exercício anterior",
      descricao:
        "Se já foi entregue. Se não, avaliamos a necessidade de escrituração retroativa.",
      obrigatorio: false,
    },
    {
      id: "car-caf",
      nome: "CAR e CAF/DAP",
      descricao:
        "Cadastro Ambiental Rural e, se houver, o Cadastro Nacional da Agricultura Familiar.",
      obrigatorio: false,
    },
    {
      id: "notas-custeio",
      nome: "Notas de custeio e investimento",
      descricao:
        "Insumos, combustível, maquinário e benfeitorias — é o que reduz a base do imposto no LCDPR.",
      obrigatorio: true,
    },
  ],
};

export function montarChecklist(
  segmentoId: SegmentoId,
  opcoes: { jaTemEmpresa: boolean; migracao: boolean },
): ItemChecklist[] {
  return [...COMUNS, ...POR_SEGMENTO[segmentoId]].filter((item) => {
    if (item.apenasEmpresaExistente && !opcoes.jaTemEmpresa) return false;
    if (item.apenasMigracao && !opcoes.migracao) return false;
    return true;
  });
}
