import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import type { OutputChunk } from "rollup";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/**
 * A landing é um chunk separado (lazy) e, sem ajuda, só começa a baixar DEPOIS que o index.js termina de
 * executar — uma "escadinha" que no 4G lento custa segundos de LCP. Este plugin acrescenta ao <head> um
 * script minúsculo que, SÓ na página inicial ("/"), já pede a landing e o que ela precisa em paralelo.
 * Nas outras rotas (ex.: /n/..., /u/...) nada muda, então quem escaneia uma placa não baixa a landing à toa.
 */
function preloadLandingOnHome(): Plugin {
  let base = "/";
  return {
    name: "airnext-preload-landing-on-home",
    apply: "build",
    configResolved(c) { base = c.base; },
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        const bundle = ctx.bundle;
        if (!bundle) return html;
        const chunks = Object.values(bundle).filter((c): c is OutputChunk => c.type === "chunk");
        const entry = chunks.find((c) => c.isEntry);
        const isLandingFile = (id: string) => id.replace(/\\/g, "/").endsWith("/src/pages/LandingPage.tsx");
        const landing = chunks.find((c) => c.isDynamicEntry && c.moduleIds.some(isLandingFile));
        if (!entry || !landing) return html;
        const closure = (c: OutputChunk, seen = new Set<string>()) => {
          for (const f of c.imports) {
            if (seen.has(f)) continue;
            seen.add(f);
            const n = bundle[f];
            if (n && n.type === "chunk") closure(n, seen);
          }
          return seen;
        };
        const already = closure(entry);
        already.add(entry.fileName); // o que o Vite já pré-carrega sozinho
        const files = [landing.fileName, ...closure(landing)].filter((f) => !already.has(f));
        const urls = files.map((f) => base + f);
        const code =
          `(function(){if(location.pathname!=="/")return;var u=${JSON.stringify(urls)};` +
          `for(var i=0;i<u.length;i++){var l=document.createElement("link");l.rel="modulepreload";l.crossOrigin="";l.href=u[i];document.head.appendChild(l);}})();`;
        // O script entra LOGO DEPOIS do <meta charset>: o navegador só olha os primeiros 1.024 bytes do HTML atrás do
        // charset, e a lista de URLs sozinha passa disso. Colocá-lo antes do charset fez o Lighthouse reclamar.
        const tag = `<script>${code}</script>`;
        const charset = html.match(/<meta\s+charset[^>]*>/i);
        if (charset) return html.replace(charset[0], () => charset[0] + tag);
        return html.replace(/<head[^>]*>/i, (h) => h + tag);
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), preloadLandingOnHome()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 700,
    // Junta os "mini-chunks" (um por ícone do lucide, ~1 KB cada) em arquivos maiores: menos requisições na landing.
    // O Rollup só junta quando isso não carrega mais de ~20 KB de código extra em nenhuma rota.
    rollupOptions: { output: { experimentalMinChunkSize: 20000, manualChunks(id: string) {
      if (!id.includes('node_modules')) return;
      if (id.includes('framer-motion') || id.includes('/motion-')) return 'motion';
      if (id.includes('@supabase')) return 'supabase';
      if (id.includes('react-router')) return 'router';
      if (id.includes('react-dom') || id.includes('/scheduler/')) return 'react';
    } } },
  },
  server: {
    port: 5173,
  },
});
