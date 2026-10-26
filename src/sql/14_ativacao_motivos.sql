-- ============================================================================
-- 14_ativacao_motivos.sql — rode UMA vez no SQL Editor do Supabase
-- (depois do 10_airnext_google.sql).
--
-- Problema: activate_product respondia "unavailable" (que o app mostrava como
-- "Código já utilizado") para QUALQUER produto fora do status DISPONIVEL —
-- inclusive produtos que NUNCA foram ativados, como os ainda NÃO PROGRAMADOS
-- (chip não gravado / não liberado para QR), bloqueados ou expirados.
--
-- Agora cada situação devolve um motivo próprio, e "unavailable" fica só para
-- o produto que realmente já pertence a outra conta.
-- Mesma assinatura da função: nada no app precisa ser reinstalado.
-- ============================================================================
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
      return jsonb_build_object('ok', false, 'reason', 'unavailable');   -- já é de outra conta
    end if;
    -- Sem dono: o produto existe mas não está liberado para ativação.
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
    return jsonb_build_object('ok', false, 'reason', 'unavailable');   -- perdeu a corrida
  end if;

  return jsonb_build_object('ok', true, 'product', v_prod);
end;
$$;

revoke all on function public.activate_product(text, text) from public, anon;
grant execute on function public.activate_product(text, text) to authenticated;

notify pgrst, 'reload schema';
