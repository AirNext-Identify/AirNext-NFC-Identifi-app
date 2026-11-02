import { supabase } from './supabase';

export type OrderStatus =
  | 'novo' | 'em_contato' | 'aguardando_pagamento' | 'pago' | 'concluido'
  | 'em_producao' | 'enviado' | 'entregue' | 'cancelado';

export const ORDER_STATUSES: { id: OrderStatus; label: string; badge: string }[] = [
  { id: 'novo',                 label: 'Novo',                  badge: 'bg-indigo-500/15 text-indigo-300 ring-indigo-500/30' },
  { id: 'em_contato',           label: 'Em contato',            badge: 'bg-sky-500/15 text-sky-300 ring-sky-500/30' },
  { id: 'aguardando_pagamento', label: 'Aguardando pagamento',  badge: 'bg-amber-500/15 text-amber-300 ring-amber-500/30' },
  { id: 'pago',                 label: 'Pago',                  badge: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' },
  { id: 'concluido',            label: 'Concluído',             badge: 'bg-teal-500/15 text-teal-300 ring-teal-500/30' },
  { id: 'em_producao',          label: 'Em produção',           badge: 'bg-violet-500/15 text-violet-300 ring-violet-500/30' },
  { id: 'enviado',              label: 'Enviado',               badge: 'bg-cyan-500/15 text-cyan-300 ring-cyan-500/30' },
  { id: 'entregue',             label: 'Entregue',              badge: 'bg-green-500/15 text-green-300 ring-green-500/30' },
  { id: 'cancelado',            label: 'Cancelado',             badge: 'bg-red-500/15 text-red-300 ring-red-500/30' },
];

export interface OrderItem { name: string; format?: string; qty: number; price: number }

export type PaymentMethod = 'pix' | 'cartao';
export const PAYMENT_LABEL: Record<PaymentMethod, string> = { pix: 'Pix', cartao: 'Cartão de crédito/débito' };

export interface ShippingAddress {
  cep: string;
  street: string;
  number: string;        // 's/n' quando não há número
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  reference?: string;
}

/** Endereço em uma linha (para WhatsApp, recibo, planilha). */
export function formatAddress(a?: ShippingAddress | null): string {
  if (!a) return '';
  const l1 = [a.street, a.number].filter(Boolean).join(', ') + (a.complement ? ` — ${a.complement}` : '');
  const l2 = [a.neighborhood, [a.city, a.state].filter(Boolean).join('/')].filter(Boolean).join(' · ');
  const cep = a.cep ? `CEP ${a.cep}` : '';
  return [l1, l2, cep].filter(Boolean).join(' · ') + (a.reference ? ` (ref.: ${a.reference})` : '');
}

export interface Order {
  id: string;
  order_number: string;
  source: string;
  items: OrderItem[];
  subtotal: number;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email?: string | null;
  recipient_name?: string | null;
  recipient_phone?: string | null;
  payment_method?: PaymentMethod | null;
  shipping_address?: ShippingAddress | null;
  carrier?: string | null;
  tracking_code?: string | null;
  tracking_url?: string | null;
  estimated_delivery?: string | null;
  shipping_note?: string | null;
  shipped_at?: string | null;
  notes: string | null;
  status: OrderStatus;
  admin_notes: string | null;
  seen: boolean;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Pedido realmente fechado (produto concluído / indo para produção, enviado ou entregue). */
export const isFinalized = (o: Pick<Order, 'status' | 'finalized_at'>) =>
  o.status !== 'cancelado' && (!!o.finalized_at || ['concluido', 'em_producao', 'enviado', 'entregue'].includes(o.status));

export interface NewOrderInput {
  orderNumber: string;
  source: 'sacola' | 'personalizador';
  items: OrderItem[];
  subtotal: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  recipientName?: string;
  recipientPhone?: string;
  paymentMethod?: PaymentMethod;
  shippingAddress?: ShippingAddress;
  notes?: string;
}

/**
 * Registra o pedido para o painel admin. É "melhor esforço": NUNCA bloqueia nem
 * quebra o envio pelo WhatsApp — se o banco falhar, o cliente segue normalmente.
 */
export async function saveOrder(input: NewOrderInput): Promise<void> {
  const base = {
    order_number: input.orderNumber,
    source: input.source,
    items: input.items,
    subtotal: input.subtotal,
    customer_name: input.customerName?.trim() || null,
    customer_phone: input.customerPhone?.trim() || null,
  };
  const userNotes = input.notes?.trim() || '';
  try {
    const { error } = await supabase.from('orders').insert({
      ...base,
      customer_email: input.customerEmail?.trim() || null,
      recipient_name: input.recipientName?.trim() || null,
      recipient_phone: input.recipientPhone?.trim() || null,
      payment_method: input.paymentMethod ?? null,
      shipping_address: input.shippingAddress ?? null,
      notes: userNotes.slice(0, 4000) || null,
    });
    if (!error) return;

    // Fallback: se o SQL 09 ainda não foi rodado (colunas novas inexistentes), o pedido
    // NÃO se perde — os dados de entrega/pagamento vão dentro das observações.
    console.warn('Pedido com colunas novas falhou, usando fallback:', error.message);
    const extra = [
      input.recipientName ? `Recebe: ${input.recipientName}${input.recipientPhone ? ` (${input.recipientPhone})` : ''}` : '',
      input.shippingAddress ? `Entrega: ${formatAddress(input.shippingAddress)}` : '',
      input.paymentMethod ? `Pagamento: ${PAYMENT_LABEL[input.paymentMethod]}` : '',
      input.customerEmail ? `E-mail: ${input.customerEmail}` : '',
    ].filter(Boolean).join('\n');
    const merged = [extra, userNotes && `Obs.: ${userNotes}`].filter(Boolean).join('\n').slice(0, 4000);
    const { error: err2 } = await supabase.from('orders').insert({ ...base, notes: merged || null });
    if (err2) console.warn('Pedido não registrado no painel:', err2.message);
  } catch (e) {
    console.warn('Pedido não registrado no painel:', e);
  }
}
