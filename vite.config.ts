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

          if (id.includes('@supabase/')) return 'vendor-supabase';
          if (id.includes('@tanstack/react-query')) return 'vendor-query';
          if (id.includes('@mui/')) return 'vendor-mui';
          if (id.includes('@emotion/')) return 'vendor-emotion';
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('@radix-ui/')) return 'vendor-radix';
          if (id.includes('@hello-pangea/dnd')) return 'vendor-dnd';
          if (id.includes('node_modules/zod/')) return 'vendor-zod';
          if (id.includes('date-fns') || id.includes('dayjs')) return 'vendor-date';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('react-hook-form') || id.includes('@hookform/')) return 'vendor-forms';
          if (id.includes('react-router')) return 'vendor-router';
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('scheduler')
          )
            return 'vendor-react';

          return 'vendor-misc';
        },
      },
    },
  },
}));
