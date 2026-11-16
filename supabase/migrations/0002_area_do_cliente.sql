-- ============================================================================
-- Área do assinante: autenticação, estado das obrigações e leitura própria
--
-- Postura de segurança: o cliente autenticado tem LEITURA das próprias
-- linhas por RLS, e NENHUMA escrita direta. Toda mudança de estado passa
-- por rota do servidor, que confere a sessão e escreve com service_role.
--
-- O motivo é concreto: se o cliente pudesse marcar uma obrigação como
-- concluída, ele marcaria "transmiti a DCTFWeb" — que quem transmite é o
-- escritório. O que ele pode fazer é DECLARAR que pagou, e isso é um
-- campo próprio, conferido depois contra a Receita.
-- ============================================================================

-- ─── Vínculo entre o assinante e a conta de acesso ─────────────────────
alter table public.assinaturas
  add column if not exists usuario_id uuid references auth.users (id) on delete set null;

create index if not exists assinaturas_usuario_idx
  on public.assinaturas (usuario_id);

-- ─── Estado de cada obrigação, por cliente e competência ───────────────
-- As linhas são materializadas a partir do motor de obrigações. O motor
-- diz QUAIS existem e QUANDO vencem; esta tabela guarda o que aconteceu
-- com cada uma — que é a informação que o motor, sendo função pura, não
-- tem como saber.
create table if not exists public.obrigacoes_cliente (
  id uuid primary key default gen_random_uuid(),
  assinatura_id uuid not null references public.assinaturas (id) on delete cascade,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  -- Identificação vinda do catálogo em código (src/lib/obrigacoes).
  obrigacao_id text not null,
  nome text not null,
  competencia text not null,
  vencimento date not null,
  /** Data antes do ajuste de dia útil, para explicar a diferença ao cliente. */
  vencimento_nominal date,

  -- Quem precisa agir: o cliente paga a guia, a equipe transmite declaração.
  responsavel text not null check (responsavel in ('cliente', 'equipe')),
  status text not null default 'pendente'
    check (status in ('pendente', 'aguardando-cliente', 'concluida', 'cancelada')),

  -- Guia, quando houver
  gera_guia boolean not null default false,
  valor_centavos integer check (valor_centavos is null or valor_centavos >= 0),
  codigo_pix text,
  url_guia text,

  -- O cliente declara que pagou; a conferência contra a Receita vem depois
  -- e preenche concluida_em. Uma coisa não substitui a outra.
  pagamento_declarado_em timestamptz,
  concluida_em timestamptz,
  concluida_por text,
  observacao text,

  unique (assinatura_id, obrigacao_id, competencia)
);

create index if not exists obrigacoes_cliente_assinatura_idx
  on public.obrigacoes_cliente (assinatura_id, vencimento);
create index if not exists obrigacoes_cliente_status_idx
  on public.obrigacoes_cliente (status, vencimento);

drop trigger if exists obrigacoes_cliente_atualizado_em on public.obrigacoes_cliente;
create trigger obrigacoes_cliente_atualizado_em
  before update on public.obrigacoes_cliente
  for each row execute function public.tocar_atualizado_em();

alter table public.obrigacoes_cliente enable row level security;

-- ─── Policies de LEITURA para o assinante autenticado ──────────────────
-- Nenhuma policy de insert, update ou delete é criada de propósito: a
-- escrita continua exclusiva da service_role, no servidor.

drop policy if exists "assinante le a propria assinatura" on public.assinaturas;
create policy "assinante le a propria assinatura"
  on public.assinaturas for select
  to authenticated
  using (usuario_id = (select auth.uid()));

drop policy if exists "assinante le as proprias obrigacoes" on public.obrigacoes_cliente;
create policy "assinante le as proprias obrigacoes"
  on public.obrigacoes_cliente for select
  to authenticated
  using (
    exists (
      select 1 from public.assinaturas a
      where a.id = obrigacoes_cliente.assinatura_id
        and a.usuario_id = (select auth.uid())
    )
  );

drop policy if exists "assinante le os proprios documentos" on public.documentos_onboarding;
create policy "assinante le os proprios documentos"
  on public.documentos_onboarding for select
  to authenticated
  using (
    exists (
      select 1 from public.assinaturas a
      where a.id = documentos_onboarding.assinatura_id
        and a.usuario_id = (select auth.uid())
    )
  );

-- eventos_gateway e simulacoes seguem sem policy: são dados internos e o
-- cliente não tem o que ver neles.

-- ─── Storage: o assinante lê os próprios arquivos ──────────────────────
-- O caminho no bucket começa com o id da assinatura, então a checagem é
-- sobre a primeira pasta do path.
drop policy if exists "assinante le os proprios arquivos" on storage.objects;
create policy "assinante le os proprios arquivos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documentos-onboarding'
    and exists (
      select 1 from public.assinaturas a
      where a.id::text = (storage.foldername(name))[1]
        and a.usuario_id = (select auth.uid())
    )
  );
