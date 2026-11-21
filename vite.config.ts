import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { localSignalPlugin } from './vite-plugin-local-signal';

export default defineConfig({
  plugins: [react(), tailwindcss(), localSignalPlugin()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-peerjs': ['peerjs'],
        },
      },
    },
  },
});
