import { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { SPLASH_LOGO } from './logoData';

/**
 * Abertura da AirNext: fundo preto, logo ao centro e um anel fino que se desenha
 * por completo (com um ponto de luz na ponta). Só depois que o círculo fecha é que
 * o anel "respira", a logo se dissolve e a tela se abre suavemente para o site.
 * Aparece uma vez por sessão; toque/clique ou Esc pula.
 *
 * Robustez: a animação só começa quando a logo já carregou (ou após 1,2 s), tudo
 * usa só opacity/transform (sem máscara pesada) e há um timer de segurança que
 * sempre libera o site.
 */
const SEEN_KEY = 'airnext-splash-seen';
const LOGO = SPLASH_LOGO; // embutida no código: sem requisição de rede

/** Desligue aqui (false) para remover a abertura de vez — é o maior ganho possível no Speed Index. */
const SPLASH_ENABLED = true;

/** Não faz sentido segurar a tela em conexão fraca ou com economia de dados ligada. */
const shouldSkip = () => {
  const c = (navigator as any).connection;
  return !!c && (c.saveData === true || /(^|-)2g$/.test(c.effectiveType || ''));
};

const DRAW = 1.1;     // segundos para o círculo fechar
const PAUSE = 0.2;   // pausa com o círculo completo
const LEAVE = 0.6;    // abertura para o site
const SAFETY = 6;     // timer de segurança (s)

const readSeen = () => { try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch { return false; } };

export default function SplashScreen() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState<boolean>(() => SPLASH_ENABLED && typeof window !== 'undefined' && !readSeen() && !shouldSkip());
  const [ready, setReady] = useState(false);
  const [complete, setComplete] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const progress = useMotionValue(0);
  const dotAngle = useTransform(progress, (v) => v * 360);
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
    setVisible(false);
  };
  const leave = () => setLeaving(true);

  // Pré-carrega a logo; libera a animação quando estiver pronta (ou em 1,2 s).
  useEffect(() => {
    if (!visible) return;
    let alive = true;
    const go = () => { if (alive) setReady(true); };
    const img = new Image();
    img.src = LOGO;
    const t = window.setTimeout(go, 250);
    (img.decode ? img.decode() : Promise.resolve()).then(go, go);
    return () => { alive = false; window.clearTimeout(t); };
  }, [visible]);

  // Desenha o círculo; ao completar, faz uma pausa e inicia a saída.
  useEffect(() => {
    if (!visible || !ready) return;
    if (reduce) {
      const t = window.setTimeout(leave, 900);
      return () => window.clearTimeout(t);
    }
    let t2 = 0;
    const controls = animate(progress, 1, {
      duration: DRAW,
      ease: [0.65, 0, 0.35, 1],
      onComplete: () => {
        setComplete(true);
        t2 = window.setTimeout(leave, PAUSE * 1000);
      },
    });
    return () => { controls.stop(); window.clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, ready]);

  // Trava o scroll, permite pular e garante que o site sempre seja liberado.
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Enter') leave(); };
    window.addEventListener('keydown', onKey);
    const safety = window.setTimeout(finish, SAFETY * 1000);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(safety);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Depois que a tela começou a abrir, garante o fim mesmo se o evento de animação não vier.
  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(finish, (LEAVE + 0.4) * 1000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  if (!visible) return null;

  const size = 'min(78vw, 460px)';

  return (
    <motion.div
      role="presentation"
      aria-hidden
      onClick={leave}
      className="fixed inset-0 z-[1000] flex cursor-pointer items-center justify-center overflow-hidden bg-black"
      initial={false}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: leaving ? LEAVE : 0, ease: [0.4, 0, 0.2, 1] }}
      onAnimationComplete={() => { if (leaving) finish(); }}
    >
      {/* conjunto anel + logo: respira ao completar e cresce suavemente ao sair */}
      <motion.div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
        initial={false}
        animate={
          leaving ? { scale: 1.18, opacity: 0 }
          : complete ? { scale: [1, 1.035, 1], opacity: 1 }
          : { scale: 1, opacity: 1 }
        }
        transition={leaving ? { duration: LEAVE * 0.9, ease: [0.4, 0, 0.2, 1] } : { duration: 0.5, ease: 'easeInOut' }}
      >
        {/* brilho azul suave */}
        {!reduce && (
          <motion.div
            className="absolute inset-[6%] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(0,113,227,.30) 0%, rgba(0,113,227,.08) 50%, transparent 72%)', filter: 'blur(14px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: ready ? (complete ? 1 : 0.7) : 0 }}
            transition={{ duration: 0.8 }}
          />
        )}

        {/* anel */}
        {!reduce && (
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="an-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0071e3" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1" />
            <motion.circle
              cx="100" cy="100" r="96" fill="none"
              stroke="url(#an-ring)" strokeWidth="1.8" strokeLinecap="round"
              style={{ pathLength: progress }}
            />
          </svg>
        )}

        {/* ponto de luz na ponta do círculo */}
        {!reduce && (
          <motion.div className="absolute inset-0" style={{ rotate: dotAngle, opacity: complete ? 0 : ready ? 1 : 0, transition: 'opacity .35s' }}>
            <span
              className="absolute left-1/2 top-[2%] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
              style={{ boxShadow: '0 0 12px 3px rgba(41,151,255,.9)' }}
            />
          </motion.div>
        )}

        {/* logo */}
        <motion.img
          src={LOGO}
          alt=""
          draggable={false}
          decoding="async"
          className="relative select-none"
          width={512} height={512}
          style={{ width: '70%', height: 'auto' }}
          initial={false}
          animate={{ opacity: 1, scale: 1 }}
        />
      </motion.div>
    </motion.div>
  );
}
