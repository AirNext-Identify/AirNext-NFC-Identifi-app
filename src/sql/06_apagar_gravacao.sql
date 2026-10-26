-- 06_apagar_gravacao.sql
-- Permite que ADMIN apague registros de gravação NFC (botões "Apagar dados" e
-- "Limpar falhas" do Programador NFC). Rode no SQL Editor do Supabase.
-- Não liga/desliga RLS: só adiciona a permissão de DELETE para admin.

drop policy if exists "admin apaga registros de gravacao" on public.nfc_programming_records;
create policy "admin apaga registros de gravacao"
  on public.nfc_programming_records
  for delete
  to authenticated
  using (private.is_admin());
