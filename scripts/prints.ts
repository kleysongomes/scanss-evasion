/**
 * Tira os prints do jogo para a landing.
 *
 * Roda o jogo de verdade num navegador, joga ate cada tela interessante e
 * fotografa. Isso importa: print feito a mao envelhece na primeira mudanca de
 * layout, e este da para regerar com um comando.
 *
 *   npm run prints          (com o servidor de dev rodando)
 *   npm run prints -- 4173  (apontando para outra porta)
 *
 * As imagens saem em `public/prints/`.
 */

import { mkdir } from 'node:fs/promises'
import { chromium, type Page } from 'playwright'

const PORTA = process.argv[2] ?? '5173'
const BASE = `http://localhost:${PORTA}`
const SAIDA = 'public/prints'
const TELA = { width: 1280, height: 800 }

/** Espera um pouco: as telas do jogo têm animação de entrada. */
const respira = (ms = 450) => new Promise((r) => setTimeout(r, ms))

async function foto(page: Page, nome: string) {
  await respira()
  await page.screenshot({ path: `${SAIDA}/${nome}.png` })
  console.log(`  ${nome}.png`)
}

/** Pula a abertura e começa uma partida nova com um apelido conhecido. */
async function novaPartida(page: Page) {
  await page.goto(`${BASE}/jogo/`, { waitUntil: 'networkidle' })

  await page.getByText('clique para iniciar').click()
  await page.keyboard.press('Escape')                 // pula a abertura

  await page.getByRole('button', { name: /Novo jogo/ }).click()
  await page.getByPlaceholder('seu apelido').fill('operador')
  await page.getByRole('button', { name: 'Começar' }).click()
  await page.keyboard.press('Escape')                 // pula o prólogo
  await respira(800)
}

/**
 * Fecha tudo que estiver cobrindo a tela: aviso de e-mail e balão do Klipe.
 *
 * Em ciclo, porque um revela o outro — o jogo pausa no primeiro e-mail, e só
 * depois de dispensar esse aviso é que o Klipe aparece por baixo.
 */
async function limparAvisos(page: Page) {
  await respira(700)
  for (let volta = 0; volta < 6; volta++) {
    let fechou = false
    for (const rotulo of ['Depois', 'Agora não']) {
      const b = page.getByRole('button', { name: rotulo })
      if (await b.count()) {
        await b.first().click().catch(() => {})
        await respira(350)
        fechou = true
      }
    }
    if (!fechou) return
  }
}

/** Abre um programa pelo ícone da área de trabalho. */
async function abrirApp(page: Page, nome: string) {
  await page.getByRole('button', { name: new RegExp(nome, 'i') }).first().dblclick()
  await respira(500)
}

async function main() {
  await mkdir(SAIDA, { recursive: true })
  const browser = await chromium.launch()
  // Densidade 1: a 1280x800 a imagem já é o dobro do tamanho exibido na
  // landing, e o dobro disso só pesaria a página.
  const page = await browser.newPage({ viewport: TELA })

  console.log(`Fotografando ${BASE} ...`)

  // --- abertura e menu -----------------------------------------------------
  await page.goto(`${BASE}/jogo/`, { waitUntil: 'networkidle' })
  await page.getByText('clique para iniciar').click()
  await respira(1400)
  await foto(page, '01-abertura')

  await page.keyboard.press('Escape')
  await respira(600)
  await foto(page, '02-menu')

  // --- área de trabalho ----------------------------------------------------
  await novaPartida(page)
  await limparAvisos(page)
  await foto(page, '03-desktop')

  // --- a suíte de invasão --------------------------------------------------
  await abrirApp(page, 'NetRipper')
  await page.getByRole('button', { name: 'Varrer rede' }).click()
  await respira(2000)
  await limparAvisos(page)
  await foto(page, '04-netripper')

  // --- o disco da vítima ---------------------------------------------------
  // Selecionar o host é no Rastreador; agir sobre ele é no módulo Intrusão.
  await page.locator('.netripper-lista tbody tr').first().click()
  await page.locator('.modulo-item', { hasText: 'Intrusão' }).click()
  await respira(400)

  await page.getByRole('button', { name: /Analisar/ }).click()
  await respira(1400)
  await page.getByRole('button', { name: /^Invadir/ }).click()
  await respira(2600)
  await limparAvisos(page)
  await page.getByRole('button', { name: /Conectar/ }).click()
  await respira(1400)
  await limparAvisos(page)

  await abrirApp(page, 'Meu Computador')

  // Trocar para o disco da vítima. Sem `catch`: se falhar, o print sairia
  // mostrando o disco local vazio - foi o que aconteceu na primeira versão.
  await page.locator('.explorer-unidade', { hasText: '(Z:)' }).click()
  await page.locator('.mono', { hasText: /^Z:/ }).first().waitFor()
  await respira(400)

  // Fica na raiz: a árvore de pastas é o que a legenda promete, e uma pasta
  // sorteada pode sair com um arquivo só.
  await foto(page, '05-explorer')

  // --- o banco -------------------------------------------------------------
  await abrirApp(page, 'Chroma')
  const barra = page.locator('.browser-bar input').first()
  await barra.fill('vbank.vc')
  await barra.press('Enter')
  await respira(700)
  await limparAvisos(page)
  await foto(page, '06-banco')

  // --- a loja --------------------------------------------------------------
  await barra.fill('darkmarket.vc')
  await barra.press('Enter')
  await respira(700)
  await foto(page, '07-darkmarket')

  // --- o correio -----------------------------------------------------------
  await barra.fill('vmail.vc')
  await barra.press('Enter')
  await respira(700)
  await foto(page, '08-vmail')

  // --- o manual ------------------------------------------------------------
  await abrirApp(page, 'Manual do Operador')
  await respira(600)
  await foto(page, '09-manual')

  // --- a defesa ------------------------------------------------------------
  await page.locator('.task-button', { hasText: 'NetRipper' }).click()
  await page.locator('.modulo-item', { hasText: 'Firewall' }).click()
  await respira(500)
  await foto(page, '10-defesa')

  // --- a tela azul ---------------------------------------------------------
  // Pelo modo desenvolvedor: e a unica forma de ver o fim de jogo sem jogar
  // ate perder. De quebra, exercita aquele fluxo inteiro.
  await page.locator('.start-button').click()
  await page.getByRole('button', { name: /Desenvolvedor/ }).click()
  await respira(500)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: /Ativar modo desenvolvedor/ }).click()
  await respira(400)
  await page.getByRole('button', { name: /Estourar/ }).click()
  await respira(900)
  await foto(page, '11-tela-azul')

  await browser.close()
  console.log(`\nPronto. Imagens em ${SAIDA}/`)
}

main().catch((e) => {
  console.error('\nFalhou:', e.message)
  console.error('O servidor de dev está rodando? (npm run dev)')
  process.exit(1)
})
