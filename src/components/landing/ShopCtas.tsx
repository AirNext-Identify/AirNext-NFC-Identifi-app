import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, ShoppingBag } from 'lucide-react';

interface ShopCtasProps {
  isDark: boolean;
  /** Âncora da seção para "Descobrir mais" (ex.: "#mais-produtos"). */
  discoverHref: string;
  onDiscover: (e: React.MouseEvent, href: string) => void;
  className?: string;
}

/**
 * Par de botões no estilo Apple para fechar as seções de produtos:
 * "Ir para a loja" (principal) e "Descobrir mais" (secundário, vidro/contorno).
 * No celular ficam empilhados e ocupam a largura toda (alvo de toque de 48px).
 */
export default function ShopCtas({ isDark, discoverHref, onDiscover, className = '' }: ShopCtasProps) {
  return (
    <div className={`mt-12 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4 ${className}`}>
      <Link
        to="/loja"
        className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-[#0071e3] px-8 text-[15px] font-semibold tracking-tight text-white shadow-[0_10px_24px_-10px_rgba(0,113,227,0.85)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#0077ed] hover:shadow-[0_14px_28px_-10px_rgba(0,113,227,0.9)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] active:translate-y-0 active:scale-[0.97] sm:min-w-[184px]"
      >
        <ShoppingBag size={17} aria-hidden="true" />
        Ir para a loja
        <ArrowRight size={16} aria-hidden="true" className="-ml-1 w-0 opacity-0 transition-all duration-200 group-hover:ml-0 group-hover:w-4 group-hover:opacity-100" />
      </Link>

      <a
        href={discoverHref}
        onClick={(e) => onDiscover(e, discoverHref)}
        className={`group inline-flex h-12 items-center justify-center gap-1 rounded-full px-8 text-[15px] font-semibold tracking-tight backdrop-blur-md transition duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] active:translate-y-0 active:scale-[0.97] sm:min-w-[184px] ${
          isDark
            ? 'bg-white/[0.06] text-white ring-1 ring-inset ring-white/20 hover:bg-white/[0.12]'
            : 'bg-white/70 text-[#0066cc] ring-1 ring-inset ring-black/10 hover:bg-white hover:ring-[#0071e3]/40'
        }`}
      >
        Descobrir mais
        <ChevronRight size={17} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5" />
      </a>
    </div>
  );
}
