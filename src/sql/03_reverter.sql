-- ============================================================================
-- 03_reverter.sql  —  desfaz o 02_travar.sql (recria as policies como estavam).
-- Use só se algo quebrar e você precisar voltar rápido. Depois, me avise o erro.
-- ============================================================================
begin;

drop trigger if exists aaa_protect_product_columns on public.products;

create policy "public read available products" on public.products
  for select to public using (status = 'DISPONIVEL'::text);

create policy "authenticated read available products" on public.products
  for select to authenticated using (status = 'DISPONIVEL'::text);

create policy "owner or activation update products" on public.products
  for update to authenticated
  using ((auth.uid() = user_id) or (status = 'DISPONIVEL'::text))
  with check (auth.uid() = user_id);

create policy "site_images authenticated write" on public.site_images
  for all to authenticated using (true) with check (true);

commit;
