/**
 * Auditoria do quadro de missões: procura o tipo de erro que só aparece
 * jogando, e tarde.
 *
 * Missão quebrada não estoura nada. Ela simplesmente fica aberta para sempre no
 * quadro do jogador, e da poltrona isso é indistinguível de bug do jogo. Já
 * aconteceu duas vezes: uma missão que dizia "vender OU apagar" mas só fechava
 * apagando, e outra que prometia "comprar 20 níveis" contando os dois que já
 * vêm no micro.
 *
 * Por isso estes testes conferem as condições contra o CÓDIGO e contra os
 * limites do jogo, e não contra uma lista escrita à mão que envelhece sozinha.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { DESAFIOS, GUIAS, MISSOES } from './missions'
import type { Missao } from './missions'
import { BRANCHES, MAX_LEVEL, SKILLS } from './skills'
import { ROTEIRO } from './story'
import type { Condicao } from './story'
import { useGame } from './store'

const g = () => useGame.getState()

beforeEach(() => {
  g().reset()
  g().start('kleyson')
})

/** Todo arquivo de código do jogo. */
function fontes(dir = 'src'): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome)
    if (statSync(caminho).isDirectory()) return fontes(caminho)
    return /\.tsx?$/.test(nome) && !nome.endsWith('.test.ts') ? [caminho] : []
  })
}

/**
 * Os marcos que o jogo REALMENTE registra, lidos do código.
 *
 * Lido da fonte, e não de uma lista mantida à mão: uma lista à mão continuaria
 * dizendo que `marco:vender` existe muito depois de alguém ter renomeado a
 * ação, e a missão presa nele nunca fecharia.
 */
const MARCOS_REGISTRADOS = new Set(
  fontes().flatMap((arquivo) => (
    [...readFileSync(arquivo, 'utf-8').matchAll(/mark\('([a-z]+)'\)/g)]
      .map((m) => m[1])
  )))

const RAMOS = new Set(BRANCHES.map((b) => b.id))

const condicoesDe = (m: Missao): Condicao[] => [...m.quando, ...m.feito]

describe('as condições apontam para coisas que existem', () => {
  it('o teste consegue ler os marcos do código', () => {
    // Se a leitura falhar, os testes abaixo passariam por vacuidade.
    expect(MARCOS_REGISTRADOS.size).toBeGreaterThan(8)
    expect(MARCOS_REGISTRADOS).toContain('transfer')
  })

  it('todo `marco:` é um marco que alguma ação registra', () => {
    for (const m of MISSOES) {
      for (const c of condicoesDe(m)) {
        if (c.tipo !== 'marco') continue
        expect(MARCOS_REGISTRADOS, `${m.id} espera o marco "${c.valor}"`)
          .toContain(c.valor)
      }
    }
  })

  it('todo `ramo:` é um ramo da árvore', () => {
    for (const m of MISSOES) {
      for (const c of condicoesDe(m)) {
        if (c.tipo !== 'ramo') continue
        expect(RAMOS, `${m.id} espera o ramo "${c.valor}"`).toContain(c.valor)
      }
    }
  })

  it('todo `email:` aponta para um e-mail do roteiro', () => {
    const ids = new Set(ROTEIRO.map((r) => r.id))
    for (const m of MISSOES) {
      for (const c of condicoesDe(m)) {
        if (c.tipo !== 'email') continue
        expect(ids, `${m.id} espera o e-mail "${c.valor}"`).toContain(c.valor)
      }
    }
  })
})

describe('as metas cabem dentro do jogo', () => {
  /** Nenhum número pode passar do teto do que o jogo consegue produzir. */
  it('nenhuma meta é impossível de alcançar', () => {
    for (const m of MISSOES) {
      for (const c of condicoesDe(m)) {
        const onde = `${m.id} · ${c.tipo}`
        if (c.tipo === 'ramo' || c.tipo === 'defesa') {
          expect(c.n, onde).toBeLessThanOrEqual(MAX_LEVEL)
        }
        if (c.tipo === 'upgrades') {
          expect(c.n, onde).toBeLessThanOrEqual(SKILLS.length)
        }
        if (c.tipo === 'tier') {
          expect(c.n, onde).toBeLessThanOrEqual(MAX_LEVEL)
        }
        if (c.tipo === 'rastro' || c.tipo === 'abaixo') {
          expect(c.n, onde).toBeGreaterThanOrEqual(0)
          expect(c.n, onde).toBeLessThanOrEqual(100)
        }
        if ('n' in c) expect(c.n, `${onde}: número inválido`).not.toBeNaN()
      }
    }
  })

  /**
   * A lista de ataques é cortada nos 40 mais recentes, então meta grande de
   * ataque nunca fecharia.
   */
  it('as metas de ataque cabem na lista que o jogo guarda', () => {
    for (const m of MISSOES) {
      for (const c of condicoesDe(m)) {
        if (c.tipo === 'ataques' || c.tipo === 'bloqueados') {
          expect(c.n, `${m.id} · ${c.tipo}`).toBeLessThanOrEqual(40)
        }
      }
    }
  })
})

describe('nenhuma missão nasce cumprida', () => {
  /**
   * O caso clássico: "deixar o disco sem evidência" já é verdade no primeiro
   * segundo, porque o disco começa vazio. Se a missão também estiver aberta de
   * saída, ela fecha sozinha e paga o prêmio sem o jogador fazer nada.
   */
  it('nada fecha no primeiro tique de uma partida nova', () => {
    g().deliverMail()
    const fechadas = g().checkMissions()
    expect(fechadas.map((m) => m.id)).toEqual([])
    expect(g().missions).toEqual([])
  })

  it('e nada fecha depois de só varrer a rede', () => {
    g().deliverMail()
    g().scan()
    const fechadas = g().checkMissions().map((m) => m.id)
    // Varrer conclui a primeira missão da história, e só ela.
    expect(fechadas).toEqual(['01-oi-sumido'])
  })
})

describe('cada missão tem como fechar', () => {
  it('toda missão diz o que a conclui', () => {
    for (const m of MISSOES) {
      expect(m.feito.length, `${m.id}: sem condição de conclusão`)
        .toBeGreaterThan(0)
    }
  })

  /**
   * Condição que só olha o passado (`marco:`, `rastro:`) num `feito` de missão
   * aberta POR aquele mesmo passado fecharia junto com a abertura. Isso é
   * legítimo em alguns casos, mas nunca numa missão que pede uma ação nova.
   */
  it('nenhuma missão fecha exatamente com o que a abriu', () => {
    for (const m of MISSOES) {
      const abre = m.quando.map((c) => JSON.stringify(c))
      for (const c of m.feito) {
        expect(abre, `${m.id} abre e fecha com a mesma condição`)
          .not.toContain(JSON.stringify(c))
      }
    }
  })

  it('as guias da história vêm do roteiro, e os desafios do código', () => {
    const doRoteiro = new Set(ROTEIRO.filter((r) => r.objetivo).map((r) => r.id))
    for (const m of GUIAS) expect(doRoteiro).toContain(m.id)
    for (const m of DESAFIOS) expect(m.id.startsWith('d-'), m.id).toBe(true)
  })
})
