import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { AnimatePresence } from 'framer-motion';
import { Nfc, ZoomIn } from 'lucide-react';
import ImageLightbox from './ImageLightbox';

interface Props {
  images: string[];
  name: string;
  isDark: boolean;
}

/**
 * Topo do modal para produtos com várias fotos / combo: mesma altura do topo
 * dos demais produtos, fotos lado a lado (várias visíveis de uma vez), cada
 * uma clicável para ampliar. Degradê leve embaixo, igual ao dos outros.
 */
export default function ProductHero({ images, name, isDark }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const many = images.length > 1;

  const tile = (src: string, i: number, extra = '') => (
    <button
      key={src}
      onClick={() => setOpen(i)}
      aria-label={`Ampliar foto ${i + 1} de ${name}`}
      className={`group relative block w-full h-full rounded-3xl overflow-hidden ring-1 shadow-lg cursor-zoom-in ${isDark ? 'ring-white/10 bg-[#111]' : 'ring-black/[0.06] bg-white'} ${extra}`}
    >
      <img
        src={src}
        alt={`${name} — foto ${i + 1}`}
        loading={i === 0 ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        className={`w-full h-full ${many ? 'object-cover' : 'object-contain'} group-hover:scale-[1.04] transition-transform duration-700 ease-out`}
      />
      <span className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/45 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ZoomIn size={14} />
      </span>
    </button>
  );

  return (
    <div className={`w-full h-[52vh] md:h-[58vh] relative overflow-hidden ${isDark ? 'bg-[#050505]' : 'bg-white'}`}>
      <div className="absolute inset-x-0 top-[72px] bottom-20 px-4 md:px-8">
        {many ? (
          <div className="max-w-7xl mx-auto h-full">
            <Swiper
              spaceBetween={12}
              slidesPerView={1.3}
              breakpoints={{ 640: { slidesPerView: 2.2, spaceBetween: 14 }, 1024: { slidesPerView: 3, spaceBetween: 16 } }}
              className="w-full h-full"
            >
              {images.map((src, i) => (
                <SwiperSlide key={src}>{tile(src, i)}</SwiperSlide>
              ))}
            </Swiper>
          </div>
        ) : (
          <div className="h-full flex justify-center">{tile(images[0], 0, '!w-auto aspect-square')}</div>
        )}
      </div>

      {/* Degradê leve — o mesmo dos demais produtos */}
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#050505]' : 'from-white'} via-transparent to-transparent`} />

      <div className="pointer-events-none absolute top-6 left-6 z-10 flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/45 backdrop-blur-sm text-white">
        <Nfc size={13} />
        <span style={{ fontFamily: "'Lobster', cursive" }} className="text-xs tracking-wide leading-none translate-y-[1px]">AirNext</span>
      </div>

      <AnimatePresence>
        {open !== null && <ImageLightbox images={images} index={open} name={name} onChange={setOpen} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </div>
  );
}
