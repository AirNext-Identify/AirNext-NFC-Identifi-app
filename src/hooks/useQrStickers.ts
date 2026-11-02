import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface QrSticker {
  product_id: string;
  marked_at: string;
  downloaded_at: string | null;
  download_count: number;
}

const PAGE = 1000;
const CHUNK = 500;

/**
 * QR Codes marcados como adesivo (Etiquetas & Gravação) e se já foram baixados.
 * Se o SQL 25 ainda não foi rodado, `error` vem preenchido e o painel avisa.
 */
export function useQrStickers() {
  const [rows, setRows] = useState<QrSticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const all: QrSticker[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error: err } = await supabase
        .from('qr_stickers').select('*').order('marked_at', { ascending: false }).range(from, from + PAGE - 1);
      if (err) { setError(err.message); setLoading(false); return; }
      all.push(...((data ?? []) as QrSticker[]));
      if (!data || data.length < PAGE) break;
    }
    setError(null);
    setRows(all);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const byProduct = useMemo(() => new Map(rows.map(r => [r.product_id, r])), [rows]);

  /** Marca QR Codes como adesivo (os que já estão na lista são ignorados). */
  const mark = useCallback(async (productIds: string[]): Promise<string | null> => {
    const fresh = productIds.filter(id => !byProduct.has(id));
    for (let i = 0; i < fresh.length; i += CHUNK) {
      const part = fresh.slice(i, i + CHUNK).map(product_id => ({ product_id }));
      const { error: err } = await supabase.from('qr_stickers').upsert(part, { onConflict: 'product_id', ignoreDuplicates: true });
      if (err) { await load(); return err.message; }
    }
    await load();
    return null;
  }, [byProduct, load]);

  /** Tira da lista de adesivos. */
  const unmark = useCallback(async (productIds: string[]): Promise<string | null> => {
    setRows(prev => prev.filter(r => !productIds.includes(r.product_id))); // otimista
    for (let i = 0; i < productIds.length; i += CHUNK) {
      const { error: err } = await supabase.from('qr_stickers').delete().in('product_id', productIds.slice(i, i + CHUNK));
      if (err) { await load(); return err.message; }
    }
    return null;
  }, [load]);

  /** Registra o download (só vale para quem está na lista de adesivos). */
  const markDownloaded = useCallback(async (productIds: string[]): Promise<string | null> => {
    const ids = productIds.filter(id => byProduct.has(id));
    if (ids.length === 0) return null;
    const now = new Date().toISOString();
    setRows(prev => prev.map(r => (ids.includes(r.product_id)
      ? { ...r, downloaded_at: now, download_count: r.download_count + 1 } : r))); // otimista
    // Agrupa pelo contador atual: uma requisição por grupo (e por bloco), não uma por QR.
    const groups = new Map<number, string[]>();
    ids.forEach(id => {
      const n = byProduct.get(id)!.download_count;
      groups.set(n, [...(groups.get(n) ?? []), id]);
    });
    for (const [count, list] of groups) {
      for (let i = 0; i < list.length; i += CHUNK) {
        const { error: err } = await supabase.from('qr_stickers')
          .update({ downloaded_at: now, download_count: count + 1 }).in('product_id', list.slice(i, i + CHUNK));
        if (err) { await load(); return err.message; }
      }
    }
    return null;
  }, [byProduct, load]);

  /** Volta para "ainda não baixado". */
  const resetDownloaded = useCallback(async (productIds: string[]): Promise<string | null> => {
    setRows(prev => prev.map(r => (productIds.includes(r.product_id) ? { ...r, downloaded_at: null, download_count: 0 } : r)));
    for (let i = 0; i < productIds.length; i += CHUNK) {
      const { error: err } = await supabase.from('qr_stickers')
        .update({ downloaded_at: null, download_count: 0 }).in('product_id', productIds.slice(i, i + CHUNK));
      if (err) { await load(); return err.message; }
    }
    return null;
  }, [load]);

  return { rows, byProduct, loading, error, mark, unmark, markDownloaded, resetDownloaded, reload: load };
}

export type QrStickersApi = ReturnType<typeof useQrStickers>;
