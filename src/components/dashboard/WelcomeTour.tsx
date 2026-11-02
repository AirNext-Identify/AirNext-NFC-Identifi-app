import { useEffect, useLayoutEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Zap, Pencil, BarChart3, UserCircle, LifeBuoy, X, HelpCircle, PlayCircle, ArrowRight, BookOpen } from 'lucide-react';

type Step = {
  id: string;
  /** Valor do atributo data-tour do item do menu que será destacado (só no desktop). */
  anchor?: string;
  icon: typeof Zap;
  title: string;
  text: string;
  final?: boolean;
};

const STEPS: Step[] = [
  { id: 'ativar', anchor: 'ativar', icon: Zap, title: 'Ative seu produto', text: 'Digite o código AIR-XXXXXXXX que veio na embalagem. O QR Code e o chip NFC são ativados juntos, uma vez só.' },
  { id: 'perfil', anchor: 'perfil', icon: Pencil, title: 'Edite seu perfil', text: 'Em Perfil você escolhe foto, links, WhatsApp e cores, com preview ao vivo do que a pessoa vai ver.' },
  { id: 'estatisticas', anchor: 'estatisticas', icon: BarChart3, title: 'Veja os acessos', text: 'Acompanhe quantas pessoas abriram seu perfil e quando.' },
  { id: 'conta', anchor: 'conta', icon: UserCircle, title: 'Sua conta', text: 'Atualize seus dados e troque a senha quando quiser.' },
  { id: 'suporte', anchor: 'suporte', icon: LifeBuoy, title: 'Precisa de ajuda?', text: 'Dúvidas frequentes, tutoriais e atendimento ficam no Suporte.' },
  { id: 'fim', icon: Sparkles, title: 'Tudo pronto!', text: 'O próximo passo é ativar seu primeiro produto. O botão de ajuda no canto da tela abre este tour de novo.', final: true },
];

const BALLOON_W = 320;

function findVisible(anchor: string): DOMRect | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${anchor}"]`));
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth) return r;
  }
  return null;
}

export function WelcomeTour({ open, firstName, onClose }: { open: boolean; firstName?: string; onClose: () => void }) {
  const nav = useNavigate();
  const [i, setI] = useState(-1); // -1 = tela de boas-vindas
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [desktop, setDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches);

  useEffect(() => { if (open) setI(-1); }, [open]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const h = () => setDesktop(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const step = i >= 0 && i < STEPS.length ? STEPS[i] : null;

  useLayoutEffect(() => {
    if (!open || !step || !step.anchor || !desktop) { setRect(null); return; }
    const measure = () => setRect(findVisible(step.anchor!));
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [open, step, desktop]);

  if (!open) return null;

  const next = () => (i >= STEPS.length - 1 ? onClose() : setI(i + 1));
  const back = () => setI((v) => Math.max(-1, v - 1));
  const goActivate = () => { onClose(); nav('/ativar'); };

  // ───────── Boas-vindas ─────────
  if (i === -1) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4" role="dialog" aria-modal="true" aria-label="Boas-vindas">
        <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#1c1c1e] p-7 text-center shadow-2xl slide-up">
          <button onClick={onClose} aria-label="Fechar" className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#0071e3]/15 ring-1 ring-[#0071e3]/40">
            <Sparkles className="h-8 w-8 text-[#4aa3ff]" />
          </div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[#4aa3ff]">Primeiro acesso</p>
          <h2 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight text-white">Bem-vindo à AirNext{firstName ? `, ${firstName}` : ''}!</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#a1a1a6]">Sua conta está pronta. Quer um tour rápido de 1 minuto para ativar e editar seu perfil?</p>
          <div className="mt-7 space-y-3">
            <button onClick={() => setI(0)} className="apple-btn">Começar tour <ArrowRight className="h-4 w-4" /></button>
            <button onClick={onClose} className="w-full text-sm text-[#a1a1a6] hover:text-white">Pular, eu me viro</button>
          </div>
        </div>
      </div>
    );
  }

  if (!step) return null;
  const Icon = step.icon;
  const total = STEPS.length;

  const body = (
    <>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0071e3]/15 ring-1 ring-[#0071e3]/40"><Icon className="h-5 w-5 text-[#4aa3ff]" /></div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#4aa3ff]">{i + 1} de {total}</p>
          <h3 className="text-[17px] font-semibold leading-snug text-white">{step.title}</h3>
        </div>
      </div>
      <p className="mt-3 text-[14px] leading-relaxed text-[#a1a1a6]">{step.text}</p>
      <div className="mt-5 flex items-center justify-between gap-3">
        <button onClick={onClose} className="text-[13px] text-[#8e8e93] hover:text-white">Pular tour</button>
        <div className="flex items-center gap-2">
          <button onClick={back} className="rounded-full border border-white/15 px-4 py-2 text-[13px] font-medium text-[#d1d1d6] hover:bg-white/5">Voltar</button>
          {step.final ? (
            <button onClick={goActivate} className="rounded-full bg-[#0071e3] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#0a84ff]">Ativar produto</button>
          ) : (
            <button onClick={next} className="rounded-full bg-[#0071e3] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#0a84ff]">Próximo</button>
          )}
        </div>
      </div>
    </>
  );

  // ───────── Balão ancorado no menu (desktop) ─────────
  if (rect) {
    const pad = 6;
    const top = Math.min(Math.max(12, rect.top + rect.height / 2 - 78), window.innerHeight - 230);
    return (
      <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={step.title}>
        <div className="absolute inset-0" onClick={onClose} />
        <div
          className="pointer-events-none fixed rounded-xl ring-2 ring-[#2997ff] transition-all duration-300"
          style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)' }}
        />
        <div className="fixed rounded-2xl border border-white/10 bg-[#1c1c1e] p-5 shadow-2xl transition-all duration-300" style={{ left: rect.right + pad + 18, top, width: BALLOON_W }}>
          <span aria-hidden className="absolute -left-[7px] h-3.5 w-3.5 rotate-45 border-b border-l border-white/10 bg-[#1c1c1e]" style={{ top: Math.min(Math.max(20, rect.top + rect.height / 2 - top - 7), 170) }} />
          {body}
        </div>
      </div>
    );
  }

  // ───────── Cartão central (celular ou item não visível) ─────────
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/75 backdrop-blur-sm px-4 pb-6 sm:items-center sm:pb-0" role="dialog" aria-modal="true" aria-label={step.title}>
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#1c1c1e] p-5 shadow-2xl slide-up">{body}</div>
    </div>
  );
}

/** Botão flutuante de ajuda: balão com atalhos e opção de rever o tour. */
export function HelpFab({ onStartTour, pulse }: { onStartTour: () => void; pulse?: boolean }) {
  const [open, setOpen] = useState(false);
  const items = [
    { icon: PlayCircle, label: 'Rever o tour de boas-vindas', onClick: () => { setOpen(false); onStartTour(); } },
    { icon: Zap, label: 'Como ativar meu produto', to: '/ativar' },
    { icon: BookOpen, label: 'Tutoriais e dúvidas', to: '/suporte' },
    { icon: LifeBuoy, label: 'Falar com o suporte', to: '/dashboard/suporte' },
  ];
  return (
    <div className="fixed bottom-5 right-4 z-[55] sm:right-6">
      {open && (
        <>
          <div className="fixed inset-0" onClick={() => setOpen(false)} />
          <div className="absolute bottom-14 right-0 w-64 rounded-2xl border border-white/10 bg-[#1c1c1e] p-2 shadow-2xl slide-up" role="menu">
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[#8e8e93]">Ajuda</p>
            {items.map((it) => {
              const cls = 'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] text-[#d1d1d6] hover:bg-white/5 hover:text-white';
              return it.to ? (
                <Link key={it.label} to={it.to} onClick={() => setOpen(false)} role="menuitem" className={cls}><it.icon className="h-4 w-4 text-[#4aa3ff]" />{it.label}</Link>
              ) : (
                <button key={it.label} onClick={it.onClick} role="menuitem" className={cls}><it.icon className="h-4 w-4 text-[#4aa3ff]" />{it.label}</button>
              );
            })}
          </div>
        </>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Ajuda"
        aria-expanded={open}
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#0071e3] text-white shadow-lg shadow-black/40 transition hover:bg-[#0a84ff] active:scale-95"
      >
        {pulse && !open && <span className="absolute inset-0 animate-ping rounded-full bg-[#0071e3]/50" aria-hidden />}
        {open ? <X className="relative h-5 w-5" /> : <HelpCircle className="relative h-6 w-6" />}
      </button>
    </div>
  );
}
