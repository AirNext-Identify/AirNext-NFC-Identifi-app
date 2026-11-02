import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import {
  ChevronRight, Headphones, Lock, Nfc, Play, Plus, Truck, Wallet, X, Zap,
} from 'lucide-react';
import ArrowCarousel from './ArrowCarousel';
import {
  EVENTO_EXPOSITOR_IMG, PET_CAVALIER_TOQUE_IMG, PET_THOR_TAG_IMG, STAND_POSTO_IMG,
} from '../../lib/productImages';

interface Props {
  /** Vídeo do botão "Assistir ao vídeo" (editável em /painel-imagens → slot "video-demo"). */
  videoSrc: string;
  whatsapp: string;
}

// Destaques — cada cartão tem uma foto diferente (nenhuma repetida nas outras seções).
const HIGHLIGHTS = [
  { img: EVENTO_EXPOSITOR_IMG, eyebrow: 'Networking', title: 'Um toque.\nTodos os seus contatos.', alt: 'Expositor aproximando o cartão AirNext do celular de uma visitante' },
  { img: PET_CAVALIER_TOQUE_IMG, eyebrow: 'Pet', title: 'Aproxime o celular.\nO tutor aparece.', alt: 'Cachorro com a tag AirNext na coleira e um celular sendo aproximado' },
  { img: STAND_POSTO_IMG, eyebrow: 'Negócios', title: 'Seu balcão\nfala por você.', alt: 'Stand AirNext NFC sobre o balcão de um estabelecimento' },
  { img: PET_THOR_TAG_IMG, eyebrow: 'Sem app, sem bateria', title: 'Chip NFC.\nQR Code de backup.', alt: 'Mão aproximando o celular da tag NFC na coleira do Thor' },
];

const REASONS = [
  { eyebrow: 'Opções de pagamento', icon: <Wallet size={84} strokeWidth={1.2} />, title: 'Compre em até\n12 vezes.', text: 'Parcele com facilidade e sem mensalidade.', modalTitle: 'Pague do jeito que ficar melhor.', detail: 'Parcele em até 12x no cartão. Sem assinatura, sem mensalidade: você paga uma vez e usa para sempre.' },
  { eyebrow: 'Frete', icon: <Truck size={84} strokeWidth={1.2} />, title: 'Envio por\nnossa conta.', text: 'Frete grátis para todo o Brasil em compras acima de R$ 150.', modalTitle: 'Do nosso pedido à sua porta.', detail: 'Enviamos para todo o Brasil com rastreio. Em compras acima de R$ 150 o frete é por nossa conta.' },
  { eyebrow: 'Tecnologia', icon: <Zap size={84} strokeWidth={1.2} />, title: 'Sem app.\nSem bateria.', text: 'Aproxime o celular ou escaneie o QR Code.', modalTitle: 'Funciona na hora, em qualquer celular.', detail: 'O chip NFC dispensa bateria e aplicativo. Se o celular não tiver NFC, o QR Code de backup abre o mesmo perfil.' },
  { eyebrow: 'Perfil digital', icon: <Nfc size={84} strokeWidth={1.2} />, title: 'Sempre\natualizado.', text: 'Troque links, fotos e contatos quando quiser.', modalTitle: 'Mudou algo? Edite e pronto.', detail: 'Altere o perfil a qualquer momento pelo painel. Nada de reimprimir: o mesmo produto mostra sempre a versão mais recente.' },
  { eyebrow: 'Privacidade', icon: <Lock size={84} strokeWidth={1.2} />, title: 'Seus dados,\nsuas regras.', text: 'Você decide o que aparece e pode ocultar o perfil.', modalTitle: 'Privacidade por padrão.', detail: 'Você controla cada informação do perfil e segue a LGPD. Não vendemos nem compartilhamos dados de quem escaneia.' },
  { eyebrow: 'Suporte', icon: <Headphones size={84} strokeWidth={1.2} />, title: 'Ajuda de\nverdade.', text: 'Atendimento humano pelo WhatsApp.', modalTitle: 'Estamos com você.', detail: 'Nossa equipe ajuda a ativar, configurar e tirar dúvidas, direto pelo WhatsApp.' },
];

function VideoModal({ open, src, onClose }: { open: boolean; src: string; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} role="dialog" aria-modal="true" aria-label="Vídeo AirNext"
          className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
        >
          <button onClick={onClose} aria-label="Fechar vídeo" className="fixed top-5 right-5 z-[310] w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
            <X size={20} />
          </button>
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl aspect-video rounded-[24px] md:rounded-[32px] overflow-hidden bg-black"
          >
            <video src={src} className="absolute inset-0 w-full h-full object-cover" controls autoPlay loop playsInline />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function ReasonSheet({ reason, onClose, whatsapp }: { reason: typeof REASONS[number] | null; onClose: () => void; whatsapp: string }) {
  useEffect(() => {
    if (!reason) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reason, onClose]);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {reason && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          role="dialog" aria-modal="true" aria-label={reason.eyebrow}
          className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl bg-white text-[#1d1d1f] rounded-[32px] p-7 sm:p-10 pt-16 mb-4 sm:mb-0">
            <button onClick={onClose} aria-label="Fechar" className="absolute top-5 right-5 w-11 h-11 rounded-full bg-[#e8e8ed] hover:bg-[#dcdce1] flex items-center justify-center transition"><X size={18} /></button>
            <p className="text-[17px] font-semibold mb-3">{reason.eyebrow}</p>
            <h3 className="text-[32px] sm:text-[40px] font-bold tracking-tight leading-[1.08] mb-5">{reason.modalTitle}</h3>
            <p className="text-[18px] leading-relaxed mb-6">{reason.detail}</p>
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#0066cc] text-[17px] hover:underline">Saiba mais <ChevronRight size={16} /></a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/**
 * Estilo apple.com ("Comece pelos destaques" + "Motivos para comprar"),
 * no tema AirNext NFC. Substitui a antiga seção de sites personalizados.
 */
export default function AirNextHighlightsSection({ videoSrc, whatsapp }: Props) {
  const [videoOpen, setVideoOpen] = useState(false);
  const [reason, setReason] = useState<typeof REASONS[number] | null>(null);

  return (
    <>
      {/* ── Comece pelos destaques ── */}
      <section id="destaques-airnext" className="bg-black text-[#f5f5f7] py-20 md:py-28 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-5 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8 md:mb-12">
            <h2 className="text-[34px] md:text-6xl font-bold tracking-tight leading-[1.05]">
              Comece pelos destaques.
            </h2>
            <button
              onClick={() => setVideoOpen(true)}
              className="self-start md:self-auto inline-flex items-center gap-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur px-5 py-3 text-[15px] font-medium text-white transition"
            >
              <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center"><Play size={11} fill="currentColor" className="ml-px" /></span>
              Assistir ao vídeo
            </button>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto pl-5 md:pl-6">
          <Swiper
            modules={[Pagination]}
            pagination={{ clickable: true }}
            spaceBetween={14}
            slidesPerView={1.15}
            breakpoints={{ 640: { slidesPerView: 2.2, spaceBetween: 16 }, 1024: { slidesPerView: 3.1, spaceBetween: 20 }, 1400: { slidesPerView: 3.4, spaceBetween: 20 } }}
            className="w-full"
          >
            {HIGHLIGHTS.map((h) => (
              <SwiperSlide key={h.title}>
                <article className="relative aspect-[4/5] md:aspect-[3/4] rounded-[28px] md:rounded-[36px] overflow-hidden bg-[#1d1d1f]">
                  <img src={h.img} alt={h.alt} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/0 to-black/25" />
                  <div className="absolute top-0 inset-x-0 p-6 md:p-8">
                    <p className="text-[12px] font-semibold uppercase tracking-widest text-white/70 mb-2">{h.eyebrow}</p>
                    <h3 className="text-[24px] md:text-[30px] leading-[1.12] font-bold tracking-tight whitespace-pre-line text-white">{h.title}</h3>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* ── Motivos para comprar ── */}
      <section id="motivos-para-comprar" className="bg-[#f5f5f7] text-[#1d1d1f] py-20 md:py-28 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-5 md:px-6 mb-8 md:mb-12">
          <h2 className="text-[34px] md:text-6xl font-bold tracking-tight leading-[1.05] max-w-3xl mb-5">
            Motivos para comprar na AirNext.
          </h2>
          <a href="#produtos" className="inline-flex items-center gap-0.5 text-[#0066cc] text-[19px] hover:underline">
            Comprar AirNext <ChevronRight size={18} />
          </a>
        </div>

        <div className="max-w-[1400px] mx-auto">
          <ArrowCarousel itemClass="w-[82%] sm:w-[46%] lg:w-[31%]">
            {REASONS.map((r) => (
              <article key={r.eyebrow} className="relative h-[460px] md:h-[500px] rounded-[28px] md:rounded-[32px] bg-white p-7 md:p-9 flex flex-col overflow-hidden">
                <p className="text-[17px] font-semibold mb-2">{r.eyebrow}</p>
                <h3 className="text-[28px] md:text-[32px] font-bold tracking-tight leading-[1.1] whitespace-pre-line mb-3">{r.title}</h3>
                <p className="text-[17px] text-[#424245] leading-snug max-w-[18rem]">{r.text}</p>
                <div className="flex-1 flex items-center justify-center text-[#0071e3]">
                  <span className="w-36 h-36 rounded-[36px] bg-gradient-to-br from-[#e8f1fd] to-[#f5f5f7] flex items-center justify-center">{r.icon}</span>
                </div>
                <button onClick={() => setReason(r)} aria-label={`Saiba mais: ${r.eyebrow}`}
                  className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-[#e8e8ed] hover:bg-[#dcdce1] flex items-center justify-center transition text-[#424245]">
                  <Plus size={22} />
                </button>
              </article>
            ))}
          </ArrowCarousel>
        </div>
      </section>

      <ReasonSheet reason={reason} onClose={() => setReason(null)} whatsapp={whatsapp} />
      <VideoModal open={videoOpen} src={videoSrc} onClose={() => setVideoOpen(false)} />
    </>
  );
}
