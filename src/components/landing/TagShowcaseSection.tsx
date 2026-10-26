import { useEffect, useRef, useState } from 'react';
import { ArrowRight, MessageCircle, Nfc } from 'lucide-react';

const SLIDES = [
  { img: '/img/airnext-contato-1.webp', kicker: 'Compartilhe contatos', title: 'Seu contato a um toque', text: 'Aproxime o celular da AirNext Tag e a outra pessoa recebe seu perfil completo na hora. Sem digitar número, sem pedir app.', alt: 'Duas pessoas trocando contato ao aproximar os celulares' },
  { img: '/img/airnext-contato-2.webp', kicker: 'Networking sem atrito', title: 'Em reuniões, eventos e balcões', text: 'Trocar contatos vira um gesto de segundos. Você se apresenta com um toque e a conversa continua.', alt: 'Cliente aproximando o celular da tag AirNext em uma cafeteria' },
  { img: '/img/airnext-contato-3.webp', kicker: 'Tudo na tela', title: 'Um perfil, todos os canais', text: 'Telefone, WhatsApp, e-mail, site, localização e redes sociais reunidos em uma única página, aberta direto no navegador.', alt: 'Celular lendo a tag NFC AirNext e abrindo o perfil digital' },
  { img: '/img/airnext-contato-4.webp', kicker: 'Sempre atualizado', title: 'Mudou o telefone? A tag continua a mesma', text: 'Edite cargo, links e contatos quando quiser. Quem tocar na tag sempre vê a versão mais recente.', alt: 'Perfil digital AirNext aberto no celular' },
  { img: '/img/airnext-contato-5.webp', kicker: 'Pequena e resistente', title: 'Cabe em qualquer lugar', text: 'NFC compatível com Android e iOS, material ABS premium, resistente à água (IP68), com 20,5 mm e apenas 3 g.', alt: 'Especificações da AirNext Tag e perfil digital' },
];

interface Props { whatsapp: string; onBuy: () => void }

export default function TagShowcaseSection({ whatsapp, onBuy }: Props) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)').matches;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i)); }),
      { rootMargin: wide ? '-45% 0px -45% 0px' : '-62% 0px -28% 0px' }
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section id="airnext-tag" className="relative bg-[#04060d] text-white py-20 sm:py-28 overflow-clip">
      <div className="relative mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
            <Nfc size={14} /> AirNext Tag
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl">Compartilhe seu contato com um toque</h2>
          <p className="mt-4 text-base text-slate-400 sm:text-lg">Aproxime, conecte e pronto. Seu perfil digital completo chega ao celular de quem você encontra.</p>
        </div>

        <div className="mt-12 lg:grid lg:grid-cols-2 lg:gap-16">
          <div className="sticky top-[84px] z-10 -mx-5 bg-[#04060d] px-5 pb-3 pt-2 lg:top-0 lg:mx-0 lg:flex lg:h-screen lg:items-center lg:bg-transparent lg:p-0">
            <div className="relative mx-auto h-[44vh] w-full max-w-[380px] overflow-hidden rounded-[28px] border border-white/10 shadow-md lg:h-[78vh] lg:max-h-[720px]">
              {SLIDES.map((s, i) => (
                <img key={s.img} src={s.img} alt={s.alt} width={720} height={i === 4 ? 1080 : 960}
                  loading={i === 0 ? 'eager' : 'lazy'} decoding="async"
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${active === i ? 'opacity-100' : 'opacity-0'}`} />
              ))}
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/45 px-3 py-1.5 backdrop-blur">
                {SLIDES.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${active === i ? 'w-6 bg-cyan-300' : 'w-1.5 bg-white/40'}`} />)}
              </div>
            </div>
          </div>

          <div>
            {SLIDES.map((s, i) => (
              <div key={i} data-i={i} ref={(el) => { refs.current[i] = el; }} className="flex min-h-[46vh] items-center py-6 lg:min-h-[85vh]">
                <div className={`rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-7 transition-all duration-500 sm:p-9 ${active === i ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-40'}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">{String(i + 1).padStart(2, '0')} · {s.kicker}</p>
                  <h3 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">{s.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-slate-400">{s.text}</p>
                </div>
              </div>
            ))}
            <div className="flex flex-col gap-3 pb-4 pt-6 sm:flex-row">
              <button onClick={onBuy} className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 font-bold text-white shadow-md transition-transform hover:-translate-y-0.5">
                Quero minha AirNext Tag <ArrowRight size={18} />
              </button>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-7 py-3.5 font-bold text-white transition-colors hover:bg-white/5">
                <MessageCircle size={18} /> Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
