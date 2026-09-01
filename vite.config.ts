import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import electron from 'vite-plugin-electron/simple';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: 'electron/main/index.ts',
        vite: {
          resolve: {
            alias: {
              '@shared': path.resolve(__dirname, './shared'),
            },
          },
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['@prisma/client', '.prisma/client', 'electron'],
            },
          },
        },
      },
      preload: {
        input: 'electron/preload/index.ts',
        vite: {
          resolve: {
            alias: {
              '@shared': path.resolve(__dirname, './shared'),
            },
          },
          build: {
            outDir: 'dist-electron/preload',
          },
        },
      },
      renderer: {},
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
