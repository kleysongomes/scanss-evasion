/**
 * Testa o roteiro: o formato dos arquivos, os gatilhos de entrega e a pausa.
 *
 * O roteiro fica em arquivos de texto justamente para ser reescrito sem medo -
 * entao estes testes existem para que um erro de digitacao no cabecalho apareça
 * aqui, e nao como um e-mail que nunca chega no meio da partida.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { condicaoAtendida, pendentes } from './missions'
import { ROTEIRO, lerArquivo, lerCondicao, lerEfeito, personalizar } from './story'
import { useGame } from './store'

const g = () => useGame.getState()

beforeEach(() => {
  g().reset()
  g().start('kleyson')
})

describe('formato dos arquivos', () => {
  it('a pasta tem roteiro', () => {
    expect(ROTEIRO.length).toBeGreaterThan(5)
  })

  it('todo e-mail tem id, assunto, corpo e pelo menos um gatilho', () => {
    for (const r of ROTEIRO) {
      expect(r.id, 'id vazio').toBeTruthy()
      expect(r.assunto, `${r.id}: sem assunto`).toBeTruthy()
      expect(r.corpo.length, `${r.id}: corpo vazio`).toBeGreaterThan(10)
      expect(r.quando.length, `${r.id}: sem gatilho`).toBeGreaterThan(0)
    }
  })

  it('nenhum id repetido', () => {
    const ids = ROTEIRO.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('todo gatilho `email:` aponta para um e-mail que existe', () => {
    const ids = new Set(ROTEIRO.map((r) => r.id))
    for (const r of ROTEIRO) {
      for (const c of r.quando) {
        if (c.tipo === 'email') {
          expect(ids, `${r.id} espera o e-mail "${c.valor}"`).toContain(c.valor)
        }
      }
    }
  })

  it('os textos sao curtos - o jogo fica pausado enquanto se le', () => {
    for (const r of ROTEIRO) {
      const linhas = r.corpo.split('\n').filter((l) => l.trim()).length
      expect(linhas, `${r.id} tem ${linhas} linhas`).toBeLessThanOrEqual(14)
    }
  })

  it('recusa arquivo malformado em vez de estourar', () => {
    expect(lerArquivo('sem separador nenhum')).toBeNull()
    expect(lerArquivo('id: x\n---\ncorpo')).toBeNull()          // sem assunto
    expect(lerArquivo('assunto: y\nquando: inicio\n---\nz')).toBeNull()  // sem id
  })

  it('le as condicoes que o LEIA-ME documenta', () => {
    expect(lerCondicao('inicio')).toEqual({ tipo: 'inicio' })
    expect(lerCondicao('marco:transfer')).toEqual({ tipo: 'marco', valor: 'transfer' })
    expect(lerCondicao('rastro:55')).toEqual({ tipo: 'rastro', n: 55 })
    expect(lerCondicao('abaixo:30')).toEqual({ tipo: 'abaixo', n: 30 })
    expect(lerCondicao('roubado:5000')).toEqual({ tipo: 'roubado', n: 5000 })
    expect(lerCondicao('tudo: missoes')).toEqual({ tipo: 'tudo', valor: 'missoes' })
    expect(lerCondicao('nao-existe:1')).toBeNull()
    expect(lerCondicao('tudo:qualquer-coisa')).toBeNull()
  })

  // `ramo` e a unica condicao com dois argumentos; ela quebrou uma vez porque o
  // interpretador partia a linha em TODOS os dois-pontos e perdia o nivel.
  it('le condicao de dois argumentos sem perder o nivel', () => {
    expect(lerCondicao('ramo:crypto:5')).toEqual({ tipo: 'ramo', valor: 'crypto', n: 5 })
    expect(lerCondicao('ramo:crypto')).toBeNull()
  })

  it('todo e-mail que abre missao diz o que a conclui', () => {
    for (const r of ROTEIRO) {
      if (!r.objetivo) continue
      expect(r.feito?.length, `${r.id}: tem objetivo e nao tem feito`)
        .toBeGreaterThan(0)
    }
  })
})

describe('entrega', () => {
  it('o primeiro e-mail chega assim que a partida comeca', () => {
    const novos = g().deliverMail()
    expect(novos.length).toBeGreaterThan(0)
    expect(g().inbox[0].id).toBe('01-oi-sumido')
  })

  it('receber um e-mail PAUSA o jogo', () => {
    expect(g().paused).toBe(false)
    g().deliverMail()
    expect(g().paused).toBe(true)
  })

  it('o mesmo e-mail nao chega duas vezes', () => {
    g().deliverMail()
    const quantos = g().inbox.length
    g().deliverMail()
    expect(g().inbox.length).toBe(quantos)
  })

  it('{apelido} vira o nome escolhido no lobby', () => {
    g().deliverMail()
    const primeiro = g().inbox[0]
    expect(primeiro.corpo).toContain('kleyson')
    expect(primeiro.corpo).not.toContain('{apelido}')
  })

  it('o e-mail travado por gatilho so chega quando o gatilho acontece', () => {
    g().deliverMail()
    expect(g().inbox.some((e) => e.id === '02-achou')).toBe(false)

    g().scan()
    g().deliverMail()
    expect(g().inbox.some((e) => e.id === '02-achou')).toBe(true)
  })

  it('o e-mail que abre missao poe a missao no quadro', () => {
    g().deliverMail()
    expect(g().missionsSeen).toContain('01-oi-sumido')
    expect(g().missions).not.toContain('01-oi-sumido')
  })

  it('ler marca como lido e destrava o encadeamento', () => {
    useGame.setState((s) => ({ player: { ...s.player, heat: 90 } }))
    g().deliverMail()
    const corre = g().inbox.find((e) => e.id === '11-corre')
    expect(corre).toBeTruthy()

    // O 12 depende de ter LIDO o 11.
    expect(pendentes(g()).some((r) => r.id === '12-respira')).toBe(false)
    g().readMail('11-corre')
    expect(pendentes(g()).some((r) => r.id === '12-respira')).toBe(true)
  })
})

describe('pausa', () => {
  it('o relogio nao anda enquanto o jogo esta pausado', () => {
    g().deliverMail()
    const minuto = g().minutes
    g().tick(30)
    expect(g().minutes).toBe(minuto)
  })

  it('retomar volta a rodar', () => {
    g().deliverMail()
    g().resume()
    expect(g().paused).toBe(false)
    const minuto = g().minutes
    g().tick(10)
    expect(g().minutes).toBe(minuto + 10)
  })
})

describe('golpes', () => {
  const comGolpe = ROTEIRO.filter((r) => r.golpe)

  it('a caixa tem uma variedade de spam', () => {
    expect(comGolpe.length).toBeGreaterThanOrEqual(6)
  })

  /**
   * Sem `{isca}` no corpo o link vai parar no fim do texto, solto. O e-mail
   * ainda funciona, mas perde a graca: a isca tem que estar onde o golpe faz
   * sentido, no meio da lorota.
   */
  it('todo e-mail com golpe tem a isca no lugar certo do corpo', () => {
    for (const r of comGolpe) {
      expect(r.isca, `${r.id}: sem isca`).toBeTruthy()
      expect(r.corpo, `${r.id}: o corpo nao tem {isca}`).toContain('{isca}')
    }
  })

  it('os golpes nao sao todos iguais', () => {
    const tipos = new Set(comGolpe.flatMap((r) => r.golpe!).map((e) => e.tipo))
    expect(tipos).toContain('dinheiro')
    expect(tipos).toContain('rastro')
    // Um inofensivo, para clicar ser aposta e nao imposto.
    expect(tipos).toContain('nada')
  })

  it('le os efeitos e recusa numero sem sentido', () => {
    expect(lerEfeito('nada')).toEqual({ tipo: 'nada' })
    expect(lerEfeito('dinheiro:12')).toEqual({ tipo: 'dinheiro', n: 12 })
    expect(lerEfeito('rastro:9')).toEqual({ tipo: 'rastro', n: 9 })
    expect(lerEfeito('rastro:0')).toBeNull()
    expect(lerEfeito('vida:3')).toBeNull()
  })

  it('clicar na isca custa dinheiro, e cobra uma vez so', () => {
    g().mark('login')
    g().deliverMail()
    const spam = g().inbox.find((e) => e.id === '90-visitante')
    expect(spam?.golpe).toBeTruthy()

    const antes = g().player.balance
    expect(g().clicarIsca(spam!.id).ok).toBe(true)
    expect(g().player.balance).toBeLessThan(antes)

    // O estrago fica no e-mail: reabrir a mensagem tem que continuar contando
    // o que aquele clique custou.
    const depois = g().inbox.find((e) => e.id === '90-visitante')!
    expect(depois.golpe!.estrago).toBeTruthy()

    const saldo = g().player.balance
    expect(g().clicarIsca(spam!.id).ok).toBe(false)
    expect(g().player.balance).toBe(saldo)
  })

  it('golpe de rastro queima o jogador e entra no log do ScanSS', () => {
    g().mark('buy')
    g().deliverMail()
    const spam = g().inbox.find((e) => e.id === '94-acelerador')
    expect(spam?.golpe).toBeTruthy()

    const antes = g().player.heat
    g().clicarIsca(spam!.id)
    expect(g().player.heat).toBeGreaterThan(antes)
    expect(g().trail.at(-1)?.text).toContain(spam!.de)
  })

  it('e-mail sem golpe nao tem link para clicar', () => {
    g().deliverMail()
    expect(g().clicarIsca('01-oi-sumido').ok).toBe(false)
  })
})

describe('condicoes', () => {
  it('rastro, saldo e contas comparam por maior-ou-igual', () => {
    useGame.setState((s) => ({ player: { ...s.player, heat: 55, balance: 900 } }))
    expect(condicaoAtendida({ tipo: 'rastro', n: 55 }, g())).toBe(true)
    expect(condicaoAtendida({ tipo: 'rastro', n: 56 }, g())).toBe(false)
    expect(condicaoAtendida({ tipo: 'saldo', n: 900 }, g())).toBe(true)
    expect(condicaoAtendida({ tipo: 'contas', n: 1 }, g())).toBe(false)
  })

  it('personalizar troca todas as ocorrencias', () => {
    expect(personalizar('oi {apelido}, tudo bem {apelido}?', 'ana'))
      .toBe('oi ana, tudo bem ana?')
  })
})
