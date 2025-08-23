import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.mjs'],
    alias: {
      '@emotion/react': path.resolve(__dirname, 'node_modules/@emotion/react'),
      '@emotion/styled': path.resolve(__dirname, 'node_modules/@emotion/styled'),
      'framer-motion': path.resolve(__dirname, 'node_modules/framer-motion'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    include: [
      '@chakra-ui/react',
      '@chakra-ui/icons',
      '@emotion/react',
      '@emotion/styled',
      'framer-motion',
    ],
    esbuildOptions: {
      resolveExtensions: ['.js', '.jsx', '.mjs'],
      loader: { '.js': 'jsx', '.mjs': 'jsx' },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'axios', '@chakra-ui/react', '@chakra-ui/icons'],
        },
      },
    },
  },
});