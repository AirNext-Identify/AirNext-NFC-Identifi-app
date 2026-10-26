import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { beep } from '@/hooks/useOrders';

/** Linha da tabela `admin_alerts` (ver sql/15_alertas_ativacao.sql). */
export interface ActivationAlert {
  id: string;
  created_at: string;
  kind: string;
  product_id: string | null;
  product_code: string | null;
  product_line: string | null;
  product_type: string | null;
  lot_id: string | null;
  lot_code: string | null;
  user_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  seen: boolean;
}

/**
 * Avisos de "cliente ativou um produto", em tempo real, em QUALQUER módulo do
 * painel (o hook fica montado no AdminPanel). Um aviso por produto ativado.
 *
 * - Alertas criados com o painel fechado são carregados ao abrir (não vistos).
 * - Se o realtime cair, confere de minuto em minuto.
 * - Se o SQL 15 ainda não foi rodado, o hook só fica quieto (console.warn).
 */
export function useActivationAlerts(onNew?: (a: ActivationAlert) => void) {
  const [alerts, setAlerts] = useState<ActivationAlert[]>([]);
  const known = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const cb = useRef(onNew);
  cb.current = onNew;

  const announce = useCallback((a: ActivationAlert) => {
    beep();
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Produto ativado', {
          body: `${a.customer_name || 'Um cliente'} ativou ${a.product_code || 'um produto'}${a.lot_code ? ` · lote ${a.lot_code}` : ''}`,
          tag: a.id,
        });
      } catch { /* ignore */ }
    }
    cb.current?.(a);
  }, []);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('admin_alerts').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) { console.warn('Alertas de ativação indisponíveis (rode sql/15_alertas_ativacao.sql):', error.message); return; }
    const list = (data ?? []) as ActivationAlert[];
    // Em recargas (realtime indisponível), o que é novo e não visto também avisa.
    if (initialized.current) list.filter((a) => !known.current.has(a.id) && !a.seen).forEach(announce);
    list.forEach((a) => known.current.add(a.id));
    initialized.current = true;
    setAlerts(list);
  }, [announce]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('admin-activation-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_alerts' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const a = payload.new as ActivationAlert;
          if (known.current.has(a.id)) return;
          known.current.add(a.id);
          setAlerts((prev) => [a, ...prev]);
          announce(a);
        } else if (payload.eventType === 'UPDATE') {
          const a = payload.new as ActivationAlert;
          setAlerts((prev) => prev.map((x) => (x.id === a.id ? a : x)));
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as { id: string }).id;
          setAlerts((prev) => prev.filter((x) => x.id !== id));
        }
      })
      .subscribe();
    const poll = window.setInterval(load, 60000);
    return () => { window.clearInterval(poll); supabase.removeChannel(channel); };
  }, [load, announce]);

  const markSeen = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    setAlerts((prev) => prev.map((a) => (ids.includes(a.id) ? { ...a, seen: true } : a)));
    const { error } = await supabase.from('admin_alerts').update({ seen: true }).in('id', ids);
    if (error) { console.warn('Falha ao marcar alertas como vistos:', error.message); load(); }
  }, [load]);

  const unseen = alerts.filter((a) => !a.seen).length;
  return { alerts, unseen, markSeen, reload: load };
}
