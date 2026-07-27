import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Play, ArrowLeft, BookOpen, Smartphone, Zap, Shield, PawPrint, Users } from 'lucide-react';
import Logo from '../components/Logo';
import { Seo } from '../components/Seo';

type Tutorial = {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  /** URL do vídeo (MP4 ou página). Placeholder até você substituir pelos oficiais. */
  videoUrl: string;
  poster?: string;
  icon: React.ElementType;
};

const TUTORIALS: Tutorial[] = [
  {
    id: 'ativar',
    title: 'Como ativar seu produto AirNext',
    description: 'Do código de ativação ao primeiro perfil publicado, em poucos minutos.',
    category: 'Primeiros passos',
    duration: '2 min',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smart-phone-426-large.mp4',
    icon: Zap,
  },
  {
    id: 'nfc',
    title: 'Como funciona o NFC e o QR Code',
    description: 'Aproxime o celular ou escaneie o QR — sem instalar aplicativo.',
    category: 'Uso diário',
    duration: '1 min',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-network-connection-lines-and-dots-31580-large.mp4',
    icon: Smartphone,
  },
  {
    id: 'perfil',
    title: 'Personalizar seu perfil digital',
    description: 'Fotos, cores, blocos, redes e ordem das seções no painel.',
    category: 'Painel',
    duration: '3 min',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-working-on-her-laptop-4623-large.mp4',
    icon: Users,
  },
  {
    id: 'pet',
    title: 'Configurar o perfil Pet',
    description: 'Dados do animal, tutor, saúde e modo SOS se o pet se perder.',
    category: 'Pet',
    duration: '2 min',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-a-dog-running-on-grass-with-a-ball-43355-large.mp4',
    icon: PawPrint,
  },
  {
    id: 'tea',
    title: 'Cartão de apoio TEA',
    description: 'Grau de suporte, como ajudar, gatilhos e contatos de emergência.',
    category: 'TEA',
    duration: '2 min',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-mother-with-her-little-daughter-3028-large.mp4',
    icon: BookOpen,
  },
  {
    id: 'privacidade',
    title: 'Privacidade e controle dos dados',
    description: 'O que aparece no perfil público e como gerenciar consentimentos.',
    category: 'Segurança',
    duration: '2 min',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-security-camera-system-24926-large.mp4',
    icon: Shield,
  },
];

const CATEGORIES = ['Todos', ...Array.from(new Set(TUTORIALS.map((t) => t.category)))];

export default function SupportTutorialsPage() {
  const [filter, setFilter] = useState('Todos');
  const [active, setActive] = useState<Tutorial | null>(null);
  const list = filter === 'Todos' ? TUTORIALS : TUTORIALS.filter((t) => t.category === filter);

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-gray-900">
      <Seo
        title="Suporte e tutoriais"
        description="Vídeos tutoriais AirNext: ativar produto, NFC, personalizar perfil, pet, TEA e privacidade."
        path="/suporte"
      />

      {/* Nav */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Logo size="sm" />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft size={16} /> Voltar ao site
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[12px] font-semibold tracking-widest uppercase text-[#0071e3] mb-3">Suporte</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 mb-4">
            Tutoriais AirNext
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Aprenda a ativar, personalizar e usar seus produtos — em vídeos curtos, no ritmo da AirNext.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
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
                  <video
                    src={t.videoUrl}
                    muted
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
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

        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 mb-4">Ainda precisa de ajuda?</p>
          <a
            href="mailto:airnext.oficial@gmail.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition"
          >
            Falar com o suporte
          </a>
          <p className="mt-3 text-xs text-gray-400">
            <Link to="/#faq" className="hover:text-gray-600 underline-offset-2 hover:underline">
              Ver perguntas frequentes
            </Link>
          </p>
        </div>
      </main>

      {/* Player modal */}
      {active && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
        >
          <div
            className="w-full max-w-3xl rounded-[28px] overflow-hidden bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video bg-black">
              <video
                key={active.id}
                src={active.videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-5 bg-[#111] text-white flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1">{active.category}</p>
                <h3 className="text-lg font-semibold">{active.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{active.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="shrink-0 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
