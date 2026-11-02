import { supabase } from './supabase';

/**
 * Ao escanear uma placa (/n/:uuid ou /a/:code) a consulta ao banco começa JÁ no carregamento do app,
 * em paralelo com o download das telas — antes ela só começava depois de a tela de redirecionamento
 * terminar de carregar, somando as esperas uma após a outra.
 */
let pending: { key: string; promise: Promise<{ data: any; error: any }> } | null = null;

export function startScanLookup() {
  if (typeof window === 'undefined') return;
  const m = window.location.pathname.match(/^\/(n|a)\/([^/?#]+)/);
  if (!m) return;
  const kind = m[1];
  let value = m[2];
  try { value = decodeURIComponent(value); } catch { /* mantém o valor bruto */ }
  const params = kind === 'n' ? { p_uuid: value } : { p_code: value };
  pending = {
    key: `${kind}:${value}`,
    promise: Promise.resolve(supabase.rpc('resolve_product', params)) as Promise<{ data: any; error: any }>,
  };
}

/** Entrega (uma única vez) a consulta já iniciada para este chip/código, se houver. */
export function takeScanLookup(kind: 'n' | 'a', value: string) {
  if (pending && pending.key === `${kind}:${value}`) {
    const p = pending.promise;
    pending = null;
    return p;
  }
  return null;
}
