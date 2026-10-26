import { useMemo, useState } from 'react';
import {
  Star,
  Plus,
  Lock,
  Unlock,
  Pencil,
  QrCode,
  ExternalLink,
  Download,
  Boxes,
  ListChecks,
  Loader2,
  Copy,
  Check,
  Nfc,
  RefreshCw,
  Wand2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { SearchBar } from '@/components/admin/ui/SearchBar';
import { Badge } from '@/components/admin/ui/Badge';
import { Modal } from '@/components/admin/ui/Modal';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { QrModal } from '@/components/admin/modules/ProductsView';
import { cn, exportCSV, formatDate } from '@/lib/adminUtils';
import {
  GOOGLE_CODE_PREFIX,
  GOOGLE_URL_HELP,
  isValidGoogleReviewUrl,
  normalizeGoogleReviewUrl,
} from '@/lib/googleReview';
import type { Customer, Lot, Product } from '@/types/admin';

/**
 * AirNext Google — gestão das plaquinhas de avaliação do Google.
 *
 * Seção exclusiva: lotes próprios, códigos ANG-… gerados no próprio banco e
 * ativação independente (o cliente só informa o link de avaliações; não cria
 * perfil nem escolhe categoria). O tipo do produto é definido aqui, ao criar o
 * lote, e nunca pelo cliente.
 */

type GState = 'pending_chip' | 'available' | 'active' | 'blocked' | 'other';

export function stateOf(p: Product): GState {
  if (p.status === 'Não programado') return 'pending_chip';
  if (p.status === 'Disponível para ativação') return 'available';
  if (p.status === 'Ativado' || p.status === 'Renovado' || p.status === 'Expirando') return 'active';
  if (p.status === 'Bloqueado') return 'blocked';
  return 'other';
}

export const STATE_LABEL: Record<GState, string> = {
  pending_chip: 'Aguardando chip',
  available: 'Pronta p/ ativar',
  active: 'Ativada',
  blocked: 'Bloqueada / erro',
  other: 'Outro',
};

/**
 * Sinais (semáforo) do status da plaquinha:
 *  🟢 verde    = ativada (funcionando)
 *  🟡 amarelo  = pronta para ativar
 *  🔴 vermelho = erro / bloqueada
 * "Aguardando chip" (laranja) e "Outro" (cinza) ainda não são sinais de pronto/erro.
 */
type Signal = 'green' | 'yellow' | 'red' | 'orange' | 'gray';
const SIGNAL_DOT: Record<Signal, string> = {
  green: 'bg-green-500 shadow-[0_0_8px_2px_rgba(34,197,94,0.65)]',
  yellow: 'bg-yellow-400 shadow-[0_0_8px_2px_rgba(250,204,21,0.65)]',
  red: 'bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.65)]',
  orange: 'bg-orange-400',
  gray: 'bg-zinc-500',
};
const STATE_SIGNAL: Record<GState, Signal> = {
  pending_chip: 'orange',
  available: 'yellow',
  active: 'green',
  blocked: 'red',
  other: 'gray',
};
export const STATE_STYLE: Record<GState, { color: string; dot: string }> = {
  pending_chip: { color: 'bg-orange-500/10 text-orange-400', dot: SIGNAL_DOT.orange },
  available: { color: 'bg-yellow-400/10 text-yellow-300', dot: SIGNAL_DOT.yellow },
  active: { color: 'bg-green-500/10 text-green-400', dot: SIGNAL_DOT.green },
  blocked: { color: 'bg-red-500/10 text-red-400', dot: SIGNAL_DOT.red },
  other: { color: 'bg-zinc-500/10 text-zinc-400', dot: SIGNAL_DOT.gray },
};

/** Luzinha de sinal (verde / amarelo / vermelho). */
function SignalLight({ signal, className }: { signal: Signal; className?: string }) {
  return <span aria-hidden className={cn('inline-block h-2.5 w-2.5 shrink-0 rounded-full', SIGNAL_DOT[signal], className)} />;
}

/** Situação do chip NFC da plaquinha (o QR Code funciona de qualquer forma). */
export function chipOf(p: Product): { label: string; color: string } {
  if (p.programmedAt) return { label: 'Gravado', color: 'bg-emerald-500/10 text-emerald-400' };
  if (p.status === 'Não programado') return { label: 'Aguardando', color: 'bg-orange-500/10 text-orange-400' };
  return { label: 'Só QR', color: 'bg-zinc-500/10 text-zinc-400' };
}
/** Mesma regra do Programador NFC: pode gravar chip quem ainda não foi gravado e não foi ativado. */
export const canProgram = (p: Product) => p.status === 'Não programado' || (p.status === 'Disponível para ativação' && !p.programmedAt);

type ScanStat = { total: number; last7: number; last30: number; nfc: number; qr: number; lastAt?: string };

const MAX_QUANTITY = 2000;
const PAGE_SIZE = 15;

interface GoogleViewProps {
  /** Somente plaquinhas da linha Google. */
  products: Product[];
  /** Somente lotes da linha Google. */
  lots: Lot[];
  customers: Customer[];
  appUrl: string;
  /** Escaneamentos (QR + NFC) por plaquinha, vindos do banco. */
  scans: Record<string, ScanStat>;
  onCreateLot: (data: { code: string; description?: string; quantity: number; notes?: string; withChip?: boolean }) => Promise<boolean>;
  /**
   * Exclui o lote Google. Com `deletePlates`, apaga também as plaquinhas ainda NÃO ativadas
   * por um cliente (as já ativadas são sempre preservadas, só perdem o vínculo com o lote).
   */
  onDeleteLot: (lotId: string, deletePlates: boolean) => Promise<boolean>;
  onBlock: (productId: string, blocked: boolean) => void;
  onSetRedirect: (productId: string, url: string) => Promise<boolean>;
  /** Abre o Programador NFC já com o lote / a plaquinha selecionados. */
  onProgramLot: (lotId: string) => void;
  onProgramProduct: (productId: string) => void;
  onReloadScans: () => void;
  /** Fixa a visão (usado quando a seção vive dentro de Lotes/Produtos): esconde as abas e o botão de criar. */
  view?: 'plates' | 'lots';
}

export function GoogleView({ products, lots, customers, appUrl, scans, onCreateLot, onDeleteLot, onBlock, onSetRedirect, onProgramLot, onProgramProduct, onReloadScans, view }: GoogleViewProps) {
  const [tabState, setTab] = useState<'plates' | 'lots'>('plates');
  const tab = view ?? tabState;
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<GState | 'all'>('all');
  const [lotFilter, setLotFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [qrTarget, setQrTarget] = useState<Product | null>(null);
  const [codesLot, setCodesLot] = useState<Lot | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lot | null>(null);

  const customerName = (id?: string) => (id ? customers.find((c) => c.id === id)?.name || 'Cliente' : '');
  const customerEmail = (id?: string) => (id ? customers.find((c) => c.id === id)?.email || '' : '');
  const lotCode = (id: string) => lots.find((l) => l.id === id)?.code || '—';

  const counts = useMemo(() => {
    const c = { total: products.length, pendingChip: 0, available: 0, active: 0, blocked: 0, scans30: 0 };
    for (const p of products) {
      const s = stateOf(p);
      c.scans30 += scans[p.id]?.last30 ?? 0;
      if (s === 'pending_chip') c.pendingChip++;
      else if (s === 'available') c.available++;
      else if (s === 'active') c.active++;
      else if (s === 'blocked') c.blocked++;
    }
    return c;
  }, [products, scans]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (stateFilter !== 'all' && stateOf(p) !== stateFilter) return false;
      if (lotFilter !== 'all' && p.lotId !== lotFilter) return false;
      if (!q) return true;
      return (
        p.activationCode.toLowerCase().includes(q) ||
        (p.redirectUrl || '').toLowerCase().includes(q) ||
        customerName(p.customerId).toLowerCase().includes(q) ||
        customerEmail(p.customerId).toLowerCase().includes(q) ||
        lotCode(p.lotId).toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, search, stateFilter, lotFilter, customers, lots]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((Math.min(page, totalPages) - 1) * PAGE_SIZE, Math.min(page, totalPages) * PAGE_SIZE);

  const lotStats = (lotId: string) => {
    const rows = products.filter((p) => p.lotId === lotId);
    return {
      total: rows.length,
      pendingChip: rows.filter((p) => stateOf(p) === 'pending_chip').length,
      scans: rows.reduce((a, p) => a + (scans[p.id]?.total ?? 0), 0),
      available: rows.filter((p) => stateOf(p) === 'available').length,
      active: rows.filter((p) => stateOf(p) === 'active').length,
      blocked: rows.filter((p) => stateOf(p) === 'blocked').length,
    };
  };

  const exportPlates = () =>
    exportCSV(
      `airnext-google-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((p) => ({
        Codigo: p.activationCode,
        Lote: lotCode(p.lotId),
        Status: STATE_LABEL[stateOf(p)],
        Chip: chipOf(p).label,
        Cliente: customerName(p.customerId),
        Email: customerEmail(p.customerId),
        LinkAvaliacoes: p.redirectUrl || '',
        AtivadaEm: p.activatedAt ? formatDate(p.activatedAt) : '',
        Escaneamentos: scans[p.id]?.total ?? 0,
        Escaneamentos30d: scans[p.id]?.last30 ?? 0,
      }))
    );

  const kpis: { label: string; value: number; tone: string; signal?: Signal }[] = [
    { label: 'Total de plaquinhas', value: counts.total, tone: 'text-zinc-100' },
    { label: 'Aguardando chip', value: counts.pendingChip, tone: 'text-orange-400' },
    { label: 'Prontas p/ ativar', value: counts.available, tone: 'text-yellow-300', signal: 'yellow' },
    { label: 'Ativadas', value: counts.active, tone: 'text-green-400', signal: 'green' },
    { label: 'Bloqueadas / erro', value: counts.blocked, tone: 'text-red-400', signal: 'red' },
    { label: 'Escaneamentos (30 dias)', value: counts.scans30, tone: 'text-sky-300' },
  ];

  return (
    <div className="space-y-6">
      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              {k.signal && <SignalLight signal={k.signal} className="h-2 w-2" />}
              {k.label}
            </p>
            <p className={cn('mt-1 text-2xl font-bold', k.tone)}>{k.value.toLocaleString('pt-BR')}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs text-zinc-400">
        <span className="font-medium text-zinc-500">Sinais:</span>
        <span className="inline-flex items-center gap-2"><SignalLight signal="green" /> Verde — ativada</span>
        <span className="inline-flex items-center gap-2"><SignalLight signal="yellow" /> Amarelo — pronta para ativar</span>
        <span className="inline-flex items-center gap-2"><SignalLight signal="red" /> Vermelho — erro / bloqueada</span>
      </div>

      <p className="text-xs text-zinc-500">
        As plaquinhas Google <strong className="text-zinc-400">não têm validade</strong>: o QR Code e o chip NFC funcionam para sempre e só deixam de redirecionar se você <strong className="text-zinc-400">bloquear</strong> a plaquinha. O chip NFC é opcional — o QR Code funciona sozinho.
      </p>

      {/* Abas + ações (somente quando a seção é usada sozinha) */}
      {!view && (
        <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          {([
            ['plates', 'Plaquinhas', ListChecks],
            ['lots', 'Lotes', Boxes],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                tab === id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
        >
          <Plus className="h-4 w-4" /> Gerar lote Google
        </button>
      </div>
        </>
      )}

      {/* ─── ABA: PLAQUINHAS ─── */}
      {tab === 'plates' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchBar
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Buscar por código, cliente, e-mail, link ou lote..."
              className="flex-1"
            />
            <select
              value={stateFilter}
              onChange={(e) => { setStateFilter(e.target.value as GState | 'all'); setPage(1); }}
              className="h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-200 outline-none"
            >
              <option value="all">Todos os status</option>
              <option value="pending_chip">Aguardando chip</option>
              <option value="available">Prontas p/ ativar</option>
              <option value="active">Ativadas</option>
              <option value="blocked">Bloqueadas / erro</option>
            </select>
            <select
              value={lotFilter}
              onChange={(e) => { setLotFilter(e.target.value); setPage(1); }}
              className="h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-200 outline-none"
            >
              <option value="all">Todos os lotes</option>
              {lots.map((l) => <option key={l.id} value={l.id}>{l.code}</option>)}
            </select>
            <button
              onClick={onReloadScans}
              title="Atualizar contagem de escaneamentos"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={exportPlates}
              disabled={filtered.length === 0}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-40"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>

          {products.length === 0 ? (
            <EmptyState
              title="Nenhuma plaquinha AirNext Google ainda"
              description="Crie o primeiro lote para gerar os códigos exclusivos (ANG-…) das plaquinhas de avaliação."
            />
          ) : filtered.length === 0 ? (
            <EmptyState title="Nenhuma plaquinha encontrada" description="Ajuste a busca ou os filtros." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Código</th>
                      <th className="px-4 py-3 font-medium">Lote</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Chip NFC</th>
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 font-medium">Link de avaliações</th>
                      <th className="px-4 py-3 font-medium">Ativada em</th>
                      <th className="px-4 py-3 font-medium">Escaneamentos</th>
                      <th className="px-4 py-3 text-right font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/70">
                    {pageRows.map((p) => {
                      const s = stateOf(p);
                      const blocked = s === 'blocked';
                      const activated = !!p.customerId;
                      return (
                        <tr key={p.id} className="transition-colors hover:bg-zinc-800/30">
                          <td className="px-4 py-3 font-mono text-xs text-zinc-200">{p.activationCode}</td>
                          <td className="px-4 py-3 text-zinc-400">{lotCode(p.lotId)}</td>
                          <td className="px-4 py-3">
                            <Badge variant="dot" colorClass={STATE_STYLE[s].color} dotColor={STATE_STYLE[s].dot}>{STATE_LABEL[s]}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge colorClass={chipOf(p).color}>{chipOf(p).label}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            {activated ? (
                              <div className="min-w-0">
                                <p className="truncate text-zinc-200">{customerName(p.customerId)}</p>
                                <p className="truncate text-xs text-zinc-500">{customerEmail(p.customerId)}</p>
                              </div>
                            ) : <span className="text-zinc-600">—</span>}
                          </td>
                          <td className="max-w-[260px] px-4 py-3">
                            {p.redirectUrl ? (
                              <a href={p.redirectUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex max-w-full items-center gap-1.5 truncate text-xs text-sky-400 hover:underline" title={p.redirectUrl}>
                                <ExternalLink className="h-3 w-3 shrink-0" />
                                <span className="truncate">{p.redirectUrl.replace(/^https:\/\//, '')}</span>
                              </a>
                            ) : <span className="text-zinc-600">—</span>}
                          </td>
                          <td className="px-4 py-3 text-zinc-400">{p.activatedAt ? formatDate(p.activatedAt) : '—'}</td>
                          <td className="px-4 py-3">
                            {scans[p.id] ? (
                              <div title={`NFC ${scans[p.id].nfc} · QR ${scans[p.id].qr} · últimos 7 dias ${scans[p.id].last7}`}>
                                <p className="text-sm font-semibold text-zinc-100">{scans[p.id].total.toLocaleString('pt-BR')}</p>
                                <p className="text-[11px] text-zinc-500">{scans[p.id].last30} em 30 dias{scans[p.id].lastAt ? ` · último ${formatDate(scans[p.id].lastAt!)}` : ''}</p>
                              </div>
                            ) : <span className="text-zinc-600">0</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <IconBtn title="Ver QR Code" onClick={() => setQrTarget(p)}><QrCode className="h-4 w-4" /></IconBtn>
                              {canProgram(p) && <IconBtn title="Gravar chip NFC no Programador" onClick={() => onProgramProduct(p.id)}><Nfc className="h-4 w-4" /></IconBtn>}
                              {activated && <IconBtn title="Editar link de avaliações" onClick={() => setEditTarget(p)}><Pencil className="h-4 w-4" /></IconBtn>}
                              {blocked ? (
                                <IconBtn title="Desbloquear" onClick={() => onBlock(p.id, false)}><Unlock className="h-4 w-4" /></IconBtn>
                              ) : s !== 'pending_chip' && (
                                <IconBtn title="Bloquear" danger onClick={() => onBlock(p.id, true)}><Lock className="h-4 w-4" /></IconBtn>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500">
                <span>{filtered.length.toLocaleString('pt-BR')} plaquinha(s)</span>
                <div className="flex items-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((x) => Math.max(1, x - 1))}
                    className="rounded-lg border border-zinc-800 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40">Anterior</button>
                  <span>Página {Math.min(page, totalPages)} de {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage((x) => Math.min(totalPages, x + 1))}
                    className="rounded-lg border border-zinc-800 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40">Próxima</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── ABA: LOTES ─── */}
      {tab === 'lots' && (
        lots.length === 0 ? (
          <EmptyState title="Nenhum lote AirNext Google" description="Crie um lote para gerar códigos únicos prontos para imprimir." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {lots.map((l) => {
              const st = lotStats(l.id);
              const pct = st.total ? Math.round((st.active / st.total) * 100) : 0;
              return (
                <div key={l.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 shrink-0 text-blue-400" />
                        <h3 className="truncate text-base font-semibold text-zinc-100">{l.code}</h3>
                      </div>
                      {l.description && <p className="mt-1 text-sm text-zinc-400">{l.description}</p>}
                      <p className="mt-1 text-xs text-zinc-500">Criado em {formatDate(l.createdAt)}</p>
                    </div>
                    <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">{st.total} códigos</span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
                    <div><p className="text-base font-bold text-orange-400">{st.pendingChip}</p><p className="text-zinc-500">Aguard. chip</p></div>
                    <div>
                      <p className="text-base font-bold text-yellow-300">{st.available}</p>
                      <p className="flex items-center justify-center gap-1 text-zinc-500"><SignalLight signal="yellow" className="h-1.5 w-1.5" /> Prontas</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-green-400">{st.active}</p>
                      <p className="flex items-center justify-center gap-1 text-zinc-500"><SignalLight signal="green" className="h-1.5 w-1.5" /> Ativadas</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-red-400">{st.blocked}</p>
                      <p className="flex items-center justify-center gap-1 text-zinc-500"><SignalLight signal="red" className="h-1.5 w-1.5" /> Erro</p>
                    </div>
                  </div>

                  <p className="mt-3 text-center text-xs text-zinc-500">{st.scans.toLocaleString('pt-BR')} escaneamentos no total</p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {st.pendingChip > 0 && (
                      <button onClick={() => onProgramLot(l.id)}
                        className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600">
                        <Nfc className="h-4 w-4" /> Gravar chips no Programador NFC ({st.pendingChip})
                      </button>
                    )}
                    <button onClick={() => setCodesLot(l)}
                      className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800">
                      Ver códigos
                    </button>
                    <button onClick={() => { setLotFilter(l.id); setStateFilter('all'); setSearch(''); setPage(1); setTab('plates'); }}
                      className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800">
                      Ver plaquinhas
                    </button>
                    <button onClick={() => setDeleteTarget(l)}
                      className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400">
                      <Trash2 className="h-4 w-4" /> Excluir lote
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      <CreateGoogleLotModal isOpen={createOpen} existingLots={lots} onClose={() => setCreateOpen(false)} onCreate={onCreateLot} />
      {editTarget && (
        <EditRedirectModal
          key={editTarget.id}
          product={editTarget}
          customerName={customerName(editTarget.customerId)}
          onClose={() => setEditTarget(null)}
          onSave={onSetRedirect}
        />
      )}
      <QrModal
        product={qrTarget}
        appUrl={appUrl}
        onClose={() => setQrTarget(null)}
        description="QR permanente da plaquinha AirNext Google. Pode ser impresso antes da venda: ao ser ativada, ele passa a levar direto às avaliações do cliente — e o destino pode ser trocado sem reimprimir."
      />
      {deleteTarget && (
        <DeleteGoogleLotModal
          key={deleteTarget.id}
          lot={deleteTarget}
          total={products.filter((p) => p.lotId === deleteTarget.id).length}
          activated={products.filter((p) => p.lotId === deleteTarget.id && !!p.customerId).length}
          onClose={() => setDeleteTarget(null)}
          onConfirm={onDeleteLot}
        />
      )}
      <LotCodesModal lot={codesLot} products={products.filter((p) => p.lotId === codesLot?.id)} customerName={customerName} onClose={() => setCodesLot(null)} />
    </div>
  );
}

function IconBtn({ children, title, onClick, danger }: { children: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        'rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800',
        danger ? 'hover:text-red-400' : 'hover:text-zinc-100'
      )}
    >
      {children}
    </button>
  );
}

/* ───────────── Modais ───────────── */

/**
 * Gera o próximo nome de lote livre no padrão GOO-AAAA-001, 002…
 * `taken` reúne nomes que NÃO podem ser repetidos além dos lotes existentes
 * (os já sugeridos nesta janela e o que está digitado), então cada clique em
 * "Gerar nome" devolve um nome diferente do anterior.
 */
function generateGoogleLotName(existing: Lot[], taken: Iterable<string> = []): string {
  const year = new Date().getFullYear();
  const prefix = `GOO-${year}-`;
  const used = new Set(existing.map((l) => l.code.toUpperCase()));
  for (const t of taken) used.add(t.trim().toUpperCase());
  let max = 0;
  used.forEach((c) => {
    if (c.startsWith(prefix)) {
      const n = parseInt(c.slice(prefix.length), 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
  });
  let n = max + 1;
  let name = `${prefix}${String(n).padStart(3, '0')}`;
  while (used.has(name)) { n++; name = `${prefix}${String(n).padStart(3, '0')}`; }
  return name;
}

export function CreateGoogleLotModal({
  isOpen, existingLots, onClose, onCreate,
}: {
  isOpen: boolean;
  existingLots: Lot[];
  onClose: () => void;
  onCreate: GoogleViewProps['onCreateLot'];
}) {
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [notes, setNotes] = useState('');
  const [withChip, setWithChip] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  /** Nomes já sugeridos nesta janela — nunca são sugeridos de novo. */
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const normalized = code.trim().toUpperCase();
  const duplicate = normalized.length > 0 && existingLots.some((l) => l.code.toUpperCase() === normalized);
  const qtyOk = Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_QUANTITY;
  const canSubmit = normalized.length > 0 && !duplicate && qtyOk && !submitting;

  const reset = () => { setCode(''); setDescription(''); setQuantity(100); setNotes(''); setWithChip(true); setSubmitting(false); setSuggestions([]); onClose(); };

  const suggestName = () => {
    const name = generateGoogleLotName(existingLots, [...suggestions, code]);
    setSuggestions((prev) => [...prev, name]);
    setCode(name);
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const ok = await onCreate({ code: normalized, description: description.trim() || undefined, quantity, notes: notes.trim() || undefined, withChip });
    setSubmitting(false);
    if (ok) reset();
  };

  if (!isOpen) return null;
  const input = 'h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700';
  return (
    <Modal isOpen onClose={reset} title="Novo lote AirNext Google"
      description={`Gera códigos únicos ${GOOGLE_CODE_PREFIX}-… que só servem para redirecionar às avaliações do Google.`}
      maxWidth="max-w-xl">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-zinc-500">Identificação do lote</label>
          <div className="mt-1 flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex: GOO-2026-001" className={cn(input, duplicate && 'border-red-500/60')} />
            <button
              type="button"
              onClick={suggestName}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
              title="Gerar um nome novo e diferente a cada clique"
            >
              <Wand2 className="h-3.5 w-3.5" /> Gerar nome
            </button>
          </div>
          {duplicate && <p className="mt-1 text-xs text-red-400">Já existe um lote com esse nome. Use "Gerar nome" para um livre.</p>}
          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-zinc-500">Nomes gerados:</span>
              {suggestions.slice(-6).map((name) => (
                <button key={name} type="button" onClick={() => setCode(name)}
                  className={cn(
                    'rounded-lg border px-2 py-1 font-mono text-[11px] transition-colors',
                    normalized === name ? 'border-blue-500/60 bg-blue-500/10 text-blue-300' : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                  )}>
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500">Quantidade de plaquinhas (1 a {MAX_QUANTITY})</label>
          <input type="number" min={1} max={MAX_QUANTITY} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}
            className={cn(input, 'mt-1', !qtyOk && 'border-red-500/60')} />
          {!qtyOk && <p className="mt-1 text-xs text-red-400">Informe um número inteiro entre 1 e {MAX_QUANTITY}.</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500">Descrição (opcional)</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Plaquinha 85x110 — 1ª tiragem" className={cn(input, 'mt-1')} />
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
          <p className="text-xs font-medium text-zinc-400">A plaquinha tem chip NFC?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {([
              [true, 'Com chip NFC', 'Passa pelo Programador NFC. Fica disponível só depois de gravada e validada.'],
              [false, 'Só QR Code', 'Já nasce disponível para imprimir e ativar. Dá para gravar o chip depois.'],
            ] as const).map(([val, title, hint]) => (
              <button key={title} type="button" onClick={() => setWithChip(val)}
                className={cn('rounded-xl border p-3 text-left transition-colors', withChip === val ? 'border-blue-500/60 bg-blue-500/10' : 'border-zinc-800 hover:bg-zinc-900')}>
                <p className={cn('text-sm font-semibold', withChip === val ? 'text-blue-300' : 'text-zinc-200')}>{title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{hint}</p>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500">Observações (opcional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={reset} disabled={submitting} className="rounded-xl border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800">Cancelar</button>
          <button onClick={submit} disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-40">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando códigos…</> : <>Gerar {qtyOk ? quantity : ''} códigos</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function DeleteGoogleLotModal({
  lot, total, activated, onClose, onConfirm,
}: {
  lot: Lot;
  /** Plaquinhas do lote. */
  total: number;
  /** Plaquinhas já ativadas por um cliente (nunca são apagadas). */
  activated: number;
  onClose: () => void;
  onConfirm: (lotId: string, deletePlates: boolean) => Promise<boolean>;
}) {
  const removable = total - activated;
  const [deletePlates, setDeletePlates] = useState(removable > 0);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    const ok = await onConfirm(lot.id, deletePlates && removable > 0);
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Modal isOpen onClose={busy ? () => {} : onClose} title={`Excluir lote — ${lot.code}`} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <p className="text-sm text-red-300">
            Tem certeza que deseja excluir o lote <strong>{lot.code}</strong>? Essa ação não pode ser desfeita.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
          <p>Este lote tem <strong className="text-zinc-200">{total}</strong> plaquinha(s): <strong className="text-green-400">{activated}</strong> já ativada(s) por clientes e <strong className="text-yellow-300">{removable}</strong> ainda não ativada(s).</p>
          {activated > 0 && (
            <p className="mt-1.5">As plaquinhas <strong className="text-zinc-200">ativadas nunca são apagadas</strong> — continuam funcionando e só perdem o vínculo com o lote.</p>
          )}
        </div>

        {removable > 0 && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 p-3 hover:bg-zinc-800/40">
            <input type="checkbox" checked={deletePlates} onChange={(e) => setDeletePlates(e.target.checked)} className="mt-0.5 h-4 w-4 accent-blue-500" />
            <span className="text-sm text-zinc-300">
              Excluir também as {removable} plaquinha(s) não ativada(s)
              <span className="mt-0.5 block text-xs text-zinc-500">Os códigos e QR Codes já impressos delas deixam de funcionar. Se desmarcar, elas ficam sem lote.</span>
            </span>
          </label>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button onClick={onClose} disabled={busy} className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-50">Cancelar</button>
          <button onClick={confirm} disabled={busy}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {busy ? 'Excluindo...' : 'Excluir lote'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function EditRedirectModal({
  product, customerName, onClose, onSave,
}: {
  product: Product;
  customerName: string;
  onClose: () => void;
  onSave: (id: string, url: string) => Promise<boolean>;
}) {
  // O pai monta este modal com key={product.id}: o estado nasce com o link atual.
  const [value, setValue] = useState(product.redirectUrl || '');
  const [busy, setBusy] = useState(false);

  const clean = normalizeGoogleReviewUrl(value);
  const valid = isValidGoogleReviewUrl(clean);
  const save = async () => {
    if (!valid) return;
    setBusy(true);
    const ok = await onSave(product.id, clean);
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title={`Editar link — ${product.activationCode}`}
      description={`Cliente: ${customerName || '—'}. A mudança vale na hora para o mesmo QR Code já impresso.`} maxWidth="max-w-lg">
      <div className="space-y-3">
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="https://g.page/r/..../review" autoFocus
          className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700" />
        {value.trim() && !valid && <p className="text-xs text-amber-400">{GOOGLE_URL_HELP}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} disabled={busy} className="rounded-xl border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800">Cancelar</button>
          <button onClick={save} disabled={!valid || busy}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-40">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Salvar link
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function LotCodesModal({
  lot, products, customerName, onClose,
}: {
  lot: Lot | null;
  products: Product[];
  customerName: (id?: string) => string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  if (!lot) return null;

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(products.map((p) => p.activationCode).join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard indisponível */ }
  };
  const exportLot = () =>
    exportCSV(`${lot.code}-codigos.csv`, products.map((p) => ({
      Codigo: p.activationCode,
      Status: STATE_LABEL[stateOf(p)],
      Chip: chipOf(p).label,
      LinkQR: p.nfcUrl ? `${p.nfcUrl}?s=qr` : '',
      LinkChipNFC: p.nfcUrl || '',
      Cliente: customerName(p.customerId),
      LinkAvaliacoes: p.redirectUrl || '',
    })));

  return (
    <Modal isOpen onClose={onClose} title={`Códigos — ${lot.code}`} description={`${products.length} códigos ${GOOGLE_CODE_PREFIX}-… deste lote.`} maxWidth="max-w-2xl">
      <div className="mb-3 flex gap-2">
        <button onClick={copyAll} className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800">
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />} {copied ? 'Copiado' : 'Copiar todos'}
        </button>
        <button onClick={exportLot} className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800">
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>
      <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500">
            <tr><th className="px-3 py-2 font-medium">Código</th><th className="px-3 py-2 font-medium">Status</th><th className="px-3 py-2 font-medium">Cliente</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {products.map((p) => {
              const s = stateOf(p);
              return (
                <tr key={p.id}>
                  <td className="px-3 py-2 font-mono text-xs text-zinc-200">{p.activationCode}</td>
                  <td className="px-3 py-2"><Badge variant="dot" colorClass={STATE_STYLE[s].color} dotColor={STATE_STYLE[s].dot}>{STATE_LABEL[s]}</Badge></td>
                  <td className="px-3 py-2 text-zinc-400">{customerName(p.customerId) || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

/**
 * "Ver chip" de um lote Google: situação do chip NFC de cada plaquinha
 * (Gravado / Aguardando / Só QR). O QR Code funciona de qualquer forma.
 */
export function LotChipsModal({
  lot, products, onClose, onProgramLot, onProgramProduct,
}: {
  lot: Lot | null;
  products: Product[];
  onClose: () => void;
  onProgramLot?: (lotId: string) => void;
  onProgramProduct?: (productId: string) => void;
}) {
  if (!lot) return null;

  const written = products.filter((p) => !!p.programmedAt).length;
  const pending = products.filter((p) => p.status === 'Não programado').length;
  const qrOnly = products.length - written - pending;
  const sorted = [...products].sort((a, b) => a.activationCode.localeCompare(b.activationCode));

  return (
    <Modal isOpen onClose={onClose} title={`Chips — ${lot.code}`}
      description="Situação do chip NFC de cada plaquinha. O QR Code funciona mesmo sem chip." maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"><p className="text-lg font-bold text-emerald-400">{written}</p><p className="text-zinc-500">Gravados</p></div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"><p className="text-lg font-bold text-orange-400">{pending}</p><p className="text-zinc-500">Aguardando</p></div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"><p className="text-lg font-bold text-zinc-300">{qrOnly}</p><p className="text-zinc-500">Só QR</p></div>
        </div>

        {onProgramLot && pending > 0 && (
          <button onClick={() => { onProgramLot(lot.id); onClose(); }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600">
            <Nfc className="h-4 w-4" /> Gravar chips no Programador NFC ({pending})
          </button>
        )}

        {sorted.length === 0 ? (
          <EmptyState title="Nenhuma plaquinha neste lote" />
        ) : (
          <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500">
                <tr><th className="px-3 py-2 font-medium">Código</th><th className="px-3 py-2 font-medium">Chip</th><th className="px-3 py-2 font-medium">Gravado em</th><th className="px-3 py-2" /></tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {sorted.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2 font-mono text-xs text-zinc-200">{p.activationCode}</td>
                    <td className="px-3 py-2"><Badge colorClass={chipOf(p).color}>{chipOf(p).label}</Badge></td>
                    <td className="px-3 py-2 text-xs text-zinc-400">
                      {p.programmedAt ? `${formatDate(p.programmedAt)}${p.programmedBy ? ` · ${p.programmedBy}` : ''}` : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {onProgramProduct && canProgram(p) && (
                        <button onClick={() => { onProgramProduct(p.id); onClose(); }} title="Gravar chip NFC no Programador"
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800">
                          <Nfc className="h-3.5 w-3.5" /> Gravar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
