-- ============================================================================
-- 15_alertas_ativacao.sql — rode UMA vez no SQL Editor do Supabase
-- (depois do 14_ativacao_motivos.sql).
--
-- Objetivo: o ADMIN ser avisado quando um CLIENTE ativa um produto (padrão ou
-- AirNext Google), um aviso por produto ativado.
--
-- Como funciona:
--   1) Tabela admin_alerts — só o admin lê/atualiza/apaga.
--   2) activate_product (mesma assinatura do 14) agora grava uma linha em
--      admin_alerts quando a ativação dá certo. Como esse é o ÚNICO caminho de
--      ativação do cliente, transferências feitas pelo próprio admin no painel
--      NÃO geram alerta.
--      Se a gravação do alerta falhar por qualquer motivo, a ativação do
--      cliente continua funcionando (o alerta fica protegido por um bloco
--      de exceção).
--   3) Realtime ligado em admin_alerts: o painel recebe o aviso na hora.
--      Alertas criados com o painel fechado aparecem na próxima vez que ele abrir.
-- ============================================================================

create table if not exists public.admin_alerts (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  kind           text        not null default 'product_activated',
  product_id     uuid,
  product_code   text,
  product_line   text,
  product_type   text,
  lot_id         uuid,
  lot_code       text,
  user_id        uuid,
  customer_name  text,
  customer_email text,
  seen           boolean     not null default false
);

create index if not exists admin_alerts_created_idx on public.admin_alerts (created_at desc);
create index if not exists admin_alerts_unseen_idx  on public.admin_alerts (seen) where seen = false;

alter table public.admin_alerts enable row level security;

drop policy if exists admin_alerts_admin_select on public.admin_alerts;
drop policy if exists admin_alerts_admin_update on public.admin_alerts;
drop policy if exists admin_alerts_admin_delete on public.admin_alerts;

create policy admin_alerts_admin_select on public.admin_alerts
  for select to authenticated using (coalesce(private.is_admin(), false));
create policy admin_alerts_admin_update on public.admin_alerts
  for update to authenticated using (coalesce(private.is_admin(), false))
  with check (coalesce(private.is_admin(), false));
create policy admin_alerts_admin_delete on public.admin_alerts
  for delete to authenticated using (coalesce(private.is_admin(), false));
-- Sem policy de INSERT: só a função activate_product (security definer) grava.

-- Realtime (ignora se a tabela já estiver na publicação)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'admin_alerts'
  ) then
    alter publication supabase_realtime add table public.admin_alerts;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- activate_product: igual ao 14_ativacao_motivos.sql + registro do alerta.
-- ---------------------------------------------------------------------------
create or replace function public.activate_product(
  p_code         text,
  p_redirect_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid    uuid := auth.uid();
  v_code   text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  v_url    text := nullif(btrim(coalesce(p_redirect_url, '')), '');
  v_line   text;
  v_status text;
  v_owner  uuid;
  v_found  boolean := false;
  v_prod   jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  if length(v_code) < 4 or length(v_code) > 32 then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  select true, p.product_line, p.status, p.user_id
    into v_found, v_line, v_status, v_owner
    from public.products p
   where p.code = v_code;

  if not coalesce(v_found, false) then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_status <> 'DISPONIVEL' or v_owner is not null then
    if v_owner = v_uid then
      return jsonb_build_object('ok', false, 'reason', 'already_yours');
    end if;
    if v_owner is not null then
      return jsonb_build_object('ok', false, 'reason', 'unavailable');
    end if;
    return jsonb_build_object('ok', false, 'reason',
      case v_status
        when 'NAO_PROGRAMADO' then 'not_ready'
        when 'BLOQUEADO'      then 'blocked'
        when 'CANCELADO'      then 'cancelled'
        when 'EXPIRADO'       then 'expired'
        else 'not_ready'
      end);
  end if;

  if coalesce(v_line, 'STANDARD') = 'GOOGLE' then
    if v_url is null then
      return jsonb_build_object('ok', false, 'reason', 'google_url_required', 'product_line', 'GOOGLE');
    end if;
    if not public.is_valid_google_review_url(v_url) then
      return jsonb_build_object('ok', false, 'reason', 'google_url_invalid', 'product_line', 'GOOGLE');
    end if;
  end if;

  update public.products p
     set user_id      = v_uid,
         status       = 'ATIVO',
         activated_at = now(),
         redirect_url = case when coalesce(v_line, 'STANDARD') = 'GOOGLE' then v_url else p.redirect_url end
   where p.code    = v_code
     and p.status  = 'DISPONIVEL'
     and p.user_id is null
  returning to_jsonb(p) into v_prod;

  if v_prod is null then
    return jsonb_build_object('ok', false, 'reason', 'unavailable');
  end if;

  -- Alerta para o admin (nunca derruba a ativação do cliente).
  begin
    insert into public.admin_alerts
      (kind, product_id, product_code, product_line, product_type, lot_id, lot_code, user_id, customer_name, customer_email)
    select 'product_activated',
           (v_prod->>'id')::uuid,
           v_code,
           coalesce(v_line, 'STANDARD'),
           v_prod->>'product_type',
           nullif(v_prod->>'lot_id', '')::uuid,
           (select l.code from public.lots l where l.id = nullif(v_prod->>'lot_id', '')::uuid),
           v_uid,
           (select pr.name  from public.profiles pr where pr.user_id = v_uid limit 1),
           (select pr.email from public.profiles pr where pr.user_id = v_uid limit 1);
  exception when others then
    raise warning 'admin_alerts: falha ao registrar alerta de ativação: %', sqlerrm;
  end;

  return jsonb_build_object('ok', true, 'product', v_prod);
end;
$$;

revoke all on function public.activate_product(text, text) from public, anon;
grant execute on function public.activate_product(text, text) to authenticated;

notify pgrst, 'reload schema';
