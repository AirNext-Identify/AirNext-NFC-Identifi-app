-- =============================================================================
-- FIX — Grants faltando nas tabelas novas do painel admin
-- =============================================================================
-- RLS (policy) só entra em ação DEPOIS que o Postgres já autorizou o papel
-- (authenticated) a tocar na tabela via GRANT. As tabelas antigas do projeto
-- (products, profiles, visits, feedbacks) ganharam esse grant automaticamente
-- por terem sido criadas via Table Editor do Supabase. As tabelas novas,
-- criadas via SQL Editor, não ganham esse grant por padrão — por isso todo
-- acesso a elas voltava 403, mesmo o usuário sendo admin e a policy estando
-- correta. Este script é idempotente (pode rodar quantas vezes quiser).
-- =============================================================================

grant select, insert, update, delete on public.lots                    to authenticated;
grant select, insert, update, delete on public.nfc_programming_records to authenticated;
grant select, insert, update, delete on public.renewals                to authenticated;
grant select, insert, update, delete on public.admin_logs              to authenticated;
grant select, insert, update, delete on public.admin_notifications     to authenticated;
grant select, insert, update, delete on public.customer_profiles       to authenticated;
grant select on public.customer_product_counts to authenticated;

-- Garante que o Postgrest também consegue executar a função is_admin()
-- usada em todas as policies novas.
grant execute on function public.is_admin() to authenticated;

-- =============================================================================
-- FIX 2 — DELETE nas tabelas ANTIGAS do projeto (products, profiles, etc)
-- =============================================================================
-- Essas tabelas já tinham SELECT/INSERT/UPDATE (usados pelo app do cliente
-- final), mas nunca precisaram de DELETE até o painel admin ganhar os
-- botões de "Excluir produto" / "Excluir cliente". Sem isto, qualquer
-- tentativa de apagar retorna erro de permissão.
grant delete on public.products to authenticated;
grant delete on public.profiles to authenticated;
grant delete on public.visits to authenticated;
grant delete on public.feedbacks to authenticated;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='deletion_requests') then
    grant delete on public.deletion_requests to authenticated;
  end if;
end $$;
