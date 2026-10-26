import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderStatus } from '@/lib/orders';

/** Bipe curto (sem arquivo de áudio) para avisar um pedido novo. */
export function beep() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1175].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.16);
      g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + i * 0.16 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.16 + 0.15);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.16); o.stop(ctx.currentTime + i * 0.16 + 0.16);
    });
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch { /* navegador bloqueou o áudio: tudo bem */ }
}

/**
 * Pedidos do site em tempo real. Fica montado no AdminPanel, então o aviso de
 * "novo pedido" aparece em QUALQUER módulo do painel (não só na tela Pedidos).
 */
export function useOrders(onNewOrder?: (o: Order) => void) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const known = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const cb = useRef(onNewOrder);
  cb.current = onNewOrder;

  const announce = useCallback((o: Order) => {
    beep();
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`Novo pedido ${o.order_number}`, {
          body: `${o.customer_name || 'Cliente'} · R$ ${Number(o.subtotal).toFixed(2).replace('.', ',')}`,
          tag: o.id,
        });
      } catch { /* ignore */ }
    }
    cb.current?.(o);
  }, []);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('orders').select('*').order('created_at', { ascending: false }).limit(500);
    if (err) { setError(err.message); setLoading(false); return; }
    setError(null);
    const list = (data ?? []) as Order[];
    // Pedido que apareceu numa recarga (ex.: realtime indisponível) também avisa.
    if (initialized.current) list.filter(o => !known.current.has(o.id) && !o.seen).forEach(announce);
    list.forEach(o => known.current.add(o.id));
    initialized.current = true;
    setOrders(list);
    setLoading(false);
  }, [announce]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const o = payload.new as Order;
          if (known.current.has(o.id)) return;
          known.current.add(o.id);
          setOrders(prev => [o, ...prev]);
          announce(o);
        } else if (payload.eventType === 'UPDATE') {
          const o = payload.new as Order;
          setOrders(prev => prev.map(x => (x.id === o.id ? o : x)));
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as { id: string }).id;
          setOrders(prev => prev.filter(x => x.id !== id));
        }
      })
      .subscribe();
    // Rede de segurança: se o realtime cair, confere de minuto em minuto.
    const poll = window.setInterval(load, 60000);
    return () => { window.clearInterval(poll); supabase.removeChannel(channel); };
  }, [load, announce]);

  const patch = useCallback(async (id: string, fields: Partial<Pick<Order, 'status' | 'admin_notes' | 'seen' | 'finalized_at'>>) => {
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, ...fields } : o)));
    const { error: err } = await supabase.from('orders').update(fields).eq('id', id);
    if (err) { setError(err.message); load(); }
  }, [load]);

  const setStatus = (id: string, status: OrderStatus) => patch(id, { status, seen: true });
  const markSeen = (id: string) => patch(id, { seen: true });
  // "Produto concluído": venda fechada, vai para a fila de produção e para a aba Finalizados.
  const finalize = (id: string) => patch(id, { status: 'concluido', finalized_at: new Date().toISOString(), seen: true });
  const reopen = (id: string) => patch(id, { status: 'em_contato', finalized_at: null });
  const saveNotes = (id: string, admin_notes: string) => patch(id, { admin_notes });
  const remove = useCallback(async (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    const { error: err } = await supabase.from('orders').delete().eq('id', id);
    if (err) { setError(err.message); load(); }
  }, [load]);

  const unseen = orders.filter(o => !o.seen).length;
  return { orders, loading, error, unseen, setStatus, markSeen, finalize, reopen, saveNotes, remove, reload: load };
}
