/**
 * Manual do Operador: o tutorial completo do jogo, em capitulos.
 *
 * O sumario da esquerda navega; o Klipe embaixo dele comenta a pagina atual.
 * O capitulo "Onde voce esta" le o estado real da partida.
 */

import { useEffect, useRef, useState } from 'react'
import { progress } from '@/game/progress'
import { useGame } from '@/game/store'
import { Klipe } from '@/os/Klipe'
import { CHAPTERS } from './manual'

interface Props { args?: Record<string, unknown> }

export function Tutorial({ args }: Props) {
  const inicial = (args?.chapter as string) ?? CHAPTERS[0].id
  const [atual, setAtual] = useState(inicial)
  const game = useGame()
  const { feitos, total } = progress(game)
  const corpo = useRef<HTMLDivElement>(null)

  const i = Math.max(0, CHAPTERS.findIndex((c) => c.id === atual))
  const cap = CHAPTERS[i]

  // Trocar de capitulo volta a leitura para o topo.
  useEffect(() => { corpo.current?.scrollTo(0, 0) }, [atual])

  return (
    <div className="grow row" style={{ alignItems: 'stretch', gap: 3 }}>
      {/* sumario */}
      <div className="manual-toc">
        <div className="titulo">Manual do Operador</div>

        <div className="scroll grow">
          {CHAPTERS.map((c, n) => (
            <button
              key={c.id}
              className={`item${c.id === atual ? ' ativo' : ''}`}
              onClick={() => setAtual(c.id)}
            >
              <span className="n">{n + 1}</span>
              <span className="tx">{c.title}</span>
            </button>
          ))}
        </div>

        {/* o Klipe comenta a pagina atual */}
        <div className="manual-klipe">
          <div className="fala">{cap.klipe}</div>
          <Klipe size={54} key={cap.id} />
        </div>
      </div>

      {/* conteudo */}
      <div className="col grow" style={{ gap: 3 }}>
        <div className="manual-page sunken scroll grow" ref={corpo}>
          <cap.Body />
        </div>

        <div className="row" style={{ padding: '0 2px 2px' }}>
          <button className="xp" disabled={i === 0}
                  onClick={() => setAtual(CHAPTERS[i - 1].id)}>
            ◀ Anterior
          </button>
          <button className="xp" disabled={i === CHAPTERS.length - 1}
                  onClick={() => setAtual(CHAPTERS[i + 1].id)}>
            Próximo ▶
          </button>
          <span className="grow" />
          <button className="xp" onClick={() => setAtual('onde')}>
            Onde eu parei?
          </button>
        </div>

        <div className="statusbar">
          <span className="grow">
            Capítulo {i + 1} de {CHAPTERS.length} — {cap.title}
          </span>
          <span>Progresso do jogo: {feitos}/{total}</span>
        </div>
      </div>
    </div>
  )
}
