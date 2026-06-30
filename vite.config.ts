import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          // Libs carregadas apenas via dynamic import — Rollup as coloca
          // automaticamente no chunk do importador (já lazy).
          if (
            id.includes('exceljs') ||
            id.includes('jspdf') ||
            id.includes('html2canvas')
          ) {
            return undefined;
          }

          // Libs SEM dependência de React — chunks dedicados são seguros.
          if (id.includes('@supabase/')) return 'vendor-supabase';
          if (id.includes('node_modules/zod/')) return 'vendor-zod';
          if (id.includes('date-fns') || id.includes('dayjs')) return 'vendor-date';

          // Tudo o mais (React e qualquer lib que possa importar React) vai
          // pro mesmo chunk. Separar React de qualquer dependente causa race
          // condition em runtime (forwardRef/createContext undefined).
          return 'vendor-react';
        },
      },
    },
  },
}));
