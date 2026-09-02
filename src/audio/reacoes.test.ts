/**
 * Testa qual som cada mudança de estado merece.
 *
 * Existe por causa de um bug reportado jogando: comprar no darkmarket tocava
 * DOIS sons ao mesmo tempo - a compra e o dinheiro saindo -, porque comprar
 * mexe nas duas coisas de uma vez. Enquanto a decisão morava dentro do
 * componente que toca, um erro desses só aparecia com fone no ouvido.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { reagir } from './reacoes'
import { useGame } from '../game/store'
import type { GameState } from '../game/types'

const g = () => useGame.getState() as GameState

beforeEach(() => {
  useGame.getState().reset()
  useGame.getState().start('kleyson')
})

/** Uma cópia do estado atual com uns campos trocados. */
function comoSe(mudancas: Partial<GameState>): GameState {
  return { ...g(), ...mudancas }
}

describe('dinheiro é consequência', () => {
  /** O bug relatado. */
  it('comprar toca a compra, e só ela', () => {
    const antes = g()
    const depois = comoSe({
      skills: [...antes.skills, 'crypto1'],
      player: { ...antes.player, balance: antes.player.balance - 260 },
    })
    expect(reagir(depois, antes)).toEqual(['compra'])
  })

  it('fechar missão com prêmio toca a missão, e só ela', () => {
    const antes = g()
    const depois = comoSe({
      missions: ['d-tres-portas'],
      player: { ...antes.player, balance: antes.player.balance + 400 },
    })
    expect(reagir(depois, antes)).toEqual(['missao'])
  })

  it('missão sem prêmio também soa', () => {
    const antes = g()
    expect(reagir(comoSe({ missions: ['01-oi-sumido'] }), antes))
      .toEqual(['missao'])
  })

  /**
   * O roubo é a exceção: ele não é o troco de outra coisa, é a ação. Se uma
   * missão fechar no mesmo instante, as duas notícias soam.
   */
  it('roubar toca o roubo mesmo quando fecha missão junto', () => {
    const antes = g()
    const depois = comoSe({
      missions: ['d-cinco-mil'],
      recordes: { ...antes.recordes, roubado: 5000 },
      player: { ...antes.player, balance: antes.player.balance + 5000 },
    })
    expect(reagir(depois, antes)).toEqual(['missao', 'dinheiroEntrando'])
  })

  it('perder dinheiro sem explicação toca o prejuízo', () => {
    const antes = g()
    const depois = comoSe({
      player: { ...antes.player, balance: antes.player.balance - 40 },
    })
    expect(reagir(depois, antes)).toEqual(['dinheiroSaindo'])
  })

  it('vender toca a moedinha', () => {
    const antes = g()
    const depois = comoSe({
      player: { ...antes.player, balance: antes.player.balance + 80 },
    })
    expect(reagir(depois, antes)).toEqual(['moedinha'])
  })

  it('estado parado não toca nada', () => {
    expect(reagir(g(), g())).toEqual([])
  })
})

describe('os outros avisos', () => {
  it('o alerta soa ao subir de faixa, e só para cima', () => {
    const antes = g()
    const quente = comoSe({ player: { ...antes.player, heat: 62 } })
    expect(reagir(quente, antes)).toContain('sirene')
    // Descendo, não.
    expect(reagir(antes, quente)).not.toContain('sirene')
  })

  it('as faixas de baixo não merecem alerta', () => {
    const antes = g()
    const morno = comoSe({ player: { ...antes.player, heat: 35 } })
    expect(reagir(morno, antes)).not.toContain('sirene')
  })

  it('invadir, varrer, receber e-mail e cair têm som próprio', () => {
    const antes = g()
    expect(reagir(comoSe({
      recordes: { ...antes.recordes, invasoes: 1 },
    }), antes)).toContain('acesso')

    expect(reagir(comoSe({
      machines: [...antes.machines, antes.machines[0]],
    }), antes)).toContain('ping')

    expect(reagir(comoSe({
      inbox: [{ id: 'x', de: 'a@b.vc', assunto: 'oi', corpo: 'oi', em: 0,
                lido: false }],
    }), antes)).toContain('correio')

    expect(reagir(comoSe({ busted: true }), antes)).toContain('travou')
  })
})
