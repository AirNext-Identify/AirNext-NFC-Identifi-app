import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Trilho horizontal com scroll-snap + setas redondas (estilo apple.com). */
export default function ArrowCarousel({ children, itemClass, dark = false }: { children: ReactNode; itemClass: string; dark?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState(true);
  const [end, setEnd] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setStart(el.scrollLeft <= 4);
    setEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const raf = window.requestAnimationFrame(update);
    window.addEventListener('resize', update, { passive: true });
    return () => { window.cancelAnimationFrame(raf); window.removeEventListener('resize', update); };
  }, [update]);

  const go = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-slide]');
    const step = (card?.offsetWidth ?? el.clientWidth * 0.8) + 16;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  const btn = `w-11 h-11 rounded-full flex items-center justify-center transition disabled:opacity-40 disabled:cursor-default ${dark ? 'bg-white/15 text-white enabled:hover:bg-white/25' : 'bg-black/[0.08] text-[#1d1d1f] enabled:hover:bg-black/[0.14]'}`;

  return (
    <div>
      <div
        ref={ref}
        onScroll={update}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-5 md:px-6 pb-2 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', scrollPaddingLeft: 24 }}
      >
        {Array.isArray(children)
          ? children.map((c, i) => <div key={i} data-slide className={`snap-start shrink-0 ${itemClass}`}>{c}</div>)
          : <div data-slide className={`snap-start shrink-0 ${itemClass}`}>{children}</div>}
      </div>
      <div className="max-w-[1400px] mx-auto px-5 md:px-6 mt-6 flex justify-end gap-3">
        <button onClick={() => go(-1)} disabled={start} aria-label="Anterior" className={btn}><ChevronLeft size={20} /></button>
        <button onClick={() => go(1)} disabled={end} aria-label="Próximo" className={btn}><ChevronRight size={20} /></button>
      </div>
    </div>
  );
}
