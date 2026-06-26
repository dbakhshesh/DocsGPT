import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    proxy: {
      '/marketplace/api': {
        target: 'http://127.0.0.1:5002',
        changeOrigin: true,
      },
    },
  },
});
