/**
 * Gera os ícones do jogo a partir da logo.
 *
 *   npm run icones
 *
 * Desenha a marca num navegador de verdade e fotografa em cada tamanho, do
 * mesmo jeito que `prints.ts` faz com as telas. É melhor do que abrir um editor
 * de imagem: quando a logo mudar, um comando refaz o conjunto inteiro, e não
 * sobra um PNG velho num canto contando a versão antiga da história.
 *
 * As imagens saem em `public/icones/`.
 */

import { mkdir } from 'node:fs/promises'
import { chromium, type Page } from 'playwright'

const SAIDA = 'public/icones'

/** Um ícone a gerar: nome do arquivo, lado em pixels e o desenho. */
interface Icone {
  nome: string
  lado: number
  /** Fração do lado ocupada pela marca. Deixa margem para o recorte. */
  ocupacao: number
  /** Só a inicial e o traço - o nome inteiro vira borrão abaixo de uns 64px. */
  miniatura?: boolean
}

/**
 * O ícone `maskable` é o que o sistema recorta em círculo, folha ou quadrado
 * arredondado, do jeito que quiser. Por isso ele desenha menor: tudo que passa
 * de 80% do lado pode ser cortado fora.
 */
const ICONES: Icone[] = [
  { nome: 'icone-192', lado: 192, ocupacao: 0.82 },
  { nome: 'icone-512', lado: 512, ocupacao: 0.82 },
  { nome: 'icone-maskable-512', lado: 512, ocupacao: 0.6 },
  { nome: 'apple-touch-180', lado: 180, ocupacao: 0.78 },
  { nome: 'favicon-32', lado: 32, ocupacao: 0.72, miniatura: true },
]

const AMARELO = '#ffcc00'
const PRETO = '#0a0c0e'

/**
 * A página que desenha o ícone.
 *
 * Fundo amarelo cheio com o nome vazado em preto: é a chapa da logo virando
 * quadrado. Na cor sozinha já dá para reconhecer o ícone na barra de tarefas,
 * que é o que um ícone pequeno precisa fazer.
 */
function pagina(icone: Icone): string {
  const { lado, miniatura } = icone
  // A miniatura vira "S_": duas linhas de texto viram borrão em 32px.
  const corpo = miniatura
    ? `<div class="nome"><span class="ajusta">S<i></i></span></div>`
    : `<div class="nome">` +
      `<span class="ajusta">ScanSS</span>` +
      `<span class="ajusta">Evasion<i></i></span>` +
      `</div>`

  return `<!doctype html>
<html><head><meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap"
      rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: ${lado}px; height: ${lado}px;
    display: flex; align-items: center; justify-content: center;
    background: ${AMARELO};
    font-family: "Archivo Black", "Arial Black", Impact, sans-serif;
    color: ${PRETO};
    text-transform: uppercase;
    -webkit-font-smoothing: antialiased;
  }
  .nome {
    display: flex; flex-direction: column; align-items: flex-start;
    line-height: .88; letter-spacing: -.04em;
  }
  /* O corpo da fonte é calculado depois, medindo: cada palavra é esticada até
     ocupar exatamente a largura útil. Chutar o tamanho em fração do lado não
     funciona - "SCANSS" tem seis letras e "EVASION" sete, e a conta muda com a
     fonte que o navegador acabar usando. */
  .nome span { display: block; white-space: nowrap; }
  .nome span + span { margin-top: .07em; }
  .nome i {
    display: inline-block;
    width: .44em; height: .15em;
    margin-left: .08em;
    background: currentColor;
    vertical-align: baseline;
  }
</style></head><body>${corpo}</body></html>`
}

async function gerar(page: Page, icone: Icone) {
  await page.setViewportSize({ width: icone.lado, height: icone.lado })
  await page.setContent(pagina(icone), { waitUntil: 'networkidle' })
  // A fonte chega depois do HTML; sem esperar, o ícone sai na fonte reserva - e
  // a medida abaixo sairia calculada em cima da fonte errada.
  await page.evaluate(() => document.fonts.ready)

  // Largura vira corpo de fonte: mede a 100px e regra de três. A largura do
  // texto é linear no corpo da fonte, então uma passada basta.
  await page.evaluate((util) => {
    for (const el of document.querySelectorAll<HTMLElement>('.ajusta')) {
      el.style.fontSize = '100px'
      const largura = el.getBoundingClientRect().width
      el.style.fontSize = `${(100 * util) / largura}px`
    }
  }, icone.lado * icone.ocupacao)

  await page.screenshot({ path: `${SAIDA}/${icone.nome}.png` })
  console.log(`  ${icone.nome}.png  (${icone.lado}px)`)
}

async function main() {
  await mkdir(SAIDA, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage()

  console.log('Desenhando os ícones ...')
  for (const icone of ICONES) await gerar(page, icone)

  await browser.close()
  console.log(`\nPronto. Ícones em ${SAIDA}/`)
}

main().catch((e) => {
  console.error('\nFalhou:', e.message)
  process.exit(1)
})
