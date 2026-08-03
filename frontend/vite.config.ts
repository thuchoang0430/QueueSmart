import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/QueueSmart-A2/',
  plugins: [react(), tailwindcss()],
  server: {
    // Sends /api requests to the A3 backend so the front end can use relative
    // URLs. Start the backend with `npm run dev` inside backend/.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
