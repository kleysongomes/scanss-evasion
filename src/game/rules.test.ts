/**
 * Testa o loop completo sem abrir a interface.
 *
 * Como os alvos agora sao sorteados, os testes montam o cenario com o proprio
 * gerador e injetam no estado - assim exercitam o codigo de verdade sem
 * depender da sorte de uma partida especifica.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { listAt, totalEvidence, walk } from './fs'
import { gerarAlvo } from './generator'
import { BRANCHES, MAX_LEVEL, SKILL_BY_ID, levelOf, skillsOf } from './skills'
import {
  DOWNLOADS, decayPerMinute, evidenceHeatPerHour, useGame,
} from './store'
import type { BankAccount, GameState, Machine, VFile, VNode } from './types'

const g = () => useGame.getState()

/** Acha um arquivo na arvore, devolvendo a pasta em que ele esta. */
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

/** Abre todos os cadeados de uma arvore, para o teste focar na regra testada. */
function destrancar(nodes: VNode[]): VNode[] {
  return nodes.map((n) => (
    n.type === 'folder'
      ? { ...n, children: destrancar(n.children) }
      : { ...n, locked: 0 }))
}

interface Cenario { machine: Machine; account: BankAccount; senhas: VFile
                    path: string[] }

/**
 * Injeta um alvo pronto com arquivo de senhas destrancado.
 * Tenta ate o gerador produzir um alvo com conta (a maioria produz).
 */
function prepararAlvo(tier = 1, { trancado = false } = {}): Cenario {
  for (let i = 0; i < 300; i++) {
    const { machine, account } = gerarAlvo(tier, 'alvo', new Set())
    if (!account) continue

    const root = trancado ? machine.root : destrancar(machine.root)
    const achou = achar(root, (f) => !!f.grants)
    if (!achou) continue

    useGame.setState({
      machines: [{ ...machine, root, found: true }],
      accounts: { [account.user]: account },
    })
    return { machine, account, senhas: achou.file, path: achou.path }
  }
  throw new Error('o gerador não produziu alvo com conta em 300 tentativas')
}

/** Leva o cenario ate ter o disco montado na Z:. */
function conectar(c: Cenario) {
  g().probe('alvo')
  g().exploit('alvo')
  g().connect('alvo')
  return c
}

function comSaldo(vc: number) {
  useGame.setState((s) => ({ player: { ...s.player, balance: vc } }))
}

beforeEach(() => { g().reset() })

describe('gerador', () => {
  it('a partida comeca com varios alvos, nao com dois', () => {
    expect(g().machines.length).toBeGreaterThanOrEqual(5)
  })

  it('o primeiro alvo sempre rende algo, para o tutorial nao travar', () => {
    expect(Object.keys(g().accounts).length).toBeGreaterThan(0)
  })

  it('toda maquina tem pastas, com o que interessa enterrado', () => {
    for (const m of g().machines) {
      expect(m.root.every((n) => n.type === 'folder')).toBe(true)
      expect(walk(m.root).length).toBeGreaterThan(4)
    }
  })

  it('andar maior gera conta mais gorda', () => {
    const media = (tier: number) => {
      const saldos: number[] = []
      for (let i = 0; i < 120; i++) {
        const { account } = gerarAlvo(tier, 'x', new Set())
        if (account) saldos.push(account.balance)
      }
      return saldos.reduce((a, b) => a + b, 0) / saldos.length
    }
    expect(media(6)).toBeGreaterThan(media(1) * 3)
  })

  it('as senhas do andar 1 nunca vem trancadas (o jogador ainda nao tem chave)', () => {
    for (let i = 0; i < 60; i++) {
      const { machine } = gerarAlvo(1, 'x', new Set())
      const creds = achar(machine.root, (f) => !!f.grants)
      if (creds) expect(creds.file.locked).toBe(0)
    }
  })
})

describe('varredura', () => {
  it('gera alvos novos a cada varredura, ate a capacidade', () => {
    const antes = g().machines.filter((m) => m.found).length
    g().scan()
    const depois = g().machines.filter((m) => m.found).length
    expect(depois).toBeGreaterThan(antes)
  })

  it('nao passa da capacidade do Rastreador', () => {
    for (let i = 0; i < 12; i++) g().scan()
    // Rastreador nivel 1 -> capacidade 6
    expect(g().machines.filter((m) => m.found).length).toBeLessThanOrEqual(6)
  })

  it('subir o Rastreador aumenta a lista', () => {
    for (let i = 0; i < 12; i++) g().scan()
    const noNivel1 = g().machines.filter((m) => m.found).length

    comSaldo(999_999)
    g().buySkill('scanner2')
    for (let i = 0; i < 12; i++) g().scan()
    expect(g().machines.filter((m) => m.found).length).toBeGreaterThan(noNivel1)
  })

  it('esquecer tira o host da lista e libera espaco', () => {
    g().scan()
    const alvo = g().machines.find((m) => m.found)!
    const antes = g().machines.length
    g().forget(alvo.id)
    expect(g().machines.length).toBe(antes - 1)
    expect(g().machine(alvo.id)).toBeUndefined()
  })
})

describe('invasao', () => {
  it('exige analisar antes de invadir', () => {
    prepararAlvo()
    expect(g().exploit('alvo').message).toMatch(/Analise/)
  })

  it('exige o nivel de Intrusao do andar', () => {
    prepararAlvo(4)
    g().probe('alvo')
    const r = g().exploit('alvo')
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/Intrusão nível 4/)
    expect(g().machine('alvo')!.exploited).toBe(false)
  })

  it('invade o andar 1 com o nivel inicial', () => {
    prepararAlvo()
    g().probe('alvo')
    expect(g().exploit('alvo').ok).toBe(true)
  })

  it('conectar so funciona depois de invadir', () => {
    prepararAlvo()
    expect(g().connect('alvo').ok).toBe(false)
    g().probe('alvo'); g().exploit('alvo')
    expect(g().connect('alvo').ok).toBe(true)
  })
})

describe('arquivos da vitima', () => {
  it('baixa para C:\\Baixados', () => {
    const c = conectar(prepararAlvo())
    expect(g().download(c.path, c.senhas.name).ok).toBe(true)
    expect(listAt(g().disk, [DOWNLOADS])!.map((n) => n.name))
      .toContain(c.senhas.name)
  })

  it('nao baixa arquivo trancado', () => {
    // Andar alto quase sempre tem cadeado; procura um arquivo trancado.
    for (let i = 0; i < 60; i++) {
      const { machine, account } = gerarAlvo(5, 'alvo', new Set())
      const trancado = achar(machine.root, (f) => f.locked > 0)
      if (!trancado || !account) continue
      useGame.setState({
        machines: [{ ...machine, found: true, probed: true, exploited: true }],
        accounts: { [account.user]: account },
        connectedId: 'alvo',
      })
      const r = g().download(trancado.path, trancado.file.name)
      expect(r.ok).toBe(false)
      expect(r.message).toMatch(/trancado/)
      return
    }
    throw new Error('não achei arquivo trancado em 60 tentativas')
  })

  it('quebrar cadeado exige o Decodificador no nivel do cadeado', () => {
    for (let i = 0; i < 80; i++) {
      const { machine, account } = gerarAlvo(3, 'alvo', new Set())
      const alvo = achar(machine.root, (f) => f.locked === 2)
      if (!alvo || !account) continue
      useGame.setState({
        machines: [{ ...machine, found: true, probed: true, exploited: true }],
        accounts: { [account.user]: account },
        connectedId: 'alvo',
      })

      expect(g().crack(alvo.path, alvo.file.name).message).toMatch(/nível 2/)
      comSaldo(999_999)
      g().buySkill('crypto1')
      expect(g().crack(alvo.path, alvo.file.name).ok).toBe(false)
      g().buySkill('crypto2')
      expect(g().crack(alvo.path, alvo.file.name).ok).toBe(true)
      return
    }
    throw new Error('não achei cadeado nível 2 em 80 tentativas')
  })

  it('ler o arquivo registra a credencial', () => {
    const c = conectar(prepararAlvo())
    expect(g().credentials).toHaveLength(0)
    g().reveal(c.senhas)
    expect(g().credentials[0]).toMatchObject({
      site: 'vbank.vc', user: c.account.user,
    })
  })
})

describe('o seu disco', () => {
  function comArquivoBaixado() {
    const c = conectar(prepararAlvo())
    g().download(c.path, c.senhas.name)
    g().reveal(c.senhas)
    return c
  }

  it('arquivo baixado incrimina e gera rastro por hora', () => {
    comArquivoBaixado()
    expect(totalEvidence(g().disk)).toBe(8)

    // Sem cravar a taxa: o que importa é ser proporcional ao peso guardado.
    const comUm = evidenceHeatPerHour(g().disk)
    expect(comUm).toBeGreaterThan(0)
    expect(evidenceHeatPerHour([...g().disk, ...g().disk])).toBeCloseTo(comUm * 2)
    expect(evidenceHeatPerHour([])).toBe(0)
  })

  it('a evidencia empurra o rastro de volta a cada tick', () => {
    const c = comArquivoBaixado()
    useGame.setState((s) => ({ player: { ...s.player, heat: 50 } }))
    g().tick(60)
    const comEvidencia = g().player.heat

    g().remove([DOWNLOADS], c.senhas.name)
    useGame.setState((s) => ({ player: { ...s.player, heat: 50 } }))
    g().tick(60)
    expect(g().player.heat).toBeLessThan(comEvidencia)
  })

  it('apagar o arquivo tira a senha do gerenciador do navegador', () => {
    const c = comArquivoBaixado()
    expect(g().credentials).toHaveLength(1)
    const r = g().remove([DOWNLOADS], c.senhas.name)
    expect(r.message).toMatch(/saiu do gerenciador/)
    expect(g().credentials).toHaveLength(0)
  })

  it('apagar a PASTA inteira tambem limpa a senha de dentro dela', () => {
    const c = comArquivoBaixado()
    g().mkdir([], 'Cofre')
    g().move([DOWNLOADS], c.senhas.name, ['Cofre'])
    expect(g().credentials).toHaveLength(1)
    g().remove([], 'Cofre')
    expect(g().credentials).toHaveLength(0)
  })

  it('mover o arquivo entre pastas NAO tira a senha', () => {
    const c = comArquivoBaixado()
    g().mkdir([], 'Cofre')
    g().move([DOWNLOADS], c.senhas.name, ['Cofre'])
    expect(g().credentials).toHaveLength(1)
  })

  it('sem o arquivo o preenchimento some, mas a senha ainda vale na mao', () => {
    const c = comArquivoBaixado()
    g().remove([DOWNLOADS], c.senhas.name)
    expect(g().credentials).toHaveLength(0)
    expect(g().login('vbank.vc', c.account.user, c.account.pass).ok).toBe(true)
    expect(g().login('vbank.vc', c.account.user, 'chutando').ok).toBe(false)
  })

  it('cria pasta, renomeia e move arquivo para dentro dela', () => {
    const c = comArquivoBaixado()
    g().mkdir([], 'Cofre')
    g().rename([], 'Cofre', 'Meu cofre')
    expect(g().move([DOWNLOADS], c.senhas.name, ['Meu cofre']).ok).toBe(true)
    expect(listAt(g().disk, ['Meu cofre'])!.map((n) => n.name))
      .toContain(c.senhas.name)
  })

  it('nao aceita nome repetido na mesma pasta', () => {
    g().mkdir([], 'Cofre')
    expect(g().rename([], 'Cofre', DOWNLOADS).message).toMatch(/Já existe/)
  })

  it('nao deixa mover uma pasta para dentro dela mesma', () => {
    g().mkdir([], 'Pai')
    g().mkdir(['Pai'], 'Filho')
    expect(g().move([], 'Pai', ['Pai', 'Filho']).ok).toBe(false)
  })

  it('vender tira o arquivo do disco e paga', () => {
    // O andar 3 exige Intrusão 3; sem isso o exploit falha e nao ha o que vender.
    useGame.setState({ skills: ['scanner1', 'breaker1', 'breaker2', 'breaker3'] })

    // Insiste ate cair um alvo com algo vendavel, para o teste nao virar no-op.
    let valioso: { path: string[]; file: VFile } | null = null
    for (let i = 0; i < 300 && !valioso; i++) {
      conectar(prepararAlvo(3))
      valioso = achar(g().connected()?.root ?? [], (f) => !!f.worth)
    }
    if (!valioso) throw new Error('nenhum alvo com arquivo vendável em 300 tentativas')

    g().download(valioso.path, valioso.file.name)
    const antes = g().player.balance
    expect(g().sell([DOWNLOADS], valioso.file.name).ok).toBe(true)
    expect(g().player.balance).toBeGreaterThan(antes)
    expect(listAt(g().disk, [DOWNLOADS])!
      .some((n) => n.name === valioso.file.name)).toBe(false)
  })
})

describe('banco', () => {
  function logado() {
    const c = conectar(prepararAlvo())
    g().download(c.path, c.senhas.name)
    g().reveal(c.senhas)
    g().login('vbank.vc', c.account.user, c.account.pass)
    return c
  }

  it('recusa senha errada', () => {
    const c = conectar(prepararAlvo())
    g().reveal(c.senhas)
    expect(g().login('vbank.vc', c.account.user, 'errada').ok).toBe(false)
    expect(g().sessions['vbank.vc']).toBeUndefined()
  })

  it('aceita a credencial roubada', () => {
    const c = logado()
    expect(g().sessions['vbank.vc']).toBe(c.account.user)
  })

  it('so transfere para a propria conta laranja', () => {
    const c = logado()
    expect(g().transfer(c.account.user, '0000-0000', 10).ok).toBe(false)
  })

  it('transferir aumenta o saldo e marca a conta como zerada', () => {
    const c = logado()
    const antes = g().player.balance
    const total = c.account.balance
    expect(g().transfer(c.account.user, g().player.muleAccount, total).ok).toBe(true)
    expect(g().player.balance).toBe(antes + total)
    expect(g().drained).toContain(c.account.user)
    expect(g().transfer(c.account.user, g().player.muleAccount, 1).ok).toBe(false)
  })

  it('levar tudo de uma vez gera mais rastro que levar um pedaco', () => {
    const c = logado()
    const fatia = Math.max(1, Math.floor(c.account.balance / 10))

    useGame.setState((s) => ({ player: { ...s.player, heat: 0 } }))
    g().transfer(c.account.user, g().player.muleAccount, fatia)
    const pouco = g().player.heat

    useGame.setState((s) => ({ player: { ...s.player, heat: 0 }, drained: [] }))
    g().transfer(c.account.user, g().player.muleAccount, c.account.balance)
    expect(g().player.heat).toBeGreaterThan(pouco)
  })
})

describe('arvore de habilidades', () => {
  it('comeca com Rastreador e Intrusao no nivel 1', () => {
    expect(g().level('scanner')).toBe(1)
    expect(g().level('breaker')).toBe(1)
    expect(g().level('crypto')).toBe(0)
    expect(g().level('ghost')).toBe(0)
  })

  it('sao dez niveis por ramo, com preco sempre crescente', () => {
    for (const branch of BRANCHES) {
      const niveis = skillsOf(branch.id)
      expect(niveis, branch.id).toHaveLength(MAX_LEVEL)
      for (let i = 1; i < niveis.length; i++) {
        expect(niveis[i].price, `${branch.id} nível ${i + 1}`)
          .toBeGreaterThan(niveis[i - 1].price)
      }
    }
  })

  it('nao compra sem saldo', () => {
    expect(g().buySkill('ghost1').message).toMatch(/faltam/)
  })

  it('nao pula nivel', () => {
    comSaldo(999_999)
    const r = g().buySkill('crypto3')
    expect(r.ok).toBe(false)
    expect(g().level('crypto')).toBe(0)
  })

  it('comprar sobe o nivel e desconta o preco', () => {
    comSaldo(5000)
    const antes = g().player.balance
    expect(g().buySkill('crypto1').ok).toBe(true)
    expect(g().level('crypto')).toBe(1)
    expect(g().player.balance).toBeLessThan(antes)
    expect(levelOf(g().skills, 'crypto')).toBe(1)
  })

  it('o Anonimato reduz progressivamente o rastro gerado', () => {
    comSaldo(9_999_999)
    useGame.setState((s) => ({ player: { ...s.player, heat: 0 } }))
    g().addHeat(10)
    const cru = g().player.heat

    g().buySkill('ghost1')
    useGame.setState((s) => ({ player: { ...s.player, heat: 0 } }))
    g().addHeat(10)
    const n1 = g().player.heat

    g().buySkill('ghost2')
    useGame.setState((s) => ({ player: { ...s.player, heat: 0 } }))
    g().addHeat(10)
    expect(n1).toBeLessThan(cru)
    expect(g().player.heat).toBeLessThan(n1)
  })

  it('a Faxina nao e automatica: sem o programa, nao limpa nada', () => {
    useGame.setState((s) => ({ player: { ...s.player, heat: 80 } }))
    g().tick(1)                       // o tempo passa, mas nao "faxina"
    expect(g().player.heat).toBeGreaterThan(79)
    expect(g().cleanLogs().ok).toBe(false)
    expect(g().player.heat).toBeGreaterThan(79)
  })

  it('a Faxina so age quando o jogador pede', () => {
    comSaldo(9_999_999)
    g().buySkill('cleaner1')
    useGame.setState((s) => ({ player: { ...s.player, heat: 80 } }))

    g().tick(10)                      // dez minutos passando sozinhos
    expect(g().player.heat).toBeGreaterThan(79)

    expect(g().cleanLogs().ok).toBe(true)
    expect(g().player.heat).toBeLessThan(60)
  })

  it('o log guarda o que voce fez e nao muda sozinho', () => {
    prepararAlvo()
    g().scan()
    g().probe('alvo')
    const depoisDeAgir = [...g().trail]
    expect(depoisDeAgir.length).toBeGreaterThanOrEqual(2)
    expect(depoisDeAgir[0].text).toMatch(/varredura/)

    // O bug era este: o log era derivado do rastro, entao encolhia sozinho
    // conforme ele caia. Passar o tempo nao pode mexer numa linha sequer.
    g().tick(120)
    expect(g().trail).toEqual(depoisDeAgir)
  })

  it('limpar apaga os registros mais antigos, nao todos', () => {
    comSaldo(9_999_999)
    g().buySkill('cleaner1')
    prepararAlvo()
    for (let i = 0; i < 8; i++) g().scan()

    const antes = g().trail.length
    const maisAntigo = g().trail[0].text
    expect(g().cleanLogs().ok).toBe(true)

    expect(g().trail.length).toBeLessThan(antes)
    expect(g().trail.some((r) => r.text === maisAntigo && r.at === 0)).toBe(false)
  })

  it('a Faxina limpa mais conforme o nivel', () => {
    comSaldo(9_999_999)
    expect(g().cleanLogs().ok).toBe(false)

    g().buySkill('cleaner1')
    useGame.setState((s) => ({ player: { ...s.player, heat: 90 } }))
    g().cleanLogs()
    const nivel1 = g().player.heat

    g().buySkill('cleaner2')
    useGame.setState((s) => ({ player: { ...s.player, heat: 90 } }))
    g().cleanLogs()
    expect(g().player.heat).toBeLessThan(nivel1)
  })
})

describe('defesa', () => {
  it('ninguem ataca quem ainda nao incomodou ninguem', () => {
    // Com menos de 4 contas zeradas, o Coletivo nao tem motivo.
    for (let i = 0; i < 3000; i++) g().rollAttack()
    expect(g().attacks).toHaveLength(0)
  })

  /** Força ataques até sair um, para testar a resolução sem depender da sorte. */
  function ateAtacarem(): void {
    useGame.setState({ drained: ['a', 'b', 'c', 'd', 'e', 'f'] })
    for (let i = 0; i < 20000 && g().attacks.length === 0; i++) g().rollAttack()
    if (g().attacks.length === 0) throw new Error('nenhum ataque em 20000 tentativas')
  }

  it('sem Firewall, o ataque passa', () => {
    comSaldo(10_000)
    ateAtacarem()
    expect(g().attacks[0].bloqueado).toBe(false)
    expect(g().player.balance).toBeLessThan(10_000)
  })

  it('Firewall no maximo segura qualquer ataque', () => {
    comSaldo(9_999_999)
    for (let n = 1; n <= MAX_LEVEL; n++) g().buySkill(`firewall${n}`)
    expect(g().level('firewall')).toBe(MAX_LEVEL)

    const saldo = g().player.balance
    ateAtacarem()
    expect(g().attacks.every((a) => a.bloqueado)).toBe(true)
    expect(g().player.balance).toBe(saldo)
  })

  it('o Antivirus devolve parte do que passou', () => {
    comSaldo(9_999_999)
    for (let n = 1; n <= MAX_LEVEL; n++) g().buySkill(`antivirus${n}`)
    comSaldo(10_000)
    ateAtacarem()
    // Nivel 10 devolve 100%: o ataque passa, mas nao leva nada.
    expect(g().attacks.some((a) => !a.bloqueado)).toBe(true)
    expect(g().player.balance).toBe(10_000)
  })

  it('o ataque sofrido entra no log do ScanSS', () => {
    comSaldo(10_000)
    ateAtacarem()
    expect(g().trail.some((t) => t.text.includes('SOFRIDA'))).toBe(true)
  })

  it('nao ataca com o jogo pausado', () => {
    useGame.setState({ drained: ['a', 'b', 'c', 'd'], paused: true })
    for (let i = 0; i < 5000; i++) g().rollAttack()
    expect(g().attacks).toHaveLength(0)
  })
})

describe('lobby', () => {
  it('a partida so comeca depois do menu', () => {
    expect(g().started).toBe(false)
    g().start('ana')
    expect(g().started).toBe(true)
    expect(g().player.handle).toBe('ana')
  })

  it('apelido vazio cai no padrao', () => {
    g().start('   ')
    expect(g().player.handle).toBe('operador')
  })

  it('sem partida nunca jogada, nao ha o que continuar', () => {
    expect(g().hasSave).toBe(false)
  })

  it('comecar marca que existe save - mesmo antes de fazer qualquer coisa', () => {
    // O menu precisa saber disso ANTES do primeiro marco: quem entrou e nao
    // agiu ainda tem uma partida para continuar.
    g().start('ana')
    expect(g().hasSave).toBe(true)
    expect(g().milestones).toHaveLength(0)
  })

  it('o save sobrevive ao que o jogador faz', () => {
    g().start('ana')
    g().scan()
    expect(g().hasSave).toBe(true)
    expect(g().player.handle).toBe('ana')
  })

  it('reiniciar apaga o save', () => {
    g().start('ana')
    g().scan()
    g().reset()
    expect(g().hasSave).toBe(false)
    expect(g().started).toBe(false)
    expect(g().milestones).toHaveLength(0)
  })

  it('jogo novo toca o prologo; continuar nao', () => {
    // O prólogo é ambientação de uma vez só: quem continua já viu.
    g().startNew('ana')
    expect(g().prologue).toBe(true)
    g().endPrologue()
    expect(g().prologue).toBe(false)

    g().start('ana')
    expect(g().prologue).toBe(false)
  })

  it('jogo novo apaga a partida anterior', () => {
    g().start('joao')
    g().scan()
    expect(g().milestones).toContain('scan')

    g().startNew('ana')
    expect(g().player.handle).toBe('ana')
    expect(g().milestones).toHaveLength(0)
    expect(g().hasSave).toBe(true)
  })

  it('o estado salvo nao carrega started, prologue nem paused', () => {
    // Abrir a url tem que cair sempre no menu, nunca direto no desktop.
    g().start('ana')
    useGame.setState({ paused: true })
    const salvo = useGame.persist.getOptions().partialize!(g()) as GameState
    expect(salvo.started).toBe(false)
    expect(salvo.paused).toBe(false)
    expect(salvo.prologue).toBe(false)
    expect(salvo.hasSave).toBe(true)
  })
})

describe('ScanSS', () => {
  it('chegar a 100 de rastro encerra a partida', () => {
    g().addHeat(100)
    expect(g().busted).toBe(true)
  })

  it('o rastro decai com o tempo quando o disco esta limpo', () => {
    g().addHeat(20)
    g().tick(40)
    expect(g().player.heat).toBeLessThan(20)
    expect(g().player.heat).toBeGreaterThan(0)
  })

  it('esfria mais devagar quanto mais quente esta', () => {
    expect(decayPerMinute(95)).toBeLessThan(decayPerMinute(70))
    expect(decayPerMinute(70)).toBeLessThan(decayPerMinute(45))
    expect(decayPerMinute(45)).toBeLessThan(decayPerMinute(10))
  })

  it('nao da para zerar o rastro so esperando alguns minutos', () => {
    useGame.setState((s) => ({ player: { ...s.player, heat: 90 } }))
    g().tick(60)                                  // uma hora de jogo
    // Antes isso zerava; agora tem que sobrar quase tudo.
    expect(g().player.heat).toBeGreaterThan(85)
  })

  it('sair do vermelho so esperando leva horas de jogo', () => {
    useGame.setState((s) => ({ player: { ...s.player, heat: 90 } }))
    let horas = 0
    while (g().player.heat > 59 && horas < 500) { g().tick(60); horas++ }
    expect(horas).toBeGreaterThan(10)
  })
})

describe('modo desenvolvedor', () => {
  it('desligado, nenhuma acao dev tem efeito', () => {
    const saldo = g().player.balance
    g().devSetBalance(999_999)
    g().devSetHeat(80)
    g().devSetLevel('ghost', 10)
    g().devSpawn(5)
    g().devOpenAll()

    expect(g().player.balance).toBe(saldo)
    expect(g().player.heat).toBe(0)
    expect(g().level('ghost')).toBe(0)
    expect(g().machines.every((m) => !m.exploited)).toBe(true)
  })

  it('ligado, edita saldo, rastro e niveis', () => {
    g().setDevMode(true)
    g().devSetBalance(50_000)
    g().devSetHeat(72)
    g().devSetLevel('ghost', 7)

    expect(g().player.balance).toBe(50_000)
    expect(g().player.heat).toBe(72)
    expect(g().level('ghost')).toBe(7)
    // Subir para o nivel 7 tem que dar os niveis 1..7, nao so o 7.
    expect(g().skills.filter((id) => id.startsWith('ghost'))).toHaveLength(7)
  })

  it('baixar o nivel remove os niveis acima', () => {
    g().setDevMode(true)
    g().devSetLevel('crypto', 6)
    g().devSetLevel('crypto', 2)
    expect(g().level('crypto')).toBe(2)
    expect(g().skills.filter((id) => id.startsWith('crypto'))).toHaveLength(2)
  })

  it('respeita o teto de niveis', () => {
    g().setDevMode(true)
    g().devSetLevel('cleaner', 99)
    expect(g().level('cleaner')).toBe(MAX_LEVEL)
  })

  it('gera alvos e abre tudo', () => {
    g().setDevMode(true)
    const antes = g().machines.length
    g().devSpawn(6, 3)
    expect(g().machines.length).toBe(antes + 3)

    g().devOpenAll()
    expect(g().machines.every((m) => m.exploited)).toBe(true)
    expect(walk(g().machines[0].root).every((f) => f.locked === 0)).toBe(true)
  })

  it('fica registrado que a partida foi alterada', () => {
    expect(g().devUsed).toBe(false)
    g().setDevMode(true)
    g().setDevMode(false)
    expect(g().devMode).toBe(false)
    expect(g().devUsed).toBe(true)
  })
})

describe('economia', () => {
  it('tres roubos do andar 1 nao compram o topo da arvore', () => {
    // O ponto do rebalanceamento: antes, esvaziar tres contas comprava tudo.
    const saldos = Array.from({ length: 200 }, () =>
      gerarAlvo(1, 'x', new Set()).account?.balance ?? 0)
    const media = saldos.reduce((a, b) => a + b, 0) / saldos.length
    const topo = SKILL_BY_ID['ghost10'].price

    expect(media * 3).toBeLessThan(topo / 100)
  })

  it('o ultimo nivel de cada ramo custa ordens de grandeza a mais que o segundo', () => {
    for (const branch of BRANCHES) {
      const niveis = skillsOf(branch.id)
      expect(niveis[MAX_LEVEL - 1].price, branch.id)
        .toBeGreaterThan(niveis[1].price * 100)
    }
  })
})
