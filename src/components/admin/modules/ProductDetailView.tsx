import { useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Trash2,
  Lock,
  Unlock,
  RefreshCw,
  UserPlus,
  Calendar,
  Barcode,
  Hash,
  Box,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import { Badge } from '@/components/admin/ui/Badge';
import { Modal } from '@/components/admin/ui/Modal';
import { formatDate, formatDateTime, getValidityStatus, cn } from '@/lib/adminUtils';
import type { Customer, Product } from '@/types/admin';

interface ProductDetailViewProps {
  product: Product;
  customers: Customer[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onTransfer: (productId: string, customerId: string | undefined) => void;
  onRenew: (productId: string, customerId: string, years: number) => void;
  onBlock: (productId: string, blocked: boolean) => void;
}

export function ProductDetailView({
  product,
  customers,
  onBack,
  onDelete,
  onDuplicate,
  onTransfer,
  onRenew,
  onBlock,
}: ProductDetailViewProps) {
  const [showDelete, setShowDelete] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showRenew, setShowRenew] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(product.customerId || '');
  const [renewYears, setRenewYears] = useState(2);

  const validity = getValidityStatus(product.daysRemaining);
  const customer = customers.find((c) => c.id === product.customerId);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-zinc-200">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">{product.internalCode}</h2>
            <p className="text-sm text-zinc-500">{product.uuid}</p>
          </div>
          <Badge colorClass={cn(validity.bg, validity.text)}>{product.status}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onDuplicate(product.id)} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-700 hover:text-zinc-100">
            <Copy className="h-4 w-4" /> Duplicar
          </button>
          <button onClick={() => setShowTransfer(true)} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-700 hover:text-zinc-100">
            <UserPlus className="h-4 w-4" /> Transferir
          </button>
          <button onClick={() => setShowRenew(true)} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-700 hover:text-zinc-100">
            <RefreshCw className="h-4 w-4" /> Renovar
          </button>
          {product.status === 'Bloqueado' ? (
            <button onClick={() => onBlock(product.id, false)} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-700 hover:text-zinc-100">
              <Unlock className="h-4 w-4" /> Desbloquear
            </button>
          ) : (
            <button onClick={() => onBlock(product.id, true)} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-700 hover:text-zinc-100">
              <Lock className="h-4 w-4" /> Bloquear
            </button>
          )}
          <button onClick={() => setShowDelete(true)} className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20">
            <Trash2 className="h-4 w-4" /> Excluir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <InfoCard icon={Hash} label="UUID" value={product.uuid} />
        <InfoCard icon={Barcode} label="Código de ativação" value={product.activationCode} />
        <InfoCard icon={Box} label="Código interno" value={product.internalCode} />
        <InfoCard icon={Calendar} label="Data de criação" value={formatDate(product.createdAt)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Validade">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Status</span>
              <Badge variant="dot" colorClass={validity.bg} dotColor={validity.color}>{validity.label}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Ativado em</span>
              <span className="text-sm text-zinc-200">{formatDateTime(product.activatedAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Expira em</span>
              <span className="text-sm text-zinc-200">{formatDate(product.expiresAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Dias restantes</span>
              <span className="text-sm font-semibold text-zinc-200">{product.daysRemaining ?? '—'}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div className={cn('h-full rounded-full transition-all', validity.color)} style={{ width: `${Math.max(0, Math.min(100, ((product.daysRemaining ?? 0) / 730) * 100))}%` }} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Cliente, lote e NFC">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Cliente</span>
              <span className="text-sm text-zinc-200">{customer ? customer.name : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Empresa</span>
              <span className="text-sm text-zinc-200">{customer?.company || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Lote</span>
              <span className="text-sm text-zinc-200">{product.lotId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Programado em</span>
              <span className="text-sm text-zinc-200">{formatDateTime(product.programmedAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Operador</span>
              <span className="text-sm text-zinc-200">{product.programmedBy || '—'}</span>
            </div>
            <a href={product.nfcUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300">
              <Cpu className="h-4 w-4" /> {product.nfcUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </SectionCard>
      </div>

      <Modal isOpen={showTransfer} onClose={() => setShowTransfer(false)} title="Transferir produto">
        <p className="mb-3 text-sm text-zinc-400">Transferir <strong className="text-zinc-200">{product.internalCode}</strong> para outro cliente.</p>
        <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="mb-4 h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none">
          <option value="">Nenhum cliente</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
        </select>
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowTransfer(false)} className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Cancelar</button>
          <button onClick={() => { onTransfer(product.id, selectedCustomer || undefined); setShowTransfer(false); }} className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600">Transferir</button>
        </div>
      </Modal>

      <Modal isOpen={showRenew} onClose={() => setShowRenew(false)} title="Renovar validade">
        <p className="mb-3 text-sm text-zinc-400">Renovar <strong className="text-zinc-200">{product.internalCode}</strong>.</p>
        <div className="mb-4 flex gap-2">
          {[1, 2, 3].map((y) => (
            <button key={y} onClick={() => setRenewYears(y)} className={`flex-1 rounded-xl py-2 text-sm font-medium ${renewYears === y ? 'bg-indigo-500 text-white' : 'border border-zinc-800 bg-zinc-950 text-zinc-400'}`}>
              {y} ano{y > 1 ? 's' : ''}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowRenew(false)} className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Cancelar</button>
          <button onClick={() => { onRenew(product.id, customer?.id || '', renewYears); setShowRenew(false); }} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">Renovar</button>
        </div>
      </Modal>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Excluir produto">
        <p className="text-sm text-zinc-400">Tem certeza que deseja excluir <strong className="text-zinc-200">{product.internalCode}</strong>?</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setShowDelete(false)} className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Cancelar</button>
          <button onClick={() => onDelete(product.id)} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Excluir</button>
        </div>
      </Modal>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800">
        <Icon className="h-4.5 w-4.5 text-zinc-400" />
      </div>
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 break-all text-sm font-medium text-zinc-100">{value}</p>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-200">{title}</h3>
      {children}
    </div>
  );
}
