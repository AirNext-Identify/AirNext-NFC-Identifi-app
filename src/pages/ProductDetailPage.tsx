import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { Check, ChevronLeft, ChevronRight, MessageCircle, Palette, ShoppingBag } from 'lucide-react';
import { Seo } from '../components/Seo';
import { useSiteImages } from '../hooks/useSiteImages';
import { AIRNEXT_HOW_IT_WORKS } from '../config/aiContent';
import { fmtPrice, priceLabel } from '../lib/price';
import { FORMATS, ORIGINAL_LINE_IDS, PRODUCTS } from './LandingPage';
import { productImage, shortName } from '../lib/productShowcase';

const WHATSAPP = '5547996287761';

function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-lobster leading-none ${className}`}>
      Air<span className="text-[#0071e3]">Next</span>
    </span>
  );
}

/** Página "Saiba mais" de cada produto — escura, com fotos que combinam com a categoria. */
export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { resolve, loading } = useSiteImages();
  const product = PRODUCTS.find((p) => p.id === id);

  useEffect(() => {
    const prev = document.documentElement.style.backgroundColor;
    document.documentElement.style.backgroundColor = '#000';
    return () => { document.documentElement.style.backgroundColor = prev; };
  }, [id]);

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 px-6 text-center">
        <Wordmark className="text-4xl" />
        <p className="text-lg text-white/70">Produto não encontrado.</p>
        <Link to="/#produtos" className="px-6 py-2.5 rounded-full bg-[#0071e3] text-white font-medium">Ver todos os produtos</Link>
      </div>
    );
  }

  const main = ORIGINAL_LINE_IDS.includes(product.id);
  const images = product.gallery?.length ? product.gallery : [productImage(product, resolve, main)];
  const formats = FORMATS.filter((f) => product.formats.includes(f.id));
  const others = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);
  const buy = () => navigate(`/?comprar=${product.id}`);
  const customize = () => navigate(`/?personalizar=${product.id}`);
  const waLink = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Olá! Quero saber mais sobre o ${product.name}.`)}`;
  const label = shortName(product.name);

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      <Seo title={`${product.name} — ${product.tag}`} description={product.desc} />

      {/* Barra fixa, escura e translúcida */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10 pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto h-12 px-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-1 text-white/90" aria-label="Voltar ao início">
            <ChevronLeft size={20} />
            <Wordmark className="text-2xl" />
          </Link>
          <span className="hidden sm:block text-sm font-semibold text-white/80 truncate">{label}</span>
          <button
            onClick={buy}
            className="px-4 py-1.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-medium transition"
          >
            Comprar
          </button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pt-24 md:pt-32 pb-12 md:pb-20 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[70%] opacity-30"
            style={{ background: `radial-gradient(55% 60% at 50% 0%, ${product.color}, transparent)` }}
          />
          <div className="relative max-w-5xl mx-auto px-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] mb-4" style={{ color: product.color }}>{product.tag}</p>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.03]">
              <Wordmark className="font-normal" /> <span className="uppercase">{label}</span>
            </h1>
            <p className="mt-5 text-xl md:text-2xl text-white/70 max-w-2xl mx-auto leading-snug">{product.desc}</p>
            <p className="mt-6 text-2xl font-semibold">
              {priceLabel(product.price)}
              {product.oldPrice && (
                <span className="ml-3 text-base font-medium text-white/40 line-through">R$ {fmtPrice(product.oldPrice)}</span>
              )}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button onClick={buy} className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium transition">
                <ShoppingBag size={17} /> Comprar
              </button>
              {!product.combo && (
                <button onClick={customize} className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-[#2997ff] text-[#2997ff] hover:bg-[#2997ff]/10 font-medium transition">
                  <Palette size={17} /> Personalizar
                </button>
              )}
            </div>
          </div>

          <div className="relative max-w-5xl mx-auto px-4 md:px-6 mt-12 md:mt-16">
            {loading && images.length === 1 ? (
              <div className="aspect-[4/3] md:aspect-[16/10] rounded-[28px] md:rounded-[40px] bg-white/5 animate-pulse" />
            ) : images.length > 1 ? (
              <Swiper
                modules={[Pagination]}
                pagination={{ clickable: true }}
                spaceBetween={12}
                slidesPerView={1.15}
                breakpoints={{ 768: { slidesPerView: 2.1, spaceBetween: 16 } }}
              >
                {images.map((src, i) => (
                  <SwiperSlide key={src}>
                    <div className="aspect-square rounded-[24px] md:rounded-[32px] overflow-hidden bg-[#111] ring-1 ring-white/10">
                      <img src={src} alt={`${product.name} — foto ${i + 1}`} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" draggable={false} className="w-full h-full object-cover" />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div className="aspect-[4/3] md:aspect-[16/10] rounded-[28px] md:rounded-[40px] overflow-hidden bg-[#111] ring-1 ring-white/10">
                <img src={images[0]} alt={product.name} decoding="async" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </section>

        {/* Declaração */}
        <section className="py-16 md:py-28">
          <p className="max-w-4xl mx-auto px-6 text-center text-2xl md:text-4xl font-semibold tracking-tight leading-snug text-white/90">
            {product.longDesc}
          </p>
        </section>

        {/* O que está incluso */}
        <section className="py-12 md:py-20 bg-[#0a0a0a]">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-center mb-10 md:mb-14">
              {product.combo ? 'O que vem no kit' : 'Tudo o que você leva'}
            </h2>
            {product.combo && product.comboItems && (
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {product.comboItems.map((it) => (
                  <span key={it} className="px-4 py-2 rounded-full border border-white/15 text-sm font-semibold">{it}</span>
                ))}
              </div>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {product.specs.map((spec) => (
                <div key={spec} className="flex items-start gap-3 p-6 rounded-3xl bg-white/[0.04] ring-1 ring-white/10">
                  <span className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: `${product.color}33`, color: product.color }}>
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span className="text-[17px] leading-snug text-white/90">{spec}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Formatos */}
        {!product.combo && formats.length > 0 && (
          <section className="py-16 md:py-24">
            <div className="max-w-4xl mx-auto px-6 text-center">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-8">Escolha o formato</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {formats.map((f) => (
                  <span key={f.id} className="inline-flex items-center gap-2 px-5 py-3 rounded-full ring-1 ring-white/15 bg-white/[0.04] text-[15px] font-medium">
                    {f.icon} {f.label}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Como funciona */}
        <section className="py-16 md:py-24 bg-[#0a0a0a]">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-center mb-10 md:mb-14">Como funciona</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {AIRNEXT_HOW_IT_WORKS.map((text, i) => (
                <div key={i} className="p-8 rounded-3xl bg-white/[0.04] ring-1 ring-white/10">
                  <span className="text-5xl font-bold" style={{ color: product.color }}>{i + 1}</span>
                  <p className="mt-4 text-lg leading-snug text-white/80">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-16 md:py-28">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Pronto para começar?</h2>
            <p className="mt-4 text-2xl font-semibold text-white/80">{priceLabel(product.price)}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button onClick={buy} className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium transition">
                <ShoppingBag size={17} /> Comprar
              </button>
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-white/25 hover:bg-white/10 font-medium transition">
                <MessageCircle size={17} /> Tirar dúvidas
              </a>
            </div>
          </div>
        </section>

        {/* Veja também */}
        <section className="pb-20 md:pb-28">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">Veja também</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {others.map((o) => (
                <Link key={o.id} to={`/produto/${o.id}`} className="group block">
                  <div className="aspect-square rounded-3xl overflow-hidden bg-[#111] ring-1 ring-white/10">
                    <img
                      src={productImage(o, resolve, ORIGINAL_LINE_IDS.includes(o.id))}
                      alt={o.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                    />
                  </div>
                  <p className="mt-3 text-[15px] font-semibold flex items-center gap-1">{o.name} <ChevronRight size={14} className="text-white/40" /></p>
                  <p className="text-sm text-white/50">{priceLabel(o.price)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-white/40 space-x-4">
        <Link to="/" className="hover:text-white">Início</Link>
        <Link to="/termos-de-uso" className="hover:text-white">Termos</Link>
        <Link to="/politica-de-privacidade" className="hover:text-white">Privacidade</Link>
        <span>© AirNext</span>
      </footer>
    </div>
  );
}
