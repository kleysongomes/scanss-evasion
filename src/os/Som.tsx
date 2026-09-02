/**
 * A ponte entre o que acontece no jogo e o que se ouve.
 *
 * Fica aqui, e não dentro das regras, por causa da divisão de camadas: `game/`
 * não sabe que existe tela, e não pode passar a saber que existe alto-falante.
 * Então este componente ASSINA o estado e compara o antes com o depois - roubo
 * é o saldo roubado que subiu, prisão é o `busted` que virou verdadeiro.
 *
 * A decisão de QUAIS sons tocar mora em `audio/reacoes.ts`, numa função pura.
 * Aqui sobrou só o encanamento: destravar o áudio no primeiro gesto, tocar o
 * que a função mandar, e a única coisa que depende de memória - o som de ligar,
 * que toca uma vez por partida.
 *
 * Não renderiza nada.
 */

import { useEffect, useRef } from 'react'
import { destravar } from '@/audio/motor'
import { acompanharRastro, useSom } from '@/audio/opcoes'
import { reagir } from '@/audio/reacoes'
import * as som from '@/audio/sons'
import { useGame } from '@/game/store'
import type { GameState } from '@/game/types'

export function Som() {
  const sincronizar = useSom((s) => s.sincronizar)
  const jaLigou = useRef(false)

  /**
   * O navegador só deixa tocar som depois de um gesto, então o motor liga no
   * primeiro clique ou tecla - qualquer um, em qualquer tela.
   *
   * O ouvinte fica no ar em vez de sair depois do primeiro: trocar de aba pode
   * suspender o contexto de áudio, e aí o próximo clique o acorda de novo.
   * `destravar` não faz nada quando já está tudo ligado.
   */
  useEffect(() => {
    const acordar = () => { destravar(); sincronizar() }
    window.addEventListener('pointerdown', acordar)
    window.addEventListener('keydown', acordar)
    return () => {
      window.removeEventListener('pointerdown', acordar)
      window.removeEventListener('keydown', acordar)
    }
  }, [sincronizar])

  useEffect(() => {
    // O motor pode ter sido destravado depois da carga da página; garante que
    // ele receba os volumes guardados.
    sincronizar()

    return useGame.subscribe((s: GameState, antes: GameState) => {
      acompanharRastro(s.player.heat)

      // O micro ligando é o único som com memória: uma vez por partida.
      if (!s.started) jaLigou.current = false
      if (s.started && !s.prologue && !s.busted && !jaLigou.current) {
        jaLigou.current = true
        som.ligar()
      }

      for (const nome of reagir(s, antes)) som[nome]()
    })
  }, [sincronizar])

  return null
}
