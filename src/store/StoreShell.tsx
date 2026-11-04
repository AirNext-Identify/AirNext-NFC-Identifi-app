import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import SacolaDrawer from '../components/store/SacolaDrawer';
import { PRODUCTS } from '../pages/LandingPage';
import { priceLabel } from '../lib/price';
import { PaymentBadges } from './PaymentBadges';
import { StoreProvider, useStore } from './StoreContext';

const NAV = [
  { to: '/', label: 'Início', end: true },
  { to: '/loja', label: 'Loja', end: false },
  { to: '/suporte', label: 'Suporte', end: false },
  { to: '/contato', label: 'Contato', end: false },
];

/** Layout da loja: página clara estilo Apple com barra de menu escura, busca, busca, sacola em etapas e rodapé. */
export default function StoreShell() {
  return (
    <StoreProvider>
      <Frame />
    </StoreProvider>
  );
}

function Frame() {
  const { pathname } = useLocation();
  useEffect(() => {
    const prev = document.documentElement.style.backgroundColor;
    document.documentElement.style.backgroundColor = '#fbfbfd';
    return () => { document.documentElement.style.backgroundColor = prev; };
  }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] antialiased" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      <Header />
      <main><Outlet /></main>
      <Footer />
      <SearchOverlay />
      <SacolaDrawer isDark={false} />
    </div>
  );
}

function Header() {
  const { count, openCart, setSearchOpen } = useStore();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 4);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const icon = 'relative flex h-10 w-10 items-center justify-center rounded-full text-white/85 transition hover:bg-white/10 hover:text-white active:scale-95';
  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors ${scrolled ? 'border-white/10 bg-black/95' : 'border-transparent bg-black/90'}`}>
      <div className="mx-auto flex h-[52px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center"><BrandLogo to="/" size="sm" dark /></div>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `relative rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${isActive ? 'font-semibold text-white' : 'font-medium text-white/60 hover:text-white'}`}>
              {({ isActive }) => (
                <>
                  {n.label}
                  <span aria-hidden="true" className={`absolute inset-x-3.5 -bottom-[11px] h-[2px] rounded-full bg-[#2997ff] transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-0.5">
          {pathname !== '/loja' && (
            <Link to="/loja" className="mr-1 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/10 px-3.5 text-[13px] font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.14)] transition hover:bg-white/20 active:scale-95 md:hidden"><ShoppingBag size={14} />Loja</Link>
          )}
          <button type="button" className={icon} aria-label="Buscar produtos" onClick={() => setSearchOpen(true)}><Search size={18} /></button>
          <button type="button" className={icon} aria-label={`Sacola, ${count} ${count === 1 ? 'item' : 'itens'}`} onClick={openCart}>
            <ShoppingBag size={18} />
            {count > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2997ff] px-1 text-[10px] font-bold text-white">{count}</span>}
          </button>
          <Link to="/login" className={icon} aria-label="Minha conta"><UserRound size={18} /></Link>
        </div>
      </div>
    </header>
  );
}

/* ───────────────────────── Busca ───────────────────────── */
function SearchOverlay() {
  const { searchOpen, setSearchOpen, imgFor } = useStore();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchOpen) return;
    setQ('');
    const t = setTimeout(() => ref.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSearchOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); };
  }, [searchOpen, setSearchOpen]);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return PRODUCTS.slice(0, 5);
    return PRODUCTS.filter((p) => `${p.name} ${p.tag} ${p.desc}`.toLowerCase().includes(t)).slice(0, 6);
  }, [q]);

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div className="fixed inset-0 z-[70] bg-white/85 backdrop-blur-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Buscar produtos">
          <div className="mx-auto max-w-2xl px-4 pt-4 sm:pt-10">
            <div className="flex items-center gap-3">
              <form className="relative flex-1" onSubmit={(e) => { e.preventDefault(); setSearchOpen(false); nav(`/loja${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`); }}>
                <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b]" />
                <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar na loja" className="h-12 w-full rounded-2xl border border-black/10 bg-white pl-11 pr-4 text-[17px] outline-none transition focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15" />
              </form>
              <button type="button" onClick={() => setSearchOpen(false)} className="rounded-full p-2.5 text-[#1d1d1f] hover:bg-black/5" aria-label="Fechar busca"><X size={20} /></button>
            </div>
            <p className="mb-2 mt-6 px-1 text-[12px] font-semibold uppercase tracking-wider text-[#86868b]">{q.trim() ? 'Resultados' : 'Mais procurados'}</p>
            <ul className="space-y-1">
              {results.map((p) => (
                <li key={p.id}>
                  <Link to={`/loja/${p.id}`} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-black/[0.04]">
                    <img src={imgFor(p)} alt="" className="h-14 w-14 rounded-xl bg-[#f5f5f7] object-cover" loading="lazy" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">{p.name}</span>
                      <span className="block truncate text-[13px] text-[#6e6e73]">{p.tag}</span>
                    </span>
                    <span className="text-[14px] font-medium text-[#1d1d1f]">{priceLabel(p.price)}</span>
                    <ChevronRight size={16} className="text-[#86868b]" />
                  </Link>
                </li>
              ))}
              {results.length === 0 && <li className="px-1 py-6 text-[15px] text-[#6e6e73]">Nenhum produto encontrado para “{q}”.</li>}
            </ul>
            {q.trim() && results.length > 0 && (
              <button type="button" onClick={() => { setSearchOpen(false); nav(`/loja?q=${encodeURIComponent(q.trim())}`); }} className="mt-3 px-1 text-[14px] font-medium text-[#0066cc] hover:underline">Ver todos os resultados</button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───────────────────────── Rodapé ───────────────────────── */
function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-[#161617]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <BrandLogo to="/" size="md" dark />
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/55">NFC conecta pessoas, negócios e pets. Cartões, tags e pulseiras com perfil digital sempre atualizado.</p>
            <p className="mb-2 mt-6 text-[12px] font-semibold uppercase tracking-wider text-white/40">Formas de pagamento</p>
            <PaymentBadges />
          </div>
          <FooterCol title="Loja" links={[['Todos os produtos', '/loja'], ['AirNext Pro', '/loja/pro'], ['AirNext Pet', '/loja/pet'], ['AirNext Kids', '/loja/kids'], ['AirNext Sênior', '/loja/senior'], ['AirNext TEA', '/loja/tea'], ['AirNext Tag', '/loja/tag'], ['Combo completo', '/loja/combo']]} />
          <FooterCol title="Ajuda" links={[['Suporte e tutoriais', '/suporte'], ['Ativar produto', '/ativar'], ['Contato', '/contato'], ['Sobre a AirNext', '/sobre']]} />
          <FooterCol title="Legal" links={[['Privacidade', '/politica-de-privacidade'], ['Termos de uso', '/termos-de-uso'], ['Cookies', '/politica-de-cookies']]} />
        </div>
        <p className="mt-10 border-t border-white/10 pt-6 text-[12px] text-white/40">© {new Date().getFullYear()} AirNext. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-white/40">{title}</p>
      <ul className="space-y-2">
        {links.map(([label, to]) => <li key={to}><Link to={to} className="text-[13px] text-white/70 hover:text-white hover:underline">{label}</Link></li>)}
      </ul>
    </div>
  );
}
