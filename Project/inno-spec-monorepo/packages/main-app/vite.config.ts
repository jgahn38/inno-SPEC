import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@inno-spec/shared': path.resolve(__dirname, '../shared/src'),
      '@inno-spec/ui-lib': path.resolve(__dirname, '../ui-lib/src'),
      '@inno-spec/core': path.resolve(__dirname, '../core/src'),
      '@inno-spec/designer-app': path.resolve(__dirname, '../designer-app/src'),
      '@inno-spec/project-app': path.resolve(__dirname, '../project-app/src'),
      '@inno-spec/admin-app': path.resolve(__dirname, '../admin-app/src'),
    },
  },
  server: {
    port: 3000,
  },
});
