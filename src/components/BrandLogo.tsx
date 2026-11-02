import { Link } from 'react-router-dom';

/**
 * Logo AirNext em duas versões, com a MESMA geometria (mesmo recorte e proporção):
 *  • on-light → "Air" PRETO  (use em fundos claros/brancos)
 *  • on-dark  → "Air" BRANCO (use em fundos escuros/pretos)
 * O "Next" e o ∞ seguem a cor da marca em ambas. Arquivos em /public.
 */
export const LOGO_ON_DARK = '/logo-airnext-on-dark.webp';
export const LOGO_ON_LIGHT = '/logo-airnext-on-light.webp';

const HEIGHT = { sm: 'h-6', md: 'h-7', lg: 'h-8' } as const;

interface BrandLogoProps {
  /** `true` quando o fundo é escuro → "Air" branco. */
  dark?: boolean;
  size?: keyof typeof HEIGHT;
  /** Rota interna (react-router). Sem `to`/`href`, renderiza só a imagem. */
  to?: string;
  /** Âncora comum (ex.: "#top"). */
  href?: string;
  className?: string;
}

export default function BrandLogo({ dark = false, size = 'md', to, href, className = '' }: BrandLogoProps) {
  const img = (
    <img
      src={dark ? LOGO_ON_DARK : LOGO_ON_LIGHT}
      alt="AirNext"
      width={884}
      height={367}
      decoding="async"
      draggable={false}
      className={`${HEIGHT[size]} w-auto select-none`}
    />
  );
  const cls = `inline-flex items-center transition-opacity hover:opacity-80 ${className}`;
  if (to) return <Link to={to} aria-label="AirNext — página inicial" className={cls}>{img}</Link>;
  if (href) return <a href={href} aria-label="AirNext" className={cls}>{img}</a>;
  return <span className={cls}>{img}</span>;
}
