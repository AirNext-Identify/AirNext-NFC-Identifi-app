import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { registerWebMcpTools } from "./lib/webmcp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Ferramentas para agentes de IA no navegador (WebMCP). Sem a API no navegador, não faz nada.
registerWebMcpTools();

// O #root só é liberado (regra `.app-ready` em index.css) quando o App confirma que montou de
// verdade (useEffect em App.tsx) — assim o HTML pré-renderizado nunca aparece como texto solto.
// O timeout é só uma rede de segurança caso algo trave.
setTimeout(() => document.documentElement.classList.add("app-ready"), 4000);

// Fonte do logo (Lobster): só aparece em peças abaixo da dobra, então carrega DEPOIS da página
// (load + navegador ocioso), sem preconnect e sem disputar banda com o conteúdo inicial.
(() => {
  const loadLobster = () => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://fonts.googleapis.com/css2?family=Lobster&display=swap";
    document.head.appendChild(css);
  };
  const later = () => {
    if ("requestIdleCallback" in window) requestIdleCallback(loadLobster, { timeout: 3000 });
    else setTimeout(loadLobster, 1500);
  };
  if (/^\/(u|p|n|a)\//.test(window.location.pathname)) loadLobster();
  else if (document.readyState === "complete") later();
  else window.addEventListener("load", later, { once: true });
})();
