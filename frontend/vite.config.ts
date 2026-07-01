import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import * as path from "node:path"; // این رو اضافه کن

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // این خط باعث میشه همه پکیج‌ها فقط از یک ری اکت واحد استفاده کنن
      react: path.resolve('./node_modules/react'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  }
})