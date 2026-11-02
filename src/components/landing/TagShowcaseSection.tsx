import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, Plus } from 'lucide-react';

const SLIDES = [
  { img: '/img/airnext-contato-1.webp', label: 'Um toque', title: 'Um toque.', text: 'Aproxime o celular da AirNext Tag e a outra pessoa recebe seu perfil completo na hora. Sem digitar número, sem pedir app.', alt: 'Duas pessoas trocando contato ao aproximar os celulares' },
  { img: '/img/airnext-contato-2.webp', label: 'Em qualquer lugar', title: 'Reuniões, eventos e balcões.', text: 'Trocar contatos vira um gesto de segundos. Você se apresenta com um toque e a conversa continua.', alt: 'Cliente aproximando o celular da tag AirNext em uma cafeteria' },
  { img: '/img/airnext-contato-3.webp', label: 'Perfil completo', title: 'Um perfil, todos os canais.', text: 'Telefone, WhatsApp, e-mail, site, localização e redes sociais reunidos em uma única página, aberta direto no navegador.', alt: 'Celular lendo a tag NFC AirNext e abrindo o perfil digital' },
  { img: '/img/airnext-contato-4.webp', label: 'Sempre atualizado', title: 'Mudou o telefone?', text: 'A tag continua a mesma. Edite cargo, links e contatos quando quiser — quem tocar sempre vê a versão mais recente.', alt: 'Perfil digital AirNext aberto no celular' },
  { img: '/img/airnext-contato-5.webp', label: 'Resistente', title: 'Cabe em qualquer lugar.', text: 'NFC compatível com Android e iOS, material ABS premium, resistente à água (IP68), com 20,5 mm e apenas 3 g.', alt: 'Especificações da AirNext Tag e perfil digital' },
];

interface Props { whatsapp: string; onBuy: () => void }

export default function TagShowcaseSection({ whatsapp, onBuy }: Props) {
  const [active, setActive] = useState(0);
  const touchX = useRef<number | null>(null);
  const go = (i: number) => setActive((i + SLIDES.length) % SLIDES.length);
  const slide = SLIDES[active];

  return (
    <section id="airnext-tag" className="relative bg-[#f5f5f7] text-[#1d1d1f] pb-20 pt-16 sm:pb-28 sm:pt-24">
      <div className="mx-auto max-w-5xl px-5">
        {/* Barra flutuante de produto (como no apple.com) */}
        <div className="sticky top-16 z-20 mx-auto mb-10 flex max-w-xl items-center justify-between rounded-[22px] border border-black/5 bg-white/80 py-2 pl-5 pr-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)] backdrop-blur-xl md:top-28">
          <span className="text-[17px] font-semibold tracking-tight">AirNext Tag</span>
          <div className="flex items-center gap-2">
            <a href={whatsapp} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#1d1d1f]/60 px-4 py-1.5 text-[13px] font-medium text-[#1d1d1f] transition-colors hover:bg-black/5">
              <MessageCircle size={13} /> Explorar
            </a>
            <button onClick={onBuy}
              className="rounded-full bg-[#0071e3] px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#0077ed]">
              Comprar
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-[680px]">
          <h2 className="text-[34px] font-semibold leading-[1.1] tracking-tight sm:text-[48px]">
            Compartilhe seu contato com um toque.
          </h2>
          <p className="mt-4 max-w-[34ch] text-[19px] leading-snug text-[#6e6e73] sm:text-[21px]">
            Aproxime, conecte e pronto. Seu perfil digital completo chega ao celular de quem você encontra.
          </p>
        </div>

        {/* Cartão grande arredondado */}
        <div
          className="relative mx-auto mt-10 max-w-[680px] overflow-hidden rounded-[28px] bg-white"
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 45) go(active + (dx < 0 ? 1 : -1));
            touchX.current = null;
          }}
        >
          <div className="relative aspect-[4/5] w-full sm:aspect-[5/5]">
            {SLIDES.map((s, i) => (
              <img key={s.img} src={s.img} alt={s.alt} width={720} height={i === 4 ? 1080 : 960}
                loading={i === 0 ? 'eager' : 'lazy'} decoding="async"
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${active === i ? 'opacity-100' : 'opacity-0'}`} />
            ))}
          </div>
          <button onClick={() => go(active + 1)} aria-label="Próximo"
            className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/70">
            <Plus size={18} />
          </button>
        </div>

        {/* Controle em pílulas + seta */}
        <div className="mx-auto mt-6 flex max-w-[680px] items-center justify-center gap-2">
          <button onClick={() => go(active - 1)} aria-label="Anterior"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#e8e8ed] text-[#1d1d1f] transition-colors hover:bg-[#dcdce1]">
            <ChevronLeft size={18} />
          </button>
          <div role="tablist" className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-[#e8e8ed] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SLIDES.map((s, i) => (
              <button key={s.label} role="tab" aria-selected={active === i} onClick={() => go(i)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${active === i ? 'bg-[#1d1d1f] text-white' : 'text-[#1d1d1f] hover:bg-black/5'}`}>
                {s.label}
              </button>
            ))}
          </div>
          <button onClick={() => go(active + 1)} aria-label="Próximo"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#e8e8ed] text-[#1d1d1f] transition-colors hover:bg-[#dcdce1]">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Legenda */}
        <p key={active} className="mx-auto mt-6 max-w-[460px] text-center text-[15px] leading-snug text-[#6e6e73]">
          <strong className="font-semibold text-[#1d1d1f]">{slide.title}</strong> {slide.text}
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button onClick={onBuy}
            className="rounded-full bg-[#0071e3] px-7 py-3 text-[17px] font-medium text-white transition-colors hover:bg-[#0077ed]">
            Comprar
          </button>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full px-5 py-3 text-[17px] font-medium text-[#0066cc] hover:underline">
            Falar no WhatsApp <ChevronRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
