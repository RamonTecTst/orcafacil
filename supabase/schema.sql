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
  validade_dias integer not null default 7 check (validade_dias between 1 and 365),
  pagamento text,
  prazo text,
  garantia text,
  observacoes text,
  status text not null default 'rascunho'
    check (status in ('rascunho','enviado','aprovado','recusado','concluido')),
  total numeric(12,2) not null default 0 check (total >= 0),
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
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
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

drop policy if exists "empresa_dono_select" on public.empresas;

create policy "empresa_dono_select" on public.empresas
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "empresa_dono_insert" on public.empresas;

create policy "empresa_dono_insert" on public.empresas
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "empresa_dono_update" on public.empresas;

create policy "empresa_dono_update" on public.empresas
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "empresa_dono_delete" on public.empresas;

create policy "empresa_dono_delete" on public.empresas
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "clientes_dono_all" on public.clientes;

create policy "clientes_dono_all" on public.clientes
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "orcamentos_dono_all" on public.orcamentos;

create policy "orcamentos_dono_all" on public.orcamentos
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.clientes c
      where c.id = cliente_id and c.user_id = (select auth.uid())
    )
  );

drop policy if exists "itens_via_orcamento_dono" on public.itens_orcamento;

create policy "itens_via_orcamento_dono" on public.itens_orcamento
  for all to authenticated
  using (
    exists (
      select 1 from public.orcamentos o
      where o.id = orcamento_id and o.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.orcamentos o
      where o.id = orcamento_id and o.user_id = (select auth.uid())
    )
  );

-- Próximo passo: criar tabela de assinaturas depois que o provedor
-- de cobrança for escolhido. O status da assinatura deverá ser
-- atualizado por webhook no backend, nunca pelo navegador.


-- Atualização automática do timestamp.
create or replace function public.atualizar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists empresas_updated_at on public.empresas;
create trigger empresas_updated_at
before update on public.empresas
for each row execute function public.atualizar_updated_at();

drop trigger if exists clientes_updated_at on public.clientes;
create trigger clientes_updated_at
before update on public.clientes
for each row execute function public.atualizar_updated_at();

drop trigger if exists orcamentos_updated_at on public.orcamentos;
create trigger orcamentos_updated_at
before update on public.orcamentos
for each row execute function public.atualizar_updated_at();


-- Defesa em profundidade: o navegador não precisa de acesso às tabelas como anon.
revoke all on table public.empresas, public.clientes, public.orcamentos, public.itens_orcamento from anon;
grant select, insert, update, delete on table public.empresas, public.clientes, public.orcamentos, public.itens_orcamento to authenticated;

-- Criação atômica de orçamento.
-- O número e os valores são calculados no banco para evitar corrida,
-- duplicidade e manipulação dos totais pelo frontend.
create or replace function public.criar_orcamento(
  p_cliente_id uuid,
  p_titulo text default null,
  p_validade_dias integer default 7,
  p_pagamento text default null,
  p_prazo text default null,
  p_garantia text default null,
  p_observacoes text default null,
  p_itens jsonb default '[]'::jsonb
)
returns table (
  id uuid,
  numero integer,
  total numeric
)
language plpgsql
security invoker
set search_path = pg_catalog, public, auth
as $function$
declare
  v_user_id uuid := auth.uid();
  v_numero integer;
  v_orcamento_id uuid;
  v_total numeric(12,2) := 0;
  v_item record;
  v_subtotal numeric(12,2);
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  if not exists (
    select 1
    from public.clientes c
    where c.id = p_cliente_id
      and c.user_id = v_user_id
  ) then
    raise exception 'Cliente inválido';
  end if;

  if p_validade_dias is null or p_validade_dias < 1 or p_validade_dias > 365 then
    raise exception 'Validade inválida';
  end if;

  if pg_catalog.jsonb_typeof(p_itens) is distinct from 'array'
     or pg_catalog.jsonb_array_length(p_itens) < 1
     or pg_catalog.jsonb_array_length(p_itens) > 100 then
    raise exception 'Quantidade de itens inválida';
  end if;

  -- Um lock por usuário torna a numeração atômica sem bloquear outros usuários.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text, 0)
  );

  select coalesce(max(o.numero), 0) + 1
    into v_numero
  from public.orcamentos o
  where o.user_id = v_user_id;

  insert into public.orcamentos (
    user_id,
    cliente_id,
    numero,
    titulo,
    validade_dias,
    pagamento,
    prazo,
    garantia,
    observacoes,
    status,
    total
  )
  values (
    v_user_id,
    p_cliente_id,
    v_numero,
    nullif(pg_catalog.btrim(p_titulo), ''),
    p_validade_dias,
    nullif(pg_catalog.btrim(p_pagamento), ''),
    nullif(pg_catalog.btrim(p_prazo), ''),
    nullif(pg_catalog.btrim(p_garantia), ''),
    nullif(pg_catalog.btrim(p_observacoes), ''),
    'enviado',
    0
  )
  returning orcamentos.id into v_orcamento_id;

  for v_item in
    select *
    from pg_catalog.jsonb_to_recordset(p_itens)
      as x(descricao text, quantidade numeric, valor_unitario numeric)
  loop
    if v_item.descricao is null
       or pg_catalog.char_length(pg_catalog.btrim(v_item.descricao)) < 1
       or pg_catalog.char_length(pg_catalog.btrim(v_item.descricao)) > 500 then
      raise exception 'Descrição de item inválida';
    end if;

    if v_item.quantidade is null
       or v_item.quantidade <= 0
       or v_item.quantidade > 999999 then
      raise exception 'Quantidade de item inválida';
    end if;

    if v_item.valor_unitario is null
       or v_item.valor_unitario < 0
       or v_item.valor_unitario > 9999999999.99 then
      raise exception 'Valor unitário inválido';
    end if;

    v_subtotal := pg_catalog.round(v_item.quantidade * v_item.valor_unitario, 2);

    insert into public.itens_orcamento (
      orcamento_id,
      descricao,
      quantidade,
      valor_unitario,
      subtotal
    )
    values (
      v_orcamento_id,
      pg_catalog.btrim(v_item.descricao),
      v_item.quantidade,
      v_item.valor_unitario,
      v_subtotal
    );

    v_total := v_total + v_subtotal;
  end loop;

  if v_total > 9999999999.99 then
    raise exception 'Total do orçamento excede o limite permitido';
  end if;

  update public.orcamentos
     set total = v_total
   where id = v_orcamento_id
     and user_id = v_user_id;

  return query
  select v_orcamento_id, v_numero, v_total;
end;
$function$;

revoke all on function public.criar_orcamento(uuid, text, integer, text, text, text, text, jsonb) from public, anon;
grant execute on function public.criar_orcamento(uuid, text, integer, text, text, text, text, jsonb) to authenticated;

-- A função de trigger não precisa ser exposta ao navegador.
revoke all on function public.atualizar_updated_at() from public, anon, authenticated;
