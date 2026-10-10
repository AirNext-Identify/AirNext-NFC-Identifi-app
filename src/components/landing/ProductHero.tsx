import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Nfc, X, ZoomIn } from 'lucide-react';

interface Props {
  images: string[];
  name: string;
  isDark: boolean;
  accent: string;
}

/* Degradê: some a foto nas bordas e embaixo, como no hero dos demais produtos */
const FADE_MASK: CSSProperties = {
  WebkitMaskImage:
    'linear-gradient(to bottom, #000 72%, transparent 100%), linear-gradient(to right, transparent 0%, #000 9%, #000 91%, transparent 100%)',
  maskImage:
    'linear-gradient(to bottom, #000 72%, transparent 100%), linear-gradient(to right, transparent 0%, #000 9%, #000 91%, transparent 100%)',
  WebkitMaskComposite: 'source-in',
  maskComposite: 'intersect',
};

/** Tela cheia com zoom (clique alterna 1× / 2,4×), setas e Esc. */
function Lightbox({ images, index, name, onChange, onClose }: { images: string[]; index: number; name: string; onChange: (i: number) => void; onClose: () => void }) {
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const many = images.length > 1;

  const go = useCallback((d: number) => { setZoom(false); onChange((index + d + images.length) % images.length); }, [index, images.length, onChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (many && e.key === 'ArrowRight') go(1);
      else if (many && e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, many, onClose]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-black/92 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      role="dialog" aria-modal="true" aria-label={`Imagens de ${name}`}
    >
      <button onClick={onClose} aria-label="Fechar" className="absolute top-5 right-5 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
        <X size={20} />
      </button>
      {many && (
        <>
          <button onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Anterior" className="absolute left-3 md:left-6 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"><ChevronLeft size={22} /></button>
          <button onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Próxima" className="absolute right-3 md:right-6 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"><ChevronRight size={22} /></button>
        </>
      )}
      <div className="w-full h-full flex items-center justify-center overflow-hidden p-4 md:p-10" onClick={(e) => e.stopPropagation()}>
        <motion.img
          key={images[index]}
          src={images[index]}
          alt={name}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: zoom ? 2.4 : 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ transformOrigin: origin, cursor: zoom ? 'zoom-out' : 'zoom-in' }}
          onClick={(e) => {
            const r = (e.currentTarget as HTMLImageElement).getBoundingClientRect();
            setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
            setZoom(z => !z);
          }}
          className="max-h-full max-w-full object-contain rounded-2xl select-none"
          draggable={false}
        />
      </div>
      {many && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold">{index + 1} / {images.length}</div>
      )}
    </motion.div>,
    document.body,
  );
}

/**
 * Hero do modal de produto para produtos com foto quadrada / galeria / combo.
 * Fundo desfocado da própria foto + foto principal com degradê nas bordas,
 * miniaturas clicáveis e ampliação em tela cheia.
 */
export default function ProductHero({ images, name, isDark, accent }: Props) {
  const [active, setActive] = useState(0);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const many = images.length > 1;
  const page = isDark ? 'from-[#050505] via-[#050505]/60' : 'from-white via-white/60';

  const select = (i: number) => { setActive(i); swiper?.slideTo(i); };

  return (
    <div className="w-full h-[66vh] md:h-[78vh] relative overflow-hidden">
      {/* Fundo: foto desfocada (troca com fade junto com a imagem ativa) */}
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover scale-125 blur-3xl saturate-150 transition-opacity duration-700 ${i === active ? 'opacity-70' : 'opacity-0'}`}
        />
      ))}

      {/* Foto principal com degradê */}
      <div className="absolute inset-x-0 top-4 bottom-40 md:bottom-44">
        <Swiper
          onSwiper={setSwiper}
          onSlideChange={(s) => setActive(s.activeIndex)}
          spaceBetween={0}
          className="w-full h-full"
          style={{ ['--swiper-theme-color' as string]: accent }}
        >
          {images.map((src, i) => (
            <SwiperSlide key={src} className="!flex items-center justify-center">
              <img
                src={src}
                alt={`${name} — foto ${i + 1}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                onClick={() => setLightbox(i)}
                style={FADE_MASK}
                className="h-full max-w-full object-contain cursor-zoom-in select-none"
                draggable={false}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {many && (
          <>
            <button onClick={() => swiper?.slidePrev()} aria-label="Foto anterior" className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white items-center justify-center transition"><ChevronLeft size={20} /></button>
            <button onClick={() => swiper?.slideNext()} aria-label="Próxima foto" className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white items-center justify-center transition"><ChevronRight size={20} /></button>
          </>
        )}
      </div>

      {/* Degradê inferior para o conteúdo da página */}
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t ${page} to-transparent`} />

      {/* Miniaturas clicáveis */}
      {many && (
        <div className="absolute inset-x-0 bottom-24 md:bottom-28 z-10 flex justify-center gap-2.5 px-4">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => select(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === active}
              className={`w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden transition-all duration-300 ${i === active ? 'scale-105 opacity-100 ring-2 ring-offset-2 ring-offset-transparent' : 'opacity-60 hover:opacity-100 ring-1 ring-black/10'}`}
              style={i === active ? { ['--tw-ring-color' as string]: accent } : undefined}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Dica de ampliação */}
      <button
        onClick={() => setLightbox(active)}
        className="absolute top-6 left-1/2 -translate-x-1/2 z-10 hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md text-white text-xs font-semibold transition"
      >
        <ZoomIn size={13} /> Toque para ampliar
      </button>

      {/* Selo AirNext (igual ao dos demais produtos) */}
      <div className="pointer-events-none absolute top-6 left-6 z-10 flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/45 backdrop-blur-sm text-white">
        <Nfc size={13} />
        <span style={{ fontFamily: "'Lobster', cursive" }} className="text-xs tracking-wide leading-none translate-y-[1px]">AirNext</span>
      </div>

      <AnimatePresence>
        {lightbox !== null && (
          <Lightbox images={images} index={lightbox} name={name} onChange={setLightbox} onClose={() => setLightbox(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
