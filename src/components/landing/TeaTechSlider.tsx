import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Ear, HeartPulse, MessageCircle, PhoneCall, SlidersHorizontal, Smartphone } from 'lucide-react';

/**
 * Slider horizontal "estilo app" que explica a tecnologia por trás do AirNext TEA.
 * Rolagem com snap (deslizar com o dedo), setas e indicadores.
 */
const SLIDES = [
  { tone: 'from-[#4da3ff] to-[#0a6cf0]', icon: <Smartphone size={22} />, title: 'Um toque, sem app', text: 'O chip NFC é passivo: não tem bateria e não precisa de aplicativo. Basta aproximar um smartphone compatível para abrir o perfil na hora.' },
  { tone: 'from-[#3ed6c4] to-[#12a190]', icon: <MessageCircle size={22} />, title: 'Comunicação assistida', text: 'Explique como a pessoa se comunica, o que ajuda a acalmar e o que evitar, para que quem for ajudar saiba como agir.' },
  { tone: 'from-[#ffb340] to-[#ff7a00]', icon: <Ear size={22} />, title: 'Sensibilidades sensoriais', text: 'Registre incômodos com barulho, luz ou toque, para que as pessoas ao redor ajustem o ambiente com mais cuidado.' },
  { tone: 'from-[#ff6b6b] to-[#e0342f]', icon: <PhoneCall size={22} />, title: 'Contatos de emergência', text: 'Quem encontrar a pessoa em um momento de crise liga para a família ou o responsável com um único toque.' },
  { tone: 'from-[#4cd964] to-[#27ae4a]', icon: <HeartPulse size={22} />, title: 'Dados médicos vitais', text: 'Alergias, medicamentos e informações importantes ficam acessíveis, e você escolhe exatamente o que deseja mostrar.' },
  { tone: 'from-[#8e9aaf] to-[#5b6578]', icon: <SlidersHorizontal size={22} />, title: 'Você no controle', text: 'Atualize ou oculte informações quando quiser, direto no painel, sem precisar trocar o produto.' },
];

export default function TeaTechSlider({ isDark = false }: { isDark?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const card = el.children[0] as HTMLElement | undefined;
    if (!card) return;
    const step = card.offsetWidth + 16;
    setActive(Math.min(SLIDES.length - 1, Math.max(0, Math.round(el.scrollLeft / step))));
  }, []);

  useEffect(() => { onScroll(); }, [onScroll]);

  const go = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.children[0] as HTMLElement | undefined;
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 280) + 16), behavior: 'smooth' });
  };
  const goTo = (i: number) => {
    const el = ref.current;
    const card = el?.children[0] as HTMLElement | undefined;
    el?.scrollTo({ left: i * ((card?.offsetWidth ?? 280) + 16), behavior: 'smooth' });
  };

  const arrow = `flex h-10 w-10 items-center justify-center rounded-full transition active:scale-90 disabled:opacity-30 ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-[#1d1d1f] hover:bg-black/10'}`;

  return (
    <div className={`border-t ${isDark ? 'border-white/10' : 'border-gray-100'} px-5 pb-8 pt-8 md:px-12 md:pb-12 md:pt-10`}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#0071e3]">Como funciona</p>
          <h4 className={`mt-1 text-xl font-bold tracking-tight md:text-2xl ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>A tecnologia por trás do AirNext TEA</h4>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button type="button" aria-label="Anterior" onClick={() => go(-1)} disabled={active === 0} className={arrow}><ChevronLeft size={20} /></button>
          <button type="button" aria-label="Próximo" onClick={() => go(1)} disabled={active === SLIDES.length - 1} className={arrow}><ChevronRight size={20} /></button>
        </div>
      </div>

      <div
        ref={ref}
        onScroll={onScroll}
        className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-2 md:-mx-12 md:px-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {SLIDES.map((s, i) => (
          <article
            key={s.title}
            className={`w-[78%] shrink-0 snap-start rounded-[28px] p-6 sm:w-[300px] ${isDark ? 'bg-white/[0.06] ring-1 ring-white/10' : 'bg-[#f5f5f7]'}`}
            aria-label={`${i + 1} de ${SLIDES.length}`}
          >
            <span className={`flex h-12 w-12 items-center justify-center rounded-[28%] bg-gradient-to-b text-white shadow-[0_6px_16px_-6px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.35)] ${s.tone}`}>{s.icon}</span>
            <h5 className={`mt-5 text-[19px] font-semibold leading-tight tracking-tight ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>{s.title}</h5>
            <p className={`mt-2 text-[14px] leading-relaxed ${isDark ? 'text-gray-400' : 'text-[#6e6e73]'}`}>{s.text}</p>
          </article>
        ))}
        <div className="w-1 shrink-0 md:w-6" aria-hidden="true" />
      </div>

      <div className="mt-5 flex items-center justify-center gap-1.5" role="tablist" aria-label="Slides">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            type="button"
            role="tab"
            aria-selected={active === i}
            aria-label={`Ir para ${s.title}`}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${active === i ? 'w-6 bg-[#0071e3]' : `w-1.5 ${isDark ? 'bg-white/25' : 'bg-black/20'}`}`}
          />
        ))}
      </div>
    </div>
  );
}
