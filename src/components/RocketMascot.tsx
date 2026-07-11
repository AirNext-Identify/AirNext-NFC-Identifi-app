/**
 * Mascote Foguete da AirNext.
 *
 * Sobrevoa a tela em loop (login/cadastro) e "encosta" no logo no meio do
 * trajeto — o brilho ao redor da logo (ver `logo-touch-glow` em index.css)
 * é sincronizado com o mesmo tempo de animação para dar a sensação de
 * toque físico. É puramente decorativo: `pointer-events-none` e `aria-hidden`
 * para não atrapalhar leitores de tela nem cliques.
 *
 * Substitui o antigo mascote astronauta — mesma "coreografia" de voo
 * (rocket-fly reaproveita a trajetória em arco), agora com um foguete
 * com chama animada no propulsor e cores da identidade AirNext.
 */
export default function RocketMascot() {
  return (
    <div className="fixed inset-0 z-20 pointer-events-none overflow-hidden" aria-hidden="true">
      <div className="rocket-fly absolute top-0 left-0">
        <div className="rocket-bob relative w-14 h-14 sm:w-[4.5rem] sm:h-[4.5rem] drop-shadow-[0_8px_24px_rgba(37,99,235,0.5)]">
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="rocketBody" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </linearGradient>
              <linearGradient id="rocketNose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
              <linearGradient id="rocketWindow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
              <radialGradient id="rocketWindowShine" cx="35%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="rocketFlame" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="35%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Chama do propulsor — anima com flicker (rocket-flame) */}
            <g className="rocket-flame" style={{ transformOrigin: '50px 76px' }}>
              <path d="M42 74 Q50 100 58 74 Q54 84 50 79 Q46 84 42 74 Z" fill="url(#rocketFlame)" />
            </g>

            {/* Aletas traseiras */}
            <path d="M33 60 L18 80 L35 72 Z" fill="#2563EB" />
            <path d="M67 60 L82 80 L65 72 Z" fill="#2563EB" />

            {/* Corpo do foguete */}
            <path d="M50 8 C64 22 68 46 64 70 L36 70 C32 46 36 22 50 8 Z" fill="url(#rocketBody)" stroke="#94a3b8" strokeWidth="1.5" />

            {/* Nariz (azul da marca) */}
            <path d="M50 8 C56 14 60 22 61 30 L39 30 C40 22 44 14 50 8 Z" fill="url(#rocketNose)" />

            {/* Faixa da base */}
            <rect x="36" y="64" width="28" height="6" rx="2" fill="#94a3b8" />

            {/* Vigia / janela */}
            <circle cx="50" cy="43" r="11" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
            <circle cx="50" cy="43" r="8" fill="url(#rocketWindow)" />
            <circle cx="50" cy="43" r="8" fill="url(#rocketWindowShine)" />

            {/* Emblema AirNext */}
            <circle cx="50" cy="58" r="4" fill="#22C55E" opacity="0.9" />
          </svg>

          {/* Rastro de estrelinhas atrás do foguete */}
          <span className="star-twinkle absolute -left-3 top-10 w-1.5 h-1.5 rounded-full bg-white" style={{ animationDelay: '0.2s' }} />
          <span className="star-twinkle absolute -left-6 top-14 w-1 h-1 rounded-full bg-[#60A5FA]" style={{ animationDelay: '0.8s' }} />
          <span className="star-twinkle absolute -left-2 top-16 w-1 h-1 rounded-full bg-[#F59E0B]" style={{ animationDelay: '1.4s' }} />
        </div>
      </div>
    </div>
  );
}
