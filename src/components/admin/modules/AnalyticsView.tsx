import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import type { Customer, Product, Renewal } from '@/types/admin';

interface AnalyticsViewProps {
  customers: Customer[];
  products: Product[];
  renewals: Renewal[];
  monthlyStats: { month: string; activations: number; available: number; activated: number; expiring: number; expired: number; newCustomers: number }[];
}

const filters = [
  { label: 'Hoje', value: 'today' },
  { label: '7 dias', value: '7d' },
  { label: '30 dias', value: '30d' },
  { label: '90 dias', value: '90d' },
  { label: '12 meses', value: '1y' },
  { label: 'Período personalizado', value: 'custom' },
];

export function AnalyticsView({ customers, products, renewals, monthlyStats }: AnalyticsViewProps) {
  const [activeFilter, setActiveFilter] = useState('1y');

  const stats = useMemo(() => {
    const activeCustomers = customers.filter((c) => c.status === 'Ativo').length;
    const newCustomers = customers.filter((c) => new Date(c.registeredAt).getFullYear() === new Date().getFullYear()).length;
    const expiringCustomers = customers.filter((c) => c.daysRemaining <= 180 && c.daysRemaining > 0).length;
    const expiredCustomers = customers.filter((c) => c.daysRemaining <= 0).length;
    const availableProducts = products.filter((p) => p.status === 'Disponível para ativação').length;
    const activatedProducts = products.filter((p) => p.status === 'Ativado' || p.status === 'Renovado').length;
    const waitingProducts = products.filter((p) => p.status === 'Não ativado').length;
    const expiredProducts = products.filter((p) => p.status === 'Expirado').length;
    const renewalsDone = renewals.length;
    return { activeCustomers, newCustomers, expiringCustomers, expiredCustomers, availableProducts, activatedProducts, waitingProducts, expiredProducts, renewalsDone };
  }, [customers, products, renewals]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${activeFilter === f.value ? 'bg-zinc-100 text-zinc-950' : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-5">
        <StatBox label="Clientes ativos" value={stats.activeCustomers} />
        <StatBox label="Clientes novos" value={stats.newCustomers} />
        <StatBox label="Clientes vencendo" value={stats.expiringCustomers} />
        <StatBox label="Clientes vencidos" value={stats.expiredCustomers} />
        <StatBox label="Produtos disponíveis" value={stats.availableProducts} />
        <StatBox label="Produtos ativados" value={stats.activatedProducts} />
        <StatBox label="Aguardando ativação" value={stats.waitingProducts} />
        <StatBox label="Produtos expirados" value={stats.expiredProducts} />
        <StatBox label="Renovações realizadas" value={stats.renewalsDone} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Ativações por período">
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

        <ChartCard title="Crescimento de clientes">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyStats}>
              <defs>
                <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="month" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }} itemStyle={{ color: '#e4e4e7' }} />
              <Area type="monotone" dataKey="newCustomers" stroke="#10b981" strokeWidth={2} fill="url(#colorGrowth)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Produtos disponíveis e ativados">
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

        <ChartCard title="Produtos vencendo e expirados">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyStats}>
              <defs>
                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="month" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }} itemStyle={{ color: '#e4e4e7' }} />
              <Area type="monotone" dataKey="expiring" stroke="#f59e0b" strokeWidth={2} fill="url(#colorExp)" />
              <Area type="monotone" dataKey="expired" stroke="#71717a" strokeWidth={2} fillOpacity={0.1} fill="#71717a" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/90 p-3 transition-colors hover:border-zinc-700">
      <p className="truncate text-xs font-medium text-zinc-400" title={label}>
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tracking-tight text-zinc-100 sm:text-xl">{value}</p>
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
