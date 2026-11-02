import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2, ChevronDown, Download, Link2Off, ListOrdered, Package, PackageCheck, Plus, Printer, QrCode, Truck,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/adminUtils';
import { SearchBar } from '@/components/admin/ui/SearchBar';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { Modal } from '@/components/admin/ui/Modal';
import { ORDER_STATUSES, isFinalized, type Order } from '@/lib/orders';
import { fmtPhone } from '@/lib/orderReceipt';
import type { OrderQrLink } from '@/hooks/useOrderQrCodes';
import type { Lot, Product } from '@/types/admin';
import {
  DEFAULT_LABEL_OPTIONS, downloadQrZip, loadPrinted, loadPrintedRemote, printCodeList, printLabels,
  productQrUrl, savePrinted, setPrintedRemote, sortForLabels,
} from '@/lib/labels';

interface Props {
  orders: Order[];
  links: OrderQrLink[];
  linksLoading: boolean;
  linksError: string | null;
  /** Produtos da linha padrão (cartões, tags, etc.) — de onde saem os QR Codes. */
  products: Product[];
  lots: Lot[];
  appUrl: string;
  /** Pedido para abrir já expandido (vindo de Pedidos). */
  focusOrderId?: string | null;
  onLink: (orderId: string, productIds: string[]) => Promise<string | null>;
  onUnlink: (orderId: string, productIds: string[]) => Promise<string | null>;
  onOpenOrders: () => void;
}

type Tab = 'sem' | 'com' | 'todos';

const brl = (n: number) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',')}`;
const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—');
const INELIGIBLE = new Set(['Cancelado', 'Bloqueado', 'Expirado']);
const THUMBS = 48;

export function FulfillmentView({
  orders, links, linksLoading, linksError, products, lots, appUrl, focusOrderId, onLink, onUnlink, onOpenOrders,
}: Props) {
  const [tab, setTab] = useState<Tab>('sem');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(focusOrderId ?? null);
  const [pickerFor, setPickerFor] = useState<Order | null>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [printed, setPrinted] = useState<Set<string>>(() => loadPrinted());
  const [busy, setBusy] = useState<string | null>(null);
  const focusRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    loadPrintedRemote().then(r => { if (r) setPrinted(r); });
  }, []);
  useEffect(() => {
    if (!focusOrderId) return;
    setOpenId(focusOrderId);
    setTab('todos');
    window.setTimeout(() => focusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  }, [focusOrderId]);

  const productById = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const lotCode = (p: Product) => lots.find(l => l.id === p.lotId)?.code ?? '';
  const linksByOrder = useMemo(() => {
    const m = new Map<string, Product[]>();
    links.forEach(l => {
      const p = productById.get(l.product_id);
      if (p) m.set(l.order_id, [...(m.get(l.order_id) ?? []), p]);
    });
    m.forEach((v, k) => m.set(k, sortForLabels(v)));
    return m;
  }, [links, productById]);
  const linkedIds = useMemo(() => new Set(links.map(l => l.product_id)), [links]);

  const needed = (o: Order) => o.items.reduce((a, i) => a + (i.qty || 0), 0);
  const base = useMemo(() => orders.filter(o => o.status !== 'cancelado'), [orders]);
  const counts = useMemo(() => ({
    sem: base.filter(o => isFinalized(o) && !(linksByOrder.get(o.id)?.length)).length,
    com: base.filter(o => !!linksByOrder.get(o.id)?.length).length,
    todos: base.length,
  }), [base, linksByOrder]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return base.filter(o => {
      const n = linksByOrder.get(o.id)?.length ?? 0;
      if (tab === 'sem' && !(isFinalized(o) && n === 0)) return false;
      if (tab === 'com' && n === 0) return false;
      if (!q) return true;
      const codes = (linksByOrder.get(o.id) ?? []).map(p => p.internalCode).join(' ');
      return [o.order_number, o.customer_name, o.customer_phone, o.tracking_code, codes]
        .some(v => (v || '').toLowerCase().includes(q));
    });
  }, [base, tab, query, linksByOrder]);

  const flash = (type: 'ok' | 'err', text: string) => { setMsg({ type, text }); window.setTimeout(() => setMsg(null), 6000); };
  const labelOpts = (o: Order) => ({ ...DEFAULT_LABEL_OPTIONS, baseUrl: appUrl, sheetTitle: `Pedido ${o.order_number}` });

  const markPrinted = async (ids: string[], value: boolean) => {
    const next = new Set(printed);
    ids.forEach(id => (value ? next.add(id) : next.delete(id)));
    setPrinted(next); savePrinted(next);
    const ok = await setPrintedRemote(ids, value);
    if (!ok) flash('err', 'Marcado só neste navegador: rode o SQL 21 para guardar no banco.');
  };

  const doPrint = (o: Order, ps: Product[]) => {
    printLabels(ps, labelOpts(o));
    if (confirm(`Marcar os ${ps.length} adesivos do pedido ${o.order_number} como IMPRESSOS?`)) void markPrinted(ps.map(p => p.id), true);
  };
  const doZip = async (o: Order, ps: Product[]) => {
    setBusy(`zip-${o.id}`);
    try { await downloadQrZip(ps, appUrl, `Pedido ${o.order_number}`); }
    catch (e) { flash('err', e instanceof Error ? e.message : 'Falha ao gerar o ZIP.'); }
    finally { setBusy(null); }
  };
  const unlink = async (o: Order, ids: string[]) => {
    const err = await onUnlink(o.id, ids);
    flash(err ? 'err' : 'ok', err ?? 'Vínculo removido — o QR ficou livre para outro pedido.');
  };

  const tabBtn = (id: Tab, label: string) => (
    <button key={id} onClick={() => setTab(id)}
      className={cn('rounded-lg px-3 py-1.5 text-sm font-medium transition',
        tab === id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200')}>
      {label} <span className="ml-1 text-xs text-zinc-500">{counts[id]}</span>
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Aguardando adesivos', value: counts.sem, icon: Package, tone: 'text-amber-300' },
          { label: 'Com adesivos', value: counts.com, icon: PackageCheck, tone: 'text-emerald-300' },
          { label: 'QR em pedidos', value: links.length, icon: QrCode, tone: 'text-indigo-300' },
        ].map(c => (
          <div key={c.label} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <c.icon className={cn('mb-2 h-5 w-5', c.tone)} />
            <p className="text-2xl font-semibold text-zinc-100">{c.value}</p>
            <p className="text-xs text-zinc-500">{c.label}</p>
          </div>
        ))}
      </div>

      {linksError && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          Para guardar os QR de cada pedido, rode o script <strong>sql/24_pedidos_qr_adesivos.sql</strong> no Supabase.
          <span className="mt-1 block text-xs text-amber-300/70">{linksError}</span>
        </div>
      )}
      {msg && (
        <div role="status" className={cn('rounded-xl border p-3 text-sm',
          msg.type === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-red-500/30 bg-red-500/10 text-red-200')}>
          {msg.text}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          {tabBtn('sem', 'Sem adesivos')}{tabBtn('com', 'Com adesivos')}{tabBtn('todos', 'Todos')}
        </div>
        <SearchBar value={query} onChange={setQuery} placeholder="Pedido, cliente, rastreio ou código do QR…" className="sm:w-80" />
      </div>

      {linksLoading && orders.length === 0 ? (
        <div className="h-40 animate-pulse rounded-2xl bg-zinc-900" />
      ) : list.length === 0 ? (
        <EmptyState
          title={tab === 'sem' ? 'Nenhum pedido aguardando adesivos' : 'Nenhum pedido encontrado'}
          description={tab === 'sem'
            ? 'Quando você marcar um pedido como “Produto concluído”, ele aparece aqui para separar os QR Codes.'
            : 'Ajuste a busca ou troque de aba.'}
        />
      ) : (
        <ul className="space-y-3">
          {list.map(o => {
            const ps = linksByOrder.get(o.id) ?? [];
            const open = openId === o.id;
            const st = ORDER_STATUSES.find(s => s.id === o.status);
            const need = needed(o);
            const printedCount = ps.filter(p => printed.has(p.id)).length;
            return (
              <li key={o.id} ref={o.id === focusOrderId ? focusRef : undefined}
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
                <button onClick={() => setOpenId(open ? null : o.id)} aria-expanded={open}
                  className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-zinc-800/40">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-zinc-100">{o.order_number}</span>
                      {st && <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium ring-1', st.badge)}>{st.label}</span>}
                      {o.tracking_code && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-cyan-300"><Truck className="h-3 w-3" />{o.tracking_code}</span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-zinc-400">
                      {o.customer_name || 'Sem nome'} · {fmtPhone(o.customer_phone)} · {fmtDate(o.created_at)} · {brl(o.subtotal)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn('text-sm font-semibold', ps.length ? 'text-emerald-300' : 'text-amber-300')}>
                      {ps.length}/{need} QR
                    </p>
                    {ps.length > 0 && <p className="text-[11px] text-zinc-500">{printedCount} impressos</p>}
                  </div>
                  <ChevronDown className={cn('h-4 w-4 shrink-0 text-zinc-500 transition', open && 'rotate-180')} />
                </button>

                {open && (
                  <div className="space-y-4 border-t border-zinc-800 p-4">
                    <div className="space-y-1 text-sm text-zinc-300">
                      {o.items.map((it, i) => (
                        <p key={i}>{it.qty}× {it.name}{it.format ? <span className="text-zinc-500"> ({it.format})</span> : null}</p>
                      ))}
                    </div>

                    {ps.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-zinc-700 p-4 text-center text-sm text-zinc-500">
                        Nenhum QR separado para este pedido ainda.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {ps.slice(0, THUMBS).map(p => (
                          <div key={p.id} className="group relative flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 pr-2.5">
                            <div className="rounded-md bg-white p-0.5"><QRCodeSVG value={productQrUrl(p, appUrl)} size={34} /></div>
                            <div className="leading-tight">
                              <p className="text-xs font-semibold text-zinc-200">{p.internalCode}</p>
                              <p className={cn('text-[10px]', printed.has(p.id) ? 'text-emerald-400' : 'text-zinc-500')}>
                                {printed.has(p.id) ? 'impresso' : 'a imprimir'}
                              </p>
                            </div>
                            <button onClick={() => unlink(o, [p.id])} title="Tirar deste pedido" aria-label={`Tirar ${p.internalCode} do pedido`}
                              className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-xs text-zinc-100 hover:bg-red-600 group-hover:flex focus:flex">
                              ×
                            </button>
                          </div>
                        ))}
                        {ps.length > THUMBS && <span className="self-center text-xs text-zinc-500">+{ps.length - THUMBS} outros</span>}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick={() => setPickerFor(o)}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500">
                        <Plus className="h-4 w-4" /> {ps.length ? 'Adicionar QR' : 'Selecionar QR'}
                      </button>
                      {ps.length > 0 && (
                        <>
                          <button onClick={() => doPrint(o, ps)}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500">
                            <Printer className="h-4 w-4" /> Imprimir adesivos
                          </button>
                          <button onClick={() => doZip(o, ps)} disabled={busy === `zip-${o.id}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-60">
                            <Download className="h-4 w-4" /> {busy === `zip-${o.id}` ? 'Gerando…' : 'Baixar PNG (ZIP)'}
                          </button>
                          <button onClick={() => printCodeList(ps, `Pedido ${o.order_number}`, lotCode)}
                            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800">
                            <ListOrdered className="h-4 w-4" /> Lista de códigos
                          </button>
                          <button onClick={() => markPrinted(ps.map(p => p.id), printedCount !== ps.length)}
                            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800">
                            <CheckCircle2 className="h-4 w-4" /> {printedCount === ps.length ? 'Desmarcar impressos' : 'Marcar como impressos'}
                          </button>
                          <button onClick={() => { if (confirm(`Tirar os ${ps.length} QR do pedido ${o.order_number}? Eles ficam livres para outro pedido.`)) void unlink(o, ps.map(p => p.id)); }}
                            className="ml-auto inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10">
                            <Link2Off className="h-4 w-4" /> Remover todos
                          </button>
                        </>
                      )}
                    </div>
                    <button onClick={onOpenOrders} className="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline">
                      Ver este pedido em Pedidos (status, rastreio e WhatsApp)
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {pickerFor && (
        <QrPicker
          order={pickerFor}
          needed={Math.max(needed(pickerFor) - (linksByOrder.get(pickerFor.id)?.length ?? 0), 1)}
          products={products}
          lots={lots}
          linkedIds={linkedIds}
          printed={printed}
          appUrl={appUrl}
          onClose={() => setPickerFor(null)}
          onConfirm={async ids => {
            const err = await onLink(pickerFor.id, ids);
            flash(err ? 'err' : 'ok', err ?? `${ids.length} QR vinculado(s) ao pedido ${pickerFor.order_number}.`);
            if (!err) { setPickerFor(null); setOpenId(pickerFor.id); }
          }}
        />
      )}
    </div>
  );
}

// ─── Seletor de QR Codes ─────────────────────────────────────────────────────
function QrPicker({ order, needed, products, lots, linkedIds, printed, appUrl, onClose, onConfirm }: {
  order: Order; needed: number; products: Product[]; lots: Lot[]; linkedIds: Set<string>; printed: Set<string>;
  appUrl: string; onClose: () => void; onConfirm: (ids: string[]) => Promise<void>;
}) {
  const [search, setSearch] = useState('');
  const [lotId, setLotId] = useState('');
  const [onlyFresh, setOnlyFresh] = useState(true);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [qty, setQty] = useState(needed);
  const [saving, setSaving] = useState(false);

  const eligible = useMemo(() => sortForLabels(products.filter(p =>
    !linkedIds.has(p.id) && !INELIGIBLE.has(p.status) &&
    (!lotId || p.lotId === lotId) && (!onlyFresh || !printed.has(p.id)) &&
    (!search.trim() || p.internalCode.toLowerCase().includes(search.trim().toLowerCase())))), [products, linkedIds, lotId, onlyFresh, printed, search]);

  const shown = eligible.slice(0, 120);
  const toggle = (id: string) => setSel(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const pickNext = () => setSel(new Set(eligible.slice(0, Math.max(qty, 0)).map(p => p.id)));

  return (
    <Modal isOpen onClose={onClose} title={`QR para o pedido ${order.order_number}`}
      description="Escolha os QR Codes que vão virar adesivos deste pedido. Cada QR só pode estar em um pedido." maxWidth="max-w-2xl">
      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar pelo código (ex.: AN-0001)" />
          <select value={lotId} onChange={e => setLotId(e.target.value)} aria-label="Filtrar por lote"
            className="h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-200 focus:outline-none">
            <option value="">Todos os lotes</option>
            {lots.filter(l => l.productLine !== 'GOOGLE').map(l => <option key={l.id} value={l.id}>{l.code}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={onlyFresh} onChange={e => setOnlyFresh(e.target.checked)} className="h-4 w-4 accent-indigo-500" />
            Só os ainda não impressos
          </label>
          <span className="ml-auto flex items-center gap-2">
            Pegar os próximos
            <input type="number" min={1} max={500} value={qty} onChange={e => setQty(Number(e.target.value) || 1)}
              className="h-8 w-16 rounded-lg border border-zinc-800 bg-zinc-900 px-2 text-center text-sm text-zinc-100 focus:outline-none" />
            <button onClick={pickNext} className="rounded-lg border border-zinc-700 px-3 py-1 text-xs hover:bg-zinc-800">Selecionar</button>
          </span>
        </div>

        {shown.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-700 p-6 text-center text-sm text-zinc-500">
            Nenhum QR disponível com esses filtros.
          </p>
        ) : (
          <div className="grid max-h-[40vh] grid-cols-2 gap-2 overflow-y-auto overscroll-contain pr-1 sm:grid-cols-3">
            {shown.map(p => {
              const on = sel.has(p.id);
              return (
                <button key={p.id} onClick={() => toggle(p.id)} aria-pressed={on}
                  className={cn('flex items-center gap-2 rounded-xl border p-2 text-left transition',
                    on ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-800 bg-zinc-950 hover:bg-zinc-800/50')}>
                  <div className="rounded-md bg-white p-0.5"><QRCodeSVG value={productQrUrl(p, appUrl)} size={30} /></div>
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-xs font-semibold text-zinc-200">{p.internalCode}</p>
                    <p className="truncate text-[10px] text-zinc-500">{p.status}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {eligible.length > shown.length && <p className="text-xs text-zinc-500">Mostrando {shown.length} de {eligible.length}. Use a busca ou “Pegar os próximos”.</p>}

        <div className="flex items-center justify-between gap-3 border-t border-zinc-800 pt-3">
          <p className="text-sm text-zinc-400"><strong className="text-zinc-100">{sel.size}</strong> selecionado(s)</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800">Cancelar</button>
            <button disabled={sel.size === 0 || saving}
              onClick={async () => { setSaving(true); await onConfirm([...sel]); setSaving(false); }}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
              {saving ? 'Salvando…' : 'Vincular ao pedido'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
