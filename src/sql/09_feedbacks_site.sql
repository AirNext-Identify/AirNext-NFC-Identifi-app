-- ============================================================================
-- 09_feedbacks_site.sql  —  rode UMA vez no SQL Editor do Supabase.
--
-- Feedbacks do site para você gerenciar no Admin → Feedbacks:
--   • guarda nome, contato, estrelas, comentário e se o cliente AUTORIZOU publicar;
--   • você escolhe o que fica PUBLICADO na seção de feedbacks da landing page;
--   • a landing só enxerga os publicados e SÓ nome/cargo/estrelas/comentário/foto
--     (telefone, e-mail e anotações internas nunca saem do banco para o público);
--   • configurações da seção (título, mostrar/ocultar…) editáveis pelo painel.
-- ============================================================================
create table if not exists public.site_feedbacks (
  id              uuid primary key default gen_random_uuid(),
  name            text,
  role            text,                                   -- cargo / empresa (aparece no site)
  contact_phone   text,                                   -- PRIVADO
  contact_email   text,                                   -- PRIVADO
  rating          smallint not null check (rating between 1 and 5),
  comment         text,
  photo_url       text,
  source          text not null default 'site',           -- site | balão | manual …
  consent_publish boolean not null default false,         -- cliente autorizou publicar?
  status          text not null default 'pendente' check (status in ('pendente','publicado','oculto')),
  featured        boolean not null default false,         -- destaque (aparece primeiro)
  admin_notes     text,                                   -- PRIVADO
  seen            boolean not null default false,
  created_at      timestamptz not null default now(),
  published_at    timestamptz,
  updated_at      timestamptz not null default now()
);

create index if not exists site_feedbacks_status_idx  on public.site_feedbacks (status, created_at desc);

alter table public.site_feedbacks enable row level security;

grant usage on schema public to anon, authenticated;
grant insert on public.site_feedbacks to anon, authenticated;
grant select, update, delete on public.site_feedbacks to authenticated;

-- Visitante só ENVIA (sempre como 'pendente'); nunca lê a tabela.
drop policy if exists "site_feedbacks public insert" on public.site_feedbacks;
create policy "site_feedbacks public insert" on public.site_feedbacks
  for insert to anon, authenticated
  with check (
    status = 'pendente' and featured = false and seen = false
    and published_at is null and admin_notes is null and photo_url is null
    and rating between 1 and 5
    and coalesce(char_length(name), 0)          <= 120
    and coalesce(char_length(role), 0)          <= 120
    and coalesce(char_length(contact_phone), 0) <= 40
    and coalesce(char_length(contact_email), 0) <= 160
    and coalesce(char_length(comment), 0)       <= 1200
  );

drop policy if exists "site_feedbacks admin all" on public.site_feedbacks;
create policy "site_feedbacks admin all" on public.site_feedbacks
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create or replace function public.site_feedbacks_touch() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists site_feedbacks_touch on public.site_feedbacks;
create trigger site_feedbacks_touch before update on public.site_feedbacks
  for each row execute function public.site_feedbacks_touch();

-- Leitura pública dos depoimentos: só PUBLICADOS e só campos seguros.
-- É uma função (e não uma view) de propósito: uma view roda com as permissões do dono
-- (alerta "SECURITY DEFINER view" do Supabase) e uma view "security invoker" exigiria dar
-- SELECT da tabela para o visitante, o que deixaria telefone/e-mail legíveis. A função
-- devolve apenas as colunas abaixo, nunca contato nem anotações internas.
drop view if exists public.site_feedbacks_public;

create or replace function public.get_public_feedbacks(p_limit integer default 30)
returns table (
  id           uuid,
  name         text,
  role         text,
  rating       smallint,
  comment      text,
  photo_url    text,
  featured     boolean,
  published_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select f.id, f.name, f.role, f.rating, f.comment, f.photo_url, f.featured, f.published_at
  from public.site_feedbacks f
  where f.status = 'publicado'
  order by f.featured desc, f.published_at desc nulls last
  limit least(greatest(coalesce(p_limit, 30), 1), 100);
$$;

revoke all on function public.get_public_feedbacks(integer) from public;
grant execute on function public.get_public_feedbacks(integer) to anon, authenticated;

-- Configurações da seção da landing (linha única)
create table if not exists public.site_feedback_settings (
  id           int primary key default 1 check (id = 1),
  show_section boolean not null default true,
  show_summary boolean not null default true,   -- mostra "média · N avaliações" (calculado dos publicados)
  eyebrow      text,
  title        text,
  subtitle     text,
  updated_at   timestamptz not null default now()
);
insert into public.site_feedback_settings (id) values (1) on conflict (id) do nothing;

alter table public.site_feedback_settings enable row level security;
grant select on public.site_feedback_settings to anon, authenticated;
grant insert, update on public.site_feedback_settings to authenticated;

drop policy if exists "site_feedback_settings read" on public.site_feedback_settings;
create policy "site_feedback_settings read" on public.site_feedback_settings
  for select to anon, authenticated using (true);

drop policy if exists "site_feedback_settings admin write" on public.site_feedback_settings;
create policy "site_feedback_settings admin write" on public.site_feedback_settings
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- Realtime (aviso de feedback novo no painel)
do $$
begin
  alter publication supabase_realtime add table public.site_feedbacks;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
