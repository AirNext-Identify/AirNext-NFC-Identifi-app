import { Link } from 'react-router-dom';
import { ShieldCheck, KeyRound, LifeBuoy } from 'lucide-react';
import Logo from '../Logo';

/**
 * Moldura das telas de acesso (login, cadastro): fundo preto, brilho azul no topo,
 * card de vidro escuro, texto branco e botões azuis — visual Apple.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  maxWidth = 'max-w-md',
  showForgot = true,
  showSupport = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
  /** Botão "Esqueci minha senha" abaixo do card (login e cadastro). */
  showForgot?: boolean;
  /** Botão "Suporte" abaixo do card. */
  showSupport?: boolean;
}) {
  return (
    <div className="min-h-screen apple-bg flex items-start sm:items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="apple-glow" aria-hidden />
      <div className={`relative w-full ${maxWidth}`}>
        <div className="text-center mb-8 fade-up">
          <div className="inline-block mb-6"><Logo to="/" size="lg" withTouchGlow /></div>
          <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-[15px] text-[#a1a1a6]">{subtitle}</p>}
        </div>
        <div className="auth-card slide-up p-6 sm:p-8">{children}</div>
        {(showForgot || showSupport) && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            {showForgot && (
              <Link to="/recuperar-senha" className={`auth-help-btn ${showSupport ? '' : 'col-span-2'}`}>
                <KeyRound className="h-4 w-4" /> Esqueci a senha
              </Link>
            )}
            {showSupport && (
              <Link to="/suporte" className={`auth-help-btn ${showForgot ? '' : 'col-span-2'}`}>
                <LifeBuoy className="h-4 w-4" /> Suporte
              </Link>
            )}
          </div>
        )}
        <p className="mt-7 flex flex-col items-center gap-2 text-[11px] text-[#636366]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Conexão segura e criptografada
          </span>
          <span className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link to="/politica-de-privacidade" className="hover:text-white transition-colors">Privacidade</Link>
            <Link to="/termos-de-uso" className="hover:text-white transition-colors">Termos</Link>
            <Link to="/politica-de-cookies" className="hover:text-white transition-colors">Cookies</Link>
          </span>
        </p>
      </div>
    </div>
  );
}

export function AuthDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="h-px flex-1 bg-white/10" />
      <span className="text-[11px] font-medium uppercase tracking-wider text-[#636366]">{children}</span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}

export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="rounded-2xl bg-[#ff453a]/10 border border-[#ff453a]/25 px-4 py-3 text-sm text-[#ff6961]">
      {children}
    </div>
  );
}
