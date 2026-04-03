import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      hmr: {
        host: 'localhost',
        clientPort: 5173,
      },
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    build: {
      // Don't empty dist — mounted filesystem prevents deletion of existing files
      emptyOutDir: false,
      // Raise warning threshold — html2pdf is legitimately large and already lazy
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // React core — tiny, loads first
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'vendor-react';
            }
            // Markdown renderer — only used in Audit page
            if (id.includes('react-markdown') || id.includes('remark') || id.includes('micromark') || id.includes('mdast') || id.includes('unist')) {
              return 'vendor-markdown';
            }
            // Lucide icons — tree-shaken but isolate for caching
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            // Stripe.js
            if (id.includes('@stripe')) {
              return 'vendor-stripe';
            }
          },
        },
      },
    },
  };
});
