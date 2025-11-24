import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const apiTarget = process.env.VITE_API_URL || 'http://localhost:4000';

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      // Add logging to see if Babel is being used
      babel: {
        plugins: [],
        // Increase compact threshold to avoid deoptimization
        compact: false,
      },
    }),
  ],
  root: '.', // Current directory (apps/web)
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
  },
  server: {
    port: 5173, // Standard Vite port
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: apiTarget, // Proxy to API
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
    watch: {
      usePolling: true,
      interval: 100,
      ignored: ['**/node_modules/**', '**/dist/**', '**/.vitest/**'],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  cacheDir: '.vite',
  test: {
    environment: 'jsdom',
    setupFiles: ['./test-setup.js'],
  },
});
