-- ─────────────────────────────────────────────────────────────────────────
-- fix_v3_painel_admin.sql
-- Rode este arquivo no SQL Editor do Supabase DEPOIS de já ter aplicado
-- admin_panel.sql, fix_admin_privesc.sql, fix_grants.sql e
-- delta_settings_and_cleanup.sql (se ainda não tiver aplicado algum deles,
-- aplique primeiro — este arquivo assume que as tabelas já existem).
--
-- O que este arquivo resolve:
--   1) Permite que o CLIENTE marque como "aberta" (opened_at/status) uma
--      notificação enviada a ele pelo admin — hoje só existia policy de
--      leitura (SELECT), então o front não conseguia gravar isso de volta.
--   2) Corrige produtos com validade vencida que ainda estão com
--      status='ATIVO' no banco (o painel admin sempre calculou "Expirado"
--      só visualmente, sem nunca gravar isso na tabela products — por isso
--      um chip vencido continuava sendo acessível publicamente).
--   3) Cria um job agendado (pg_cron) para repetir essa correção
--      automaticamente todo dia, sem precisar rodar SQL manual toda vez que
--      um produto vencer.
-- ─────────────────────────────────────────────────────────────────────────

-- 1) Cliente pode marcar como aberta a própria notificação recebida ────────
drop policy if exists "user_update_own_notifications" on public.admin_notifications;
create policy "user_update_own_notifications" on public.admin_notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2) Corrige agora, de uma vez, os produtos já vencidos que ainda constam
--    como 'ATIVO' no banco (efeito imediato para quem já rodou o app antes
--    desta correção).
update public.products
set status = 'EXPIRADO'
where status = 'ATIVO'
  and expires_at is not null
  and expires_at < now();

-- 3) Agenda a mesma correção para rodar sozinha todos os dias às 03:00.
--    Protegido com DO block porque pg_cron pode não estar habilitado em
--    todos os planos/projetos Supabase — se não estiver, este bloco só
--    avisa no log e segue sem quebrar o restante do script. O app também
--    já reforça essa mesma checagem em tempo real (NfcRedirect.tsx e
--    publicApi.ts), então a validade é respeitada mesmo sem o cron.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'airnext_expire_products';
    perform cron.schedule(
      'airnext_expire_products',
      '0 3 * * *',
      $cron$
        update public.products
        set status = 'EXPIRADO'
        where status = 'ATIVO'
          and expires_at is not null
          and expires_at < now();
      $cron$
    );
  else
    raise notice 'pg_cron não está habilitado neste projeto — habilite a extensão pg_cron no Dashboard (Database > Extensions) se quiser a correção automática diária. A validade continua sendo respeitada em tempo real pelo app mesmo sem o cron.';
  end if;
exception when others then
  raise notice 'Não foi possível agendar o job pg_cron automaticamente (%). A validade continua sendo respeitada em tempo real pelo app.', sqlerrm;
end $$;
