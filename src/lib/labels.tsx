/**
 * Etiquetas imprimíveis (QR + código) das plaquinhas.
 *
 * Cada etiqueta traz o QR Code E o código do produto juntos, na mesma ordem em
 * todas as folhas: quem imprime não precisa procurar o código depois.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';
import type { Product } from '@/types/admin';

export type LabelMode = 'qr-code' | 'qr' | 'code';

export interface LabelOptions {
  /** URL base do site (mesma usada nos chips). */
  baseUrl: string;
  /** qr-code = QR + código (recomendado) · qr = só QR · code = só código. */
  mode: LabelMode;
  /** Lado do QR em centímetros. */
  qrCm: number;
  /** Colunas por folha A4. */
  cols: number;
  /** Mostra o código interno (ex.: AN-0001) em letra pequena. */
  showInternal: boolean;
  /** Título pequeno no topo da folha (ex.: nome do lote). */
  sheetTitle?: string;
}

export const DEFAULT_LABEL_OPTIONS: Omit<LabelOptions, 'baseUrl'> = {
  mode: 'qr-code',
  qrCm: 2,
  cols: 5,
  showInternal: true,
};

/** Mesmo link do QrModal: o ID público do produto, sem expor o código de ativação. */
export function productQrUrl(product: Product, baseUrl: string): string {
  const base = (baseUrl || window.location.origin).replace(/\/$/, '');
  return product.uuid ? `${base}/n/${product.uuid}?s=qr` : `${base}/a/${product.activationCode}`;
}

/**
 * Localiza o produto a partir do que foi lido do QR (link completo) ou digitado:
 * aceita o link `/n/{uuid}`, o link antigo `/a/{código}`, o uuid, o código de
 * ativação ou o código interno.
 */
export function findProductByScan(raw: string, products: Product[]): Product | null {
  let value = (raw || '').trim();
  if (!value) return null;
  const fromLink = value.match(/\/(?:n|a|ativar)\/([^/?#\s]+)/i);
  if (fromLink) value = decodeURIComponent(fromLink[1]);
  const key = value.toLowerCase();
  return (
    products.find((p) => p.uuid?.toLowerCase() === key) ||
    products.find((p) => p.activationCode?.toLowerCase() === key) ||
    products.find((p) => p.internalCode?.toLowerCase() === key) ||
    null
  );
}

/** Folha-índice: Nº · código interno · código de ativação · lote — para localizar uma plaquinha rapidamente. */
function buildCodeListHtml(products: Product[], title: string, lotCodeOf: (p: Product) => string): string {
  const rows = sortForLabels(products)
    .map(
      (p, i) =>
        `<tr><td>${i + 1}</td><td>${esc(p.internalCode || '')}</td><td class="c">${esc(p.activationCode)}</td><td>${esc(lotCodeOf(p))}</td><td class="box"></td></tr>`
    )
    .join('');
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Lista de códigos</title>
<style>
  @page { size: A4; margin: 10mm; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #000; }
  h1 { font-size: 12pt; margin: 0 0 4mm; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border-bottom: 0.2mm solid #bbb; padding: 1.2mm 2mm; text-align: left; }
  th { font-size: 8pt; text-transform: uppercase; color: #555; }
  .c { font-family: "Courier New", monospace; font-weight: 700; }
  .box { width: 8mm; }
  tr { break-inside: avoid; }
</style></head><body><h1>${esc(title)} — ${products.length} produto(s)</h1>
<table><thead><tr><th>Nº</th><th>Cód. interno</th><th>Código de ativação</th><th>Lote</th><th>✓</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  return html;
}

export function printCodeList(products: Product[], title: string, lotCodeOf: (p: Product) => string): void {
  printHtml(buildCodeListHtml(products, title, lotCodeOf));
}

/** Nome de arquivo seguro a partir de um título (ex.: "Lote L-01" → "lote-l-01"). */
function fileSlug(title: string): string {
  return (
    title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'todos'
  );
}

function downloadBlob(filename: string, content: BlobPart, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Baixa a folha de etiquetas como arquivo HTML autônomo (QRs embutidos, A4).
 * Basta abrir o arquivo e imprimir ou "Salvar como PDF" — sai idêntico à impressão direta.
 */
export function downloadLabels(products: Product[], opts: LabelOptions): void {
  if (products.length === 0) return;
  const name = `etiquetas-${fileSlug(opts.sheetTitle || 'todos')}-${opts.mode}.html`;
  downloadBlob(name, buildSheetHtml(products, opts), 'text/html;charset=utf-8');
}

// ─── QR Code em PNG (individual ou ZIP com todos) ───────────────────────────
const QR_PX = 512; // lado do QR em pixels
const QR_QUIET_PX = 32; // margem branca ao redor (quiet zone), importante para a leitura

/** Gera o PNG (fundo branco + margem) do QR Code de uma plaquinha. */
async function qrPngBytes(product: Product, baseUrl: string): Promise<Uint8Array> {
  const svg = renderToStaticMarkup(
    <QRCodeSVG value={productQrUrl(product, baseUrl)} size={QR_PX} level="M" />
  ).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Falha ao gerar o QR Code'));
      el.src = url;
    });
    const total = QR_PX + QR_QUIET_PX * 2;
    const canvas = document.createElement('canvas');
    canvas.width = total;
    canvas.height = total;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas indisponível');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, total, total);
    ctx.drawImage(img, QR_QUIET_PX, QR_QUIET_PX, QR_PX, QR_PX);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Falha ao exportar o PNG');
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Baixa o QR Code de uma plaquinha como PNG. */
export async function downloadQrPng(product: Product, baseUrl: string): Promise<void> {
  const bytes = await qrPngBytes(product, baseUrl);
  downloadBlob(`qrcode-${fileSlug(product.activationCode)}.png`, bytes, 'image/png');
}

/** Baixa um ZIP com um PNG de QR Code por plaquinha (nome: código interno + código de ativação). */
export async function downloadQrZip(products: Product[], baseUrl: string, title: string): Promise<void> {
  if (products.length === 0) return;
  const used = new Set<string>();
  const entries: { name: string; data: Uint8Array }[] = [];
  for (const p of sortForLabels(products)) {
    const internal = p.internalCode && p.internalCode !== '—' ? `${fileSlug(p.internalCode)}_` : '';
    let name = `${internal}${fileSlug(p.activationCode)}.png`;
    for (let n = 2; used.has(name); n++) name = `${internal}${fileSlug(p.activationCode)}-${n}.png`;
    used.add(name);
    entries.push({ name, data: await qrPngBytes(p, baseUrl) });
  }
  downloadBlob(`qrcodes-${fileSlug(title)}.zip`, buildZip(entries), 'application/zip');
}

// ZIP mínimo (sem compressão — os PNGs já são comprimidos), sem depender de biblioteca externa.
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function buildZip(entries: { name: string; data: Uint8Array }[]): Blob {
  const enc = new TextEncoder();
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const e of entries) {
    const name = enc.encode(e.name);
    const crc = crc32(e.data);
    const size = e.data.length;

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // nomes em UTF-8
    lv.setUint16(8, 0, true); // sem compressão
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, name.length, true);
    local.set(name, 30);

    const cen = new Uint8Array(46 + name.length);
    const cv = new DataView(cen.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    cen.set(name, 46);

    parts.push(local, e.data);
    central.push(cen);
    offset += local.length + size;
  }

  const cenSize = central.reduce((sum, c) => sum + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, cenSize, true);
  ev.setUint32(16, offset, true);

  return new Blob([...parts, ...central, end] as BlobPart[], { type: 'application/zip' });
}

/** Baixa a lista de códigos (Nº, código interno, código de ativação, lote) em CSV, na ordem das etiquetas. */
export function downloadCodeList(products: Product[], title: string, lotCodeOf: (p: Product) => string): void {
  if (products.length === 0) return;
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    ['Nº', 'Código interno', 'Código de ativação', 'Lote'].map(q).join(';'),
    ...sortForLabels(products).map((p, i) =>
      [i + 1, p.internalCode || '', p.activationCode, lotCodeOf(p)].map(q).join(';')
    ),
  ];
  // BOM para o Excel abrir os acentos corretamente.
  downloadBlob(`codigos-${fileSlug(title)}.csv`, '\ufeff' + lines.join('\r\n'), 'text/csv;charset=utf-8;');
}

/** Ordem estável das etiquetas: por código interno (natural), depois por data de criação. */
export function sortForLabels(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const byCode = (a.internalCode || '').localeCompare(b.internalCode || '', 'pt-BR', { numeric: true });
    return byCode !== 0 ? byCode : (a.createdAt || '').localeCompare(b.createdAt || '');
  });
}

// ─── Controle local de "já impresso" (fica neste navegador) ─────────────────
const PRINTED_KEY = 'airnext_labels_printed';

export function loadPrinted(): Set<string> {
  try {
    const raw = localStorage.getItem(PRINTED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function savePrinted(ids: Set<string>): void {
  try {
    localStorage.setItem(PRINTED_KEY, JSON.stringify([...ids]));
  } catch {
    /* sem armazenamento: só não lembra o que já foi impresso */
  }
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function buildSheetHtml(products: Product[], opts: LabelOptions): string {
  const items = sortForLabels(products);
  const total = items.length;
  const pad = String(total).length;
  const showQr = opts.mode !== 'code';
  const showCode = opts.mode !== 'qr';

  const cells = items
    .map((p, i) => {
      const qr = showQr
        ? `<div class="qr">${renderToStaticMarkup(
            <QRCodeSVG value={productQrUrl(p, opts.baseUrl)} size={256} level="M" />
          )}</div>`
        : '';
      const code = showCode ? `<div class="code">${esc(p.activationCode)}</div>` : '';
      const internal =
        opts.showInternal && p.internalCode && p.internalCode !== '—'
          ? `<div class="internal">${esc(p.internalCode)}</div>`
          : '';
      const seq = `<div class="seq">${String(i + 1).padStart(pad, '0')}/${total}</div>`;
      return `<div class="cell">${seq}${qr}${code}${internal}</div>`;
    })
    .join('');

  const title = opts.sheetTitle ? `<div class="sheet-title">${esc(opts.sheetTitle)} — ${total} etiqueta(s)</div>` : '';

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Etiquetas AirNext</title>
<style>
  @page { size: A4; margin: 8mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; }
  .sheet-title { font-size: 8pt; color: #666; margin-bottom: 2mm; }
  .grid { display: grid; grid-template-columns: repeat(${opts.cols}, 1fr); }
  .cell { border: 0.2mm dashed #999; padding: 1.5mm; text-align: center; break-inside: avoid; page-break-inside: avoid; display: flex; flex-direction: column; align-items: center; gap: 1mm; }
  .seq { align-self: flex-start; font-size: 6pt; color: #888; }
  .qr svg { display: block; width: ${opts.qrCm}cm; height: ${opts.qrCm}cm; }
  .code { font-family: "Courier New", monospace; font-weight: 700; font-size: ${opts.mode === 'code' ? 14 : 10}pt; letter-spacing: 0.3pt; }
  .internal { font-size: 7pt; color: #555; }
</style></head><body>${title}<div class="grid">${cells}</div></body></html>`;
}

/** Imprime um HTML completo usando um iframe oculto. */
function printHtml(html: string): void {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => setTimeout(() => iframe.remove(), 1000);
  const run = () => {
    try {
      win.focus();
      win.print();
    } finally {
      win.addEventListener('afterprint', cleanup);
      setTimeout(() => iframe.remove(), 120000);
    }
  };
  // Dá um instante para os SVGs renderizarem antes de abrir a impressão.
  setTimeout(run, 300);
}

/** Abre a janela de impressão com a folha de etiquetas (A4, grade para recortar). */
export function printLabels(products: Product[], opts: LabelOptions): void {
  if (products.length === 0) return;
  printHtml(buildSheetHtml(products, opts));
}
