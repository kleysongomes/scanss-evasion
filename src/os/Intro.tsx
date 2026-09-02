/**
 * Abertura: a tela preta antes do menu principal.
 *
 * E so a assinatura - uma frase sobre o jogo e as cartelas -, porque isto roda
 * TODA visita. A ambientacao de verdade (2003, quem e o jogador) mora no
 * prologo, que so toca quando se comeca uma partida nova.
 *
 * Esc pula tudo.
 */

import { useEffect, useRef, useState } from 'react'
import { Logo } from '@/ui/Logo'
import { Datilografa } from './Datilografa'
import { entrarEmTelaCheia } from './fullscreen'

const FRASE = 'Um jogo sobre computadores dos outros, dinheiro e não ser pego.'

type Fase =
  | { tipo: 'entrada' }
  | { tipo: 'frase' }
  | { tipo: 'escuro'; ms: number }
  | { tipo: 'cartela'; texto: string; ms: number }
  | { tipo: 'titulo' }

const FASES: Fase[] = [
  // A porta de entrada existe por uma razao tecnica: o navegador so aceita o
  // pedido de tela cheia se ele vier de um gesto. Este e o primeiro gesto
  // possivel, entao a tela cheia acontece antes de qualquer texto aparecer.
  { tipo: 'entrada' },
  { tipo: 'frase' },
  { tipo: 'escuro', ms: 900 },
  { tipo: 'cartela', texto: 'um jogo independente', ms: 1700 },
  { tipo: 'escuro', ms: 750 },
  { tipo: 'cartela', texto: 'por Kleyson Gomes', ms: 1900 },
  { tipo: 'escuro', ms: 750 },
  { tipo: 'titulo' },
]

/** Quanto a frase fica parada depois de terminar de ser escrita. */
const PAUSA_APOS_FRASE = 1800

export function Intro({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const timer = useRef<number | null>(null)

  const fase = FASES[i]
  const noFim = fase.tipo === 'titulo'
  const naEntrada = fase.tipo === 'entrada'

  const avancar = () => setI((x) => x + 1)

  /** O primeiro gesto: entra em tela cheia e só então começa a abertura. */
  function entrar() {
    void entrarEmTelaCheia()
    avancar()
  }

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if (naEntrada) return entrar()
      if (e.key === 'Escape' || noFim) onDone()
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  })

  // Só as fases de tempo fixo se agendam. Entrada e título esperam o jogador;
  // a frase avança sozinha quando termina de ser escrita.
  useEffect(() => {
    if (fase.tipo !== 'escuro' && fase.tipo !== 'cartela') return
    timer.current = window.setTimeout(avancar, fase.ms)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [i, fase])

  return (
    <div
      className="intro"
      onClick={() => (naEntrada ? entrar() : noFim ? onDone() : avancar())}
    >
      {naEntrada && (
        <div className="intro-entrada">
          clique para iniciar
          <span className="cursor" />
        </div>
      )}

      {fase.tipo === 'frase' && (
        <Datilografa
          texto={FRASE}
          className="intro-frase"
          aoTerminar={avancar}
          pausaFinal={PAUSA_APOS_FRASE}
        />
      )}

      {fase.tipo === 'escuro' && <span className="cursor solto" />}

      {fase.tipo === 'cartela' && (
        <div className="intro-cartela">{fase.texto}</div>
      )}

      {noFim && (
        <div className="intro-titulo">
          <Logo tamanho="medio" />
          <div className="chamada">
            pressione qualquer tecla
            <span className="cursor" />
          </div>
        </div>
      )}

      {!noFim && !naEntrada && (
        <div className="intro-pular">Esc para pular</div>
      )}
    </div>
  )
}
