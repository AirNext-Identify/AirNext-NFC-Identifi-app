-- =====================================================================
-- 17 — Alerta de desempenho do Supabase ("Auth RLS Initialization Plan"):
--      a política "user_update_own_notifications" da tabela public.admin_notifications
--      chama auth.uid()/current_setting() direto, e o Postgres reavalia a função
--      LINHA A LINHA. Embrulhar em (select ...) faz avaliar uma única vez por consulta.
--
-- Esta política não está nos scripts do projeto (foi criada direto no banco), então este
-- script LÊ a definição atual, só embrulha as chamadas e reaplica — a regra de quem pode
-- atualizar o quê continua exatamente a mesma. Rode no SQL Editor do Supabase.
-- É seguro repetir: se já estiver embrulhada, não muda nada.
-- =====================================================================

-- (Opcional) veja a política ANTES e DEPOIS rodando esta consulta:
select policyname, cmd, roles, qual as using_expr, with_check
from pg_policies
where schemaname = 'public'
  and tablename  = 'admin_notifications'
  and policyname = 'user_update_own_notifications';

do $$
declare
  pol         record;
  new_using   text;
  new_check   text;
begin
  select * into pol
  from pg_policies
  where schemaname = 'public'
    and tablename  = 'admin_notifications'
    and policyname = 'user_update_own_notifications';

  if not found then
    raise notice 'Política user_update_own_notifications não encontrada em public.admin_notifications — nada a fazer.';
    return;
  end if;

  new_using := pol.qual;
  new_check := pol.with_check;

  -- Só reescreve o que ainda não está embrulhado em (select ...).
  if new_using is not null and new_using !~* 'select\s+(auth\.|current_setting)' then
    new_using := regexp_replace(new_using, 'auth\.(uid|jwt|role|email)\(\)', '(select auth.\1())', 'g');
    new_using := regexp_replace(new_using, 'current_setting\(([^)]*)\)', '(select current_setting(\1))', 'g');
  end if;
  if new_check is not null and new_check !~* 'select\s+(auth\.|current_setting)' then
    new_check := regexp_replace(new_check, 'auth\.(uid|jwt|role|email)\(\)', '(select auth.\1())', 'g');
    new_check := regexp_replace(new_check, 'current_setting\(([^)]*)\)', '(select current_setting(\1))', 'g');
  end if;

  if new_using is not distinct from pol.qual and new_check is not distinct from pol.with_check then
    raise notice 'A política já está otimizada (ou não chama auth.*/current_setting) — nada a alterar.';
    return;
  end if;

  execute format(
    'alter policy %I on public.admin_notifications %s %s',
    pol.policyname,
    case when new_using is not null then 'using (' || new_using || ')' else '' end,
    case when new_check is not null then 'with check (' || new_check || ')' else '' end
  );

  raise notice 'Política atualizada. USING: %  |  WITH CHECK: %', new_using, new_check;
end $$;
