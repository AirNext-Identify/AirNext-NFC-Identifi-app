import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  children: ReactNode;
  label: string;
  /** Tema dos controles (pílula de pontos + setas). */
  dark?: boolean;
}

const EDGE = 'px-6 md:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]';
const EDGE_SCROLL = 'scroll-pl-6 md:scroll-pl-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]';

/** Carrossel horizontal estilo apple.com: cards com snap, pílula de pontos e setas redondas. */
export default function AppleCarousel({ children, label, dark = false }: Props) {
  const items = Children.toArray(children);
  const total = items.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el || !el.children.length) return;
    const trackLeft = el.getBoundingClientRect().left;
    const startPad = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    // Chegou no fim da rolagem: o último card nem sempre alcança a posição inicial, então força o último ponto.
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) { setActive(total - 1); return; }
    let best = 0, dist = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const d = Math.abs((c as HTMLElement).getBoundingClientRect().left - trackLeft - startPad);
      if (d < dist) { dist = d; best = i; }
    });
    setActive(best);
  }, [total]);

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update]);

  const slideTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const idx = Math.max(0, Math.min(total - 1, i));
    const card = el.children[idx] as HTMLElement;
    const startPad = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    const delta = card.getBoundingClientRect().left - el.getBoundingClientRect().left - startPad;
    el.scrollTo({ left: el.scrollLeft + delta, behavior: 'smooth' });
  };

  const pill = dark ? 'bg-white/10' : 'bg-[#e8e8ed]';
  const btn = dark
    ? 'bg-white/10 text-white hover:bg-white/20 disabled:hover:bg-white/10'
    : 'bg-[#e8e8ed] text-[#1d1d1f] hover:bg-[#dcdce1] disabled:hover:bg-[#e8e8ed]';
  const dotOn = dark ? 'bg-white' : 'bg-[#1d1d1f]';
  const dotOff = dark ? 'bg-white/30' : 'bg-[#1d1d1f]/30';

  return (
    <>
      <div
        ref={trackRef}
        onScroll={update}
        role="list"
        aria-label={label}
        className={`relative flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 md:gap-5 ${EDGE} ${EDGE_SCROLL} [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
      >
        {items.map((card, i) => (
          <div key={i} role="listitem" className="flex w-[82vw] flex-shrink-0 snap-start sm:w-[400px]">
            {card}
          </div>
        ))}
      </div>

      <div className="mx-auto mt-8 flex max-w-6xl items-center justify-center gap-3 px-6 md:justify-end">
        <div className={`flex items-center gap-2 rounded-full px-4 py-3 ${pill}`} role="tablist" aria-label={`${label} — navegação`}>
          {items.map((_, i) => (
            <button key={i} role="tab" aria-selected={active === i} aria-label={`Card ${i + 1}`} onClick={() => slideTo(i)}
              className={`h-2 rounded-full transition-all ${active === i ? `w-6 ${dotOn}` : `w-2 ${dotOff}`}`} />
          ))}
        </div>
        <button onClick={() => slideTo(active - 1)} disabled={active === 0} aria-label="Anterior"
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${btn}`}>
          <ChevronLeft size={18} />
        </button>
        <button onClick={() => slideTo(active + 1)} disabled={active === total - 1} aria-label="Próximo"
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${btn}`}>
          <ChevronRight size={18} />
        </button>
      </div>
    </>
  );
}
