-- OrçaFácil — schema inicial do SaaS
-- PostgreSQL / Supabase
-- Execute no SQL Editor do projeto de produção.
--
-- Segurança: RLS é obrigatória. O frontend nunca deve receber a service_role key.

create extension if not exists pgcrypto;

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  nome text not null,
  documento text,
  telefone text,
  email text,
  endereco text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  telefone text,
  email text,
  endereco text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orcamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  numero integer not null,
  titulo text,
  validade_dias integer not null default 7,
  pagamento text,
  prazo text,
  garantia text,
  observacoes text,
  status text not null default 'rascunho'
    check (status in ('rascunho','enviado','aprovado','recusado','concluido')),
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, numero)
);

create table if not exists public.itens_orcamento (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null references public.orcamentos(id) on delete cascade,
  descricao text not null,
  quantidade numeric(12,3) not null default 1 check (quantidade > 0),
  valor_unitario numeric(12,2) not null default 0 check (valor_unitario >= 0),
  subtotal numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists clientes_user_id_idx on public.clientes(user_id);
create index if not exists orcamentos_user_id_idx on public.orcamentos(user_id);
create index if not exists orcamentos_cliente_id_idx on public.orcamentos(cliente_id);
create index if not exists itens_orcamento_orcamento_id_idx on public.itens_orcamento(orcamento_id);

alter table public.empresas enable row level security;
alter table public.clientes enable row level security;
alter table public.orcamentos enable row level security;
alter table public.itens_orcamento enable row level security;

create policy "empresa_dono_select" on public.empresas
  for select using (auth.uid() = user_id);
create policy "empresa_dono_insert" on public.empresas
  for insert with check (auth.uid() = user_id);
create policy "empresa_dono_update" on public.empresas
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "empresa_dono_delete" on public.empresas
  for delete using (auth.uid() = user_id);

create policy "clientes_dono_all" on public.clientes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "orcamentos_dono_all" on public.orcamentos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "itens_via_orcamento_dono" on public.itens_orcamento
  for all
  using (
    exists (
      select 1 from public.orcamentos o
      where o.id = orcamento_id and o.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.orcamentos o
      where o.id = orcamento_id and o.user_id = auth.uid()
    )
  );

-- Próximo passo: criar tabela de assinaturas depois que o provedor
-- de cobrança for escolhido. O status da assinatura deverá ser
-- atualizado por webhook no backend, nunca pelo navegador.
