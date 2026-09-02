/**
 * Aviso de e-mail novo, no canto inferior direito.
 *
 * Enquanto ele esta na tela o jogo esta PAUSADO - o relogio nao anda, o rastro
 * nao cai, nada acontece. E a unica vez em que a narrativa interrompe a
 * jogatina, e e por isso que os textos do roteiro tem que ser curtos.
 *
 * A pausa nao e ANUNCIADA. O balao ja dizia "o jogo esta pausado ate voce ler",
 * e ler que se esta num jogo, dentro de um sistema operacional de mentira,
 * quebrava a ilusao toda por um aviso que ninguem pediu. Quem quiser continuar
 * clica em "Depois" e o relogio volta a andar - sem explicacao.
 */

import { useGame } from '@/game/store'
import { launchApp } from './launch'

export function MailAlert() {
  const game = useGame()
  const naoLidos = game.inbox.filter((e) => !e.lido)
  const ultimo = naoLidos[naoLidos.length - 1]

  if (!ultimo) return null

  function abrir() {
    launchApp('browser', { args: { url: 'vmail.vc' } })
    game.resume()
  }

  return (
    <div className="mail-alert">
      <div className="cabeca">
        <span>✉️</span>
        <b>Você tem {naoLidos.length === 1 ? 'uma nova mensagem'
                                           : `${naoLidos.length} novas mensagens`}</b>
      </div>

      <div className="assunto">{ultimo.assunto}</div>
      <div className="de">de {ultimo.de}</div>

      <div className="acoes">
        <button className="xp" onClick={abrir}>Abrir o VMail</button>
        <button className="xp" onClick={() => game.resume()}>Depois</button>
      </div>
    </div>
  )
}
