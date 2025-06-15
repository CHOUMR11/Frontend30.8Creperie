import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',          // Use relative base path for correct asset loading on static hosting
  plugins: [react()],
  build: {
    outDir: 'dist',    // Output directory for build (default is 'dist')
    sourcemap: false,  // Optional: disable sourcemaps for production build to reduce size
  },
})
