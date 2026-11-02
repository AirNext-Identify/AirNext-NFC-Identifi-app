/** Bandeirinhas de pagamento (desenhos simples em SVG, sem imagens externas). */
const box = 'h-[26px] w-[40px] shrink-0 rounded-[6px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)] ring-1 ring-black/10';

function Visa() {
  return (
    <svg viewBox="0 0 40 26" className={box} role="img" aria-label="Visa">
      <text x="20" y="18" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontStyle="italic" fontSize="12.5" fill="#1a1f71">VISA</text>
    </svg>
  );
}
function Mastercard() {
  return (
    <svg viewBox="0 0 40 26" className={box} role="img" aria-label="Mastercard">
      <circle cx="16" cy="13" r="7" fill="#eb001b" />
      <circle cx="24" cy="13" r="7" fill="#f79e1b" />
      <path d="M20 7.6a7 7 0 0 1 0 10.8 7 7 0 0 1 0-10.8z" fill="#ff5f00" />
    </svg>
  );
}
function Elo() {
  return (
    <svg viewBox="0 0 40 26" className={box} role="img" aria-label="Elo">
      <rect width="40" height="26" rx="5" fill="#111" />
      <text x="20" y="17.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="13" fill="#fff">elo</text>
      <circle cx="33" cy="8" r="2" fill="#ffcb05" />
    </svg>
  );
}
function Binance() {
  const d = (x: number, y: number) => <rect key={`${x}-${y}`} x={x - 2.2} y={y - 2.2} width="4.4" height="4.4" transform={`rotate(45 ${x} ${y})`} fill="#f3ba2f" />;
  return (
    <svg viewBox="0 0 40 26" className={box} role="img" aria-label="Binance">
      <rect width="40" height="26" rx="6" fill="#181a20" />
      {[d(20, 6.5), d(13, 13), d(20, 13), d(27, 13), d(20, 19.5)]}
    </svg>
  );
}
/** Símbolo do Pix (losango em quatro partes), na cor da marca; use `color` para outra cor. */
export function PixIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2.6l3.1 3.1a1.6 1.6 0 0 0 1.1.5h.9L12 11.3 6.9 6.2h.9a1.6 1.6 0 0 0 1.1-.5L12 2.6z" fill={color} />
      <path d="M12 21.4l-3.1-3.1a1.6 1.6 0 0 0-1.1-.5h-.9L12 12.7l5.1 5.1h-.9a1.6 1.6 0 0 0-1.1.5L12 21.4z" fill={color} />
      <path d="M2.6 12l3.1-3.1c.3-.3.5-.7.5-1.1v-.9L11.3 12l-5.1 5.1v-.9c0-.4-.2-.8-.5-1.1L2.6 12z" fill={color} />
      <path d="M21.4 12l-3.1 3.1c-.3.3-.5.7-.5 1.1v.9L12.7 12l5.1-5.1v.9c0 .4.2.8.5 1.1l3.1 3.1z" fill={color} />
    </svg>
  );
}
function Pix() {
  return (
    <svg viewBox="0 0 40 26" className={box} role="img" aria-label="Pix">
      <rect width="40" height="26" rx="6" fill="#32bcad" />
      <g transform="translate(4 4)"><PixIcon size={18} color="#fff" /></g>
      <text x="27" y="17" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="9.5" fill="#fff">pix</text>
    </svg>
  );
}

export function PaymentBadges({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`} aria-label="Formas de pagamento: Pix, Visa, Mastercard, Elo e Binance">
      <Pix /><Visa /><Mastercard /><Elo /><Binance />
    </div>
  );
}
