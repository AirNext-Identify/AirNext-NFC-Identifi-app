import { useMemo, useState } from 'react';
import {
  MoreHorizontal,
  Eye,
  Copy,
  Trash2,
  Lock,
  Unlock,
  RefreshCw,
  UserPlus,
  Plus,
  Radio,
} from 'lucide-react';
import { SearchBar } from '@/components/admin/ui/SearchBar';
import { Badge } from '@/components/admin/ui/Badge';
import { Modal } from '@/components/admin/ui/Modal';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { cn, exportCSV, formatDate, getValidityStatus } from '@/lib/adminUtils';
import type { Customer, Product, ProductStatus } from '@/types/admin';

interface ProductsViewProps {
  products: Product[];
  customers: Customer[];
  lots: { id: string; code: string }[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onTransfer: (productId: string, customerId: string | undefined) => void;
  onRenew: (productId: string, customerId: string, years: number) => void;
  onBlock: (productId: string, blocked: boolean) => void;
  onCreate: (data: Partial<Product>) => void;
  onProgramProduct?: (id: string) => void;
  onOpenNfc?: () => void;
}

export function ProductsView({
  products,
  customers,
  lots,
  onView,
  onDelete,
  onDuplicate,
  onTransfer,
  onRenew,
  onBlock,
  onCreate,
  onProgramProduct,
  onOpenNfc,
}: ProductsViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [transferModal, setTransferModal] = useState<Product | null>(null);
  const [renewModal, setRenewModal] = useState<Product | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const pageSize = 10;

  const pendingCount = useMemo(() => products.filter((p) => p.status === 'Não programado').length, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const customer = customers.find((c) => c.id === p.customerId);
      const matchesSearch =
        p.uuid.toLowerCase().includes(search.toLowerCase()) ||
        p.activationCode.toLowerCase().includes(search.toLowerCase()) ||
        p.internalCode.toLowerCase().includes(search.toLowerCase()) ||
        customer?.name.toLowerCase().includes(search.toLowerCase()) ||
        lots.find((l) => l.id === p.lotId)?.code.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, customers, lots, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleExport = () => {
    exportCSV(
      'produtos_airnext.csv',
      filtered.map((p) => {
        const customer = customers.find((c) => c.id === p.customerId);
        return {
          UUID: p.uuid,
          'Código de ativação': p.activationCode,
          'Código interno': p.internalCode,
          Cliente: customer?.name || '—',
          Status: p.status,
          'Data de criação': formatDate(p.createdAt),
          'Data de ativação': formatDate(p.activatedAt),
          'Data de validade': formatDate(p.expiresAt),
          'Dias restantes': p.daysRemaining ?? '—',
          Lote: lots.find((l) => l.id === p.lotId)?.code || '—',
        };
      })
    );
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar UUID, código, cliente, lote..." className="sm:max-w-xs" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as ProductStatus | 'all'); setPage(1); }}
            className="h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-300 outline-none"
          >
            <option value="all">Todos os status</option>
            <option value="Disponível para ativação">Disponíveis</option>
            <option value="Ativado">Ativados</option>
            <option value="Expirando">Expirando</option>
            <option value="Expirado">Expirados</option>
            <option value="Bloqueado">Bloqueados</option>
            <option value="Programado">Programados</option>
            <option value="Não ativado">Não ativados</option>
          </select>
        </div>
        <div className="flex gap-2">
          {onOpenNfc && pendingCount > 0 && (
            <button onClick={onOpenNfc} className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400">
              <Radio className="h-4 w-4" /> Gravar chips pendentes ({pendingCount})
            </button>
          )}
          <button onClick={() => setCreateModal(true)} className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600">
            <Plus className="h-4 w-4" /> Novo produto
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-white">
            Exportar CSV
          </button>
        </div>
      </div>

      {paginated.length === 0 ? (
        <EmptyState title="Nenhum produto encontrado" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">UUID</th>
                  <th className="px-4 py-3">Código de ativação</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Criação</th>
                  <th className="px-4 py-3">Ativação</th>
                  <th className="px-4 py-3">Validade</th>
                  <th className="px-4 py-3">Dias</th>
                  <th className="px-4 py-3">Lote</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {paginated.map((product) => {
                  const validity = getValidityStatus(product.daysRemaining);
                  const customer = customers.find((c) => c.id === product.customerId);
                  return (
                    <tr key={product.id} className="hover:bg-zinc-800/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-200">{product.uuid.slice(0, 8)}...</p>
                        <p className="text-xs text-zinc-500">{product.internalCode}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{product.activationCode}</td>
                      <td className="px-4 py-3 text-zinc-300">{customer ? customer.name : '—'}</td>
                      <td className="px-4 py-3">
                        <Badge colorClass={cn(validity.bg, validity.text)}>{product.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{formatDate(product.createdAt)}</td>
                      <td className="px-4 py-3 text-zinc-400">{formatDate(product.activatedAt)}</td>
                      <td className="px-4 py-3 text-zinc-400">{formatDate(product.expiresAt)}</td>
                      <td className="px-4 py-3 text-zinc-400">{product.daysRemaining ?? '—'}</td>
                      <td className="px-4 py-3 text-zinc-400">{lots.find((l) => l.id === product.lotId)?.code || product.lotId}</td>
                      <td className="px-4 py-3 text-right">
                        <ProductActionsMenu
                          product={product}
                          isOpen={actionMenu === product.id}
                          onToggle={() => setActionMenu(actionMenu === product.id ? null : product.id)}
                          onView={onView}
                          onDuplicate={onDuplicate}
                          onDelete={onDelete}
                          onBlock={onBlock}
                          onTransferRequest={setTransferModal}
                          onProgramProduct={onProgramProduct}
                          onRenewRequest={setRenewModal}
                          closeMenu={() => setActionMenu(null)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-zinc-800 xl:hidden">
            {paginated.map((product) => {
              const validity = getValidityStatus(product.daysRemaining);
              const customer = customers.find((c) => c.id === product.customerId);
              return (
                <div key={product.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-200">{product.internalCode}</p>
                      <p className="truncate text-xs text-zinc-500">{product.uuid}</p>
                    </div>
                    <ProductActionsMenu
                      product={product}
                      isOpen={actionMenu === product.id}
                      onToggle={() => setActionMenu(actionMenu === product.id ? null : product.id)}
                      onView={onView}
                      onDuplicate={onDuplicate}
                      onDelete={onDelete}
                      onBlock={onBlock}
                      onTransferRequest={setTransferModal}
                          onProgramProduct={onProgramProduct}
                      onRenewRequest={setRenewModal}
                      closeMenu={() => setActionMenu(null)}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <InfoField label="Cliente" value={customer ? customer.name : '—'} />
                    <InfoField label="Código de ativação" value={product.activationCode} />
                    <InfoField label="Ativação" value={formatDate(product.activatedAt)} />
                    <InfoField label="Validade" value={formatDate(product.expiresAt)} />
                    <InfoField label="Dias restantes" value={String(product.daysRemaining ?? '—')} />
                    <InfoField label="Lote" value={lots.find((l) => l.id === product.lotId)?.code || product.lotId} />
                  </div>
                  <div className="mt-3">
                    <Badge colorClass={cn(validity.bg, validity.text)}>{product.status}</Badge>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 border-t border-zinc-800 px-4 py-3 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
            <p>{filtered.length} resultados</p>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg px-3 py-1 hover:bg-zinc-800 disabled:opacity-40">Anterior</button>
              <span className="text-zinc-300">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="rounded-lg px-3 py-1 hover:bg-zinc-800 disabled:opacity-40">Próxima</button>
            </div>
          </div>
        </div>
      )}

      <TransferModal isOpen={!!transferModal} product={transferModal} customers={customers} onClose={() => setTransferModal(null)} onTransfer={(customerId) => { onTransfer(transferModal!.id, customerId); setTransferModal(null); }} />
      <RenewModal isOpen={!!renewModal} product={renewModal} onClose={() => setRenewModal(null)} onRenew={(years) => { onRenew(renewModal!.id, renewModal!.customerId || customers[0].id, years); setRenewModal(null); }} />
      <CreateProductModal isOpen={createModal} lots={lots} onClose={() => setCreateModal(false)} onCreate={(data) => { onCreate(data); setCreateModal(false); }} />
    </div>
  );
}

function ActionItem({ icon: Icon, label, danger, onClick }: { icon: React.ElementType; label: string; danger?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${danger ? 'text-red-400 hover:bg-red-500/10' : 'text-zinc-300 hover:bg-zinc-800'}`}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-zinc-500">{label}</p>
      <p className="truncate text-zinc-300">{value}</p>
    </div>
  );
}

function ProductActionsMenu({
  product,
  isOpen,
  onToggle,
  onView,
  onDuplicate,
  onDelete,
  onBlock,
  onTransferRequest,
  onRenewRequest,
  onProgramProduct,
  closeMenu,
}: {
  product: Product;
  isOpen: boolean;
  onToggle: () => void;
  onView: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onBlock: (id: string, blocked: boolean) => void;
  onTransferRequest: (product: Product) => void;
  onRenewRequest: (product: Product) => void;
  onProgramProduct?: (id: string) => void;
  closeMenu: () => void;
}) {
  return (
    <div className="relative inline-block">
      <button onClick={onToggle} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-xl border border-zinc-800 bg-zinc-950 py-1 shadow-2xl">
          <ActionItem icon={Eye} label="Ver detalhes" onClick={() => { onView(product.id); closeMenu(); }} />
          {product.status === 'Não programado' && onProgramProduct && (
            <ActionItem icon={Radio} label="Gravar chip" onClick={() => { onProgramProduct(product.id); closeMenu(); }} />
          )}
          <ActionItem icon={Copy} label="Duplicar" onClick={() => { onDuplicate(product.id); closeMenu(); }} />
          <ActionItem icon={UserPlus} label="Transferir cliente" onClick={() => { onTransferRequest(product); closeMenu(); }} />
          <ActionItem icon={RefreshCw} label="Renovar validade" onClick={() => { onRenewRequest(product); closeMenu(); }} />
          <div className="my-1 border-t border-zinc-800" />
          {product.status === 'Bloqueado' ? (
            <ActionItem icon={Unlock} label="Desbloquear" onClick={() => { onBlock(product.id, false); closeMenu(); }} />
          ) : (
            <ActionItem icon={Lock} label="Bloquear" onClick={() => { onBlock(product.id, true); closeMenu(); }} />
          )}
          <ActionItem icon={Trash2} label="Excluir" danger onClick={() => { onDelete(product.id); closeMenu(); }} />
        </div>
      )}
    </div>
  );
}

function TransferModal({ isOpen, product, customers, onClose, onTransfer }: { isOpen: boolean; product: Product | null; customers: Customer[]; onClose: () => void; onTransfer: (id: string | undefined) => void }) {
  const [selected, setSelected] = useState<string>('');
  if (!isOpen || !product) return null;
  return (
    <Modal isOpen onClose={onClose} title="Transferir produto">
      <p className="mb-3 text-sm text-zinc-400">Transferir <strong className="text-zinc-200">{product.internalCode}</strong> para outro cliente.</p>
      <select value={selected} onChange={(e) => setSelected(e.target.value)} className="mb-4 h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none">
        <option value="">Nenhum cliente</option>
        {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
      </select>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Cancelar</button>
        <button onClick={() => onTransfer(selected || undefined)} className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600">Transferir</button>
      </div>
    </Modal>
  );
}

function RenewModal({ isOpen, product, onClose, onRenew }: { isOpen: boolean; product: Product | null; onClose: () => void; onRenew: (years: number) => void }) {
  const [years, setYears] = useState(2);
  if (!isOpen || !product) return null;
  return (
    <Modal isOpen onClose={onClose} title="Renovar validade">
      <p className="mb-3 text-sm text-zinc-400">Renovar <strong className="text-zinc-200">{product.internalCode}</strong>. Validade atual: {formatDate(product.expiresAt)}</p>
      <div className="mb-4 flex gap-2">
        {[1, 2, 3].map((y) => (
          <button key={y} onClick={() => setYears(y)} className={`flex-1 rounded-xl py-2 text-sm font-medium ${years === y ? 'bg-indigo-500 text-white' : 'border border-zinc-800 bg-zinc-950 text-zinc-400'}`}>
            {y} ano{y > 1 ? 's' : ''}
          </button>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Cancelar</button>
        <button onClick={() => onRenew(years)} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">Renovar</button>
      </div>
    </Modal>
  );
}

function CreateProductModal({ isOpen, lots, onClose, onCreate }: { isOpen: boolean; lots: { id: string; code: string }[]; onClose: () => void; onCreate: (data: Partial<Product>) => void }) {
  const [lotId, setLotId] = useState(lots[0]?.id || '');
  if (!isOpen) return null;
  return (
    <Modal isOpen onClose={onClose} title="Criar produto">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-zinc-500">Lote</label>
          <select value={lotId} onChange={(e) => setLotId(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none">
            {lots.map((l) => <option key={l.id} value={l.id}>{l.code}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Cancelar</button>
          <button onClick={() => onCreate({ lotId, createdAt: new Date().toISOString() })} className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600">Criar</button>
        </div>
      </div>
    </Modal>
  );
}
