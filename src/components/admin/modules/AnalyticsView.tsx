import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Loader2,
  Minus,
  Package,
  RefreshCw,
  Users,
  Wallet,
} from 'lucide-react';
import { cn, exportCSV, formatCurrency, formatDate } from '@/lib/adminUtils';
import type { AdminVisit, Customer, Product, Renewal } from '@/types/admin';

type GoogleScanStats = Record<string, { total: number; last7: number; last30: number; nfc: number; qr: number; lastAt?: string }>;

interface AnalyticsViewProps {
  customers: Customer[];
  /** Todos os produtos (padrão + Google). */
  products: Product[];
  renewals: Renewal[];
  visits: AdminVisit[];
  googleScans: GoogleScanStats;
  onRefresh?: () => Promise<void> | void;
}

type PeriodKey = 'today' | '7d' | '30d' | '90d' | '1y' | 'custom';
type TabKey = 'overview' | 'access' | 'customers' | 'products' | 'google';

const PERIODS: { label: string; value: PeriodKey; days?: number }[] = [
  { label: 'Hoje', value: 'today', days: 1 },
  { label: '7 dias', value: '7d', days: 7 },
  { label: '30 dias', value: '30d', days: 30 },
  { label: '90 dias', value: '90d', days: 90 },
  { label: '12 meses', value: '1y', days: 365 },
  { label: 'Personalizado', value: 'custom' },
];

const TABS: { id: TabKey; label: string }[] = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'access', label: 'Acessos' },
  { id: 'customers', label: 'Clientes' },
  { id: 'products', label: 'Produtos' },
  { id: 'google', label: 'AirNext Google' },
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#a855f7', '#71717a'];
const TOOLTIP = {
  contentStyle: { backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: 12 },
  itemStyle: { color: '#e4e4e7' },
  labelStyle: { color: '#a1a1aa' },
};
const DAY = 86_400_000;
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const toInputDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromInputDate = (v: string) => {
  const [y, m, d] = v.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const inRange = (iso: string | undefined, a: Date, b: Date) => {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= a.getTime() && t < b.getTime();
};

export function AnalyticsView({ customers, products, renewals, visits, googleScans, onRefresh }: AnalyticsViewProps) {
  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [tab, setTab] = useState<TabKey>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const today = startOfDay(new Date());
  const [customFrom, setCustomFrom] = useState(toInputDate(new Date(today.getTime() - 29 * DAY)));
  const [customTo, setCustomTo] = useState(toInputDate(today));

  // ─── Intervalo atual e o período anterior (mesmo tamanho) para comparação ──
  const range = useMemo(() => {
    const base = startOfDay(new Date());
    let from: Date;
    let to: Date; // exclusivo (início do dia seguinte)
    if (period === 'custom') {
      from = startOfDay(fromInputDate(customFrom));
      to = new Date(startOfDay(fromInputDate(customTo)).getTime() + DAY);
      if (to <= from) to = new Date(from.getTime() + DAY);
    } else {
      const days = PERIODS.find((p) => p.value === period)?.days ?? 30;
      to = new Date(base.getTime() + DAY);
      from = new Date(to.getTime() - days * DAY);
    }
    const len = to.getTime() - from.getTime();
    return { from, to, prevFrom: new Date(from.getTime() - len), prevTo: from, days: Math.round(len / DAY) };
  }, [period, customFrom, customTo]);

  const stdProducts = useMemo(() => products.filter((p) => p.productLine !== 'GOOGLE'), [products]);
  const googleProducts = useMemo(() => products.filter((p) => p.productLine === 'GOOGLE'), [products]);
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const customerById = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);

  // ─── Acessos (tabela visits) ────────────────────────────────────────────
  const curVisits = useMemo(() => visits.filter((v) => inRange(v.createdAt, range.from, range.to)), [visits, range]);
  const prevVisits = useMemo(() => visits.filter((v) => inRange(v.createdAt, range.prevFrom, range.prevTo)), [visits, range]);

  // ─── Indicadores do período ─────────────────────────────────────────────
  const kpis = useMemo(() => {
    const act = (a: Date, b: Date) => stdProducts.filter((p) => inRange(p.activatedAt, a, b)).length;
    const newC = (a: Date, b: Date) => customers.filter((c) => inRange(c.registeredAt, a, b)).length;
    const ren = (a: Date, b: Date) => renewals.filter((r) => inRange(r.renewedAt, a, b));
    const rCur = ren(range.from, range.to);
    const rPrev = ren(range.prevFrom, range.prevTo);
    const sum = (list: Renewal[]) => list.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    return {
      visits: { cur: curVisits.length, prev: prevVisits.length },
      activations: { cur: act(range.from, range.to), prev: act(range.prevFrom, range.prevTo) },
      newCustomers: { cur: newC(range.from, range.to), prev: newC(range.prevFrom, range.prevTo) },
      revenue: { cur: sum(rCur), prev: sum(rPrev) },
      renewals: { cur: rCur.length, prev: rPrev.length },
    };
  }, [stdProducts, customers, renewals, range, curVisits, prevVisits]);

  // ─── Série temporal (diária até 92 dias, mensal acima disso) ─────────────
  const series = useMemo(() => {
    const monthly = range.days > 92;
    const buckets: { key: string; label: string; nfc: number; qr: number; link: number; activations: number; newCustomers: number; revenue: number }[] = [];
    const index = new Map<string, number>();
    const keyOf = (d: Date) => (monthly ? `${d.getFullYear()}-${d.getMonth()}` : toInputDate(d));
    const labelOf = (d: Date) =>
      monthly
        ? d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '')
        : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const cursor = monthly ? new Date(range.from.getFullYear(), range.from.getMonth(), 1) : new Date(range.from);
    while (cursor < range.to) {
      const k = keyOf(cursor);
      index.set(k, buckets.length);
      buckets.push({ key: k, label: labelOf(cursor), nfc: 0, qr: 0, link: 0, activations: 0, newCustomers: 0, revenue: 0 });
      if (monthly) cursor.setMonth(cursor.getMonth() + 1);
      else cursor.setDate(cursor.getDate() + 1);
    }
    const slot = (iso?: string) => {
      if (!iso) return undefined;
      const d = new Date(iso);
      if (d < range.from || d >= range.to) return undefined;
      const i = index.get(keyOf(d));
      return i === undefined ? undefined : buckets[i];
    };
    curVisits.forEach((v) => {
      const b = slot(v.createdAt);
      if (!b) return;
      if (v.type === 'qr') b.qr++;
      else if (v.type === 'link') b.link++;
      else b.nfc++;
    });
    stdProducts.forEach((p) => { const b = slot(p.activatedAt); if (b) b.activations++; });
    customers.forEach((c) => { const b = slot(c.registeredAt); if (b) b.newCustomers++; });
    renewals.forEach((r) => { const b = slot(r.renewedAt); if (b) b.revenue += Number(r.amount) || 0; });
    return buckets.map((b) => ({ ...b, total: b.nfc + b.qr + b.link }));
  }, [range, curVisits, stdProducts, customers, renewals]);

  const bySource = useMemo(() => {
    const n = { nfc: 0, qr: 0, link: 0 };
    curVisits.forEach((v) => {
      if (v.type === 'qr') n.qr++;
      else if (v.type === 'link') n.link++;
      else n.nfc++;
    });
    return [
      { name: 'NFC', value: n.nfc },
      { name: 'QR Code', value: n.qr },
      { name: 'Link', value: n.link },
    ].filter((x) => x.value > 0);
  }, [curVisits]);

  const rank = (pick: (v: AdminVisit) => string | undefined, limit = 6) => {
    const m = new Map<string, number>();
    curVisits.forEach((v) => {
      const k = (pick(v) || '').toString().trim() || 'Não informado';
      m.set(k, (m.get(k) || 0) + 1);
    });
    return Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, limit);
  };
  const byDevice = useMemo(() => rank((v) => v.device), [curVisits]); // eslint-disable-line react-hooks/exhaustive-deps
  const byCity = useMemo(() => rank((v) => v.city, 8), [curVisits]); // eslint-disable-line react-hooks/exhaustive-deps
  const byAction = useMemo(() => rank((v) => v.action || 'view', 8), [curVisits]); // eslint-disable-line react-hooks/exhaustive-deps

  const byWeekday = useMemo(() => {
    const arr = WEEKDAYS.map((d) => ({ name: d, value: 0 }));
    curVisits.forEach((v) => { arr[new Date(v.createdAt).getDay()].value++; });
    return arr;
  }, [curVisits]);

  const byHour = useMemo(() => {
    const arr = Array.from({ length: 24 }, (_, h) => ({ name: `${String(h).padStart(2, '0')}h`, value: 0 }));
    curVisits.forEach((v) => { arr[new Date(v.createdAt).getHours()].value++; });
    return arr;
  }, [curVisits]);

  // ─── Rankings ───────────────────────────────────────────────────────────
  const topProducts = useMemo(() => {
    const m = new Map<string, { id: string; total: number; nfc: number; qr: number }>();
    curVisits.forEach((v) => {
      if (!v.productId) return;
      const e = m.get(v.productId) || { id: v.productId, total: 0, nfc: 0, qr: 0 };
      e.total++;
      if (v.type === 'qr') e.qr++;
      else e.nfc++;
      m.set(v.productId, e);
    });
    return Array.from(m.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((e) => {
        const p = productById.get(e.id);
        const c = p?.customerId ? customerById.get(p.customerId) : undefined;
        return { ...e, code: p?.internalCode || e.id.slice(0, 8), customer: c?.name || 'Sem dono', status: p?.status || '—' };
      });
  }, [curVisits, productById, customerById]);

  const topCustomers = useMemo(() => {
    const m = new Map<string, number>();
    curVisits.forEach((v) => { if (v.customerId) m.set(v.customerId, (m.get(v.customerId) || 0) + 1); });
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, total]) => {
        const c = customerById.get(id);
        return { id, total, name: c?.name || 'Cliente removido', email: c?.email || '', products: c?.productCount ?? 0, plan: c?.plan || '—' };
      });
  }, [curVisits, customerById]);

  // ─── Situação atual (foto do momento, não depende do período) ───────────
  const snapshot = useMemo(() => {
    const count = (s: Product['status'][]) => stdProducts.filter((p) => s.includes(p.status)).length;
    return {
      active: customers.filter((c) => c.status === 'Ativo').length,
      blocked: customers.filter((c) => c.status === 'Bloqueado' || c.status === 'Suspenso').length,
      expiring: customers.filter((c) => c.daysRemaining > 0 && c.daysRemaining <= 180).length,
      expired: customers.filter((c) => c.daysRemaining <= 0 && c.productCount > 0).length,
      withoutProducts: customers.filter((c) => c.productCount === 0).length,
      notProgrammed: count(['Não programado']),
      available: count(['Disponível para ativação']),
      activated: count(['Ativado', 'Renovado']),
      expiringProducts: count(['Expirando']),
      expiredProducts: count(['Expirado']),
      blockedProducts: count(['Bloqueado', 'Cancelado']),
    };
  }, [customers, stdProducts]);

  const productStatusData = useMemo(
    () =>
      [
        { name: 'Ativados', value: snapshot.activated, color: '#10b981' },
        { name: 'Disponíveis', value: snapshot.available, color: '#6366f1' },
        { name: 'Não programados', value: snapshot.notProgrammed, color: '#71717a' },
        { name: 'Expirando', value: snapshot.expiringProducts, color: '#f59e0b' },
        { name: 'Expirados', value: snapshot.expiredProducts, color: '#ef4444' },
        { name: 'Bloqueados', value: snapshot.blockedProducts, color: '#a855f7' },
      ].filter((x) => x.value > 0),
    [snapshot]
  );

  const planData = useMemo(() => {
    const m = new Map<string, number>();
    customers.forEach((c) => m.set(c.plan, (m.get(c.plan) || 0) + 1));
    return Array.from(m.entries()).map(([name, value]) => ({ name, value }));
  }, [customers]);

  const stateData = useMemo(() => {
    const m = new Map<string, number>();
    customers.forEach((c) => {
      const s = (c.address.state || '').toUpperCase().trim();
      if (s) m.set(s, (m.get(s) || 0) + 1);
    });
    return Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [customers]);

  // ─── AirNext Google ─────────────────────────────────────────────────────
  const google = useMemo(() => {
    const rows = googleProducts.map((p) => {
      const s = googleScans[p.id];
      const c = p.customerId ? customerById.get(p.customerId) : undefined;
      return {
        id: p.id,
        code: p.internalCode,
        customer: c?.name || 'Sem dono',
        status: p.status,
        total: s?.total || 0,
        last7: s?.last7 || 0,
        last30: s?.last30 || 0,
        nfc: s?.nfc || 0,
        qr: s?.qr || 0,
        lastAt: s?.lastAt,
      };
    });
    const sum = (k: 'total' | 'last7' | 'last30' | 'nfc' | 'qr') => rows.reduce((t, r) => t + r[k], 0);
    return {
      rows: rows.sort((a, b) => b.total - a.total),
      total: sum('total'),
      last7: sum('last7'),
      last30: sum('last30'),
      activated: googleProducts.filter((p) => p.status === 'Ativado').length,
      idle: rows.filter((r) => r.status === 'Ativado' && r.last30 === 0).length,
    };
  }, [googleProducts, googleScans, customerById]);

  // ─── Ações ──────────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const periodLabel =
    period === 'custom'
      ? `${formatDate(range.from)} a ${formatDate(new Date(range.to.getTime() - DAY))}`
      : PERIODS.find((p) => p.value === period)?.label;

  const handleExport = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    if (tab === 'customers') {
      exportCSV(
        `analytics-clientes-${stamp}.csv`,
        customers.map((c) => ({
          Cliente: c.name,
          Email: c.email,
          Plano: c.plan,
          Status: c.status,
          Produtos: c.productCount,
          Cadastro: formatDate(c.registeredAt),
          Renovação: formatDate(c.nextRenewalDate),
          'Dias restantes': c.daysRemaining,
          Estado: c.address.state,
        }))
      );
    } else if (tab === 'products') {
      exportCSV(
        `analytics-produtos-${stamp}.csv`,
        topProducts.map((p) => ({ Produto: p.code, Cliente: p.customer, Status: p.status, 'Acessos no período': p.total, NFC: p.nfc, QR: p.qr }))
      );
    } else if (tab === 'google') {
      exportCSV(
        `analytics-google-${stamp}.csv`,
        google.rows.map((r) => ({ Placa: r.code, Cliente: r.customer, Status: r.status, Total: r.total, '7 dias': r.last7, '30 dias': r.last30, NFC: r.nfc, QR: r.qr, 'Último acesso': formatDate(r.lastAt) }))
      );
    } else {
      exportCSV(
        `analytics-acessos-${stamp}.csv`,
        series.map((s) => ({ Período: s.label, NFC: s.nfc, QR: s.qr, Link: s.link, Total: s.total, Ativações: s.activations, 'Novos clientes': s.newCustomers, 'Receita de renovações': s.revenue }))
      );
    }
  };

  const visitsCapped = visits.length >= 5000;
  const noVisits = curVisits.length === 0;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      {/* Barra de controle: período + atualizar + exportar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'rounded-xl px-3.5 py-2 text-sm font-medium transition-colors',
                period === p.value ? 'bg-zinc-100 text-zinc-950' : 'border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
              )}
            >
              {p.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={!onRefresh || refreshing}
              className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm font-medium text-zinc-300 hover:text-white disabled:opacity-50"
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 rounded-xl bg-indigo-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-600">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
          </div>
        </div>

        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <label className="flex items-center gap-2">
              De
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => e.target.value && setCustomFrom(e.target.value)}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-zinc-200 [color-scheme:dark]"
              />
            </label>
            <label className="flex items-center gap-2">
              até
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={toInputDate(today)}
                onChange={(e) => e.target.value && setCustomTo(e.target.value)}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-zinc-200 [color-scheme:dark]"
              />
            </label>
          </div>
        )}

        <p className="text-xs text-zinc-500">
          Período: <span className="text-zinc-300">{periodLabel}</span> ({range.days} {range.days === 1 ? 'dia' : 'dias'}) · comparado ao período anterior de mesmo tamanho
          {visitsCapped && ' · mostrando os 5.000 acessos mais recentes'}
        </p>
      </div>

      {/* Indicadores do período */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Activity} label="Acessos" value={String(kpis.visits.cur)} cur={kpis.visits.cur} prev={kpis.visits.prev} />
        <Kpi icon={Package} label="Ativações" value={String(kpis.activations.cur)} cur={kpis.activations.cur} prev={kpis.activations.prev} />
        <Kpi icon={Users} label="Novos clientes" value={String(kpis.newCustomers.cur)} cur={kpis.newCustomers.cur} prev={kpis.newCustomers.prev} />
        <Kpi icon={Wallet} label={`Renovações (${kpis.renewals.cur})`} value={formatCurrency(kpis.revenue.cur)} cur={kpis.revenue.cur} prev={kpis.revenue.prev} />
      </div>

      {/* Abas */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn('shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors', tab === t.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard title="Acessos no período" className="lg:col-span-2" empty={noVisits ? 'Nenhum acesso registrado neste período.' : undefined}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="gAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="label" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP} />
                <Area type="monotone" dataKey="total" name="Acessos" stroke="#6366f1" strokeWidth={2} fill="url(#gAcc)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Ativações no período">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="label" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP} cursor={{ fill: '#ffffff08' }} />
                <Bar dataKey="activations" name="Ativações" fill="#10b981" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Novos clientes no período">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="label" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP} cursor={{ fill: '#ffffff08' }} />
                <Bar dataKey="newCustomers" name="Novos clientes" fill="#f59e0b" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Situação dos produtos (agora)" empty={productStatusData.length === 0 ? 'Sem produtos cadastrados.' : undefined}>
            <Donut data={productStatusData} />
          </ChartCard>

          <ChartCard title="Situação dos clientes (agora)">
            <div className="grid grid-cols-2 gap-2">
              <Mini label="Ativos" value={snapshot.active} tone="emerald" />
              <Mini label="Bloqueados/suspensos" value={snapshot.blocked} tone="red" />
              <Mini label="Vencendo (≤180d)" value={snapshot.expiring} tone="amber" />
              <Mini label="Vencidos" value={snapshot.expired} tone="red" />
              <Mini label="Sem produtos" value={snapshot.withoutProducts} tone="zinc" />
              <Mini label="Total de clientes" value={customers.length} tone="indigo" />
            </div>
          </ChartCard>
        </div>
      )}

      {tab === 'access' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard title="Acessos por origem ao longo do tempo" className="lg:col-span-2" empty={noVisits ? 'Nenhum acesso registrado neste período.' : undefined}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="label" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP} cursor={{ fill: '#ffffff08' }} />
                <Bar dataKey="nfc" name="NFC" stackId="a" fill="#6366f1" />
                <Bar dataKey="qr" name="QR Code" stackId="a" fill="#10b981" />
                <Bar dataKey="link" name="Link" stackId="a" fill="#f59e0b" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Origem dos acessos" empty={noVisits ? 'Sem dados.' : undefined}>
            <Donut data={bySource.map((d, i) => ({ ...d, color: COLORS[i] }))} />
          </ChartCard>
          <ChartCard title="Dispositivos" empty={noVisits ? 'Sem dados.' : undefined}>
            <Donut data={byDevice.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] }))} />
          </ChartCard>
          <ChartCard title="Dia da semana" empty={noVisits ? 'Sem dados.' : undefined}>
            <SimpleBars data={byWeekday} color="#6366f1" />
          </ChartCard>
          <ChartCard title="Horário de pico" empty={noVisits ? 'Sem dados.' : undefined}>
            <SimpleBars data={byHour} color="#10b981" />
          </ChartCard>
          <ChartCard title="Cidades" empty={noVisits ? 'Sem dados.' : undefined}>
            <RankList data={byCity} />
          </ChartCard>
          <ChartCard title="Ações realizadas" empty={noVisits ? 'Sem dados.' : undefined}>
            <RankList data={byAction.map((a) => ({ ...a, name: actionLabel(a.name) }))} />
          </ChartCard>
        </div>
      )}

      {tab === 'customers' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard title="Clientes por plano" empty={planData.length === 0 ? 'Sem clientes.' : undefined}>
            <Donut data={planData.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] }))} />
          </ChartCard>
          <ChartCard title="Clientes por estado" empty={stateData.length === 0 ? 'Nenhum cliente com estado preenchido.' : undefined}>
            <RankList data={stateData} />
          </ChartCard>
          <ChartCard
            title="Clientes mais engajados (acessos no período)"
            className="lg:col-span-2"
            empty={topCustomers.length === 0 ? 'Nenhum acesso associado a clientes neste período.' : undefined}
          >
            <Table
              head={['#', 'Cliente', 'Plano', 'Produtos', 'Acessos']}
              rows={topCustomers.map((c, i) => [
                String(i + 1),
                <div key={c.id}>
                  <p className="font-medium text-zinc-200">{c.name}</p>
                  <p className="text-xs text-zinc-500">{c.email}</p>
                </div>,
                c.plan,
                String(c.products),
                String(c.total),
              ])}
            />
          </ChartCard>
        </div>
      )}

      {tab === 'products' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard title="Situação dos produtos (agora)" empty={productStatusData.length === 0 ? 'Sem produtos cadastrados.' : undefined}>
            <Donut data={productStatusData} />
          </ChartCard>
          <ChartCard title="Resumo">
            <div className="grid grid-cols-2 gap-2">
              <Mini label="Ativados" value={snapshot.activated} tone="emerald" />
              <Mini label="Disponíveis" value={snapshot.available} tone="indigo" />
              <Mini label="Não programados" value={snapshot.notProgrammed} tone="zinc" />
              <Mini label="Expirando" value={snapshot.expiringProducts} tone="amber" />
              <Mini label="Expirados" value={snapshot.expiredProducts} tone="red" />
              <Mini label="Bloqueados/cancelados" value={snapshot.blockedProducts} tone="red" />
            </div>
          </ChartCard>
          <ChartCard
            title="Produtos mais acessados no período"
            className="lg:col-span-2"
            empty={topProducts.length === 0 ? 'Nenhum acesso registrado neste período.' : undefined}
          >
            <Table
              head={['#', 'Produto', 'Cliente', 'Status', 'NFC', 'QR', 'Total']}
              rows={topProducts.map((p, i) => [String(i + 1), p.code, p.customer, p.status, String(p.nfc), String(p.qr), String(p.total)])}
            />
          </ChartCard>
        </div>
      )}

      {tab === 'google' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Mini label="Placas ativadas" value={google.activated} tone="emerald" />
            <Mini label="Acessos (total)" value={google.total} tone="indigo" />
            <Mini label="Últimos 7 dias" value={google.last7} tone="indigo" />
            <Mini label="Últimos 30 dias" value={google.last30} tone="indigo" />
          </div>
          <Mini label="Placas ativadas sem nenhum acesso em 30 dias" value={google.idle} tone={google.idle ? 'amber' : 'zinc'} />
          <ChartCard
            title="Placas por acessos"
            empty={google.rows.length === 0 ? 'Nenhuma placa AirNext Google cadastrada (ou escaneamentos indisponíveis — rode sql/11).' : undefined}
          >
            <Table
              head={['Placa', 'Cliente', 'Status', 'Total', '7d', '30d', 'NFC', 'QR', 'Último acesso']}
              rows={google.rows
                .slice(0, 30)
                .map((r) => [r.code, r.customer, r.status, String(r.total), String(r.last7), String(r.last30), String(r.nfc), String(r.qr), r.lastAt ? formatDate(r.lastAt) : '—'])}
            />
          </ChartCard>
          <p className="text-xs text-zinc-500">Estes números são totais acumulados e não dependem do período selecionado acima.</p>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── componentes auxiliares ───────────────────────── */

function actionLabel(a: string) {
  const map: Record<string, string> = {
    view: 'Visualização',
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    email: 'E-mail',
    phone: 'Telefone',
    site: 'Site',
    share: 'Compartilhar',
  };
  return map[a] || a;
}

function Kpi({ icon: Icon, label, value, cur, prev }: { icon: React.ElementType; label: string; value: string; cur: number; prev: number }) {
  const diff = prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100;
  const up = diff > 0.5;
  const down = diff < -0.5;
  const Trend = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-400">{label}</p>
        <Icon className="h-4 w-4 text-zinc-600" />
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-100">{value}</p>
      <p className={cn('mt-1 flex items-center gap-1 text-xs', up ? 'text-emerald-400' : down ? 'text-red-400' : 'text-zinc-500')}>
        <Trend className="h-3.5 w-3.5" />
        {prev === 0 && cur === 0 ? 'sem variação' : prev === 0 ? 'novo no período' : `${diff > 0 ? '+' : ''}${diff.toFixed(0)}% vs. anterior`}
      </p>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: number; tone: 'emerald' | 'red' | 'amber' | 'indigo' | 'zinc' }) {
  const tones = { emerald: 'text-emerald-400', red: 'text-red-400', amber: 'text-amber-400', indigo: 'text-indigo-300', zinc: 'text-zinc-300' };
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <p className="truncate text-xs text-zinc-400" title={label}>
        {label}
      </p>
      <p className={cn('mt-1 text-xl font-bold', tones[tone])}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children, className, empty }: { title: string; children: React.ReactNode; className?: string; empty?: string }) {
  return (
    <div className={cn('min-w-0 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5', className)}>
      <h3 className="mb-4 text-sm font-semibold text-zinc-200">{title}</h3>
      {empty ? <p className="py-10 text-center text-sm text-zinc-500">{empty}</p> : children}
    </div>
  );
}

function Donut({ data }: { data: { name: string; value: number; color?: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2} stroke="none">
              {data.map((d, i) => (
                <Cell key={d.name} fill={d.color || COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...TOOLTIP} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-1.5">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color || COLORS[i % COLORS.length] }} />
            <span className="min-w-0 flex-1 truncate text-zinc-300">{d.name}</span>
            <span className="font-medium text-zinc-100">{d.value}</span>
            <span className="w-10 text-right text-xs text-zinc-500">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SimpleBars({ data, color }: { data: { name: string; value: number }[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip {...TOOLTIP} cursor={{ fill: '#ffffff08' }} />
        <Bar dataKey="value" name="Acessos" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function RankList({ data }: { data: { name: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <p className="py-6 text-center text-sm text-zinc-500">Sem dados.</p>;
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.name}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate text-zinc-300">{d.name}</span>
            <span className="ml-3 font-medium text-zinc-100">{d.value}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-zinc-500">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-zinc-800/30">
              {r.map((c, j) => (
                <td key={j} className="px-3 py-2.5 text-zinc-300">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
