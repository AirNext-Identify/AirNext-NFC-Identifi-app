import { useRef } from 'react';
import {
  motion, useMotionValue, useReducedMotion, useSpring, useTransform,
} from 'framer-motion';
import { ArrowRight, Camera, Globe, MessageCircle, Nfc, PawPrint, QrCode, ShieldCheck, Zap } from 'lucide-react';
import { NFC_TAG_IMG, PET_TAG_AD_IMG, PET_THOR_IMG } from '../../lib/productImages';

/**
 * Vitrine do topo da landing — substitui os antigos "cards flutuantes".
 * Estilo Apple: três artes oficiais em cards grandes e arredondados, com leve
 * inclinação 3D no mouse, entrada suave ao rolar e um cartão de vidro (perfil
 * AirNext) flutuando entre eles.
 *
 * Responsivo de verdade:
 *  - celular: grade de 2 colunas (arte do pet grande, tag + perfil lado a lado, anúncio);
 *  - tablet/desktop: três cards em linha, escalonados, com o perfil sobreposto à tag.
 */

interface Props {
  isDark: boolean;
}

/* ───────────── inclinação 3D (só mouse; desligada p/ toque e "reduzir movimento") ───────────── */
function Tilt({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 160, damping: 18 });
  const sy = useSpring(py, { stiffness: 160, damping: 18 });
  const rotateY = useTransform(sx, [0, 1], [-7, 7]);
  const rotateX = useTransform(sy, [0, 1], [6, -6]);

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => { px.set(0.5); py.set(0.5); };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={reduce ? undefined : { rotateX, rotateY, transformPerspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ───────────── pílula de vidro ───────────── */
function GlassPill({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] md:text-xs font-semibold text-white
      bg-black/35 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/20 ${className}`}
    >
      {children}
    </span>
  );
}

/* ───────────── cartão de perfil (mini preview do perfil AirNext) ───────────── */
function ProfileGlass({ isDark, compact = false }: { isDark: boolean; compact?: boolean }) {
  const rows = [
    { icon: <MessageCircle size={12} className="text-emerald-400" />, label: 'WhatsApp' },
    { icon: <Camera size={12} className="text-pink-400" />, label: 'Instagram' },
    { icon: <Globe size={12} className="text-sky-400" />, label: 'Portfólio' },
  ];
  return (
    <div
      className={`relative w-full overflow-hidden rounded-[24px] md:rounded-[28px] p-3.5 md:p-4 text-white border shadow-2xl backdrop-blur-2xl
      ${isDark ? 'bg-zinc-900/75 border-white/15 shadow-black/50' : 'bg-[#0b1326]/90 border-white/10 shadow-blue-900/30'}`}
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#0071e3]/40 blur-3xl pointer-events-none" />
      <div className="relative flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#0071e3] to-[#5ac8fa] flex items-center justify-center text-base font-bold ring-2 ring-white/20">
            A
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0b1326] flex items-center justify-center">
            <Nfc size={8} />
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-[13px] md:text-sm font-semibold leading-tight truncate">Ana Souza</p>
          <p className="text-[10px] md:text-[11px] text-slate-400 leading-tight truncate">Designer de Produto</p>
        </div>
        <span className="ml-auto text-[9px] font-bold tracking-widest text-sky-300/80 shrink-0">TOQUE</span>
      </div>
      {!compact && (
        <div className="relative mt-3 space-y-1.5">
          {rows.map(r => (
            <div key={r.label} className="flex items-center gap-2 rounded-xl bg-white/[0.07] px-3 py-2 text-[11px] font-medium">
              {r.icon}
              <span className="flex-1">{r.label}</span>
              <ArrowRight size={11} className="text-slate-500" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────── componente principal ───────────── */
export default function HeroShowcase({ isDark }: Props) {
  const reduce = useReducedMotion();
  const ease = [0.22, 1, 0.36, 1] as const;

  const reveal = (delay: number, from: 'up' | 'scale' = 'up') => ({
    initial: from === 'up' ? { opacity: 0, y: 48 } : { opacity: 0, scale: 0.92 },
    whileInView: from === 'up' ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1 },
    viewport: { once: true, margin: '-40px' },
    transition: { duration: reduce ? 0 : 0.9, delay: reduce ? 0 : delay, ease },
  });

  const tile = `relative overflow-hidden rounded-[28px] md:rounded-[36px] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.55)]
    ring-1 ${isDark ? 'ring-white/10' : 'ring-black/5'}`;

  return (
    <div className="relative max-w-6xl mx-auto">
      {/* brilho de fundo */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/4 h-2/3 -z-0">
        <div className={`absolute left-[10%] top-0 w-[45%] h-full rounded-full blur-[110px] ${isDark ? 'bg-[#0071e3]/25' : 'bg-[#0071e3]/15'}`} />
        <div className={`absolute right-[8%] top-10 w-[38%] h-3/4 rounded-full blur-[110px] ${isDark ? 'bg-[#ff9500]/15' : 'bg-[#ff9500]/10'}`} />
      </div>

      <div className="relative grid grid-cols-2 gap-3 sm:gap-4 md:flex md:items-end md:gap-5 lg:gap-7">
        {/* 1 — Pet (arte principal) */}
        <motion.div {...reveal(0.1)} className="col-span-2 md:col-span-1 md:w-[35%]">
          <Tilt>
            <a href="#coleira-pet" aria-label="Conheça o AirNext Pet" className={`group block aspect-[4/5] ${tile} bg-zinc-900`}>
              <img
                src={PET_THOR_IMG}
                alt="Cachorro Thor com a tag AirNext na coleira e o perfil de emergência aberto no celular"
                width={1080}
                height={1350}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              <div className="absolute top-3.5 left-3.5 md:top-5 md:left-5">
                <GlassPill><PawPrint size={12} /> AirNext Pet</GlassPill>
              </div>
              <div className="absolute bottom-3.5 right-3.5 md:bottom-5 md:right-5">
                <GlassPill className="group-hover:bg-white group-hover:text-black transition-colors">
                  Conhecer <ArrowRight size={12} />
                </GlassPill>
              </div>
            </a>
          </Tilt>
        </motion.div>

        {/* 2 — Tag NFC + perfil de vidro sobreposto (desktop) */}
        <motion.div {...reveal(0.25, 'scale')} className="relative col-span-1 md:w-[28%] md:mb-16 lg:mb-20">
          <Tilt>
            <a href="#produtos" aria-label="Ver produtos AirNext" className={`group block aspect-square ${tile} bg-[#f2f2f4]`}>
              <img
                src={NFC_TAG_IMG}
                alt="Tag NFC AirNext: seu mundo, com um toque"
                width={1254}
                height={1254}
                loading="eager"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
              />
            </a>
          </Tilt>

          {/* perfil flutuante — só em md+ (no celular vira um card ao lado) */}
          <motion.div
            className="hidden md:block absolute -bottom-14 lg:-bottom-16 left-1/2 w-[112%] -translate-x-1/2 z-10"
            animate={reduce ? undefined : { y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ProfileGlass isDark={isDark} />
          </motion.div>
        </motion.div>

        {/* 2b — perfil (celular): card compacto ao lado da tag */}
        <motion.div {...reveal(0.35)} className="col-span-1 md:hidden flex">
          <div className="w-full flex flex-col justify-between gap-3 rounded-[28px] bg-[#0b1326] text-white p-4 ring-1 ring-white/10 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.55)]">
            <ProfileGlass isDark compact />
            <div>
              <p className="text-[26px] font-bold leading-none tracking-tight flex items-center gap-1.5">
                <Zap size={20} className="text-[#5ac8fa]" /> 1 toque
              </p>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">Aproxime o celular. Sem app, sem fio.</p>
            </div>
          </div>
        </motion.div>

        {/* 3 — Anúncio Pet com NFC */}
        <motion.div {...reveal(0.4)} className="col-span-2 md:col-span-1 md:w-[35%]">
          <Tilt>
            <a href="#produtos" aria-label="Garanta já a sua tag AirNext Pet" className={`group block aspect-[4/5] ${tile} bg-[#06122b]`}>
              <img
                src={PET_TAG_AD_IMG}
                alt="Tag pet com NFC AirNext: identificação digital do seu pet, em várias cores e modelos"
                width={1080}
                height={1350}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
              />
              <div className="absolute top-3.5 right-3.5 md:top-5 md:right-5">
                <GlassPill><ShieldCheck size={12} /> Pet protegido</GlassPill>
              </div>
            </a>
          </Tilt>
        </motion.div>
      </div>

      {/* selos — destacam o que a AirNext entrega, em qualquer tamanho de tela */}
      <motion.ul
        {...reveal(0.5)}
        className="relative mt-16 md:mt-24 lg:mt-28 flex flex-wrap items-center justify-center gap-2 md:gap-3"
      >
        {[
          { icon: <Nfc size={14} />, label: 'NFC + QR Code' },
          { icon: <Zap size={14} />, label: 'Sem app, sem bateria' },
          { icon: <QrCode size={14} />, label: 'Perfil sempre atualizado' },
          { icon: <ShieldCheck size={14} />, label: 'Sem mensalidade' },
        ].map(b => (
          <li
            key={b.label}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs md:text-sm font-semibold border backdrop-blur-xl
            ${isDark ? 'bg-white/[0.06] border-white/10 text-gray-200' : 'bg-white border-gray-200 text-gray-700 shadow-sm'}`}
          >
            <span className="text-[#0071e3]">{b.icon}</span>
            {b.label}
          </li>
        ))}
      </motion.ul>
    </div>
  );
}
