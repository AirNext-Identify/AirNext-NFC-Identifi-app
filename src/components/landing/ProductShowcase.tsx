import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { Link } from 'react-router-dom';

import { shortName, type ShowcaseProduct } from '../../lib/productShowcase';

interface Props {
  products: ShowcaseProduct[];
  getImage: (p: ShowcaseProduct) => string;
  onBuy: (p: ShowcaseProduct) => void;
}

/**
 * Vitrine estilo apple.com: carrossel horizontal (arrastar/deslizar) sobre fundo branco.
 * Cada cartão é preto e tem o nome do produto, a foto, uma descrição
 * curta e dois botões — "Saiba mais" e "Comprar". O próximo cartão aparece "espiando".
 */
export default function ProductShowcase({ products, getImage, onBuy }: Props) {
  return (
    <div className="max-w-[1400px] mx-auto pl-4 md:pl-6">
      <style>{`
        .tile-d{--bg:#000;--fg:#f5f5f7;--sub:rgba(245,245,247,.8);--accent:#2997ff}
      `}</style>
      <Swiper
        modules={[Pagination]}
        pagination={{ clickable: true }}
        spaceBetween={12}
        slidesPerView={1.12}
        breakpoints={{
          768: { slidesPerView: 2.15, spaceBetween: 16 },
          1280: { slidesPerView: 3.1, spaceBetween: 20 },
        }}
        className="w-full"
      >
        {products.map((p) => (
          <SwiperSlide key={p.id} className="!h-auto">
            <article
              className={`tile-d relative h-full flex flex-col items-center text-center overflow-hidden rounded-[28px] md:rounded-[32px] bg-[var(--bg)] text-[var(--fg)] pt-9 md:pt-12 pb-9 md:pb-12`}
            >
              <h3 className="flex items-baseline justify-center gap-2 px-6">
                <span className="font-lobster text-3xl leading-none">
                  Air<span className="text-[#0071e3]">Next</span>
                </span>
                <span className="text-xl md:text-2xl font-bold uppercase tracking-tight">{shortName(p.name)}</span>
              </h3>

              <div className="relative w-full mt-5 aspect-[4/3] overflow-hidden">
                <img
                  src={getImage(p)}
                  alt={p.name}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="w-full h-full object-cover"
                />
              </div>

              <p className="mt-2 px-7 max-w-sm text-[18px] md:text-xl leading-snug font-medium text-[var(--sub)]">
                {p.desc}
              </p>

              <div className="mt-auto pt-7 flex items-center justify-center gap-3">
                <Link
                  to={`/produto/${p.id}`}
                  className="px-6 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[15px] font-medium transition"
                >
                  Saiba mais
                </Link>
                <button
                  type="button"
                  onClick={() => onBuy(p)}
                  className="px-6 py-2.5 rounded-full border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/10 text-[15px] font-medium transition"
                >
                  Comprar
                </button>
              </div>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
