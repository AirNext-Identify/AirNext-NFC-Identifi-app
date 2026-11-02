import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  BarChart3, Camera, Check, ChevronDown, ChevronRight, Globe, MapPin, MessageCircle,
  Nfc, Palette, QrCode, Star, UtensilsCrossed, Wallet, Wifi, X,
} from 'lucide-react';
import AppleCarousel from './AppleCarousel';
import { STAND_GOOGLE_NFC_IMG, STAND_POSTO_IMG, STAND_BALCAO_IMG } from '../../lib/productImages';

interface Props {
  whatsapp: string;
  onBuy: () => void;
}

/* ───────────────────────── Capítulos (storytelling com scroll) ───────────────────────── */
const CHAPTERS = [
  {
    n: '01',
    eyebrow: 'O propósito',
    title: 'Seu cliente não deveria precisar procurar.',
    text: 'Senha do Wi-Fi no papel, cardápio na parede, redes sociais escondidas, avaliação pedida no boca a boca. O AirNext Stand reúne tudo isso em um único ponto do balcão — o cliente aproxima o celular e pronto.',
    img: STAND_POSTO_IMG,
    alt: 'AirNext Stand preto sobre um balcão com atalhos para Wi-Fi, Instagram e WhatsApp',
  },
  {
    n: '02',
    eyebrow: 'Avaliações no Google',
    title: 'Cada cliente satisfeito vira uma estrela.',
    text: 'Um toque e o cliente cai direto na tela de avaliação do seu negócio no Google — sem buscar, sem digitar. Mais avaliações fortalecem a sua reputação justamente na hora em que o cliente está mais feliz.',
    img: STAND_GOOGLE_NFC_IMG,
    alt: 'AirNext Stand com NFC, QR Code e avaliação Google sobre o balcão de uma loja de conveniência de madeira',
  },
  {
    n: '03',
    eyebrow: 'Uma inovação que integra',
    title: 'NFC e QR Code. Um só destino, sempre atualizado.',
    text: 'O chip NFC e o QR Code apontam para o mesmo perfil digital. Mudou o cardápio, a promoção ou o link? Você atualiza uma vez, sem reimprimir nada — e acompanha os acessos pelo painel de analytics.',
    img: STAND_BALCAO_IMG,
    alt: 'Stand branco de balcão com QR Code e NFC para avaliação no Google',
  },
  {
    n: '04',
    eyebrow: 'Do jeito da sua marca',
    title: 'Acrílico premium, com a cara do seu negócio.',
    text: 'Base de acrílico de acabamento brilhante e personalização com a sua logo. Um objeto elegante que combina com o ambiente e conversa com o cliente sem precisar de app, bateria ou mensalidade.',
    img: STAND_POSTO_IMG,
    alt: 'AirNext Stand de acrílico com acabamento premium',
  },
];

/* ───────────────────────── Antes × Depois ───────────────────────── */
const BEFORE = [
  'Cardápio impresso que fica desatualizado',
  'Senha do Wi-Fi perguntada ao atendente',
  'Avaliação no Google só quando alguém lembra de pedir',
  'Instagram e WhatsApp difíceis de achar',
  'Nenhuma ideia de quantos clientes se interessaram',
];
const AFTER = [
  'Tudo atualizado em um só lugar, quando você quiser',
  'Wi-Fi a um toque do celular',
  'Tela de avaliação do Google aberta direto no toque',
  'Redes sociais e WhatsApp à mão do cliente',
  'Painel de analytics com os acessos ao Stand',
];

const IMPACT = [
  { icon: Star, title: 'Mais reputação', text: 'Facilite a avaliação no Google no momento certo e construa prova social todos os dias.' },
  { icon: Nfc, title: 'Menos atrito', text: 'O cliente resolve tudo com um toque, sem baixar app e sem depender do atendente.' },
  { icon: BarChart3, title: 'Mais controle', text: 'Atualize conteúdo sem reimprimir e acompanhe os acessos pelo painel.' },
];

/* ───────────────────────── Integrações ───────────────────────── */
const INTEGRATIONS = [
  { icon: Star, name: 'Avaliações Google', text: 'Abre direto a tela de avaliar o seu negócio.', color: '#fbbc04' },
  { icon: Wifi, name: 'Wi-Fi', text: 'Conexão rápida para o cliente, sem digitar senha.', color: '#34c759' },
  { icon: UtensilsCrossed, name: 'Cardápio e catálogo', text: 'Produtos e serviços sempre atualizados.', color: '#ff9500' },
  { icon: Camera, name: 'Instagram', text: 'Seguidores novos a um toque de distância.', color: '#e1306c' },
  { icon: MessageCircle, name: 'WhatsApp', text: 'Atendimento e pedidos direto na conversa.', color: '#25d366' },
  { icon: Globe, name: 'Site', text: 'Leve o cliente para a página que importa.', color: '#0a84ff' },
  { icon: MapPin, name: 'Localização', text: 'Rota e horários de funcionamento.', color: '#ff453a' },
  { icon: Wallet, name: 'Pix', text: 'Dados de pagamento sempre à mão.', color: '#32ade6' },
];

/* ───────────────────────── Seção 1 — Hero com scroll (estilo Tesla/Apple) ─────────────────────────
 * Layout em 3 áreas que nunca se sobrepõem:
 *   [ título ⇄ frase ]  → mesma área; o título some e a frase entra no lugar
 *   [ foto ]            → tamanho calculado pela altura/largura da tela (cabe em qualquer celular)
 *   [ seta de rolagem ]
 */
function StandHero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  // Fase 0 = título · Fase 1 = frase. Troca por estado (nunca os dois ao mesmo tempo).
  const [phase, setPhase] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setPhase(v > 0.28 ? 1 : 0));
  useEffect(() => { setPhase(scrollYProgress.get() > 0.28 ? 1 : 0); }, [scrollYProgress]);

  const imgScale = useTransform(scrollYProgress, [0, 0.3], [0.84, 1]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  // Movimento reduzido: sem efeito de rolagem, tudo visível em coluna.
  const textCell = reduce ? 'flex flex-col items-center gap-5' : 'grid place-items-center';
  const stack = reduce ? '' : '[grid-area:1/1]';
  const showTitle = reduce || phase === 0;
  const showCaption = reduce || phase === 1;

  return (
    <div
      id="stand"
      ref={ref}
      className={`relative bg-black text-white ${reduce ? '' : 'h-[220vh] [@supports(height:100svh)]:h-[220svh]'}`}
    >
      {/* pt-28 (112px) deixa o texto livre do menu flutuante no topo */}
      <div
        className={`${reduce ? 'min-h-[100svh] py-28' : 'sticky top-0 h-screen [@supports(height:100svh)]:h-[100svh] pt-28 pb-5'} overflow-hidden flex flex-col items-center px-5 sm:px-6`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(66,133,244,0.22),transparent_62%)] pointer-events-none" />

        {/* Área do texto: título e frase dividem o mesmo espaço (altura fixa, sem "pulos") */}
        <div className={`relative z-10 w-full max-w-4xl text-center shrink-0 ${textCell}`}>
          <motion.div
            initial={false}
            animate={reduce ? undefined : { opacity: showTitle ? 1 : 0, y: showTitle ? 0 : -16 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: showTitle ? 0.15 : 0 }}
            aria-hidden={!showTitle}
            className={stack}
          >
            <p className="eyebrow text-[#8ab4f8] mb-3 sm:mb-4">AirNext Stand</p>
            <h2 className="text-[clamp(1.9rem,8.2vw,4.75rem)] font-bold tracking-[-0.035em] leading-[1.04]">
              O seu balcão<br />agora conversa<br />com o cliente.
            </h2>
          </motion.div>

          <motion.p
            initial={false}
            animate={reduce ? undefined : { opacity: showCaption ? 1 : 0, y: showCaption ? 0 : 16 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: showCaption ? 0.15 : 0 }}
            aria-hidden={!showCaption}
            className={`${stack} text-[clamp(1.05rem,4.6vw,1.75rem)] leading-snug font-medium text-gray-200 max-w-[28ch] sm:max-w-2xl mx-auto`}
          >
            Wi-Fi, cardápio, avaliações no Google, Instagram e WhatsApp.
            <span className="block mt-2 text-white font-semibold">Tudo em um único toque.</span>
          </motion.p>
        </div>

        {/* Área da foto: lado = menor entre 82% da largura, 44% da altura e 500px */}
        <div className="relative z-0 flex-1 min-h-0 w-full flex items-center justify-center py-3 sm:py-5">
          <motion.div
            style={reduce ? undefined : { scale: imgScale }}
            className="aspect-square w-[min(82vw,500px)] [@supports(height:100svh)]:w-[min(82vw,44svh,500px)] rounded-[28px] sm:rounded-[36px] overflow-hidden shadow-md ring-1 ring-white/10 will-change-transform"
          >
            <img
              src={STAND_GOOGLE_NFC_IMG}
              alt="AirNext Stand com NFC, QR Code e avaliação Google sobre o balcão de uma loja de conveniência"
              decoding="async"
              className="w-full h-full object-cover"
            />
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

/* ───────────────────────── Seção 2 — Storytelling ─────────────────────────
 * Desktop: foto fixa à direita que troca a cada capítulo, enquanto o texto rola.
 * Mobile: cada capítulo traz a própria foto acima do texto (nada fica escondido
 * atrás de elementos fixos em telas estreitas).
 */
function StandChapters() {
  const [active, setActive] = useState(0);

  return (
    <section className="relative bg-[#050505] text-white py-14 md:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 grid lg:grid-cols-2 gap-8 lg:gap-20">
        {/* Foto fixa (somente desktop) */}
        <div className="hidden lg:block lg:order-2">
          <div className="sticky top-28">
            <div className="relative aspect-square rounded-[40px] overflow-hidden ring-1 ring-white/10 bg-[#111] shadow-2xl shadow-black/60">
              <AnimatePresence mode="wait">
                <motion.img
                  key={active}
                  src={CHAPTERS[active].img}
                  alt={CHAPTERS[active].alt}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute bottom-4 left-4 flex gap-1.5" aria-hidden="true">
                {CHAPTERS.map((_, i) => (
                  <span key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Capítulos */}
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
              {/* Foto do capítulo (somente mobile/tablet) */}
              <div className="lg:hidden mb-6 aspect-[4/3] sm:aspect-[16/10] rounded-[24px] overflow-hidden ring-1 ring-white/10 bg-[#111] shadow-xl shadow-black/50">
                <img
                  src={c.img}
                  alt={c.alt}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm font-semibold text-[#4285f4] mb-2 tabular-nums">{c.n}</p>
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

/* ───────────────────────── Seção 3 — O que muda no negócio (carrossel estilo Apple) ───────────────────────── */
const CARD = 'flex min-h-[460px] w-full flex-col rounded-[28px] p-7 sm:min-h-[520px] sm:p-9';

function StandChange() {
  return (
    <section className="relative bg-[#f5f5f7] text-[#1d1d1f] py-20 md:py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="mb-10 md:mb-12"
        >
          <p className="text-[19px] font-semibold text-[#6e6e73] mb-2">O que muda no seu negócio</p>
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-semibold tracking-tight leading-[1.08]">Pequeno no balcão.<br />Grande no resultado.</h2>
        </motion.div>
      </div>

      <AppleCarousel label="O que muda com o AirNext Stand">
        <div className={`${CARD} bg-white`}>
          <p className="text-[15px] font-semibold text-[#6e6e73] mb-2">Sem o Stand</p>
          <h3 className="text-[28px] font-semibold leading-tight tracking-tight mb-8">Tudo espalhado.</h3>
          <ul className="space-y-4 mt-auto">
            {BEFORE.map((t) => (
              <li key={t} className="flex gap-3 text-[15px] text-[#6e6e73] leading-snug">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#ff3b30]/10 flex items-center justify-center"><X size={12} className="text-[#ff3b30]" /></span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className={`${CARD} bg-[#1d1d1f] text-white`}>
          <p className="text-[15px] font-semibold text-[#86868b] mb-2">Com o AirNext Stand</p>
          <h3 className="text-[28px] font-semibold leading-tight tracking-tight mb-8">Tudo em um toque.</h3>
          <ul className="space-y-4 mt-auto">
            {AFTER.map((t) => (
              <li key={t} className="flex gap-3 text-[15px] text-white leading-snug">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#34c759] flex items-center justify-center"><Check size={12} className="text-white" /></span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {IMPACT.map(({ icon: Icon, title, text }, i) => {
          const dark = i === 1;
          const color = ['#ff9f0a', '#0a84ff', '#30d158'][i];
          return (
            <div key={title} className={`${CARD} ${dark ? 'bg-[#1d1d1f] text-white' : 'bg-white'}`}>
              <h3 className="text-[32px] sm:text-[36px] font-semibold leading-[1.08] tracking-tight">{title}</h3>
              <p className={`mt-4 text-[17px] leading-snug ${dark ? 'text-[#a1a1a6]' : 'text-[#6e6e73]'}`}>{text}</p>
              <span className="mt-auto flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ background: color }}><Icon size={26} /></span>
            </div>
          );
        })}
      </AppleCarousel>
    </section>
  );
}

/* ───────────────────────── Seção 4 — Tudo integrado (slides) + CTA ───────────────────────── */
function StandIntegrations({ whatsapp, onBuy }: Props) {
  const msg = encodeURIComponent('Olá! Quero saber mais sobre o AirNext Stand para o meu negócio.');

  return (
    <section className="relative bg-white text-[#1d1d1f] py-20 md:py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mb-10 md:mb-12"
        >
          <p className="text-[19px] font-semibold text-[#6e6e73] mb-2">Tudo integrado</p>
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-semibold tracking-tight leading-[1.08] mb-4">Uma inovação que conecta o seu negócio ao que o cliente já usa.</h2>
          <p className="text-[19px] text-[#6e6e73] leading-snug">
            O Stand não é só uma placa: é a porta de entrada para os canais do seu negócio. Deslize e veja o que cabe em um toque.
          </p>
        </motion.div>
      </div>

      <div
        className="flex gap-4 md:gap-5 overflow-x-auto snap-x snap-mandatory px-6 md:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] scroll-pl-6 md:scroll-pl-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
        aria-label="Integrações do AirNext Stand"
      >
        {INTEGRATIONS.map(({ icon: Icon, name, text, color }) => (
          <div
            key={name}
            role="listitem"
            className="snap-start flex-shrink-0 w-[72vw] sm:w-[300px] min-h-[260px] flex flex-col rounded-[28px] p-7 bg-[#f5f5f7]"
          >
            <h3 className="text-[24px] font-semibold tracking-tight mb-2">{name}</h3>
            <p className="text-[16px] text-[#6e6e73] leading-snug">{text}</p>
            <span className="mt-auto w-14 h-14 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: color }}>
              <Icon size={26} />
            </span>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-14 md:mt-20">
        <div className="rounded-[32px] px-6 py-14 md:py-20 text-center bg-[#f5f5f7]">
          <div className="flex items-center justify-center gap-3 mb-6" aria-hidden="true">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0a84ff] text-white"><Nfc size={20} /></span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1d1d1f] text-white"><QrCode size={20} /></span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#bf5af2] text-white"><Palette size={20} /></span>
          </div>
          <h3 className="text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-tight leading-[1.1] mb-4">
            Leve o AirNext Stand<br className="hidden sm:block" /> para o seu balcão.
          </h3>
          <p className="text-[19px] text-[#6e6e73] max-w-xl mx-auto mb-8 leading-snug">
            Pagamento único, sem app e sem mensalidade. Personalize com a sua logo e comece a receber avaliações no Google.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onBuy}
              className="rounded-full bg-[#0071e3] px-7 py-3 text-[17px] font-medium text-white transition-colors hover:bg-[#0077ed]"
            >
              Comprar
            </button>
            <a
              href={`https://wa.me/${whatsapp}?text=${msg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full px-5 py-3 text-[17px] font-medium text-[#0066cc] hover:underline"
            >
              Falar no WhatsApp <ChevronRight size={18} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function StandStorySection(props: Props) {
  return (
    <>
      <StandHero />
      <StandChapters />
      <StandChange />
      <StandIntegrations {...props} />
    </>
  );
}
