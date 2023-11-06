import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import path from "path";


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: '/escrow-app/',
  build: {
    // outDir: 'build', // Specifies the output directory for the build artifacts
    chunkSizeWarningLimit: 1000,
  },
  // resolve: {
  //   alias: {
  //     "@server": path.resolve(__dirname, "../server"),
  //   },
  // },
})
