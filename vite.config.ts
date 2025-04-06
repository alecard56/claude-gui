// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import path from 'path';

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: {
//       '@': path.resolve(__dirname, './src')
//     }
//   },
//   build: {
//     outDir: 'dist/renderer',
//     emptyOutDir: true
//   },
//   server: {
//     port: 3000
//   }
// });

// File: vite.config.ts
// Purpose: Configuration for Vite bundler
// Usage: Referenced during build process for the renderer process
// Contains: Configuration for Vite, including paths, plugins, and build options
// Dependencies: vite, path, electron-renderer
// Iteration: 1

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  root: path.resolve(__dirname, 'src/renderer'),
  publicDir: path.resolve(__dirname, 'public'),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/renderer/index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/renderer/components'),
      '@models': path.resolve(__dirname, 'src/models'),
      '@controllers': path.resolve(__dirname, 'src/controllers'),
      '@views': path.resolve(__dirname, 'src/renderer/views'),
      '@utils': path.resolve(__dirname, 'src/utils')
    }
  },
  server: {
    port: 3000
  }
});