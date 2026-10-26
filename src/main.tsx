import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Libera a exibição do #root assim que o React montou (ver regra `.app-ready`
// em index.css). O timeout é só uma rede de segurança caso algo trave.
const markReady = () => document.documentElement.classList.add("app-ready");
requestAnimationFrame(() => requestAnimationFrame(markReady));
setTimeout(markReady, 4000);

// Fonte do logo (Lobster) carregada SEM bloquear a primeira pintura: o <link> entra como
// "print" e vira "all" quando termina de baixar (o texto aparece antes com fonte reserva).
(() => {
  const pre = (href: string, cross = false) => {
    const l = document.createElement("link");
    l.rel = "preconnect"; l.href = href; if (cross) l.crossOrigin = "";
    document.head.appendChild(l);
  };
  pre("https://fonts.googleapis.com");
  pre("https://fonts.gstatic.com", true);
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "https://fonts.googleapis.com/css2?family=Lobster&display=swap";
  css.media = "print";
  css.onload = () => { css.media = "all"; };
  document.head.appendChild(css);
})();
