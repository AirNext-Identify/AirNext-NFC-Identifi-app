import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 700,
    rollupOptions: { output: { manualChunks(id: string) {
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