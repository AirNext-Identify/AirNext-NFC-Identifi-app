import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface LogoProps {
  to?: string;
  dark?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Ativa o anel de brilho sincronizado com o mascote foguete (login/cadastro). */
  withTouchGlow?: boolean;
}

const SIZES = {
  xs: 'text-2xl',
  sm: 'text-3xl sm:text-4xl',
  md: 'text-4xl sm:text-5xl',
  lg: 'text-5xl sm:text-6xl',
  xl: 'text-6xl sm:text-7xl'
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
      {/* Anel de brilho: pulsa em sincronia com o foguete "encostando" na logo */}
      {withTouchGlow && (
        <>
          <span
            className="logo-touch-glow pointer-events-none absolute -inset-4 rounded-full blur-xl"
            style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.55), rgba(124,58,237,0.35), transparent 70%)' }}
          />
          <Sparkles className="logo-touch-spark absolute -top-2 -right-3 h-4 w-4 text-cyan-300 pointer-events-none" />
        </>
      )}
      {/* Onda de clique: expande e some a cada toque no logo */}
      {clicked && (
        <span
          key={Date.now()}
          className="logo-click-ring pointer-events-none absolute -inset-3 rounded-full"
          style={{ border: '2px solid rgba(96,165,250,0.6)' }}
        />
      )}
      <Link
        to={to}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={handleClick}
        className={`${SIZES[size]} relative select-none inline-flex leading-none transition-all duration-300 ${hover ? 'scale-110 drop-shadow-[0_0_18px_rgba(96,165,250,0.55)]' : ''} ${clicked ? 'logo-click-flash' : ''}`}
        style={{ fontFamily: "'Lobster', cursive" }}
      >
        <span className={dark ? 'text-zinc-900' : 'text-white'}>Air</span>
        <span
          className="bg-clip-text text-transparent transition-all duration-300"
          style={{ backgroundImage: (hover || clicked) ? 'linear-gradient(90deg, #60a5fa, #a855f7, #f59e0b)' : 'linear-gradient(90deg, #3b82f6, #3b82f6)' }}
        >
          Next
        </span>
        {(hover || clicked) && (
          <Sparkles className="absolute -top-3 -right-4 h-4 w-4 text-amber-300 animate-ping" />
        )}
      </Link>
    </span>
  );
}
