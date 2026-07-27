/**
 * SEO, compartilhamento e Google Preferred Sources — AirNext
 */

/** Domínio de produção (Vercel). Override via VITE_SITE_URL. */
export const SITE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL) ||
  'https://airnext-xi.vercel.app'
).replace(/\/$/, '');

/**
 * Host sem protocolo — formato recomendado pelo Google no deeplink
 * https://developers.google.com/search/docs/appearance/preferred-sources
 */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');

/**
 * Deeplink oficial: abre o Google Source Preferences com a AirNext pré-preenchida.
 * Usuários que adicionam o site passam a ver conteúdo AirNext com badge
 * "preferred" em Top Stories, AI Mode e AI Overviews.
 */
export const GOOGLE_PREFERRED_SOURCES_URL =
  `https://google.com/preferences/source?q=${encodeURIComponent(SITE_URL)}`;

/** Alternativa só com o host (também aceita pelo tool do Google) */
export const GOOGLE_PREFERRED_SOURCES_URL_HOST =
  `https://google.com/preferences/source?q=${encodeURIComponent(SITE_HOST)}`;

export const SITE_NAME = 'AirNext';
export const SITE_TAGLINE = 'Conectando o físico ao digital';
export const SITE_DESCRIPTION =
  'AirNext transforma cartões, tags e pulseiras NFC em perfis digitais inteligentes. Compartilhe contatos, pet, kids, TEA e negócios com um toque — privacidade, design premium e controle total.';

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

/**
 * Imagem do card ao compartilhar (WhatsApp, LinkedIn, etc.).
 * Ideal: PNG/JPG 1200×630 em /public/og-image.png
 * Enquanto isso, usa o favicon público do site.
 */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/favicon.png`;
export const FALLBACK_OG_IMAGE = `${SITE_URL}/favicon.png`;
export const TWITTER_HANDLE = '@airnext';

export type SeoProps = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'profile' | 'article';
  noIndex?: boolean;
  keywords?: string;
  /** Nome exibido no card de perfil ao compartilhar */
  profileName?: string;
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


/** Normaliza imagem de preview (OG). data: URLs não funcionam no WhatsApp — usa fallback. */
export function resolveOgImage(src?: string | null): string {
  if (!src || src.startsWith('data:')) return DEFAULT_OG_IMAGE;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('//')) return `https:${src}`;
  const path = src.startsWith('/') ? src : `/${src}`;
  return absoluteUrl(path);
}
