-- ============================================================================
-- 04_travar_storage.sql  —  INDEPENDENTE do 01/02: pode rodar a qualquer hora.
-- Não precisa de deploy do front: só o painel /painel-imagens (admin) envia
-- arquivos para o bucket "site-media", e ele continua funcionando pela policy
-- "site_media_admin_write" (admin).
--
-- Problema: as 3 policies abaixo deixam QUALQUER usuário logado enviar,
-- sobrescrever e apagar arquivos do bucket "site-media" (imagens e vídeos da
-- landing page, públicos para todos os visitantes).
-- ============================================================================
begin;

drop policy if exists "site-media insert authenticated" on storage.objects;
drop policy if exists "site-media update authenticated" on storage.objects;
drop policy if exists "site-media delete authenticated" on storage.objects;

commit;

-- ----------------------------------------------------------------------------
-- PARA DESFAZER (rode só se precisar voltar ao estado anterior):
--
-- create policy "site-media insert authenticated" on storage.objects
--   for insert to authenticated with check (bucket_id = 'site-media'::text);
-- create policy "site-media update authenticated" on storage.objects
--   for update to authenticated
--   using (bucket_id = 'site-media'::text) with check (bucket_id = 'site-media'::text);
-- create policy "site-media delete authenticated" on storage.objects
--   for delete to authenticated using (bucket_id = 'site-media'::text);
-- ----------------------------------------------------------------------------
