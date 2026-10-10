import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { fmtPrice, priceLabel } from '../../lib/price';

export interface ProductCardData {
  id: string;
  name: string;
  tag: string;
  desc: string;
  price: number;
  oldPrice?: number;
  badge?: string;
  combo?: boolean;
  gallery?: string[];
}

interface Props {
  product: ProductCardData;
  isDark: boolean;
  imgSrc: string;
  imgLoading?: boolean;
  /** Selo fixo exibido no card (ex.: "Novo" na segunda fileira) */
  badgeLabel?: string;
  onOpen: () => void;
  onAdd: () => void;
  onPersonalize: () => void;
}

/** Fotos em rotação suave (cards com galeria). */
export function ProductImageCycle({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (images.length < 2) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI(v => (v + 1) % images.length), 3200);
    return () => clearInterval(t);
  }, [images.length]);
  return (
    <>
      {images.map((src, idx) => (
        <img
          key={src}
          src={src}
          alt={idx === i ? alt : ''}
          loading={idx === 0 ? 'eager' : 'lazy'}
          decoding="async"
          className={`absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-all duration-700 ease-out ${idx === i ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {images.map((_, idx) => (
          <span key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${idx === i ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
        ))}
      </div>
    </>
  );
}

/**
 * Card único da vitrine — usado nas DUAS fileiras de produtos para garantir
 * o mesmo espaçamento, altura (esticada pelo Swiper, sem altura fixa), efeitos
 * de hover e hierarquia tipográfica.
 */
export default function ProductCard({ product: p, isDark, imgSrc, imgLoading, badgeLabel, onOpen, onAdd, onPersonalize }: Props) {
  const onRequest = p.price === 0;
  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalhes de ${p.name}`}
      className="group cursor-pointer h-full flex flex-col outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] focus-visible:ring-offset-4 rounded-[18px] sm:rounded-[22px] lg:rounded-[28px] focus-visible:ring-offset-transparent"
    >
      {/* Imagem */}
      <div
        className={`aspect-square rounded-[18px] sm:rounded-[22px] lg:rounded-[28px] overflow-hidden mb-2.5 lg:mb-5 relative ring-1 transition-shadow duration-500 ${
          isDark
            ? 'bg-[#111] ring-white/5 group-hover:shadow-2xl group-hover:shadow-black/70'
            : 'bg-white ring-black/[0.05] group-hover:shadow-2xl group-hover:shadow-black/10'
        }`}
      >
        {p.gallery ? (
          <ProductImageCycle images={p.gallery} alt={p.name} />
        ) : imgLoading ? (
          <div className="w-full h-full bg-white/5 animate-pulse" />
        ) : (
          <img
            src={imgSrc}
            alt={p.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
          />
        )}

        {(badgeLabel ?? p.badge) && (
          <span className="absolute top-2 left-2 lg:top-3.5 lg:left-3.5 text-[9px] sm:text-[10px] font-bold px-2 lg:px-2.5 py-0.5 lg:py-1 rounded-full bg-gray-900/90 text-white backdrop-blur-md">
            {badgeLabel ?? p.badge}
          </span>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onAdd(); }}
          aria-label={`Adicionar ${p.name} à sacola`}
          className={`absolute top-2 right-2 w-8 h-8 lg:top-3.5 lg:right-3.5 lg:w-9 lg:h-9 rounded-full flex items-center justify-center backdrop-blur-md transition active:scale-90 hover:scale-110 ${
            isDark ? 'bg-black/50 text-white hover:bg-black/70' : 'bg-white/90 text-gray-900 hover:bg-white shadow-md'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 lg:w-[15px] lg:h-[15px]" />
        </button>
      </div>

      {/* Texto */}
      <div className="flex flex-col flex-1">
        <span className={`hidden lg:block text-[11px] font-medium mb-1 truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{p.tag}</span>
        <h3 className={`text-[13px] sm:text-[14px] lg:text-[17px] font-semibold mb-1 lg:mb-1.5 leading-tight lg:leading-snug tracking-tight line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.name}</h3>
        <p className="hidden lg:block text-[13px] text-gray-500 leading-relaxed mb-4 line-clamp-2">{p.desc}</p>

        <div className="mt-auto flex items-center justify-between gap-3">
          <p className={`text-[13.5px] sm:text-[14.5px] lg:text-[15px] font-semibold whitespace-nowrap ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {priceLabel(p.price)}
            {p.oldPrice ? (
              <span className={`hidden lg:inline ml-2 text-[12px] font-medium line-through ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>R$ {fmtPrice(p.oldPrice)}</span>
            ) : null}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); if (p.combo) onAdd(); else onPersonalize(); }}
            className={`hidden lg:inline-flex items-center gap-1 text-[12px] font-semibold whitespace-nowrap transition-colors ${
              isDark ? 'text-white hover:text-[#4da3ff]' : 'text-gray-900 hover:text-[#0071e3]'
            }`}
          >
            {p.combo ? 'Quero o combo' : 'Personalizar'}
            <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
