import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { Star, Nfc, QrCode, Zap, ArrowRight, MessageCircle } from 'lucide-react';
import { GOOGLE_SHOWCASE } from '../../lib/productImages';

interface Props {
  isDark: boolean;
  whatsapp: string;
  onBuy: () => void;
}

const BENEFITS = [
  { icon: Nfc, title: 'Um toque ou QR Code', text: 'O cliente aproxima o celular ou escaneia — sem baixar nada.' },
  { icon: Star, title: 'Direto na avaliação', text: 'Abre a tela de avaliação do seu negócio no Google, pronta para as estrelas.' },
  { icon: QrCode, title: 'Preta ou branca', text: 'Para parede, mesa ou balcão com suporte, combinando com o seu ambiente.' },
  { icon: Zap, title: 'Sem app e sem mensalidade', text: 'Pagamento único. Acrílico premium com acabamento brilhante.' },
];

export default function GooglePlaquesSection({ isDark, whatsapp, onBuy }: Props) {
  const msg = encodeURIComponent('Olá! Quero saber mais sobre a plaquinha de avaliação do Google AirNext.');

  return (
    <section
      id="plaquinhas-google"
      className={`py-20 md:py-28 overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}`}
    >
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Texto */}
        <div className="order-2 lg:order-1">
          <p className="eyebrow text-[#4285f4] mb-3">Em alta</p>
          <h2 className="h2-apple mb-5">Sua próxima avaliação 5 estrelas está a um toque.</h2>
          <p className={`text-lg leading-relaxed mb-8 max-w-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            As plaquinhas de avaliação do Google viraram item obrigatório em restaurantes, clínicas, salões e lojas.
            Com a AirNext, o cliente satisfeito avalia na hora, ainda no balcão — e a sua reputação no Google cresce
            sem você precisar pedir.
          </p>

          <div className="grid sm:grid-cols-2 gap-5 mb-10">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-3.5">
                <span className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/10 text-[#8ab4f8]' : 'bg-[#f5f5f7] text-[#4285f4]'}`}>
                  <Icon size={19} />
                </span>
                <div>
                  <p className="text-sm font-semibold mb-0.5">{title}</p>
                  <p className={`text-[13px] leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onBuy}
              className="inline-flex items-center gap-2 bg-[#0071e3] text-white px-7 py-3.5 rounded-full text-sm font-bold hover:bg-[#0077ed] active:scale-[0.98] transition shadow-xl shadow-blue-500/20"
            >
              Quero a minha plaquinha <ArrowRight size={16} />
            </button>
            <a
              href={`https://wa.me/${whatsapp}?text=${msg}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold border transition ${isDark ? 'border-white/20 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              <MessageCircle size={16} /> Falar no WhatsApp
            </a>
          </div>
        </div>

        {/* Slider */}
        <div className="order-1 lg:order-2 min-w-0">
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={16}
            slidesPerView={1.08}
            centeredSlides
            loop
            autoplay={{ delay: 3800, disableOnInteraction: true, pauseOnMouseEnter: true }}
            pagination={{ clickable: true }}
            breakpoints={{ 640: { slidesPerView: 1.25 }, 1024: { slidesPerView: 1.15 } }}
            className="pb-12"
            aria-label="Fotos das plaquinhas de avaliação Google"
          >
            {GOOGLE_SHOWCASE.map((s, i) => (
              <SwiperSlide key={s.src}>
                <figure className={`relative aspect-square rounded-[32px] overflow-hidden border ${isDark ? 'border-white/10' : 'border-gray-200'} shadow-xl`}>
                  <img
                    src={s.src}
                    alt={s.alt}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="w-full h-full object-cover hover:scale-[1.04] transition-transform duration-700 ease-out"
                  />
                  <figcaption className="absolute left-4 bottom-4 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-md text-white">
                    {s.label}
                  </figcaption>
                </figure>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
