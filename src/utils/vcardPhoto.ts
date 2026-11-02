/**
 * Foto de perfil para o "Salvar contato" (.vcf).
 * Baixa a imagem, recorta em quadrado, reduz para 320px e converte em JPEG base64 —
 * assim a foto vai DENTRO do arquivo e aparece na agenda (iOS e Android), sem depender de link.
 */
const cache = new Map<string, Promise<string | null>>();

async function build(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const bmp = await createImageBitmap(blob);
    const size = 320;
    const side = Math.min(bmp.width, bmp.height);
    const sx = (bmp.width - side) / 2;
    const sy = (bmp.height - side) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(bmp, sx, sy, side, side, 0, 0, size, size);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    return dataUrl.split(',')[1] || null;
  } catch {
    return null;
  }
}

/** Começa a preparar a foto (idempotente). Chame cedo para o clique em "Salvar" ser instantâneo. */
export function prefetchVcardPhoto(url?: string): Promise<string | null> {
  if (!url || typeof window === 'undefined') return Promise.resolve(null);
  let p = cache.get(url);
  if (!p) { p = build(url); cache.set(url, p); }
  return p;
}

/** Dobra linhas longas do vCard (limite de 75 caracteres, continuação com espaço). */
export function foldVcardLine(line: string): string {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) parts.push(' ' + line.slice(i, i + 74));
  return parts.join('\r\n');
}
