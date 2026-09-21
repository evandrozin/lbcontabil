# LB Contábil — plataforma de vendas

Contabilidade online para todo o Brasil: vitrine por segmento, simulador de
plano, checkout com cobrança recorrente e onboarding de documentos.

Stack: **Next.js 16 (App Router) · TypeScript · Tailwind 4 · Supabase · Asaas**

---

## Como rodar

```bash
npm install
cp .env.example .env.local   # preencha o que for usar
npm run dev
```

Sem `ASAAS_API_KEY` o checkout usa um **gateway simulado** — o funil inteiro
fica navegável sem conta no provedor e nenhuma cobrança real é criada.
Sem as variáveis do Supabase, a venda não é persistida (avisa no log) e o
onboarding exibe uma tela de fallback com o WhatsApp.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento em http://localhost:3000 |
| `npm run build` | Build de produção |
| `npm test` | Suíte de testes (Vitest) |
| `npm run typecheck` | Checagem de tipos sem emitir |

## Banco de dados

Aplique `supabase/migrations/0001_init.sql` no projeto Supabase. Ele cria as
tabelas `assinaturas`, `documentos_onboarding`, `eventos_gateway` e
`simulacoes`, o bucket privado `documentos-onboarding` e **habilita RLS sem
nenhuma policy permissiva** — só a `service_role`, usada exclusivamente no
servidor, enxerga os dados.

## Webhook do Asaas

No painel do Asaas, aponte o webhook para `https://SEU_DOMINIO/api/webhooks/asaas`
e configure um token de acesso. O mesmo valor vai em `ASAAS_WEBHOOK_TOKEN` —
a rota rejeita com 401 qualquer POST sem ele.

---

## Estrutura

```
src/lib/catalogo/       Segmentos, planos, add-ons e parâmetros fiscais
src/lib/precificacao/   Fórmula custo + margem (valida a tabela de preços)
src/lib/simulador/      Motor de enquadramento e recomendação (função pura)
src/lib/pagamentos/     Interface do gateway + adaptadores Asaas e mock
src/lib/validacao/      CPF, CNPJ (inclusive alfanumérico), celular, CEP
src/lib/checkout/       Esquemas Zod compartilhados cliente/servidor
src/lib/onboarding/     Checklist de documentos por segmento
src/app/                Páginas e rotas de API
supabase/migrations/    Schema versionado
```

### Onde mexer no negócio

| Quero mudar… | Arquivo |
| --- | --- |
| Preço de um plano, limites, excedentes | `src/lib/catalogo/planos.ts` |
| Copy da landing page de um segmento | `src/lib/catalogo/segmentos.ts` |
| Tabela de serviços avulsos | `src/lib/catalogo/addons.ts` |
| Limite do MEI, teto do Simples, Fator R | `src/lib/catalogo/limites-fiscais.ts` |
| Custo-hora, margem alvo, taxa do gateway | `src/lib/precificacao/custo.ts` |
| Regras de enquadramento e alertas fiscais | `src/lib/simulador/motor.ts` |
| Documentos pedidos no onboarding | `src/lib/onboarding/checklist.ts` |
| WhatsApp, CNPJ, CRC, razão social | `src/lib/config.ts` |

---

## Decisões que valem conhecer

**Dinheiro em centavos.** Todo valor monetário é inteiro. Float em cobrança
recorrente vira divergência de centavo no fechamento do mês.

**A tabela de preços é testada, não só escrita.** `planos.test.ts` calcula o
piso de custo de cada plano pela fórmula de custo + margem e falha se algum
preço — inclusive o do contrato anual, já com desconto — ficar abaixo dele.
Mexeu nas horas de equipe ou no custo de software? O teste diz se o preço
ainda fecha.

**O preço vem sempre do servidor.** `/api/assinaturas` ignora qualquer valor
enviado pelo cliente e lê a mensalidade do catálogo. Caso contrário, bastaria
abrir o devtools para assinar o Premium por R$ 1.

**Nenhum dado de cartão passa por aqui.** O checkout cria a assinatura no
gateway e redireciona para a página de pagamento hospedada por ele. Isso nos
mantém fora do escopo de PCI-DSS.

**O motor do simulador é uma função pura.** Sem I/O e sem data embutida, roda
igual no servidor e no cliente, e é testável sem mock.

**Trilha de auditoria antes do efeito.** O webhook grava o payload cru em
`eventos_gateway` antes de atualizar qualquer status. Em divergência de
cobrança, é essa tabela que diz o que o Asaas realmente mandou e quando.

---

## Antes de ir ao ar

- [ ] Preencher os dados reais em `src/lib/config.ts` (razão social, CNPJ,
      CRC, WhatsApp, e-mail). Divulgação de serviço contábil sem registro no
      CRC é irregular.
- [ ] **Revisão jurídica de `/termos` e `/privacidade`.** Os dois arquivos são
      rascunhos fiéis ao que o código faz, mas não substituem parecer de
      advogado. A política de privacidade ainda precisa indicar um encarregado
      (DPO) real — LGPD, art. 41.
- [ ] Conferir `limites-fiscais.ts` na virada do exercício (teto do MEI,
      teto do Simples, sublimite de ICMS/ISS mudam por lei).
- [ ] Criar a conta no Asaas, sair do sandbox e configurar o webhook.
- [ ] Aplicar a migração no Supabase de produção e conferir que o bucket
      `documentos-onboarding` está privado.
- [ ] Definir o índice de reajuste anual no contrato (hoje: IPCA).

## O que ainda não existe

Escopo deliberadamente fora desta entrega, na ordem em que faz sentido atacar:

1. **Portal do cliente** — área logada para baixar guias (DAS/DARF), enviar
   extratos e abrir chamados.
2. **Painel interno** — fila de onboarding, conferência de documentos e
   carteira por contador responsável.
3. **E-mail transacional** — hoje o cliente depende do e-mail do gateway; falta
   o nosso, com o link do onboarding.
4. **Assinatura eletrônica do contrato** — o aceite hoje é o checkbox do
   checkout, com IP e user-agent registrados.
5. **Blog e conteúdo de SEO** — o funil de topo previsto no plano comercial.
