import { useMemo, useState } from 'react';
import {
  Bell, BellRing, CheckCircle2, ChevronDown, FileDown, FileSpreadsheet, MessageCircle,
  Package, Phone, Printer, RotateCcw, Search, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/adminUtils';
import { ORDER_STATUSES, isFinalized, type Order, type OrderStatus } from '@/lib/orders';
import { downloadOrdersCsv, downloadReceiptPng, fmtPhone, printReceipt } from '@/lib/orderReceipt';

interface Props {
  orders: Order[];
  loading: boolean;
  error: string | null;
  onSetStatus: (id: string, status: OrderStatus) => void;
  onMarkSeen: (id: string) => void;
  onFinalize: (id: string) => void;
  onReopen: (id: string) => void;
  onSaveNotes: (id: string, notes: string) => void;
  onDelete: (id: string) => void;
}

type Tab = 'abertos' | 'finalizados' | 'todos';

const brl = (n: number) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',')}`;
const fmtFull = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const monthKey = (iso: string) => iso.slice(0, 7); // AAAA-MM
const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

function timeAgo(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

function waLink(phone: string | null, order: Order) {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return null;
  const full = digits.length <= 11 ? `55${digits}` : digits;
  const msg = `Olá${order.customer_name ? `, ${order.customer_name}` : ''}! Aqui é da AirNext, sobre o seu pedido ${order.order_number}.`;
  return `https://wa.me/${full}?text=${encodeURIComponent(msg)}`;
}

export function OrdersView({ orders, loading, error, onSetStatus, onMarkSeen, onFinalize, onReopen, onSaveNotes, onDelete }: Props) {
  const [tab, setTab] = useState<Tab>('abertos');
  const [month, setMonth] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | OrderStatus>('todos');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  const finalizedAt = (o: Order) => o.finalized_at || o.updated_at || o.created_at;

  const stats = useMemo(() => {
    const fin = orders.filter(isFinalized);
    return {
      novos: orders.filter(o => o.status === 'novo').length,
      abertos: orders.filter(o => !isFinalized(o) && o.status !== 'cancelado').length,
      finalizados: fin.length,
      vendido: fin.reduce((a, o) => a + Number(o.subtotal || 0), 0),
    };
  }, [orders]);

  const months = useMemo(
    () => Array.from(new Set(orders.filter(isFinalized).map(o => monthKey(finalizedAt(o))))).sort().reverse(),
    [orders]
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = orders.filter(o => {
      const fin = isFinalized(o);
      if (tab === 'abertos' && (fin || o.status === 'cancelado')) return false;
      if (tab === 'finalizados') {
        if (!fin) return false;
        if (month !== 'todos' && monthKey(finalizedAt(o)) !== month) return false;
      }
      if (statusFilter !== 'todos' && o.status !== statusFilter) return false;
      if (!q) return true;
      return [o.order_number, o.customer_name, o.customer_phone, o.customer_phone?.replace(/\D/g, '')]
        .some(v => (v || '').toLowerCase().includes(q));
    });
    // Finalizados: do mais recente concluído para o mais antigo.
    return tab === 'finalizados'
      ? [...filtered].sort((a, b) => finalizedAt(b).localeCompare(finalizedAt(a)))
      : filtered;
  }, [orders, tab, month, statusFilter, query]);

  // Agrupa Finalizados por mês, com contagem e total.
  const groups = useMemo(() => {
    if (tab !== 'finalizados') return [{ key: '', label: '', items: list }];
    const map = new Map<string, Order[]>();
    list.forEach(o => {
      const k = monthKey(finalizedAt(o));
      map.set(k, [...(map.get(k) ?? []), o]);
    });
    return Array.from(map, ([key, items]) => ({ key, label: monthLabel(key), items }));
  }, [list, tab]);

  const toggle = (o: Order) => {
    setOpenId(prev => (prev === o.id ? null : o.id));
    if (!o.seen) onMarkSeen(o.id);
  };

  const askPermission = async () => {
    if (perm === 'unsupported') return;
    setPerm(await Notification.requestPermission());
  };

  const run = async (key: string, fn: () => Promise<void> | void) => {
    setBusy(key);
    try { await fn(); } catch (e) { alert(e instanceof Error ? e.message : 'Algo deu errado.'); } finally { setBusy(null); }
  };

  const exportCsv = () => {
    const suffix = tab === 'finalizados' ? (month === 'todos' ? 'finalizados' : `finalizados-${month}`) : tab;
    downloadOrdersCsv(list, `pedidos-airnext-${suffix}.csv`);
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'abertos', label: 'Em aberto', count: stats.abertos },
    { id: 'finalizados', label: 'Finalizados', count: stats.finalizados },
    { id: 'todos', label: 'Todos', count: orders.length },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Novos (sem resposta)', value: stats.novos, tone: 'text-indigo-300' },
          { label: 'Em aberto', value: stats.abertos, tone: 'text-amber-300' },
          { label: 'Finalizados', value: stats.finalizados, tone: 'text-emerald-300' },
          { label: 'Vendido (finalizados)', value: brl(stats.vendido), tone: 'text-zinc-100' },
        ].map(c => (
          <div key={c.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-xs text-zinc-500">{c.label}</p>
            <p className={cn('mt-1 text-2xl font-bold', c.tone)}>{c.value}</p>
          </div>
        ))}
      </div>

      {perm !== 'unsupported' && perm !== 'granted' && (
        <button
          onClick={askPermission}
          className="flex w-full items-center gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-left text-sm text-indigo-200 transition hover:bg-indigo-500/15"
        >
          <BellRing className="h-5 w-5 shrink-0" />
          <span>
            <strong>Ativar avisos no navegador</strong> — receba um alerta com som quando um pedido chegar, mesmo com o painel em segundo plano.
            {perm === 'denied' && ' (Estão bloqueados: libere nas configurações do site no navegador.)'}
          </span>
        </button>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          Não foi possível carregar os pedidos: {error}. Se for a primeira vez, rode os arquivos <code>sql/07_pedidos.sql</code> e <code>sql/08_pedidos_finalizados.sql</code> no SQL Editor do Supabase.
        </div>
      )}

      {/* Abas */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition',
              tab === t.id ? 'bg-indigo-500 text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            )}
          >
            {t.label} <span className={cn('ml-1 text-xs', tab === t.id ? 'text-indigo-100' : 'text-zinc-600')}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nº do pedido, nome ou telefone"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        {tab === 'finalizados' && (
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm capitalize text-zinc-100 focus:border-indigo-500 focus:outline-none"
          >
            <option value="todos">Todos os meses</option>
            {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        )}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
        >
          <option value="todos">Todos os status</option>
          {ORDER_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <button
          onClick={exportCsv}
          disabled={list.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-40"
          title="Baixa uma planilha (abre no Excel / Google Planilhas) com os pedidos desta lista"
        >
          <FileSpreadsheet className="h-4 w-4" /> Baixar planilha
        </button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-zinc-500">Carregando pedidos…</p>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-800 py-16 text-zinc-500">
          <Package className="h-8 w-8" />
          <p className="text-sm">
            {tab === 'finalizados' ? 'Nenhum pedido finalizado ainda. Use “Produto concluído” num pedido em aberto.' : 'Nenhum pedido encontrado.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(g => (
            <section key={g.key || 'all'} className="space-y-3">
              {tab === 'finalizados' && (
                <div className="flex items-baseline justify-between border-b border-zinc-800 pb-2">
                  <h3 className="text-sm font-semibold capitalize text-zinc-200">{g.label}</h3>
                  <p className="text-xs text-zinc-500">
                    {g.items.length} pedido{g.items.length > 1 ? 's' : ''} · {brl(g.items.reduce((a, o) => a + Number(o.subtotal || 0), 0))}
                  </p>
                </div>
              )}
              <ul className="space-y-3">
                {g.items.map(o => {
                  const st = ORDER_STATUSES.find(s => s.id === o.status) ?? ORDER_STATUSES[0];
                  const open = openId === o.id;
                  const link = waLink(o.customer_phone, o);
                  const fin = isFinalized(o);
                  return (
                    <li
                      key={o.id}
                      className={cn(
                        'overflow-hidden rounded-2xl border bg-zinc-900/60 transition',
                        o.seen ? 'border-zinc-800' : 'border-indigo-500/50 shadow-[0_0_0_1px_rgba(99,102,241,.25)]'
                      )}
                    >
                      <button onClick={() => toggle(o)} className="flex w-full items-center gap-3 p-4 text-left">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-zinc-100">{o.order_number}</span>
                            {!o.seen && <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Novo</span>}
                            <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium ring-1', st.badge)}>{st.label}</span>
                            {o.source === 'personalizador' && (
                              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">Personalizado</span>
                            )}
                          </div>
                          <p className="mt-1 truncate text-sm text-zinc-400">
                            {o.customer_name || 'Sem nome'} · {fmtPhone(o.customer_phone)}
                          </p>
                          <p className="text-xs text-zinc-600">
                            Pedido em {fmtFull(o.created_at)}{fin && o.finalized_at ? ` · concluído em ${fmtFull(o.finalized_at)}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-zinc-100">{o.subtotal > 0 ? brl(o.subtotal) : 'Sob consulta'}</p>
                          <p className="text-xs text-zinc-500">{timeAgo(o.created_at)}</p>
                        </div>
                        <ChevronDown className={cn('h-4 w-4 shrink-0 text-zinc-500 transition-transform', open && 'rotate-180')} />
                      </button>

                      {open && (
                        <div className="space-y-4 border-t border-zinc-800 p-4">
                          <div className="space-y-1.5">
                            {o.items.map((it, i) => (
                              <div key={i} className="flex items-start justify-between gap-3 text-sm">
                                <span className="text-zinc-300">
                                  {it.qty}× {it.name}
                                  {it.format ? <span className="text-zinc-500"> ({it.format})</span> : null}
                                </span>
                                <span className="shrink-0 text-zinc-400">{it.price > 0 ? brl(it.price * it.qty) : '—'}</span>
                              </div>
                            ))}
                          </div>

                          {o.notes && (
                            <div className="whitespace-pre-wrap rounded-xl bg-zinc-950/60 p-3 text-sm text-zinc-300">
                              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Observações do cliente</p>
                              {o.notes}
                            </div>
                          )}

                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block text-xs text-zinc-500">
                              Status do pedido
                              <select
                                value={o.status}
                                onChange={e => onSetStatus(o.id, e.target.value as OrderStatus)}
                                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                              >
                                {ORDER_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                              </select>
                            </label>
                            <label className="block text-xs text-zinc-500">
                              Anotações internas / código de rastreio
                              <textarea
                                defaultValue={o.admin_notes ?? ''}
                                onBlur={e => { if (e.target.value !== (o.admin_notes ?? '')) onSaveNotes(o.id, e.target.value); }}
                                rows={2}
                                placeholder="Ex.: pago via Pix · rastreio BR123456789BR"
                                className="mt-1 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
                              />
                            </label>
                          </div>

                          {/* Ação principal */}
                          {!fin && o.status !== 'cancelado' && (
                            <button
                              onClick={() => { if (confirm(`Marcar o pedido ${o.order_number} como PRODUTO CONCLUÍDO? Ele vai para a aba Finalizados, pronto para a produção.`)) onFinalize(o.id); }}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                            >
                              <CheckCircle2 className="h-5 w-5" /> Produto concluído — enviar para produção
                            </button>
                          )}
                          {fin && (
                            <button
                              onClick={() => { if (confirm(`Reabrir o pedido ${o.order_number}? Ele volta para a aba Em aberto.`)) onReopen(o.id); }}
                              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
                            >
                              <RotateCcw className="h-4 w-4" /> Reabrir pedido
                            </button>
                          )}

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => run(`png-${o.id}`, () => downloadReceiptPng(o))}
                              disabled={busy === `png-${o.id}`}
                              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
                            >
                              <FileDown className="h-4 w-4" /> {busy === `png-${o.id}` ? 'Gerando…' : 'Baixar nota'}
                            </button>
                            <button
                              onClick={() => { if (!printReceipt(o)) alert('O navegador bloqueou a janela. Libere pop-ups para este site e tente de novo.'); }}
                              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800"
                              title="Abre a janela de impressão — escolha “Salvar como PDF” para baixar em PDF"
                            >
                              <Printer className="h-4 w-4" /> Imprimir / PDF
                            </button>
                            {link && (
                              <a href={link} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl border border-emerald-600/50 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10">
                                <MessageCircle className="h-4 w-4" /> WhatsApp
                              </a>
                            )}
                            {o.customer_phone && (
                              <a href={`tel:${o.customer_phone.replace(/\D/g, '')}`}
                                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800">
                                <Phone className="h-4 w-4" /> Ligar
                              </a>
                            )}
                            <button
                              onClick={() => { if (confirm(`Apagar o pedido ${o.order_number}? Isso não pode ser desfeito.`)) onDelete(o.id); }}
                              className="ml-auto inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" /> Apagar
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-zinc-600">
        <Bell className="h-3.5 w-3.5" /> Novos pedidos aparecem aqui em tempo real, com aviso sonoro, em qualquer tela do painel.
      </p>
    </div>
  );
}
