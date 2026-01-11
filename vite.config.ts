
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const cwd = (process as any).cwd();
  const env = loadEnv(mode, cwd, '');
  
  const apiKey = env.API_KEY || process.env.API_KEY || env.VITE_API_KEY || process.env.VITE_API_KEY || 'AIzaSyAnVhFr2GKNsH52RdUlxiZ8j1pZDlApsp8';

  if (mode === 'production' && !apiKey) {
      console.warn("⚠️ WARNING: API_KEY not found in environment variables. AI features will fail.");
  }

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env': {} 
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      target: 'esnext', // Modern browsers for smaller bundle
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react/jsx-runtime'],
            'vendor-charts': ['chart.js', 'react-chartjs-2'],
            'vendor-utils': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities', 'canvas-confetti', 'idb-keyval'],
            'vendor-icons': ['lucide-react'],
            'vendor-ai': ['@google/genai']
          }
        }
      }
    },
    server: {
      host: true
    }
  };
});
