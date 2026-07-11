-- =============================================================================
-- AIRNEXT — SQL do Painel Administrativo (ERP interno)
-- =============================================================================
-- Este script é 100% ADITIVO: ele NÃO remove nem altera o comportamento de
-- nenhuma tabela, coluna, policy ou dado já existente no seu Supabase real
-- (products, profiles, visits, feedbacks, deletion_requests continuam
-- funcionando exatamente como hoje para o app do cliente final).
--
-- Ele apenas:
--   1) Adiciona colunas novas em `products` (todas opcionais/nullable ou com
--      DEFAULT, então linhas existentes continuam válidas);
--   2) Cria tabelas novas exigidas pelo painel admin premium (lotes,
--      programação NFC, renovações, logs de auditoria, notificações
--      administrativas e dados de CRM/cobrança do cliente);
--   3) Cria a função is_admin() e políticas de RLS adicionais (com nomes
--      próprios, para nunca colidir com policies que você já tenha);
--   4) Cria índices e um trigger de updated_at.
--
-- Como aplicar: Supabase Dashboard → SQL Editor → cole este arquivo inteiro →
-- Run. Pode ser executado mais de uma vez sem erro (idempotente).
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────
-- 0) EXTENSÕES NECESSÁRIAS
-- ─────────────────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";      -- gen_random_uuid()


-- ─────────────────────────────────────────────────────────────────────────
-- 1) FUNÇÃO is_admin()
-- ─────────────────────────────────────────────────────────────────────────
-- Lê o papel do usuário logado a partir do JWT do Supabase Auth. O app grava
-- o papel em auth.users.raw_user_meta_data.role = 'ADMIN' (ver
-- AuthContext.tsx: session.user.user_metadata?.role === 'ADMIN'), que é
-- exposto no JWT como user_metadata.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN',
    false
  );
$$;

comment on function public.is_admin() is
  'Retorna true quando o usuário autenticado tem user_metadata.role = ADMIN. Usada nas policies de RLS do painel administrativo.';


-- ─────────────────────────────────────────────────────────────────────────
-- 2) TABELA lots — Lotes de produção/importação de produtos
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.lots (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique,
  description        text,
  quantity           integer not null check (quantity > 0),
  used_quantity      integer not null default 0,
  available_quantity integer not null,
  supplier           text,
  notes              text,
  created_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now()
);

comment on table public.lots is 'Lotes de produtos AirNext (cartões/pulseiras/tags) gerados em lote pelo admin.';

alter table public.lots enable row level security;

drop policy if exists "admin_full_access_lots" on public.lots;
create policy "admin_full_access_lots" on public.lots
  for all using (public.is_admin()) with check (public.is_admin());

-- IMPORTANTE: RLS sozinha não libera acesso — o Postgres também exige um
-- GRANT explícito para o papel `authenticated` antes mesmo de avaliar as
-- policies. Tabelas criadas pelo Table Editor do Supabase ganham esse GRANT
-- automaticamente; tabelas criadas via SQL Editor (como esta) não. Sem esta
-- linha, toda consulta a esta tabela retorna 403, mesmo para o admin.
grant select, insert, update, delete on public.lots to authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- 3) COLUNAS NOVAS EM products (todas aditivas / nullable / com DEFAULT)
-- ─────────────────────────────────────────────────────────────────────────
-- nfc_uuid     → valor único gravado fisicamente no chip NFC (rota /n/:uuid,
--                já usada por NfcRedirect.tsx). Se a coluna já existir no seu
--                banco (usada por NfcRedirect), o IF NOT EXISTS evita erro.
-- internal_code→ código interno de estoque (ex.: AIR-XXXX), só para o admin.
-- lot_id       → FK para o lote de origem (produção em massa).
-- programmed_at/programmed_by/chip_serial_number → auditoria da gravação
--                física do chip (Web NFC), preenchidos só após a gravação
--                ser ESCRITA e VALIDADA por releitura (ver NFCProgrammerView).
alter table public.products
  add column if not exists nfc_uuid            uuid unique default gen_random_uuid(),
  add column if not exists internal_code       text unique,
  add column if not exists lot_id              uuid references public.lots(id) on delete set null,
  add column if not exists programmed_at       timestamptz,
  add column if not exists programmed_by       uuid references auth.users(id) on delete set null,
  add column if not exists programmed_by_name  text,
  add column if not exists chip_serial_number  text,
  add column if not exists updated_at          timestamptz;

-- Garante que todo produto já existente tenha um nfc_uuid (a coluna acima já
-- usa DEFAULT gen_random_uuid() para novos produtos; isto preenche os
-- antigos que ficaram com valor nulo antes do DEFAULT existir).
update public.products set nfc_uuid = gen_random_uuid() where nfc_uuid is null;

-- ── Status estendido ────────────────────────────────────────────────────
-- O fluxo real hoje usa status em ('DISPONIVEL','ATIVO','EXPIRADO','BLOQUEADO').
-- Para que "enquanto não gravar o chip corretamente não é possível
-- continuar" seja uma regra de fato (e não só de tela), introduzimos um
-- novo status inicial NAO_PROGRAMADO: todo produto criado em lote nasce
-- assim, e só passa a DISPONIVEL depois que o Programador NFC grava E
-- confirma a gravação por releitura do chip (ver useAdminData.ts).
-- CANCELADO é um estado terminal novo (produto anulado pelo admin).
do $$
begin
  if exists (
    select 1 from information_schema.check_constraints
    where constraint_name = 'products_status_check'
  ) then
    alter table public.products drop constraint products_status_check;
  end if;
exception when others then
  null; -- nome de constraint pode ser outro no seu banco; não é bloqueante
end $$;

alter table public.products
  add constraint products_status_check
  check (status in ('NAO_PROGRAMADO','DISPONIVEL','ATIVO','EXPIRADO','BLOQUEADO','CANCELADO'));

alter table public.products
  alter column status set default 'NAO_PROGRAMADO';

create index if not exists idx_products_lot_id on public.products(lot_id);
create index if not exists idx_products_nfc_uuid on public.products(nfc_uuid);
create index if not exists idx_products_status on public.products(status);


-- ─────────────────────────────────────────────────────────────────────────
-- 4) TABELA nfc_programming_records — auditoria de cada gravação de chip
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.nfc_programming_records (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references public.products(id) on delete cascade,
  nfc_uuid            text not null,
  programmed_at       timestamptz not null default now(),
  programmed_by       uuid references auth.users(id) on delete set null,
  programmed_by_name  text,
  status              text not null check (status in ('Sucesso','Falha')),
  lot_id              uuid references public.lots(id) on delete set null,
  chip_serial_number  text,
  verified            boolean not null default false
);

comment on table public.nfc_programming_records is
  'Histórico de toda tentativa de gravação NFC (sucesso, falha, e se a releitura de confirmação validou a gravação).';

create index if not exists idx_nfc_records_product_id on public.nfc_programming_records(product_id);

alter table public.nfc_programming_records enable row level security;

drop policy if exists "admin_full_access_nfc_records" on public.nfc_programming_records;
create policy "admin_full_access_nfc_records" on public.nfc_programming_records
  for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.nfc_programming_records to authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- 5) TABELA renewals — renovações de validade
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.renewals (
  id                   uuid primary key default gen_random_uuid(),
  product_id           uuid not null references public.products(id) on delete cascade,
  user_id              uuid references auth.users(id) on delete set null,
  renewed_at           timestamptz not null default now(),
  previous_expires_at  timestamptz,
  new_expires_at       timestamptz not null,
  period_years         integer not null default 1 check (period_years > 0),
  amount               numeric(10,2) not null default 0,
  renewed_by           uuid references auth.users(id) on delete set null,
  renewed_by_name      text
);

comment on table public.renewals is 'Histórico de renovações de validade aplicadas pelo admin a um produto ativado.';

create index if not exists idx_renewals_product_id on public.renewals(product_id);
create index if not exists idx_renewals_user_id on public.renewals(user_id);

alter table public.renewals enable row level security;

drop policy if exists "admin_full_access_renewals" on public.renewals;
create policy "admin_full_access_renewals" on public.renewals
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "user_read_own_renewals" on public.renewals;
create policy "user_read_own_renewals" on public.renewals
  for select using (auth.uid() = user_id);

grant select, insert, update, delete on public.renewals to authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- 6) TABELA admin_logs — trilha de auditoria de ações do admin
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.admin_logs (
  id                uuid primary key default gen_random_uuid(),
  action            text not null,
  entity_type       text not null,
  entity_id         text,
  performed_by      uuid references auth.users(id) on delete set null,
  performed_by_name text,
  performed_at      timestamptz not null default now(),
  details           text
);

comment on table public.admin_logs is 'Log de auditoria de todas as ações administrativas (criação de lote, gravação NFC, bloqueio, renovação etc).';

create index if not exists idx_admin_logs_performed_at on public.admin_logs(performed_at desc);
create index if not exists idx_admin_logs_entity on public.admin_logs(entity_type, entity_id);

alter table public.admin_logs enable row level security;

drop policy if exists "admin_full_access_logs" on public.admin_logs;
create policy "admin_full_access_logs" on public.admin_logs
  for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.admin_logs to authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- 7) TABELA admin_notifications — notificações disparadas pelo admin
-- ─────────────────────────────────────────────────────────────────────────
-- Distinta das notificações "de uso" (visita/login), que já são derivadas em
-- tempo real de `visits` no próprio AuthContext.tsx e não precisam de tabela.
-- Esta tabela é para comunicação ATIVA do admin com o cliente (aviso de
-- vencimento, mensagem de suporte etc).
create table if not exists public.admin_notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  product_id   uuid references public.products(id) on delete cascade,
  title        text not null,
  message      text not null,
  channel      text not null check (channel in ('Email','WhatsApp','Painel','Push')),
  sent_at      timestamptz not null default now(),
  opened_at    timestamptz,
  resolved_at  timestamptz,
  status       text not null default 'Enviado' check (status in ('Enviado','Aberto','Ignorado','Resolvido','Falhou')),
  trigger      text
);

comment on table public.admin_notifications is 'Notificações enviadas manualmente (ou por gatilho) pelo admin a um cliente específico.';

create index if not exists idx_admin_notifications_user_id on public.admin_notifications(user_id);
create index if not exists idx_admin_notifications_sent_at on public.admin_notifications(sent_at desc);

alter table public.admin_notifications enable row level security;

drop policy if exists "admin_full_access_notifications" on public.admin_notifications;
create policy "admin_full_access_notifications" on public.admin_notifications
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "user_read_own_notifications" on public.admin_notifications;
create policy "user_read_own_notifications" on public.admin_notifications
  for select using (auth.uid() = user_id);

grant select, insert, update, delete on public.admin_notifications to authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- 8) TABELA customer_profiles — dados de CRM/cobrança por conta de cliente
-- ─────────────────────────────────────────────────────────────────────────
-- A tabela `profiles` já existente no seu app é por PRODUTO/cartão público
-- (nome exibido, bio, slug etc). Esta aqui é por CONTA (1 linha por usuário)
-- e guarda dados administrativos/comerciais que o painel admin precisa
-- (empresa, telefone, documento, endereço, plano, valor do plano, status
-- comercial e observações internas).
create table if not exists public.customer_profiles (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  company         text default '',
  phone           text default '',
  document        text default '',
  address         jsonb default '{}'::jsonb,
  plan            text not null default 'Starter' check (plan in ('Starter','Pro','Business','Enterprise')),
  plan_value      numeric(10,2) not null default 0,
  status          text not null default 'Ativo' check (status in ('Ativo','Bloqueado','Suspenso','Inativo')),
  internal_notes  text default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.customer_profiles is
  'Extensão administrativa/CRM por conta de usuário: plano, empresa, endereço, status comercial e observações internas usadas pelo painel admin.';

comment on column public.customer_profiles.status is
  'Status COMERCIAL controlado pelo admin (Ativo/Bloqueado/Suspenso/Inativo). Isto NÃO impede login sozinho — para bloquear login de fato é necessário chamar a Admin API do Supabase (service_role) a partir de uma Edge Function, pois o client anon key não tem permissão para banir usuários do Auth. Ver comentário no final deste arquivo.';

alter table public.customer_profiles enable row level security;

drop policy if exists "admin_full_access_customer_profiles" on public.customer_profiles;
create policy "admin_full_access_customer_profiles" on public.customer_profiles
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "user_read_own_customer_profile" on public.customer_profiles;
create policy "user_read_own_customer_profile" on public.customer_profiles
  for select using (auth.uid() = user_id);

drop policy if exists "user_update_own_customer_profile" on public.customer_profiles;
create policy "user_update_own_customer_profile" on public.customer_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.customer_profiles to authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- 9) TRIGGER genérico de updated_at (products e customer_profiles)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_customer_profiles_updated_at on public.customer_profiles;
create trigger trg_customer_profiles_updated_at
  before update on public.customer_profiles
  for each row execute function public.set_updated_at();


-- ─────────────────────────────────────────────────────────────────────────
-- 10) POLICIES ADMIN ADICIONAIS nas tabelas JÁ EXISTENTES do app real
-- ─────────────────────────────────────────────────────────────────────────
-- Aditivas: dão acesso total ao admin, SEM remover nenhuma policy que você
-- já tenha para o usuário comum (dono do produto, perfil público etc).
alter table public.products enable row level security;
drop policy if exists "admin_full_access_products" on public.products;
create policy "admin_full_access_products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.visits enable row level security;
drop policy if exists "admin_full_access_visits" on public.visits;
create policy "admin_full_access_visits" on public.visits
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.profiles enable row level security;
drop policy if exists "admin_full_access_profiles" on public.profiles;
create policy "admin_full_access_profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.feedbacks enable row level security;
drop policy if exists "admin_full_access_feedbacks" on public.feedbacks;
create policy "admin_full_access_feedbacks" on public.feedbacks
  for all using (public.is_admin()) with check (public.is_admin());

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='deletion_requests') then
    alter table public.deletion_requests enable row level security;
    drop policy if exists "admin_full_access_deletion_requests" on public.deletion_requests;
    create policy "admin_full_access_deletion_requests" on public.deletion_requests
      for all using (public.is_admin()) with check (public.is_admin());
    grant delete on public.deletion_requests to authenticated;
  end if;
end $$;

-- Estas tabelas já tinham SELECT/INSERT/UPDATE (usados pelo app do cliente
-- final), mas nunca precisaram de DELETE até o painel admin ganhar os
-- botões de "Excluir produto" / "Excluir cliente". Sem isto, apagar falha.
grant delete on public.products to authenticated;
grant delete on public.profiles to authenticated;
grant delete on public.visits to authenticated;
grant delete on public.feedbacks to authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- 11) VIEW auxiliar: contagem de produtos por cliente (usada no Dashboard)
-- ─────────────────────────────────────────────────────────────────────────
create or replace view public.customer_product_counts as
select user_id, count(*)::int as product_count,
       min(created_at) as first_product_at,
       max(activated_at) as last_activation_at
from public.products
where user_id is not null
group by user_id;

comment on view public.customer_product_counts is 'Quantidade de produtos por cliente — usada pelo painel admin para a listagem de Clientes.';

grant select on public.customer_product_counts to authenticated;
grant execute on function public.is_admin() to authenticated;


-- =============================================================================
-- FIM DO SCRIPT
-- =============================================================================
-- OBSERVAÇÃO IMPORTANTE SOBRE "BLOQUEAR CLIENTE" (login):
-- O botão "Bloquear cliente" do painel grava customer_profiles.status =
-- 'Bloqueado', o que o painel admin já respeita (mostra o cliente como
-- bloqueado, some da listagem "Ativos" etc). Porém isso, sozinho, NÃO
-- impede fisicamente o login do Supabase Auth — para isso é necessário usar
-- a Admin API (supabase.auth.admin.updateUserById(id, { ban_duration: '...' }))
-- que só pode ser chamada com a service_role key, nunca no client. Sugestão:
-- criar uma Supabase Edge Function `admin-block-user` que recebe o user_id,
-- verifica is_admin() e chama a Admin API com a service_role key guardada
-- como secret da function. Isso está fora do escopo deste script SQL (que
-- não tem acesso a secrets), mas o hook useAdminData.ts já está pronto para
-- chamar essa function quando ela existir (ver TODO no arquivo).
-- =============================================================================
