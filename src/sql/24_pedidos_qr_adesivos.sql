-- ============================================================================
-- 24_pedidos_qr_adesivos.sql  —  rode UMA vez no SQL Editor do Supabase
-- (depois do 07, do 21 e do 22).
--
-- Guarda quais QR Codes (adesivos) foram separados para cada pedido, na página
-- Admin → Expedição & Adesivos.
--  • Um QR só pode pertencer a UM pedido (product_id único).
--  • Se o pedido for apagado, os vínculos somem junto (os produtos ficam livres).
--  • Só o admin lê e escreve.
-- ============================================================================
create table if not exists public.order_qr_codes (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid not null unique,
  created_at  timestamptz not null default now()
);

create index if not exists order_qr_codes_order_idx on public.order_qr_codes (order_id);

alter table public.order_qr_codes enable row level security;

drop policy if exists "order_qr_codes admin all" on public.order_qr_codes;
create policy "order_qr_codes admin all" on public.order_qr_codes
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.order_qr_codes to authenticated;

notify pgrst, 'reload schema';

-- PARA DESFAZER:
--   drop table if exists public.order_qr_codes;
