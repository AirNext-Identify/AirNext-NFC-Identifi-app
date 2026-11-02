import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CreditCard, MessageCircle, Package, Search, ShieldCheck, Smartphone, Truck, X } from 'lucide-react';
import { Seo } from '../components/Seo';
import { PRODUCTS, type Product } from './LandingPage';
import { fmtPrice, priceLabel } from '../lib/price';
import { PaymentBadges, PixIcon } from '../store/PaymentBadges';
import { FREE_SHIPPING_FROM, WHATSAPP, useStore } from '../store/StoreContext';

const CATEGORIES: { id: string; label: string; ids?: string[] }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'voce', label: 'Para você', ids: ['pro', 'tag', 'combo'] },
  { id: 'familia', label: 'Família e saúde', ids: ['kids', 'senior', 'tea'] },
  { id: 'pets', label: 'Pets', ids: ['pet'] },
  { id: 'negocios', label: 'Negócios', ids: ['stand', 'hubgoogle', 'service', 'corporate', 'evento'] },
];

const SORTS = [
  { id: 'destaque', label: 'Destaques' },
  { id: 'menor', label: 'Menor preço' },
  { id: 'maior', label: 'Maior preço' },
  { id: 'nome', label: 'Nome (A–Z)' },
] as const;

/** Ícone colorido estilo Apple (quadrado arredondado com degradê). */
const TONES = {
  green: 'from-[#4cd964] to-[#27ae4a]',
  blue: 'from-[#4da3ff] to-[#0a6cf0]',
  teal: 'from-[#3ed6c4] to-[#12a190]',
  purple: 'from-[#c07bf0] to-[#8a3fd1]',
  orange: 'from-[#ffb340] to-[#ff7a00]',
} as const;
function AppIcon({ tone, size = 44, children }: { tone: keyof typeof TONES; size?: number; children: React.ReactNode }) {
  return (
    <span style={{ width: size, height: size }} className={`flex shrink-0 items-center justify-center rounded-[28%] bg-gradient-to-b text-white shadow-[0_6px_16px_-6px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.35)] ${TONES[tone]}`}>
      {children}
    </span>
  );
}

/** Aparece suavemente ao rolar (respeita "reduzir movimento"). */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -60px 0px' }} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

export default function StorePage() {
  const [params, setParams] = useSearchParams();
  const { add, imgFor } = useStore();
  const [q, setQ] = useState(params.get('q') || '');
  const [cat, setCat] = useState(params.get('cat') || 'todos');
  const [sort, setSort] = useState<(typeof SORTS)[number]['id']>('destaque');

  // Mantém a URL em sincronia (permite compartilhar a busca). Escreve com atraso para não competir com a digitação.
  const lastWritten = useRef(params.get('q') || '');
  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams();
      if (q.trim()) next.set('q', q.trim());
      if (cat !== 'todos') next.set('cat', cat);
      lastWritten.current = q.trim();
      setParams(next, { replace: true });
    }, 400);
    return () => clearTimeout(t);
  }, [q, cat, setParams]);
  // Busca vinda do menu (/loja?q=...) quando a página já está aberta.
  const urlQ = params.get('q') || '';
  useEffect(() => {
    if (urlQ && urlQ !== lastWritten.current) { lastWritten.current = urlQ; setQ(urlQ); }
  }, [urlQ]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const ids = CATEGORIES.find((c) => c.id === cat)?.ids;
    let out = PRODUCTS.filter((p) => (!ids || ids.includes(p.id)) && (!t || `${p.name} ${p.tag} ${p.desc} ${p.specs.join(' ')}`.toLowerCase().includes(t)));
    if (sort === 'menor') out = [...out].sort((a, b) => (a.price || 1e9) - (b.price || 1e9));
    if (sort === 'maior') out = [...out].sort((a, b) => b.price - a.price);
    if (sort === 'nome') out = [...out].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    return out;
  }, [q, cat, sort]);

  const combo = PRODUCTS.find((p) => p.combo);
  const showFeatured = !!combo && cat === 'todos' && !q.trim();
  const gridList = showFeatured ? list.filter((p) => p.id !== combo!.id) : list;

  return (
    <>
      <Seo title="Loja AirNext — cartões, tags e pulseiras NFC" description="Compre cartões, tags e pulseiras NFC AirNext com perfil digital. Pix ou cartão, frete grátis acima de R$150 e sem mensalidade." path="/loja" />

      {/* Topo */}
      <section className="mx-auto max-w-6xl px-4 pb-6 pt-10 sm:px-6 sm:pt-16">

        <p className="text-[13px] font-semibold uppercase tracking-wider text-[#0071e3]">Loja</p>
        <h1 className="mt-2 max-w-3xl text-[38px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[56px]">
          Compre o seu AirNext.
          <span className="block text-[#86868b]">Um toque e pronto.</span>
        </h1>
        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">Cartões, tags e pulseiras NFC. Sem app, sem bateria, sem mensalidade.</p>

        {/* Busca */}
        <div className="relative mt-8 max-w-2xl">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b]" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)} type="search" inputMode="search" autoComplete="off"
            placeholder="Buscar produtos: pet, cartão, tag, estabelecimento…" aria-label="Buscar produtos"
            className="h-14 w-full rounded-2xl border border-black/10 bg-white pl-12 pr-12 text-[16px] shadow-sm outline-none transition focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15 [&::-webkit-search-cancel-button]:hidden"
          />
          {q && <button type="button" onClick={() => setQ('')} aria-label="Limpar busca" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#86868b] hover:bg-black/5"><X size={16} /></button>}
        </div>

        {/* Categorias + ordenação */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Categorias">
            {CATEGORIES.map((c) => (
              <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-medium transition active:scale-95 ${cat === c.id ? 'bg-[#1d1d1f] text-white' : 'bg-white text-[#1d1d1f] ring-1 ring-black/10 hover:bg-black/[0.04]'}`}>
                {c.label}
              </button>
            ))}
          </div>
          <label className="flex shrink-0 items-center gap-2 text-[13px] text-[#6e6e73]">
            Ordenar
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-9 rounded-full border border-black/10 bg-white px-3 text-[13px] font-medium text-[#1d1d1f] outline-none focus:border-[#0071e3]">
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      {/* Vantagens */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6" aria-label="Vantagens">
        <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
          {[
            { tone: 'green', icon: <Truck size={21} />, t: 'Frete grátis', s: `Acima de R$ ${FREE_SHIPPING_FROM}` },
            { tone: 'blue', icon: <CreditCard size={21} />, t: 'Até 12x', s: 'No cartão de crédito' },
            { tone: 'teal', icon: <PixIcon size={21} />, t: 'Pix', s: 'Pagamento rápido' },
            { tone: 'purple', icon: <ShieldCheck size={21} />, t: 'Sem mensalidade', s: 'Pague uma vez só' },
          ].map((v, n) => (
            <li key={v.t}>
              <Reveal delay={n * 0.06} className="flex h-full items-center gap-2.5 rounded-[20px] bg-white p-3 ring-1 ring-black/[0.06] shadow-[0_8px_24px_-16px_rgba(0,0,0,0.25)] sm:gap-3 sm:p-3.5">
                <AppIcon tone={v.tone as keyof typeof TONES} size={40}>{v.icon}</AppIcon>
                <span className="min-w-0"><span className="block text-[13px] font-semibold leading-tight sm:text-[14px]">{v.t}</span><span className="block text-[11px] leading-snug text-[#6e6e73] sm:text-[12px]">{v.s}</span></span>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* Destaque: combo (seção escura) */}
      {showFeatured && combo && (
        <section className="mx-auto mt-10 max-w-6xl px-4 sm:px-6" aria-label="Destaque">
          <Reveal>
            <div className="relative grid overflow-hidden rounded-[28px] bg-black text-white ring-1 ring-white/10 sm:rounded-[36px] md:grid-cols-2">
              <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[#0a84ff]/35 blur-[100px]" />
              <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-1/3 h-64 w-64 rounded-full bg-[#bf5af2]/25 blur-[100px]" />
              <div className="relative flex flex-col justify-center p-6 sm:p-12">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-[#ffb340]">Kit · Economize</p>
                <h2 className="mt-2 text-[28px] font-bold leading-tight tracking-[-0.02em] sm:text-[40px]">{combo.name}</h2>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/65 sm:text-[16px]">{combo.desc}</p>
                <p className="mt-5 text-[15px]">
                  {combo.oldPrice ? <span className="mr-2 text-white/45 line-through">R$ {fmtPrice(combo.oldPrice)}</span> : null}
                  <span className="text-[24px] font-semibold">R$ {fmtPrice(combo.price)}</span>
                </p>
                {combo.oldPrice ? <p className="mt-1 text-[13px] font-medium text-[#30d158]">Você economiza R$ {fmtPrice(combo.oldPrice - combo.price)}</p> : null}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={() => add(combo)} className="h-12 rounded-full bg-[#0a84ff] px-7 text-[16px] font-semibold text-white transition hover:bg-[#3395ff] active:scale-95">Comprar</button>
                  <Link to={`/loja/${combo.id}`} className="inline-flex items-center gap-1 text-[16px] font-medium text-[#2997ff] hover:underline">Saiba mais <ArrowRight size={16} /></Link>
                </div>
              </div>
              <Link to={`/loja/${combo.id}`} className="relative block min-h-[220px] overflow-hidden" aria-label={`Ver ${combo.name}`}>
                <img src={imgFor(combo)} alt={combo.name} className="h-full w-full object-cover transition duration-700 hover:scale-[1.04]" loading="eager" />
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent md:bg-gradient-to-r md:from-black/60" />
              </Link>
            </div>
          </Reveal>
        </section>
      )}

      {/* Grade */}
      <section className="mx-auto mt-10 max-w-6xl px-4 sm:px-6" aria-label="Produtos">
        <p className="mb-4 text-[13px] text-[#6e6e73]" aria-live="polite">{list.length} {list.length === 1 ? 'produto' : 'produtos'}{q.trim() ? ` para “${q.trim()}”` : ''}</p>
        {gridList.length === 0 && !showFeatured ? (
          <div className="rounded-3xl bg-white px-6 py-16 text-center ring-1 ring-black/[0.06]">
            <p className="text-[19px] font-semibold">Nada encontrado</p>
            <p className="mx-auto mt-1 max-w-sm text-[14px] text-[#6e6e73]">Tente outra palavra ou veja todos os produtos. Se não achou o que precisa, fale com a gente.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={() => { setQ(''); setCat('todos'); }} className="h-11 rounded-full bg-[#0071e3] px-6 text-[15px] font-semibold text-white hover:bg-[#0077ed]">Ver todos</button>
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-black/15 px-6 text-[15px] font-medium hover:bg-black/[0.04]"><MessageCircle size={16} />WhatsApp</a>
            </div>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {gridList.map((p, n) => <ProductTile key={p.id} p={p} delay={(n % 3) * 0.06} />)}
          </ul>
        )}
      </section>

      {/* Pagamento e confiança (seção escura) */}
      <section className="mx-auto mt-14 max-w-6xl px-4 sm:mt-16 sm:px-6" aria-label="Pagamento e entrega">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] bg-[#0b0b0d] p-6 text-white ring-1 ring-white/10 sm:rounded-[36px] sm:p-10">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#30d158]/20 blur-[90px]" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-[#0a84ff]/25 blur-[90px]" />
            <div className="relative grid gap-7 md:grid-cols-3 md:gap-8">
              <div>
                <AppIcon tone="blue"><CreditCard size={22} /></AppIcon>
                <h3 className="mt-4 text-[18px] font-semibold">Pague do seu jeito</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/60">Pix ou cartão de crédito em até 12x. O pagamento é combinado com a nossa equipe no WhatsApp, com total segurança.</p>
                <PaymentBadges className="mt-4" />
              </div>
              <div>
                <AppIcon tone="orange"><Package size={22} /></AppIcon>
                <h3 className="mt-4 text-[18px] font-semibold">Entrega para todo o Brasil</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/60">Frete grátis em compras acima de R$ {FREE_SHIPPING_FROM}. Prazo e valor confirmados antes de você pagar.</p>
              </div>
              <div>
                <AppIcon tone="purple"><Smartphone size={22} /></AppIcon>
                <h3 className="mt-4 text-[18px] font-semibold">Sem app e sem mensalidade</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/60">Seu perfil abre direto no celular de quem aproxima, e você edita quando quiser.</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

function ProductTile({ p, delay = 0 }: { p: Product; delay?: number }) {
  const { add, imgFor } = useStore();
  const quote = p.price <= 0;
  return (
    <li>
      <Reveal delay={delay} className="h-full">
        <div className="group flex h-full flex-col overflow-hidden rounded-[22px] bg-white ring-1 ring-black/[0.06] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_-18px_rgba(0,0,0,0.3)] sm:rounded-[28px]">
          <Link to={`/loja/${p.id}`} className="relative block aspect-square overflow-hidden bg-[#f5f5f7] sm:aspect-[4/3]" aria-label={`Ver ${p.name}`}>
            <img src={imgFor(p)} alt={p.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
            {p.badge && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[#bf4800] shadow-sm backdrop-blur sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-[12px]">{p.badge}</span>}
          </Link>
          <div className="flex flex-1 flex-col p-3 sm:p-5">
            <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-[#86868b] sm:text-[12px]">{p.tag}</p>
            <h2 className="mt-0.5 text-[15px] font-semibold leading-tight tracking-tight sm:mt-1 sm:text-[21px]"><Link to={`/loja/${p.id}`} className="hover:underline">{p.name}</Link></h2>
            <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-[#6e6e73] sm:mt-2 sm:text-[14px] sm:leading-relaxed">{p.desc}</p>
            <div className="mt-auto pt-3 sm:pt-5">
              <p className="text-[15px] font-semibold sm:text-[18px]">
                {p.oldPrice ? <span className="mr-1.5 text-[11px] font-normal text-[#86868b] line-through sm:mr-2 sm:text-[14px]">R$ {fmtPrice(p.oldPrice)}</span> : null}
                {quote ? 'Sob consulta' : `R$ ${fmtPrice(p.price)}`}
              </p>
              {!quote && <p className="text-[10.5px] text-[#6e6e73] sm:text-[12px]">Pix ou até 12x no cartão</p>}
              <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                {quote ? (
                  <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Olá! Quero um orçamento do ${p.name}.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#0071e3] px-4 text-[13px] font-semibold text-white transition hover:bg-[#0077ed] active:scale-95 sm:h-10 sm:px-5 sm:text-[14px]"><MessageCircle size={14} />Orçamento</a>
                ) : (
                  <button type="button" onClick={() => add(p)} className="h-9 rounded-full bg-[#0071e3] px-4 text-[13px] font-semibold text-white transition hover:bg-[#0077ed] active:scale-95 sm:h-10 sm:px-5 sm:text-[14px]">Comprar</button>
                )}
                <Link to={`/loja/${p.id}`} className="inline-flex items-center justify-center gap-0.5 text-[12.5px] font-medium text-[#0066cc] hover:underline sm:text-[14px]">Saiba mais <ArrowRight size={13} /></Link>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </li>
  );
}
