/**
 * Sair do jogo.
 *
 * Duas situações completamente diferentes, e o botão precisa saber em qual
 * está:
 *
 *   INSTALADO como aplicativo -> a janela é do jogo, e `window.close()`
 *     funciona. É a única situação em que uma página pode se fechar: a regra do
 *     navegador é que só fecha quem foi aberto por script, e o aplicativo
 *     instalado é exceção.
 *
 *   NUMA ABA -> `window.close()` é ignorado em silêncio. Aí a saída certa não é
 *     tentar fechar e pedir desculpa: é VOLTAR PARA O SITE, que é de onde a
 *     pessoa veio e onde ela tem o que fazer.
 */

import { sairDaTelaCheia } from './fullscreen'

/**
 * O jogo está rodando como aplicativo instalado?
 *
 * Medido UMA VEZ, no carregamento, antes de a abertura pedir tela cheia.
 * Perguntar depois daria a resposta errada: em tela cheia o `display-mode` do
 * aplicativo deixa de ser `standalone` e passa a ser `fullscreen` - que também
 * casa com uma aba comum em F11. As duas situações ficariam indistinguíveis
 * justamente no momento em que a diferença importa.
 */
const APLICATIVO: boolean = (() => {
  if (typeof window === 'undefined') return false
  const modos = ['standalone', 'minimal-ui', 'window-controls-overlay']
  if (modos.some((m) => window.matchMedia(`(display-mode: ${m})`).matches)) {
    return true
  }
  // O Safari do iPhone não implementa `display-mode` e usa um campo próprio.
  return (navigator as Navigator & { standalone?: boolean }).standalone === true
})()

export const comoAplicativo = (): boolean => APLICATIVO

/**
 * O endereço da vitrine.
 *
 * Relativo ao jogo, e não `/`: assim continua certo se um dia o site inteiro
 * for servido de dentro de uma subpasta.
 */
export function enderecoDoSite(): string {
  return new URL('../', window.location.href).href
}

/**
 * Fecha o jogo.
 *
 * Devolve `true` quando a saída foi resolvida e não há mais nada a mostrar.
 * Devolve `false` no caso do aplicativo instalado, em que o fechamento pode ser
 * recusado sem aviso - aí quem chamou mostra a tela de despedida.
 */
export async function sairDoJogo(): Promise<boolean> {
  await sairDaTelaCheia()

  if (APLICATIVO) {
    window.close()
    return false
  }

  window.location.href = enderecoDoSite()
  return true
}
