import { useMemo } from 'react';
import {
  Users,
  UserCheck,
  Lock,
  AlertTriangle,
  XCircle,
  PackageCheck,
  CreditCard,
  PackageX,
  Zap,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Line,
  LineChart,
} from 'recharts';
import { cn, getValidityStatus } from '@/lib/adminUtils';
import type { Customer, Product } from '@/types/admin';

interface DashboardViewProps {
  stats: {
    totalCustomers: number;
    activeCustomers: number;
    blockedCustomers: number;
    expiringCustomers: number;
    expiredCustomers: number;
    availableProducts: number;
    activatedProducts: number;
    notActivatedProducts: number;
    activationsToday: number;
    activationsThisMonth: number;
    renewalsThisMonth: number;
  };
  customers: Customer[];
  products: Product[];
  monthlyStats: { month: string; activations: number; available: number; activated: number; expiring: number; expired: number; newCustomers: number }[];
  growthMapData: { state: string; value: number }[];
}

const statCards = (stats: DashboardViewProps['stats']) => [
  { label: 'Total de clientes', value: stats.totalCustomers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { label: 'Clientes ativos', value: stats.activeCustomers, icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { label: 'Clientes bloqueados', value: stats.blockedCustomers, icon: Lock, color: 'text-red-400', bg: 'bg-red-500/10' },
  { label: 'Clientes vencendo', value: stats.expiringCustomers, icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { label: 'Clientes vencidos', value: stats.expiredCustomers, icon: XCircle, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
  { label: 'Produtos disponíveis', value: stats.availableProducts, icon: PackageCheck, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { label: 'Produtos ativados', value: stats.activatedProducts, icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { label: 'Não ativados', value: stats.notActivatedProducts, icon: PackageX, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
  { label: 'Ativações hoje', value: stats.activationsToday, icon: Zap, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { label: 'Ativações no mês', value: stats.activationsThisMonth, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { label: 'Renovações no mês', value: stats.renewalsThisMonth, icon: RefreshCw, color: 'text-orange-400', bg: 'bg-orange-500/10' },
];

export function DashboardView({ stats, products, monthlyStats, growthMapData }: DashboardViewProps) {
  const expiringSoon = useMemo(() => {
    return products
      .filter((p) => p.daysRemaining !== undefined && p.daysRemaining <= 180 && p.daysRemaining > 0)
      .slice(0, 6);
  }, [products]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6">
        {statCards(stats).map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/90 p-3 transition-all hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="truncate text-xs font-medium text-zinc-400" title={card.label}>
                  {card.label}
                </span>
                <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', card.bg)}>
                  <Icon className={cn('h-3.5 w-3.5', card.color)} />
                </div>
              </div>
              <p className="mt-1.5 text-lg font-bold tracking-tight text-zinc-100 sm:text-xl">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Crescimento de clientes">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyStats}>
              <defs>
                <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="month" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }} itemStyle={{ color: '#e4e4e7' }} />
              <Area type="monotone" dataKey="newCustomers" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCustomers)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ativações por mês">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="month" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }} itemStyle={{ color: '#e4e4e7' }} />
              <Bar dataKey="activations" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Produtos disponíveis vs ativados">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="month" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }} itemStyle={{ color: '#e4e4e7' }} />
              <Line type="monotone" dataKey="available" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="activated" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Produtos vencendo vs expirados">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyStats}>
              <defs>
                <linearGradient id="colorExpiring" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="month" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }} itemStyle={{ color: '#e4e4e7' }} />
              <Area type="monotone" dataKey="expiring" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorExpiring)" />
              <Area type="monotone" dataKey="expired" stroke="#71717a" strokeWidth={2} fillOpacity={0.1} fill="#71717a" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Mapa de crescimento por estado">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {growthMapData.map((item) => (
            <div key={item.state} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center">
              <p className="text-lg font-semibold text-zinc-100">{item.state}</p>
              <p className="text-xs text-zinc-500">{item.value} ativos</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, (item.value / 500) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Produtos próximos do vencimento">
        {expiringSoon.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">Nenhum produto próximo do vencimento.</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {expiringSoon.map((p) => {
              const validity = getValidityStatus(p.daysRemaining);
              return (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{p.internalCode} {p.type ? `— ${p.type}` : ''}</p>
                    <p className="text-xs text-zinc-500">{p.uuid}</p>
                  </div>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', validity.bg, validity.text)}>
                    {p.daysRemaining} dias
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-200">{title}</h3>
      {children}
    </div>
  );
}
