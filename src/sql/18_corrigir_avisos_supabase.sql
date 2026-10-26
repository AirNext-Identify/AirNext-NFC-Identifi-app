-- =====================================================================
-- 18 — Corrige os avisos do Supabase Advisor (Security) que podem ser resolvidos
--      por SQL sem quebrar o site. Rode UMA vez no SQL Editor. É seguro repetir.
--
--  Resolve (6 avisos):
--    • function_search_path_mutable ×3  (orders_touch, site_feedbacks_touch,
--                                        is_valid_google_review_url)
--    • rls_policy_always_true          (site_images: qualquer usuário logado escrevia)
--    • public_bucket_allows_listing ×2 (profile-media e site-media)
--
--  Reforço (não muda o comportamento): tira de "anon/public" a permissão de executar
--  as funções que só fazem sentido logado (ativar, apagar usuário, analytics, redirect).
--
--  NÃO mexe (por desenho — ver explicação no final): resolve_product, activate_product,
--  admin_delete_user, google_scan_analytics, set_google_redirect e a senha vazada.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1) Funções com search_path mutável → fixa o search_path (todas as sobrecargas).
--    Só usam now()/operadores (pg_catalog), então nada muda no comportamento.
-- ---------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('orders_touch', 'site_feedbacks_touch', 'is_valid_google_review_url')
  loop
    execute format('alter function %s set search_path = public, pg_temp', r.sig);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 2) site_images: qualquer usuário LOGADO (inclusive cliente) podia gravar/apagar as
--    imagens da landing. Fica só a política de admin (a mesma ideia do 02_travar.sql).
-- ---------------------------------------------------------------------
do $$
begin
  -- garante que o admin continua escrevendo ANTES de remover a política aberta
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'site_images' and policyname = 'site_images_admin_write'
  ) then
    execute 'create policy "site_images_admin_write" on public.site_images
             for all to authenticated
             using ((select private.is_admin())) with check ((select private.is_admin()))';
  end if;
end $$;

drop policy if exists "site_images authenticated write" on public.site_images;

-- ---------------------------------------------------------------------
-- 3) Buckets públicos: a política "public read" ampla deixava qualquer pessoa LISTAR todos
--    os arquivos. Os links públicos das imagens (/object/public/...) NÃO dependem dela e
--    continuam funcionando. Em troca, quem envia arquivo (upload com upsert) ainda precisa
--    enxergar o que é dele, então entram políticas de leitura restritas:
--      • profile-media → cada usuário vê só a própria pasta (userId/...) e o admin vê tudo;
--      • site-media    → só o admin (é quem envia as imagens da landing).
-- ---------------------------------------------------------------------
drop policy if exists "profile-media public read" on storage.objects;
drop policy if exists "site-media public read"    on storage.objects;

drop policy if exists "profile-media owner or admin read" on storage.objects;
create policy "profile-media owner or admin read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'profile-media'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_admin())
    )
  );

drop policy if exists "site-media admin read" on storage.objects;
create policy "site-media admin read" on storage.objects
  for select to authenticated
  using (bucket_id = 'site-media' and (select private.is_admin()));

-- ---------------------------------------------------------------------
-- 4) Reforço de permissões: estas funções exigem login (e fazem a própria checagem de
--    admin/dono por dentro). Tira a execução de PUBLIC/anon e garante a de logado.
-- ---------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('activate_product', 'admin_delete_user', 'google_scan_analytics', 'set_google_redirect')
  loop
    execute format('revoke execute on function %s from public, anon', r.sig);
    execute format('grant  execute on function %s to authenticated', r.sig);
  end loop;
end $$;

commit;

notify pgrst, 'reload schema';

-- =====================================================================
-- O QUE FICA NO ADVISOR DE PROPÓSITO (não é falha):
--
--  • resolve_product (anon e authenticated): é o que a página pública de escaneamento
--    chama quando alguém aproxima o celular de uma tag/QR, sem login. Entrega um produto
--    por vez e nunca lista a tabela. Tirar isso quebraria o NFC/QR.
--  • activate_product, admin_delete_user, google_scan_analytics, set_google_redirect:
--    precisam ser chamáveis por usuário logado (o admin também é "authenticated"); cada uma
--    valida por dentro quem pode usar (dono do produto / private.is_admin()), com
--    search_path fixo. O aviso só diz "um logado consegue chamar", o que é o objetivo.
--  • Leaked Password Protection: não é SQL — painel do Supabase → Authentication →
--    Sign In / Providers → Email → "Prevent use of leaked passwords" (exige plano Pro).
-- =====================================================================
