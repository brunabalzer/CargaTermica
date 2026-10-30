-- Consultas para o painel SQL do Supabase.
-- Os intervalos usam created_at em UTC, conforme o banco.

-- 1) Cálculos por semana
select
  date_trunc('week', created_at)::date as semana,
  count(*) as calculos,
  round(avg(total_btuh), 0) as media_btuh
from public.calculos
group by 1
order by 1 desc;

-- 2) Leads por semana e interesse
select
  date_trunc('week', created_at)::date as semana,
  interesse,
  count(*) as leads
from public.leads
group by 1, 2
order by 1 desc, 2;

-- 3) Taxa de conversão cálculo -> lead vinculado
select
  count(distinct calculos.id) as calculos,
  count(distinct leads.id) as leads_vinculados,
  round(
    100.0 * count(distinct leads.id) / nullif(count(distinct calculos.id), 0),
    2
  ) as taxa_calculo_para_lead_percentual
from public.calculos
left join public.leads on leads.calculo_id = calculos.id;

-- 4) Origem das campanhas (UTM)
select
  coalesce(origem, 'direto/sem UTM') as origem,
  count(*) as calculos,
  round(avg(total_btuh), 0) as media_btuh
from public.calculos
group by 1
order by calculos desc;

-- 5) Diferença média em relação à regra dos 600 BTU/m²
select
  round(
    avg(
      100.0 * (total_btuh - regra_bolso_btuh)
      / nullif(regra_bolso_btuh, 0)
    ),
    2
  ) as diferenca_media_percentual,
  round(avg(total_btuh), 0) as media_calculo_btuh,
  round(avg(regra_bolso_btuh), 0) as media_regra_bolso_btuh
from public.calculos;
