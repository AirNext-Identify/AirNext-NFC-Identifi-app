import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { setAnalyticsConsent, trackPageView } from '../lib/analytics';
import { COOKIE_CONSENT_CHANGED_EVENT, type CookiePrefs } from '../lib/cookieConsent';

/**
 * Envia um page_view ao GA4 a cada troca de rota (inclui a primeira página).
 * Fica dentro do <Router>. Não renderiza nada.
 */
export default function AnalyticsTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Pequena espera: deixa o SeoManager atualizar o document.title antes de medir.
    const id = window.setTimeout(() => trackPageView(pathname), 250);
    return () => window.clearTimeout(id);
  }, [pathname]);

  // Se a escolha de cookies mudar em qualquer banner (landing ou perfil), o Google é avisado.
  useEffect(() => {
    const onChange = (e: Event) => setAnalyticsConsent((e as CustomEvent<CookiePrefs>).detail);
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChange);
  }, []);

  return null;
}
