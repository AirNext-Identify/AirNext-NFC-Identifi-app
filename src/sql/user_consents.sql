-- Consentimentos LGPD / documentos legais AirNext
-- Execute no SQL Editor do Supabase (recomendado).

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null,
  document_version text not null,
  accepted boolean not null default true,
  accepted_at timestamptz not null default now(),
  ip_hint text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists user_consents_user_idx on public.user_consents (user_id);
create index if not exists user_consents_type_idx on public.user_consents (user_id, document_type);

alter table public.user_consents enable row level security;

-- Permissões para o role authenticated (necessário além das policies)
grant select, insert on public.user_consents to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "users manage own consents" on public.user_consents;
drop policy if exists "users select own consents" on public.user_consents;
drop policy if exists "users insert own consents" on public.user_consents;

create policy "users select own consents" on public.user_consents
  for select
  using (auth.uid() = user_id);

create policy "users insert own consents" on public.user_consents
  for insert
  with check (auth.uid() = user_id);
