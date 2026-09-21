-- ============================================================================
-- LB Contábil — schema inicial do funil de vendas
--
-- Princípio de segurança: TUDO aqui é dado pessoal e fiscal (LGPD, art. 5º).
-- O RLS fica ligado sem nenhuma policy permissiva: só a service_role (usada
-- exclusivamente no servidor Next.js) enxerga as linhas. Nenhuma chave anon
-- consegue ler ou escrever nestas tabelas, mesmo que vaze.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ─── Assinaturas (a venda em si) ───────────────────────────────────────────
create table if not exists public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  -- Catálogo no momento da venda. Gravamos o valor junto do id do plano
  -- porque a tabela de preços muda e o contrato assinado não.
  plano_id text not null,
  segmento_id text not null,
  periodicidade text not null check (periodicidade in ('mensal', 'anual')),
  valor_mensal_centavos integer not null check (valor_mensal_centavos > 0),

  -- Responsável pela contratação
  responsavel_nome text not null,
  responsavel_email text not null,
  responsavel_cpf_cnpj text not null,
  responsavel_celular text not null,
  cep text,

  -- Empresa
  ja_tem_empresa boolean not null default true,
  empresa_razao_social text,
  empresa_cnpj text,

  -- Gateway de cobrança
  gateway text not null,
  gateway_cliente_id text,
  gateway_assinatura_id text,
  url_pagamento text,
  status text not null default 'aguardando-pagamento'
    check (status in ('aguardando-pagamento', 'ativa', 'inadimplente', 'cancelada')),

  -- Onboarding: o token é o que autoriza o acesso à página de documentos,
  -- por isso é separado do id (que aparece em log e em URL de suporte).
  onboarding_token uuid not null default gen_random_uuid(),
  onboarding_concluido_em timestamptz,

  -- Prova de aceite do contrato (exigível em caso de disputa)
  aceite_contrato_em timestamptz not null default now(),
  aceite_ip text,
  aceite_user_agent text,

  observacoes text
);

create unique index if not exists assinaturas_gateway_assinatura_id_idx
  on public.assinaturas (gateway_assinatura_id)
  where gateway_assinatura_id is not null;

create unique index if not exists assinaturas_onboarding_token_idx
  on public.assinaturas (onboarding_token);

create index if not exists assinaturas_status_idx on public.assinaturas (status);
create index if not exists assinaturas_email_idx on public.assinaturas (responsavel_email);

-- ─── Documentos enviados no onboarding ─────────────────────────────────────
create table if not exists public.documentos_onboarding (
  id uuid primary key default gen_random_uuid(),
  assinatura_id uuid not null references public.assinaturas (id) on delete cascade,
  criado_em timestamptz not null default now(),
  tipo text not null,
  nome_arquivo text not null,
  caminho_storage text not null,
  tamanho_bytes integer,
  content_type text
);

create index if not exists documentos_assinatura_idx
  on public.documentos_onboarding (assinatura_id);

-- ─── Eventos do gateway (trilha de auditoria financeira) ───────────────────
-- Guardamos o payload cru: quando houver divergência de cobrança, é esta
-- tabela que diz o que o provedor realmente enviou e quando.
create table if not exists public.eventos_gateway (
  id uuid primary key default gen_random_uuid(),
  recebido_em timestamptz not null default now(),
  gateway text not null,
  tipo text not null,
  gateway_assinatura_id text,
  assinatura_id uuid references public.assinaturas (id) on delete set null,
  payload jsonb not null,
  processado boolean not null default false,
  erro text
);

create index if not exists eventos_gateway_assinatura_idx
  on public.eventos_gateway (gateway_assinatura_id);

-- ─── Simulações (topo de funil) ────────────────────────────────────────────
-- Sem dado pessoal obrigatório: serve para medir conversão por segmento e
-- calibrar a tabela de preços com demanda real.
create table if not exists public.simulacoes (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  segmento_id text not null,
  plano_recomendado_id text not null,
  periodicidade text not null,
  total_mensal_centavos integer not null,
  entrada jsonb not null,
  email text,
  origem text,
  utm jsonb
);

create index if not exists simulacoes_segmento_idx on public.simulacoes (segmento_id);
create index if not exists simulacoes_criado_em_idx on public.simulacoes (criado_em desc);

-- ─── atualizado_em automático ──────────────────────────────────────────────
create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists assinaturas_atualizado_em on public.assinaturas;
create trigger assinaturas_atualizado_em
  before update on public.assinaturas
  for each row execute function public.tocar_atualizado_em();

-- ─── RLS: negado por padrão, sem exceção ───────────────────────────────────
alter table public.assinaturas enable row level security;
alter table public.documentos_onboarding enable row level security;
alter table public.eventos_gateway enable row level security;
alter table public.simulacoes enable row level security;

-- Nenhuma policy é criada de propósito. Com RLS habilitado e zero policies,
-- qualquer role que respeite RLS (anon, authenticated) recebe zero linhas.
-- A service_role ignora RLS e é usada apenas no servidor.

-- ─── Storage: bucket privado para documentos do cliente ────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentos-onboarding',
  'documentos-onboarding',
  false,
  20971520, -- 20 MB
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/xml', 'text/xml']
)
on conflict (id) do nothing;
