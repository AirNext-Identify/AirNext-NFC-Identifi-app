-- ============================================================================
-- site_images.sql
-- ----------------------------------------------------------------------------
-- Rode este script no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- Ele cria a tabela que guarda as trocas feitas no Admin de Mídia
-- ("slot_id -> url"), pra parar de depender do localStorage do navegador.
-- ============================================================================

create table if not exists public.site_images (
  id text primary key,          -- id do slot, ex: "shop-pro", "video-demo"
  url text not null,             -- link da imagem/vídeo (pode ser do Supabase
                                  -- Storage ou uma URL externa colada no admin)
  updated_at timestamptz not null default now()
);

alter table public.site_images enable row level security;

-- Qualquer visitante do site pode LER as imagens (necessário: a LandingPage
-- é pública e precisa carregar as trocas feitas no admin).
drop policy if exists "site_images_public_read" on public.site_images;
create policy "site_images_public_read"
  on public.site_images for select
  to anon, authenticated
  using (true);

-- ATENÇÃO — leia antes de rodar:
-- O Admin de Mídia (/admin/imagens) hoje só tem uma senha simples no
-- front-end (não é login real do Supabase). Por isso, pra ele conseguir
-- salvar, a política abaixo libera INSERT/UPDATE/DELETE pra chave "anon"
-- (a mesma chave pública que já vai no seu app).
--
-- Isso quer dizer que, tecnicamente, qualquer pessoa que souber a URL e a
-- anon key do seu projeto (que já ficam expostas no código do site) poderia
-- alterar essas linhas via API, mesmo sem saber a senha do admin. Na prática
-- o risco é baixo (não expõe dados de clientes, só as imagens do site), mas
-- se quiser travar de verdade, o caminho é exigir login (Supabase Auth) no
-- admin e trocar "anon" por "authenticated" nas políticas abaixo.
drop policy if exists "site_images_public_write" on public.site_images;
create policy "site_images_public_write"
  on public.site_images for all
  to anon, authenticated
  using (true)
  with check (true);

-- ----------------------------------------------------------------------------
-- Storage: bucket público para os arquivos enviados do computador no admin
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

drop policy if exists "site_media_public_read" on storage.objects;
create policy "site_media_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'site-media');

-- Mesma observação de segurança do write acima: libera upload/troca/remoção
-- pra chave anon, já que o admin não usa login real do Supabase.
drop policy if exists "site_media_public_write" on storage.objects;
create policy "site_media_public_write"
  on storage.objects for all
  to anon, authenticated
  using (bucket_id = 'site-media')
  with check (bucket_id = 'site-media');
