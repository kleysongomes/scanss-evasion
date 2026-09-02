/**
 * De uma mudança de estado para os sons que ela merece.
 *
 * Função pura, separada do componente que toca, por um motivo prático: o
 * primeiro desenho disso vivia dentro da ponte de som e tinha um bug que só
 * aparecia jogando - comprar no darkmarket tocava a compra E o som de dinheiro
 * saindo, porque comprar mexe nas duas coisas ao mesmo tempo. Aqui isso vira
 * um teste de três linhas.
 *
 * A regra que resolve essa família de bug: DINHEIRO É CONSEQUÊNCIA. Quando
 * outra coisa já explicou por que o saldo mexeu - uma compra, um prêmio de
 * missão -, o som daquela coisa é o que toca, e o do dinheiro cala. A exceção é
 * o roubo, que não é consequência de nada: é a ação em si, e o som que o
 * jogador quer ouvir.
 */

import { heatLevel } from '@/game/store'
import type { GameState } from '@/game/types'

export type Reacao =
  | 'sirene' | 'compra' | 'missao'
  | 'dinheiroEntrando' | 'dinheiroSaindo' | 'moedinha'
  | 'acesso' | 'ping' | 'correio' | 'travou'

const FAIXAS = ['calmo', 'atencao', 'alerta', 'critico']

/** Só as duas faixas de cima merecem sirene. */
const ASSUSTA = new Set(['alerta', 'critico'])

export function reagir(s: GameState, antes: GameState): Reacao[] {
  const sons: Reacao[] = []

  // --- eles estão perto -------------------------------------------------
  const faixa = heatLevel(s.player.heat)
  if (FAIXAS.indexOf(faixa) > FAIXAS.indexOf(heatLevel(antes.player.heat))
      && ASSUSTA.has(faixa)) {
    sons.push('sirene')
  }

  // --- o que explica o saldo -------------------------------------------
  const comprou = s.skills.length > antes.skills.length
  const fechouMissao = s.missions.length > antes.missions.length
  if (comprou) sons.push('compra')
  if (fechouMissao) sons.push('missao')

  // --- dinheiro ---------------------------------------------------------
  if (s.recordes.roubado > antes.recordes.roubado) {
    // O roubo toca sempre: é a ação, não o troco dela.
    sons.push('dinheiroEntrando')
  } else if (!comprou && !fechouMissao) {
    if (s.player.balance < antes.player.balance) sons.push('dinheiroSaindo')
    else if (s.player.balance > antes.player.balance) sons.push('moedinha')
  }

  // --- trabalho ---------------------------------------------------------
  if (s.recordes.invasoes > antes.recordes.invasoes) sons.push('acesso')
  if (s.machines.length > antes.machines.length) sons.push('ping')
  if (s.inbox.length > antes.inbox.length) sons.push('correio')

  // --- fim --------------------------------------------------------------
  if (s.busted && !antes.busted) sons.push('travou')

  return sons
}
