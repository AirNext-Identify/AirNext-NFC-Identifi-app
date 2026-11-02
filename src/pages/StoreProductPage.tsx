import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, CreditCard, MessageCircle, PackageCheck, QrCode, ShieldCheck, Smartphone, Truck, Wifi,
} from 'lucide-react';
import { Seo } from '../components/Seo';
import { FORMATS, PRODUCTS } from './LandingPage';
import { fmtPrice } from '../lib/price';
import { PaymentBadges } from '../store/PaymentBadges';
import { FREE_SHIPPING_FROM, WHATSAPP, useStore } from '../store/StoreContext';

const FAQ: [string, string][] = [
  ['Preciso instalar algum aplicativo?', 'Não. Quem aproxima o celular (ou escaneia o QR Code) abre o seu perfil direto no navegador, sem baixar nada.'],
  ['Existe mensalidade?', 'Não. Você paga uma vez pelo produto e edita o seu perfil quando quiser, sem custo recorrente.'],
  ['Posso mudar as informações depois?', 'Sim. O perfil é digital: você atualiza no painel e a mudança vale na hora, sem trocar o produto.'],
  ['E se o celular não tiver NFC?', 'Todo produto tem QR Code de reserva. É só escanear com a câmera.'],
  ['Como funciona o pagamento?', 'Você escolhe Pix ou cartão no pedido. A nossa equipe confirma frete, prazo e pagamento com você no WhatsApp.'],
];

const STEPS = [
  { i: PackageCheck, t: 'Receba', s: 'Seu produto chega com um código de ativação.' },
  { i: Smartphone, t: 'Ative e edite', s: 'Entre na sua conta, ative com o código e monte o perfil.' },
  { i: Wifi, t: 'Aproxime', s: 'Um toque no celular ou o QR Code abre o seu perfil.' },
];

export default function StoreProductPage() {
  const { id } = useParams<{ id: string }>();
  const { add, imgFor } = useStore();
  const product = PRODUCTS.find((p) => p.id === id);
  const [formatId, setFormatId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState<number | null>(0);

  if (!product) {
    return (
      <section className="mx-auto max-w-xl px-4 py-32 text-center">
        <h1 className="text-[32px] font-bold tracking-tight">Produto não encontrado</h1>
        <p className="mt-2 text-[#6e6e73]">Ele pode ter saído da loja ou o endereço está incorreto.</p>
        <Link to="/loja" className="mt-8 inline-flex h-12 items-center rounded-full bg-[#0071e3] px-7 text-[16px] font-semibold text-white hover:bg-[#0077ed]">Voltar para a loja</Link>
      </section>
    );
  }

  const quote = product.price <= 0;
  const fmts = product.combo ? [] : FORMATS.filter((f) => product.formats.includes(f.id));
  const currentFormat = formatId || product.formats[0];
  const images = (product.gallery && product.gallery.length ? product.gallery : [imgFor(product)]).filter(Boolean);
  const related = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 3);
  const freeShip = product.price * qty >= FREE_SHIPPING_FROM;

  return (
    <>
      <Seo title={`${product.name} — ${product.tag}`} description={product.desc} path={`/loja/${product.id}`} />

      <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:pb-10">
        <nav className="mb-6 flex items-center gap-1.5 text-[13px] text-[#6e6e73]" aria-label="Você está em">
          <Link to="/loja" className="hover:text-[#0066cc] hover:underline">Loja</Link><ChevronRight size={13} />
          <span className="truncate text-[#1d1d1f]">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <Gallery images={images} alt={product.name} />

          <div className="lg:sticky lg:top-20 lg:self-start">
            {product.badge && <span className="mb-3 inline-block rounded-full bg-[#bf4800]/10 px-3 py-1 text-[12px] font-semibold text-[#bf4800]">{product.badge}</span>}
            <p className="text-[13px] font-semibold uppercase tracking-wider text-[#86868b]">{product.tag}</p>
            <h1 className="mt-1 text-[34px] font-bold leading-[1.08] tracking-[-0.025em] sm:text-[42px]">{product.name}</h1>
            <p className="mt-3 text-[17px] leading-relaxed text-[#6e6e73]">{product.desc}</p>

            <div className="mt-6">
              {quote ? (
                <p className="text-[28px] font-semibold">Sob consulta</p>
              ) : (
                <>
                  <p className="text-[30px] font-semibold tracking-tight">
                    {product.oldPrice ? <span className="mr-2 text-[18px] font-normal text-[#86868b] line-through">R$ {fmtPrice(product.oldPrice)}</span> : null}
                    R$ {fmtPrice(product.price)}
                  </p>
                  {product.oldPrice ? <p className="text-[14px] font-medium text-[#1d7f3a]">Você economiza R$ {fmtPrice(product.oldPrice - product.price)}</p> : null}
                  <p className="mt-1 flex items-center gap-1.5 text-[14px] text-[#6e6e73]"><CreditCard size={15} />Pix ou até 12x no cartão</p>
                </>
              )}
            </div>

            {fmts.length > 1 && (
              <div className="mt-6">
                <p className="mb-2 text-[14px] font-semibold">Formato</p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Formato">
                  {fmts.map((f) => (
                    <button key={f.id} type="button" role="radio" aria-checked={currentFormat === f.id} onClick={() => setFormatId(f.id)}
                      className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[14px] font-medium transition active:scale-95 ${currentFormat === f.id ? 'bg-white text-[#1d1d1f] ring-2 ring-[#0071e3]' : 'bg-white text-[#424245] ring-1 ring-black/15 hover:ring-black/30'}`}>
                      {f.icon}{f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.combo && product.comboItems && (
              <div className="mt-6 rounded-2xl bg-[#f5f5f7] p-4">
                <p className="mb-2 text-[14px] font-semibold">No kit</p>
                <ul className="space-y-1.5 text-[14px] text-[#424245]">{product.comboItems.map((it) => <li key={it} className="flex items-center gap-2"><Check size={15} className="text-[#0071e3]" />{it}</li>)}</ul>
              </div>
            )}

            {/* Compra */}
            <div className="mt-7 hidden items-center gap-3 lg:flex">
              {!quote && <Qty qty={qty} setQty={setQty} />}
              <BuyButton quote={quote} name={product.name} onBuy={() => add(product, currentFormat, qty)} />
            </div>

            <ul className="mt-7 space-y-3 border-t border-black/10 pt-6 text-[14px]">
              <li className="flex items-start gap-3"><Truck size={18} className="mt-0.5 shrink-0 text-[#0071e3]" /><span><strong>{freeShip ? 'Frete grátis neste pedido' : `Frete grátis acima de R$ ${FREE_SHIPPING_FROM}`}</strong><br /><span className="text-[#6e6e73]">Entrega para todo o Brasil. Prazo confirmado antes do pagamento.</span></span></li>
              <li className="flex items-start gap-3"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#0071e3]" /><span><strong>Sem app e sem mensalidade</strong><br /><span className="text-[#6e6e73]">Você paga uma vez e edita o perfil quando quiser.</span></span></li>
              <li className="flex items-start gap-3"><QrCode size={18} className="mt-0.5 shrink-0 text-[#0071e3]" /><span><strong>NFC + QR Code</strong><br /><span className="text-[#6e6e73]">Se o celular não tiver NFC, o QR Code abre o mesmo perfil.</span></span></li>
            </ul>
            <div className="mt-6"><p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[#86868b]">Formas de pagamento</p><PaymentBadges /></div>
          </div>
        </div>

        {/* Sobre */}
        <section className="mt-16 grid gap-8 md:grid-cols-2 md:gap-14" aria-label="Sobre o produto">
          <div>
            <h2 className="text-[28px] font-bold tracking-tight">Sobre</h2>
            <p className="mt-3 text-[16px] leading-relaxed text-[#424245]">{product.longDesc}</p>
          </div>
          <div>
            <h2 className="text-[28px] font-bold tracking-tight">O que tem nele</h2>
            <ul className="mt-3 space-y-2.5">
              {product.specs.map((s) => <li key={s} className="flex items-start gap-3 text-[15px] text-[#424245]"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0071e3]/10"><Check size={12} className="text-[#0071e3]" strokeWidth={3} /></span>{s}</li>)}
            </ul>
          </div>
        </section>

        {/* Como funciona */}
        <section className="mt-16" aria-label="Como funciona">
          <h2 className="text-[28px] font-bold tracking-tight">Como funciona</h2>
          <ol className="mt-5 grid gap-4 md:grid-cols-3">
            {STEPS.map(({ i: Icon, t, s }, n) => (
              <li key={t} className="rounded-3xl bg-white p-6 ring-1 ring-black/[0.06]">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0071e3]/10"><Icon size={20} className="text-[#0071e3]" /></span>
                <p className="mt-4 text-[12px] font-semibold uppercase tracking-wider text-[#86868b]">Passo {n + 1}</p>
                <p className="text-[18px] font-semibold">{t}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-[#6e6e73]">{s}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section className="mt-16 max-w-3xl" aria-label="Perguntas frequentes">
          <h2 className="text-[28px] font-bold tracking-tight">Perguntas frequentes</h2>
          <div className="mt-4 divide-y divide-black/10 border-y border-black/10">
            {FAQ.map(([q, a], i) => (
              <div key={q}>
                <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 py-4 text-left text-[16px] font-medium">
                  {q}<ChevronDown size={18} className={`shrink-0 text-[#86868b] transition-transform ${open === i ? 'rotate-180' : ''}`} />
                </button>
                {open === i && <p className="pb-4 text-[15px] leading-relaxed text-[#6e6e73]">{a}</p>}
              </div>
            ))}
          </div>
          <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Olá! Tenho uma dúvida sobre o ${product.name}.`)}`} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-[15px] font-medium text-[#0066cc] hover:underline"><MessageCircle size={16} />Ainda tem dúvida? Fale com a gente</a>
        </section>

        {/* Relacionados */}
        <section className="mt-16" aria-label="Você também pode gostar">
          <h2 className="text-[28px] font-bold tracking-tight">Você também pode gostar</h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-3">
            {related.map((p) => (
              <li key={p.id}>
                <Link to={`/loja/${p.id}`} className="group block overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.06] transition hover:-translate-y-1 hover:shadow-[0_18px_50px_-18px_rgba(0,0,0,0.25)]">
                  <div className="aspect-[4/3] overflow-hidden bg-[#f5f5f7]"><img src={imgFor(p)} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" /></div>
                  <div className="p-4"><p className="text-[16px] font-semibold">{p.name}</p><p className="mt-0.5 text-[14px] text-[#6e6e73]">{p.price > 0 ? `R$ ${fmtPrice(p.price)}` : 'Sob consulta'}</p></div>
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/loja" className="mt-6 inline-flex items-center gap-1 text-[15px] font-medium text-[#0066cc] hover:underline">Ver todos os produtos <ArrowRight size={15} /></Link>
        </section>
      </div>

      {/* Barra de compra fixa no celular */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1"><p className="truncate text-[13px] text-[#6e6e73]">{product.name}</p><p className="text-[17px] font-semibold">{quote ? 'Sob consulta' : `R$ ${fmtPrice(product.price * qty)}`}</p></div>
          {!quote && <Qty qty={qty} setQty={setQty} compact />}
          <BuyButton quote={quote} name={product.name} onBuy={() => add(product, currentFormat, qty)} compact />
        </div>
      </div>
    </>
  );
}

function Qty({ qty, setQty, compact }: { qty: number; setQty: (n: number) => void; compact?: boolean }) {
  const b = `flex ${compact ? 'h-9 w-9' : 'h-12 w-11'} items-center justify-center text-[18px] hover:bg-black/5 disabled:opacity-30`;
  return (
    <div className="inline-flex items-center rounded-full border border-black/15 bg-white" role="group" aria-label="Quantidade">
      <button type="button" className={`${b} rounded-l-full`} onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} aria-label="Diminuir">−</button>
      <span className="w-7 text-center text-[15px] font-medium" aria-live="polite">{qty}</span>
      <button type="button" className={`${b} rounded-r-full`} onClick={() => setQty(Math.min(99, qty + 1))} aria-label="Aumentar">+</button>
    </div>
  );
}

function BuyButton({ quote, name, onBuy, compact }: { quote: boolean; name: string; onBuy: () => void; compact?: boolean }) {
  const cls = `${compact ? 'h-10 px-6 text-[15px]' : 'h-12 flex-1 text-[16px]'} inline-flex items-center justify-center gap-2 rounded-full bg-[#0071e3] font-semibold text-white transition hover:bg-[#0077ed] active:scale-95`;
  return quote ? (
    <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Olá! Quero um orçamento do ${name}.`)}`} target="_blank" rel="noopener noreferrer" className={cls}><MessageCircle size={17} />Pedir orçamento</a>
  ) : (
    <button type="button" onClick={onBuy} className={cls}>Comprar</button>
  );
}

/** Galeria com setas, miniaturas, deslize no celular e zoom suave ao passar o mouse. */
function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const touch = useRef<number | null>(null);
  const n = images.length;
  const go = (d: number) => setI((v) => (v + d + n) % n);
  const thumbs = useMemo(() => images.slice(0, 6), [images]);

  return (
    <div>
      <div
        className="group relative aspect-[4/3] overflow-hidden rounded-[28px] bg-[#f5f5f7] ring-1 ring-black/[0.05] sm:aspect-square lg:aspect-[4/3.4]"
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }}
        onMouseLeave={() => setZoom(null)}
        onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { if (touch.current === null || n < 2) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); touch.current = null; }}
      >
        {images.map((src, k) => (
          <img key={src + k} src={src} alt={k === i ? alt : ''} aria-hidden={k !== i} loading={k === 0 ? 'eager' : 'lazy'} decoding="async"
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 ${k === i ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            style={k === i && zoom ? { transform: 'scale(1.6)', transformOrigin: `${zoom.x}% ${zoom.y}%`, transitionDuration: '150ms' } : undefined} />
        ))}
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Foto anterior" className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1d1d1f] opacity-100 shadow-md backdrop-blur transition hover:bg-white active:scale-95 sm:opacity-0 sm:group-hover:opacity-100"><ChevronLeft size={20} /></button>
            <button type="button" onClick={() => go(1)} aria-label="Próxima foto" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1d1d1f] opacity-100 shadow-md backdrop-blur transition hover:bg-white active:scale-95 sm:opacity-0 sm:group-hover:opacity-100"><ChevronRight size={20} /></button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
              {images.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-5 bg-[#1d1d1f]' : 'w-1.5 bg-black/25'}`} />)}
            </div>
          </>
        )}
      </div>
      {n > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {thumbs.map((src, k) => (
            <li key={src + k}>
              <button type="button" onClick={() => setI(k)} aria-label={`Ver foto ${k + 1}`} aria-current={k === i}
                className={`h-16 w-16 overflow-hidden rounded-xl bg-[#f5f5f7] transition sm:h-20 sm:w-20 ${k === i ? 'ring-2 ring-[#0071e3]' : 'opacity-70 ring-1 ring-black/10 hover:opacity-100'}`}>
                <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
