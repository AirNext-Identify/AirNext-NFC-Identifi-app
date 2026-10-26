import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Star, X, Check, ExternalLink, Send } from 'lucide-react';
import {
  FEEDBACK_EMAIL, FEEDBACK_WHATSAPP, GOOGLE_REVIEW_URL, MOMENT_COPY, RATING_LABELS,
  SNOOZE_AFTER_CLOSE, SNOOZE_AFTER_DONE, SNOOZE_AFTER_TIMEOUT, isFeedbackHiddenRoute,
  type FeedbackMoment,
} from './feedbackConfig';
import { saveSiteFeedback } from '@/lib/siteFeedbacks';

/* ─────────────────────────── Contexto ─────────────────────────── */

interface FeedbackApi {
  /** Abre o painel de avaliação. `source` identifica de onde veio (aparece na mensagem). */
  open: (source?: string) => void;
  close: () => void;
  /** Mostra o balão discreto após uma ação concluída (respeita cooldown e rotas ocultas). */
  prompt: (moment?: FeedbackMoment, opts?: { delay?: number }) => void;
  /** Sincroniza o tema (claro/escuro) quando a página controla isso. */
  setDark: (dark: boolean) => void;
}

const noop = () => { /* fora do provider: não faz nada */ };
const FeedbackContext = createContext<FeedbackApi>({ open: noop, close: noop, prompt: noop, setDark: noop });

export const useFeedback = () => useContext(FeedbackContext);

/** Mantém o feedback no mesmo tema da página. Use: useFeedbackTheme(isDark). */
export function useFeedbackTheme(isDark: boolean) {
  const { setDark } = useFeedback();
  useEffect(() => { setDark(isDark); }, [isDark, setDark]);
}

/** Link/botão discreto para colocar em rodapés, telas de sucesso etc. */
export function FeedbackLink({
  source = 'link', className, children,
}: { source?: string; className?: string; children?: ReactNode }) {
  const { open } = useFeedback();
  return (
    <button type="button" onClick={() => open(source)} className={className}>
      {children ?? 'Avaliar a AirNext'}
    </button>
  );
}

/* ─────────────────────────── Persistência ─────────────────────────── */

const STORE_KEY = 'airnext-feedback-v1';
interface Store { snoozeUntil?: number; doneUntil?: number }
const readStore = (): Store => {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') as Store; } catch { return {}; }
};
const writeStore = (patch: Partial<Store>) => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ ...readStore(), ...patch })); } catch { /* ignore */ }
};
const readLandingDark = () => {
  try { return localStorage.getItem('airnext-landing-theme') !== 'light'; } catch { return true; }
};

/* ─────────────────────────── Provider ─────────────────────────── */

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const hidden = isFeedbackHiddenRoute(pathname);
  const [dark, setDark] = useState<boolean>(readLandingDark);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [source, setSource] = useState('botão flutuante');
  const [balloon, setBalloon] = useState<FeedbackMoment | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const hiddenRef = useRef(hidden); hiddenRef.current = hidden;
  const sheetRef = useRef(sheetOpen); sheetRef.current = sheetOpen;

  // Ao trocar para uma rota oculta, some tudo.
  useEffect(() => { if (hidden) { setBalloon(null); setSheetOpen(false); } }, [hidden]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const open = useCallback((src = 'botão flutuante') => {
    window.clearTimeout(timer.current);
    setBalloon(null);
    setSource(src);
    setSheetOpen(true);
  }, []);
  const close = useCallback(() => setSheetOpen(false), []);

  const prompt = useCallback((moment: FeedbackMoment = 'generic', opts?: { delay?: number }) => {
    const { snoozeUntil = 0, doneUntil = 0 } = readStore();
    const now = Date.now();
    if (hiddenRef.current || now < snoozeUntil || now < doneUntil) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (!hiddenRef.current && !sheetRef.current) setBalloon(moment);
    }, opts?.delay ?? 1400);
  }, []);

  const api = useMemo<FeedbackApi>(() => ({ open, close, prompt, setDark }), [open, close, prompt]);

  return (
    <FeedbackContext.Provider value={api}>
      {children}
      {!hidden && (
        <FeedbackUI
          dark={dark}
          sheetOpen={sheetOpen}
          source={source}
          balloon={balloon}
          onOpen={open}
          onClose={close}
          onBalloonClose={(reason) => {
            setBalloon(null);
            writeStore({ snoozeUntil: Date.now() + (reason === 'timeout' ? SNOOZE_AFTER_TIMEOUT : SNOOZE_AFTER_CLOSE) });
          }}
          onDone={() => writeStore({ doneUntil: Date.now() + SNOOZE_AFTER_DONE })}
        />
      )}
    </FeedbackContext.Provider>
  );
}

/* ─────────────────────────── UI ─────────────────────────── */

interface UIProps {
  dark: boolean;
  sheetOpen: boolean;
  source: string;
  balloon: FeedbackMoment | null;
  onOpen: (src?: string) => void;
  onClose: () => void;
  onBalloonClose: (reason: 'x' | 'timeout') => void;
  onDone: () => void;
}

const ACCENT = '#0071e3';
const STAR = '#ff9f0a';
const SAFE_BOTTOM = 'env(safe-area-inset-bottom, 0px)';

function FeedbackUI(p: UIProps) {
  const reduce = useReducedMotion();
  const { dark } = p;

  return (
    <>
      {/* Botão flutuante discreto, bem embaixo (perto da barra do navegador) para não atrapalhar */}
      <motion.button
        type="button"
        aria-label="Avaliar a AirNext"
        onClick={() => p.onOpen('botão flutuante')}
        initial={reduce ? false : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, type: 'spring', stiffness: 380, damping: 28 }}
        whileHover={reduce ? undefined : { scale: 1.08 }}
        whileTap={reduce ? undefined : { scale: 0.94 }}
        className={`group fixed z-[90] flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full border backdrop-blur-xl transition-colors ${
          dark
            ? 'border-white/10 bg-[#1c1c1e]/70 text-white/70 hover:bg-[#2c2c2e]/90 hover:text-white shadow-[0_8px_24px_rgba(0,0,0,.45)]'
            : 'border-black/5 bg-white/75 text-gray-500 hover:bg-white hover:text-gray-900 shadow-[0_8px_24px_rgba(0,0,0,.12)]'
        }`}
        style={{ right: 'max(1rem, calc(env(safe-area-inset-right, 0px) + 1rem))', bottom: `calc(${SAFE_BOTTOM} + 0.75rem)` }}
      >
        <Star size={18} strokeWidth={1.8} className="transition-colors group-hover:fill-[#ff9f0a] group-hover:text-[#ff9f0a]" />
        <span
          className={`pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium opacity-0 shadow-lg transition-opacity group-hover:opacity-100 md:block ${
            dark ? 'bg-[#2c2c2e] text-white' : 'bg-gray-900 text-white'
          }`}
        >
          Avaliar
        </span>
      </motion.button>

      <AnimatePresence>
        {p.balloon && !p.sheetOpen && <Balloon key="balloon" {...p} moment={p.balloon} reduce={!!reduce} />}
      </AnimatePresence>

      <AnimatePresence>
        {p.sheetOpen && <Sheet key="sheet" {...p} reduce={!!reduce} />}
      </AnimatePresence>
    </>
  );
}

/* ── Balão discreto ── */
function Balloon({ dark, moment, onOpen, onBalloonClose, onDone, reduce }: UIProps & { moment: FeedbackMoment; reduce: boolean }) {
  const [paused, setPaused] = useState(false);
  const copy = MOMENT_COPY[moment];

  useEffect(() => {
    if (paused) return;
    const t = window.setTimeout(() => onBalloonClose('timeout'), 14000);
    return () => window.clearTimeout(t);
  }, [paused, onBalloonClose]);

  const goGoogle = () => {
    window.open(GOOGLE_REVIEW_URL, '_blank', 'noopener,noreferrer');
    onDone();
    onBalloonClose('x');
  };

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`fixed z-[91] w-[min(300px,calc(100vw-2rem))] rounded-[20px] border p-4 backdrop-blur-2xl ${
        dark
          ? 'border-white/10 bg-[#1c1c1e]/85 text-white shadow-[0_20px_50px_rgba(0,0,0,.55)]'
          : 'border-black/5 bg-white/90 text-gray-900 shadow-[0_20px_50px_rgba(0,0,0,.15)]'
      }`}
      style={{ right: 'max(1rem, calc(env(safe-area-inset-right, 0px) + 1rem))', bottom: `calc(${SAFE_BOTTOM} + 4.25rem)` }}
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={() => onBalloonClose('x')}
        className={`absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
          dark ? 'text-white/40 hover:bg-white/10 hover:text-white' : 'text-gray-400 hover:bg-black/5 hover:text-gray-700'
        }`}
      >
        <X size={13} />
      </button>

      <div className="flex items-start gap-3 pr-5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: `${STAR}22` }}>
          <Star size={16} fill={STAR} color={STAR} />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-tight">{copy.title}</p>
          <p className={`mt-1 text-xs leading-snug ${dark ? 'text-white/60' : 'text-gray-500'}`}>{copy.text}</p>
        </div>
      </div>

      <div className="mt-3.5 flex items-center gap-2">
        <button
          type="button"
          onClick={goGoogle}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-white transition active:scale-[.97]"
          style={{ background: ACCENT }}
        >
          Avaliar no Google <ExternalLink size={12} />
        </button>
        <button
          type="button"
          onClick={() => onOpen(`balão · ${moment}`)}
          className={`rounded-full px-3 py-2 text-xs font-semibold transition active:scale-[.97] ${
            dark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-black/5 text-gray-800 hover:bg-black/10'
          }`}
        >
          Feedback
        </button>
      </div>

      {/* "rabinho" do balão apontando para o botão */}
      <span
        aria-hidden
        className={`absolute -bottom-1.5 right-[18px] h-3 w-3 rotate-45 border-b border-r ${
          dark ? 'border-white/10 bg-[#1c1c1e]' : 'border-black/5 bg-white'
        }`}
      />
    </motion.div>
  );
}

/* ── Painel de avaliação (bottom sheet no celular, modal no desktop) ── */
function Sheet({ dark, source, onClose, onDone, reduce }: UIProps & { reduce: boolean }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState<null | 'google' | 'private'>(null);
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const shown = hover || rating;

  // Esc fecha · trava scroll do fundo · foco no painel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const sendGoogle = async () => {
    // Se a pessoa já escreveu algo, copiamos para colar na avaliação do Google.
    if (comment.trim()) {
      try { await navigator.clipboard.writeText(comment.trim()); setCopied(true); } catch { /* ignore */ }
    }
    window.open(GOOGLE_REVIEW_URL, '_blank', 'noopener,noreferrer');
    onDone();
    setDone('google');
  };

  const sendPrivate = () => {
    // Guarda no painel (Admin → Feedbacks) para você organizar e publicar. Nunca bloqueia o envio.
    void saveSiteFeedback({ name, phone, rating, comment, source, consent });
    const stars = rating ? `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5 · ${RATING_LABELS[rating - 1]})` : 'não informada';
    const msg =
      `Olá! Quero deixar um feedback sobre a AirNext:\n\n` +
      (name.trim() ? `*Nome:* ${name.trim()}\n` : '') +
      `*Nota:* ${stars}\n` +
      `*Comentário:* ${comment.trim() || '—'}\n` +
      `*Origem:* ${source}\n` +
      `*Página:* ${window.location.pathname}`;
    window.open(`https://wa.me/${FEEDBACK_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
    onDone();
    setDone('private');
  };

  const muted = dark ? 'text-white/55' : 'text-gray-500';

  return (
    <motion.div
      className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center sm:p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        aria-hidden
        onClick={onClose}
        className={`absolute inset-0 backdrop-blur-sm ${dark ? 'bg-black/55' : 'bg-black/25'}`}
      />

      <motion.div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="airnext-feedback-title"
        initial={reduce ? { opacity: 0 } : { y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { y: 30, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 360, damping: 32 }}
        className={`relative w-full max-h-[92dvh] overflow-y-auto rounded-t-[28px] border p-6 outline-none backdrop-blur-2xl sm:max-w-[400px] sm:rounded-[28px] ${
          dark
            ? 'border-white/10 bg-[#1c1c1e]/95 text-white shadow-[0_30px_80px_rgba(0,0,0,.6)]'
            : 'border-black/5 bg-white/95 text-gray-900 shadow-[0_30px_80px_rgba(0,0,0,.2)]'
        }`}
        style={{ paddingBottom: `calc(1.5rem + ${SAFE_BOTTOM})` }}
      >
        {/* alça (celular) */}
        <div className={`mx-auto mb-4 h-1 w-9 rounded-full sm:hidden ${dark ? 'bg-white/20' : 'bg-black/10'}`} />

        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            dark ? 'bg-white/10 text-white/60 hover:text-white' : 'bg-black/5 text-gray-500 hover:text-gray-900'
          }`}
        >
          <X size={15} />
        </button>

        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-4 text-center"
            >
              <motion.span
                initial={reduce ? false : { scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.05 }}
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500"
              >
                <Check size={26} strokeWidth={2.4} />
              </motion.span>
              <h2 id="airnext-feedback-title" className="text-lg font-semibold tracking-tight">Obrigado!</h2>
              <p className={`mt-1.5 max-w-[280px] text-sm leading-relaxed ${muted}`}>
                {done === 'google'
                  ? copied
                    ? 'Copiamos seu comentário. É só colar na avaliação do Google que abriu em outra aba.'
                    : 'Sua avaliação no Google ajuda outras pessoas a nos conhecerem.'
                  : 'Seu feedback chegou até nossa equipe. Vamos ler com carinho.'}
              </p>
              <button
                type="button"
                onClick={onClose}
                className={`mt-6 w-full rounded-full py-3 text-sm font-semibold transition active:scale-[.98] ${
                  dark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-black/5 text-gray-900 hover:bg-black/10'
                }`}
              >
                Fechar
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 id="airnext-feedback-title" className="pr-8 text-lg font-semibold tracking-tight">
                Como foi sua experiência?
              </h2>
              <p className={`mt-1 text-sm ${muted}`}>Sua opinião ajuda a AirNext a melhorar.</p>

              {/* Estrelas */}
              <div role="radiogroup" aria-label="Nota de 1 a 5" className="mt-5 flex items-center justify-center gap-1.5"
                   onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map(n => {
                  const active = n <= shown;
                  return (
                    <motion.button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'} — ${RATING_LABELS[n - 1]}`}
                      onMouseEnter={() => setHover(n)}
                      onFocus={() => setHover(n)}
                      onBlur={() => setHover(0)}
                      onClick={() => setRating(n)}
                      whileTap={reduce ? undefined : { scale: 0.85 }}
                      animate={reduce ? undefined : { scale: rating === n ? [1, 1.25, 1] : 1 }}
                      transition={{ duration: 0.25 }}
                      className="rounded-full p-1 outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/60"
                    >
                      <Star
                        size={36}
                        strokeWidth={1.5}
                        className="transition-colors duration-150"
                        fill={active ? STAR : 'transparent'}
                        color={active ? STAR : dark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.2)'}
                      />
                    </motion.button>
                  );
                })}
              </div>
              <p className={`mt-1 h-5 text-center text-xs font-medium ${muted}`} aria-live="polite">
                {shown ? RATING_LABELS[shown - 1] : '\u00A0'}
              </p>

              {/* Comentário opcional (aparece após escolher a nota) */}
              <AnimatePresence initial={false}>
                {rating > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }} className="overflow-hidden"
                  >
                    <label className="sr-only" htmlFor="airnext-feedback-text">Comentário (opcional)</label>
                    <textarea
                      id="airnext-feedback-text"
                      value={comment}
                      onChange={e => setComment(e.target.value.slice(0, 600))}
                      rows={3}
                      placeholder={rating >= 4 ? 'O que você mais gostou? (opcional)' : 'O que podemos melhorar? (opcional)'}
                      className={`mt-3 w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[#0071e3]/40 ${
                        dark
                          ? 'border-white/10 bg-white/5 text-white placeholder:text-white/35'
                          : 'border-black/10 bg-black/[.03] text-gray-900 placeholder:text-gray-400'
                      }`}
                    />
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {([['Seu nome (opcional)', name, setName, 'name', 'text'], ['Seu WhatsApp (opcional)', phone, setPhone, 'tel', 'tel']] as const).map(([ph, val, set, ac, type]) => (
                        <input
                          key={ph} type={type} value={val} autoComplete={ac} maxLength={60}
                          onChange={e => set(e.target.value)} placeholder={ph} aria-label={ph}
                          className={`w-full rounded-2xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[#0071e3]/40 ${
                            dark ? 'border-white/10 bg-white/5 text-white placeholder:text-white/35' : 'border-black/10 bg-black/[.03] text-gray-900 placeholder:text-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                    <label className={`mt-2.5 flex cursor-pointer items-start gap-2 text-xs leading-snug ${muted}`}>
                      <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" />
                      Autorizo publicar meu depoimento (nome e comentário) no site da AirNext.
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Ações — o Google sempre aparece, para qualquer nota */}
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={sendGoogle}
                  className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition active:scale-[.98]"
                  style={{ background: ACCENT }}
                >
                  Avaliar no Google <ExternalLink size={14} />
                </button>
                <button
                  type="button"
                  onClick={sendPrivate}
                  disabled={!rating && !comment.trim()}
                  className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40 ${
                    dark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-black/5 text-gray-900 hover:bg-black/10'
                  }`}
                >
                  Enviar feedback para a equipe <Send size={14} />
                </button>
              </div>

              <p className={`mt-4 text-center text-[11px] ${dark ? 'text-white/35' : 'text-gray-400'}`}>
                Prefere e-mail?{' '}
                <a
                  href={`mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('Feedback AirNext')}`}
                  className="underline underline-offset-2 hover:opacity-80"
                >
                  {FEEDBACK_EMAIL}
                </a>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
