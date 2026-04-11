
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
        // Forward every /api/* request from the Vite dev server to Express.
        // This means the browser only ever talks to one origin (Vite on :3000)
        // and Vite tunnels the API calls to Express on :3001 — no CORS needed,
        // no hardcoded Express port in the frontend env.
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  });