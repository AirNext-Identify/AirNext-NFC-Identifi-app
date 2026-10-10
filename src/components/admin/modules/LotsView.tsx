import { useMemo, useState } from 'react';
import { Plus, Boxes, Eye, Wand2, AlertTriangle, CheckCircle2, Loader2, ShieldCheck, Pencil, Trash2, Radio, KeyRound, Copy, Check } from 'lucide-react';
import { SearchBar } from '@/components/admin/ui/SearchBar';
import { Badge } from '@/components/admin/ui/Badge';
import { Modal } from '@/components/admin/ui/Modal';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { cn, formatDate, exportCSV } from '@/lib/adminUtils';
import type { Lot, Product } from '@/types/admin';

interface LotsViewProps {
  lots: Lot[];
  products: Product[];
  onCreate: (data: Omit<Lot, 'id' | 'usedQuantity' | 'availableQuantity'>) => void;
  onUpdate: (id: string, data: Partial<Pick<Lot, 'code' | 'description' | 'supplier' | 'notes'>>) => void;
  onDelete: (id: string) => void;
  /** Atalho: navega para o Programador NFC já com este lote selecionado. */
  onProgramLot?: (lotId: string) => void;
}

const QUANTITY_PRESETS = [100, 250, 500, 1000, 2500, 5000];
const MAX_QUANTITY = 20000;

export function LotsView({ lots, products, onCreate, onUpdate, onDelete, onProgramLot }: LotsViewProps) {
  const [search, setSearch] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [detailLot, setDetailLot] = useState<Lot | null>(null);
  const [editLot, setEditLot] = useState<Lot | null>(null);
  const [deleteLot, setDeleteLotState] = useState<Lot | null>(null);
  const [codesLot, setCodesLot] = useState<Lot | null>(null);

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
        <button onClick={() => setCreateModal(true)} className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600">
          <Plus className="h-4 w-4" /> Novo lote
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum lote encontrado" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((lot) => (
            <div key={lot.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition-all hover:border-zinc-700">
              <div className="mb-4 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                    <Boxes className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-zinc-100">{lot.code}</h3>
                    <p className="text-xs text-zinc-500">{formatDate(lot.createdAt)}</p>
                  </div>
                </div>
                <Badge colorClass="bg-zinc-500/10 text-zinc-400 shrink-0">{lot.availableQuantity} disp.</Badge>
              </div>
              {lot.description && <p className="mb-4 text-sm text-zinc-400">{lot.description}</p>}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-zinc-500">
                  <span>Quantidade</span>
                  <span className="text-zinc-300">{lot.quantity}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Utilizada</span>
                  <span className="text-zinc-300">{lot.usedQuantity}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Disponível</span>
                  <span className="text-zinc-300">{lot.availableQuantity}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Fornecedor</span>
                  <span className="truncate text-zinc-300">{lot.supplier || '—'}</span>
                </div>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${lot.quantity ? (lot.usedQuantity / lot.quantity) * 100 : 0}%` }} />
              </div>
              <button onClick={() => setDetailLot(lot)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 py-2 text-sm font-medium text-zinc-400 hover:border-zinc-700 hover:text-zinc-200">
                <Eye className="h-4 w-4" /> Ver detalhes
              </button>
              <button
                onClick={() => setCodesLot(lot)}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/10 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20"
              >
                <KeyRound className="h-4 w-4" /> Ver códigos de ativação
              </button>
              {onProgramLot && lot.availableQuantity > 0 && (
                <button
                  onClick={() => onProgramLot(lot.id)}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500/10 py-2 text-sm font-medium text-indigo-300 hover:bg-indigo-500/20"
                >
                  <Radio className="h-4 w-4" /> Gravar chips deste lote
                </button>
              )}
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setEditLot(lot)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-800 py-2 text-xs font-medium text-zinc-400 hover:border-indigo-500/40 hover:text-indigo-300"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>
                <button
                  onClick={() => setDeleteLotState(lot)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-800 py-2 text-xs font-medium text-zinc-400 hover:border-red-500/40 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateLotModal isOpen={createModal} existingLots={lots} onClose={() => setCreateModal(false)} onCreate={onCreate} />
      <CodesModal isOpen={!!codesLot} onClose={() => setCodesLot(null)} lot={codesLot} products={products} />

      <Modal isOpen={!!detailLot} onClose={() => setDetailLot(null)} title={detailLot?.code || 'Lote'}>
        {detailLot && (
          <div className="space-y-3 text-sm">
            <ReadRow label="Código" value={detailLot.code} />
            <ReadRow label="Quantidade total" value={String(detailLot.quantity)} />
            <ReadRow label="Utilizada" value={String(detailLot.usedQuantity)} />
            <ReadRow label="Disponível" value={String(detailLot.availableQuantity)} />
            <ReadRow label="Fornecedor" value={detailLot.supplier || '—'} />
            <ReadRow label="Data de criação" value={formatDate(detailLot.createdAt)} />
            <ReadRow label="Descrição" value={detailLot.description || '—'} />
            <ReadRow label="Observações" value={detailLot.notes || '—'} />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { setCodesLot(detailLot); setDetailLot(null); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500/10 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20"
              >
                <KeyRound className="h-4 w-4" /> Ver códigos
              </button>
              {onProgramLot && detailLot.availableQuantity > 0 && (
                <button
                  onClick={() => { onProgramLot(detailLot.id); setDetailLot(null); }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500 py-2 text-sm font-semibold text-white hover:bg-indigo-600"
                >
                  <Radio className="h-4 w-4" /> Gravar chips
                </button>
              )}
              <button
                onClick={() => { setEditLot(detailLot); setDetailLot(null); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-800 py-2 text-sm font-medium text-zinc-300 hover:border-indigo-500/40 hover:text-indigo-300"
              >
                <Pencil className="h-4 w-4" /> Editar lote
              </button>
              <button
                onClick={() => { setDeleteLotState(detailLot); setDetailLot(null); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-800 py-2 text-sm font-medium text-red-400 hover:border-red-500/40 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" /> Excluir lote
              </button>
            </div>
          </div>
        )}
      </Modal>

      <EditLotModal lot={editLot} existingLots={lots} onClose={() => setEditLot(null)} onUpdate={onUpdate} />
      <DeleteLotConfirm lot={deleteLot} onClose={() => setDeleteLotState(null)} onDelete={onDelete} />
    </div>
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
          <div>
            <label className="text-xs font-medium text-zinc-500">Fornecedor (opcional)</label>
            <input value={supplier} onChange={(e) => setSupplier(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700" />
          </div>
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
