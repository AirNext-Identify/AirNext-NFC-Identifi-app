import { useAuth } from '../../contexts/AuthContext';
import { BarChart3, Eye, TrendingUp, Smartphone, Monitor, Link2, Wifi, Zap, Calendar } from 'lucide-react';

function StatRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-zinc-400 w-24 shrink-0 truncate">{label}</p>
      <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs font-bold text-white w-8 text-right shrink-0">{value}</p>
    </div>
  );
}

export default function Statistics() {
  const { products, visits } = useAuth();

  const totalViews = visits.length;

  const now = new Date();
  const today = visits.filter(v => new Date(v.createdAt).toDateString() === now.toDateString()).length;
  const week = visits.filter(v => {
    const d = new Date(v.createdAt);
    return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7;
  }).length;
  const month = visits.filter(v => {
    const d = new Date(v.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const mobileVisits = visits.filter(v => v.device === 'mobile').length;
  const desktopVisits = visits.filter(v => v.device !== 'mobile').length;

  const byType = {
    nfc: visits.filter(v => v.type === 'nfc').length,
    qr: visits.filter(v => v.type === 'qr').length,
    link: visits.filter(v => v.type === 'link').length,
  };

  // Cliques por ação
  const actionLabels: Record<string, string> = {
    whatsapp: 'WhatsApp', instagram: 'Instagram', facebook: 'Facebook',
    tiktok: 'TikTok', linkedin: 'LinkedIn', youtube: 'YouTube',
    twitter: 'X / Twitter', telegram: 'Telegram', github: 'GitHub',
    phone: 'Telefone', email: 'E-mail', site: 'Site', share: 'Compartilhar',
    save_contact: 'Salvar Contato',
  };
  const clicksByAction = Object.entries(actionLabels)
    .map(([key, label]) => ({
      key,
      label,
      value: visits.filter(v => v.action === key).length,
    }))
    .filter(r => r.value > 0)
    .sort((a, b) => b.value - a.value);
  const maxAction = Math.max(...clicksByAction.map(r => r.value), 1);

  // Last 7 days chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short' });
    const count = visits.filter(v => new Date(v.createdAt).toDateString() === d.toDateString()).length;
    return { label, count };
  });
  const maxDay = Math.max(...last7Days.map(d => d.count), 1);

  // Per product
  const productStats = products.filter(p => p.status === 'ATIVO').map(p => ({
    id: p.id,
    name: (p.profileData as any)?.nome || (p.profileData as any)?.nomeEmpresa || (p.productType || 'Produto'),
    views: visits.filter(v => v.productId === p.id).length,
    category: p.category || 'PERSONAL',
  }));
  const maxProd = Math.max(...productStats.map(p => p.views), 1);

  const catColors: Record<string, string> = {
    PERSONAL: 'bg-blue-500',
    BUSINESS: 'bg-slate-500',
    PET: 'bg-amber-500',
    KIDS: 'bg-pink-500',
    SENIOR: 'bg-teal-500',
    TEA: 'bg-indigo-500',
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-black text-white">Estatísticas</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Acompanhe os acessos aos seus perfis</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Acessos', value: totalViews, icon: Eye, color: 'from-blue-500 to-violet-500', sub: 'todos os perfis' },
          { label: 'Hoje', value: today, icon: Calendar, color: 'from-green-500 to-emerald-500', sub: 'visualizações hoje' },
          { label: 'Última Semana', value: week, icon: TrendingUp, color: 'from-amber-500 to-orange-500', sub: '7 dias' },
          { label: 'Este Mês', value: month, icon: BarChart3, color: 'from-pink-500 to-rose-500', sub: new Date().toLocaleString('pt-BR', { month: 'long' }) },
        ].map(card => (
          <div key={card.label} className="glass rounded-2xl p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shrink-0`}>
              <card.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{card.label}</p>
              <p className="text-2xl font-black text-white leading-tight">{card.value}</p>
              <p className="text-[9px] text-zinc-600">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Daily chart - last 7 days */}
      <div className="glass rounded-2xl p-4">
        <p className="text-xs font-bold text-white mb-4">Acessos — Últimos 7 dias</p>
        {visits.length === 0 ? (
          <div className="h-28 flex items-end justify-around gap-1.5 mb-2">
            {last7Days.map(d => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-white/5 rounded-t-lg" style={{ height: '80px' }} />
                <span className="text-[8px] text-zinc-700">{d.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-28 flex items-end justify-around gap-1.5 mb-2">
            {last7Days.map(d => {
              const pct = Math.max((d.count / maxDay) * 100, d.count > 0 ? 8 : 4);
              return (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[8px] text-zinc-500 font-bold">{d.count || ''}</span>
                  <div className="w-full bg-gradient-to-t from-blue-600 to-violet-500 rounded-t-lg transition-all"
                    style={{ height: `${pct}%`, minHeight: d.count > 0 ? '8px' : '4px', opacity: d.count > 0 ? 1 : 0.3 }} />
                  <span className="text-[8px] text-zinc-600 capitalize">{d.label}</span>
                </div>
              );
            })}
          </div>
        )}
        {visits.length === 0 && (
          <p className="text-center text-xs text-zinc-600 py-2">Nenhum acesso registrado ainda</p>
        )}
      </div>

      {/* Device & Type breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-white">Dispositivos</p>
          <div className="flex items-end gap-3">
            <div className="flex-1 text-center">
              <div className="h-16 bg-blue-500/20 rounded-xl flex items-end justify-center pb-2 mb-1" style={{ background: `linear-gradient(to top, rgba(59,130,246,0.4) ${mobileVisits/(mobileVisits+desktopVisits||1)*100}%, transparent 0)` }}>
                <Smartphone className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-lg font-black text-white">{mobileVisits}</p>
              <p className="text-[9px] text-zinc-600">Mobile</p>
            </div>
            <div className="flex-1 text-center">
              <div className="h-16 bg-violet-500/20 rounded-xl flex items-end justify-center pb-2 mb-1" style={{ background: `linear-gradient(to top, rgba(139,92,246,0.4) ${desktopVisits/(mobileVisits+desktopVisits||1)*100}%, transparent 0)` }}>
                <Monitor className="h-5 w-5 text-violet-400" />
              </div>
              <p className="text-lg font-black text-white">{desktopVisits}</p>
              <p className="text-[9px] text-zinc-600">Desktop</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-white">Tipo de Acesso</p>
          <div className="space-y-2">
            {[
              { label: 'NFC', value: byType.nfc, icon: Wifi, color: 'text-cyan-400' },
              { label: 'QR Code', value: byType.qr, icon: Zap, color: 'text-amber-400' },
              { label: 'Link', value: byType.link, icon: Link2, color: 'text-blue-400' },
            ].map(t => (
              <div key={t.label} className="flex items-center gap-2">
                <t.icon className={`h-3.5 w-3.5 shrink-0 ${t.color}`} />
                <div className="flex-1 bg-white/5 rounded-full h-1.5">
                  <div className={`h-full rounded-full bg-gradient-to-r ${t.label === 'NFC' ? 'from-cyan-500 to-blue-500' : t.label === 'QR Code' ? 'from-amber-500 to-orange-500' : 'from-blue-500 to-violet-500'}`}
                    style={{ width: `${visits.length > 0 ? (t.value / visits.length) * 100 : 0}%` }} />
                </div>
                <span className="text-xs font-bold text-white w-6 text-right">{t.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clicks by action */}
      {clicksByAction.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <p className="text-xs font-bold text-white mb-4">Cliques por Canal</p>
          <div className="space-y-3">
            {clicksByAction.map(r => (
              <StatRow key={r.key} label={r.label} value={r.value} max={maxAction} color="bg-violet-500" />
            ))}
          </div>
        </div>
      )}

      {/* Per profile stats */}
      {productStats.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <p className="text-xs font-bold text-white mb-4">Acessos por Perfil</p>
          <div className="space-y-3">
            {productStats.sort((a, b) => b.views - a.views).map(p => (
              <StatRow
                key={p.id}
                label={p.name}
                value={p.views}
                max={maxProd}
                color={catColors[p.category] || 'bg-blue-500'}
              />
            ))}
          </div>
        </div>
      )}

      {visits.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center border border-dashed border-white/10">
          <BarChart3 className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-zinc-400 mb-1">Nenhuma estatística ainda</p>
          <p className="text-xs text-zinc-600">Compartilhe seu perfil para começar a ver os dados</p>
        </div>
      )}
    </div>
  );
}
