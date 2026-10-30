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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('/d3/')) return 'charts';
          if (id.includes('ag-grid')) return 'ag-grid';
          if (id.includes('@tiptap') || id.includes('prosemirror')) return 'tiptap';
          if (id.includes('/xlsx/') || id.includes('\\xlsx\\')) return 'xlsx';
          if (id.includes('html2pdf') || id.includes('html2canvas') || id.includes('jspdf')) return 'html2pdf';
          if (id.includes('emoji-mart') || id.includes('@emoji-mart')) return 'emoji';
        },
      },
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
