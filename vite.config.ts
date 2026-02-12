import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    base: './', // Ensures assets work on GitHub Pages
    define: {
      // Polyfill process.env.API_KEY so the existing code works
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || process.env.API_KEY)
    }
  }
})