-- ============================================================================
-- 11_google_escaneamentos.sql — rode UMA vez no SQL Editor do Supabase
-- (depois do 10_airnext_google.sql).
--
-- Conta quantas vezes cada plaquinha AirNext Google foi aberta (QR Code ou
-- toque NFC), para o admin e para o dono da plaquinha.
--
--   • track_google_scan(...)  → chamada pela página pública /n/:uuid antes de
--     redirecionar. Só conta plaquinha GOOGLE e ATIVA. Qualquer pessoa (inclusive
--     sem login) pode chamar, mas só ela grava — ninguém lê a tabela direto.
--   • google_scan_stats(...)  → totais por plaquinha: o admin vê todas, o cliente
--     só as dele.
--
-- É aditivo: não altera nada existente.
-- ============================================================================

-- 1) Tabela (o tipo da coluna product_id acompanha o de products.id) -----------
do $$
declare t text;
begin
  select format_type(a.atttypid, a.atttypmod) into t
    from pg_attribute a
   where a.attrelid = 'public.products'::regclass and a.attname = 'id' and not a.attisdropped;
  execute format($f$
    create table if not exists public.google_scans (
      id         bigint generated always as identity primary key,
      product_id %s not null references public.products(id) on delete cascade,
      source     text not null default 'qr' check (source in ('qr', 'nfc')),
      created_at timestamptz not null default now()
    )$f$, t);
end $$;

create index if not exists google_scans_prod_idx on public.google_scans (product_id, created_at desc);
create index if not exists google_scans_created_idx on public.google_scans (created_at desc);

-- Fechada: sem policies = ninguém (anon/authenticated) lê ou escreve direto.
-- Tudo passa pelas funções abaixo (SECURITY DEFINER).
alter table public.google_scans enable row level security;
revoke all on public.google_scans from anon, authenticated;

-- 2) Registrar um escaneamento ------------------------------------------------
create or replace function public.track_google_scan(
  p_uuid   text default null,
  p_code   text default null,
  p_source text default 'qr'
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uuid text := lower(btrim(coalesce(p_uuid, '')));
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  p      public.products;
begin
  if length(v_uuid) between 8 and 64 then
    select * into p from public.products where nfc_uuid::text = v_uuid limit 1;
  elsif length(v_code) between 4 and 32 then
    select * into p from public.products where code = v_code limit 1;
  end if;

  -- Só conta plaquinha Google ATIVA (mesma regra que faz o QR redirecionar).
  if p.id is null or p.product_line is distinct from 'GOOGLE' or p.status <> 'ATIVO' then
    return;
  end if;

  -- Evita contar duas vezes o mesmo toque (duplo disparo / recarregar a página).
  if exists (select 1 from public.google_scans s
              where s.product_id = p.id and s.created_at > now() - interval '5 seconds') then
    return;
  end if;

  insert into public.google_scans (product_id, source)
  values (p.id, case when p_source = 'nfc' then 'nfc' else 'qr' end);
end;
$$;

revoke all on function public.track_google_scan(text, text, text) from public;
grant execute on function public.track_google_scan(text, text, text) to anon, authenticated;

-- 3) Estatísticas por plaquinha -------------------------------------------------
--    admin: todas as plaquinhas com escaneamentos | cliente: só as dele.
--    p_daily = true acrescenta os últimos 14 dias (para o gráfico do cliente).
create or replace function public.google_scan_stats(p_daily boolean default false)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid      uuid    := auth.uid();
  v_is_admin boolean := coalesce(private.is_admin(), false);
begin
  if v_uid is null then
    return '[]'::jsonb;
  end if;

  return coalesce((
    select jsonb_agg(
             jsonb_build_object(
               'product_id', s.product_id,
               'total',      s.total,
               'last_7d',    s.last_7d,
               'last_30d',   s.last_30d,
               'nfc',        s.nfc,
               'qr',         s.qr,
               'last_at',    s.last_at
             )
             || case when p_daily then
                  jsonb_build_object('daily', coalesce((
                    select jsonb_agg(jsonb_build_object('d', to_char(g.d, 'YYYY-MM-DD'), 'n', coalesce(c.n, 0)) order by g.d)
                      from generate_series(current_date - 13, current_date, interval '1 day') as g(d)
                      left join (
                        select (created_at at time zone 'America/Sao_Paulo')::date as d, count(*) as n
                          from public.google_scans
                         where product_id = s.product_id
                           and created_at > now() - interval '15 days'
                         group by 1
                      ) c on c.d = g.d::date
                  ), '[]'::jsonb))
                else '{}'::jsonb end
           )
      from (
        select gs.product_id,
               count(*)                                                        as total,
               count(*) filter (where gs.created_at > now() - interval '7 days')  as last_7d,
               count(*) filter (where gs.created_at > now() - interval '30 days') as last_30d,
               count(*) filter (where gs.source = 'nfc')                       as nfc,
               count(*) filter (where gs.source = 'qr')                        as qr,
               max(gs.created_at)                                              as last_at
          from public.google_scans gs
          join public.products pr on pr.id = gs.product_id
         where v_is_admin or pr.user_id = v_uid
         group by gs.product_id
      ) s
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.google_scan_stats(boolean) from public, anon;
grant execute on function public.google_scan_stats(boolean) to authenticated;

notify pgrst, 'reload schema';

-- PARA DESFAZER:
--   drop function if exists public.google_scan_stats(boolean);
--   drop function if exists public.track_google_scan(text, text, text);
--   drop table if exists public.google_scans;
