-- ============================================================================
-- 26_get_public_feedbacks.sql  —  rode UMA vez no SQL Editor do Supabase.
--
-- Conserta o erro 404 em  /rest/v1/rpc/get_public_feedbacks  (aparece no console
-- da landing e tira pontos do Lighthouse). A função é a que a landing chama para
-- listar os feedbacks PUBLICADOS: só publicados, só campos seguros (nunca telefone,
-- e-mail nem anotações internas), destaques primeiro.
--
-- Pré-requisito: a tabela public.site_feedbacks já existir (script sql/16).
-- Pode rodar de novo sem problema.
-- ============================================================================
drop function if exists public.get_public_feedbacks(integer);

create or replace function public.get_public_feedbacks(p_limit integer default 30)
returns table (
  id            uuid,
  name          text,
  role          text,
  rating        integer,
  comment       text,
  photo_url     text,
  featured      boolean,
  published_at  timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select f.id, f.name, f.role, f.rating::integer, f.comment, f.photo_url, f.featured, f.published_at
    from public.site_feedbacks f
   where f.status = 'publicado'
   order by f.featured desc, f.published_at desc nulls last, f.created_at desc
   limit greatest(1, least(coalesce(p_limit, 30), 100));
$$;

revoke all on function public.get_public_feedbacks(integer) from public;
grant execute on function public.get_public_feedbacks(integer) to anon, authenticated;

-- Faz a API do Supabase enxergar a função na hora.
notify pgrst, 'reload schema';

-- PARA DESFAZER:
--   drop function if exists public.get_public_feedbacks(integer);
