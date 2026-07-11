import { Loader2 } from 'lucide-react';

/** Logo "G" oficial do Google em 4 cores (SVG vetorial, sem dependências). */
function GoogleGlyph({ className = 'h-4.5 w-4.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20.4H24v7.2h11.3C33.7 32 29.3 34.9 24 34.9c-6.1 0-11.1-5-11.1-11.1S17.9 12.7 24 12.7c2.8 0 5.4 1.1 7.4 2.8l5.1-5.1C33.3 7.4 28.9 5.6 24 5.6 13.8 5.6 5.6 13.8 5.6 24S13.8 42.4 24 42.4c9.4 0 17.9-6.9 17.9-19 0-1-.1-2.5-.3-2.9z" />
      <path fill="#FF3D00" d="M8.4 14.6l5.9 4.3C15.9 15.3 19.6 12.7 24 12.7c2.8 0 5.4 1.1 7.4 2.8l5.1-5.1C33.3 7.4 28.9 5.6 24 5.6c-6.9 0-12.8 3.9-15.6 9z" />
      <path fill="#4CAF50" d="M24 42.4c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-1.9 1.4-4.4 2.3-7.2 2.3-5.2 0-9.7-3.5-11.3-8.3l-6 4.6c2.8 5.7 8.7 11.8 17.3 11.8z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C40.8 35.6 43.9 30.5 43.9 24c0-1-.1-2.5-.3-3.5z" />
    </svg>
  );
}

export default function GoogleButton({
  onClick,
  busy,
  label = 'Continuar com o Google',
}: {
  onClick: () => void;
  busy?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-800 font-semibold py-3.5 rounded-xl transition-all disabled:opacity-60 text-sm shadow-sm hover:shadow-md border border-black/5 hover:scale-[1.01] active:scale-[0.99]"
    >
      {busy ? <Loader2 className="h-4.5 w-4.5 animate-spin text-zinc-500" /> : <GoogleGlyph />}
      {busy ? 'Conectando...' : label}
    </button>
  );
}
