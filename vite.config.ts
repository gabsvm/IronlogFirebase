
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const cwd = (process as any).cwd();
  const env = loadEnv(mode, cwd, '');
  
  // Robustly try to find the API Key from various potential sources
  // 1. env.API_KEY (Loaded from .env files or system vars by Vite)
  // 2. process.env.API_KEY (System vars directly, vital for some Vercel configs)
  // 3. VITE_API_KEY variants (Common mistake fallback)
  const apiKey = env.API_KEY || process.env.API_KEY || env.VITE_API_KEY || process.env.VITE_API_KEY;

  if (mode === 'production' && !apiKey) {
      console.warn("⚠️ WARNING: API_KEY not found in environment variables. AI features will fail.");
  }

  return {
    plugins: [react()],
    define: {
      // Prevents "process is not defined" error in browser
      // and injects the API_KEY value during build
      'process.env.API_KEY': JSON.stringify(apiKey),
      // Fallback for other process.env access if any (though we should avoid them)
      'process.env': {} 
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      host: true // Allows testing on mobile via LAN IP
    }
  };
});
