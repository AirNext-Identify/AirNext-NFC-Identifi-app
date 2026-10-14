-- ============================================================================
-- 01_funcoes_ativacao.sql  —  RODAR PRIMEIRO.  É ADITIVO: só cria funções,
-- não altera, não remove e não bloqueia nada que já existe.
--
-- Cria duas funções que passam a ser o ÚNICO caminho do cliente para:
--   resolve_product(uuid|codigo)  -> o que o QR/chip mostra (público)
--   activate_product(codigo)      -> ativa o produto para o usuário logado
--
-- Por que: hoje o front lê e grava direto na tabela products, o que obriga
-- as policies a deixarem "produtos DISPONIVEL" legíveis/editáveis por todos.
-- Com as funções, a tabela pode ser fechada (ver 02_travar.sql).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- resolve_product: resolve UM produto a partir do uuid (chip/QR novo) ou do
-- código (QR antigo /a/:code). Devolve só o necessário e o `code` APENAS se o
-- produto estiver DISPONIVEL. Não há como listar produtos: precisa ter o
-- uuid/código em mãos.
-- ---------------------------------------------------------------------------
create or replace function public.resolve_product(
  p_uuid text default null,
  p_code text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v      jsonb;
  v_uuid text := lower(btrim(coalesce(p_uuid, '')));
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
begin
  if length(v_uuid) between 8 and 64 then
    select jsonb_build_object(
             'code',       case when p.status = 'DISPONIVEL' then p.code end,
             'slug',       p.slug,
             'status',     p.status,
             'nfc_uuid',   p.nfc_uuid,
             'expires_at', p.expires_at
           )
      into v
      from public.products p
     where p.nfc_uuid::text = v_uuid
     limit 1;
  elsif length(v_code) between 4 and 32 then
    select jsonb_build_object(
             'code',       case when p.status = 'DISPONIVEL' then p.code end,
             'slug',       p.slug,
             'status',     p.status,
             'nfc_uuid',   p.nfc_uuid,
             'expires_at', p.expires_at
           )
      into v
      from public.products p
     where p.code = v_code
     limit 1;
  end if;

  return v;  -- null quando não encontrado
end;
$$;

revoke all on function public.resolve_product(text, text) from public;
grant execute on function public.resolve_product(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- activate_product: ativação ATÔMICA. Um único UPDATE confere
-- (código + DISPONIVEL + sem dono) e grava — sem a janela entre "ler" e
-- "gravar" que permitia duas pessoas ativarem o mesmo código ao mesmo tempo.
-- Roda como dono da função, então o cliente não precisa de permissão de
-- UPDATE na tabela para ativar.
-- ---------------------------------------------------------------------------
create or replace function public.activate_product(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid    uuid := auth.uid();
  v_code   text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  v_prod   jsonb;
  v_owner  uuid;
  v_exists boolean;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  if length(v_code) < 4 or length(v_code) > 32 then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  update public.products p
     set user_id      = v_uid,
         status       = 'ATIVO',
         activated_at = now()
   where p.code    = v_code
     and p.status  = 'DISPONIVEL'
     and p.user_id is null
  returning to_jsonb(p) into v_prod;

  if v_prod is not null then
    return jsonb_build_object('ok', true, 'product', v_prod);
  end if;

  -- Não ativou: descobre o motivo para a mensagem certa no front.
  select true, p.user_id
    into v_exists, v_owner
    from public.products p
   where p.code = v_code;

  if v_exists is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  elsif v_owner = v_uid then
    return jsonb_build_object('ok', false, 'reason', 'already_yours');
  else
    return jsonb_build_object('ok', false, 'reason', 'unavailable');
  end if;
end;
$$;

revoke all on function public.activate_product(text) from public, anon;
grant execute on function public.activate_product(text) to authenticated;
