import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight, Backpack, Bike, Briefcase, Check, KeyRound, Laptop, MapPin, MessageCircle,
  Nfc, Phone, QrCode, RotateCcw, ShieldCheck, Smartphone, Tag as TagIcon, Droplets, Zap,
} from 'lucide-react';

interface Props {
  whatsapp: string;
  /** Foto real do produto AirNext Tag (opcional). */
  image?: string;
  onBuy: () => void;
}

const GOLD = '#eab308';

/** Cenários de uso: o visitante escolhe onde a tag está e vê o que quem acha enxerga. */
const SCENARIOS = [
  { id: 'mala', label: 'Mala', icon: Briefcase, item: 'Mala de viagem', hint: 'Esquecida na esteira do aeroporto' },
  { id: 'mochila', label: 'Mochila', icon: Backpack, item: 'Mochila escolar', hint: 'Esquecida no ônibus' },
  { id: 'chaves', label: 'Chaves', icon: KeyRound, item: 'Chaveiro de casa', hint: 'Caiu na calçada' },
  { id: 'notebook', label: 'Notebook', icon: Laptop, item: 'Notebook de trabalho', hint: 'Ficou na cafeteria' },
  { id: 'bike', label: 'Bike', icon: Bike, item: 'Bicicleta', hint: 'Encontrada sem dono' },
] as const;

type Step = 'idle' | 'approach' | 'read';

const STEPS = [
  { icon: TagIcon, title: 'Fixe a tag', text: 'Cole ou prenda em qualquer objeto: mala, chaves, mochila, notebook.' },
  { icon: Nfc, title: 'Alguém encontra', text: 'Basta aproximar o celular da tag (ou ler o QR Code de backup).' },
  { icon: Phone, title: 'Você é avisado', text: 'O perfil abre no navegador e a pessoa fala com você em um toque.' },
];

const SPECS = [
  { icon: Droplets, label: 'Resistente à água e riscos' },
  { icon: Zap, label: 'Sem bateria, sem app' },
  { icon: QrCode, label: 'QR Code de backup' },
  { icon: ShieldCheck, label: 'Você controla os dados' },
];

export default function TagDemoSection({ whatsapp, image, onBuy }: Props) {
  const reduce = useReducedMotion();
  const [scenarioId, setScenarioId] = useState<(typeof SCENARIOS)[number]['id']>('mala');
  const [step, setStep] = useState<Step>('idle');
  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!;
  const ScenarioIcon = scenario.icon;

  // Reinicia a demonstração quando troca o cenário.
  useEffect(() => {
    setStep('idle');
  }, [scenarioId]);

  // Sequência: aproximar → ler. Com "reduzir movimento" pula direto para o resultado.
  useEffect(() => {
    if (step !== 'approach') return;
    const t = window.setTimeout(() => setStep('read'), reduce ? 150 : 1300);
    return () => window.clearTimeout(t);
  }, [step, reduce]);

  const start = () => setStep('approach');
  const reset = () => setStep('idle');

  const waLink = `https://wa.me/${whatsapp}?text=${encodeURIComponent('Olá! Quero saber mais sobre a AirNext Tag.')}`;

  return (
    <section id="tag-demo" className="relative overflow-hidden bg-[#07070a] py-20 text-white md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[900px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: `radial-gradient(closest-side, ${GOLD}55, transparent)` }}
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span
            className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ borderColor: `${GOLD}55`, color: GOLD }}
          >
            <TagIcon size={13} /> AirNext Tag
          </span>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Perdeu algo? Quem achar fala com você em <span style={{ color: GOLD }}>um toque</span>.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
            Escolha um objeto, aproxime o celular da tag e veja exatamente o que a pessoa que encontrou enxerga.
          </p>
        </div>

        {/* Seletor de cenário */}
        <div className="mt-10 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Escolha o objeto">
          {SCENARIOS.map((s) => {
            const Icon = s.icon;
            const active = s.id === scenarioId;
            return (
              <button
                key={s.id}
                role="tab"
                aria-selected={active}
                onClick={() => setScenarioId(s.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active ? 'border-transparent text-black' : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                }`}
                style={active ? { background: GOLD } : undefined}
              >
                <Icon size={15} /> {s.label}
              </button>
            );
          })}
        </div>

        {/* Palco da demonstração */}
        <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
          {/* Objeto + tag */}
          <div className="order-2 flex flex-col items-center lg:order-1">
            <div className="relative flex h-56 w-full max-w-sm items-center justify-center rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] sm:h-64">
              <ScenarioIcon size={96} className="text-white/15" strokeWidth={1.2} />
              <motion.div
                className="absolute flex h-20 w-20 items-center justify-center rounded-2xl shadow-2xl"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #a16207)` }}
                animate={
                  step === 'idle'
                    ? { x: 0, y: 0, rotate: -6, scale: 1 }
                    : { x: reduce ? 0 : 60, y: reduce ? 0 : -6, rotate: 0, scale: 1.08 }
                }
                transition={{ type: 'spring', stiffness: 120, damping: 14 }}
              >
                {image ? (
                  <img src={image} alt="AirNext Tag" loading="lazy" className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  <Nfc size={34} className="text-black/80" />
                )}
                {step === 'approach' && !reduce && (
                  <span className="absolute inset-0 animate-ping rounded-2xl border-2" style={{ borderColor: GOLD }} />
                )}
              </motion.div>
              <p className="absolute bottom-4 text-xs text-zinc-500">{scenario.item} · {scenario.hint}</p>
            </div>
          </div>

          {/* Botão central */}
          <div className="order-1 flex flex-col items-center gap-3 lg:order-2">
            {step === 'read' ? (
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
              >
                <RotateCcw size={15} /> Ver de novo
              </button>
            ) : (
              <button
                onClick={start}
                disabled={step === 'approach'}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-black shadow-lg transition hover:scale-[1.03] active:scale-95 disabled:opacity-70"
                style={{ background: GOLD }}
              >
                <Smartphone size={16} /> {step === 'approach' ? 'Lendo a tag...' : 'Aproximar o celular'}
              </button>
            )}
            <p className="hidden text-[11px] text-zinc-500 lg:block">Toque para simular</p>
          </div>

          {/* Celular */}
          <div className="order-3 flex justify-center">
            <div className="relative h-[400px] w-[220px] overflow-hidden rounded-[34px] border-[6px] border-zinc-800 bg-zinc-950 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
              <div className="absolute left-1/2 top-1.5 z-20 h-4 w-16 -translate-x-1/2 rounded-full bg-black" />
              <AnimatePresence mode="wait">
                {step !== 'read' ? (
                  <motion.div
                    key="scan"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex h-full flex-col items-center justify-center gap-4 px-5 pt-6 text-center"
                  >
                    <div className="relative flex h-24 w-24 items-center justify-center">
                      <span className="absolute inset-0 animate-ping rounded-full border" style={{ borderColor: `${GOLD}66`, animationDuration: '2.4s' }} />
                      <span className="flex h-14 w-14 items-center justify-center rounded-full text-black" style={{ background: GOLD }}>
                        <Nfc size={26} />
                      </span>
                    </div>
                    <p className="text-sm font-semibold leading-snug">Aproxime o celular da tag</p>
                    <p className="text-[10px] text-zinc-500">Sem app. Funciona em qualquer celular com NFC ou câmera.</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="h-full px-3 pt-8"
                  >
                    <div className="flex items-center gap-2.5 px-1 pb-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full text-black" style={{ background: GOLD }}>
                        <ScenarioIcon size={20} />
                      </span>
                      <div>
                        <p className="text-[13px] font-bold leading-tight">{scenario.item}</p>
                        <p className="text-[10px] text-zinc-400">Item perdido · exemplo</p>
                      </div>
                    </div>
                    <div className="mb-2.5 flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-2 text-[10.5px] font-semibold text-emerald-300">
                      <Check size={13} /> Obrigado por ajudar! Fale com o dono:
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="flex items-center justify-center gap-1 rounded-lg bg-white py-2 text-[10.5px] font-bold text-zinc-900">
                          <Phone size={12} /> Ligar
                        </span>
                        <span className="flex items-center justify-center gap-1 rounded-lg bg-[#25d366] py-2 text-[10.5px] font-bold text-white">
                          <MessageCircle size={12} /> WhatsApp
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
                        <MapPin size={14} style={{ color: GOLD }} />
                        <div>
                          <p className="text-[11px] font-semibold leading-tight">Região do dono</p>
                          <p className="text-[10px] leading-tight text-zinc-400">Só aparece o que você liberar</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
                        <ShieldCheck size={14} style={{ color: GOLD }} />
                        <div>
                          <p className="text-[11px] font-semibold leading-tight">Perfil seguro</p>
                          <p className="text-[10px] leading-tight text-zinc-400">Você edita quando quiser</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Como funciona */}
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl text-black" style={{ background: GOLD }}>
                    <Icon size={18} />
                  </span>
                  <span className="text-xs font-bold text-zinc-500">0{i + 1}</span>
                </div>
                <h3 className="text-base font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">{s.text}</p>
              </div>
            );
          })}
        </div>

        {/* Specs + CTAs */}
        <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-zinc-300">
          {SPECS.map((s) => {
            const Icon = s.icon;
            return (
              <span key={s.label} className="inline-flex items-center gap-2">
                <Icon size={15} style={{ color: GOLD }} /> {s.label}
              </span>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={onBuy}
            className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-black transition hover:scale-[1.03] active:scale-95"
            style={{ background: GOLD }}
          >
            Quero minha AirNext Tag <ArrowRight size={16} />
          </button>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <MessageCircle size={16} /> Falar no WhatsApp
          </a>
        </div>
        <p className="mt-4 text-center text-[11px] text-zinc-600">Demonstração ilustrativa — o perfil real é personalizável no painel.</p>
      </div>
    </section>
  );
}
