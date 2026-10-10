import { motion } from 'framer-motion';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { fmtPrice } from '../../lib/price';

export interface ProductCardData {
  id: string;
  name: string;
  tag: string;
  desc: string;
  price: number;
  combo?: boolean;
}

interface Props {
  product: ProductCardData;
  isDark: boolean;
  imgSrc: string;
  imgLoading?: boolean;
  /** Selo "Novo" (usado na segunda fileira, como no original) */
  badge?: boolean;
  onOpen: () => void;
  onAdd: () => void;
  onPersonalize: () => void;
}

/**
 * Card da vitrine.
 * - Desktop (lg ≥ 1024px): idêntico ao card original (420px, tag, descrição, "Personalizar").
 * - Telas menores: versão compacta (foto + nome + preço) para caber VÁRIOS produtos
 *   de uma vez na fileira, sem altura fixa e sem espaço vazio.
 */
export default function ProductCard({ product: p, isDark, imgSrc, imgLoading, badge, onOpen, onAdd, onPersonalize }: Props) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={onOpen}
      className="group cursor-pointer h-auto lg:h-[420px] flex flex-col"
    >
      {/* Imagem */}
      <div className={`aspect-square rounded-[18px] sm:rounded-[22px] lg:rounded-[28px] overflow-hidden mb-2.5 lg:mb-5 relative ${isDark ? 'bg-[#111]' : 'bg-white'}`}>
        {imgLoading ? (
          <div className="w-full h-full bg-white/5 animate-pulse" />
        ) : (
          <img src={imgSrc} alt={p.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out" />
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onAdd(); }}
          aria-label={`Adicionar ${p.name} à sacola`}
          className={`absolute top-2 right-2 w-7 h-7 lg:top-3.5 lg:right-3.5 lg:w-9 lg:h-9 rounded-full flex items-center justify-center backdrop-blur-md transition ${
            isDark ? 'bg-black/50 text-white hover:bg-black/70' : 'bg-white/90 text-gray-900 hover:bg-white shadow-md'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 lg:w-[15px] lg:h-[15px]" />
        </button>

        {badge && (
          <span className={`hidden sm:block absolute top-2.5 left-2.5 lg:top-3.5 lg:left-3.5 text-[9px] lg:text-[10px] font-bold px-2 lg:px-2.5 py-0.5 lg:py-1 rounded-full ${isDark ? 'bg-white/10 text-white' : 'bg-gray-900/90 text-white'}`}>
            Novo
          </span>
        )}
      </div>

      {/* Texto */}
      <div className="flex flex-col flex-1">
        <span className={`hidden lg:block text-[11px] font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{p.tag}</span>
        <h3 className={`text-[12px] sm:text-[13px] lg:text-[17px] font-semibold mb-1 lg:mb-1.5 leading-tight lg:leading-snug tracking-tight line-clamp-2 lg:line-clamp-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.name}</h3>
        <p className="hidden lg:block text-[13px] text-gray-500 leading-relaxed mb-4 line-clamp-1">{p.desc}</p>

        <div className="mt-auto flex items-center justify-between gap-3">
          <p className={`text-[12.5px] sm:text-[14px] lg:text-[15px] font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>R$ {fmtPrice(p.price)}</p>
          <button
            onClick={(e) => { e.stopPropagation(); if (p.combo) onAdd(); else onPersonalize(); }}
            className={`hidden lg:inline-flex items-center gap-1.5 text-[12px] font-semibold transition-colors ${
              isDark ? 'text-white hover:text-[#4da3ff]' : 'text-gray-900 hover:text-[#0071e3]'
            }`}
          >
            {p.combo ? 'Quero o combo' : 'Personalizar'} <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
