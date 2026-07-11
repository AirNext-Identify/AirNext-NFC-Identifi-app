/**
 * Mascote Astronauta da AirNext.
 *
 * Sobrevoa a tela em loop (login/cadastro) e "encosta" no logo no meio do
 * trajeto — o brilho ao redor da logo (ver `logo-touch-glow` em index.css)
 * é sincronizado com o mesmo tempo de animação para dar a sensação de
 * toque físico. É puramente decorativo: `pointer-events-none` e `aria-hidden`
 * para não atrapalhar leitores de tela nem cliques.
 */
export default function AstronautMascot() {
  return (
    <div className="fixed inset-0 z-20 pointer-events-none overflow-hidden" aria-hidden="true">
      <div className="astronaut-fly absolute top-0 left-0">
        <div className="astronaut-bob relative w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_8px_24px_rgba(59,130,246,0.45)]">
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="astroSuit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f4f5f7" />
                <stop offset="100%" stopColor="#c9ced6" />
              </linearGradient>
              <linearGradient id="astroVisor" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
              <radialGradient id="astroVisorShine" cx="35%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Mochila */}
            <rect x="38" y="46" width="24" height="26" rx="6" fill="#9ca3af" />
            <rect x="41" y="49" width="18" height="6" rx="2" fill="#6b7280" />

            {/* Tubo/tether */}
            <path d="M30 50 Q18 60 24 74" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" />

            {/* Corpo */}
            <ellipse cx="50" cy="62" rx="20" ry="22" fill="url(#astroSuit)" stroke="#a1a7b3" strokeWidth="1.5" />
            {/* Cinto */}
            <rect x="33" y="66" width="34" height="6" rx="3" fill="#3b82f6" opacity="0.85" />
            <circle cx="50" cy="69" r="3.2" fill="#f59e0b" />

            {/* Braço acenando (animado) */}
            <g className="astronaut-arm">
              <path d="M66 54 Q80 46 78 34" stroke="url(#astroSuit)" strokeWidth="9" fill="none" strokeLinecap="round" />
              <circle cx="78" cy="33" r="6" fill="#e5e7eb" stroke="#a1a7b3" strokeWidth="1.5" />
            </g>
            {/* Braço parado */}
            <path d="M34 54 Q20 58 20 70" stroke="#e5e7eb" strokeWidth="9" fill="none" strokeLinecap="round" />
            <circle cx="20" cy="71" r="6" fill="#e5e7eb" stroke="#a1a7b3" strokeWidth="1.5" />

            {/* Pernas */}
            <path d="M42 82 L38 96" stroke="#e5e7eb" strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M58 82 L62 96" stroke="#e5e7eb" strokeWidth="8" fill="none" strokeLinecap="round" />

            {/* Capacete */}
            <circle cx="50" cy="34" r="24" fill="#f4f5f7" stroke="#a1a7b3" strokeWidth="1.5" />
            <circle cx="50" cy="35" r="18" fill="url(#astroVisor)" />
            <circle cx="50" cy="35" r="18" fill="url(#astroVisorShine)" />
            {/* Reflexo estrelado no visor */}
            <path d="M42 30 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 z" fill="#fff" opacity="0.9" />

            {/* AirNext badge no peito */}
            <circle cx="50" cy="60" r="6.5" fill="#0ea5e9" opacity="0.9" />
            <path d="M47 62 l3 -6 l3 6 z" fill="#fff" />
          </svg>

          {/* Rastro de estrelinhas atrás do astronauta */}
          <span className="star-twinkle absolute -left-3 top-2 w-1.5 h-1.5 rounded-full bg-white" style={{ animationDelay: '0.2s' }} />
          <span className="star-twinkle absolute -left-6 top-8 w-1 h-1 rounded-full bg-cyan-300" style={{ animationDelay: '0.8s' }} />
          <span className="star-twinkle absolute -left-2 top-12 w-1 h-1 rounded-full bg-violet-300" style={{ animationDelay: '1.4s' }} />
        </div>
      </div>
    </div>
  );
}
