import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Fallback for VITE_BASE_URL during build
  const baseUrl = process.env.VITE_BASE_URL || 'http://localhost:3001';

  return {
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
          target: baseUrl, // Use fallback variable
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
        'jwt-decode',
        'pino/browser',
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
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        external: ['pino'],
        output: {
          globals: {
            pino: 'pino',
          },
          manualChunks: {
            vendor: ['react', 'react-dom', 'axios', '@chakra-ui/react', '@chakra-ui/icons'],
          },
        },
      },
    },
    // Ensure environment variables are passed to the client
    define: {
      'process.env.VITE_BASE_URL': JSON.stringify(baseUrl),
      'process.env.VITE_WEBSOCKET_URL': JSON.stringify(
        process.env.VITE_WEBSOCKET_URL || 'wss://e1c55c2bd7b2.ngrok-free.app'
      ),
      'process.env.VITE_CLOUDINARY_CLOUD_NAME': JSON.stringify(
        process.env.VITE_CLOUDINARY_CLOUD_NAME || 'dgbsbgegr'
      ),
      'process.env.VITE_CLOUDINARY_UPLOAD_PRESET': JSON.stringify(
        process.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'kyc_upload'
      ),
    },
  };
});