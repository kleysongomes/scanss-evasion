/**
 * A trilha de fundo.
 *
 * Um sequenciador de dezesseis passos, tocando o mesmo oscilador dos efeitos.
 * Não é música para prestar atenção: é um baixo lento e umas notas soltas por
 * cima, no tom menor, para a sala não ficar em silêncio enquanto o jogador
 * vasculha o disco de alguém.
 *
 * Ela ACELERA conforme o rastreamento sobe. É o único jeito honesto de uma
 * trilha de fundo participar do jogo: o jogador percebe que esquentou antes de
 * olhar para o número.
 */

import { saida, tom } from './motor'

/** Passos do ciclo. Dezesseis dá uma volta de uns oito segundos. */
const PASSOS = 16

/**
 * Duas casas de acorde, oito passos cada. Ré menor e Si bemol maior - a volta
 * mais melancólica que cabe em duas casas.
 */
const CASAS = [
  { baixo: 73.42, notas: [293.66, 349.23, 440.0] },   // ré
  { baixo: 58.27, notas: [233.08, 293.66, 349.23] },  // si bemol
]

/** Quando cada nota solta entra, dentro do ciclo. */
const MELODIA = [0, 6, 8, 11, 14]

// `setTimeout` global, e nao `window.setTimeout`: os testes rodam em Node, e
// ali `window` nao existe.
let relogio: ReturnType<typeof setTimeout> | null = null
let passo = 0
/** 1 = calmo. Sobe até ~1.6 com o rastro no vermelho. */
let pressa = 1

/** Milissegundos por passo, já com a pressa aplicada. */
const intervalo = () => 500 / pressa

function tocarPasso(): void {
  // Sem motor ligado não há o que tocar; o relógio segue, e volta a soar
  // sozinho quando o áudio for destravado.
  if (!saida('musica')) return

  const casa = CASAS[Math.floor(passo / 8) % CASAS.length]

  // O baixo marca o começo de cada casa e a metade dela.
  if (passo % 8 === 0) {
    tom({
      hz: casa.baixo, tipo: 'triangle', dur: 1.6, ganho: 0.5,
      ataque: 0.05, canal: 'musica',
    })
  }
  if (passo % 8 === 4) {
    tom({
      hz: casa.baixo * 2, tipo: 'triangle', dur: 0.8, ganho: 0.22,
      ataque: 0.04, canal: 'musica',
    })
  }

  if (MELODIA.includes(passo % PASSOS)) {
    const nota = casa.notas[(passo * 3) % casa.notas.length]
    tom({
      hz: nota, tipo: 'sine', dur: 0.9, ganho: 0.16,
      ataque: 0.03, canal: 'musica',
    })
    // Quando aperta, entra uma oitava acima junto: mais denso sem ser mais alto.
    if (pressa > 1.25) {
      tom({
        hz: nota * 2, tipo: 'sine', dur: 0.5, ganho: 0.06,
        ataque: 0.02, canal: 'musica',
      })
    }
  }

  passo = (passo + 1) % PASSOS
}

/**
 * Liga a trilha.
 *
 * O relógio é reagendado a cada passo em vez de um intervalo fixo, para a
 * mudança de andamento valer no passo seguinte, e não só no próximo ciclo.
 */
export function tocarTrilha(): void {
  if (relogio !== null) return
  const proxima = () => {
    tocarPasso()
    relogio = setTimeout(proxima, intervalo())
  }
  relogio = setTimeout(proxima, intervalo())
}

export function pararTrilha(): void {
  if (relogio === null) return
  clearTimeout(relogio)
  relogio = null
  passo = 0
}

export const trilhaTocando = (): boolean => relogio !== null

/** O quanto o jogador está sendo caçado, de 0 a 100, vira andamento. */
export function apertarTrilha(rastro: number): void {
  pressa = 1 + Math.min(100, Math.max(0, rastro)) / 160
}
