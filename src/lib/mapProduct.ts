import type { Product } from '../types/product';

// Função pura (sem hooks/estado) — usada tanto pelo AuthContext (área logada)
// quanto pelo publicApi (páginas públicas /u/:slug e /p/:slug), evitando ter
// duas implementações divergentes do mesmo mapeamento de linha -> Product.
export function mapProduct(row: any): Product {
  return {
    id: row.id,
    activationCode: row.code,
    ownerId: row.user_id,
    status: row.status,
    activatedAt: row.activated_at,
    expiresAt: row.expires_at ?? null,
    createdAt: row.created_at,
    category: row.category ?? null,
    slug: row.slug ?? undefined,
    theme: row.theme ?? 'escuro',
    visibility: row.visibility ?? 'public',
    loteName: row.lote_name ?? undefined,
    productType: row.product_type ?? row.productType ?? 'CARTAO',
    profileData: row.profile_data ?? row.profileData ?? {},
    mediaCarousel: row.media_carousel ?? [],
    stats: {
      views: row.stats?.views ?? 0,
      nfcTaps: row.stats?.nfcTaps ?? row.stats?.nfc_taps ?? 0,
      qrScans: row.stats?.qrScans ?? row.stats?.qr_scans ?? 0,
      shares: row.stats?.shares ?? 0,
    },
  };
}
