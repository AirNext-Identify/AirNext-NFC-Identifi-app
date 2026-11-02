import { PAYMENT_LABEL, formatAddress, type Order } from './orders';

export const CARRIERS = ['Correios', 'Jadlog', 'Loggi', 'Transportadora', 'Motoboy / entrega própria', 'Retirada no local', 'Outro'] as const;

export interface ShippingForm {
  carrier: string;
  trackingCode: string;
  trackingUrl: string;
  estimatedDelivery: string;
  shippingNote: string;
}

export const formFromOrder = (o: Order): ShippingForm => ({
  carrier: o.carrier || 'Correios',
  trackingCode: o.tracking_code || '',
  trackingUrl: o.tracking_url || '',
  estimatedDelivery: o.estimated_delivery || '',
  shippingNote: o.shipping_note || '',
});

/** Link de rastreio: o que você digitou ou, para Correios, o link oficial montado pelo código. */
export function trackingLink(f: Pick<ShippingForm, 'carrier' | 'trackingCode' | 'trackingUrl'>): string {
  const url = f.trackingUrl.trim();
  if (url) return url;
  const code = f.trackingCode.trim().toUpperCase();
  if (code && f.carrier === 'Correios') return `https://rastreamento.correios.com.br/app/index.php?objetos=${encodeURIComponent(code)}`;
  return '';
}

const brl = (n: number) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',')}`;

/** Mensagem pronta de "pedido finalizado" (o admin pode editar antes de enviar). */
export function buildFinalizedMessage(o: Order, f: ShippingForm): string {
  const first = (o.customer_name || '').trim().split(/\s+/)[0];
  const code = f.trackingCode.trim();
  const sent = !!code || o.status === 'enviado' || o.status === 'entregue';
  const retirada = f.carrier === 'Retirada no local';
  const link = trackingLink(f);

  const L: string[] = [];
  L.push(`Olá${first ? `, ${first}` : ''}!`);
  L.push('');
  L.push(`Seu pedido *${o.order_number}* da AirNext foi *finalizado*${
    retirada ? ' e já está pronto para retirada!' : sent ? ' e já foi enviado!' : ' e está sendo preparado para envio!'}`);
  L.push('');
  L.push('*Resumo do pedido*');
  o.items.forEach(it => L.push(`• ${it.qty}x ${it.name}${it.format ? ` (${it.format})` : ''}`));
  if (o.subtotal > 0) L.push(`Total: ${brl(o.subtotal)}${o.payment_method ? ` · ${PAYMENT_LABEL[o.payment_method]}` : ''}`);

  const ship: string[] = [];
  if (f.carrier) ship.push(`Envio: ${f.carrier}`);
  if (code) ship.push(`Código de rastreio: *${code.toUpperCase()}*`);
  if (link) ship.push(`Acompanhe aqui: ${link}`);
  if (f.estimatedDelivery.trim()) ship.push(`Previsão de entrega: ${f.estimatedDelivery.trim()}`);
  if (!retirada && o.shipping_address) ship.push(`Endereço: ${formatAddress(o.shipping_address)}`);
  if (!retirada && o.recipient_name) ship.push(`Quem recebe: ${o.recipient_name}`);
  if (ship.length) { L.push('', '*Envio*', ...ship); }

  if (f.shippingNote.trim()) L.push('', f.shippingNote.trim());
  L.push('', 'Qualquer dúvida, é só nos chamar por aqui que a gente te ajuda. Estamos à disposição!');
  L.push('Obrigado pela confiança na AirNext!');
  return L.join('\n');
}

export function whatsappUrl(phone: string | null | undefined, message: string): string | null {
  const d = (phone || '').replace(/\D/g, '');
  if (!d) return null;
  const full = d.length <= 11 ? `55${d}` : d;
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
}
