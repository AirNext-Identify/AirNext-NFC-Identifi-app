import { Eye, Lock, Shield, Target, Zap } from 'lucide-react';
import ArrowCarousel from './ArrowCarousel';

const CARDS = [
  { icon: <Lock size={96} strokeWidth={1} />, color: '#0071e3', lead: 'Criptografia ponta a ponta.', text: 'Cada chip NFC é gravado com criptografia AES-256 e chaves no padrão oficial do fórum NFC, praticamente impossível de clonar.', chips: ['AES-256', 'NFC Forum'] },
  { icon: <Eye size={96} strokeWidth={1} />, color: '#34c759', lead: 'Você no controle total.', text: 'Ative, edite ou oculte qualquer link do seu perfil em segundos. Nada aparece sem a sua permissão.', chips: ['Perfil público', 'Oculto'] },
  { icon: <Target size={96} strokeWidth={1} />, color: '#ff9500', lead: 'Zero rastreamento comercial.', text: 'Não vendemos, não compartilhamos e não monitoramos o comportamento de quem escaneia o seu perfil.', chips: ['0 anúncios', '0 venda de dados'] },
  { icon: <Zap size={96} strokeWidth={1} />, color: '#af52de', lead: 'Monitoramento 24/7.', text: 'Infraestrutura com detecção automática de anomalias e resposta a incidentes em tempo real, todos os dias.', chips: ['24/7', 'Tempo real'] },
  { icon: <Shield size={96} strokeWidth={1} />, color: '#00b4d8', lead: 'Em conformidade com a LGPD.', text: 'Privacidade dos dados e 100% de controle do perfil, do cadastro à exclusão da conta.', chips: ['LGPD', '100% seu'] },
];

/** Estilo apple.com ("Na forma que seu dia pedir"): cartões grandes com legenda embaixo e setas. */
export default function PrivacyShowcaseSection() {
  return (
    <section id="seguranca" className="bg-white text-[#1d1d1f] py-20 md:py-28 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-5 md:px-6 mb-8 md:mb-12">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-[#0071e3] mb-4">Privacidade por padrão · Segurança de nível bancário</p>
        <h2 className="text-[34px] md:text-6xl font-bold tracking-tight leading-[1.05] max-w-4xl">
          Seus dados. Suas regras. <span className="text-[#6e6e73]">Inteligência que protege.</span>
        </h2>
      </div>

      <div className="max-w-[1400px] mx-auto">
        <ArrowCarousel itemClass="w-[86%] sm:w-[52%] lg:w-[34%]">
          {CARDS.map((c) => (
            <article key={c.lead}>
              <div className="relative aspect-[4/5] rounded-[28px] md:rounded-[36px] overflow-hidden bg-[#f5f5f7] flex items-center justify-center">
                <span className="relative w-40 h-40 md:w-48 md:h-48 rounded-[44px] bg-white flex items-center justify-center shadow-[0_2px_16px_rgba(0,0,0,0.06)]" style={{ color: c.color }}>{c.icon}</span>
                <div className="absolute bottom-5 inset-x-5 flex flex-wrap gap-2 justify-center">
                  {c.chips.map((t) => (
                    <span key={t} className="px-3 py-1.5 rounded-full text-[12px] font-medium text-[#1d1d1f] bg-white border border-black/5">{t}</span>
                  ))}
                </div>
              </div>
              <p className="mt-6 px-1 md:px-3 text-[17px] leading-snug text-[#6e6e73]">
                <span className="font-semibold text-[#1d1d1f]">{c.lead}</span> {c.text}
              </p>
            </article>
          ))}
        </ArrowCarousel>
      </div>
    </section>
  );
}
