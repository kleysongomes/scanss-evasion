/**
 * Aviso de missao concluida, no canto da bandeja.
 *
 * Diferente do aviso de e-mail, este NAO pausa o jogo: e um tapinha no ombro,
 * nao uma interrupcao. Sem ele o quadro de missoes seria um segredo - o jogador
 * cumpriria um desafio, receberia o premio e nunca saberia por que o saldo
 * subiu.
 *
 * Ele descobre o que fechou comparando a lista de concluidas com a de um
 * instante atras, em vez de receber isso de fora, para nao obrigar o Desktop a
 * carregar estado que nao e dele.
 *
 * Por isso ele fica SEMPRE montado e se esconde sozinho enquanto o jogo esta
 * pausado, em vez de o Desktop montar e desmontar conforme a pausa. A primeira
 * versao fazia o contrario e nao mostrava nada no caso mais comum do jogo: uma
 * acao fecha a missao e traz um e-mail junto, o jogo pausa, e o aviso nascia
 * depois - sem lembranca de que algo tinha acabado de fechar.
 */

import { useEffect, useRef, useState } from 'react'
import { MISSAO_POR_ID } from '@/game/missions'
import type { Missao } from '@/game/missions'
import { useGame } from '@/game/store'

/** Quanto tempo o aviso fica na tela. */
const DURACAO_MS = 7000

export function MissionAlert() {
  const missions = useGame((s) => s.missions)
  const paused = useGame((s) => s.paused)
  const [mostrando, setMostrando] = useState<Missao[]>([])
  const anteriores = useRef<string[] | null>(null)

  useEffect(() => {
    const antes = anteriores.current
    anteriores.current = missions

    // A primeira passada e a carga do save: o que ja estava concluido nao
    // "acabou de concluir", e nao pode virar aviso ao abrir a partida.
    if (antes === null) return

    const novas = missions
      .filter((id) => !antes.includes(id))
      .map((id) => MISSAO_POR_ID[id])
      .filter((m): m is Missao => Boolean(m))

    if (novas.length > 0) setMostrando(novas)
  }, [missions])

  // O relogio do aviso so anda com o jogo andando: se contasse durante a pausa
  // do e-mail, os 7 segundos venciam atras do aviso de e-mail e o jogador
  // nunca veria que fechou missao.
  useEffect(() => {
    if (paused || mostrando.length === 0) return
    const t = setTimeout(() => setMostrando([]), DURACAO_MS)
    return () => clearTimeout(t)
  }, [paused, mostrando])

  if (paused || mostrando.length === 0) return null

  const premio = mostrando.reduce((total, m) => total + m.premio, 0)

  return (
    <div className="mission-alert">
      <div className="cabeca">
        <span>✔</span>
        <b>{mostrando.length === 1 ? 'Missão concluída'
                                   : `${mostrando.length} missões concluídas`}</b>
      </div>

      {mostrando.map((m) => (
        <div className="item" key={m.id}>{m.titulo}</div>
      ))}

      {premio > 0 && (
        <div className="premio">
          Prêmio: <b>{premio.toLocaleString('pt-BR')} VC</b> na sua conta.
        </div>
      )}

      <div className="acoes">
        <button className="xp" onClick={() => setMostrando([])}>OK</button>
      </div>
    </div>
  )
}
