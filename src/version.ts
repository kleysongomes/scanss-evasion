/**
 * Que versao do jogo e esta, e de quando.
 *
 * O jogo esta em BETA: o Capitulo 1 esta inteiro, os proximos ainda nao
 * existem. Isso precisa aparecer no site e no menu, e nao so no aviso de fim de
 * capitulo - quem chega deve saber onde esta pisando antes de comecar.
 *
 * Os dois valores vem do build (`vite.config.ts`): a versao do `package.json` e
 * a data do ultimo commit. Nenhum numero e escrito na mao aqui, porque numero
 * escrito na mao envelhece calado.
 */

export const CANAL = 'Beta'

export const VERSAO = __VERSAO__

/** Data da build em ISO, como o git devolveu. */
export const BUILD_ISO = __BUILD__

/** A mesma data no formato que se le no Brasil. */
export const BUILD = (() => {
  const d = new Date(BUILD_ISO)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit',
                                      year: 'numeric' })
})()

/** "Beta 2.0.0" - a etiqueta curta, para cabecalho e menu. */
export const ETIQUETA = `${CANAL} ${VERSAO}`
