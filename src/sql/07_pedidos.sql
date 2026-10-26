-- ============================================================================
-- 07_pedidos.sql  —  INDEPENDENTE: rode uma vez no SQL Editor do Supabase.
--
-- Guarda cada pedido feito no site (sacola e personalizador) para você rastrear
-- no Admin → Pedidos, com aviso em tempo real quando chega um novo.
--
--  • Qualquer visitante pode CRIAR um pedido (sempre com status 'novo').
--  • Só o admin (private.is_admin()) pode LER, atualizar status/anotações e apagar.
--  • Realtime ligado: o painel recebe o pedido no instante em que ele é enviado.
-- ============================================================================
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  order_number   text not null,
  source         text not null default 'sacola',          -- 'sacola' | 'personalizador'
  items          jsonb not null default '[]'::jsonb,       -- [{name, format, qty, price}]
  subtotal       numeric(12,2) not null default 0,
  customer_name  text,
  customer_phone text,
  notes          text,                                     -- observação do cliente / resumo do projeto
  status         text not null default 'novo',
  admin_notes    text,                                     -- anotações internas (rastreio, código dos Correios…)
  seen           boolean not null default false,           -- false = ainda não aberto pelo admin
  finalized_at   timestamptz,                              -- quando virou "Produto concluído"
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx  on public.orders (status);

alter table public.orders enable row level security;

-- Permissões de tabela (GRANT). Sem isto o painel mostra "permission denied for table orders",
-- mesmo com as policies certas. O RLS abaixo continua decidindo QUEM pode o quê:
--   visitante: só inserir | admin: tudo.
grant usage on schema public to anon, authenticated;
grant insert on public.orders to anon, authenticated;
grant select, update, delete on public.orders to authenticated;

drop policy if exists "orders public insert" on public.orders;
create policy "orders public insert" on public.orders
  for insert to anon, authenticated
  with check (
    status = 'novo'
    and seen = false
    and admin_notes is null
    and jsonb_typeof(items) = 'array'
    and char_length(order_number) <= 40
    and coalesce(char_length(customer_name), 0)  <= 200
    and coalesce(char_length(customer_phone), 0) <= 40
    and coalesce(char_length(notes), 0)          <= 4000
  );

drop policy if exists "orders admin all" on public.orders;
create policy "orders admin all" on public.orders
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create or replace function public.orders_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.orders_touch();

-- Realtime (aviso instantâneo no painel)
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
