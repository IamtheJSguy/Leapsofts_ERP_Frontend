import { defineConfig, loadEnv, type Plugin } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const APP_BUILD_ID = Date.now().toString();

function versionFilePlugin(): Plugin {
  return {
    name: 'app-version-file',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ buildId: APP_BUILD_ID }),
      });
    },
  };
}

const env = loadEnv(process.env.MODE || '', process.cwd());

export default defineConfig({
  define: {
    __APP_BUILD_ID__: JSON.stringify(APP_BUILD_ID),
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    versionFilePlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: env.VITE_API_URL,
        changeOrigin: true,
      },
    },
  },
});
