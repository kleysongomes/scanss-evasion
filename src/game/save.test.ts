/**
 * Testa a coerencia do save.
 *
 * Regressao de um bug real: o formato do estado mudou sem subir a `version` do
 * persist, entao o zustand misturou o save antigo com o estado novo. As
 * maquinas vinham do save velho e as contas do banco de uma geracao nova - o
 * arquivo de senhas apontava para um usuario inexistente e o banco recusava um
 * login que estava correto ("Usuário ou senha inválidos").
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { walk } from './fs'
import { gerarAlvo } from './generator'
import { saveConsistente, useGame } from './store'
import type { GameState } from './types'

const g = () => useGame.getState()

beforeEach(() => { g().reset() })

describe('coerencia do estado', () => {
  it('toda credencial espalhada pela rede tem conta no banco', () => {
    const contas = new Set(Object.keys(g().accounts))
    for (const m of g().machines) {
      for (const f of walk(m.root)) {
        if (f.grants) {
          expect(contas, `${m.hostname} guarda senha de ${f.grants.user}`)
            .toContain(f.grants.user)
        }
      }
    }
  })

  it('continua coerente depois de varias varreduras', () => {
    for (let i = 0; i < 15; i++) g().scan()
    const contas = new Set(Object.keys(g().accounts))
    for (const m of g().machines) {
      for (const f of walk(m.root)) {
        if (f.grants) expect(contas).toContain(f.grants.user)
      }
    }
  })

  it('a senha do arquivo e a mesma que o banco aceita', () => {
    // Este e o coracao do bug: os dois lados tem que sair da mesma conta.
    for (let i = 0; i < 200; i++) {
      const { machine, account } = gerarAlvo(1, 'x', new Set())
      if (!account) continue
      const bilhete = walk(machine.root).find((f) => f.grants)
      if (!bilhete) continue

      expect(bilhete.grants!.user).toBe(account.user)
      expect(bilhete.grants!.pass).toBe(account.pass)
      // E o conteudo que o jogador le tem que bater com o que o banco espera.
      expect(bilhete.content).toContain(account.user)
      expect(bilhete.content).toContain(account.pass)
    }
  })

  it('o alvo gerado pelo modo dev tambem registra a conta', () => {
    g().setDevMode(true)
    g().devSpawn(4, 6)
    const contas = new Set(Object.keys(g().accounts))
    for (const m of g().machines) {
      for (const f of walk(m.root)) {
        if (f.grants) expect(contas).toContain(f.grants.user)
      }
    }
  })
})

describe('a checagem que decide descartar o save', () => {
  it('aceita um estado recem-criado', () => {
    expect(saveConsistente(g())).toBe(true)
  })

  it('recusa estado sem accounts', () => {
    expect(saveConsistente(undefined)).toBe(false)
    expect(saveConsistente({} as never)).toBe(false)
    expect(saveConsistente({ ...g(), accounts: undefined as never })).toBe(false)
  })

  it('recusa credencial sem conta correspondente', () => {
    const { machine } = gerarAlvo(1, 'x', new Set())
    const temBilhete = walk(machine.root).some((f) => f.grants)
    if (!temBilhete) return
    expect(saveConsistente({ ...g(), machines: [machine], accounts: {} }))
      .toBe(false)
  })

  it('tambem olha o disco do jogador, nao so as maquinas', () => {
    const { machine } = gerarAlvo(1, 'x', new Set())
    const bilhete = walk(machine.root).find((f) => f.grants)
    if (!bilhete) return
    expect(saveConsistente({ ...g(), machines: [], accounts: {}, disk: [bilhete] }))
      .toBe(false)
  })
})

describe('save incoerente', () => {
  /** Reproduz o save quebrado: maquinas antigas, contas de outra geracao. */
  function saveMisturado(): Partial<GameState> {
    const antiga = gerarAlvo(1, 'velha', new Set()).machine
    const nova = gerarAlvo(1, 'nova', new Set())
    return {
      machines: [antiga],
      // A conta que existe NAO e a do arquivo de senhas de `antiga`.
      accounts: nova.account ? { [nova.account.user]: nova.account } : {},
      disk: [],
    }
  }

  it('o login recusaria a senha certa num save assim', () => {
    const quebrado = saveMisturado()
    const bilhete = walk(quebrado.machines![0].root).find((f) => f.grants)
    if (!bilhete) return

    useGame.setState({
      machines: quebrado.machines,
      accounts: quebrado.accounts,
      credentials: [bilhete.grants!],
    })

    // Exatamente o sintoma relatado: a senha do arquivo é recusada.
    const r = g().login('vbank.vc', bilhete.grants!.user, bilhete.grants!.pass)
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/inválidos/)
  })

  it('um estado sem accounts nao derruba o login', () => {
    // Antes da correcao isto estourava com TypeError.
    useGame.setState({ accounts: undefined as unknown as GameState['accounts'] })
    expect(() => g().login('vbank.vc', 'alguem', 'x')).not.toThrow()
    expect(g().login('vbank.vc', 'alguem', 'x').ok).toBe(false)
  })

  it('um estado sem accounts nao derruba a transferencia', () => {
    useGame.setState({ accounts: undefined as unknown as GameState['accounts'] })
    expect(() => g().transfer('alguem', '0000-0000', 10)).not.toThrow()
  })
})
