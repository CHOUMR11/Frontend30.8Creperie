import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',      // Important for proper asset loading on Netlify
  plugins: [react()],
})
