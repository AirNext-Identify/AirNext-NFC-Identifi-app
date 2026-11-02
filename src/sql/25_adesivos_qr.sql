-- ============================================================================
-- 25_adesivos_qr.sql  —  rode UMA vez no SQL Editor do Supabase
-- (depois do 07 e do 21).
--
-- Guarda os QR Codes que você marcou como ADESIVO na página
-- Admin → Etiquetas & Gravação, e se cada um já foi BAIXADO.
-- Aparece na página Admin → Adesivos QR.
--  • product_id é a chave: um QR só entra uma vez na lista.
--  • downloaded_at vazio = ainda não baixado.
--  • Só o admin lê e escreve.
-- ============================================================================
create table if not exists public.qr_stickers (
  product_id      uuid primary key references public.products(id) on delete cascade,
  marked_at       timestamptz not null default now(),
  downloaded_at   timestamptz,
  download_count  integer not null default 0
);

create index if not exists qr_stickers_downloaded_idx on public.qr_stickers (downloaded_at);

alter table public.qr_stickers enable row level security;

drop policy if exists "qr_stickers admin all" on public.qr_stickers;
create policy "qr_stickers admin all" on public.qr_stickers
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.qr_stickers to authenticated;

notify pgrst, 'reload schema';

-- OPCIONAL — a tabela da antiga página "Expedição & Adesivos" não é mais usada.
-- Se quiser limpar:
--   drop table if exists public.order_qr_codes;
--
-- PARA DESFAZER ESTE SCRIPT:
--   drop table if exists public.qr_stickers;
