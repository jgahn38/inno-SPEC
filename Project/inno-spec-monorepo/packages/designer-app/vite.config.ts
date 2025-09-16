import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:3001/api'),
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: false,
    open: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  publicDir: 'public',
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@inno-spec/shared': path.resolve(__dirname, '../shared/src'),
      '@inno-spec/admin-app': path.resolve(__dirname, '../admin-app/src'),
      '@inno-spec/ui-lib': path.resolve(__dirname, '../ui-lib/src'),
    },
  },
});
