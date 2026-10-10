import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

/** Tela cheia com zoom (clique alterna 1× / 2,4×), setas e Esc. */
export default function ImageLightbox({ images, index, name, onChange, onClose }: { images: string[]; index: number; name: string; onChange: (i: number) => void; onClose: () => void }) {
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
