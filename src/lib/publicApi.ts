import { supabase } from './supabase';
import { mapProduct } from './mapProduct';
import type { Product } from '../types/product';

// Usado pela página pública (/u/:slug, /p/:slug). Antes essas duas funções
// viviam dentro do AuthContext, o que obrigava toda visita pública (NFC/QR —
// provavelmente o maior volume de tráfego do app) a montar o AuthProvider
// inteiro e disparar checagem de sessão só para exibir um cartão público.
export async function getPublicProfile(slug: string): Promise<Product | undefined> {
  const { data, error } = await supabase
    .from('products')
    .select('id, code, user_id, status, activated_at, expires_at, created_at, category, slug, theme, visibility, lote_name, product_type, profile_data, media_carousel, stats')
    .eq('slug', slug)
    .eq('status', 'ATIVO')
    .single();

  if (error || !data) return undefined;
  const product = mapProduct(data);
  if (product.visibility === 'private' || product.visibility === 'hidden') return undefined;
  return product;
}

export async function recordVisit(
  productId: string,
  type: 'nfc' | 'qr' | 'link' = 'link',
  action?: string
): Promise<void> {
  const device = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop';

  // Sem .select() no final: o retorno do insert nunca era usado pelo
  // chamador, só somava payload de resposta desnecessário.
  const { error } = await supabase.from('visits').insert([
    {
      product_id: productId,
      type,
      action: action || null,
      device,
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) console.error('Falha ao registrar acesso:', error);
}
