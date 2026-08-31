/** Raiz: roda o relogio do jogo e escolhe entre a area de trabalho e a tela azul. */

import { useEffect } from 'react'
import { useGame } from '@/game/store'
import { Bsod } from '@/os/Bsod'
import { Desktop } from '@/os/Desktop'

/** 1 segundo real = 1 minuto no jogo. */
const TICK_MS = 1000

export default function App() {
  const busted = useGame((s) => s.busted)
  const tick = useGame((s) => s.tick)

  useEffect(() => {
    const id = setInterval(() => tick(1), TICK_MS)
    return () => clearInterval(id)
  }, [tick])

  return busted ? <Bsod /> : <Desktop />
}
