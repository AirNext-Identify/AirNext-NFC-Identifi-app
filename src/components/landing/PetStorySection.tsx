import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  AlertTriangle, ArrowRight, Check, ChevronDown, Droplets, Heart, MapPin, MessageCircle,
  Nfc, PawPrint, Phone, QrCode, ShieldCheck, Smartphone, Stethoscope, Syringe, X,
} from 'lucide-react';

interface Props {
  whatsapp: string;
  image: string;
  onBuy: () => void;
}

const ORANGE = '#ff9500';

/* ───────────────────────── Mockups de celular (ilustrativos, feitos em código) ───────────────────────── */
type Variant = 'profile' | 'sos' | 'health' | 'scan';

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-[216px] h-[388px] lg:w-[250px] lg:h-[450px] rounded-[34px] border-[6px] border-zinc-800 bg-zinc-950 overflow-hidden shadow-md ring-1 ring-white/10">
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full bg-black z-20" />
      <div className="absolute inset-0 pt-7">{children}</div>
    </div>
  );
}

function Row({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.06] border border-white/10 px-3 py-2.5">
      <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${ORANGE}26`, color: ORANGE }}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-white leading-tight">{title}</p>
        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function PetHeader() {
  return (
    <div className="flex items-center gap-3 px-4 pb-3">
      <span className="w-12 h-12 rounded-full flex items-center justify-center text-black" style={{ background: ORANGE }}><PawPrint size={22} /></span>
      <div>
        <p className="text-sm font-bold text-white leading-tight">Nome do pet</p>
        <p className="text-[10px] text-gray-400">Raça · idade (exemplo)</p>
      </div>
    </div>
  );
}

function PhoneMock({ variant }: { variant: Variant }) {
  if (variant === 'scan') {
    return (
      <PhoneFrame>
        <div className="h-full flex flex-col items-center justify-center gap-5 px-5 text-center">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-[#ff9500]/40" style={{ animationDuration: '2.4s' }} />
            <span className="absolute inset-3 rounded-full border border-[#ff9500]/50" />
            <span className="w-16 h-16 rounded-full flex items-center justify-center text-black" style={{ background: ORANGE }}><PawPrint size={28} /></span>
          </div>
          <Nfc size={26} className="text-white/80" />
          <p className="text-sm font-semibold text-white leading-snug">Aproxime o celular da tag na coleira</p>
          <p className="text-[10px] text-gray-400">Sem app. Sem bateria. Funciona em qualquer celular com NFC ou câmera.</p>
        </div>
      </PhoneFrame>
    );
  }
  if (variant === 'sos') {
    return (
      <PhoneFrame>
        <div className="mx-3 rounded-2xl p-3 bg-red-600 shadow-lg shadow-red-900/50">
          <div className="flex items-center gap-2.5">
            <span className="relative w-9 h-9 rounded-full bg-white/15 ring-1 ring-white/30 flex items-center justify-center text-white">
              <span className="absolute inset-0 rounded-full bg-white/30" style={{ animationDuration: '1.8s' }} />
              <AlertTriangle size={17} className="relative" />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wide text-white leading-tight">Pet desaparecido</p>
              <p className="text-[9.5px] text-white/90 leading-tight mt-0.5">Ajude a reunir este pet com o tutor</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <span className="rounded-lg bg-white text-red-700 text-[10px] font-bold py-2 flex items-center justify-center gap-1"><Phone size={11} /> Ligar</span>
            <span className="rounded-lg bg-[#25d366] text-white text-[10px] font-bold py-2 flex items-center justify-center gap-1"><MessageCircle size={11} /> WhatsApp</span>
          </div>
        </div>
        <div className="mt-3"><PetHeader /></div>
        <div className="px-3 space-y-2">
          <Row icon={<Phone size={14} />} title="Contato do tutor" sub="Disponível com um toque" />
          <Row icon={<MapPin size={14} />} title="Região de moradia" sub="Para facilitar o retorno" />
        </div>
      </PhoneFrame>
    );
  }
  if (variant === 'health') {
    return (
      <PhoneFrame>
        <PetHeader />
        <div className="px-3 space-y-2">
          <Row icon={<Syringe size={14} />} title="Vacinas" sub="Carteira de vacinação" />
          <Row icon={<Heart size={14} />} title="Alergias e cuidados" sub="Informações para quem socorre" />
          <Row icon={<Stethoscope size={14} />} title="Veterinário" sub="Contato direto da clínica" />
          <Row icon={<Phone size={14} />} title="Contato de emergência" sub="Tutor e pessoa de confiança" />
        </div>
      </PhoneFrame>
    );
  }
  return (
    <PhoneFrame>
      <PetHeader />
      <div className="px-3 space-y-2">
        <Row icon={<Phone size={14} />} title="Falar com o tutor" sub="Ligação ou WhatsApp" />
        <Row icon={<Stethoscope size={14} />} title="Veterinário" sub="Dados de saúde do pet" />
        <Row icon={<ShieldCheck size={14} />} title="Perfil seguro" sub="Você controla o que aparece" />
      </div>
      <p className="absolute bottom-3 inset-x-0 text-center text-[9px] text-gray-500">Perfil digital AirNext Pet</p>
    </PhoneFrame>
  );
}

/* ───────────────────────── Conteúdo ───────────────────────── */
const CHAPTERS: { n: string; eyebrow: string; title: string; text: string; variant: Variant }[] = [
  {
    n: '01',
    eyebrow: 'A nova era',
    title: 'Plaquinha gravada é coisa do passado.',
    text: 'A coleira inteligente AirNext Pet tem chip NFC e QR Code. Quem encontrar o seu pet aproxima o celular e vê o perfil completo na hora — sem baixar app, sem cadastro, sem complicação.',
    variant: 'profile',
  },
  {
    n: '02',
    eyebrow: 'Modo SOS',
    title: 'Pet desaparecido? Ative o alerta em segundos.',
    text: 'Com o Modo SOS ligado, o perfil do seu pet ganha um aviso de destaque, "Pet desaparecido", com botões para ligar ou chamar você no WhatsApp. Quem encontrou sabe exatamente o que fazer.',
    variant: 'sos',
  },
  {
    n: '03',
    eyebrow: 'Informação que ajuda',
    title: 'Saúde, contatos e veterinário em um só lugar.',
    text: 'Contatos de emergência, dados de saúde e do veterinário ficam no perfil, e você decide o que mostrar. Em um imprevisto, cada segundo conta, e a informação certa chega a quem precisa.',
    variant: 'health',
  },
  {
    n: '04',
    eyebrow: 'Feita para a rotina',
    title: 'Sem bateria. Sem mensalidade. À prova d’água.',
    text: 'Acabamento em resina, resistência IP68 (submersível) e argola para prender na coleira. O chip NFC não usa bateria e o QR Code funciona como segunda via em qualquer celular.',
    variant: 'scan',
  },
];

const OLD = [
  'Plaquinha com espaço para poucas letras',
  'Telefone desatualizado quando você troca de número',
  'Nenhuma informação de saúde',
  'Sem aviso quando o pet desaparece',
];
const NEW = [
  'Perfil digital completo, aberto com um toque',
  'Você atualiza os contatos quando quiser, sem trocar a tag',
  'Dados de saúde e veterinário no perfil',
  'Modo SOS com destaque de "Pet desaparecido"',
];

const STEPS = [
  { icon: PawPrint, title: 'Monte o perfil', text: 'Cadastre os dados do pet, os contatos e o que você quer mostrar.' },
  { icon: ShieldCheck, title: 'Prenda na coleira', text: 'Use a argola para fixar a tag. É resistente à água e não precisa de bateria.' },
  { icon: Smartphone, title: 'Quem achar, aproxima', text: 'Pelo NFC ou pelo QR Code, qualquer pessoa abre o perfil e fala com você.' },
];

/* ───────────────────────── Seção 1 — Abertura com scroll ───────────────────────── */
function PetHero({ image }: { image: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  const [phase, setPhase] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setPhase(v > 0.28 ? 1 : 0));
  useEffect(() => { setPhase(scrollYProgress.get() > 0.28 ? 1 : 0); }, [scrollYProgress]);

  const imgScale = useTransform(scrollYProgress, [0, 0.3], [0.84, 1]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  const textCell = reduce ? 'flex flex-col items-center gap-5' : 'grid place-items-center';
  const stack = reduce ? '' : '[grid-area:1/1]';
  const showTitle = reduce || phase === 0;
  const showCaption = reduce || phase === 1;

  return (
    <div id="coleira-pet" ref={ref} className={`relative bg-black text-white ${reduce ? '' : 'h-[220vh] [@supports(height:100svh)]:h-[220svh]'}`}>
      <div className={`${reduce ? 'min-h-[100svh] py-28' : 'sticky top-0 h-screen [@supports(height:100svh)]:h-[100svh] pt-28 pb-5'} overflow-hidden flex flex-col items-center px-5 sm:px-6`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(255,149,0,0.20),transparent_62%)] pointer-events-none" />

        <div className={`relative z-10 w-full max-w-4xl text-center shrink-0 ${textCell}`}>
          <motion.div
            initial={false}
            animate={reduce ? undefined : { opacity: showTitle ? 1 : 0, y: showTitle ? 0 : -16 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: showTitle ? 0.15 : 0 }}
            aria-hidden={!showTitle}
            className={stack}
          >
            <p className="eyebrow mb-3 sm:mb-4" style={{ color: ORANGE }}>AirNext Pet · Coleira inteligente</p>
            <h2 className="text-[clamp(1.8rem,7.6vw,4.5rem)] font-bold tracking-[-0.035em] leading-[1.04]">
              A nova era da<br />identificação digital<br />para pets.
            </h2>
          </motion.div>

          <motion.p
            initial={false}
            animate={reduce ? undefined : { opacity: showCaption ? 1 : 0, y: showCaption ? 0 : 16 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: showCaption ? 0.15 : 0 }}
            aria-hidden={!showCaption}
            className={`${stack} text-[clamp(1.05rem,4.6vw,1.75rem)] leading-snug font-medium text-gray-200 max-w-[28ch] sm:max-w-2xl mx-auto`}
          >
            Um toque na coleira e quem encontrou seu pet já sabe como falar com você.
            <span className="block mt-2 text-white font-semibold">Com Modo SOS para emergências.</span>
          </motion.p>
        </div>

        <div className="relative z-0 flex-1 min-h-0 w-full flex items-center justify-center py-3 sm:py-5">
          <motion.div
            style={reduce ? undefined : { scale: imgScale }}
            className="relative aspect-square w-[min(82vw,500px)] [@supports(height:100svh)]:w-[min(82vw,44svh,500px)] rounded-[28px] sm:rounded-[36px] overflow-hidden shadow-md ring-1 ring-white/10 will-change-transform"
          >
            <img src={image} alt="Pet com a coleira inteligente AirNext Pet" decoding="async" className="w-full h-full object-cover" />
            <span className="absolute left-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-3 py-1.5 text-[11px] font-semibold text-white ring-1 ring-white/15">
              <Nfc size={13} style={{ color: ORANGE }} /> NFC + QR Code
            </span>
          </motion.div>
        </div>

        {!reduce && (
          <motion.div style={{ opacity: hintOpacity }} className="shrink-0 h-6 text-gray-500" aria-hidden="true">
            <ChevronDown size={22} />
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Seção 2 — Capítulos ───────────────────────── */
function PetChapters() {
  const [active, setActive] = useState(0);
  const card = 'relative rounded-[28px] lg:rounded-[40px] overflow-hidden ring-1 ring-white/10 bg-[#1a1206] flex items-center justify-center';

  return (
    <section className="relative bg-[#050505] text-white py-14 md:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 grid lg:grid-cols-2 gap-8 lg:gap-20">
        <div className="hidden lg:block lg:order-2">
          <div className="sticky top-28">
            <div className={`${card} aspect-square`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                >
                  <PhoneMock variant={CHAPTERS[active].variant} />
                </motion.div>
              </AnimatePresence>
              <p className="absolute bottom-4 inset-x-0 text-center text-[11px] text-gray-500">Exemplo ilustrativo da tela do perfil</p>
            </div>
          </div>
        </div>

        <div className="lg:order-1 space-y-16 lg:space-y-0">
          {CHAPTERS.map((c, i) => (
            <motion.article
              key={c.n}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              onViewportEnter={() => setActive(i)}
              viewport={{ amount: 0.35, margin: '0px 0px -10% 0px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="lg:min-h-[85vh] flex flex-col justify-center lg:py-10"
            >
              <div className={`lg:hidden mb-6 h-[430px] ${card}`}>
                <PhoneMock variant={c.variant} />
              </div>
              <p className="text-sm font-semibold mb-2 tabular-nums" style={{ color: ORANGE }}>{c.n}</p>
              <p className="eyebrow text-gray-400 mb-3">{c.eyebrow}</p>
              <h3 className="text-[clamp(1.6rem,6.4vw,3rem)] lg:text-[clamp(1.8rem,3.6vw,3rem)] font-bold tracking-[-0.03em] leading-[1.08] mb-4">{c.title}</h3>
              <p className="text-base md:text-lg text-gray-400 leading-relaxed max-w-xl">{c.text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Seção 3 — Modo SOS em destaque ───────────────────────── */
function PetSOS() {
  const points = [
    'Aviso de destaque "Pet desaparecido" no topo do perfil',
    'Botões de ligar e WhatsApp para quem encontrou',
    'Você liga e desliga o modo quando quiser, pelo painel',
  ];
  return (
    <section className="relative bg-black text-white py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(220,38,38,0.22),transparent_60%)] pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-5 sm:px-6 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
        >
          <p className="eyebrow text-red-400 mb-4 inline-flex items-center gap-2"><AlertTriangle size={14} /> Modo SOS</p>
          <h2 className="h2-apple mb-5">Na emergência,<br />o tempo é tudo.</h2>
          <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-lg">
            Se o seu pet sumiu, você não precisa esperar alguém procurar o seu contato. Ative o Modo SOS e o perfil passa a pedir ajuda por você.
          </p>
          <ul className="space-y-3">
            {points.map((t) => (
              <li key={t} className="flex gap-3 text-[15px] text-gray-200 leading-snug">
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center"><Check size={12} /></span>
                {t}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="flex justify-center"
        >
          <PhoneMock variant="sos" />
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────── Seção 4 — Como funciona + comparativo + CTA ───────────────────────── */
function PetHow({ whatsapp, onBuy }: Omit<Props, 'image'>) {
  const msg = encodeURIComponent('Olá! Quero saber mais sobre a coleira inteligente AirNext Pet.');
  return (
    <section className="relative bg-[#050505] text-white py-20 md:py-32 overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-12 md:mb-16"
        >
          <p className="eyebrow mb-4" style={{ color: ORANGE }}>Como funciona</p>
          <h2 className="h2-apple">Três passos.<br />Segurança para a vida toda.</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 md:gap-6 mb-16 md:mb-24">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="rounded-[26px] p-7 bg-white/[0.04] border border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${ORANGE}26`, color: ORANGE }}><Icon size={22} /></span>
                <span className="text-4xl font-bold text-white/10 tabular-nums">{i + 1}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{text}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-5 md:gap-6 mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.7 }}
            className="rounded-[28px] p-7 md:p-9 bg-white/[0.03] border border-white/10"
          >
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 mb-6">Plaquinha comum</p>
            <ul className="space-y-4">
              {OLD.map((t) => (
                <li key={t} className="flex gap-3 text-[15px] text-gray-400 leading-snug">
                  <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center"><X size={12} className="text-gray-500" /></span>
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="rounded-[28px] p-7 md:p-9 bg-[#2a1700] border border-[#ff9500]/30 shadow-md"
          >
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-6" style={{ color: ORANGE }}>Coleira inteligente AirNext Pet</p>
            <ul className="space-y-4">
              {NEW.map((t) => (
                <li key={t} className="flex gap-3 text-[15px] text-white leading-snug">
                  <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-black" style={{ background: ORANGE }}><Check size={12} /></span>
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="rounded-[36px] p-8 md:p-14 text-center bg-[#2a1700] border border-white/10 relative overflow-hidden">
          
          <div className="relative">
            <div className="flex items-center justify-center gap-3 mb-5" style={{ color: ORANGE }} aria-hidden="true">
              <Nfc size={22} /><QrCode size={22} /><Droplets size={22} />
            </div>
            <h3 className="text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-[-0.03em] leading-tight mb-4">
              Proteja quem<br className="hidden sm:block" /> protege a sua casa.
            </h3>
            <p className="text-gray-400 max-w-xl mx-auto mb-8">
              Pagamento único, sem mensalidade e sem bateria. A identificação do seu pet sempre atualizada e pronta para uma emergência.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={onBuy} className="inline-flex items-center gap-2 text-black px-7 py-3.5 rounded-full text-sm font-bold active:scale-[0.98] transition shadow-xl shadow-orange-500/20 hover:brightness-110" style={{ background: ORANGE }}>
                Quero a coleira AirNext Pet <ArrowRight size={16} />
              </button>
              <a href={`https://wa.me/${whatsapp}?text=${msg}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold border border-white/20 hover:bg-white/10 transition">
                <MessageCircle size={16} /> Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PetStorySection({ whatsapp, image, onBuy }: Props) {
  return (
    <>
      <PetHero image={image} />
      <PetChapters />
      <PetSOS />
      <PetHow whatsapp={whatsapp} onBuy={onBuy} />
    </>
  );
}
