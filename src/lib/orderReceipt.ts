import { ORDER_STATUSES, type Order } from './orders';

const brl = (n: number) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',')}`;
const fmtDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const statusLabel = (o: Order) => ORDER_STATUSES.find(s => s.id === o.status)?.label ?? o.status;
const SITE = 'airnext.com.br';

/** Telefone formatado para exibir: (47) 99600-4061 */
export function fmtPhone(phone: string | null | undefined): string {
  const d = (phone || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone || '—';
}

// ---------------------------------------------------------------------------
// Nota em imagem (PNG) — ótima para mandar ao cliente pelo WhatsApp
// ---------------------------------------------------------------------------
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = word; } else line = test;
    }
    out.push(line);
  }
  return out;
}

export async function renderReceiptCanvas(o: Order): Promise<HTMLCanvasElement> {
  try { await document.fonts?.load('56px Lobster'); } catch { /* usa fonte reserva */ }

  const W = 900, PAD = 56, SCALE = 2;
  const sans = '"Helvetica Neue", Helvetica, Arial, sans-serif';

  // 1ª passada só mede a altura; 2ª desenha.
  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = `26px ${sans}`;
  const noteLines = o.notes ? wrap(measure, o.notes, W - PAD * 2 - 8).slice(0, 14) : [];
  const adminLines = o.admin_notes ? wrap(measure, o.admin_notes, W - PAD * 2 - 8).slice(0, 6) : [];
  const itemRows = o.items.map(it => wrap(measure, `${it.qty}x  ${it.name}${it.format ? ` (${it.format})` : ''}`, W - PAD * 2 - 220));
  const itemsH = itemRows.reduce((a, r) => a + r.length * 36 + 14, 0);

  const H = 150 + 70 + 270 + 80 + itemsH + 120
    + (noteLines.length ? 70 + noteLines.length * 34 : 0)
    + (adminLines.length ? 70 + adminLines.length * 34 : 0) + 120;

  const c = document.createElement('canvas');
  c.width = W * SCALE; c.height = H * SCALE;
  const ctx = c.getContext('2d')!;
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);

  // Cabeçalho preto com a marca
  ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, 150);
  ctx.textBaseline = 'alphabetic';
  ctx.font = '64px Lobster, cursive';
  ctx.fillStyle = '#ffffff'; ctx.fillText('Air', PAD, 92);
  const airW = ctx.measureText('Air').width;
  ctx.fillStyle = '#0071e3'; ctx.fillText('Next', PAD + airW, 92);
  ctx.textAlign = 'right'; ctx.fillStyle = '#ffffff'; ctx.font = `bold 26px ${sans}`;
  ctx.fillText('NOTA DO PEDIDO', W - PAD, 70);
  ctx.fillStyle = '#9ca3af'; ctx.font = `22px ${sans}`;
  ctx.fillText(o.order_number, W - PAD, 104);
  ctx.textAlign = 'left';

  let y = 150 + 64;
  const label = (t: string, yy: number) => { ctx.fillStyle = '#6b7280'; ctx.font = `bold 18px ${sans}`; ctx.fillText(t.toUpperCase(), PAD, yy); };
  const value = (t: string, yy: number) => { ctx.fillStyle = '#111827'; ctx.font = `28px ${sans}`; ctx.fillText(t, PAD, yy + 34); };

  // Dados do pedido / cliente
  label('Data do pedido', y); value(fmtDateTime(o.created_at), y);
  ctx.textAlign = 'right'; ctx.fillStyle = '#6b7280'; ctx.font = `bold 18px ${sans}`; ctx.fillText('STATUS', W - PAD, y);
  ctx.fillStyle = '#0071e3'; ctx.font = `bold 28px ${sans}`; ctx.fillText(statusLabel(o), W - PAD, y + 34); ctx.textAlign = 'left';
  y += 84;
  label('Cliente', y); value(o.customer_name || 'Não informado', y);
  y += 84;
  label('WhatsApp', y); value(fmtPhone(o.customer_phone), y);
  if (o.finalized_at) {
    ctx.textAlign = 'right'; ctx.fillStyle = '#6b7280'; ctx.font = `bold 18px ${sans}`; ctx.fillText('CONCLUÍDO EM', W - PAD, y);
    ctx.fillStyle = '#111827'; ctx.font = `28px ${sans}`; ctx.fillText(fmtDateTime(o.finalized_at), W - PAD, y + 34); ctx.textAlign = 'left';
  }
  y += 84;

  // Itens
  ctx.fillStyle = '#e5e7eb'; ctx.fillRect(PAD, y, W - PAD * 2, 2); y += 40;
  ctx.fillStyle = '#6b7280'; ctx.font = `bold 18px ${sans}`; ctx.fillText('ITENS', PAD, y);
  ctx.textAlign = 'right'; ctx.fillText('VALOR', W - PAD, y); ctx.textAlign = 'left'; y += 14;
  o.items.forEach((it, i) => {
    ctx.fillStyle = '#111827'; ctx.font = `26px ${sans}`;
    itemRows[i].forEach((ln, k) => { ctx.fillText(ln, PAD, y + 36 + k * 36); });
    ctx.textAlign = 'right';
    ctx.fillText(it.price > 0 ? brl(it.price * it.qty) : '—', W - PAD, y + 36);
    ctx.textAlign = 'left';
    y += itemRows[i].length * 36 + 14;
  });
  y += 14;
  ctx.fillStyle = '#e5e7eb'; ctx.fillRect(PAD, y, W - PAD * 2, 2); y += 56;

  // Total
  ctx.fillStyle = '#111827'; ctx.font = `bold 30px ${sans}`; ctx.fillText('TOTAL', PAD, y);
  ctx.textAlign = 'right'; ctx.font = `bold 40px ${sans}`;
  ctx.fillText(o.subtotal > 0 ? brl(o.subtotal) : 'Sob consulta', W - PAD, y); ctx.textAlign = 'left';
  y += 30;

  const block = (title: string, lines: string[]) => {
    y += 40;
    ctx.fillStyle = '#6b7280'; ctx.font = `bold 18px ${sans}`; ctx.fillText(title.toUpperCase(), PAD, y); y += 8;
    ctx.fillStyle = '#374151'; ctx.font = `26px ${sans}`;
    lines.forEach(l => { y += 34; ctx.fillText(l, PAD, y); });
  };
  if (noteLines.length) block('Observações do cliente', noteLines);
  if (adminLines.length) block('Anotações', adminLines);

  // Rodapé
  ctx.fillStyle = '#f3f4f6'; ctx.fillRect(0, H - 100, W, 100);
  ctx.textAlign = 'center'; ctx.fillStyle = '#111827'; ctx.font = `bold 24px ${sans}`;
  ctx.fillText('Obrigado pela preferência!', W / 2, H - 52);
  ctx.fillStyle = '#6b7280'; ctx.font = `20px ${sans}`;
  ctx.fillText(SITE, W / 2, H - 22);
  return c;
}

export async function downloadReceiptPng(o: Order): Promise<void> {
  const canvas = await renderReceiptCanvas(o);
  const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/png'));
  if (!blob) throw new Error('Não foi possível gerar a imagem da nota.');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `nota-${o.order_number}.png`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// ---------------------------------------------------------------------------
// Nota para imprimir / salvar em PDF (janela de impressão do navegador)
// ---------------------------------------------------------------------------
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export function printReceipt(o: Order): boolean {
  const w = window.open('', '_blank', 'width=820,height=900');
  if (!w) return false;
  const rows = o.items.map(it =>
    `<tr><td>${it.qty}x ${esc(it.name)}${it.format ? ` <span class="m">(${esc(it.format)})</span>` : ''}</td><td class="r">${it.price > 0 ? brl(it.price * it.qty) : '—'}</td></tr>`
  ).join('');
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Nota ${esc(o.order_number)}</title>
<style>
@page{size:A4;margin:14mm}
*{box-sizing:border-box}body{font-family:Helvetica,Arial,sans-serif;color:#111827;margin:0}
.top{background:#000;color:#fff;padding:22px 28px;display:flex;justify-content:space-between;align-items:center;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.logo{font-family:Lobster,cursive;font-size:38px}.logo b{color:#0071e3;font-weight:400}
.top .r{text-align:right}.top small{color:#9ca3af;display:block;margin-top:4px}
.wrap{padding:26px 28px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px 24px;margin-bottom:22px}
.l{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6b7280}.v{font-size:16px;margin-top:3px}
table{width:100%;border-collapse:collapse;margin-top:6px}th{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;text-align:left;border-bottom:2px solid #e5e7eb;padding:8px 0}
td{padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:15px}.r{text-align:right}.m{color:#6b7280}
.total{display:flex;justify-content:space-between;align-items:baseline;margin-top:18px;font-weight:700}.total span:last-child{font-size:26px}
.box{margin-top:20px;white-space:pre-wrap;font-size:14px;color:#374151;background:#f9fafb;border-radius:10px;padding:12px 14px}
.foot{text-align:center;color:#6b7280;margin-top:34px;font-size:13px}
</style></head><body>
<div class="top"><div class="logo">Air<b>Next</b></div><div class="r"><strong>NOTA DO PEDIDO</strong><small>${esc(o.order_number)}</small></div></div>
<div class="wrap">
<div class="grid">
<div><div class="l">Data do pedido</div><div class="v">${fmtDateTime(o.created_at)}</div></div>
<div><div class="l">Status</div><div class="v">${esc(statusLabel(o))}</div></div>
<div><div class="l">Cliente</div><div class="v">${esc(o.customer_name || 'Não informado')}</div></div>
<div><div class="l">WhatsApp</div><div class="v">${esc(fmtPhone(o.customer_phone))}</div></div>
${o.finalized_at ? `<div><div class="l">Concluído em</div><div class="v">${fmtDateTime(o.finalized_at)}</div></div>` : ''}
</div>
<table><thead><tr><th>Itens</th><th class="r">Valor</th></tr></thead><tbody>${rows}</tbody></table>
<div class="total"><span>TOTAL</span><span>${o.subtotal > 0 ? brl(o.subtotal) : 'Sob consulta'}</span></div>
${o.notes ? `<div class="box"><div class="l">Observações do cliente</div>${esc(o.notes)}</div>` : ''}
${o.admin_notes ? `<div class="box"><div class="l">Anotações</div>${esc(o.admin_notes)}</div>` : ''}
<div class="foot">Obrigado pela preferência! · ${SITE}</div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print()},350)}</script>
</body></html>`);
  w.document.close();
  return true;
}

// ---------------------------------------------------------------------------
// Planilha (CSV) para organizar — abre direto no Excel / Google Planilhas
// ---------------------------------------------------------------------------
export function downloadOrdersCsv(orders: Order[], filename: string): void {
  const cell = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' | ')}"`;
  const head = ['Pedido', 'Data do pedido', 'Cliente', 'WhatsApp', 'Itens', 'Valor (R$)', 'Status', 'Concluído em', 'Observações do cliente', 'Anotações'];
  const lines = orders.map(o => [
    o.order_number,
    fmtDateTime(o.created_at),
    o.customer_name || '',
    fmtPhone(o.customer_phone),
    o.items.map(i => `${i.qty}x ${i.name}${i.format ? ` (${i.format})` : ''}`).join(' + '),
    Number(o.subtotal || 0).toFixed(2).replace('.', ','),
    statusLabel(o),
    fmtDateTime(o.finalized_at),
    o.notes || '',
    o.admin_notes || '',
  ].map(cell).join(';'));
  const csv = '\ufeff' + [head.map(cell).join(';'), ...lines].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
