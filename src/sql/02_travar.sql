-- ============================================================================
-- 02_travar.sql  —  RODAR SÓ DEPOIS de:
--   (1) ter rodado 01_funcoes_ativacao.sql, E
--   (2) ter publicado o front novo (que usa resolve_product/activate_product).
-- Se rodar antes do deploy, o fluxo de QR/NFC/ativação do site ATUAL quebra.
--
-- Para desfazer: 03_reverter.sql.
-- ============================================================================
begin;

-- 1) Ninguém (anônimo ou logado) lista produtos disponíveis pela API.
--    A leitura passa a ser só via resolve_product(), um produto por vez.
drop policy if exists "public read available products"        on public.products;
drop policy if exists "authenticated read available products" on public.products;

-- 2) Nenhum usuário logado pode mais "pegar" um produto DISPONIVEL por UPDATE
--    direto. A ativação passa a ser só via activate_product().
drop policy if exists "owner or activation update products" on public.products;

-- 3) O dono continua editando o próprio produto (perfil, tema, slug...), mas
--    NÃO pode mexer em campos de controle: status (desbloquear a si mesmo),
--    validade, código, chip, lote, dono. Só admin altera esses campos.
--    Roda ANTES de outros triggers (prefixo "aaa_") para comparar o que o
--    cliente realmente enviou. Chamadas internas (activate_product, SQL
--    Editor, service_role) passam direto.
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
  then
    raise exception 'Campos de controle do produto só podem ser alterados pelo administrador.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists aaa_protect_product_columns on public.products;
create trigger aaa_protect_product_columns
  before update on public.products
  for each row execute function private.protect_product_columns();

-- 4) Qualquer usuário logado podia gravar/apagar imagens do site. Fica só a
--    policy de admin (site_images_admin_write).
drop policy if exists "site_images authenticated write" on public.site_images;

commit;
