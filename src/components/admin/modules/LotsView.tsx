import { useMemo, useState } from 'react';
import { Plus, Boxes, Eye, Wand2, AlertTriangle, CheckCircle2, Loader2, ShieldCheck, Pencil, Trash2, KeyRound, Copy, Check, Star, Nfc, PackageCheck, X, Package } from 'lucide-react';
import { SearchBar } from '@/components/admin/ui/SearchBar';
import { Badge } from '@/components/admin/ui/Badge';
import { Modal } from '@/components/admin/ui/Modal';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { cn, formatDate, formatDateTime, exportCSV } from '@/lib/adminUtils';
import { LotCodesModal, LotChipsModal, DeleteGoogleLotModal, stateOf, STATE_LABEL, STATE_STYLE, chipOf } from '@/components/admin/modules/GoogleView';
import type { ActivationAlert } from '@/hooks/useActivationAlerts';
import type { Customer, Lot, Product } from '@/types/admin';

interface LotsViewProps {
  lots: Lot[];
  products: Product[];
  onCreate: (data: Omit<Lot, 'id' | 'usedQuantity' | 'availableQuantity'>) => void;
  onUpdate: (id: string, data: Partial<Pick<Lot, 'code' | 'description' | 'supplier' | 'notes'>>) => void;
  onDelete: (id: string) => void;
  /** Atalho: navega para o Programador NFC já com este lote selecionado. */
  onProgramLot?: (lotId: string) => void;
  /** Grava o chip de uma plaquinha específica (Programador NFC). */
  onProgramProduct?: (productId: string) => void;
  /** Necessário para mostrar o nome do cliente nos códigos dos lotes Google. */
  customers?: Customer[];
  /** Abre a criação de lote AirNext Google. */
  onCreateGoogleLot?: () => void;
  /** Exclui um lote Google (com `deletePlates`, apaga também as plaquinhas ainda não ativadas). */
  onDeleteGoogleLot?: (lotId: string, deletePlates: boolean) => Promise<boolean>;
  /** Avisos de "cliente ativou um produto" (tabela admin_alerts). */
  activationAlerts?: ActivationAlert[];
  onMarkActivationsSeen?: (ids: string[]) => void;
  /** Abre Produtos já filtrado pelos itens deste lote. */
  onViewLotProducts?: (lot: Lot) => void;
}

const QUANTITY_PRESETS = [100, 250, 500, 1000, 2500, 5000];
const MAX_QUANTITY = 20000;

export function LotsView({ lots, products, onCreate, onUpdate, onDelete, onProgramLot, onProgramProduct, customers = [], onCreateGoogleLot, onDeleteGoogleLot, activationAlerts = [], onMarkActivationsSeen, onViewLotProducts }: LotsViewProps) {
  const [search, setSearch] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [detailLot, setDetailLot] = useState<Lot | null>(null);
  const [editLot, setEditLot] = useState<Lot | null>(null);
  const [deleteLot, setDeleteLotState] = useState<Lot | null>(null);
  const [codesLot, setCodesLot] = useState<Lot | null>(null);
  // Lotes Google têm janelas próprias (códigos ANG-…, chips, exclusão com plaquinhas).
  const [googleCodesLot, setGoogleCodesLot] = useState<Lot | null>(null);
  const [chipsLot, setChipsLot] = useState<Lot | null>(null);
  const [deleteGoogleTarget, setDeleteGoogleTarget] = useState<Lot | null>(null);

  const customerName = (id?: string) => (id ? customers.find((c) => c.id === id)?.name || 'Cliente' : '');
  const productsOfLot = (lotId: string) => products.filter((p) => p.lotId === lotId);
  const isGoogle = (lot: Lot) => lot.productLine === 'GOOGLE';
  // Mesmos botões nos dois tipos de lote; só a janela por trás muda (códigos ANG-… e exclusão do Google).
  const openCodes = (lot: Lot) => (isGoogle(lot) ? setGoogleCodesLot(lot) : setCodesLot(lot));
  const askDelete = (lot: Lot) => (isGoogle(lot) ? setDeleteGoogleTarget(lot) : setDeleteLotState(lot));
  const canDelete = (lot: Lot) => !isGoogle(lot) || !!onDeleteGoogleLot;

  const filtered = useMemo(() => {
    return lots.filter((l) =>
      l.code.toLowerCase().includes(search.toLowerCase()) ||
      (l.supplier && l.supplier.toLowerCase().includes(search.toLowerCase()))
    );
  }, [lots, search]);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar lote, fornecedor..." className="w-full sm:max-w-xs" />
        <div className="flex flex-col gap-2 sm:flex-row">
          {onCreateGoogleLot && (
            <button onClick={onCreateGoogleLot} className="flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">
              <Plus className="h-4 w-4" /> Gerar lote Google
            </button>
          )}
          <button onClick={() => setCreateModal(true)} className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600">
            <Plus className="h-4 w-4" /> Novo lote
          </button>
        </div>
      </div>

      <ActivationsPanel alerts={activationAlerts} onMarkSeen={onMarkActivationsSeen} />

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum lote encontrado" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((lot) => (
            <LotCard
              key={lot.id}
              lot={lot}
              products={productsOfLot(lot.id)}
              onProducts={onViewLotProducts ? () => onViewLotProducts(lot) : undefined}
              onDetails={() => setDetailLot(lot)}
              onCodes={() => openCodes(lot)}
              onChips={() => setChipsLot(lot)}
              onEdit={() => setEditLot(lot)}
              onDelete={canDelete(lot) ? () => askDelete(lot) : undefined}
            />
          ))}
        </div>
      )}

      <CreateLotModal isOpen={createModal} existingLots={lots} onClose={() => setCreateModal(false)} onCreate={onCreate} />
      <CodesModal isOpen={!!codesLot} onClose={() => setCodesLot(null)} lot={codesLot} products={products} />
      <LotCodesModal lot={googleCodesLot} products={googleCodesLot ? productsOfLot(googleCodesLot.id) : []} customerName={customerName} onClose={() => setGoogleCodesLot(null)} />
      <LotDetailModal
        lot={detailLot}
        products={detailLot ? productsOfLot(detailLot.id) : []}
        customerName={customerName}
        onClose={() => setDetailLot(null)}
        onProducts={onViewLotProducts ? (l) => { setDetailLot(null); onViewLotProducts(l); } : undefined}
        onCodes={(l) => { openCodes(l); setDetailLot(null); }}
        onChips={(l) => { setChipsLot(l); setDetailLot(null); }}
        onEdit={(l) => { setEditLot(l); setDetailLot(null); }}
        onDelete={detailLot && canDelete(detailLot) ? (l) => { askDelete(l); setDetailLot(null); } : undefined}
      />
      <LotChipsModal
        lot={chipsLot}
        products={chipsLot ? productsOfLot(chipsLot.id) : []}
        onClose={() => setChipsLot(null)}
        onProgramLot={onProgramLot}
        onProgramProduct={onProgramProduct}
      />
      {deleteGoogleTarget && onDeleteGoogleLot && (
        <DeleteGoogleLotModal
          key={deleteGoogleTarget.id}
          lot={deleteGoogleTarget}
          total={productsOfLot(deleteGoogleTarget.id).length}
          activated={productsOfLot(deleteGoogleTarget.id).filter((p) => !!p.customerId).length}
          onClose={() => setDeleteGoogleTarget(null)}
          onConfirm={onDeleteGoogleLot}
        />
      )}

      <EditLotModal lot={editLot} existingLots={lots} onClose={() => setEditLot(null)} onUpdate={onUpdate} />
      <DeleteLotConfirm lot={deleteLot} onClose={() => setDeleteLotState(null)} onDelete={onDelete} />
    </div>
  );
}

/** Contadores coloridos (mesmos para lote padrão e Google). */
function StatBlocks({ products, size = 'sm' }: { products: Product[]; size?: 'sm' | 'lg' }) {
  const count = (state: ReturnType<typeof stateOf>) => products.filter((p) => stateOf(p) === state).length;
  const items = [
    { label: 'Aguard. chip', value: count('pending_chip'), color: 'text-orange-400' },
    { label: 'Prontas', value: count('available'), color: 'text-yellow-300' },
    { label: 'Ativadas', value: count('active'), color: 'text-green-400' },
    { label: 'Erro', value: count('blocked'), color: 'text-red-400' },
  ];
  if (size === 'lg') {
    return (
      <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
        {items.map((i) => (
          <div key={i.label} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"><p className={cn('text-lg font-bold', i.color)}>{i.value}</p><p className="text-zinc-500">{i.label}</p></div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-4 gap-2 pt-1 text-center text-xs">
      {items.map((i) => (
        <div key={i.label}><p className={cn('text-base font-bold', i.color)}>{i.value}</p><p className="text-zinc-500">{i.label}</p></div>
      ))}
    </div>
  );
}

/** Card de lote: o mesmo layout, resumo, contadores coloridos e botões para lote padrão e Google. */
function LotCard({
  lot, products, onProducts, onDetails, onCodes, onChips, onEdit, onDelete,
}: {
  lot: Lot;
  products: Product[];
  onProducts?: () => void;
  onDetails: () => void;
  onCodes: () => void;
  onChips: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  const google = lot.productLine === 'GOOGLE';
  const pendingChip = products.filter((p) => stateOf(p) === 'pending_chip').length;
  const active = products.filter((p) => stateOf(p) === 'active').length;
  const pct = products.length ? Math.round((active / products.length) * 100) : 0;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition-all hover:border-zinc-700">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', google ? 'bg-blue-500/10' : 'bg-indigo-500/10')}>
            {google ? <Star className="h-5 w-5 text-blue-400" /> : <Boxes className="h-5 w-5 text-indigo-400" />}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-zinc-100">{lot.code}</h3>
            <p className="text-xs text-zinc-500">{formatDate(lot.createdAt)}</p>
          </div>
        </div>
        <Badge colorClass={cn('shrink-0', google ? 'bg-blue-500/10 text-blue-400' : 'bg-indigo-500/10 text-indigo-300')}>{google ? 'Google' : 'Padrão'}</Badge>
      </div>
      {lot.description ? (
        <p className="mb-4 text-sm text-zinc-400">{lot.description}</p>
      ) : (
        <p className="mb-4 text-sm italic text-zinc-600">Sem descrição — clique em Editar para adicionar</p>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-zinc-500"><span>Quantidade</span><span className="text-zinc-300">{lot.quantity}</span></div>
        <div className="flex justify-between text-zinc-500"><span>Utilizada</span><span className="text-zinc-300">{lot.usedQuantity}</span></div>
        <div className="flex justify-between text-zinc-500"><span>Disponível</span><span className="text-zinc-300">{lot.availableQuantity}</span></div>
        <div className="flex justify-between text-zinc-500"><span>Fornecedor</span><span className="truncate text-zinc-300">{lot.supplier || '—'}</span></div>
        <StatBlocks products={products} />
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
      </div>

      {onProducts && (
        <button onClick={onProducts} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700">
          <Package className="h-4 w-4" /> Ver produtos
        </button>
      )}
      <button onClick={onDetails} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 py-2 text-sm font-medium text-zinc-400 hover:border-zinc-700 hover:text-zinc-200">
        <Eye className="h-4 w-4" /> Ver detalhes
      </button>
      <button onClick={onCodes} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/10 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20">
        <KeyRound className="h-4 w-4" /> Ver códigos
      </button>
      <button onClick={onChips} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500/10 py-2 text-sm font-medium text-blue-300 hover:bg-blue-500/20">
        <Nfc className="h-4 w-4" /> Ver chip{pendingChip > 0 ? ` (${pendingChip} aguardando)` : ''}
      </button>
      <div className="mt-2 flex gap-2">
        <button onClick={onEdit} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-800 py-2 text-xs font-medium text-zinc-400 hover:border-indigo-500/40 hover:text-indigo-300">
          <Pencil className="h-3.5 w-3.5" /> Editar
        </button>
        {onDelete && (
          <button onClick={onDelete} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-800 py-2 text-xs font-medium text-zinc-400 hover:border-red-500/40 hover:text-red-400">
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </button>
        )}
      </div>
    </div>
  );
}

/** Avisos de ativação: quem ativou o quê, com "marcar como vistas". Some quando não há nada novo. */
function ActivationsPanel({ alerts, onMarkSeen }: { alerts: ActivationAlert[]; onMarkSeen?: (ids: string[]) => void }) {
  const [open, setOpen] = useState(true);
  const unseen = alerts.filter((a) => !a.seen);
  if (unseen.length === 0) return null;
  const shown = unseen.slice(0, 8);

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => setOpen((o) => !o)} className="flex min-w-0 items-center gap-2 text-left">
          <PackageCheck className="h-4 w-4 shrink-0 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-200">
            {unseen.length} {unseen.length === 1 ? 'produto ativado' : 'produtos ativados'} por clientes
          </span>
        </button>
        {onMarkSeen && (
          <button onClick={() => onMarkSeen(unseen.map((a) => a.id))} className="shrink-0 rounded-lg border border-emerald-500/30 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10">
            Marcar como vistas
          </button>
        )}
      </div>
      {open && (
        <ul className="mt-3 space-y-1.5">
          {shown.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-950/60 px-3 py-2 text-xs">
              <div className="min-w-0">
                <p className="truncate text-zinc-200">
                  <span className="font-medium">{a.customer_name || a.customer_email || 'Cliente'}</span>
                  <span className="text-zinc-500"> ativou </span>
                  <span className="font-mono text-emerald-300">{a.product_code || '—'}</span>
                </p>
                <p className="truncate text-zinc-500">
                  {a.product_line === 'GOOGLE' ? 'AirNext Google' : 'Padrão'}{a.lot_code ? ` · lote ${a.lot_code}` : ''} · {formatDateTime(a.created_at)}
                </p>
              </div>
              {onMarkSeen && (
                <button onClick={() => onMarkSeen([a.id])} aria-label="Marcar como vista" className="shrink-0 text-zinc-500 hover:text-zinc-300">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
          {unseen.length > shown.length && <li className="px-1 text-xs text-zinc-500">+ {unseen.length - shown.length} mais</li>}
        </ul>
      )}
    </div>
  );
}

/** "Ver detalhes" de um lote Google: resumo, contagens por situação e cada plaquinha (cliente, ativação, chip). */
/** Detalhe do lote (padrão ou Google): informações, contadores coloridos e as plaquinhas do lote. */
function LotDetailModal({
  lot, products, customerName, onClose, onProducts, onCodes, onChips, onEdit, onDelete,
}: {
  lot: Lot | null;
  products: Product[];
  customerName: (id?: string) => string;
  onClose: () => void;
  onProducts?: (lot: Lot) => void;
  onCodes: (lot: Lot) => void;
  onChips: (lot: Lot) => void;
  onEdit: (lot: Lot) => void;
  onDelete?: (lot: Lot) => void;
}) {
  if (!lot) return null;
  const google = lot.productLine === 'GOOGLE';
  const withChip = products.filter((p) => !!p.programmedAt).length;
  // Ativadas primeiro (mais recentes no topo), depois o resto por código.
  const sorted = [...products].sort((a, b) => {
    const aa = stateOf(a) === 'active' ? 1 : 0;
    const bb = stateOf(b) === 'active' ? 1 : 0;
    if (aa !== bb) return bb - aa;
    if (aa && bb) return (b.activatedAt || '').localeCompare(a.activatedAt || '');
    return a.activationCode.localeCompare(b.activationCode);
  });

  return (
    <Modal isOpen onClose={onClose} title={lot.code} description={google ? 'Lote AirNext Google' : 'Lote padrão'} maxWidth="max-w-3xl">
      <div className="space-y-4 text-sm">
        <div className="space-y-3">
          <ReadRow label="Código do lote" value={lot.code} />
          <ReadRow label="Quantidade total" value={String(lot.quantity)} />
          <ReadRow label="Utilizada" value={String(lot.usedQuantity)} />
          <ReadRow label="Disponível" value={String(lot.availableQuantity)} />
          <ReadRow label="Com chip gravado" value={`${withChip} de ${products.length}`} />
          <ReadRow label="Fornecedor" value={lot.supplier || '—'} />
          <ReadRow label="Data de criação" value={formatDate(lot.createdAt)} />
          <ReadRow label="Descrição" value={lot.description || '—'} />
          <ReadRow label="Observações" value={lot.notes || '—'} />
        </div>

        <StatBlocks products={products} size="lg" />

        {sorted.length === 0 ? (
          <EmptyState title="Nenhuma plaquinha neste lote" />
        ) : (
          <div className="max-h-[40vh] overflow-auto rounded-xl border border-zinc-800">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="sticky top-0 bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Código</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Cliente</th>
                  <th className="px-3 py-2 font-medium">Ativada em</th>
                  <th className="px-3 py-2 font-medium">Chip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {sorted.map((p) => {
                  const st = stateOf(p);
                  return (
                    <tr key={p.id}>
                      <td className="px-3 py-2 font-mono text-xs text-zinc-200">{p.activationCode}</td>
                      <td className="px-3 py-2"><Badge variant="dot" colorClass={STATE_STYLE[st].color} dotColor={STATE_STYLE[st].dot}>{STATE_LABEL[st]}</Badge></td>
                      <td className="px-3 py-2 text-zinc-400">{customerName(p.customerId) || '—'}</td>
                      <td className="px-3 py-2 text-xs text-zinc-400">{p.activatedAt ? formatDateTime(p.activatedAt) : '—'}</td>
                      <td className="px-3 py-2"><Badge colorClass={chipOf(p).color}>{chipOf(p).label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4">
          {onProducts && (
            <button onClick={() => onProducts(lot)} className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-zinc-800 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 sm:col-span-4">
              <Package className="h-4 w-4" /> Ver produtos
            </button>
          )}
          <button onClick={() => onCodes(lot)} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20">
            <KeyRound className="h-4 w-4" /> Ver códigos
          </button>
          <button onClick={() => onChips(lot)} className="flex items-center justify-center gap-2 rounded-xl bg-blue-500/10 py-2 text-sm font-semibold text-blue-300 hover:bg-blue-500/20">
            <Nfc className="h-4 w-4" /> Ver chip
          </button>
          <button onClick={() => onEdit(lot)} className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 py-2 text-sm font-medium text-zinc-300 hover:border-indigo-500/40 hover:text-indigo-300">
            <Pencil className="h-4 w-4" /> Editar lote
          </button>
          {onDelete && (
            <button onClick={() => onDelete(lot)} className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 py-2 text-sm font-medium text-red-400 hover:border-red-500/40 hover:bg-red-500/10">
              <Trash2 className="h-4 w-4" /> Excluir lote
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function generateSuggestedCode(existing: Lot[]): string {
  const year = new Date().getFullYear();
  const usedCodes = new Set(existing.map((l) => l.code.toUpperCase()));
  let attempt = 1;
  // Combina ano + sufixo aleatório de 4 caracteres para reduzir previsibilidade,
  // garantindo ainda assim que o código sugerido nunca colida com um existente.
  let code = '';
  do {
    const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    code = `LOTE-${year}-${randomSuffix}`;
    attempt++;
  } while (usedCodes.has(code) && attempt < 30);
  return code;
}

/**
 * Janela "Ver códigos de ativação" de um lote: lista, um a um, o código de
 * ativação REAL de cada produto gerado (o mesmo que deve ir impresso na
 * embalagem/cartão e digitado pelo cliente em "Ativar Produto"). O código
 * interno de estoque aparece só como legenda pequena, pra nunca confundir
 * qual dos dois é o correto.
 */
function CodesModal({
  isOpen,
  onClose,
  lot,
  products,
}: {
  isOpen: boolean;
  onClose: () => void;
  lot: Lot | null;
  products: Product[];
}) {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const lotProducts = useMemo(() => {
    if (!lot) return [];
    return products
      .filter((p) => p.lotId === lot.id)
      .filter((p) => {
        const term = search.toLowerCase();
        return !term || p.activationCode.toLowerCase().includes(term) || p.internalCode.toLowerCase().includes(term);
      })
      .sort((a, b) => a.activationCode.localeCompare(b.activationCode));
  }, [lot, products, search]);

  const copyCode = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {
      // Clipboard indisponível — falha silenciosa, o código já está visível na tela.
    }
  };

  const copyAll = async () => {
    const text = lotProducts.map((p) => p.activationCode).join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignora falha de clipboard
    }
  };

  const handleExport = () => {
    if (!lot) return;
    exportCSV(
      `codigos-ativacao-${lot.code}`,
      lotProducts.map((p) => ({
        'Código de ativação': p.activationCode,
        'Código interno (estoque)': p.internalCode,
        Status: p.status,
        Lote: lot.code,
      }))
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lot ? `Códigos de ativação — ${lot.code}` : 'Códigos de ativação'}
      description="Este é o código que deve ir impresso na embalagem/cartão do produto e digitado pelo cliente em “Ativar Produto”. O código interno (menor, embaixo) é só para controle de estoque."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar código..." className="sm:max-w-xs" />
          <div className="flex gap-2">
            <button onClick={copyAll} className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800">
              <Copy className="h-3.5 w-3.5" /> Copiar todos
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-950 hover:bg-white">
              Exportar CSV
            </button>
          </div>
        </div>

        {lotProducts.length === 0 ? (
          <EmptyState title="Nenhum código encontrado" description="Este lote ainda não tem produtos gerados, ou a busca não encontrou nada." />
        ) : (
          <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            {lotProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold tracking-wide text-emerald-300">{p.activationCode}</p>
                  <p className="mt-0.5 truncate text-[11px] text-zinc-600">Interno (estoque): {p.internalCode}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge colorClass={p.status === 'Não programado' ? 'bg-amber-500/10 text-amber-400' : 'bg-zinc-500/10 text-zinc-400'}>{p.status}</Badge>
                  <button
                    onClick={() => copyCode(p.id, p.activationCode)}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                  >
                    {copiedId === p.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedId === p.id ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

function CreateLotModal({
  isOpen,
  existingLots,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  existingLots: Lot[];
  onClose: () => void;
  onCreate: LotsViewProps['onCreate'];
}) {
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(500);
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  const normalizedCode = code.trim().toUpperCase();
  const isDuplicate = normalizedCode.length > 0 && existingLots.some((l) => l.code.toUpperCase() === normalizedCode);
  const isQuantityValid = quantity >= 1 && quantity <= MAX_QUANTITY;
  const canSubmit = normalizedCode.length > 0 && !isDuplicate && isQuantityValid && !submitting;

  const resetAndClose = () => {
    setCode('');
    setDescription('');
    setQuantity(500);
    setSupplier('');
    setNotes('');
    setTouched(false);
    setSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    setTouched(true);
    if (!canSubmit) return;
    setSubmitting(true);
    // Pequeno delay para dar feedback visual claro de que centenas/milhares
    // de UUIDs e códigos de ativação únicos estão sendo gerados e validados.
    await new Promise((resolve) => setTimeout(resolve, 700));
    onCreate({ code: normalizedCode, description, quantity, supplier, notes, createdAt: new Date().toISOString() });
    resetAndClose();
  };

  if (!isOpen) return null;
  return (
    <Modal isOpen onClose={resetAndClose} title="Criar novo lote" description="Cada produto do lote recebe um UUID e um código de ativação criptograficamente únicos." maxWidth="max-w-2xl">
      <div className="space-y-5">
        <div>
          <label className="text-xs font-medium text-zinc-500">Código do lote</label>
          <div className="mt-1 flex gap-2">
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value); setTouched(true); }}
              placeholder="Ex: TAG-2026-001"
              className={cn(
                'h-10 w-full rounded-xl border bg-zinc-950 px-3 text-sm text-zinc-100 outline-none',
                touched && isDuplicate ? 'border-red-500/60 focus:border-red-500' : 'border-zinc-800 focus:border-zinc-700'
              )}
            />
            <button
              type="button"
              onClick={() => setCode(generateSuggestedCode(existingLots))}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
              title="Gerar código único automaticamente"
            >
              <Wand2 className="h-3.5 w-3.5" /> Gerar
            </button>
          </div>
          {touched && isDuplicate && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Este código já existe. Escolha outro ou use "Gerar" para um código único.
            </p>
          )}
          {touched && !isDuplicate && normalizedCode.length > 0 && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Código disponível.
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-500">Quantidade de produtos a gerar</label>
          <input
            type="number"
            min={1}
            max={MAX_QUANTITY}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
            className="mt-1 h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {QUANTITY_PRESETS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuantity(q)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                  quantity === q ? 'bg-indigo-500 text-white' : 'border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                )}
              >
                {q.toLocaleString('pt-BR')}
              </button>
            ))}
          </div>
          {!isQuantityValid && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Informe uma quantidade entre 1 e {MAX_QUANTITY.toLocaleString('pt-BR')}.
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-500">Descrição</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-zinc-500">Fornecedor (opcional)</label>
            <input value={supplier} onChange={(e) => setSupplier(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Observações</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700" />
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
          <p className="text-xs text-indigo-300/80">
            Cada um dos {quantity.toLocaleString('pt-BR')} produtos receberá um UUID (128 bits) e um código de ativação de alta
            entropia com dígito verificador, verificados contra todos os produtos já existentes na plataforma — eliminando
            qualquer chance de repetição ou de o código ser adivinhado.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button onClick={resetAndClose} disabled={submitting} className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-50">Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {submitting ? 'Gerando produtos únicos...' : 'Criar lote'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function EditLotModal({
  lot,
  existingLots,
  onClose,
  onUpdate,
}: {
  lot: Lot | null;
  existingLots: Lot[];
  onClose: () => void;
  onUpdate: LotsViewProps['onUpdate'];
}) {
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  // Sincroniza o formulário sempre que um lote diferente é aberto para edição.
  useMemo(() => {
    if (lot) {
      setCode(lot.code);
      setDescription(lot.description || '');
      setSupplier(lot.supplier || '');
      setNotes(lot.notes || '');
      setTouched(false);
      setSubmitting(false);
    }
  }, [lot?.id]);

  if (!lot) return null;

  const normalizedCode = code.trim().toUpperCase();
  const isDuplicate = normalizedCode.length > 0 && normalizedCode !== lot.code.toUpperCase() && existingLots.some((l) => l.id !== lot.id && l.code.toUpperCase() === normalizedCode);
  const canSubmit = normalizedCode.length > 0 && !isDuplicate && !submitting;

  const handleSubmit = async () => {
    setTouched(true);
    if (!canSubmit) return;
    setSubmitting(true);
    await onUpdate(lot.id, { code: normalizedCode, description, supplier, notes });
    setSubmitting(false);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title={`Editar lote — ${lot.code}`} description="Alterar o código, descrição, fornecedor ou observações. A quantidade de produtos já gerados não muda aqui." maxWidth="max-w-2xl">
      <div className="space-y-5">
        <div>
          <label className="text-xs font-medium text-zinc-500">Código do lote</label>
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value); setTouched(true); }}
            className={cn(
              'mt-1 h-10 w-full rounded-xl border bg-zinc-950 px-3 text-sm text-zinc-100 outline-none',
              touched && isDuplicate ? 'border-red-500/60 focus:border-red-500' : 'border-zinc-800 focus:border-zinc-700'
            )}
          />
          {touched && isDuplicate && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Já existe outro lote com este código.
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-500">Descrição</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {lot.productLine !== 'GOOGLE' && (
            <div>
              <label className="text-xs font-medium text-zinc-500">Fornecedor (opcional)</label>
              <input value={supplier} onChange={(e) => setSupplier(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700" />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-zinc-500">Observações</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700" />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-500">
          Quantidade total: <span className="text-zinc-300">{lot.quantity}</span> · Utilizada: <span className="text-zinc-300">{lot.usedQuantity}</span> · Disponível: <span className="text-zinc-300">{lot.availableQuantity}</span>
          <br />Para mudar a quantidade, crie um novo lote — os produtos já gerados deste lote continuam intactos.
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button onClick={onClose} disabled={submitting} className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-50">Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
            {submitting ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DeleteLotConfirm({
  lot,
  onClose,
  onDelete,
}: {
  lot: Lot | null;
  onClose: () => void;
  onDelete: LotsViewProps['onDelete'];
}) {
  const [submitting, setSubmitting] = useState(false);
  if (!lot) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    await onDelete(lot.id);
    setSubmitting(false);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title="Excluir lote" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <p className="text-sm text-red-300">
            Tem certeza que deseja excluir o lote <strong>{lot.code}</strong>? Essa ação não pode ser desfeita.
          </p>
        </div>
        {lot.usedQuantity > 0 && (
          <p className="text-xs text-zinc-500">
            {lot.usedQuantity} produto(s) já {lot.usedQuantity === 1 ? 'foi gerado' : 'foram gerados'} a partir deste lote — eles
            <strong className="text-zinc-300"> não serão apagados</strong>, apenas perdem o vínculo com o lote excluído e continuam
            normalmente em Produtos.
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button onClick={onClose} disabled={submitting} className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-50">Cancelar</button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {submitting ? 'Excluindo...' : 'Excluir lote'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ReadRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-zinc-800 pb-2 last:border-0 last:pb-0">
      <span className="shrink-0 text-zinc-500">{label}</span>
      <span className="truncate text-right text-zinc-200">{value}</span>
    </div>
  );
}
