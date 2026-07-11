import { useMemo, useState } from 'react';
import {
  MoreHorizontal,
  Eye,
  Edit3,
  Lock,
  Unlock,
  Trash2,
  PauseCircle,
  PlayCircle,
  Mail,
  MessageCircle,
  Bell,
  ArrowUpDown,
} from 'lucide-react';
import { SearchBar } from '@/components/admin/ui/SearchBar';
import { Badge } from '@/components/admin/ui/Badge';
import { Modal } from '@/components/admin/ui/Modal';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { cn, exportCSV, formatDate, getInitials } from '@/lib/adminUtils';
import type { Customer, CustomerStatus } from '@/types/admin';

interface CustomersViewProps {
  customers: Customer[];
  onView: (id: string) => void;
  onChangeStatus: (id: string, status: CustomerStatus) => void;
  onDelete: (id: string) => void;
  onNotify: (customer: Customer) => void;
}

const statusConfig: Record<CustomerStatus, { label: string; color: string; dot: string }> = {
  Ativo: { label: 'Ativo', color: 'bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-500' },
  Bloqueado: { label: 'Bloqueado', color: 'bg-red-500/10 text-red-400', dot: 'bg-red-500' },
  Suspenso: { label: 'Suspenso', color: 'bg-yellow-500/10 text-yellow-400', dot: 'bg-yellow-500' },
  Inativo: { label: 'Inativo', color: 'bg-zinc-500/10 text-zinc-400', dot: 'bg-zinc-500' },
};

export function CustomersView({ customers, onView, onChangeStatus, onDelete, onNotify }: CustomersViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'all'>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<keyof Customer>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<Customer | null>(null);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const list = customers.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.company.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.address.city.toLowerCase().includes(search.toLowerCase()) ||
        c.address.state.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesPlan = planFilter === 'all' || c.plan === planFilter;
      return matchesSearch && matchesStatus && matchesPlan;
    });
    list.sort((a, b) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      if (typeof va === 'number' && typeof vb === 'number') return sortAsc ? va - vb : vb - va;
      return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return list;
  }, [customers, search, statusFilter, planFilter, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleExport = () => {
    exportCSV(
      'clientes_airnext.csv',
      filtered.map((c) => ({
        Nome: c.name,
        Empresa: c.company,
        Telefone: c.phone,
        Email: c.email,
        Cidade: c.address.city,
        Estado: c.address.state,
        Plano: c.plan,
        'Data de cadastro': formatDate(c.registeredAt),
        Status: c.status,
        Produtos: c.productCount,
        'Primeira ativação': formatDate(c.firstActivationAt),
        'Próxima renovação': formatDate(c.nextRenewalDate),
        'Dias restantes': c.daysRemaining,
      }))
    );
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar cliente, empresa, cidade..." className="sm:max-w-xs" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as CustomerStatus | 'all'); setPage(1); }}
            className="h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-300 outline-none focus:border-zinc-700"
          >
            <option value="all">Todos os status</option>
            <option value="Ativo">Ativo</option>
            <option value="Bloqueado">Bloqueado</option>
            <option value="Suspenso">Suspenso</option>
            <option value="Inativo">Inativo</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
            className="h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-300 outline-none focus:border-zinc-700"
          >
            <option value="all">Todos os planos</option>
            <option value="Starter">Starter</option>
            <option value="Pro">Pro</option>
            <option value="Business">Business</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-white"
        >
          Exportar CSV
        </button>
      </div>

      {paginated.length === 0 ? (
        <EmptyState title="Nenhum cliente encontrado" description="Ajuste os filtros ou cadastre um novo cliente." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
          {/* Tabela completa — visível apenas em telas grandes */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-xs uppercase text-zinc-500">
                <tr>
                  <SortHeader label="Cliente" sortKey="name" current={sortKey} asc={sortAsc} onClick={() => { setSortKey('name'); setSortAsc(!sortAsc); }} />
                  <th className="px-4 py-3 font-medium">Contato</th>
                  <th className="px-4 py-3 font-medium">Local</th>
                  <SortHeader label="Plano" sortKey="plan" current={sortKey} asc={sortAsc} onClick={() => { setSortKey('plan'); setSortAsc(!sortAsc); }} />
                  <SortHeader label="Cadastro" sortKey="registeredAt" current={sortKey} asc={sortAsc} onClick={() => { setSortKey('registeredAt'); setSortAsc(!sortAsc); }} />
                  <th className="px-4 py-3 font-medium">Status</th>
                  <SortHeader label="Produtos" sortKey="productCount" current={sortKey} asc={sortAsc} onClick={() => { setSortKey('productCount'); setSortAsc(!sortAsc); }} />
                  <SortHeader label="Renovação" sortKey="nextRenewalDate" current={sortKey} asc={sortAsc} onClick={() => { setSortKey('nextRenewalDate'); setSortAsc(!sortAsc); }} />
                  <th className="px-4 py-3 font-medium">Último acesso</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {paginated.map((customer) => {
                  const cfg = statusConfig[customer.status];
                  return (
                    <tr key={customer.id} className="group transition-colors hover:bg-zinc-800/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
                            {getInitials(customer.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-zinc-200">{customer.name}</p>
                            <p className="truncate text-xs text-zinc-500">{customer.company}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-zinc-300">{customer.email}</p>
                        <p className="text-xs text-zinc-500">{customer.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{customer.address.city}, {customer.address.state}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-lg bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300">{customer.plan}</span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{formatDate(customer.registeredAt)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="dot" colorClass={cfg.color} dotColor={cfg.dot}>{cfg.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{customer.productCount}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-zinc-300">{formatDate(customer.nextRenewalDate)}</p>
                          <p className="text-xs text-zinc-500">{customer.daysRemaining} dias</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{formatDate(customer.lastAccessAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <CustomerActionsMenu
                          customer={customer}
                          isOpen={actionMenu === customer.id}
                          onToggle={() => setActionMenu(actionMenu === customer.id ? null : customer.id)}
                          onView={onView}
                          onChangeStatus={onChangeStatus}
                          onNotify={onNotify}
                          onDeleteRequest={setDeleteModal}
                          closeMenu={() => setActionMenu(null)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Lista em cards — visível em telas pequenas e médias */}
          <div className="divide-y divide-zinc-800 lg:hidden">
            {paginated.map((customer) => {
              const cfg = statusConfig[customer.status];
              return (
                <div key={customer.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
                        {getInitials(customer.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-200">{customer.name}</p>
                        <p className="truncate text-xs text-zinc-500">{customer.company}</p>
                      </div>
                    </div>
                    <CustomerActionsMenu
                      customer={customer}
                      isOpen={actionMenu === customer.id}
                      onToggle={() => setActionMenu(actionMenu === customer.id ? null : customer.id)}
                      onView={onView}
                      onChangeStatus={onChangeStatus}
                      onNotify={onNotify}
                      onDeleteRequest={setDeleteModal}
                      closeMenu={() => setActionMenu(null)}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <InfoField label="Email" value={customer.email} />
                    <InfoField label="Telefone" value={customer.phone} />
                    <InfoField label="Local" value={`${customer.address.city}, ${customer.address.state}`} />
                    <InfoField label="Plano" value={customer.plan} />
                    <InfoField label="Produtos" value={String(customer.productCount)} />
                    <InfoField label="Dias restantes" value={`${customer.daysRemaining} dias`} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="dot" colorClass={cfg.color} dotColor={cfg.dot}>{cfg.label}</Badge>
                    <span className="text-xs text-zinc-500">Cadastro: {formatDate(customer.registeredAt)}</span>
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

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Excluir cliente">
        {deleteModal && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Tem certeza que deseja excluir <strong className="text-zinc-200">{deleteModal.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteModal(null)} className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800">Cancelar</button>
              <button onClick={() => { onDelete(deleteModal.id); setDeleteModal(null); }} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Excluir</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function SortHeader({ label, sortKey, current, asc, onClick }: { label: string; sortKey: keyof Customer; current: keyof Customer; asc: boolean; onClick: () => void }) {
  return (
    <th className="px-4 py-3 font-medium">
      <button onClick={onClick} className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300">
        {label}
        {current === sortKey && <ArrowUpDown className={cn('h-3 w-3 transition-transform', !asc && 'rotate-180')} />}
      </button>
    </th>
  );
}

function ActionItem({ icon: Icon, label, danger, onClick }: { icon: React.ElementType; label: string; danger?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${danger ? 'text-red-400 hover:bg-red-500/10' : 'text-zinc-300 hover:bg-zinc-800'}`}
    >
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

function CustomerActionsMenu({
  customer,
  isOpen,
  onToggle,
  onView,
  onChangeStatus,
  onNotify,
  onDeleteRequest,
  closeMenu,
}: {
  customer: Customer;
  isOpen: boolean;
  onToggle: () => void;
  onView: (id: string) => void;
  onChangeStatus: (id: string, status: CustomerStatus) => void;
  onNotify: (customer: Customer) => void;
  onDeleteRequest: (customer: Customer) => void;
  closeMenu: () => void;
}) {
  return (
    <div className="relative inline-block">
      <button
        onClick={onToggle}
        className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-xl border border-zinc-800 bg-zinc-950 py-1 shadow-2xl">
          <ActionItem icon={Eye} label="Ver detalhes" onClick={() => { onView(customer.id); closeMenu(); }} />
          <ActionItem icon={Edit3} label="Editar" onClick={() => { onView(customer.id); closeMenu(); }} />
          <ActionItem icon={Mail} label="Enviar email" onClick={() => window.open(`mailto:${customer.email}`, '_blank')} />
          <ActionItem icon={MessageCircle} label="WhatsApp" onClick={() => window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}`, '_blank')} />
          <ActionItem icon={Bell} label="Enviar notificação" onClick={() => { onNotify(customer); closeMenu(); }} />
          <div className="my-1 border-t border-zinc-800" />
          {customer.status === 'Ativo' ? (
            <ActionItem icon={Lock} label="Bloquear" onClick={() => { onChangeStatus(customer.id, 'Bloqueado'); closeMenu(); }} />
          ) : (
            <ActionItem icon={Unlock} label="Desbloquear" onClick={() => { onChangeStatus(customer.id, 'Ativo'); closeMenu(); }} />
          )}
          {customer.status === 'Suspenso' ? (
            <ActionItem icon={PlayCircle} label="Reativar" onClick={() => { onChangeStatus(customer.id, 'Ativo'); closeMenu(); }} />
          ) : (
            <ActionItem icon={PauseCircle} label="Suspender" onClick={() => { onChangeStatus(customer.id, 'Suspenso'); closeMenu(); }} />
          )}
          <div className="my-1 border-t border-zinc-800" />
          <ActionItem icon={Trash2} label="Excluir" danger onClick={() => { onDeleteRequest(customer); closeMenu(); }} />
        </div>
      )}
    </div>
  );
}
