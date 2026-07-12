-- =============================================================================
-- FIX CRÍTICO — Escalonamento de privilégio via user_metadata
-- =============================================================================
-- PROBLEMA: is_admin() lia auth.jwt() -> 'user_metadata' ->> 'role'.
-- user_metadata é editável pelo PRÓPRIO usuário via supabase.auth.updateUser()
-- no navegador — ou seja, qualquer cliente podia se autopromover a ADMIN e
-- ganhar acesso total via RLS a todas as tabelas do painel administrativo.
--
-- CORREÇÃO: passar a checagem para app_metadata, que só pode ser escrito
-- com a service_role key (nunca exposta no navegador) ou diretamente no
-- SQL Editor do Supabase (que roda como o superusuário do Postgres).
--
-- COMO APLICAR (nessa ordem):
--   1) Rode este arquivo inteiro no SQL Editor do Supabase.
--   2) No bloco 3 mais abaixo, troque 'SEU_EMAIL_ADMIN_AQUI' pelo(s)
--      e-mail(s) real(is) da sua equipe admin e rode aquele trecho.
--   3) Confirme login como admin funcionando normalmente.
--   4) Publique o build novo do frontend (item 4, AuthContext/LoginPage)
--      que passa a ler app_metadata em vez de user_metadata.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────
-- 1) Nova versão de is_admin() — lê app_metadata (seguro)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN',
    false
  );
$$;

comment on function public.is_admin() is
  'Retorna true quando o usuário autenticado tem app_metadata.role = ADMIN. app_metadata só pode ser escrito com a service_role key ou via SQL Editor — nunca pelo próprio usuário. Usada nas policies de RLS do painel administrativo.';


-- ─────────────────────────────────────────────────────────────────────────
-- 2) Limpa qualquer "role" que possa ter sido plantado em user_metadata
--    (inclusive por alguém que já tenha explorado a falha antiga).
--    Não afeta name/avatar/outros campos — remove só a chave "role".
-- ─────────────────────────────────────────────────────────────────────────
update auth.users
set raw_user_meta_data = raw_user_meta_data - 'role'
where raw_user_meta_data ? 'role';


-- ─────────────────────────────────────────────────────────────────────────
-- 3) Concede ADMIN de verdade (em app_metadata) para a sua equipe.
--    Troque o e-mail abaixo e rode esse UPDATE uma vez para cada admin real.
-- ─────────────────────────────────────────────────────────────────────────
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'ADMIN')
where email = 'SEU_EMAIL_ADMIN_AQUI';

-- Para conferir quem ficou admin depois de rodar o UPDATE acima:
-- select email, raw_app_meta_data ->> 'role' as role from auth.users where raw_app_meta_data ->> 'role' = 'ADMIN';


-- ─────────────────────────────────────────────────────────────────────────
-- 4) (Opcional, recomendado) Revoga sessões ativas para forçar todo mundo a
--    logar de novo e pegar um JWT novo já sem o role antigo/forjado.
--    Descomente e rode se quiser ser mais cauteloso.
-- ─────────────────────────────────────────────────────────────────────────
-- delete from auth.sessions;
