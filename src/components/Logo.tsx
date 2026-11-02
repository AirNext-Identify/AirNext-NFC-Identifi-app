import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { LOGO_ON_DARK_IMG, LOGO_ON_LIGHT_IMG } from '../lib/productImages';

interface LogoProps {
  to?: string;
  dark?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Ativa o anel de brilho sincronizado com o mascote foguete (login/cadastro). */
  withTouchGlow?: boolean;
}

// Logo em imagem (proporção 3:1.25). Alturas reduzidas em relação à versão em texto.
const SIZES = {
  xs: 'h-5',
  sm: 'h-6 sm:h-7',
  md: 'h-7 sm:h-8',
  lg: 'h-9 sm:h-11',
  xl: 'h-12 sm:h-14'
};

export default function Logo({ to = '/dashboard', dark = false, size = 'sm', withTouchGlow = false }: LogoProps) {
  const [hover, setHover] = useState(false);
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    window.setTimeout(() => setClicked(false), 650);
  };

  return (
    <span className="relative inline-flex items-center justify-center">
      {withTouchGlow && (
        <>
          <span
            className="logo-touch-glow pointer-events-none absolute -inset-4 rounded-full blur-xl"
            style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.55), rgba(124,58,237,0.35), transparent 70%)' }}
          />
          <Sparkles className="logo-touch-spark absolute -top-2 -right-3 h-4 w-4 text-cyan-300 pointer-events-none" />
        </>
      )}
      {clicked && (
        <span
          key={Date.now()}
          className="logo-click-ring pointer-events-none absolute -inset-3 rounded-full"
          style={{ border: '2px solid rgba(96,165,250,0.6)' }}
        />
      )}
      <Link
        to={to}
        aria-label="AirNext"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={handleClick}
        className={`relative select-none inline-flex items-center leading-none transition-transform duration-300 ${hover ? 'scale-105' : ''} ${clicked ? 'logo-click-flash' : ''}`}
      >
        <img
          src={dark ? LOGO_ON_LIGHT_IMG : LOGO_ON_DARK_IMG}
          alt="AirNext"
          width={375}
          height={157}
          decoding="async"
          draggable={false}
          className={`${SIZES[size]} w-auto`}
        />
      </Link>
    </span>
  );
}
