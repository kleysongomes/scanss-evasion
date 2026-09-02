/**
 * Testa o quadro de missoes.
 *
 * O que mais importa aqui e a TEIMOSIA da conclusao: missao cumprida nao pode
 * voltar a ficar aberta quando a condicao deixa de ser verdade, e premio nao
 * pode ser pago duas vezes. Sao os dois jeitos de o quadro virar mentira.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { gerarAlvo } from './generator'
import { DOWNLOADS } from './store'
import type { VFile } from './types'
import {
  DESAFIOS, GUIAS, MISSOES, condicaoAtendida, emAberto, missaoAtual, pendentes,
  placar, trancadas, visiveis,
} from './missions'
import { SKILLS } from './skills'
import { useGame } from './store'

const g = () => useGame.getState()

beforeEach(() => {
  g().reset()
  g().start('kleyson')
})

describe('registro', () => {
  it('tem missoes das duas familias', () => {
    expect(GUIAS.length).toBeGreaterThan(4)
    expect(DESAFIOS.length).toBeGreaterThan(8)
    expect(MISSOES.length).toBe(GUIAS.length + DESAFIOS.length)
  })

  it('nenhum id repetido', () => {
    const ids = MISSOES.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('toda missao sabe o que a conclui', () => {
    for (const m of MISSOES) {
      expect(m.feito.length, `${m.id}: sem condicao de conclusao`)
        .toBeGreaterThan(0)
      expect(m.titulo, `${m.id}: sem titulo`).toBeTruthy()
    }
  })

  it('todo desafio paga premio, e nenhuma guia paga', () => {
    for (const m of DESAFIOS) expect(m.premio, m.id).toBeGreaterThan(0)
    for (const m of GUIAS) expect(m.premio, m.id).toBe(0)
  })

  /**
   * Os premios existem para empurrar, nao para substituir o roubo. Se a soma
   * deles chegasse perto do custo da arvore, dava para "zerar" o jogo fechando
   * desafio, sem invadir ninguem.
   */
  it('os premios somam muito menos que a arvore inteira', () => {
    const premios = DESAFIOS.reduce((t, m) => t + m.premio, 0)
    const arvore = SKILLS.reduce((t, s) => t + s.price, 0)
    expect(premios).toBeLessThan(arvore / 10)
  })
})

describe('quadro', () => {
  it('comeca curto: quase tudo ainda esta trancado', () => {
    expect(trancadas(g())).toBeGreaterThan(MISSOES.length / 2)
    expect(placar(g())).toEqual({ feitas: 0, total: MISSOES.length })
  })

  it('a missao atual e a primeira guia em aberto', () => {
    g().deliverMail()
    expect(missaoAtual(g())?.id).toBe('01-oi-sumido')
  })

  it('cumprir a missao atual passa a vez para a proxima', () => {
    g().deliverMail()
    g().scan()                     // marco:scan conclui a primeira
    g().checkMissions()

    expect(g().missions).toContain('01-oi-sumido')
    expect(missaoAtual(g())?.id).not.toBe('01-oi-sumido')
  })

  /**
   * O contador na aba do webmail nao pode ser "total menos concluidas": isso
   * incluiria as missoes que o jogador nem viu, e prometeria trabalho
   * invisivel para quem esta no comeco.
   */
  it('o contador da aba conta so o que esta na tela', () => {
    g().deliverMail()
    expect(emAberto(g())).toBe(visiveis(g()).length)
    expect(emAberto(g())).toBeLessThan(MISSOES.length - placar(g()).feitas)
  })

  it('a concluida continua no quadro, so muda de situacao', () => {
    g().deliverMail()
    g().scan()
    g().checkMissions()

    const guias = visiveis(g(), 'guia').map((m) => m.id)
    expect(guias).toContain('01-oi-sumido')
  })
})

describe('conclusao', () => {
  it('paga o premio uma vez, e nao mais', () => {
    const antes = g().player.balance
    useGame.setState((s) => ({ recordes: { ...s.recordes, invasoes: 3 } }))

    const fechadas = g().checkMissions()
    expect(fechadas.map((m) => m.id)).toContain('d-tres-portas')
    const depois = g().player.balance
    expect(depois).toBe(antes + 400)

    g().checkMissions()
    expect(g().player.balance).toBe(depois)
  })

  /**
   * O desafio de sangue frio abre com rastro alto e fecha com rastro baixo -
   * as duas metades nunca sao verdade juntas. Se a visibilidade nao fosse
   * lembrada, ele sairia do quadro no caminho e nunca fecharia.
   */
  it('missao aberta por um gatilho fecha pelo contrario dele', () => {
    useGame.setState((s) => ({ player: { ...s.player, heat: 75 } }))
    g().checkMissions()
    expect(g().missionsSeen).toContain('d-sangue-frio')
    expect(g().missions).not.toContain('d-sangue-frio')

    useGame.setState((s) => ({ player: { ...s.player, heat: 10 } }))
    g().checkMissions()
    expect(g().missions).toContain('d-sangue-frio')
  })

  it('conclusao nao se desfaz quando a condicao deixa de valer', () => {
    useGame.setState((s) => ({ player: { ...s.player, heat: 75 } }))
    g().checkMissions()
    useGame.setState((s) => ({ player: { ...s.player, heat: 10 } }))
    g().checkMissions()

    // Esquentou de novo: a missao continua cumprida.
    useGame.setState((s) => ({ player: { ...s.player, heat: 90 } }))
    g().checkMissions()
    expect(g().missions).toContain('d-sangue-frio')
  })

  it('missao trancada nao fecha por acidente', () => {
    // O disco comeca vazio, entao "limpar a evidencia" ja e verdade no primeiro
    // segundo de jogo. A missao so pode valer depois do primeiro roubo - senao
    // sairia cumprida antes de o jogador fazer nada.
    g().checkMissions()
    expect(g().missions).not.toContain('04-caraca')

    g().mark('transfer')
    g().checkMissions()
    expect(g().missions).toContain('04-caraca')
  })

  /**
   * A missao 04 diz "vender OU apagar". Ela fechava por `marco:delete`, entao
   * quem vendia o arquivo cumpria a tarefa e via a missao seguir aberta.
   */
  it('a missao de limpar aceita os dois caminhos que ela oferece', () => {
    const limpar = MISSOES.find((m) => m.id === '04-caraca')!
    expect(limpar.feito).toEqual([{ tipo: 'evidencia', n: 0 }])
  })

  it('uma cadeia de desafios inteira fecha de uma vez', () => {
    g().mark('transfer')
    useGame.setState((s) => ({ recordes: { ...s.recordes, roubado: 300000 } }))
    g().checkMissions()

    expect(g().missions).toContain('d-cinco-mil')
    expect(g().missions).toContain('d-cinquenta-mil')
    expect(g().missions).toContain('d-quarto-de-milhao')
  })
})

/**
 * A missão de limpar o disco foi reportada como bug: o jogador vendia e apagava
 * arquivos e ela seguia aberta. Não era bug de código - era o título, que dizia
 * "o que já usou" enquanto a condição exigia o disco INTEIRO limpo. Da poltrona
 * as duas coisas são indistinguíveis.
 */
describe('limpar o disco', () => {
  const arquivo = (nome: string, evidence: number, worth = 0): VFile => ({
    type: 'file', name: nome, kind: 'text', size: 10, locked: 0,
    content: 'x', evidence, worth,
  })

  const comDisco = (...arquivos: VFile[]) => {
    useGame.setState({
      disk: [{ type: 'folder', name: DOWNLOADS, children: arquivos }],
    })
    g().mark('transfer')          // é o que abre a missão
  }

  it('os dois caminhos que ela oferece fecham: apagar...', () => {
    comDisco(arquivo('senhas.txt', 6))
    g().checkMissions()
    expect(g().missions).not.toContain('04-caraca')

    g().remove([DOWNLOADS], 'senhas.txt')
    g().checkMissions()
    expect(g().missions).toContain('04-caraca')
  })

  it('...e vender', () => {
    comDisco(arquivo('foto.jpg', 4, 80))
    g().checkMissions()
    expect(g().missions).not.toContain('04-caraca')

    g().sell([DOWNLOADS], 'foto.jpg')
    g().checkMissions()
    expect(g().missions).toContain('04-caraca')
  })

  it('não fecha enquanto sobrar evidência em algum canto', () => {
    comDisco(arquivo('a.txt', 6), arquivo('b.jpg', 4, 50))
    g().sell([DOWNLOADS], 'b.jpg')
    g().checkMissions()
    expect(g().missions).not.toContain('04-caraca')
  })
})

describe('placar acumulado', () => {
  it('invadir conta, e esquecer o host nao desconta', () => {
    const { machine } = gerarAlvo(3, 'alvo', new Set())
    useGame.setState({ machines: [{ ...machine, found: true, probed: true,
                                    requiredBreaker: 1 }] })

    g().exploit(machine.id)
    expect(g().recordes.invasoes).toBe(1)
    expect(g().recordes.maiorAlvo).toBe(3)

    // Arrumar a lista do NetRipper apaga o host - era isto que fazia o desafio
    // de "invadir 25 computadores" andar para tras.
    g().forget(machine.id)
    expect(g().machines).toHaveLength(0)
    expect(g().recordes.invasoes).toBe(1)
  })

  it('roubar soma no placar, e gastar nao apaga', () => {
    useGame.setState({
      accounts: { vitima: { user: 'vitima', holder: 'V', number: '1',
                            balance: 900, pass: 'x' } },
    })
    g().transfer('vitima', g().player.muleAccount, 900)
    expect(g().recordes.roubado).toBe(900)

    useGame.setState((s) => ({ player: { ...s.player, balance: 0 } }))
    expect(g().recordes.roubado).toBe(900)
    expect(condicaoAtendida({ tipo: 'roubado', n: 900 }, g())).toBe(true)
    expect(condicaoAtendida({ tipo: 'saldo', n: 900 }, g())).toBe(false)
  })
})

describe('fim da beta', () => {
  it('o e-mail de fim so chega com tudo comprado e tudo concluido', () => {
    const chegou = () => pendentes(g()).some((r) => r.id === '15-beta')

    useGame.setState({ skills: SKILLS.map((s) => s.id) })
    expect(chegou(), 'faltando missao').toBe(false)

    useGame.setState({ missions: MISSOES.map((m) => m.id) })
    expect(chegou()).toBe(true)

    // Sem a arvore fechada, nao chega.
    useGame.setState({ skills: SKILLS.slice(0, -1).map((s) => s.id) })
    expect(chegou(), 'faltando upgrade').toBe(false)
  })

  it('tudo:missoes nao aceita id que nao existe mais no registro', () => {
    useGame.setState({ missions: MISSOES.map(() => 'missao-que-sumiu') })
    expect(condicaoAtendida({ tipo: 'tudo', valor: 'missoes' }, g())).toBe(false)
  })
})
