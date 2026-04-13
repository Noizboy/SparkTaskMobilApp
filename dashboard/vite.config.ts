
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';

  export default defineConfig({
    plugins: [react()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        'react-hook-form@7.55.0': 'react-hook-form',
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
    },
    server: {
      port: 3000,
      // Fail fast instead of silently bumping to 3001 (Express's port).
      // If 3000 is taken you'll get a clear error rather than Vite
      // hijacking the API port and serving HTML for every /api/* request.
      strictPort: true,
      open: true,
      proxy: {
        // SSE endpoint — needs special config to avoid ECONNRESET
        '/api/events': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          ws: false,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Connection', 'keep-alive');
            });
          },
        },
        // Forward all other /api/* requests to Express
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  });