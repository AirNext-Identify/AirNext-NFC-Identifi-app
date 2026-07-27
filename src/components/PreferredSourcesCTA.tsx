import { GOOGLE_PREFERRED_SOURCES_URL, SITE_NAME } from '../config/seo';

type Variant = 'button' | 'pill' | 'link' | 'banner' | 'footer';

type Props = {
  variant?: Variant;
  className?: string;
  /** Texto customizado (PT-BR por padrão) */
  label?: string;
  dark?: boolean;
};

/**
 * CTA oficial Google Preferred Sources.
 * Leva o usuário a: https://google.com/preferences/source?q=<SITE_URL>
 * Documentação: https://developers.google.com/search/docs/appearance/preferred-sources
 */
export function PreferredSourcesCTA({
  variant = 'button',
  className = '',
  label,
  dark = true,
}: Props) {
  const text = label || `Preferir ${SITE_NAME} no Google`;
  const href = GOOGLE_PREFERRED_SOURCES_URL;

  const baseLink =
    'inline-flex items-center justify-center gap-2 font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]/50';

  if (variant === 'link') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseLink} text-sm underline-offset-4 hover:underline ${dark ? 'text-[#8ab4f8]' : 'text-[#1a73e8]'} ${className}`}
      >
        <GoogleG className="h-4 w-4" />
        {text}
      </a>
    );
  }

  if (variant === 'pill' || variant === 'footer') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title="Adicionar AirNext como fonte preferida no Google (Top Stories, AI Mode e AI Overviews)"
        className={`${baseLink} rounded-full px-4 py-2 text-xs border ${
          dark
            ? 'bg-white/[0.06] border-white/12 text-white hover:bg-white/10'
            : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50 shadow-sm'
        } ${className}`}
      >
        <GoogleG className="h-3.5 w-3.5" />
        {text}
      </a>
    );
  }

  if (variant === 'banner') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-2xl border p-4 sm:p-5 transition-all ${
          dark
            ? 'bg-gradient-to-r from-[#0b1a33] to-[#0a0f1a] border-white/10 hover:border-[#4285F4]/40'
            : 'bg-gradient-to-r from-blue-50 to-white border-blue-100 hover:border-blue-200'
        } ${className}`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              dark ? 'bg-white/10' : 'bg-white shadow-sm border border-gray-100'
            }`}
          >
            <GoogleG className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>
              Preferir {SITE_NAME} no Google
            </p>
            <p className={`text-xs mt-0.5 leading-relaxed ${dark ? 'text-zinc-400' : 'text-gray-500'}`}>
              Priorize a AirNext nas respostas de IA, AI Overviews e Top Stories do Google.
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold ${
            dark
              ? 'bg-[#4285F4] text-white group-hover:bg-[#5a95f5]'
              : 'bg-[#1a73e8] text-white group-hover:bg-[#1765cc]'
          }`}
        >
          Adicionar fonte
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="M7 17L17 7M17 7H7M17 7v10" />
          </svg>
        </span>
      </a>
    );
  }

  // button default
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseLink} rounded-full px-5 py-2.5 text-sm border ${
        dark
          ? 'bg-[#4285F4] border-transparent text-white hover:bg-[#5a95f5] shadow-lg shadow-blue-500/20'
          : 'bg-[#1a73e8] border-transparent text-white hover:bg-[#1765cc] shadow-md'
      } ${className}`}
    >
      <GoogleG className="h-4 w-4" />
      {text}
    </a>
  );
}

/** “G” multicolorido estilo Google (não é o logo oficial completo — só a letra). */
function GoogleG({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default PreferredSourcesCTA;
