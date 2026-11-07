import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const buildDate = new Date().toLocaleDateString('es-CL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version || '2.0.0'),
    __LAST_UPDATED__: JSON.stringify(buildDate),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          three: ['three'],
          pdf: ['jspdf', 'html2canvas'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});

