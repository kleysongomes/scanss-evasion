/**
 * Raiz: escolhe entre lobby, area de trabalho e tela azul, e roda o relogio.
 *
 * O tick tambem e onde a historia acontece: a cada minuto de jogo ele checa se
 * o roteiro liberou algum e-mail e se o Coletivo resolveu bater na porta.
 */

import { useEffect, useState } from 'react'
import { useGame } from '@/game/store'
import { Bsod } from '@/os/Bsod'
import { Desktop } from '@/os/Desktop'
import { Intro } from '@/os/Intro'
import { Lobby } from '@/os/Lobby'
import { Prologo } from '@/os/Prologo'

/** 1 segundo real = 1 minuto no jogo. */
const TICK_MS = 1000

export default function App() {
  // A abertura roda uma vez por visita. Nao e salva: e ambientacao, nao
  // progresso - e o Esc existe justamente para quem ja viu.
  const [abertura, setAbertura] = useState(true)
  const started = useGame((s) => s.started)
  const prologue = useGame((s) => s.prologue)
  const busted = useGame((s) => s.busted)
  const paused = useGame((s) => s.paused)
  const tick = useGame((s) => s.tick)
  const deliverMail = useGame((s) => s.deliverMail)
  const rollAttack = useGame((s) => s.rollAttack)

  useEffect(() => {
    if (!started || busted || paused || prologue) return

    const id = setInterval(() => {
      tick(1)
      // A entrega vem depois do tick: um e-mail disparado por rastro precisa
      // que o rastro daquele minuto ja esteja aplicado.
      deliverMail()
      rollAttack()
    }, TICK_MS)

    return () => clearInterval(id)
  }, [started, busted, paused, prologue, tick, deliverMail, rollAttack])

  // O primeiro e-mail ("inicio") tem que chegar assim que a partida comeca,
  // sem esperar o primeiro tick.
  useEffect(() => {
    if (started && !busted) deliverMail()
  }, [started, busted, deliverMail])

  if (abertura) return <Intro onDone={() => setAbertura(false)} />
  if (!started) return <Lobby />
  if (prologue) return <Prologo />
  return busted ? <Bsod /> : <Desktop />
}
