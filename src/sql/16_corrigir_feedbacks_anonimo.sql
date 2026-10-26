-- =====================================================================
-- 16 — Corrige duas coisas no site público (rode UMA vez no SQL Editor do Supabase;
--      é seguro repetir):
--
--  1) Erro 401 (Unauthorized) no console ao carregar depoimentos/configurações.
--  2) Alerta do Supabase: "A visualização public.site_feedbacks_public é definida com
--     a propriedade SECURITY DEFINER". A view é removida e substituída pela função
--     public.get_public_feedbacks(), que o site passa a usar.
--
-- Se acusar tabela inexistente, rode antes o 09_feedbacks_site.sql.
-- Não expõe contato nem anotações internas: só feedbacks PUBLICADOS e campos seguros.
-- =====================================================================

grant usage on schema public to anon, authenticated;

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

-- Configurações da seção (linha única): leitura pública, escrita só do admin.
alter table public.site_feedback_settings enable row level security;
grant select on public.site_feedback_settings to anon, authenticated;

drop policy if exists "site_feedback_settings read" on public.site_feedback_settings;
create policy "site_feedback_settings read" on public.site_feedback_settings
  for select to anon, authenticated using (true);

-- Envio de feedback pelo visitante continua só de INSERT.
grant insert on public.site_feedbacks to anon, authenticated;

-- Atualiza o cache de schema do PostgREST.
notify pgrst, 'reload schema';
