create extension if not exists pgcrypto;

create table if not exists public.calculos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  tipo_uso text not null,
  area_m2 numeric(10,2) not null check (area_m2 between 4 and 500),
  total_btuh numeric(12,2) not null check (total_btuh >= 0),
  regra_bolso_btuh numeric(12,2) not null check (regra_bolso_btuh >= 0),
  capacidade_sugerida numeric(12,2),
  entrada jsonb not null,
  origem text
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nome text not null,
  whatsapp text not null,
  email text,
  cidade text not null,
  interesse text not null check (interesse in ('projeto', 'pmoc')),
  calculo_id uuid references public.calculos(id) on delete set null,
  consentimento boolean not null,
  consentimento_texto text
);

alter table public.calculos enable row level security;
alter table public.leads enable row level security;

drop policy if exists "anon_insert_calculos" on public.calculos;
create policy "anon_insert_calculos"
on public.calculos for insert to anon
with check (true);

drop policy if exists "anon_insert_leads" on public.leads;
create policy "anon_insert_leads"
on public.leads for insert to anon
with check (consentimento = true);

revoke all on table public.calculos from anon;
revoke all on table public.leads from anon;
grant insert on table public.calculos to anon;
grant insert on table public.leads to anon;
