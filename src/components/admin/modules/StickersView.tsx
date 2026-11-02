import { useMemo, useState } from 'react';
import {
  CheckCircle2, CheckSquare, Download, QrCode, RotateCcw, Square, Tag, Trash2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/adminUtils';
import { SearchBar } from '@/components/admin/ui/SearchBar';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { downloadQrPng, downloadQrZip, productQrUrl, sortForLabels } from '@/lib/labels';
import type { QrStickersApi } from '@/hooks/useQrStickers';
import type { Lot, Product } from '@/types/admin';

interface Props {
  stickers: QrStickersApi;
  /** Todos os produtos (padrão e Google) — de onde saem os QR Codes. */
  products: Product[];
  lots: Lot[];
  appUrl: string;
  onOpenLabels: () => void;
}

type Tab = 'falta' | 'baixados' | 'todos';

const PAGE = 90;
const fmtDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

export function StickersView({ stickers, products, lots, appUrl, onOpenLabels }: Props) {
  const { rows, byProduct, loading, error, unmark, markDownloaded, resetDownloaded } = stickers;
  const [tab, setTab] = useState<Tab>('falta');
  const [lotId, setLotId] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(PAGE);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const productById = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const lotCode = (p: Product) => lots.find(l => l.id === p.lotId)?.code ?? '';

  // Só entram os adesivos cujo produto ainda existe.
  const all = useMemo(
    () => sortForLabels(rows.map(r => productById.get(r.product_id)).filter((p): p is Product => !!p)),
    [rows, productById],
  );
  const isDone = (p: Product) => !!byProduct.get(p.id)?.downloaded_at;
  const counts = useMemo(() => {
    const done = all.filter(isDone).length;
    return { todos: all.length, baixados: done, falta: all.length - done };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, byProduct]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter(p => {
      if (lotId && p.lotId !== lotId) return false;
      if (tab === 'falta' && isDone(p)) return false;
      if (tab === 'baixados' && !isDone(p)) return false;
      return !q || p.internalCode.toLowerCase().includes(q) || p.activationCode.toLowerCase().includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, tab, lotId, search, byProduct]);

  const shown = list.slice(0, limit);
  const selectedProducts = useMemo(() => all.filter(p => selected.has(p.id)), [all, selected]);
  const allListSelected = list.length > 0 && list.every(p => selected.has(p.id));

  const flash = (type: 'ok' | 'err', text: string) => { setMsg({ type, text }); window.setTimeout(() => setMsg(null), 6000); };
  const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectList = () => setSelected(prev => new Set([...prev, ...list.map(p => p.id)]));
  const unselectList = () => setSelected(prev => { const n = new Set(prev); list.forEach(p => n.delete(p.id)); return n; });

  const download = async (ps: Product[], title: string) => {
    if (ps.length === 0 || busy) return;
    setBusy(true);
    try {
      if (ps.length === 1) await downloadQrPng(ps[0], appUrl);
      else await downloadQrZip(ps, appUrl, title);
      const err = await markDownloaded(ps.map(p => p.id));
      flash(err ? 'err' : 'ok', err ?? `${ps.length} QR baixado(s) e marcado(s) como baixados.`);
      setSelected(new Set());
    } catch {
      flash('err', 'Não foi possível gerar os QR Codes. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (ps: Product[]) => {
    if (!confirm(`Tirar ${ps.length} QR da lista de adesivos? Eles voltam a ser QR comuns em Etiquetas & Gravação.`)) return;
    const err = await unmark(ps.map(p => p.id));
    flash(err ? 'err' : 'ok', err ?? 'Removido da lista de adesivos.');
    setSelected(prev => { const n = new Set(prev); ps.forEach(p => n.delete(p.id)); return n; });
  };
  const reset = async (ps: Product[]) => {
    const err = await resetDownloaded(ps.map(p => p.id));
    flash(err ? 'err' : 'ok', err ?? 'Voltou para “falta baixar”.');
  };
  const markDone = async (ps: Product[]) => {
    const err = await markDownloaded(ps.map(p => p.id));
    flash(err ? 'err' : 'ok', err ?? `${ps.length} marcado(s) como já baixado(s).`);
  };

  const tabBtn = (id: Tab, label: string) => (
    <button key={id} onClick={() => { setTab(id); setLimit(PAGE); }}
      className={cn('rounded-lg px-3 py-1.5 text-sm font-medium transition',
        tab === id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200')}>
      {label} <span className="ml-1 text-xs text-zinc-500">{counts[id]}</span>
    </button>
  );

  const selectedPending = selectedProducts.filter(p => !isDone(p));
  const selectedDone = selectedProducts.filter(isDone);

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Adesivos na lista', value: counts.todos, icon: Tag, tone: 'text-indigo-300' },
          { label: 'Falta baixar', value: counts.falta, icon: QrCode, tone: 'text-amber-300' },
          { label: 'Já baixados', value: counts.baixados, icon: CheckCircle2, tone: 'text-emerald-300' },
        ].map(c => (
          <div key={c.label} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <c.icon className={cn('mb-2 h-5 w-5', c.tone)} />
            <p className="text-2xl font-semibold text-zinc-100">{c.value}</p>
            <p className="text-xs text-zinc-500">{c.label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          Para guardar os adesivos, rode o script <strong>sql/25_adesivos_qr.sql</strong> no Supabase.
          <span className="mt-1 block text-xs text-amber-300/70">{error}</span>
        </div>
      )}
      {msg && (
        <div role="status" className={cn('rounded-xl border p-3 text-sm',
          msg.type === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-red-500/30 bg-red-500/10 text-red-200')}>
          {msg.text}
        </div>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4">
        <Tag className="mt-0.5 h-5 w-5 shrink-0 text-indigo-300" />
        <p className="text-xs text-indigo-300/90">
          Aqui ficam os QR Codes que você marcou como <strong>Adesivo</strong> em{' '}
          <button onClick={onOpenLabels} className="font-semibold underline underline-offset-2 hover:text-indigo-200">Etiquetas &amp; Gravação</button>.
          Quando você baixa um deles (aqui ou lá), ele passa para <strong>Já baixados</strong> com data e hora — assim você sabe o que ainda falta baixar.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1 self-start rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          {tabBtn('falta', 'Falta baixar')}{tabBtn('baixados', 'Já baixados')}{tabBtn('todos', 'Todos')}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select value={lotId} onChange={e => { setLotId(e.target.value); setLimit(PAGE); }} aria-label="Filtrar por lote"
            className="h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-300 outline-none">
            <option value="">Todos os lotes</option>
            {lots.map(l => <option key={l.id} value={l.id}>{l.code}{l.productLine === 'GOOGLE' ? ' · Google' : ''}</option>)}
          </select>
          <SearchBar value={search} onChange={v => { setSearch(v); setLimit(PAGE); }} placeholder="Buscar pelo código (ex.: AN-0001)" className="sm:w-72" />
        </div>
      </div>

      {/* Barra de ações */}
      <div className="flex flex-col gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-300">
          <span className="font-semibold text-sky-300">{selectedProducts.length}</span> selecionado(s)
          <span className="ml-2 text-xs text-zinc-500">{list.length} na lista atual</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={allListSelected ? unselectList : selectList} disabled={list.length === 0}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50">
            {allListSelected ? <Square className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
            {allListSelected ? `Desmarcar os ${list.length}` : `Selecionar todos (${list.length})`}
          </button>
          {selectedPending.length > 0 && (
            <button onClick={() => markDone(selectedPending)}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800">
              <CheckCircle2 className="h-4 w-4" /> Já baixei ({selectedPending.length})
            </button>
          )}
          {selectedDone.length > 0 && (
            <button onClick={() => reset(selectedDone)}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800">
              <RotateCcw className="h-4 w-4" /> Voltar p/ “falta baixar” ({selectedDone.length})
            </button>
          )}
          {selectedProducts.length > 0 && (
            <button onClick={() => remove(selectedProducts)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
              <Trash2 className="h-4 w-4" /> Tirar da lista
            </button>
          )}
          <button onClick={() => download(selectedProducts, 'adesivos-selecionados')} disabled={selectedProducts.length === 0 || busy}
            className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50">
            <Download className="h-4 w-4" />
            {busy ? 'Gerando…' : selectedProducts.length === 1 ? 'Baixar QR (PNG)' : `Baixar ${selectedProducts.length} (ZIP)`}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-zinc-900" />
      ) : list.length === 0 ? (
        <EmptyState
          title={all.length === 0 ? 'Nenhum adesivo marcado ainda' : tab === 'falta' ? 'Tudo baixado por aqui 🎉' : 'Nada encontrado'}
          description={all.length === 0
            ? 'Em Etiquetas & Gravação, clique em “Adesivo” no cartão do QR Code (ou selecione vários e use “Marcar como adesivo”).'
            : 'Ajuste a busca, o lote ou troque de aba.'}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {shown.map(p => {
              const st = byProduct.get(p.id);
              const done = !!st?.downloaded_at;
              const on = selected.has(p.id);
              return (
                <div key={p.id}
                  className={cn('group relative rounded-2xl border bg-zinc-900 p-3 text-center transition',
                    on ? 'border-sky-400 ring-2 ring-sky-400/60' : 'border-zinc-800 hover:border-zinc-700')}>
                  <label className="absolute left-2 top-2 cursor-pointer">
                    <input type="checkbox" checked={on} onChange={() => toggle(p.id)} className="h-4 w-4 accent-sky-500" aria-label={`Selecionar ${p.internalCode}`} />
                  </label>
                  <span className={cn('absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1',
                    done ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30' : 'bg-amber-500/10 text-amber-300 ring-amber-500/30')}>
                    {done ? 'Baixado' : 'Falta'}
                  </span>
                  <div className="mx-auto mt-6 w-fit rounded-lg bg-white p-1.5">
                    <QRCodeSVG value={productQrUrl(p, appUrl)} size={64} level="M" />
                  </div>
                  <p className="mt-2 font-mono text-sm font-bold text-zinc-100">{p.internalCode}</p>
                  <p className="text-[11px] text-zinc-500">{lotCode(p) || '—'}</p>
                  <p className="mt-1 min-h-[1.75rem] text-[10px] leading-tight text-zinc-500">
                    {done ? <>Baixado em {fmtDateTime(st?.downloaded_at)}{(st?.download_count ?? 0) > 1 ? ` · ${st?.download_count}×` : ''}</> : `Marcado em ${fmtDateTime(st?.marked_at)}`}
                  </p>
                  <button onClick={() => download([p], p.internalCode)} disabled={busy}
                    className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-950 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50">
                    <Download className="h-3.5 w-3.5" /> {done ? 'Baixar de novo' : 'Baixar'}
                  </button>
                </div>
              );
            })}
          </div>
          {list.length > shown.length && (
            <div className="text-center">
              <button onClick={() => setLimit(l => l + PAGE)}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800">
                Mostrar mais ({list.length - shown.length} restantes)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
