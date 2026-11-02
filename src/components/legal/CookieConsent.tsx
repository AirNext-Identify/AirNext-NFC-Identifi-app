import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Languages } from 'lucide-react';
import {
  OPEN_COOKIE_SETTINGS_EVENT, readCookieConsent, writeCookieConsent, type CookiePrefs,
} from '@/lib/cookieConsent';

type Lang = 'pt' | 'en' | 'es' | 'fr';

const LANGS: { id: Lang; label: string }[] = [
  { id: 'pt', label: 'Português (Brasil)' },
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
  { id: 'fr', label: 'Français' },
];

const T: Record<Lang, Record<string, string>> = {
  pt: {
    title: 'Valorizamos sua privacidade',
    desc: 'Usamos cookies para o perfil funcionar e, com sua permissão, entender o uso e melhorar a experiência.',
    policy: 'Política de cookies',
    accept: 'Aceitar tudo', reject: 'Rejeitar tudo', customize: 'Personalizar',
    save: 'Salvar', back: 'Voltar',
    essential: 'Essenciais', essentialD: 'Fazem o perfil funcionar. Sempre ativos.',
    analytics: 'Análise', analyticsD: 'Entendem como o perfil é usado.',
    marketing: 'Marketing', marketingD: 'Medem campanhas e personalizam anúncios.',
    language: 'Idioma',
  },
  en: {
    title: 'We value your privacy',
    desc: 'We use cookies to make this profile work and, with your permission, to understand usage and improve the experience.',
    policy: 'Cookie policy',
    accept: 'Accept all', reject: 'Reject all', customize: 'Customize',
    save: 'Save', back: 'Back',
    essential: 'Essential', essentialD: 'Make the profile work. Always on.',
    analytics: 'Analytics', analyticsD: 'Help us understand how the profile is used.',
    marketing: 'Marketing', marketingD: 'Measure campaigns and personalize ads.',
    language: 'Language',
  },
  es: {
    title: 'Valoramos tu privacidad',
    desc: 'Usamos cookies para que el perfil funcione y, con tu permiso, entender el uso y mejorar la experiencia.',
    policy: 'Política de cookies',
    accept: 'Aceptar todo', reject: 'Rechazar todo', customize: 'Personalizar',
    save: 'Guardar', back: 'Volver',
    essential: 'Esenciales', essentialD: 'Hacen que el perfil funcione. Siempre activas.',
    analytics: 'Análisis', analyticsD: 'Ayudan a entender cómo se usa el perfil.',
    marketing: 'Marketing', marketingD: 'Miden campañas y personalizan anuncios.',
    language: 'Idioma',
  },
  fr: {
    title: 'Nous respectons votre vie privée',
    desc: 'Nous utilisons des cookies pour faire fonctionner ce profil et, avec votre accord, comprendre l’usage et améliorer l’expérience.',
    policy: 'Politique de cookies',
    accept: 'Tout accepter', reject: 'Tout refuser', customize: 'Personnaliser',
    save: 'Enregistrer', back: 'Retour',
    essential: 'Essentiels', essentialD: 'Font fonctionner le profil. Toujours actifs.',
    analytics: 'Analyse', analyticsD: 'Aident à comprendre l’usage du profil.',
    marketing: 'Marketing', marketingD: 'Mesurent les campagnes et personnalisent les annonces.',
    language: 'Langue',
  },
};

const LANG_KEY = 'airnext_cookie_lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY) as Lang | null;
    if (saved && saved in T) return saved;
  } catch { /* ignora */ }
  const nav = (navigator.language || 'pt').slice(0, 2).toLowerCase();
  return (nav in T ? nav : 'pt') as Lang;
}

/**
 * Banner de cookies compacto (LGPD) para os perfis públicos, com seletor de idioma.
 * Visual neutro e fixo (não herda o tema do perfil): Aceitar, Rejeitar ou Personalizar.
 */
export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [lang, setLang] = useState<Lang>(initialLang);
  const [prefs, setPrefs] = useState<CookiePrefs>({ analytics: false, marketing: false });
  const t = T[lang];

  useEffect(() => {
    const saved = readCookieConsent();
    if (saved) { setPrefs(saved); return; }
    const id = window.setTimeout(() => setOpen(true), 700);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const reopen = () => { setPrefs(readCookieConsent() ?? { analytics: false, marketing: false }); setCustom(true); setOpen(true); };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  const changeLang = (l: Lang) => {
    setLang(l);
    try { localStorage.setItem(LANG_KEY, l); } catch { /* ignora */ }
  };

  const save = (next: CookiePrefs) => {
    writeCookieConsent(next);
    setPrefs(next);
    setOpen(false);
    setCustom(false);
  };

  const pill =
    'flex h-10 flex-1 items-center justify-center rounded-full border-[1.5px] border-neutral-900 bg-white px-2 text-center text-[13px] font-bold leading-none text-neutral-900 transition active:scale-[0.97] hover:bg-neutral-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-title"
          aria-describedby="cookie-desc"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          className="fixed inset-x-0 bottom-0 z-[200] mx-auto w-full max-w-[460px] rounded-t-2xl bg-white px-4 pt-3.5 text-neutral-900 shadow-[0_-8px_32px_rgba(0,0,0,0.25)] sm:bottom-3 sm:rounded-2xl"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="cookie-title" className="text-[15px] font-bold tracking-tight">{t.title}</h2>
            <label className="relative flex shrink-0 items-center gap-1 text-xs text-neutral-700">
              <Languages className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">{t.language}</span>
              <select
                value={lang}
                onChange={e => changeLang(e.target.value as Lang)}
                className="cursor-pointer appearance-none bg-transparent py-1 pr-4 text-xs font-medium outline-none focus-visible:underline"
              >
                {LANGS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 h-3 w-3" aria-hidden />
            </label>
          </div>

          <p id="cookie-desc" className="mt-1.5 text-[13px] leading-snug text-neutral-700">
            {t.desc}{' '}
            <a href="/politica-de-cookies" target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-neutral-900 underline underline-offset-2 hover:opacity-70">
              {t.policy}
            </a>
          </p>

          {custom ? (
            <div className="mt-2.5">
              <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200">
                {(['essential', 'analytics', 'marketing'] as const).map(k => {
                  const locked = k === 'essential';
                  const on = locked || prefs[k];
                  return (
                    <li key={k} className="flex items-center gap-3 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold leading-tight">{t[k]}</p>
                        <p className="text-xs leading-tight text-neutral-600">{t[`${k}D`]}</p>
                      </div>
                      <button
                        type="button" role="switch" aria-checked={on} aria-label={t[k]} disabled={locked}
                        onClick={() => !locked && setPrefs(p => ({ ...p, [k]: !p[k] }))}
                        className={`flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition ${on ? 'justify-end bg-neutral-900' : 'justify-start bg-neutral-300'} ${locked ? 'opacity-50' : ''}`}
                      >
                        <span className="h-4 w-4 rounded-full bg-white shadow" />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-2.5 flex gap-2">
                <button type="button" onClick={() => setCustom(false)} className={pill}>{t.back}</button>
                <button type="button" onClick={() => save(prefs)} className={`${pill} !bg-neutral-900 !text-white hover:!bg-neutral-700`}>{t.save}</button>
              </div>
            </div>
          ) : (
            <div className="mt-2.5 flex gap-2">
              <button type="button" onClick={() => save({ analytics: true, marketing: true })} className={pill}>{t.accept}</button>
              <button type="button" onClick={() => save({ analytics: false, marketing: false })} className={pill}>{t.reject}</button>
              <button type="button" onClick={() => setCustom(true)} className={pill}>{t.customize}</button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
