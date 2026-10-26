-- ============================================================================
-- 13_admin_excluir_usuario.sql — rode UMA vez no SQL Editor do Supabase.
--
-- Exclusão REAL de usuário pelo painel admin (Clientes → Excluir).
--
-- Por que existe: o front só consegue apagar a "ficha de CRM" do cliente
-- (customer_profiles). A conta de login (auth.users) e o cartão (profiles)
-- só podem ser apagados por uma função SECURITY DEFINER — e é isso que este
-- arquivo cria. Só quem passa em private.is_admin() consegue executar.
--
-- O que a função faz:
--   1) Produtos do usuário:
--        p_delete_products = false (padrão) → LIBERA os produtos: voltam a ser
--          DISPONIVEL, sem dono e sem validade (o chip/QR pode ser ativado de
--          novo por outra pessoa).
--        p_delete_products = true → APAGA os produtos do usuário.
--   2) Apaga dados do usuário nas tabelas de apoio (se existirem).
--   3) Apaga profiles e a conta em auth.users.
--
-- Segurança: não permite excluir a si mesmo.
-- ============================================================================
create or replace function public.admin_delete_user(
  p_user_id         uuid,
  p_delete_products boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_uid     uuid := auth.uid();
  v_prods   integer := 0;
  v_rec     record;
  v_exists  boolean;
begin
  if v_uid is null or not coalesce(private.is_admin(), false) then
    raise exception 'Apenas administradores podem excluir usuários.' using errcode = '42501';
  end if;

  if p_user_id is null then
    raise exception 'Usuário não informado.' using errcode = '22023';
  end if;

  if p_user_id = v_uid then
    raise exception 'Você não pode excluir a própria conta de administrador.' using errcode = '42501';
  end if;

  -- 1) Produtos ----------------------------------------------------------
  if p_delete_products then
    delete from public.products where user_id = p_user_id;
    get diagnostics v_prods = row_count;
  else
    update public.products
       set user_id      = null,
           status       = 'DISPONIVEL',
           activated_at = null,
           expires_at   = null,
           slug         = null
     where user_id = p_user_id;
    get diagnostics v_prods = row_count;
  end if;

  -- 2) Tabelas de apoio (cada uma só é tocada se existir com a coluna) ------
  for v_rec in
    select * from (values
      ('customer_profiles',    'user_id'),
      ('profiles',             'user_id'),
      ('user_consents',        'user_id'),
      ('deletion_requests',    'user_id'),
      ('feedbacks',            'user_id'),
      ('admin_notifications',  'customer_id'),
      ('renewals',             'customer_id')
    ) as t(tbl, col)
  loop
    select exists (
      select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name   = v_rec.tbl
         and column_name  = v_rec.col
    ) into v_exists;

    if v_exists then
      begin
        execute format('delete from public.%I where %I::text = $1', v_rec.tbl, v_rec.col)
          using p_user_id::text;
      exception when others then
        -- Uma tabela de apoio com restrição não pode impedir a exclusão do resto.
        raise notice 'Não foi possível limpar %.%: %', v_rec.tbl, v_rec.col, sqlerrm;
      end;
    end if;
  end loop;

  -- 3) Conta de login ----------------------------------------------------
  delete from auth.users where id = p_user_id;

  return jsonb_build_object('ok', true, 'products_affected', v_prods, 'products_deleted', p_delete_products);
end;
$$;

revoke all on function public.admin_delete_user(uuid, boolean) from public, anon;
grant execute on function public.admin_delete_user(uuid, boolean) to authenticated;

notify pgrst, 'reload schema';

-- PARA DESFAZER:  drop function if exists public.admin_delete_user(uuid, boolean);
