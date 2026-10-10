/**
 * Vinculação do chip NFC ao produto durante a ativação do cliente.
 *
 * Cada produto tem UMA linha em `products` com os dois identificadores:
 *   - `code`     → impresso no QR Code da placa  (/a/:code)
 *   - `nfc_uuid` → gravado no chip NFC da placa   (/n/:uuid)
 * Ativar o produto (status → ATIVO) já vale para os dois. O que pode faltar é
 * o chip estar gravado com o `nfc_uuid` DESTE produto (ex.: placa liberada só
 * com QR). Este módulo lê o chip, confere de quem ele é e, se estiver vazio,
 * grava o link do produto — sem nunca sobrescrever o chip de outro produto.
 */
import { supabase } from './supabase';
import { isWebNFCSupported, readNFCTag, writeNFCUrl, describeNFCError } from './nfc';

export type ChipLinkResult =
  | { status: 'linked'; serial: string; saved: boolean }
  | { status: 'already'; serial: string; saved: boolean }
  | { status: 'other-product' }
  | { status: 'unsupported' }
  | { status: 'error'; message: string };

/** Extrai o uuid de um link `/n/{uuid}` lido do chip (ignora o prefixo NDEF). */
export function extractNfcUuid(raw: string): string | null {
  const m = raw.match(/\/n\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return m ? m[1].toLowerCase() : null;
}

/** Mesma base usada pelo Programador NFC: configuração do painel → env → origem atual. */
export async function getChipBaseUrl(): Promise<string> {
  try {
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'nfc_base_url').maybeSingle();
    if (data?.value) return String(data.value).replace(/\/$/, '');
  } catch {
    /* sem permissão de leitura: segue para o fallback */
  }
  const env = (import.meta as any).env?.VITE_PUBLIC_APP_URL;
  if (env) return String(env).replace(/\/$/, '');
  if (typeof window !== 'undefined' && !window.location.origin.includes('localhost')) return window.location.origin;
  return 'https://airnext-xi.vercel.app';
}

/** Lê o chip e devolve o uuid do produto a que ele pertence (ou null se vazio/estranho). */
export async function readChipUuid(): Promise<{ uuid: string | null; serial: string }> {
  const tag = await readNFCTag();
  const url = tag.records.find(r => r.recordType === 'url' || /\/n\//.test(r.data));
  return { uuid: url ? extractNfcUuid(url.data) : null, serial: tag.serialNumber };
}

async function saveLink(productId: string, userId: string, userName: string, serial: string): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .update({
      programmed_at: new Date().toISOString(),
      chip_serial_number: serial,
      programmed_by: userId,
      programmed_by_name: userName || 'Cliente (ativação)',
    })
    .eq('id', productId)
    .eq('user_id', userId);
  if (error) console.error('Falha ao registrar vínculo do chip:', error);
  return !error;
}

/** Fluxo completo: ler → conferir dono → gravar se vazio → confirmar → registrar. */
export async function linkChipToProduct(
  product: { id: string; nfc_uuid: string },
  user: { id: string; name?: string },
): Promise<ChipLinkResult> {
  if (!isWebNFCSupported()) return { status: 'unsupported' };
  try {
    const { uuid, serial } = await readChipUuid();

    if (uuid && uuid !== product.nfc_uuid.toLowerCase()) return { status: 'other-product' };
    if (uuid) {
      const saved = await saveLink(product.id, user.id, user.name || '', serial);
      return { status: 'already', serial, saved };
    }

    const base = await getChipBaseUrl();
    const url = `${base}/n/${product.nfc_uuid}`;
    await writeNFCUrl(url);

    // Confirma relendo o chip: só considera vinculado se o link bate.
    const check = await readChipUuid();
    if (check.uuid !== product.nfc_uuid.toLowerCase()) {
      return { status: 'error', message: 'Gravamos o chip, mas não conseguimos confirmar a leitura. Tente aproximar a placa novamente.' };
    }
    const saved = await saveLink(product.id, user.id, user.name || '', check.serial || serial);
    return { status: 'linked', serial: check.serial || serial, saved };
  } catch (err) {
    return { status: 'error', message: describeNFCError(err) };
  }
}
