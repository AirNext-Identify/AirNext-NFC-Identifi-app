-- =============================================================================
-- AIRNEXT — Delta: Configurações (URL de gravação) + limpeza de dados demo
-- =============================================================================
-- Rode isto DEPOIS de já ter aplicado supabase/admin_panel.sql e
-- supabase/fix_grants.sql pelo menos uma vez. Este script é aditivo e
-- idempotente (pode rodar de novo sem erro).
--
-- O que ele faz:
--   1) Cria a tabela app_settings, usada pela tela Configurações do painel
--      pra guardar a URL base que será gravada nos próximos chips NFC/QR
--      Codes (sem precisar mexer em código se o domínio mudar no futuro).
--   2) Limpa os dados falsos criados pela simulação antiga: quando o painel
--      era aberto num navegador sem suporte a Web NFC (qualquer desktop),
--      o código sorteava sucesso/falha e gravava isso no banco como se
--      fosse gravação real, com o serial fake "SIM-xxxxxxxx". Isso fazia
--      produtos aparecerem como "Disponível para ativação" sem terem sido
--      gravados de verdade. Este script:
--        a) volta esses produtos para "Não programado" (status real);
--        b) devolve a quantidade pro contador "Disponível" do lote;
--        c) apaga os registros de auditoria falsos (nfc_programming_records
--           com chip_serial_number SIM-...).
--
-- Como aplicar: Supabase Dashboard → SQL Editor → cole este arquivo inteiro
-- → Run.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────
-- 1) TABELA app_settings — configurações gerais do painel
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.app_settings (
  key         text primary key,
  value       text,
  updated_at  timestamptz not null default now()
);

comment on table public.app_settings is
  'Configurações gerais do painel administrativo (ex.: chave nfc_base_url = domínio gravado nos chips NFC / QR Codes).';

alter table public.app_settings enable row level security;

drop policy if exists "admin_full_access_app_settings" on public.app_settings;
create policy "admin_full_access_app_settings" on public.app_settings
  for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.app_settings to authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- 2) LIMPEZA — reverte produtos "gravados" pela simulação falsa e remove
--    os registros de auditoria correspondentes.
-- ─────────────────────────────────────────────────────────────────────────
with fake_records as (
  select id, product_id, lot_id
  from public.nfc_programming_records
  where chip_serial_number like 'SIM-%'
),
reverted_products as (
  update public.products p
  set status              = 'NAO_PROGRAMADO',
      programmed_at       = null,
      programmed_by       = null,
      programmed_by_name  = null,
      chip_serial_number  = null
  from fake_records fr
  where p.id = fr.product_id
    and p.chip_serial_number like 'SIM-%'
  returning p.id, fr.lot_id
),
lot_adjust as (
  select lot_id, count(*) as n
  from reverted_products
  where lot_id is not null
  group by lot_id
)
update public.lots l
set used_quantity      = greatest(0, l.used_quantity - la.n),
    available_quantity = l.available_quantity + la.n
from lot_adjust la
where l.id = la.lot_id;

delete from public.nfc_programming_records where chip_serial_number like 'SIM-%';


-- ─────────────────────────────────────────────────────────────────────────
-- Conferência rápida (opcional) — rode isoladamente pra ver o resultado:
-- select status, count(*) from public.products group by status;
-- select count(*) from public.nfc_programming_records where chip_serial_number like 'SIM-%';
-- ─────────────────────────────────────────────────────────────────────────
