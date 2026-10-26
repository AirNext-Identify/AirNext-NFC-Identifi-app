import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  Play, ArrowLeft, ArrowRight, ArrowUp, BookOpen, ChevronDown, Search, Smartphone, X,
  Zap, Shield, PawPrint, Users, MessageCircle,
} from 'lucide-react';
import Logo from '../components/Logo';
import { Seo } from '../components/Seo';
import { AIRNEXT_FAQ } from '../config/aiContent';
import { COMBO_KIT_IMG, GOOGLE_SHOWCASE, STAND_GOOGLE_NFC_IMG } from '../lib/productImages';

type Tutorial = {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  /** URL do vídeo (MP4 ou página). Placeholder até você substituir pelos oficiais. */
  videoUrl: string;
  /** Imagem de capa (carrega rápido, sem baixar o vídeo na lista). */
  poster: string;
  icon: React.ElementType;
};

const PET_POSTER = 'https://images.pexels.com/photos/15075137/pexels-photo-15075137.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
const TEA_POSTER = 'https://images.pexels.com/photos/8944295/pexels-photo-8944295.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';

const TUTORIALS: Tutorial[] = [
  {
    id: 'ativar',
    poster: COMBO_KIT_IMG,
    title: 'Como ativar seu produto AirNext',
    description: 'Do código de ativação ao primeiro perfil publicado, em poucos minutos.',
    category: 'Primeiros passos',
    duration: '2 min',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smart-phone-426-large.mp4',
    icon: Zap,
  },
  {
    id: 'nfc',
    poster: STAND_GOOGLE_NFC_IMG,
    title: 'Como funciona o NFC e o QR Code',
    description: 'Aproxime o celular ou escaneie o QR — sem instalar aplicativo.',
    category: 'Uso diário',
    duration: '1 min',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-network-connection-lines-and-dots-31580-large.mp4',
    icon: Smartphone,
  },
  {
    id: 'perfil',
    poster: GOOGLE_SHOWCASE[2].src,
    title: 'Personalizar seu perfil digital',
    description: 'Fotos, cores, blocos, redes e ordem das seções no painel.',
    category: 'Painel',
    duration: '3 min',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-working-on-her-laptop-4623-large.mp4',
    icon: Users,
  },
  {
    id: 'pet',
    poster: PET_POSTER,
    title: 'Configurar o perfil Pet',
    description: 'Dados do animal, tutor, saúde e modo SOS se o pet se perder.',
    category: 'Pet',
    duration: '2 min',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-a-dog-running-on-grass-with-a-ball-43355-large.mp4',
    icon: PawPrint,
  },
  {
    id: 'tea',
    poster: TEA_POSTER,
    title: 'Cartão de apoio TEA',
    description: 'Grau de suporte, como ajudar, gatilhos e contatos de emergência.',
    category: 'TEA',
    duration: '2 min',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-mother-with-her-little-daughter-3028-large.mp4',
    icon: BookOpen,
  },
  {
    id: 'privacidade',
    poster: GOOGLE_SHOWCASE[0].src,
    title: 'Privacidade e controle dos dados',
    description: 'O que aparece no perfil público e como gerenciar consentimentos.',
    category: 'Segurança',
    duration: '2 min',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-security-camera-system-24926-large.mp4',
    icon: Shield,
  },
];

const CATEGORIES = ['Todos', ...Array.from(new Set(TUTORIALS.map((t) => t.category)))];
const WHATSAPP = '5547996287761';

export default function SupportTutorialsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [filter, setFilter] = useState('Todos');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Tutorial | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showTop, setShowTop] = useState(false);

  const goBack = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate('/');
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TUTORIALS.filter(
      (t) =>
        (filter === 'Todos' || t.category === filter) &&
        (!q || `${t.title} ${t.description} ${t.category}`.toLowerCase().includes(q))
    );
  }, [filter, query]);

  // Modal: ESC fecha, trava a rolagem do fundo.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setActive(null);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [active]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const nextTutorial = () => {
    if (!active) return;
    const i = TUTORIALS.findIndex((t) => t.id === active.id);
    setActive(TUTORIALS[(i + 1) % TUTORIALS.length]);
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-gray-900">
      <Seo
        title="Suporte e tutoriais"
        description="Vídeos tutoriais AirNext: ativar produto, NFC, personalizar perfil, pet, TEA e privacidade."
        path="/suporte"
      />

      {/* Nav */}
      <header className="sticky top-0 z-40 bg-[#05070f]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition"
            aria-label="Voltar"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <Logo size="xs" to="/" />
          <Link
            to="/"
            className="rounded-full p-2 text-zinc-300 hover:bg-white/10 hover:text-white transition"
            aria-label="Fechar e ir para o início"
          >
            <X size={20} />
          </Link>
        </div>
      </header>

      {/* Hero com imagem */}
      <section className="relative overflow-hidden bg-[#05070f] text-white">
        <img
          src={COMBO_KIT_IMG}
          alt="Kit de produtos AirNext com cartão, tag e pulseira NFC"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070f]/40 via-[#05070f]/70 to-[#fbfbfd]" />
        <div className="relative max-w-3xl mx-auto px-6 pt-14 pb-20 text-center">
          <p className="text-[12px] font-semibold tracking-widest uppercase text-[#60a5fa] mb-3">Suporte</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">Tutoriais AirNext</h1>
          <p className="text-lg text-zinc-300 leading-relaxed">
            Aprenda a ativar, personalizar e usar seus produtos — em vídeos curtos, no ritmo da AirNext.
          </p>
          <div className="mx-auto mt-8 flex max-w-md items-center gap-2 rounded-full bg-white px-4 py-3 shadow-xl">
            <Search size={18} className="text-gray-400 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar: ativar, NFC, pet, privacidade..."
              className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              aria-label="Buscar tutoriais"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Limpar busca" className="text-gray-400 hover:text-gray-700">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 -mt-6 pb-24">
        {/* Filtros (rolam na horizontal no celular) */}
        <div className="-mx-6 px-6 mb-10 flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:justify-center sm:overflow-visible">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                filter === c
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Grid */}
        {list.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-gray-700 font-semibold">Nenhum tutorial encontrado</p>
            <p className="mt-1 text-sm text-gray-500">Tente outra palavra ou limpe os filtros.</p>
            <button
              type="button"
              onClick={() => { setQuery(''); setFilter('Todos'); }}
              className="mt-4 rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white"
            >
              Ver todos
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActive(t)}
                  className="group text-left rounded-[24px] overflow-hidden bg-white border border-black/[0.06] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                    <img
                      src={t.poster}
                      alt={t.title}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="w-14 h-14 rounded-full bg-white/95 shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play size={22} className="text-gray-900 ml-0.5" fill="currentColor" />
                      </span>
                    </div>
                    <span className="absolute bottom-3 right-3 text-[11px] font-bold text-white/90 bg-black/40 backdrop-blur px-2 py-1 rounded-full">
                      {t.duration}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-7 h-7 rounded-lg bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                        <Icon size={14} />
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t.category}</span>
                    </div>
                    <h2 className="text-[17px] font-semibold text-gray-900 leading-snug mb-1.5 group-hover:text-[#0071e3] transition-colors">
                      {t.title}
                    </h2>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{t.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* FAQ */}
        <section className="mt-20 max-w-3xl mx-auto" aria-labelledby="faq-title">
          <h2 id="faq-title" className="text-2xl md:text-3xl font-semibold tracking-tight text-center mb-8">
            Perguntas frequentes
          </h2>
          <div className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {AIRNEXT_FAQ.slice(0, 6).map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.question}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50 transition"
                  >
                    {f.question}
                    <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm leading-relaxed text-gray-500">{f.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Contato */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 mb-4">Ainda precisa de ajuda?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="mailto:contato@airnext.com.br"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition"
            >
              Falar com o suporte <ArrowRight size={15} />
            </a>
            <a
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Olá! Preciso de ajuda com meu produto AirNext.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gray-300 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
            >
              <MessageCircle size={15} /> WhatsApp
            </a>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            <Link to="/politica-de-privacidade" className="hover:text-gray-600 underline-offset-2 hover:underline">Privacidade</Link>
            {' · '}
            <Link to="/termos-de-uso" className="hover:text-gray-600 underline-offset-2 hover:underline">Termos de uso</Link>
            {' · '}
            <Link to="/politica-de-cookies" className="hover:text-gray-600 underline-offset-2 hover:underline">Cookies</Link>
          </p>
        </div>
      </main>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Voltar ao topo"
        className={`fixed bottom-5 right-5 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition-all duration-300 hover:bg-gray-700 ${
          showTop && !active ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        <ArrowUp size={18} />
      </button>

      {/* Player: tela cheia no celular, janela no desktop */}
      {active && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex sm:items-center sm:justify-center sm:p-4"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
        >
          <div
            className="flex h-full w-full flex-col bg-[#0b0b0d] sm:h-auto sm:max-w-3xl sm:rounded-[28px] sm:overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2 sm:hidden">
              <button
                type="button"
                onClick={() => setActive(null)}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                <ArrowLeft size={16} /> Voltar
              </button>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
            <div className="aspect-video bg-black shrink-0">
              <video
                key={active.id}
                src={active.videoUrl}
                poster={active.poster}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1">{active.category} · {active.duration}</p>
                  <h3 className="text-lg font-semibold">{active.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{active.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="hidden sm:flex shrink-0 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center"
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>
              </div>
              <button
                type="button"
                onClick={nextTutorial}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition"
              >
                Próximo tutorial <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
