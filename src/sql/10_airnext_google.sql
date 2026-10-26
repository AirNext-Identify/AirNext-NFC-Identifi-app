-- ============================================================================
-- 10_airnext_google.sql  —  AirNext Google (plaquinhas de avaliação do Google)
--
-- ORDEM DE APLICAÇÃO:  rode este arquivo ANTES de publicar o front novo.
-- Ele é aditivo: não remove nada e produtos existentes viram 'STANDARD'.
-- Pré-requisito: 01_funcoes_ativacao.sql (e, recomendado, 02_travar.sql).
--
-- REGRA PRINCIPAL
--   O tipo do produto é definido no BANCO, no momento em que o admin cria o
--   lote — nunca escolhido pelo cliente:
--       products.product_line = 'STANDARD'  → fluxo atual (perfil, categorias)
--       products.product_line = 'GOOGLE'    → só redireciona p/ avaliações
--   Um código GOOGLE nunca vira perfil Pet/Stand/etc., e vice-versa.
--
-- DESTINO DO QR
--   products.redirect_url guarda o link de avaliações. O banco só aceita
--   links do Google (is_valid_google_review_url + CHECK): sem isso, um
--   cliente poderia apontar a plaquinha para um site de golpe.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Colunas
-- ---------------------------------------------------------------------------
alter table public.lots
  add column if not exists product_line text not null default 'STANDARD';

alter table public.products
  add column if not exists product_line  text not null default 'STANDARD',
  add column if not exists redirect_url  text;

alter table public.lots     drop constraint if exists lots_product_line_check;
alter table public.products drop constraint if exists products_product_line_check;
alter table public.lots
  add constraint lots_product_line_check
  check (product_line in ('STANDARD', 'GOOGLE'));
alter table public.products
  add constraint products_product_line_check
  check (product_line in ('STANDARD', 'GOOGLE'));

create index if not exists products_product_line_idx on public.products (product_line);

-- ---------------------------------------------------------------------------
-- 2) Validador do link de avaliações (fonte única da verdade)
--    Aceita somente https e somente estes endereços do Google:
--      google.com / maps.google.com / search.google.com / business.google.com
--      (e .com.br), g.page, g.co, maps.app.goo.gl, goo.gl, share.google
--    Bloqueia: http, usuário@host, espaços, outros domínios (inclusive
--    sites.google.com, que hospeda conteúdo de terceiros) e os redirecionadores
--    do próprio Google (/url, /amp, /aclk, /pagead, /imgres).
-- ---------------------------------------------------------------------------
create or replace function public.is_valid_google_review_url(p_url text)
returns boolean
language sql
immutable
as $$
  select p_url is not null
     and length(p_url) between 12 and 2048
     and p_url !~ '[[:space:][:cntrl:]]'
     and p_url ~* '^https://((www\.|maps\.|search\.|business\.)?google\.com(\.br)?|g\.page|g\.co|maps\.app\.goo\.gl|goo\.gl|share\.google)(:443)?([/?#]|$)'
     and p_url !~* '^https://[^/?#]+/(url|amp|aclk|pagead|imgres)([/?#]|$)'
$$;

grant execute on function public.is_valid_google_review_url(text) to anon, authenticated;

-- Defesa em profundidade: mesmo o admin (ou um UPDATE direto) não consegue
-- gravar um destino que não seja do Google, nem em produto que não seja GOOGLE.
alter table public.products drop constraint if exists products_google_redirect_check;
alter table public.products
  add constraint products_google_redirect_check
  check (
    redirect_url is null
    or (product_line = 'GOOGLE' and public.is_valid_google_review_url(redirect_url))
  );

-- ---------------------------------------------------------------------------
-- 3) resolve_product — agora também informa a linha do produto e, só para
--    plaquinhas Google JÁ ATIVADAS, o destino do redirecionamento.
-- ---------------------------------------------------------------------------
create or replace function public.resolve_product(
  p_uuid text default null,
  p_code text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v      jsonb;
  v_uuid text := lower(btrim(coalesce(p_uuid, '')));
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
begin
  if length(v_uuid) between 8 and 64 then
    select jsonb_build_object(
             'code',         case when p.status = 'DISPONIVEL' then p.code end,
             'slug',         p.slug,
             'status',       p.status,
             'nfc_uuid',     p.nfc_uuid,
             'expires_at',   p.expires_at,
             'product_line', p.product_line,
             'redirect_url', case when p.product_line = 'GOOGLE' and p.status = 'ATIVO'
                                  then p.redirect_url end
           )
      into v
      from public.products p
     where p.nfc_uuid::text = v_uuid
     limit 1;
  elsif length(v_code) between 4 and 32 then
    select jsonb_build_object(
             'code',         case when p.status = 'DISPONIVEL' then p.code end,
             'slug',         p.slug,
             'status',       p.status,
             'nfc_uuid',     p.nfc_uuid,
             'expires_at',   p.expires_at,
             'product_line', p.product_line,
             'redirect_url', case when p.product_line = 'GOOGLE' and p.status = 'ATIVO'
                                  then p.redirect_url end
           )
      into v
      from public.products p
     where p.code = v_code
     limit 1;
  end if;

  return v;  -- null quando não encontrado
end;
$$;

revoke all on function public.resolve_product(text, text) from public;
grant execute on function public.resolve_product(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4) activate_product — o MESMO fluxo de ativação, agora ciente da linha.
--    • STANDARD: igual a antes (cliente escolhe categoria depois de ativar).
--    • GOOGLE:   exige o link de avaliações NA PRÓPRIA ativação, e ativa +
--                grava o destino num único comando (nunca fica ativa sem link).
--    Recebe só o código; o tipo vem do banco.
-- ---------------------------------------------------------------------------
drop function if exists public.activate_product(text);

create or replace function public.activate_product(
  p_code         text,
  p_redirect_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid    uuid := auth.uid();
  v_code   text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  v_url    text := nullif(btrim(coalesce(p_redirect_url, '')), '');
  v_line   text;
  v_status text;
  v_owner  uuid;
  v_prod   jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  if length(v_code) < 4 or length(v_code) > 32 then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  select p.product_line, p.status, p.user_id
    into v_line, v_status, v_owner
    from public.products p
   where p.code = v_code;

  if v_line is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_status <> 'DISPONIVEL' or v_owner is not null then
    if v_owner = v_uid then
      return jsonb_build_object('ok', false, 'reason', 'already_yours');
    end if;
    return jsonb_build_object('ok', false, 'reason', 'unavailable');
  end if;

  if v_line = 'GOOGLE' then
    if v_url is null then
      return jsonb_build_object('ok', false, 'reason', 'google_url_required', 'product_line', 'GOOGLE');
    end if;
    if not public.is_valid_google_review_url(v_url) then
      return jsonb_build_object('ok', false, 'reason', 'google_url_invalid', 'product_line', 'GOOGLE');
    end if;
  end if;

  update public.products p
     set user_id      = v_uid,
         status       = 'ATIVO',
         activated_at = now(),
         redirect_url = case when v_line = 'GOOGLE' then v_url else p.redirect_url end
   where p.code    = v_code
     and p.status  = 'DISPONIVEL'
     and p.user_id is null
  returning to_jsonb(p) into v_prod;

  if v_prod is null then
    -- Perdeu a corrida: outra pessoa ativou no mesmo instante.
    return jsonb_build_object('ok', false, 'reason', 'unavailable');
  end if;

  return jsonb_build_object('ok', true, 'product', v_prod);
end;
$$;

revoke all on function public.activate_product(text, text) from public, anon;
grant execute on function public.activate_product(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5) set_google_redirect — troca o destino SEM reimprimir a plaquinha.
--    O dono (só se a plaquinha estiver ATIVA) ou o admin. Sempre validado.
-- ---------------------------------------------------------------------------
create or replace function public.set_google_redirect(
  p_product_id uuid,
  p_url        text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid      uuid    := auth.uid();
  v_is_admin boolean := coalesce(private.is_admin(), false);
  v_url      text    := nullif(btrim(coalesce(p_url, '')), '');
  v_line     text;
  v_status   text;
  v_owner    uuid;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  select p.product_line, p.status, p.user_id
    into v_line, v_status, v_owner
    from public.products p
   where p.id = p_product_id;

  if v_line is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if v_line <> 'GOOGLE' then
    return jsonb_build_object('ok', false, 'reason', 'not_google');
  end if;
  if not v_is_admin and v_owner is distinct from v_uid then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  if v_owner is null then
    return jsonb_build_object('ok', false, 'reason', 'not_activated');
  end if;
  if not v_is_admin and v_status <> 'ATIVO' then
    return jsonb_build_object('ok', false, 'reason', 'inactive');
  end if;
  if v_url is null or not public.is_valid_google_review_url(v_url) then
    return jsonb_build_object('ok', false, 'reason', 'invalid_url');
  end if;

  update public.products set redirect_url = v_url where id = p_product_id;

  return jsonb_build_object('ok', true, 'redirect_url', v_url);
end;
$$;

revoke all on function public.set_google_redirect(uuid, text) from public, anon;
grant execute on function public.set_google_redirect(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6) Gatilho de proteção (criado em 02_travar.sql): agora o dono também NÃO
--    pode alterar product_line nem redirect_url por UPDATE direto — o destino
--    só muda por set_google_redirect (validado). Admin, as funções acima e o
--    SQL Editor continuam livres.
-- ---------------------------------------------------------------------------
create or replace function private.protect_product_columns()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if coalesce(private.is_admin(), false) then
    return new;
  end if;

  if   new.id            is distinct from old.id
    or new.code          is distinct from old.code
    or new.nfc_uuid      is distinct from old.nfc_uuid
    or new.internal_code is distinct from old.internal_code
    or new.user_id       is distinct from old.user_id
    or new.status        is distinct from old.status
    or new.lot_id        is distinct from old.lot_id
    or new.lote_name     is distinct from old.lote_name
    or new.product_type  is distinct from old.product_type
    or new.activated_at  is distinct from old.activated_at
    or new.expires_at    is distinct from old.expires_at
    or new.created_at    is distinct from old.created_at
    or new.product_line  is distinct from old.product_line
    or new.redirect_url  is distinct from old.redirect_url
  then
    raise exception 'Campos de controle do produto só podem ser alterados pelo administrador.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

notify pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- PARA DESFAZER (apenas se ainda não houver plaquinhas Google em uso):
--   alter table public.products drop constraint if exists products_google_redirect_check;
--   alter table public.products drop column if exists redirect_url;
--   alter table public.products drop column if exists product_line;
--   alter table public.lots     drop column if exists product_line;
--   drop function if exists public.set_google_redirect(uuid, text);
--   drop function if exists public.activate_product(text, text);
--   -- e rode de novo o 01_funcoes_ativacao.sql para restaurar a versão anterior.
-- ----------------------------------------------------------------------------
