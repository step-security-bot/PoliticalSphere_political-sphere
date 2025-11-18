import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  root: '.', // Current directory (apps/web)
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173, // Standard Vite port
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:4000', // Proxy to API on 4000
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test-setup.js'],
  },
});
