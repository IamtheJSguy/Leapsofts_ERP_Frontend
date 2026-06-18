import { defineConfig, loadEnv } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// Load environment variables
const env = loadEnv(process.env.MODE || '', process.cwd());

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Proxy API requests to the backend
    proxy: {
      '/api': {
        target: env.VITE_API_URL,
        changeOrigin: true,
      }
    }
  }
});
