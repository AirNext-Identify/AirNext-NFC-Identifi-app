-- ============================================================================
-- FIX: "new row violates row-level security policy"
-- ao adicionar/trocar uma imagem no AirNext.
--
-- CAUSA: o Supabase Storage guarda cada arquivo enviado como uma linha na
-- tabela interna `storage.objects`, que tem Row Level Security (RLS) ativado
-- por padrão. Sem políticas de INSERT/UPDATE/SELECT nessa tabela para os
-- buckets do projeto, TODO upload é bloqueado — mesmo com o usuário logado.
--
-- COMO RODAR:
--   1. Abra o painel do Supabase do projeto AirNext
--   2. Vá em "SQL Editor" → "New query"
--   3. Cole todo este arquivo e clique em "Run"
--   4. Pode rodar quantas vezes quiser (todo comando é idempotente)
-- ============================================================================

-- 1) Garante que os buckets existem e são públicos para LEITURA
--    (as imagens precisam abrir para qualquer visitante do perfil,
--    mesmo sem estar logado).
insert into storage.buckets (id, name, public)
values ('profile-media', 'profile-media', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do update set public = true;

-- 2) Leitura pública dos dois buckets
drop policy if exists "profile-media public read" on storage.objects;
create policy "profile-media public read"
  on storage.objects for select
  using (bucket_id = 'profile-media');

drop policy if exists "site-media public read" on storage.objects;
create policy "site-media public read"
  on storage.objects for select
  using (bucket_id = 'site-media');

-- 3) profile-media (fotos/capa/galeria de cada usuário)
--    O código (lib/storage.ts) sempre sobe o arquivo dentro de uma pasta
--    com o próprio ID do usuário: `${userId}/imagem-123.jpg`. As políticas
--    abaixo exigem que essa primeira pasta bata com o usuário autenticado
--    (auth.uid()), então cada pessoa só mexe nos próprios arquivos.
drop policy if exists "profile-media insert own folder" on storage.objects;
create policy "profile-media insert own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "profile-media update own folder" on storage.objects;
create policy "profile-media update own folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "profile-media delete own folder" on storage.objects;
create policy "profile-media delete own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4) site-media (Admin de Mídia — troca de imagens/vídeos do site
--    institucional). Não é dividido por pasta de usuário: qualquer
--    conta autenticada com acesso ao painel pode enviar/trocar.
drop policy if exists "site-media insert authenticated" on storage.objects;
create policy "site-media insert authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-media');

drop policy if exists "site-media update authenticated" on storage.objects;
create policy "site-media update authenticated"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site-media')
  with check (bucket_id = 'site-media');

drop policy if exists "site-media delete authenticated" on storage.objects;
create policy "site-media delete authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-media');

-- 5) (Opcional, só se a tabela `site_images` também estiver dando o mesmo
--    erro ao salvar o registro do slot — não apenas o arquivo em si)
alter table if exists public.site_images enable row level security;

drop policy if exists "site_images public read" on public.site_images;
create policy "site_images public read"
  on public.site_images for select
  using (true);

drop policy if exists "site_images authenticated write" on public.site_images;
create policy "site_images authenticated write"
  on public.site_images for all
  to authenticated
  using (true)
  with check (true);
