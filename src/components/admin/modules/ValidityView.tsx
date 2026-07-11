import { useMemo, useState } from 'react';
import { SearchBar } from '@/components/admin/ui/SearchBar';
import { Badge } from '@/components/admin/ui/Badge';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { formatDate, getValidityStatus } from '@/lib/adminUtils';
import type { Customer, Product } from '@/types/admin';

interface ValidityViewProps {
  products: Product[];
  customers: Customer[];
  onRenew: (productId: string, customerId: string, years: number) => void;
}

const filters = [
  { label: '180 dias', max: 180, min: 91 },
  { label: '90 dias', max: 90, min: 31 },
  { label: '60 dias', max: 60, min: 31 },
  { label: '30 dias', max: 30, min: 8 },
  { label: '15 dias', max: 15, min: 8 },
  { label: '7 dias', max: 7, min: 2 },
  { label: 'Hoje', max: 1, min: 1 },
  { label: 'Expirados', max: 0, min: -Infinity },
];

export function ValidityView({ products, customers, onRenew }: ValidityViewProps) {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const customer = customers.find((c) => c.id === p.customerId);
      const matchesSearch =
        p.uuid.toLowerCase().includes(search.toLowerCase()) ||
        p.internalCode.toLowerCase().includes(search.toLowerCase()) ||
        customer?.name.toLowerCase().includes(search.toLowerCase());
      if (selectedFilter === 'all') return matchesSearch && (p.status === 'Expirando' || p.status === 'Expirado');
      const cfg = filters.find((f) => f.label === selectedFilter);
      if (!cfg || p.daysRemaining === undefined) return false;
      const matchesFilter = cfg.max === 0 ? p.daysRemaining <= 0 : p.daysRemaining <= cfg.max && p.daysRemaining >= cfg.min;
      return matchesSearch && matchesFilter;
    });
  }, [products, customers, search, selectedFilter]);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar produto, cliente..." className="sm:max-w-xs" />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedFilter('all')} className={`rounded-xl px-3 py-1.5 text-xs font-medium ${selectedFilter === 'all' ? 'bg-indigo-500 text-white' : 'border border-zinc-800 bg-zinc-900 text-zinc-400'}`}>Todos</button>
          {filters.map((f) => (
            <button key={f.label} onClick={() => setSelectedFilter(f.label)} className={`rounded-xl px-3 py-1.5 text-xs font-medium ${selectedFilter === f.label ? 'bg-indigo-500 text-white' : 'border border-zinc-800 bg-zinc-900 text-zinc-400'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum produto encontrado" description="Não há produtos nessa faixa de validade." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Dias restantes</th>
                  <th className="px-4 py-3">Validade</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filtered.map((p) => {
                  const validity = getValidityStatus(p.daysRemaining);
                  const customer = customers.find((c) => c.id === p.customerId);
                  return (
                    <tr key={p.id} className="hover:bg-zinc-800/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-200">{p.internalCode}</p>
                        <p className="text-xs text-zinc-500">{p.uuid.slice(0, 13)}...</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{customer?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="dot" colorClass={validity.bg} dotColor={validity.color}>{validity.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{p.daysRemaining ?? '—'}</td>
                      <td className="px-4 py-3 text-zinc-400">{formatDate(p.expiresAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => onRenew(p.id, customer?.id || '', 2)} className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20">
                          Renovar 2 anos
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-zinc-800 md:hidden">
            {filtered.map((p) => {
              const validity = getValidityStatus(p.daysRemaining);
              const customer = customers.find((c) => c.id === p.customerId);
              return (
                <div key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-200">{p.internalCode}</p>
                      <p className="truncate text-xs text-zinc-500">{customer?.name || '—'}</p>
                    </div>
                    <Badge variant="dot" colorClass={validity.bg} dotColor={validity.color}>{validity.label}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                    <span>{p.daysRemaining ?? '—'} dias restantes</span>
                    <span>Validade: {formatDate(p.expiresAt)}</span>
                  </div>
                  <button
                    onClick={() => onRenew(p.id, customer?.id || '', 2)}
                    className="mt-3 w-full rounded-lg bg-emerald-500/10 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20"
                  >
                    Renovar 2 anos
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
