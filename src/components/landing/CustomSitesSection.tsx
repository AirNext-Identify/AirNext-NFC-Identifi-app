import { motion } from 'framer-motion';
import { Check, MessageCircle, Globe, Smartphone } from 'lucide-react';

interface Props {
  whatsapp: string;
}

const FEATURES = [
  'Sites institucionais e landing pages que convertem',
  'Lojas virtuais e catálogos de produtos',
  'Integração com NFC, QR Code e perfis AirNext',
  'Design responsivo, rápido e otimizado para o Google',
];

export default function CustomSitesSection({ whatsapp }: Props) {
  const msg = encodeURIComponent('Olá! Quero um orçamento para criar um site personalizado para o meu negócio.');

  return (
    <section
      id="sites-personalizados"
      className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-br from-[#0b1020] via-[#0a0a0f] to-[#14102b] text-white"
    >
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#0071e3]/20 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-16 w-96 h-96 rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Mockup: janela de navegador + celular */}
        <div className="relative mx-auto w-full max-w-xl pb-10 sm:pb-0" aria-hidden="true">
          <div className="rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl shadow-black/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.03]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              <div className="ml-3 flex-1 flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] text-[11px] text-gray-400">
                <Globe size={11} /> seunegocio.com.br
              </div>
            </div>
            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 rounded-full bg-white/80" />
                <div className="flex gap-3">
                  <div className="h-2 w-10 rounded-full bg-white/20" />
                  <div className="h-2 w-10 rounded-full bg-white/20" />
                  <div className="h-2 w-10 rounded-full bg-white/20" />
                </div>
              </div>
              <div className="space-y-3 pt-4">
                <div className="h-5 w-3/4 rounded-full bg-white/90" />
                <div className="h-5 w-1/2 rounded-full bg-white/90" />
                <div className="h-2.5 w-2/3 rounded-full bg-white/25 mt-4" />
                <div className="h-2.5 w-1/2 rounded-full bg-white/25" />
              </div>
              <div className="h-9 w-32 rounded-full bg-[#0071e3]" />
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[0, 1, 2].map(i => (
                  <div key={i} className="aspect-[4/3] rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10" />
                ))}
              </div>
            </div>
          </div>

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-2 right-2 sm:-right-6 w-[34%] max-w-[170px] rounded-[26px] border-[5px] border-[#1d1d27] bg-[#12121a] shadow-2xl shadow-black/60 overflow-hidden"
          >
            <div className="flex justify-center pt-2"><span className="w-10 h-1 rounded-full bg-white/20" /></div>
            <div className="p-3 space-y-2.5">
              <div className="h-3 w-4/5 rounded-full bg-white/90" />
              <div className="h-3 w-3/5 rounded-full bg-white/90" />
              <div className="h-2 w-full rounded-full bg-white/20" />
              <div className="h-7 w-full rounded-full bg-[#0071e3] flex items-center justify-center"><Smartphone size={12} /></div>
              <div className="aspect-[4/3] rounded-lg bg-white/[0.06] border border-white/10" />
            </div>
          </motion.div>
        </div>

        {/* Texto */}
        <div>
          <p className="eyebrow text-[#4da3ff] mb-3">Sites personalizados</p>
          <h2 className="h2-apple mb-5">Também criamos o site do seu negócio.</h2>
          <p className="text-lg leading-relaxed text-gray-400 mb-8 max-w-xl">
            Além dos produtos NFC, a AirNext desenvolve sites sob medida — do desenho à publicação. Tudo com a
            identidade da sua marca e conectado às suas placas, cartões e perfis digitais.
          </p>

          <ul className="space-y-3.5 mb-10">
            {FEATURES.map(f => (
              <li key={f} className="flex items-start gap-3 text-[15px] text-gray-200">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#0071e3]/20 text-[#4da3ff] flex items-center justify-center"><Check size={13} /></span>
                {f}
              </li>
            ))}
          </ul>

          <a
            href={`https://wa.me/${whatsapp}?text=${msg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#0071e3] text-white px-7 py-3.5 rounded-full text-sm font-bold hover:bg-[#0077ed] active:scale-[0.98] transition shadow-xl shadow-blue-500/25"
          >
            <MessageCircle size={16} /> Pedir orçamento
          </a>
        </div>
      </div>
    </section>
  );
}
