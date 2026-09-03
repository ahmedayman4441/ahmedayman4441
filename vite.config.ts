import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3002,
      allowedHosts: ['localhost', '127.0.0.1', '.ngrok-free.app', '.ngrok-free.dev'],
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 3002,
        clientPort: 3002,
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
