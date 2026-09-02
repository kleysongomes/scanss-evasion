import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

/**
 * Duas páginas: a landing em `/` e o jogo em `/jogo/`.
 *
 * Multi-page do próprio Vite, sem roteador: as duas são HTML de verdade, o que
 * mantém a URL do jogo estável (é ela que o atalho da área de trabalho aponta)
 * e funciona em qualquer host estático.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      input: {
        landing: fileURLToPath(new URL('./index.html', import.meta.url)),
        jogo: fileURLToPath(new URL('./jogo/index.html', import.meta.url)),
      },
    },
  },
  server: { port: 5173, open: true },
})
