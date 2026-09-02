import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
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
  plugins: [
    react(),

    /**
     * Instalacao e jogo offline.
     *
     * Nao existe `.exe`, e nao vai existir: executavel sem assinatura digital
     * leva bronca do Windows, antivirus implica com um programa cheio de
     * "exploit" e "scanner" dentro, e cada jogador ficaria congelado na versao
     * que baixou. Instalado como aplicativo o jogo ganha icone de verdade,
     * janela sem barra de navegacao e funciona sem rede - e continua se
     * atualizando sozinho.
     */
    VitePWA({
      // O trabalhador novo assume no proximo carregamento, sem perguntar nada.
      // E o que resolve o problema do `.exe`: ninguem fica com a build velha.
      registerType: 'autoUpdate',
      // Registrado a mao nas duas entradas (`main.tsx`), porque sao duas
      // paginas e a injecao automatica so cuida da principal.
      injectRegister: null,
      includeAssets: ['icones/favicon-32.png', 'icones/apple-touch-180.png'],

      manifest: {
        name: 'ScanSS Evasion',
        short_name: 'ScanSS',
        description: 'Um jogo sobre computadores dos outros, dinheiro e não ' +
                     'ser pego.',
        lang: 'pt-BR',
        categories: ['games'],
        // Instalar abre o JOGO, e nao a vitrine: quem instalou já decidiu.
        start_url: 'jogo/',
        scope: './',
        display: 'standalone',
        background_color: '#06080b',
        theme_color: '#06080b',
        icons: [
          { src: 'icones/icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icones/icone-512.png', sizes: '512x512', type: 'image/png' },
          {
            // O sistema recorta este em círculo, folha ou o que quiser - por
            // isso ele é desenhado menor, com margem de sobra.
            src: 'icones/icone-maskable-512.png',
            sizes: '512x512', type: 'image/png', purpose: 'maskable',
          },
        ],
      },

      /*
       * O trabalhador tambem roda em desenvolvimento.
       *
       * Sem isto, `npm run dev` nao serve manifesto nem registra nada, entao o
       * navegador nunca oferece instalar - e a pessoa testando conclui, com
       * razao, que a instalacao nao funciona. O trabalhador de desenvolvimento
       * nao guarda arquivo em cache, entao o recarregamento quente continua
       * igual.
       */
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
        suppressWarnings: true,
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        // Duas páginas: as duas precisam abrir offline pelo endereço.
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // As fontes vêm de fora. Sem guardá-las, o jogo offline cai na
            // fonte reserva e a logo muda de cara justamente quando o jogador
            // está sem rede.
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'fontes-css' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fontes-arquivos',
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
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
