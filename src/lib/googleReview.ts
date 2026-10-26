/**
 * AirNext Google — regras compartilhadas da linha "plaquinha de avaliações".
 *
 * A regra de verdade mora no BANCO (public.is_valid_google_review_url +
 * CHECK em products.redirect_url, ver sql/10_airnext_google.sql). Esta cópia
 * existe só para dar um erro claro na tela ANTES de ir ao servidor — e para
 * não redirecionar o visitante caso algum valor inesperado chegue.
 * Mantenha as duas listas de domínios idênticas.
 */

export type ProductLine = 'STANDARD' | 'GOOGLE';

/** Linha de produto que só redireciona para as avaliações do Google. */
export const GOOGLE_LINE: ProductLine = 'GOOGLE';

/** Prefixo dos códigos de ativação da linha Google (ex.: ANG-7K92M4QX). */
export const GOOGLE_CODE_PREFIX = 'ANG';

/**
 * Prefixos reconhecidos em códigos de ativação lidos de QR/texto.
 * (O tipo do produto NÃO é decidido pelo prefixo — vem do banco; o prefixo
 * serve para o humano identificar a plaquinha e para o leitor de QR.)
 */
export const ACTIVATION_CODE_PREFIXES = ['AIR', 'ANG', 'ANP', 'ANS'] as const;

const HOSTS =
  '(?:(?:www\\.|maps\\.|search\\.|business\\.)?google\\.com(?:\\.br)?|g\\.page|g\\.co|maps\\.app\\.goo\\.gl|goo\\.gl|share\\.google)';
const ALLOWED = new RegExp(`^https://${HOSTS}(?::443)?(?:[/?#]|$)`, 'i');
// Redirecionadores do próprio Google (evitam "google.com/url?q=site-de-golpe").
const BLOCKED_PATH = /^https:\/\/[^/?#]+\/(?:url|amp|aclk|pagead|imgres)(?:[/?#]|$)/i;
const BAD_CHARS = /[\s\u0000-\u001f\u007f]/;

/** true só para link https de avaliações/lugares do Google (lista fechada de domínios). */
export function isValidGoogleReviewUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return (
    url.length >= 12 &&
    url.length <= 2048 &&
    !BAD_CHARS.test(url) &&
    ALLOWED.test(url) &&
    !BLOCKED_PATH.test(url)
  );
}

/**
 * Arruma o que o cliente colou: tira espaços, completa "https://" quando ele
 * cola "g.page/r/..." sem esquema e troca http:// por https://.
 */
export function normalizeGoogleReviewUrl(raw: string): string {
  let u = (raw || '').trim();
  if (!u) return '';
  if (/^http:\/\//i.test(u)) u = u.replace(/^http:\/\//i, 'https://');
  else if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = `https://${u.replace(/^\/+/, '')}`;
  return u;
}

/** Mensagem amigável quando o link não é aceito. */
export const GOOGLE_URL_HELP =
  'Cole o link de avaliações do Google do seu estabelecimento (ex.: g.page/r/…/review ou maps.app.goo.gl/…). Só links do Google são aceitos.';
