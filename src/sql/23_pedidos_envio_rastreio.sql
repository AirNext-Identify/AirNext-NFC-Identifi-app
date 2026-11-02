-- ============================================================================
-- 23_pedidos_envio_rastreio.sql  —  rode UMA vez no SQL Editor do Supabase
-- (depois do 22).
--
-- Dados de envio preenchidos pelo ADMIN depois de finalizar o pedido:
-- transportadora, código de rastreio, link, previsão e detalhes.
-- Quem pode editar: só o admin (a policy "orders admin all" já cobre).
-- ============================================================================
alter table public.orders add column if not exists carrier             text;
alter table public.orders add column if not exists tracking_code       text;
alter table public.orders add column if not exists tracking_url        text;
alter table public.orders add column if not exists estimated_delivery  text;
alter table public.orders add column if not exists shipping_note       text;
alter table public.orders add column if not exists shipped_at          timestamptz;

notify pgrst, 'reload schema';
