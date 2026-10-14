-- ============================================================================
-- 05_app_settings.sql  —  INDEPENDENTE: pode rodar a qualquer hora.
--
-- O painel (Admin → Configurações) grava a URL base dos chips/QRs na tabela
-- public.app_settings (chave 'nfc_base_url'), mas a tabela não existia no
-- banco — por isso o erro "Could not find the table 'public.app_settings'".
--
--  • Leitura: usuários logados (a ativação lê a URL base ao gravar o chip).
--  • Escrita: só admin (private.is_admin()).
--  • NÃO insere valor inicial: sem a linha, o sistema usa o fallback
--    (VITE_PUBLIC_APP_URL ou o domínio atual). Defina pelo painel só quando
--    o domínio novo já estiver no ar.
-- ============================================================================
create table if not exists public.app_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "app_settings authenticated read" on public.app_settings;
create policy "app_settings authenticated read" on public.app_settings
  for select to authenticated using (true);

drop policy if exists "app_settings admin write" on public.app_settings;
create policy "app_settings admin write" on public.app_settings
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- Faz a API (PostgREST) enxergar a tabela nova imediatamente.
notify pgrst, 'reload schema';
