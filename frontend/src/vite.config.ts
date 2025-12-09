import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // эквивалент "0.0.0.0"
    port: 5173,        // порт по умолчанию
    strictPort: true   // если занят — не переключаться автоматически
  }
})