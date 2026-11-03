import { useEffect, useRef, useState } from 'react';
import {
  motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform,
  type MotionValue,
} from 'framer-motion';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Camera, ChevronDown, Globe, MessageCircle, Nfc, Play, UserPlus } from 'lucide-react';

/**
 * Hero da landing — "NFC conecta pessoas, negócios e pets."
 *
 * O palco fica fixo (sticky) enquanto a pessoa rola. Um celular 3D, feito só com CSS 3D,
 * desce sobre uma tag NFC que traz um QR Code de verdade. Quando encosta:
 *   1. saem ondas NFC da tag;
 *   2. chega a notificação "Perfil de Ana Souza" na tela;
 *   3. a tela vira o perfil digital AirNext.
 * As três palavras do título acendem na mesma ordem, então o movimento conta a história.
 *
 * Plano de design
 *  - Cor: tinta #050507, grafite #0d1b36, titânio #4a4d55, azul AirNext #0071e3, aqua #5ac8fa.
 *  - Tipo: a fonte do site (Inter) em peso 700 com tracking bem fechado; Lobster só no logo do cartão.
 *  - Layout: desktop = texto à esquerda, cena à direita; celular = texto em cima, cena embaixo.
 *  - Um único elemento memorável (o celular). O resto fica quieto.
 *  - "Reduzir movimento": mostra direto a cena final, sem palco fixo.
 *
 * Sem dependência nova: framer-motion e qrcode.react já estão no projeto.
 */

const PHONE_W = 270;
const PHONE_H = 560;
const CARD_W = 540;
const CARD_H = 340;
/** Onde fica a antena NFC no celular (terço de cima) — a tag fica embaixo dela. */
const TAG_Y = -120;

type MV = MotionValue<number>;

/* ───────────── encaixa a cena (projetada em 640×720) em qualquer tela ───────────── */
function useFitScale(ref: React.RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(0.6);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.max(0.28, Math.min(width / 640, height / 720, 1.25)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return scale;
}

/* ───────────── tela do celular ───────────── */
function PhoneScreen({ p }: { p: MV }) {
  const lockOp = useTransform(p, [0.58, 0.74], [1, 0]);
  const bannerY = useTransform(p, [0.62, 0.69], [-120, 0]);
  const bannerOp = useTransform(p, [0.62, 0.67, 0.76, 0.82], [0, 1, 1, 0]);
  const profOp = useTransform(p, [0.76, 0.9], [0, 1]);
  const profY = useTransform(p, [0.76, 0.9], [26, 0]);
  const profScale = useTransform(p, [0.76, 0.9], [0.95, 1]);

  const links = [
    { icon: <MessageCircle size={15} className="text-emerald-400" />, label: 'WhatsApp' },
    { icon: <Camera size={15} className="text-pink-400" />, label: 'Instagram' },
    { icon: <Globe size={15} className="text-sky-400" />, label: 'Portfólio' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 38, background: '#04070f' }}>
      {/* papel de parede */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 70% at 30% 0%, #0a3d7a 0%, #08203f 45%, #04070f 100%)' }}
      />
      <div className="absolute -right-16 top-1/3 h-56 w-56 rounded-full bg-[#5ac8fa]/20 blur-3xl" />

      {/* tela de bloqueio */}
      <motion.div className="absolute inset-0 text-white" style={{ opacity: lockOp }}>
        <div className="pt-16 text-center">
          <p className="text-[13px] font-medium text-white/70">sexta, 30 de outubro</p>
          <p className="text-[76px] font-semibold leading-none tracking-tight">9:41</p>
        </div>
        <div className="absolute inset-x-6 bottom-7 flex justify-between">
          <span className="h-11 w-11 rounded-full bg-white/10 backdrop-blur" />
          <span className="h-11 w-11 rounded-full bg-white/10 backdrop-blur" />
        </div>
      </motion.div>

      {/* notificação de leitura NFC */}
      <motion.div
        className="absolute inset-x-3 top-12 flex items-center gap-3 rounded-[20px] bg-white/85 p-3 text-zinc-900 shadow-xl backdrop-blur-xl"
        style={{ y: bannerY, opacity: bannerOp }}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#0071e3] to-[#5ac8fa] text-white">
          <Nfc size={18} />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="flex items-center justify-between gap-2 text-[10px] text-zinc-500">
            <span>AirNext</span><span>agora</span>
          </span>
          <span className="block truncate text-[13px] font-semibold">Perfil de Ana Souza</span>
          <span className="block truncate text-[11px] text-zinc-500">Toque para abrir</span>
        </span>
      </motion.div>

      {/* perfil digital */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center px-5 pt-14 text-white"
        style={{ opacity: profOp, y: profY, scale: profScale }}
      >
        <div className="relative">
          <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-gradient-to-br from-[#0071e3] to-[#5ac8fa] text-[30px] font-bold ring-4 ring-white/15">
            A
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#08203f] bg-emerald-500">
            <Nfc size={12} />
          </span>
        </div>
        <p className="mt-3 text-[19px] font-semibold leading-tight">Ana Souza</p>
        <p className="text-[12px] text-sky-200/70">Designer de Produto</p>

        <div className="mt-5 w-full space-y-2">
          {links.map((l) => (
            <div key={l.label} className="flex items-center gap-3 rounded-2xl bg-white/[0.09] px-4 py-3 text-[13px] font-medium backdrop-blur">
              {l.icon}
              <span className="flex-1">{l.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-[13px] font-semibold text-zinc-950">
          <UserPlus size={15} /> Salvar contato
        </div>
      </motion.div>
    </div>
  );
}

/* ───────────── celular 3D ───────────── */
function Phone({ p }: { p: MV }) {
  const x = useTransform(p, [0, 0.5, 0.66, 1], [110, 10, 0, 0]);
  const y = useTransform(p, [0, 0.5, 0.66, 1], [-60, -8, 0, 0]);
  const z = useTransform(p, [0, 0.2, 0.55, 0.66, 0.7, 1], [200, 170, 70, 8, 6, 6]);
  const rotateX = useTransform(p, [0, 0.55, 0.66], [26, 6, 0]);
  const rotateY = useTransform(p, [0, 0.55, 0.66], [-24, -3, 0]);
  const rotateZ = useTransform(p, [0, 0.55, 0.66], [16, -5, 0]);

  // sombra no chão: aperta e escurece conforme o celular desce
  const shadowScale = useTransform(z, [6, 200], [0.98, 1.22]);
  const shadowOp = useTransform(z, [6, 200], [0.38, 0.12]);

  return (
    <>
      <motion.div
        className="absolute"
        style={{
          left: -PHONE_W / 2, top: -PHONE_H / 2, width: PHONE_W, height: PHONE_H,
          borderRadius: 46, background: '#000', filter: 'blur(26px)',
          x, y, z: 1, scale: shadowScale, opacity: shadowOp,
        }}
      />
      <motion.div
        className="absolute will-change-transform"
        style={{
          left: -PHONE_W / 2, top: -PHONE_H / 2, width: PHONE_W, height: PHONE_H,
          transformStyle: 'preserve-3d', x, y, z, rotateX, rotateY, rotateZ,
        }}
      >
        {/* espessura / lateral de titânio */}
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              borderRadius: 46,
              background: i % 2 ? '#6b6f78' : '#3b3e45',
              transform: `translateZ(${-i}px)`,
            }}
          />
        ))}
        {/* botões laterais */}
        <div className="absolute -right-[2px] top-32 h-16 w-[3px] rounded-r bg-[#7b7f88]" style={{ transform: 'translateZ(-3px)' }} />
        <div className="absolute -left-[2px] top-28 h-9 w-[3px] rounded-l bg-[#7b7f88]" style={{ transform: 'translateZ(-3px)' }} />
        <div className="absolute -left-[2px] top-44 h-12 w-[3px] rounded-l bg-[#7b7f88]" style={{ transform: 'translateZ(-3px)' }} />

        {/* frente: moldura + tela */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: 46,
            background: 'linear-gradient(145deg,#8a8e97 0%,#2a2c31 40%,#5d6068 100%)',
            padding: 3,
            transform: 'translateZ(1px)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.18)',
          }}
        >
          <div className="relative h-full w-full bg-black" style={{ borderRadius: 43, padding: 8 }}>
            <div className="relative h-full w-full">
              <PhoneScreen p={p} />
              {/* ilha dinâmica */}
              <div className="absolute left-1/2 top-3 h-[26px] w-[84px] -translate-x-1/2 rounded-full bg-black" />
              {/* reflexo do vidro */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{ borderRadius: 38, background: 'linear-gradient(115deg,rgba(255,255,255,.16) 0%,rgba(255,255,255,0) 32%)' }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

/* ───────────── tag NFC com QR Code ───────────── */
function Tag({ p }: { p: MV }) {
  const rotateZ = useTransform(p, [0, 0.65], [-22, -10]);
  const glow = useTransform(
    p,
    [0.6, 0.7],
    ['0 30px 70px -22px rgba(0,25,70,.45), 0 0 0px 0px rgba(90,200,250,0)', '0 30px 70px -22px rgba(0,25,70,.45), 0 0 60px 6px rgba(90,200,250,.45)']
  );

  return (
    <motion.div
      className="absolute overflow-hidden text-white"
      style={{
        left: -CARD_W / 2, top: -CARD_H / 2 + TAG_Y, width: CARD_W, height: CARD_H,
        borderRadius: 30, z: 2, rotateZ, boxShadow: glow,
        background: 'linear-gradient(135deg,#10234a 0%,#071022 55%,#0b2f5c 100%)',
        border: '1px solid rgba(255,255,255,.14)',
      }}
    >
      <div className="absolute inset-0" style={{ background: 'linear-gradient(115deg,rgba(255,255,255,.12) 0%,rgba(255,255,255,0) 38%)' }} />
      <div className="absolute left-8 top-7 flex items-center gap-3">
        <span className="font-lobster text-[40px] leading-none tracking-wide">AirNext</span>
      </div>
      <div className="absolute right-8 top-7 flex h-12 w-12 items-center justify-center rounded-full bg-[#0071e3]/25 ring-1 ring-[#5ac8fa]/50">
        <Nfc size={24} className="text-[#5ac8fa]" />
      </div>
      <div className="absolute bottom-8 left-8 rounded-2xl bg-white p-2.5">
        <QRCodeSVG value="https://airnext.com.br" size={104} level="M" aria-label="QR Code que leva ao site da AirNext" />
      </div>
      <div className="absolute bottom-8 right-8 text-right leading-tight">
        <p className="text-[22px] font-semibold">Aproxime</p>
        <p className="text-[15px] text-sky-200/70">ou escaneie o QR Code</p>
      </div>
    </motion.div>
  );
}

/* ───────────── ondas NFC saindo da tag ───────────── */
function Ring({ p, start }: { p: MV; start: number }) {
  const scale = useTransform(p, [start, start + 0.26], [0.5, 2.5]);
  const opacity = useTransform(p, [start, start + 0.04, start + 0.26], [0, 0.8, 0]);
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: -170, top: -170 + TAG_Y, width: 340, height: 340, z: 3, scale, opacity,
        border: '2px solid rgba(90,200,250,.9)', boxShadow: '0 0 30px rgba(90,200,250,.45)',
      }}
    />
  );
}

/* ───────────── componente principal ───────────── */
export default function HeroScroll3D({ isDark: _isDark }: { isDark?: boolean }) {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const scale = useFitScale(sceneRef);

  // progresso do scroll → 0..1, com um pequeno "descanso" no final (a cena pronta fica parada).
  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ['start start', 'end end'] });
  const raw = useTransform(scrollYProgress, [0, 0.88, 1], [0, 1, 1]);
  const spring = useSpring(raw, { stiffness: 140, damping: 30, mass: 0.4 });
  const still = useMotionValue(1);
  const p: MV = reduce ? still : spring;

  const worldRX = useTransform(p, [0, 0.55, 1], [56, 40, 28]);
  const padOp = useTransform(p, [0, 0.66, 1], [0.35, 0.9, 1]);

  // as três palavras acendem em ordem
  const w1 = useTransform(p, [0, 0.06], [0.3, 1]);
  const w2 = useTransform(p, [0.5, 0.64], [0.3, 1]);
  const w3 = useTransform(p, [0.76, 0.9], [0.3, 1]);

  const chipOp = useTransform(p, [0.62, 0.67, 0.9, 0.98], [0, 1, 1, 0]);
  const chipY = useTransform(p, [0.62, 0.67], [10, 0]);
  const cueOp = useTransform(p, [0, 0.07], [1, 0]);

  const btnPrimary =
    'group inline-flex items-center gap-3 rounded-full bg-[#0071e3] px-6 py-3 text-[15px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(0,113,227,0.8)] transition hover:bg-[#0077ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]';
  const btnGhost =
    'inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.04] px-6 py-3 text-[15px] font-semibold text-[#1d1d1f] transition hover:bg-black/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]';

  return (
    <section id="top" aria-label="AirNext: cartões, tags e pulseiras NFC com QR Code" className="relative bg-[#fbfbfd] text-[#1d1d1f]">
      <div ref={wrapRef} className={reduce ? 'relative' : 'relative h-[320svh] lg:h-[340svh]'}>
        <div className={`${reduce ? 'relative min-h-[100svh]' : 'sticky top-0 h-[100svh]'} overflow-hidden`}>
          {/* fundo */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(60% 50% at 75% 55%, rgba(0,113,227,.12) 0%, rgba(0,113,227,0) 70%), radial-gradient(50% 40% at 10% 0%, rgba(90,200,250,.14) 0%, rgba(90,200,250,0) 70%)',
            }}
          />

          <div className="relative mx-auto grid h-full max-w-[1400px] grid-rows-[auto_minmax(0,1fr)] pt-[76px] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:grid-rows-1 lg:pt-0">
            {/* texto */}
            <div className="relative z-10 flex flex-col justify-center px-6 pb-2 text-center lg:px-10 lg:pb-0 lg:pl-[max(2rem,5vw)] lg:text-left">
              <p className="mx-auto mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-black/10 bg-black/[0.04] px-3.5 py-1.5 text-xs font-medium text-[#0071e3] backdrop-blur lg:mx-0 lg:mb-5 lg:text-sm">
                <Nfc size={13} className="text-[#5ac8fa]" /> NFC + QR Code · Tecnologia Premium
              </p>

              <h1 className="text-[clamp(2rem,min(9.5vw,5.6svh),4.6rem)] font-bold leading-[1.04] tracking-[-0.045em] lg:text-[clamp(2.8rem,4.7vw,4.9rem)]">
                <motion.span className="block" style={{ opacity: w1 }}>NFC conecta</motion.span>
                <motion.span className="block" style={{ opacity: w2 }}>pessoas, negócios</motion.span>
                <motion.span className="block" style={{ opacity: w3 }}>e pets.</motion.span>
              </h1>

              <p className="mx-auto mt-3 max-w-md text-[15px] font-medium leading-snug text-[#424245] lg:mx-0 lg:mt-6 lg:max-w-xl lg:text-xl lg:leading-relaxed">
                Um toque e seu perfil digital abre no celular de quem você encontra.
              </p>
              <p className="ai-definition mt-4 hidden max-w-xl text-base leading-relaxed text-[#6e6e73] md:block">
                Cartões, tags e pulseiras NFC. Sem app, sem bateria, sem complicação.
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-3 lg:mt-8 lg:justify-start">
                <Link to="/loja" className={btnPrimary}>
                  Explorar Produtos
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition group-hover:bg-white/30">
                    <ChevronDown size={14} />
                  </span>
                </Link>
                <a href="#destaques" className={btnGhost}>
                  <Play size={15} /> Ver destaques
                </a>
              </div>
            </div>

            {/* cena 3D */}
            <div ref={sceneRef} className="relative min-h-0" role="img" aria-label="Um celular se aproxima de uma tag NFC com QR Code e abre o perfil digital AirNext na tela">
              <div
                className="absolute left-1/2 top-1/2"
                style={{ width: 0, height: 0, transform: `scale(${scale})`, perspective: 1700, perspectiveOrigin: '50% 50%' }}
              >
                <motion.div className="absolute left-0 top-0" style={{ transformStyle: 'preserve-3d', rotateX: worldRX }}>
                  {/* tapete de luz sob a tag */}
                  <motion.div
                    className="absolute rounded-full"
                    style={{
                      left: -450, top: -450 + TAG_Y, width: 900, height: 900, z: -2, opacity: padOp,
                      background: 'radial-gradient(circle, rgba(0,113,227,.16) 0%, rgba(0,113,227,.06) 38%, rgba(0,113,227,0) 68%)',
                    }}
                  />
                  <Tag p={p} />
                  <Ring p={p} start={0.6} />
                  <Ring p={p} start={0.67} />
                  <Ring p={p} start={0.74} />
                  <Phone p={p} />
                </motion.div>
              </div>

              {/* aviso de leitura */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-[4%] -translate-x-1/2"
                style={{ opacity: chipOp, y: chipY }}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#1d1d1f] shadow-lg backdrop-blur-xl">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Tag NFC detectada
                </span>
              </motion.div>
            </div>
          </div>

          {/* dica de rolagem */}
          {!reduce && (
            <motion.div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-1 text-xs text-[#6e6e73]" style={{ opacity: cueOp }}>
              Role para aproximar
              <ChevronDown size={16} className="animate-bounce" />
            </motion.div>
          )}
        </div>
      </div>

      {/* texto completo no celular (no palco, só cabe a versão curta) */}
      <p className="ai-definition mx-auto max-w-xl px-6 pb-10 pt-6 text-center text-[15px] leading-relaxed text-[#6e6e73] md:hidden">
        Cartões, tags e pulseiras NFC. Sem app, sem bateria, sem complicação.
      </p>
    </section>
  );
}
