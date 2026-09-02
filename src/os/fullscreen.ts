/**
 * Tela cheia.
 *
 * O navegador NAO deixa entrar em tela cheia ao carregar a pagina: a chamada
 * precisa vir de um gesto do jogador. Por isso a abertura comeca com uma porta
 * de entrada ("clique para iniciar") - e o primeiro gesto possivel, e e nele
 * que este pedido acontece, antes de qualquer texto do jogo aparecer.
 *
 * Falha em silencio de proposito: se o navegador recusar (dentro de um iframe
 * sem `allow="fullscreen"`, por exemplo), o jogo continua em janela.
 */

/** Devolve a janela ao tamanho normal, para quem esta saindo do jogo. */
export async function sairDaTelaCheia(): Promise<void> {
  if (!document.fullscreenElement) return
  try {
    await document.exitFullscreen()
  } catch {
    // Alguns navegadores recusam fora de um gesto. Nao e grave.
  }
}

export async function entrarEmTelaCheia(): Promise<void> {
  if (document.fullscreenElement) return
  try {
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
  } catch {
    // Recusado pelo navegador ou pela politica do iframe. Segue em janela.
  }
}
