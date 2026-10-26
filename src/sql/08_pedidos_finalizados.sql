-- ============================================================================
-- 08_pedidos_finalizados.sql  —  rode UMA vez no SQL Editor do Supabase
-- (depois do 07_pedidos.sql).
--
-- Adiciona a data em que o pedido foi marcado como "Produto concluído"
-- (aba Finalizados do Admin → Pedidos) e reforça a regra de inserção.
-- ============================================================================
alter table public.orders add column if not exists finalized_at timestamptz;

create index if not exists orders_finalized_idx on public.orders (finalized_at desc);

-- O visitante nunca pode criar um pedido já "finalizado".
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
    and coalesce(char_length(customer_name), 0)  <= 200
    and coalesce(char_length(customer_phone), 0) <= 40
    and coalesce(char_length(notes), 0)          <= 4000
  );

notify pgrst, 'reload schema';
