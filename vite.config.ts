import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Prevents "process is not defined" error in browser
      // and injects the API_KEY value during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
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