import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Garantir que os assets sejam referenciados corretamente
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  // Configuração para variáveis de ambiente
  envPrefix: 'VITE_',
  // Configuração para assets públicos
  publicDir: 'public',
});
