import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { AnimatePresence } from 'framer-motion';
import { Star, Nfc, QrCode, Zap, ArrowRight, MessageCircle, ZoomIn } from 'lucide-react';
import { GOOGLE_SHOWCASE } from '../../lib/productImages';
import ImageLightbox from './ImageLightbox';

interface Props {
  isDark: boolean;
  whatsapp: string;
  onBuy: () => void;
}

const BENEFITS = [
  { icon: Nfc, title: 'Um toque ou QR Code', text: 'Aproxima o celular ou escaneia — sem baixar nada.' },
  { icon: Star, title: 'Direto na avaliação', text: 'Abre a tela de avaliação do seu negócio no Google.' },
  { icon: QrCode, title: 'Preta ou branca', text: 'Para parede, mesa ou balcão com suporte.' },
  { icon: Zap, title: 'Sem app e sem mensalidade', text: 'Pagamento único, acrílico premium.' },
];

export default function GooglePlaquesSection({ isDark, whatsapp, onBuy }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const msg = encodeURIComponent('Olá! Quero saber mais sobre a plaquinha de avaliação do Google AirNext.');
  const images = GOOGLE_SHOWCASE.map(s => s.src);

  return (
    <section
      id="plaquinhas-google"
      className={`py-14 md:py-20 overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}`}
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Texto + benefícios (compacto) */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center mb-10 md:mb-12">
          <div>
            <p className="eyebrow text-[#4285f4] mb-3">Em alta</p>
            <h2 className="h2-apple mb-4">Sua próxima avaliação 5 estrelas está a um toque.</h2>
            <p className={`text-base md:text-lg leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              As plaquinhas de avaliação do Google viraram item obrigatório em restaurantes, clínicas, salões e lojas.
              O cliente satisfeito avalia na hora, ainda no balcão — e a sua reputação no Google cresce sem você pedir.
            </p>
          </div>

          <div>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5 mb-7">
              {BENEFITS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-3">
                  <span className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/10 text-[#8ab4f8]' : 'bg-[#f5f5f7] text-[#4285f4]'}`}>
                    <Icon size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-tight mb-0.5">{title}</p>
                    <p className="text-[13px] leading-snug text-gray-500">{text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onBuy}
                className="inline-flex items-center gap-2 bg-[#0071e3] text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-[#0077ed] active:scale-[0.98] transition shadow-lg shadow-blue-500/20"
              >
                Quero a minha plaquinha <ArrowRight size={16} />
              </button>
              <a
                href={`https://wa.me/${whatsapp}?text=${msg}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold border transition ${isDark ? 'border-white/20 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Fileira de fotos — várias visíveis de uma vez, como a fileira de produtos */}
        <Swiper
          modules={[Pagination]}
          spaceBetween={16}
          slidesPerView={1.4}
          pagination={{ clickable: true }}
          breakpoints={{ 640: { slidesPerView: 2.4 }, 1024: { slidesPerView: 4 } }}
          className="pb-10"
          aria-label="Fotos das plaquinhas de avaliação Google"
        >
          {GOOGLE_SHOWCASE.map((s, i) => (
            <SwiperSlide key={s.src}>
              <figure
                onClick={() => setOpen(i)}
                className={`group relative aspect-square rounded-3xl overflow-hidden ring-1 cursor-zoom-in transition-shadow duration-500 hover:shadow-2xl ${isDark ? 'ring-white/10 hover:shadow-black/70' : 'ring-black/[0.06] hover:shadow-black/10'}`}
              >
                <img
                  src={s.src}
                  alt={s.alt}
                  loading={i < 3 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                />
                <figcaption className="absolute left-3 bottom-3 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md text-white">
                  {s.label}
                </figcaption>
                <span className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/45 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn size={14} />
                </span>
              </figure>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <AnimatePresence>
        {open !== null && <ImageLightbox images={images} index={open} name="Plaquinhas de avaliação Google AirNext" onChange={setOpen} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </section>
  );
}
