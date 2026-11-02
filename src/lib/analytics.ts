/**
 * Google Analytics 4 — AirNext (G-R0FNB8J98C).
 *
 * O script do GA e o `config` ficam UMA vez no index.html (com Consent Mode v2 e `send_page_view:false`).
 * Este módulo só envia os `page_view` de cada rota (o site é uma SPA) e repassa o consentimento de cookies.
 */
export const GA_MEASUREMENT_ID = 'G-R0FNB8J98C';

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    gtag?: Gtag;
  }
}

/** Áreas internas: não entram no GA (têm dados de clientes na URL e sujariam as métricas). */
const EXCLUDED_PREFIXES = ['/admin', '/painel-imagens'];

/**
 * Tira da URL tudo que é código/identificador privado (código de ativação, UUID do chip, id de produto)
 * e a query string, para nada disso ir parar no Google.
 */
export function sanitizePath(pathname: string): string {
  const path = (pathname.split(/[?#]/)[0] || '/').replace(/\/{2,}/g, '/');
  return path
    .replace(/^\/ativar\/[^/]+/, '/ativar/:code')
    .replace(/^\/a\/[^/]+/, '/a/:code')
    .replace(/^\/n\/[^/]+/, '/n/:uuid')
    .replace(/^\/dashboard\/perfil\/[^/]+/, '/dashboard/perfil/:id');
}

export function isExcludedPath(path: string): boolean {
  return EXCLUDED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

let lastPath: string | null = null;

/** Envia um page_view (1ª página e cada troca de rota). Ignora repetição imediata da mesma rota. */
export function trackPageView(pathname: string): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  const path = sanitizePath(pathname);
  if (isExcludedPath(path)) { lastPath = null; return; }
  if (path === lastPath) return;
  lastPath = path;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: `${window.location.origin}${path}`,
    page_title: document.title,
  });
}

/** Repassa a escolha do banner de cookies ao Google (Consent Mode). */
export function setAnalyticsConsent(prefs: { analytics: boolean; marketing: boolean }): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('consent', 'update', {
    analytics_storage: prefs.analytics ? 'granted' : 'denied',
    ad_storage: prefs.marketing ? 'granted' : 'denied',
    ad_user_data: prefs.marketing ? 'granted' : 'denied',
    ad_personalization: prefs.marketing ? 'granted' : 'denied',
  });
}
