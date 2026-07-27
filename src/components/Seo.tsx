import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  DEFAULT_OG_IMAGE,
  TWITTER_HANDLE,
  absoluteUrl,
  fullTitle,
  resolveOgImage,
  type SeoProps,
} from '../config/seo';
import {
  buildFaqPageJsonLd,
  buildHowToJsonLd,
  buildProductJsonLd,
  buildSpeakableJsonLd,
  AIRNEXT_DEFINITION,
} from '../config/aiContent';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id: string, data: object) {
  if (typeof document === 'undefined') return;
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/**
 * Atualiza title, description, Open Graph, Twitter Card e JSON-LD.
 * Coloque em cada página relevante (ou use SeoManager global + overrides).
 */
export function Seo({
  title,
  description = SITE_DESCRIPTION,
  path,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  noIndex = false,
  keywords = SITE_KEYWORDS,
  profileName,
}: SeoProps) {
  const location = useLocation();
  const pagePath = path ?? location.pathname;
  const url = absoluteUrl(pagePath);
  const pageTitle = fullTitle(title);

  useEffect(() => {
    document.title = pageTitle;

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'keywords', keywords);
    upsertMeta('name', 'author', SITE_NAME);
    upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    upsertMeta('name', 'googlebot', noIndex ? 'noindex, nofollow' : 'index, follow');
    upsertMeta('name', 'theme-color', '#05070f');
    upsertMeta('name', 'color-scheme', 'dark light');

    // Open Graph — card elegante ao compartilhar (WhatsApp, LinkedIn, Facebook, Telegram…)
    const ogImage = resolveOgImage(image || DEFAULT_OG_IMAGE);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:locale', 'pt_BR');
    upsertMeta('property', 'og:type', type === 'profile' ? 'profile' : 'website');
    if (type === 'profile' && profileName) {
      upsertMeta('property', 'profile:username', profileName);
      upsertJsonLd('airnext-ld-profile', {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        name: pageTitle,
        url,
        description,
        mainEntity: {
          '@type': 'Person',
          name: profileName,
          image: resolveOgImage(image),
          description,
        },
      });
    }
    upsertMeta('property', 'og:title', pageTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', ogImage);
    upsertMeta('property', 'og:image:secure_url', ogImage);
    upsertMeta('property', 'og:image:type', ogImage.includes('.png') ? 'image/png' : 'image/jpeg');
    upsertMeta('property', 'og:image:width', '1200');
    upsertMeta('property', 'og:image:height', '630');
    upsertMeta('property', 'og:image:alt', pageTitle);
    // Fallback extra (alguns clientes leem itemprop)
    upsertMeta('name', 'image', ogImage);
    upsertLink('image_src', ogImage);

    // Twitter / X Card — preview grande
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', pageTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', ogImage);
    upsertMeta('name', 'twitter:image:alt', pageTitle);
    if (TWITTER_HANDLE) upsertMeta('name', 'twitter:site', TWITTER_HANDLE);

    upsertLink('canonical', url);

    upsertJsonLd('airnext-ld-org', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: absoluteUrl('/'),
      logo: absoluteUrl('/favicon.png'),
      description: SITE_DESCRIPTION,
      email: 'airnext.oficial@gmail.com',
      sameAs: [],
    });

    upsertJsonLd('airnext-ld-website', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: absoluteUrl('/'),
      description: SITE_DESCRIPTION,
      inLanguage: 'pt-BR',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${absoluteUrl('/')}?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    });

    // Schemas para AI Overviews / AI Mode (FAQ, HowTo, Product, Speakable)
    const isHome = pagePath === '/' || pagePath === '';
    if (isHome) {
      upsertJsonLd('airnext-ld-faq', buildFaqPageJsonLd());
      upsertJsonLd('airnext-ld-howto', buildHowToJsonLd());
      upsertJsonLd('airnext-ld-product', buildProductJsonLd());
      upsertJsonLd('airnext-ld-speakable', buildSpeakableJsonLd());
      // Reforça description com definição citável
      upsertMeta('name', 'description', description.includes('AirNext é') ? description : `${AIRNEXT_DEFINITION} ${description}`.slice(0, 320));
    }
  }, [pageTitle, description, url, image, type, noIndex, keywords, pagePath]);

  return null;
}

/**
 * Preferências do visitante: idioma, tema e locale do sistema.
 * Aplicadas no primeiro acesso e persistidas.
 */
const PREFS_KEY = 'airnext:visitor_prefs';

export type VisitorPrefs = {
  lang: string;
  colorScheme: 'dark' | 'light' | 'system';
  reducedMotion: boolean;
  timezone?: string;
  updatedAt: number;
};

export function readVisitorPrefs(): VisitorPrefs | null {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? (JSON.parse(raw) as VisitorPrefs) : null;
  } catch {
    return null;
  }
}

export function detectSystemPrefs(): Omit<VisitorPrefs, 'updatedAt'> {
  const lang =
    (typeof navigator !== 'undefined' && (navigator.languages?.[0] || navigator.language)) || 'pt-BR';
  let colorScheme: 'dark' | 'light' | 'system' = 'system';
  if (typeof window !== 'undefined' && window.matchMedia) {
    colorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  const reducedMotion =
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let timezone: string | undefined;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    /* ignore */
  }
  return { lang, colorScheme, reducedMotion, timezone };
}

export function applyVisitorPrefs() {
  if (typeof document === 'undefined') return;
  let prefs = readVisitorPrefs();
  if (!prefs) {
    const detected = detectSystemPrefs();
    prefs = { ...detected, updatedAt: Date.now() };
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }

  document.documentElement.lang = prefs.lang.startsWith('pt') ? 'pt-BR' : prefs.lang.split('-')[0] || 'pt-BR';
  document.documentElement.setAttribute('data-color-scheme', prefs.colorScheme);
  if (prefs.reducedMotion) {
    document.documentElement.setAttribute('data-reduced-motion', 'true');
  } else {
    document.documentElement.removeAttribute('data-reduced-motion');
  }

  // Meta de idioma / conteúdo preferido (sinais de relevância local)
  upsertMeta('name', 'language', document.documentElement.lang);
  // content-language
  let cl = document.head.querySelector('meta[http-equiv="content-language"]') as HTMLMetaElement | null;
  if (!cl) {
    cl = document.createElement('meta');
    cl.setAttribute('http-equiv', 'content-language');
    document.head.appendChild(cl);
  }
  cl.setAttribute('content', document.documentElement.lang);
}

/** Manager global: SEO padrão da rota + preferências do sistema no boot. */
export function SeoManager() {
  const location = useLocation();

  useEffect(() => {
    applyVisitorPrefs();
  }, []);

  // SEO padrão por rota (páginas específicas podem sobrescrever com <Seo />)
  const routeSeo = routeDefaults(location.pathname);

  return <Seo {...routeSeo} path={location.pathname} />;
}

function routeDefaults(pathname: string): SeoProps {
  if (pathname === '/' || pathname === '') {
    return {
      title: `${SITE_NAME} — Cartões NFC e Perfis Digitais`,
      description:
        'AirNext é uma plataforma de cartões, tags e pulseiras NFC que abrem um perfil digital com um toque, sem instalar app. Ideal para networking, pet, kids, TEA e negócios.',
    };
  }
  if (pathname.startsWith('/login')) {
    return { title: 'Entrar', description: 'Acesse sua conta AirNext.', noIndex: true };
  }
  if (pathname.startsWith('/register')) {
    return { title: 'Criar conta', description: 'Cadastre-se na AirNext e ative seu perfil digital NFC.', noIndex: true };
  }
  if (pathname.startsWith('/ativar')) {
    return { title: 'Ativar produto', description: 'Ative seu cartão, tag ou pulseira AirNext.', noIndex: true };
  }
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/onboarding')) {
    return { title: 'Painel', noIndex: true };
  }
  if (pathname.startsWith('/politica-de-privacidade')) {
    return { title: 'Política de Privacidade', description: 'Como a AirNext trata e protege seus dados pessoais (LGPD).' };
  }
  if (pathname.startsWith('/termos-de-uso')) {
    return { title: 'Termos de Uso', description: 'Condições de uso da plataforma e dos produtos AirNext.' };
  }
  if (pathname.startsWith('/politica-de-cookies')) {
    return { title: 'Política de Cookies', description: 'Transparência sobre cookies e tecnologias semelhantes na AirNext.' };
  }
  if (pathname.startsWith('/suporte')) {
    return {
      title: 'Suporte e tutoriais',
      description: 'Vídeos tutoriais AirNext: ativação, NFC, perfil, pet, TEA e privacidade.',
    };
  }
  if (pathname.startsWith('/u/') || pathname.startsWith('/p/')) {
    return {
      title: 'Perfil AirNext',
      description: 'Perfil digital AirNext — contatos e informações em um toque.',
      type: 'profile',
    };
  }
  return { title: SITE_NAME, description: SITE_DESCRIPTION };
}
