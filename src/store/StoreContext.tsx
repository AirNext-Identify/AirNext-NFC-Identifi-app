import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { FORMATS, ORIGINAL_LINE_IDS, PRODUCTS, type Product } from '../pages/LandingPage';
import { saveOrder, formatAddress, PAYMENT_LABEL } from '../lib/orders';
import { EMPTY_CHECKOUT, validateCheckout, toShippingAddress, type CheckoutInfo } from '../components/landing/CheckoutForm';
import { useSiteImages } from '../hooks/useSiteImages';
import { productImage } from '../lib/productShowcase';
import { fmtPrice } from '../lib/price';

export const WHATSAPP = '5547996287761';
export const FREE_SHIPPING_FROM = 150;
const CART_KEY = 'airnext:store-cart:v1';

export type Step = 'cart' | 'form' | 'review' | 'sent';

interface StoredLine { key: string; productId: string; formatId: string; quantity: number }
export interface CartLine { key: string; product: Product; formatId: string; formatLabel: string; quantity: number }

function loadStored(): StoredLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr)
      ? arr.filter((l) => l && typeof l.productId === 'string' && typeof l.key === 'string' && typeof l.quantity === 'number')
      : [];
  } catch { return []; }
}

interface StoreCtx {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (p: Product, formatId?: string, qty?: number) => void;
  changeQty: (key: string, delta: number) => void;
  remove: (key: string) => void;
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  step: Step;
  setStep: (s: Step) => void;
  info: CheckoutInfo;
  setInfo: (c: CheckoutInfo) => void;
  showErrors: boolean;
  goReview: () => boolean;
  submit: () => void;
  /** Conclui o pedido enviado: limpa dados do formulário e fecha a sacola. */
  finish: () => void;
  orderNumber: string;
  imgFor: (p: Product) => string;
  imgLoading: boolean;
}

const Ctx = createContext<StoreCtx | null>(null);
export const useStore = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore fora do StoreProvider');
  return v;
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const { resolve, loading: imgLoading } = useSiteImages();
  const [stored, setStored] = useState<StoredLine[]>(loadStored);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [step, setStep] = useState<Step>('cart');
  const [info, setInfo] = useState<CheckoutInfo>(EMPTY_CHECKOUT);
  const [showErrors, setShowErrors] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(stored)); } catch { /* sem storage */ }
  }, [stored]);

  const lines = useMemo<CartLine[]>(() => stored.flatMap((l) => {
    const product = PRODUCTS.find((p) => p.id === l.productId);
    if (!product || product.price <= 0) return [];
    const fmt = FORMATS.find((f) => f.id === l.formatId);
    return [{
      key: l.key, product, formatId: l.formatId,
      formatLabel: product.combo ? 'Kit: Card + Tag + Pulseira' : fmt?.label || l.formatId,
      quantity: Math.min(99, Math.max(1, l.quantity)),
    }];
  }), [stored]);

  const count = lines.reduce((a, l) => a + l.quantity, 0);
  const subtotal = lines.reduce((a, l) => a + Math.round(l.product.price * l.quantity * 100) / 100, 0);

  const add = useCallback((product: Product, formatId?: string, qty = 1) => {
    if (product.price <= 0) return;
    const fid = product.combo ? 'combo' : formatId || product.formats[0];
    const key = `${product.id}::${fid}`;
    setStored((prev) => {
      const ex = prev.find((l) => l.key === key);
      if (ex) return prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(99, l.quantity + qty) } : l));
      return [...prev, { key, productId: product.id, formatId: fid, quantity: qty }];
    });
    setStep('cart');
    setCartOpen(true);
  }, []);

  const changeQty = useCallback((key: string, delta: number) => {
    setStored((prev) => prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(99, Math.max(1, l.quantity + delta)) } : l)));
  }, []);
  const remove = useCallback((key: string) => setStored((prev) => prev.filter((l) => l.key !== key)), []);

  const openCart = useCallback(() => { setStep((s) => (s === 'sent' ? 'cart' : s)); setCartOpen(true); }, []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const goReview = useCallback(() => {
    if (Object.keys(validateCheckout(info)).length > 0) { setShowErrors(true); return false; }
    setStep('review');
    return true;
  }, [info]);

  const submit = useCallback(() => {
    if (Object.keys(validateCheckout(info)).length > 0) { setShowErrors(true); setStep('form'); return; }
    const number = `AN-${Date.now().toString().slice(-6)}`;
    const when = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    const total = lines.reduce((a, l) => a + l.quantity, 0);
    const msg = [
      'Olá! Gostaria de finalizar o pedido completo abaixo:', '',
      `*Pedido:* ${number}`, `*Data/Hora:* ${when}`, `*Itens:* ${total}`, '',
      ...lines.map((l) => `• ${l.product.name} (${l.formatLabel}) — ${l.quantity}x — R$ ${fmtPrice(l.product.price * l.quantity)}`),
      '', `Subtotal: R$ ${fmtPrice(subtotal)}`,
      '', '*Dados de contato*', `Nome: ${info.nome}`, `Telefone: ${info.telefone}`,
      ...(info.email.trim() ? [`E-mail: ${info.email.trim()}`] : []),
      '', '*Entrega*',
      `Quem recebe: ${info.recebeOutro ? info.recebedorNome.trim() : `${info.nome} (próprio comprador)`}`,
      ...(info.recebeOutro && info.recebedorTelefone ? [`Telefone de quem recebe: ${info.recebedorTelefone}`] : []),
      `Endereço: ${formatAddress(toShippingAddress(info))}`,
      '', '*Pagamento*', `Forma escolhida: ${info.pagamento ? PAYMENT_LABEL[info.pagamento] : 'não informada'}`,
      '(Frete e prazo: por favor, confirmem comigo por aqui.)',
      ...(info.obs.trim() ? ['', `Observações: ${info.obs.trim()}`] : []),
      '', '_Pedido feito pela Loja AirNext_',
    ].join('\n');

    // Registra no painel admin; nunca bloqueia o envio pelo WhatsApp.
    void saveOrder({
      orderNumber: number,
      source: 'sacola',
      items: lines.map((l) => ({ name: l.product.name, format: l.formatLabel, qty: l.quantity, price: l.product.price })),
      subtotal,
      customerName: info.nome,
      customerPhone: info.telefone,
      customerEmail: info.email,
      recipientName: info.recebeOutro ? info.recebedorNome : info.nome,
      recipientPhone: info.recebeOutro ? info.recebedorTelefone : info.telefone,
      paymentMethod: info.pagamento || undefined,
      shippingAddress: toShippingAddress(info),
      notes: info.obs,
    });
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
    setOrderNumber(number);
    setStored([]);
    setShowErrors(false);
    setStep('sent');
  }, [info, lines, subtotal]);

  const finish = useCallback(() => {
    setStep('cart');
    setInfo(EMPTY_CHECKOUT);
    setShowErrors(false);
    setCartOpen(false);
  }, []);

  const imgFor = useCallback((p: Product) => productImage(p, resolve, ORIGINAL_LINE_IDS.includes(p.id)), [resolve]);

  const value: StoreCtx = {
    lines, count, subtotal, add, changeQty, remove, cartOpen, openCart, closeCart, searchOpen, setSearchOpen,
    step, setStep, info, setInfo, showErrors, goReview, submit, finish, orderNumber, imgFor, imgLoading,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
