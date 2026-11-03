-- ============================================================================
-- 28_excluir_minha_conta.sql — rode UMA vez no SQL Editor do Supabase.
--
-- Exclusão REAL da própria conta pelo cliente (tela Suporte → Excluir Conta, que
-- exige digitar "excluir conta"). Apaga os dados da pessoa e a conta de login.
--   • Produtos NFC não são apagados: voltam para DISPONIVEL (limpos), como no
--     admin_delete_user com "liberar produtos".
--   • Contas de administrador NÃO podem ser excluídas por aqui.
-- ============================================================================
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid  uuid := auth.uid();
  pids text[];
begin
  if uid is null then
    raise exception 'Não autenticado';
  end if;
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'ADMIN' then
    raise exception 'Contas de administrador não podem ser excluídas por aqui.';
  end if;

  select coalesce(array_agg(id::text), '{}') into pids from public.products where user_id = uid;

  -- Dados ligados à pessoa. Cada bloco ignora tabela/coluna inexistente no seu banco.
  begin delete from public.visits where product_id::text = any(pids);
  exception when undefined_table or undefined_column then null; end;
  begin delete from public.push_subscriptions where user_id = uid;
  exception when undefined_table or undefined_column then null; end;
  begin delete from public.user_consents where user_id = uid;
  exception when undefined_table or undefined_column then null; end;
  begin delete from public.admin_notifications where user_id = uid;
  exception when undefined_table or undefined_column then null; end;
  begin delete from public.renewals where customer_id = uid;
  exception when undefined_table or undefined_column then null; end;
  begin delete from public.deletion_requests where user_id = uid;
  exception when undefined_table or undefined_column then null; end;
  begin delete from public.customer_profiles where user_id = uid;
  exception when undefined_table or undefined_column then null; end;

  -- Produtos: voltam para o estoque, sem os dados da pessoa.
  begin
    update public.products
       set user_id = null, status = 'DISPONIVEL', activated_at = null, expires_at = null,
           slug = null, profile_data = '{}'
     where user_id = uid;
  exception when undefined_column then
    update public.products
       set user_id = null, status = 'DISPONIVEL', activated_at = null, expires_at = null, slug = null
     where user_id = uid;
  end;

  begin delete from public.profiles where user_id = uid;
  exception when undefined_table or undefined_column then null; end;

  -- Por fim, a conta de login (as sessões são apagadas junto).
  delete from auth.users where id = uid;
end
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

notify pgrst, 'reload schema';
