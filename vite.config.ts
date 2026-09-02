import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'
import pkg from './package.json'

/**
 * Data da build, para a landing mostrar "atualizado em".
 *
 * Prefere a data do ultimo commit: e ela que representa "quando o jogo mudou".
 * A hora da maquina que compilou muda a cada `npm run build`, mesmo sem uma
 * linha nova de codigo. Sem git (baixado como zip, por exemplo), cai para hoje.
 */
function dataDaBuild(): string {
  try {
    return execSync('git log -1 --format=%cI', { encoding: 'utf-8' }).trim()
  } catch {
    return new Date().toISOString()
  }
}

/**
 * Duas páginas: a landing em `/` e o jogo em `/jogo/`.
 *
 * Multi-page do próprio Vite, sem roteador: as duas são HTML de verdade, o que
 * mantém a URL do jogo estável (é ela que o atalho da área de trabalho aponta)
 * e funciona em qualquer host estático.
 */
export default defineConfig({
  plugins: [react()],
  define: {
    __VERSAO__: JSON.stringify(pkg.version),
    __BUILD__: JSON.stringify(dataDaBuild()),
  },
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
