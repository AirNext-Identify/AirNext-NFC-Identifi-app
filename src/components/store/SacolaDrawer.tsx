import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, MessageCircle, Minus, Plus, ShoppingBag, Trash2, Truck, X, Zap } from 'lucide-react';
import CheckoutForm, { validateCheckout } from '../landing/CheckoutForm';
import { FeedbackLink, GOOGLE_REVIEW_URL, useFeedback } from '../feedback';
import { fmtPrice } from '../../lib/price';
import { FREE_SHIPPING_FROM, WHATSAPP, useStore } from '../../store/StoreContext';

interface Props {
  /** Tema da página que abriu a sacola (a landing alterna claro/escuro; a loja é sempre clara). */
  isDark?: boolean;
  /** A landing já trava a rolagem do <body> por conta própria. */
  lockScroll?: boolean;
  /** O que fazer em "Ver coleção" quando a sacola está vazia. */
  onBrowse?: () => void;
}

/**
 * Sacola + pedido em etapas (Sacola → Finalizar → Enviado).
 * É o MESMO componente na landing (#produtos) e na Loja, ligado à mesma sacola (StoreContext).
 */
export default function SacolaDrawer({ isDark = false, lockScroll = true, onBrowse }: Props) {
  const {
    cartOpen, closeCart, step, setStep, lines, count, subtotal, changeQty, remove,
    info, setInfo, showErrors, submit, finish, orderNumber, imgFor,
  } = useStore();
  const feedback = useFeedback();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const scroller = useRef<HTMLDivElement>(null);

  // Esc fecha; em páginas sem trava própria, trava a rolagem enquanto aberta.
  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      if (lockScroll) document.body.style.overflow = prev;
    };
  }, [cartOpen, closeCart, lockScroll]);

  // Pedido enviado → convite discreto de feedback (igual ao que a landing já fazia).
  useEffect(() => {
    if (step === 'sent' && cartOpen) feedback.prompt('order_sent', { delay: 2500 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, cartOpen]);

  const browse = () => {
    closeCart();
    if (onBrowse) return onBrowse();
    if (pathname === '/') {
      window.setTimeout(() => document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    } else {
      nav('/loja');
    }
  };

  const finalize = () => {
    const invalid = Object.keys(validateCheckout(info)).length > 0;
    submit();
    if (invalid) {
      // Leva a pessoa até o primeiro campo com erro.
      window.setTimeout(() => scroller.current?.querySelector('[role="alert"]')?.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
    }
  };

  const t = {
    panel: isDark ? 'bg-[#121212] text-white border-white/10' : 'bg-white text-[#1d1d1f] border-black/10',
    line: isDark ? 'border-white/10' : 'border-black/10',
    hover: isDark ? 'hover:bg-white/10 text-gray-200' : 'hover:bg-black/5 text-[#1d1d1f]',
    card: isDark ? 'bg-white/5 border-white/10' : 'bg-[#f5f5f7] border-black/[0.06]',
    muted: isDark ? 'text-gray-400' : 'text-[#6e6e73]',
    stepper: isDark ? 'bg-black border-white/10' : 'bg-white border-black/15',
    primary: isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-[#1d1d1f] text-white hover:bg-black',
  };

  const title = step === 'form' ? 'Finalizar pedido' : step === 'sent' ? 'Pedido enviado' : 'Sua sacola';
  const missing = Math.max(0, FREE_SHIPPING_FROM - subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_FROM) * 100);

  return (
    <AnimatePresence>
      {cartOpen && (
        <motion.div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0" onClick={closeCart} />
          <motion.aside
            role="dialog" aria-modal="true" aria-label={title}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`absolute inset-y-0 right-0 z-10 flex h-[100dvh] max-h-full w-full max-w-md flex-col overflow-hidden border-l p-5 shadow-2xl sm:p-6 ${t.panel}`}
          >
            {/* Cabeçalho */}
            <div className={`flex items-center justify-between border-b pb-4 ${t.line}`}>
              <div className="flex min-w-0 items-center gap-2">
                {step === 'form' && (
                  <button type="button" onClick={() => setStep('cart')} aria-label="Voltar para a sacola" className={`-ml-1.5 rounded-full p-1.5 transition ${t.hover}`}><ArrowLeft size={16} /></button>
                )}
                <ShoppingBag className="shrink-0 text-[#0071e3]" size={20} />
                <h2 className="truncate text-lg font-bold">{title}</h2>
                {step === 'cart' && count > 0 && <span className={`text-sm ${t.muted}`}>· {count} {count === 1 ? 'item' : 'itens'}</span>}
              </div>
              <button type="button" onClick={() => { closeCart(); if (step !== 'sent') setStep('cart'); }} aria-label="Fechar sacola" className={`rounded-full p-2 transition ${t.hover}`}><X size={20} /></button>
            </div>

            {/* Enviado */}
            {step === 'sent' ? (
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 text-green-500"><Check size={28} /></div>
                <p className="mb-1 text-base font-semibold">Pedido enviado para o WhatsApp!</p>
                {orderNumber && <p className={`mb-1 text-sm ${t.muted}`}>Número do pedido: <strong className={isDark ? 'text-white' : 'text-[#1d1d1f]'}>{orderNumber}</strong></p>}
                <p className={`mb-6 text-xs ${t.muted}`}>Nossa equipe vai confirmar frete, prazo e pagamento com você por lá.</p>
                <div className={`mb-6 flex w-full max-w-xs items-center justify-between gap-3 rounded-2xl border p-3.5 text-left ${t.card}`}>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">Gostou da experiência?</p>
                    <p className={`text-[11px] ${t.muted}`}>Leva 10 segundos.</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#0071e3] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#0077ed]">Google</a>
                    <FeedbackLink source="sacola · pedido enviado" className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-black/5 hover:bg-black/10'}`}>Feedback</FeedbackLink>
                  </div>
                </div>
                <div className="flex w-full max-w-xs flex-col gap-3">
                  <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] text-sm font-bold text-white transition hover:bg-[#20bd5a] active:scale-[0.98]"><MessageCircle size={16} />Abrir WhatsApp</a>
                  <button type="button" onClick={finish} className={`h-12 rounded-full text-sm font-bold transition active:scale-[0.98] ${t.primary}`}>Concluir</button>
                </div>
              </div>
            ) : lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isDark ? 'bg-white/5' : 'bg-[#f5f5f7]'}`}><ShoppingBag size={26} className={t.muted} /></div>
                <p className="mb-1 text-base font-semibold">Sua sacola está vazia</p>
                <p className={`mb-6 text-xs ${t.muted}`}>Escolha um produto AirNext para começar.</p>
                <button type="button" onClick={browse} className="h-11 rounded-full bg-[#0071e3] px-6 text-sm font-semibold text-white transition hover:bg-[#0077ed] active:scale-95">Ver coleção</button>
              </div>
            ) : step === 'form' ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <div ref={scroller} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain py-4 pr-1 [-webkit-overflow-scrolling:touch]">
                  <div className={`space-y-1.5 rounded-2xl border p-4 text-xs ${t.card}`}>
                    {lines.map((l) => (
                      <div key={l.key} className="flex justify-between gap-3">
                        <span className={isDark ? 'text-gray-300' : 'text-[#424245]'}>{l.quantity}x {l.product.name} ({l.formatLabel})</span>
                        <span className="font-bold">R$ {fmtPrice(l.product.price * l.quantity)}</span>
                      </div>
                    ))}
                    <div className={`mt-1 flex justify-between border-t pt-2 font-bold ${t.line}`}><span>Subtotal</span><span>R$ {fmtPrice(subtotal)}</span></div>
                  </div>
                  <CheckoutForm isDark={isDark} value={info} onChange={setInfo} showErrors={showErrors} />
                </div>
                <div className={`border-t pt-4 ${t.line}`}>
                  <button type="button" onClick={finalize} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] text-sm font-bold text-white shadow-lg transition hover:bg-[#20bd5a] active:scale-[0.98]">
                    <MessageCircle size={16} /> Enviar pedido pelo WhatsApp
                  </button>
                  {showErrors && Object.keys(validateCheckout(info)).length > 0 && (
                    <p role="status" className="mt-2 text-center text-[11px] text-red-500">Revise os campos destacados para continuar.</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain py-4 pr-1">
                  <div className={`rounded-2xl border p-3.5 ${t.card}`}>
                    <div className="flex items-center gap-2 text-[13px] font-medium">
                      <Truck size={16} className="text-[#0071e3]" />
                      {missing > 0 ? <span>Faltam <strong>R$ {fmtPrice(missing)}</strong> para frete grátis</span> : <span className="text-green-600">Você ganhou frete grátis!</span>}
                    </div>
                    <div className={`mt-2 h-1.5 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}><div className="h-full rounded-full bg-[#0071e3] transition-all duration-500" style={{ width: `${pct}%` }} /></div>
                  </div>

                  {lines.map((l) => (
                    <div key={l.key} className={`flex gap-4 rounded-2xl border p-3 ${t.card}`}>
                      <Link to={`/loja/${l.product.id}`} onClick={closeCart} className="shrink-0">
                        <img loading="lazy" decoding="async" src={imgFor(l.product)} alt={l.product.name} className="h-16 w-16 rounded-xl object-cover" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold">{l.product.name}</h3>
                        <p className={`mb-2 text-xs ${t.muted}`}>Formato: {l.formatLabel}</p>
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-2.5 rounded-full border px-2 py-1 ${t.stepper}`}>
                            <button type="button" onClick={() => changeQty(l.key, -1)} disabled={l.quantity <= 1} aria-label="Diminuir quantidade" className={`rounded-full p-1 disabled:opacity-30 ${t.hover}`}><Minus size={10} /></button>
                            <span className="text-xs font-bold" aria-live="polite">{l.quantity}</span>
                            <button type="button" onClick={() => changeQty(l.key, 1)} aria-label="Aumentar quantidade" className={`rounded-full p-1 ${t.hover}`}><Plus size={10} /></button>
                          </div>
                          <span className="text-sm font-bold">R$ {fmtPrice(l.product.price * l.quantity)}</span>
                        </div>
                      </div>
                      <button type="button" onClick={() => remove(l.key)} aria-label={`Remover ${l.product.name}`} className="self-start p-1 text-gray-500 transition hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>

                <div className={`space-y-4 border-t pt-4 ${t.line}`}>
                  <div className="flex justify-between text-sm font-bold"><span>Subtotal</span><span>R$ {fmtPrice(subtotal)}</span></div>
                  <div className={`flex gap-3 rounded-2xl border p-4 ${isDark ? 'border-blue-900/50 bg-blue-900/20 text-blue-200/80' : 'border-blue-100 bg-blue-50 text-blue-800'}`}>
                    <Zap size={18} className={`shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <p className="text-[11px] font-semibold leading-relaxed">Frete e prazo são confirmados com você no WhatsApp antes de pagar.</p>
                  </div>
                  <button type="button" onClick={() => setStep('form')} className={`h-12 w-full rounded-full text-sm font-bold shadow-lg transition active:scale-[0.98] ${t.primary}`}>Finalizar compra</button>
                </div>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
