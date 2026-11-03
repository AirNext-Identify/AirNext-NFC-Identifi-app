/**
 * SEO, compartilhamento e Google Preferred Sources — AirNext
 */

/** Domínio de produção. Override via VITE_SITE_URL. */
export const SITE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL) ||
  'https://airnext.com.br'
).replace(/\/$/, '');

/**
 * Host sem protocolo — formato recomendado pelo Google no deeplink
 * https://developers.google.com/search/docs/appearance/preferred-sources
 */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');

export const SITE_NAME = 'AirNext';
export const SITE_TAGLINE = 'Conecta o físico ao digital';
export const SITE_DESCRIPTION =
  'Soluções em NFC para negócios, pets e pessoas: cartão de visita NFC, tags inteligentes e placas de avaliação que centralizam suas informações em um só perfil.';

export const SITE_KEYWORDS = [
  'AirNext',
  'cartão NFC',
  'cartão digital',
  'tag NFC',
  'QR Code',
  'perfil digital',
  'networking',
  'pet perdido',
  'pulseira NFC',
  'cartão de visita digital',
  'NFC Brasil',
  'AirNext Card',
  'Google Preferred Sources',
].join(', ');

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-airnext-logo.jpg`;
export const TWITTER_HANDLE = '@airnext';

export type SeoProps = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'profile' | 'article';
  noIndex?: boolean;
  keywords?: string;
  /** Perfis públicos: sem marca AirNext no título, no nome do site e nas imagens padrão. */
  brandless?: boolean;
  /** Nome exibido como "site" na prévia (perfis públicos usam o nome do próprio perfil). */
  siteName?: string;
};

export function absoluteUrl(path = '/'): string {
  const base = SITE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p === '/' ? '' : p}` || base;
}

export function fullTitle(title?: string): string {
  if (!title || title === SITE_NAME) return `${SITE_NAME} — ${SITE_TAGLINE}`;
  if (title.includes(SITE_NAME)) return title;
  return `${title} | ${SITE_NAME}`;
}
