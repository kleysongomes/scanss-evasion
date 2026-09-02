/**
 * Prologo: a ambientacao, escrita letra a letra, logo depois de criar a
 * partida.
 *
 * Fica aqui e nao na abertura porque so faz sentido uma vez. Na abertura ele
 * apareceria a cada visita e viraria obstaculo; aqui ele e a primeira coisa que
 * o jogador ve do seu personagem - e ja com o apelido que ele acabou de
 * escolher.
 */

import { useEffect } from 'react'
import { useGame } from '@/game/store'
import { Datilografa } from './Datilografa'

const TEXTO = `2003.

A internet ainda chia quando conecta.
Ninguém tranca nada: senha é palavra fácil anotada num arquivo de texto.

Você tem uma dívida que não para de crescer
e um computador montado com peças que alguém jogou fora.

Não é gênio. É teimoso.`

export function Prologo() {
  const apelido = useGame((s) => s.player.handle)
  const endPrologue = useGame((s) => s.endPrologue)

  // Esc entra direto, para quem já leu numa partida anterior.
  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if (e.key === 'Escape') endPrologue()
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [endPrologue])

  return (
    <div className="intro" onClick={endPrologue}>
      <div className="prologo">
        <Datilografa
          texto={`${TEXTO}\n\nHoje alguém vai te mandar um e-mail, ${apelido}.`}
          className="intro-texto"
          pausaFinal={2400}
          aoTerminar={endPrologue}
        />
      </div>
      <div className="intro-pular">Esc para pular</div>
    </div>
  )
}
