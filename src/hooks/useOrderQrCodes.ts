import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface OrderQrLink {
  id: string;
  order_id: string;
  product_id: string;
  created_at: string;
}

const PAGE = 1000;
const CHUNK = 500;

/**
 * QR Codes (adesivos) separados para cada pedido. Se o SQL 24 ainda não foi
 * rodado, `error` vem preenchido e o painel avisa — nada quebra.
 */
export function useOrderQrCodes() {
  const [links, setLinks] = useState<OrderQrLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const all: OrderQrLink[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error: err } = await supabase
        .from('order_qr_codes').select('*').order('created_at', { ascending: false }).range(from, from + PAGE - 1);
      if (err) { setError(err.message); setLoading(false); return; }
      all.push(...((data ?? []) as OrderQrLink[]));
      if (!data || data.length < PAGE) break;
    }
    setError(null);
    setLinks(all);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /** Vincula QR Codes ao pedido. Devolve mensagem de erro (ou null se deu certo). */
  const link = useCallback(async (orderId: string, productIds: string[]): Promise<string | null> => {
    for (let i = 0; i < productIds.length; i += CHUNK) {
      const rows = productIds.slice(i, i + CHUNK).map(product_id => ({ order_id: orderId, product_id }));
      const { error: err } = await supabase.from('order_qr_codes').insert(rows);
      if (err) {
        await load();
        return /duplicate|unique/i.test(err.message) ? 'Algum QR já está vinculado a outro pedido.' : err.message;
      }
    }
    await load();
    return null;
  }, [load]);

  const unlink = useCallback(async (orderId: string, productIds: string[]): Promise<string | null> => {
    setLinks(prev => prev.filter(l => !(l.order_id === orderId && productIds.includes(l.product_id)))); // otimista
    for (let i = 0; i < productIds.length; i += CHUNK) {
      const { error: err } = await supabase.from('order_qr_codes').delete()
        .eq('order_id', orderId).in('product_id', productIds.slice(i, i + CHUNK));
      if (err) { await load(); return err.message; }
    }
    return null;
  }, [load]);

  return { links, loading, error, link, unlink, reload: load };
}
