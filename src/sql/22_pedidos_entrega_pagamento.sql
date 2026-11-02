-- ============================================================================
-- 22_pedidos_entrega_pagamento.sql  —  rode UMA vez no SQL Editor do Supabase
-- (depois do 07, 08 e 21).
--
-- Guarda no pedido: e-mail, quem vai RECEBER, forma de pagamento (Pix/cartão)
-- e o endereço de entrega. Sem rodar isto o site continua funcionando: os dados
-- vão dentro das "observações" do pedido (fallback), mas ficam menos organizados.
-- ============================================================================
alter table public.orders add column if not exists customer_email   text;
alter table public.orders add column if not exists recipient_name   text;
alter table public.orders add column if not exists recipient_phone  text;
alter table public.orders add column if not exists payment_method   text;
alter table public.orders add column if not exists shipping_address jsonb;

alter table public.orders drop constraint if exists orders_payment_method_chk;
alter table public.orders add constraint orders_payment_method_chk
  check (payment_method is null or payment_method in ('pix', 'cartao'));

drop policy if exists "orders public insert" on public.orders;
create policy "orders public insert" on public.orders
  for insert to anon, authenticated
  with check (
    status = 'novo'
    and seen = false
    and finalized_at is null
    and admin_notes is null
    and jsonb_typeof(items) = 'array'
    and char_length(order_number) <= 40
    and coalesce(char_length(customer_name), 0)   <= 200
    and coalesce(char_length(customer_phone), 0)  <= 40
    and coalesce(char_length(customer_email), 0)  <= 200
    and coalesce(char_length(recipient_name), 0)  <= 200
    and coalesce(char_length(recipient_phone), 0) <= 40
    and coalesce(char_length(notes), 0)           <= 4000
    and (shipping_address is null or jsonb_typeof(shipping_address) = 'object')
  );

notify pgrst, 'reload schema';
