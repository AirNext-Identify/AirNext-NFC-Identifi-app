import { useState } from 'react';
import { useAuth, Product } from '../../contexts/AuthContext';
import {
  Plus,
  CreditCard,
  Watch,
  KeyRound,
  PawPrint,
  Tag,
  Zap,
  Eye,
  Edit,
  Share2,
  BarChart3,
  Bell,
  Activity,
  X,
  Copy,
  Download,
  ArrowRight,
  Globe,
  EyeOff,
  Sparkles,
  QrCode,
  ExternalLink,
  TrendingUp,
  Users,
  Package
} from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { QRCodeSVG } from 'qrcode.react';
import { BrandIcon } from '../../components/Icons';
import { isLightBackground, getDefaultBackground } from '../../lib/background';

/* ─── CONSTANTS ────────────────────────────────────────── */
const PT: Record<string, string> = {
  CARTAO: 'Cartão NFC', PULSEIRA: 'Pulseira NFC', CHAVEIRO: 'Chaveiro NFC',
  PLAQUINHA_PET: 'Plaquinha Pet', ETIQUETA: 'Etiqueta NFC'
};
const PI: Record<string, React.ElementType> = {
  CARTAO: CreditCard, PULSEIRA: Watch, CHAVEIRO: KeyRound,
  PLAQUINHA_PET: PawPrint, ETIQUETA: Tag
};
const CN: Record<string, string> = {
  PERSONAL: 'Personal', BUSINESS: 'Business', PET: 'Pet',
  KIDS: 'Kids', SENIOR: 'Senior', TEA: 'TEA'
};
const CAT_GRADIENT: Record<string, string> = {
  PERSONAL: 'from-blue-500 to-violet-600',
  BUSINESS: 'from-slate-500 to-zinc-600',
  PET: 'from-amber-500 to-orange-500',
  KIDS: 'from-pink-500 to-purple-500',
  SENIOR: 'from-teal-500 to-cyan-600',
  TEA: 'from-indigo-500 to-blue-600',
};
const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  ATIVO: { label: 'Ativo', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  DISPONIVEL: { label: 'Disponível', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  EXPIRADO: { label: 'Expirado', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  BLOQUEADO: { label: 'Bloqueado', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
};
const ALL_SOCIAL_KEYS = ['whatsapp','instagram','facebook','linkedin','twitter','tiktok','snapchat','youtube','telegram','spotify','discord','pinterest','threads','github','googlemaps','signal','whatsappTutor'];

function getName(p: any): string {
  if (!p.profileData) return PT[p.productType] || '—';
  return p.profileData.nome || p.profileData.nomeEmpresa || '—';
}

/* ─── MINI PREVIEW ─────────────────────────────────────── */
function MiniPreview({ p }: { p: any }) {
  const d = (p.profileData as any) || {};
  const name = d.nome || d.nomeEmpresa || 'Seu Nome';
  const bio = d.bio || d.descricao || '';
  const cargo = d.cargo || '';
  const socials = ALL_SOCIAL_KEYS.filter(k => d[k]);
  const primaryColor = d.__primaryColor || '#3b82f6';
  const secondaryColor = d.__secondaryColor || '#8b5cf6';
  const borderRadius = d.__borderRadius ?? 20;
  const wallpaper = d.__wallpaper || '';
  const linkStyle = d.__linkStyle || 'grid';
  const verified = d.__verified || false;
  const sosMode = d.__sosMode || false;

  const cat = p.category || 'PERSONAL';
  const isImageWallpaper = wallpaper.startsWith('http') || wallpaper.startsWith('data:');
  const bgClass = isImageWallpaper ? '' : (wallpaper || getDefaultBackground(cat));
  const bgStyle = isImageWallpaper ? { backgroundImage: `url(${wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined;
  const isLight = isLightBackground(wallpaper || getDefaultBackground(cat));
  const t = isLight ? { text: 'text-zinc-900' } : { text: 'text-white' };
  const cardBg = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)';
  const br = `${borderRadius}px`;

  return (
    <div className={`min-h-full ${bgClass} ${t.text} flex flex-col items-center relative overflow-hidden`} style={bgStyle}>
      {isImageWallpaper && <div className="absolute inset-0 bg-black/40 pointer-events-none" />}
      {sosMode && (
        <div className="w-full py-1 bg-red-500 text-white text-center text-[6px] font-black uppercase animate-pulse">🚨 Emergência</div>
      )}
      <div className="relative w-full flex flex-col items-center px-3 pt-6 pb-4 text-center">
        {d.capa && (
          <div className="w-full h-12 -mx-3 -mt-6 mb-3 overflow-hidden">
            <img src={d.capa} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="relative mb-2">
          <div
            className="w-12 h-12 border-2 shadow-xl flex items-center justify-center overflow-hidden"
            style={{ borderRadius: br, borderColor: isLight ? '#fff' : 'rgba(255,255,255,0.2)', background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
          >
            {d.foto
              ? <img src={d.foto} className="w-full h-full object-cover" />
              : <span className="text-base font-black text-white">{name[0]?.toUpperCase()}</span>
            }
          </div>
          {verified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-500 border flex items-center justify-center" style={{ borderColor: '#09090b' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" className="w-2 h-2"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
          )}
        </div>
        <p className="text-[9px] font-black leading-tight truncate w-full px-1">{name}</p>
        {cargo && <p className="text-[6px] font-semibold uppercase tracking-wider mt-0.5 truncate w-full px-1" style={{ color: primaryColor }}>{cargo}</p>}
        {bio && <p className="text-[6px] mt-1 line-clamp-2 px-1 opacity-60">{bio}</p>}
        {socials.length > 0 && (
          <div className={`w-full mt-2 ${linkStyle === 'grid' ? 'grid grid-cols-4 gap-1' : 'space-y-1'}`}>
            {socials.slice(0, 8).map(s => (
              <div
                key={s}
                className={`${linkStyle === 'list' ? 'flex items-center gap-1 px-1.5 py-1' : 'aspect-square flex items-center justify-center'} border`}
                style={{ backgroundColor: cardBg, borderColor: 'rgba(255,255,255,0.06)', borderRadius: `${borderRadius / 2}px` }}
              >
                <BrandIcon name={s === 'whatsappTutor' ? 'whatsapp' : s} className="w-2.5 h-2.5" />
                {linkStyle === 'list' && <span className="text-[5px] capitalize">{s}</span>}
              </div>
            ))}
          </div>
        )}
        <div className="mt-2 bg-white p-0.5 rounded" style={{ borderRadius: `${borderRadius / 2}px` }}>
          <QRCodeSVG value={`airnext.com/u/${p.slug || 'preview'}`} size={24} />
        </div>
        <p className="text-[5px] opacity-20 mt-1 tracking-[.2em] font-bold uppercase">AirNext</p>
      </div>
    </div>
  );
}

/* ─── PRODUCT MODAL ────────────────────────────────────── */
function ProductModal({ p, onClose }: { p: Product; onClose: () => void }) {
  const nav = useNavigate();
  const toast = useToast();
  const d = (p as any).profileData || {};
  const status = STATUS_LABEL[p.status || ''] || { label: p.status || '—', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' };

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm flex flex-col gap-3 scale-in">
        {/* Actions bar */}
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full glass text-zinc-400 hover:text-white text-xs font-bold transition-all">
            <X className="h-3.5 w-3.5" /> Fechar
          </button>
          <div className="flex-1" />
          {p.slug && (
            <button
              onClick={() => window.open(`/u/${p.slug}`, '_blank')}
              className="px-3.5 py-2 rounded-full glass text-zinc-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Eye className="h-3.5 w-3.5" /> Ver
            </button>
          )}
          {p.slug && (
            <button
              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/u/${p.slug}`); toast.show('Link copiado!', 'success'); }}
              className="px-3.5 py-2 rounded-full glass text-zinc-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Copy className="h-3.5 w-3.5" /> Link
            </button>
          )}
          <button
            onClick={() => nav(`/dashboard/perfil/${p.id}`)}
            className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Edit className="h-3.5 w-3.5" /> Editar
          </button>
        </div>

        {/* Phone */}
        <div className="bg-[#0a0a0a] rounded-[2.5rem] border-[10px] border-[#1c1c1e] shadow-2xl overflow-hidden h-[70vh] relative ring-1 ring-white/5">
          <div className="absolute top-0 inset-x-0 h-8 z-50 flex justify-center pt-2">
            <div className="w-24 h-5 bg-black rounded-full" />
          </div>
          <div className="h-full overflow-y-auto hide-scrollbar">
            <MiniPreview key={p.id} p={p} />
          </div>
          <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none">
            <div className="w-24 h-1 bg-white/20 rounded-full" />
          </div>
        </div>

        {/* Quick info */}
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${CAT_GRADIENT[p.category || 'PERSONAL']} flex items-center justify-center shrink-0`}>
            {(() => { const Icon = PI[p.productType || ''] || CreditCard; return <Icon className="h-4.5 w-4.5 text-white" />; })()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{getName(p)}</p>
            <p className="text-[10px] text-zinc-600">{CN[p.category || ''] || p.category} · {PT[p.productType || ''] || p.productType}</p>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${status.color}`}>{status.label}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── STATS CARD ────────────────────────────────────────── */
function StatsCard({ icon: Icon, label, value, sub, gradient }: { icon: any; label: string; value: string | number; sub?: string; gradient: string }) {
  return (
    <div className="glass rounded-2xl p-4 flex items-center gap-3.5">
      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-white leading-tight">{value}</p>
        {sub && <p className="text-[9px] text-zinc-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── PRODUCT CARD ─────────────────────────────────────── */
function ProductCard({ p, onClick }: { p: Product; onClick: () => void }) {
  const d = (p as any).profileData || {};
  const name = getName(p);
  const cat = p.category || 'PERSONAL';
  const Icon = PI[p.productType || ''] || CreditCard;
  const status = STATUS_LABEL[p.status || ''] || { label: p.status || '—', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' };
  const primaryColor = d.__primaryColor || '#3b82f6';
  const secondaryColor = d.__secondaryColor || '#8b5cf6';

  return (
    <div
      onClick={onClick}
      className="group relative glass rounded-2xl p-4 cursor-pointer hover:border-white/15 transition-all hover:scale-[1.01] active:scale-[0.99]"
    >
      {/* Cover thumbnail */}
      {d.capa && (
        <div className="w-full h-16 rounded-xl overflow-hidden mb-3">
          <img src={d.capa} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
        >
          {d.foto
            ? <img src={d.foto} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-base font-black text-white">
                {name[0]?.toUpperCase() || '?'}
              </div>
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{name}</p>
          <p className="text-[10px] text-zinc-600">{CN[cat] || cat}</p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${status.color}`}>
            {status.label}
          </span>
          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${CAT_GRADIENT[cat]} flex items-center justify-center`}>
            <Icon className="h-3 w-3 text-white" />
          </div>
        </div>
      </div>

      {/* Hover arrow */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="h-4 w-4 text-zinc-500" />
      </div>
    </div>
  );
}

/* ─── MAIN ──────────────────────────────────────────────── */
export default function DashboardHome() {
  const { user, products, visits } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [selected, setSelected] = useState<Product | null>(null);

  const activeProducts = (products || []).filter(p => p.status === 'ATIVO');
  const totalViews = visits.length;
  const totalClicks = visits.filter(v => v.type === 'nfc' || v.type === 'qr').length;

  const firstName = user?.name?.split(' ')[0] || 'Usuário';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="space-y-6 max-w-2xl mx-auto lg:max-w-none">
      {/* Hero greeting */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-zinc-500 text-sm">{greeting} 👋</p>
          <h1 className="text-2xl font-black text-white mt-0.5">{firstName}</h1>
        </div>
        <Link
          to="/ativar"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/20 shrink-0"
        >
          <Zap className="h-4 w-4" /> Ativar Produto
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatsCard icon={Package} label="Produtos Ativos" value={activeProducts.length} gradient="from-blue-500 to-violet-600" />
        <StatsCard icon={Users} label="Acessos" value={totalViews.toLocaleString('pt-BR')} sub="total" gradient="from-emerald-500 to-teal-600" />
        <StatsCard icon={TrendingUp} label="Interações" value={totalClicks.toLocaleString('pt-BR')} sub="NFC + QR" gradient="from-amber-500 to-orange-500" />
      </div>

      {/* Perfis ao Vivo — carrossel principal, sincronizado com os mesmos dados
          usados nos editores (ProfileCustomizer/MyProfile) e no perfil público.
          Rola lateralmente, mostra em tempo real como cada perfil está e
          permite clicar para visitar a página real. */}
      {(products || []).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Perfis ao Vivo</h2>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <span className="text-[11px] text-zinc-600 font-medium">arraste para o lado →</span>
          </div>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-2 -mx-1 px-1">
            {(products || []).filter(p => p.status === 'ATIVO').map(p => (
              <button
                key={p.id}
                onClick={() => p.slug ? window.open(`/u/${p.slug}`, '_blank') : setSelected(p)}
                className="group shrink-0 snap-center w-[150px] sm:w-[170px] text-left"
                title={p.slug ? 'Abrir perfil público em uma nova aba' : 'Ver produto'}
              >
                <div className="relative rounded-[1.75rem] border-[6px] border-[#1c1c1e] bg-[#0a0a0a] overflow-hidden aspect-[9/18] shadow-xl transition-transform duration-300 group-hover:scale-[1.04] group-active:scale-95 ring-1 ring-white/5 group-hover:ring-emerald-400/40">
                  <MiniPreview p={p} />
                  {/* Overlay ao passar o mouse: CTA de visitar */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-white text-[10px] font-bold">
                      <ExternalLink className="h-3 w-3" /> Visitar
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[11px] font-bold text-white truncate">{getName(p)}</p>
                <p className="text-[10px] text-zinc-600 truncate">{CN[p.category || 'PERSONAL']}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Meus Produtos</h2>
          <span className="text-[11px] text-zinc-600 font-medium">{(products || []).length} produto{(products || []).length !== 1 ? 's' : ''}</span>
        </div>

        {(products || []).length === 0 ? (
          /* Empty state */
          <div className="glass rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Nenhum produto ainda</h3>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto mb-5">
              Ative seu primeiro produto AirNext para começar a criar seu perfil digital.
            </p>
            <Link
              to="/ativar"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm font-bold transition-all active:scale-95"
            >
              <Zap className="h-4 w-4" /> Ativar Agora
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(products || []).map(p => (
              <ProductCard key={p.id} p={p} onClick={() => setSelected(p)} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          to="/dashboard/estatisticas"
          className="glass rounded-2xl p-4 flex items-center gap-3.5 hover:border-white/15 transition-all group"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Estatísticas</p>
            <p className="text-[11px] text-zinc-600">Acessos e engajamento</p>
          </div>
          <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        </Link>
        <Link
          to="/dashboard/suporte"
          className="glass rounded-2xl p-4 flex items-center gap-3.5 hover:border-white/15 transition-all group"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Suporte</p>
            <p className="text-[11px] text-zinc-600">Dúvidas e ajuda</p>
          </div>
          <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        </Link>
      </div>

      {/* Product Modal */}
      {selected && <ProductModal p={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}