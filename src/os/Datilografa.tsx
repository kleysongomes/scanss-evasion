/**
 * Texto escrito letra a letra, com o cursor piscando no fim.
 *
 * Sai daqui e nao de dentro da abertura porque duas telas usam: a abertura e o
 * prologo. A velocidade e deliberadamente lenta - texto que aparece rapido nao
 * ambienta, so informa.
 */

import { useEffect, useRef, useState } from 'react'

/** Milissegundos por caractere. */
const POR_LETRA = 48
/** Pausa extra depois de sinal de pontuacao forte, para dar respiro. */
const PAUSA_PONTO = 340

interface Props {
  texto: string
  className?: string
  /** Chamado quando termina de escrever (mais a `pausaFinal`). */
  aoTerminar?: () => void
  pausaFinal?: number
}

export function Datilografa({ texto, className, aoTerminar, pausaFinal = 0 }: Props) {
  const [n, setN] = useState(0)
  const fim = useRef(aoTerminar)
  fim.current = aoTerminar

  useEffect(() => {
    setN(0)
    let i = 0
    let vivo = true
    let id: number

    function proxima() {
      if (!vivo) return
      i++
      setN(i)

      if (i >= texto.length) {
        id = window.setTimeout(() => fim.current?.(), pausaFinal)
        return
      }
      // Ponto, dois-pontos e quebra de linha respiram um pouco mais.
      const c = texto[i - 1]
      const espera = '.:!?\n'.includes(c) ? POR_LETRA + PAUSA_PONTO : POR_LETRA
      id = window.setTimeout(proxima, espera)
    }

    id = window.setTimeout(proxima, POR_LETRA)
    return () => { vivo = false; clearTimeout(id) }
  }, [texto, pausaFinal])

  return (
    <pre className={className}>
      {texto.slice(0, n)}
      <span className="cursor" />
    </pre>
  )
}
