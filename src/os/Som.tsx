/**
 * A ponte entre o que acontece no jogo e o que se ouve.
 *
 * Fica aqui, e não dentro das regras, por causa da divisão de camadas: `game/`
 * não sabe que existe tela, e não pode passar a saber que existe alto-falante.
 * Então este componente ASSINA o estado e compara o antes com o depois - roubo
 * é o saldo roubado que subiu, prisão é o `busted` que virou verdadeiro.
 *
 * A vantagem de deduzir do estado, em vez de espalhar chamadas de som pelos
 * botões, é que fonte nova de dinheiro ou de missão já nasce com som. A
 * desvantagem é que o som não distingue duas causas do mesmo efeito - e é por
 * isso que a ordem dos testes abaixo importa: roubo antes de venda, porque
 * transferir mexe nos dois números.
 *
 * Não renderiza nada.
 */

import { useEffect, useRef } from 'react'
import { destravar } from '@/audio/motor'
import { acompanharRastro, useSom } from '@/audio/opcoes'
import * as som from '@/audio/sons'
import { heatLevel, useGame } from '@/game/store'
import type { GameState } from '@/game/types'

const FAIXAS = ['calmo', 'atencao', 'alerta', 'critico']

/** Só as duas faixas de cima merecem sirene. */
const ASSUSTA = new Set(['alerta', 'critico'])

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

      // --- o micro ligando ---------------------------------------------
      if (!s.started) jaLigou.current = false
      if (s.started && !s.prologue && !s.busted && !jaLigou.current) {
        jaLigou.current = true
        som.ligar()
      }

      // --- eles estão perto ---------------------------------------------
      const faixa = heatLevel(s.player.heat)
      const faixaAntes = heatLevel(antes.player.heat)
      if (FAIXAS.indexOf(faixa) > FAIXAS.indexOf(faixaAntes) && ASSUSTA.has(faixa)) {
        som.sirene()
      }

      // --- dinheiro -------------------------------------------------------
      // Roubo primeiro: transferir mexe no saldo TAMBÉM, e o som do roubo é o
      // que a pessoa quer ouvir.
      if (s.recordes.roubado > antes.recordes.roubado) som.dinheiroEntrando()
      else if (s.player.balance < antes.player.balance) som.dinheiroSaindo()
      else if (s.player.balance > antes.player.balance) som.moedinha()

      // --- trabalho ---------------------------------------------------------
      if (s.recordes.invasoes > antes.recordes.invasoes) som.acesso()
      if (s.machines.length > antes.machines.length) som.ping()
      if (s.skills.length > antes.skills.length) som.compra()
      if (s.inbox.length > antes.inbox.length) som.correio()
      if (s.missions.length > antes.missions.length) som.missao()

      // --- fim ---------------------------------------------------------
      if (s.busted && !antes.busted) som.travou()
    })
  }, [sincronizar])

  return null
}
