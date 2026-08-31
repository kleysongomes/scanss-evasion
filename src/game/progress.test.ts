/**
 * Testa o checklist do manual: os marcos precisam acompanhar o que o jogador
 * fez de verdade, e o "proximo passo" precisa ser sempre o primeiro pendente.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { gerarAlvo } from './generator'
import { STEPS, isDone, nextStep, progress } from './progress'
import { DOWNLOADS, useGame } from './store'
import type { BankAccount, VFile, VNode } from './types'

const g = () => useGame.getState()

function achar(root: VNode[], teste: (f: VFile) => boolean,
               path: string[] = []): { path: string[]; file: VFile } | null {
  for (const n of root) {
    if (n.type === 'folder') {
      const achou = achar(n.children, teste, [...path, n.name])
      if (achou) return achou
    } else if (teste(n)) return { path, file: n }
  }
  return null
}

function destrancar(nodes: VNode[]): VNode[] {
  return nodes.map((n) => (
    n.type === 'folder'
      ? { ...n, children: destrancar(n.children) }
      : { ...n, locked: 0 }))
}

interface Cenario { account: BankAccount; senhas: VFile; path: string[] }

/** Injeta um alvo do andar 1 com arquivo de senhas destrancado. */
function prepararAlvo(): Cenario {
  for (let i = 0; i < 300; i++) {
    const { machine, account } = gerarAlvo(1, 'alvo', new Set())
    if (!account) continue
    const root = destrancar(machine.root)
    const achou = achar(root, (f) => !!f.grants)
    if (!achou) continue

    useGame.setState({
      machines: [{ ...machine, root, found: true }],
      accounts: { [account.user]: account },
    })
    return { account, senhas: achou.file, path: achou.path }
  }
  throw new Error('o gerador não produziu alvo com conta em 300 tentativas')
}

/** Roda o loop ate o passo pedido, como um jogador faria. */
function jogarAte(passo: string): Cenario {
  const ate = STEPS.findIndex((s) => s.id === passo)
  const c = prepararAlvo()

  g().scan()
  if (ate < 1) return c
  g().probe('alvo')
  if (ate < 2) return c
  g().exploit('alvo')
  if (ate < 3) return c
  g().connect('alvo')
  if (ate < 4) return c
  g().download(c.path, c.senhas.name)
  if (ate < 5) return c
  g().reveal(c.senhas)
  if (ate < 6) return c
  g().login('vbank.vc', c.account.user, c.account.pass)
  if (ate < 7) return c
  g().transfer(c.account.user, g().player.muleAccount, c.account.balance)
  if (ate < 8) return c
  g().remove([DOWNLOADS], c.senhas.name)
  if (ate < 9) return c
  useGame.setState((s) => ({ player: { ...s.player, balance: 999_999 } }))
  g().buySkill('crypto1')
  return c
}

beforeEach(() => { g().reset() })

describe('marcos', () => {
  it('comeca sem nenhum marco', () => {
    expect(g().milestones).toEqual([])
    expect(g().reached('scan')).toBe(false)
  })

  it('cada acao do loop registra o seu marco', () => {
    jogarAte('buy')
    for (const s of STEPS) {
      expect(isDone(g(), s.id), `faltou o marco '${s.id}'`).toBe(true)
    }
  })

  it('nao registra marco quando a acao falha', () => {
    prepararAlvo()
    g().scan()
    g().exploit('alvo')                  // sem analisar antes
    expect(isDone(g(), 'exploit')).toBe(false)
    g().buySkill('ghost1')               // sem saldo
    expect(isDone(g(), 'buy')).toBe(false)
  })

  it('e idempotente', () => {
    g().scan(); g().scan(); g().scan()
    expect(g().milestones.filter((m) => m === 'scan')).toHaveLength(1)
  })
})

describe('proximo passo', () => {
  it('num jogo novo, manda varrer a rede', () => {
    expect(nextStep(g())?.id).toBe('scan')
  })

  it('avanca junto com o jogador', () => {
    jogarAte('scan')
    expect(nextStep(g())?.id).toBe('probe')
    jogarAte('connect')
    expect(nextStep(g())?.id).toBe('download')
    jogarAte('creds')
    expect(nextStep(g())?.id).toBe('login')
  })

  it('some quando o loop inteiro foi concluido', () => {
    jogarAte('buy')
    expect(nextStep(g())).toBeNull()
  })
})

describe('progresso', () => {
  it('vai de 0 ate o total conforme o jogador avanca', () => {
    const total = STEPS.length
    expect(progress(g())).toEqual({ feitos: 0, total })
    jogarAte('creds')
    expect(progress(g()).feitos).toBe(6)
    jogarAte('buy')
    expect(progress(g())).toEqual({ feitos: total, total })
  })

  it('todo passo do checklist diz onde se faz', () => {
    for (const s of STEPS) {
      expect(s.label.length, s.id).toBeGreaterThan(0)
      expect(s.how.length, s.id).toBeGreaterThan(0)
    }
  })
})
