/**
 * Consentimento de cookies (LGPD) compartilhado entre a landing e os perfis públicos.
 * Usa a MESMA chave da landing: quem escolheu num lugar não é perguntado de novo no outro.
 */
export interface CookiePrefs {
  analytics: boolean;
  marketing: boolean;
}

export const COOKIE_CONSENT_KEY = 'airnext_cookie_consent';
/** Dispare este evento (window.dispatchEvent) para reabrir o painel, ex.: link “Configurações de cookies”. */
export const OPEN_COOKIE_SETTINGS_EVENT = 'airnext:open-cookie-settings';
export const COOKIE_CONSENT_CHANGED_EVENT = 'airnext:cookie-consent';

export function readCookieConsent(): CookiePrefs | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p?.analytics !== 'boolean' || typeof p?.marketing !== 'boolean') return null;
    return { analytics: p.analytics, marketing: p.marketing };
  } catch {
    return null;
  }
}

export function writeCookieConsent(prefs: CookiePrefs): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
  } catch {
    /* navegador bloqueou o armazenamento: a escolha vale só nesta visita */
  }
  window.dispatchEvent(new CustomEvent<CookiePrefs>(COOKIE_CONSENT_CHANGED_EVENT, { detail: prefs }));
}
