/**
 * Testa o som onde não existe som.
 *
 * Estes testes rodam em Node, sem Web Audio - e é justamente esse o cenário que
 * interessa cobrir. Som é enfeite: se um oscilador estourar porque o navegador
 * é antigo, porque a aba está sem permissão de áudio ou porque o jogo está
 * rodando num teste, o que quebra é o JOGO, e por um "toc" de tecla.
 *
 * Então a regra é: toda função daqui pode ser chamada a qualquer momento, com
 * ou sem motor ligado, e nunca estoura.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { aplicar, ligado, ruido, tom } from './motor'
import { useSom } from './opcoes'
import * as sons from './sons'
import { apertarTrilha, pararTrilha, tocarTrilha, trilhaTocando } from './trilha'

afterEach(() => pararTrilha())

describe('sem Web Audio, nada estoura', () => {
  it('o motor se sabe desligado', () => {
    expect(ligado()).toBe(false)
  })

  it('tocar uma nota ou um chiado não faz nada, e não reclama', () => {
    expect(() => tom({ hz: 440 })).not.toThrow()
    expect(() => tom({ hz: 440, ate: 220, dur: 0.3, canal: 'musica' })).not.toThrow()
    expect(() => ruido()).not.toThrow()
  })

  it('mexer no volume antes de o motor existir é aceito', () => {
    expect(() => aplicar({ mudo: true, musica: 0, efeitos: 0 })).not.toThrow()
  })

  /**
   * Percorre o catálogo inteiro pelo módulo, e não por uma lista escrita aqui:
   * som novo entra no teste sozinho.
   */
  it('todo som do catálogo pode ser tocado', () => {
    const catalogo = Object.entries(sons)
      .filter((par): par is [string, () => void] => typeof par[1] === 'function')
    expect(catalogo.length).toBeGreaterThan(8)

    for (const [nome, tocar] of catalogo) {
      expect(() => tocar(), `som "${nome}" estourou`).not.toThrow()
    }
  })

  it('a trilha liga, acelera e para', () => {
    expect(trilhaTocando()).toBe(false)
    tocarTrilha()
    expect(trilhaTocando()).toBe(true)
    // Ligar duas vezes não pode criar dois sequenciadores.
    tocarTrilha()
    expect(() => apertarTrilha(90)).not.toThrow()
    pararTrilha()
    expect(trilhaTocando()).toBe(false)
  })
})

describe('as opções de som', () => {
  beforeEach(() => {
    useSom.setState({ mudo: false, musica: 0.35, efeitos: 0.7 })
    pararTrilha()
  })

  it('começam com a música mais baixa que os efeitos', () => {
    const { musica, efeitos, mudo } = useSom.getState()
    expect(mudo).toBe(false)
    expect(musica).toBeLessThan(efeitos)
  })

  it('mudar o volume liga a trilha', () => {
    useSom.getState().setMusica(0.5)
    expect(trilhaTocando()).toBe(true)
    expect(useSom.getState().musica).toBe(0.5)
  })

  /** Trilha em volume zero continuaria agendando notas à toa. */
  it('música em zero para o sequenciador', () => {
    useSom.getState().setMusica(0.5)
    useSom.getState().setMusica(0)
    expect(trilhaTocando()).toBe(false)
  })

  it('mudo para tudo, e desmutar volta a tocar', () => {
    useSom.getState().setMusica(0.5)
    useSom.getState().setMudo(true)
    expect(trilhaTocando()).toBe(false)

    useSom.getState().setMudo(false)
    expect(trilhaTocando()).toBe(true)
  })

  /**
   * Volume não é progresso: quem desligou o som não pode ouvir de novo só
   * porque começou uma partida nova. Por isso as opções têm chave própria no
   * armazenamento, separada do save.
   */
  it('moram numa chave separada da do jogo', () => {
    expect(useSom.persist.getOptions().name).toBe('scanss-evasion-som')
    expect(useSom.persist.getOptions().name).not.toContain('save')
  })
})
