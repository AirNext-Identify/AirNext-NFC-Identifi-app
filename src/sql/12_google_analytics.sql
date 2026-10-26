-- ============================================================================
-- 12_google_analytics.sql — rode UMA vez no SQL Editor do Supabase
-- (depois do 11_google_escaneamentos.sql).
--
-- Analytics do cliente: quantos acessos o link da plaquinha teve, por período,
-- com comparação, série diária, NFC x QR, dia da semana e horário de pico.
-- O cliente só enxerga as plaquinhas DELE; o admin vê todas. Horários no fuso
-- de São Paulo.
-- ============================================================================
create or replace function public.google_scan_analytics(
  p_days       integer default 30,
  p_product_id text    default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid      uuid    := auth.uid();
  v_is_admin boolean := coalesce(private.is_admin(), false);
  v_days     integer := greatest(7, least(coalesce(p_days, 30), 365));
  v_today    date    := (now() at time zone 'America/Sao_Paulo')::date;
  v_from     date    := (now() at time zone 'America/Sao_Paulo')::date - (greatest(7, least(coalesce(p_days, 30), 365)) - 1);
  v_prev_from date   := (now() at time zone 'America/Sao_Paulo')::date - (2 * greatest(7, least(coalesce(p_days, 30), 365)) - 1);
  v_result   jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('days', v_days, 'total', 0, 'previous_total', 0, 'nfc', 0, 'qr', 0,
                              'daily', '[]'::jsonb, 'by_weekday', '[]'::jsonb, 'by_hour', '[]'::jsonb, 'last_at', null);
  end if;

  with mine as (
    select gs.id, gs.product_id, gs.source, gs.created_at,
           (gs.created_at at time zone 'America/Sao_Paulo')               as local_ts,
           (gs.created_at at time zone 'America/Sao_Paulo')::date         as local_d
      from public.google_scans gs
      join public.products pr on pr.id = gs.product_id
     where (v_is_admin or pr.user_id = v_uid)
       and (p_product_id is null or pr.id::text = p_product_id)
       and (gs.created_at at time zone 'America/Sao_Paulo')::date >= v_prev_from
  ),
  cur as (select * from mine where local_d >= v_from),
  prev as (select * from mine where local_d < v_from)
  select jsonb_build_object(
    'days',           v_days,
    'total',          (select count(*) from cur),
    'previous_total', (select count(*) from prev),
    'nfc',            (select count(*) from cur where source = 'nfc'),
    'qr',             (select count(*) from cur where source = 'qr'),
    'last_at',        (select max(created_at) from cur),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object(
               'd',   to_char(g.d, 'YYYY-MM-DD'),
               'n',   coalesce(c.n, 0),
               'nfc', coalesce(c.nfc, 0),
               'qr',  coalesce(c.qr, 0)) order by g.d)
        from generate_series(v_from, v_today, interval '1 day') as g(d)
        left join (
          select local_d,
                 count(*) as n,
                 count(*) filter (where source = 'nfc') as nfc,
                 count(*) filter (where source = 'qr')  as qr
            from cur group by local_d
        ) c on c.local_d = g.d::date
    ), '[]'::jsonb),
    'by_weekday', coalesce((
      select jsonb_agg(jsonb_build_object('dow', w.dow, 'n', coalesce(c.n, 0)) order by w.dow)
        from generate_series(0, 6) as w(dow)
        left join (select extract(dow from local_ts)::int as dow, count(*) as n from cur group by 1) c on c.dow = w.dow
    ), '[]'::jsonb),
    'by_hour', coalesce((
      select jsonb_agg(jsonb_build_object('h', h.hr, 'n', coalesce(c.n, 0)) order by h.hr)
        from generate_series(0, 23) as h(hr)
        left join (select extract(hour from local_ts)::int as hr, count(*) as n from cur group by 1) c on c.hr = h.hr
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.google_scan_analytics(integer, text) from public, anon;
grant execute on function public.google_scan_analytics(integer, text) to authenticated;

notify pgrst, 'reload schema';

-- PARA DESFAZER:  drop function if exists public.google_scan_analytics(integer, text);
