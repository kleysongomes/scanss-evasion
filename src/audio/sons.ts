/**
 * O catálogo de sons do jogo.
 *
 * Cada um é uma receita curta de osciladores (`motor.ts`). A regra que guiou
 * todos: som de jogo é PONTUAÇÃO, não trilha sonora. Nada aqui passa de meio
 * segundo, exceto a sirene, que é o único aviso que precisa assustar.
 *
 * Quem dispara é a interface, nunca as regras: `game/` não sabe que existe som,
 * do mesmo jeito que não sabe que existe tela.
 *
 * ---------------------------------------------------------------------------
 * POR QUE NÃO SOA COMO VIDEOGAME
 *
 * A primeira versão soava, e soava muito - moeda de plataforma dos anos 80. Não
 * era coincidência: ela usava as três coisas que FORMAM aquele som.
 *
 *   1. Onda quadrada em tudo. É o timbre do chip de 8 bits.
 *   2. Arpejo ascendente em acorde maior (dó-mi-sol, rápido). É o gesto de
 *      "pegou item", e o ouvido reconhece na hora, venha de onde vier.
 *   3. Nenhuma cauda. Bipe que corta seco só existe em console antigo.
 *
 * O que um micro de 2003 fazia era o oposto: seno e triângulo em vez de
 * quadrada, notas TOCADAS JUNTAS em vez de uma correndo atrás da outra, e tudo
 * com um resto de eco - porque saía de uma caixinha em cima de uma mesa, num
 * quarto. Onde precisa de aspereza, o material é ruído filtrado e serra grave,
 * que é som de máquina, não de melodia.
 *
 * A onda quadrada sobreviveu em dois lugares só, e nos dois ela é o certo: no
 * erro (bipe de terminal recusando) e na tecla (estalo do teclado).
 * ---------------------------------------------------------------------------
 */

import { ruido, tom } from './motor'

/** Tecla da máquina de escrever, na abertura e no prólogo. */
export function tecla(): void {
  // Duas camadas, como tecla de verdade: o estalo agudo do plástico batendo e
  // o baque surdo do teclado inteiro. Cada uma sai um pouco diferente da
  // outra - igual vira metrônomo.
  ruido({ dur: 0.016, ganho: 0.05 + Math.random() * 0.02, corte: 5200 })
  ruido({ dur: 0.05, ganho: 0.05, corte: 420 })
}

/**
 * Dinheiro caindo na conta.
 *
 * Um "clunk" de máquina confirmando, e por cima um sino em quinta - as duas
 * notas JUNTAS, com cauda longa. Tocadas em sequência elas viravam a moedinha
 * do encanador.
 */
export function dinheiroEntrando(): void {
  ruido({ dur: 0.07, ganho: 0.1, corte: 700 })
  tom({ hz: 165, tipo: 'triangle', dur: 0.16, ganho: 0.12, ataque: 0.008 })
  tom({ hz: 659, tipo: 'sine', dur: 1.1, ganho: 0.13, ataque: 0.012,
        quando: 0.05, sala: 0.5 })
  tom({ hz: 988, tipo: 'sine', dur: 0.9, ganho: 0.09, ataque: 0.012,
        quando: 0.05, sala: 0.5 })
}

/** Uma entrada pequena: venda de arquivo, prêmio de missão. */
export function moedinha(): void {
  tom({ hz: 1046, tipo: 'sine', dur: 0.5, ganho: 0.09, ataque: 0.006,
        sala: 0.4 })
}

/**
 * Dinheiro saindo: golpe, ataque que passou.
 *
 * Serra grave escorregando para baixo, com um par desafinado por cima. Desafino
 * é o que dá o mal-estar; afinado soaria só triste.
 */
export function dinheiroSaindo(): void {
  ruido({ dur: 0.1, ganho: 0.07, corte: 500 })
  tom({ hz: 233, ate: 96, tipo: 'sawtooth', dur: 0.5, ganho: 0.11, sala: 0.25 })
  tom({ hz: 228, ate: 93, tipo: 'sawtooth', dur: 0.5, ganho: 0.07 })
}

/**
 * A sirene: eles estão perto.
 *
 * Duas serras desafinadas varrendo para cima e para baixo, no grave. Não é a
 * sirene de desenho animado - é o alarme de porta que alguém abriu.
 *
 * Meio segundo, e acabou: aviso de perigo que se arrasta vira irritação, e aí
 * o jogador desliga o som e deixa de ouvir justamente o que precisava.
 */
export function sirene(): void {
  for (let i = 0; i < 3; i++) {
    const q = i * 0.19
    tom({ hz: 320, ate: 620, tipo: 'sawtooth', dur: 0.1, ganho: 0.1, quando: q })
    tom({ hz: 620, ate: 320, tipo: 'sawtooth', dur: 0.1, ganho: 0.1,
          quando: q + 0.09, sala: 0.3 })
    tom({ hz: 316, ate: 612, tipo: 'sawtooth', dur: 0.1, ganho: 0.05, quando: q })
  }
}

/** Varredura concluída: o ping de radar. */
export function ping(): void {
  tom({ hz: 1046, ate: 880, tipo: 'sine', dur: 0.55, ganho: 0.1, sala: 0.55 })
}

/**
 * Porta arrombada.
 *
 * Uma fechadura cedendo: o baque do ferrolho e um zumbido curto subindo, sem
 * nenhuma nota reconhecível. Antes eram duas notas em quinta ascendente, que é
 * exatamente o "power-up" que se quer evitar.
 */
export function acesso(): void {
  ruido({ dur: 0.09, ganho: 0.11, corte: 900 })
  tom({ hz: 110, ate: 220, tipo: 'triangle', dur: 0.22, ganho: 0.12,
        ataque: 0.01, sala: 0.3 })
  tom({ hz: 1320, tipo: 'sine', dur: 0.4, ganho: 0.05, quando: 0.1, sala: 0.5 })
}

/** Negado: senha errada, nível insuficiente, saldo que não dá. */
export function negado(): void {
  // Aqui a onda quadrada é a certa: é bipe de terminal recusando.
  tom({ hz: 196, tipo: 'square', dur: 0.11, ganho: 0.1 })
  tom({ hz: 185, tipo: 'square', dur: 0.2, ganho: 0.1, quando: 0.1 })
}

/**
 * Chegou e-mail.
 *
 * Um sino de duas notas tocadas juntas, com cauda. O aviso da época era isto:
 * uma coisa só, redonda, que sumia sozinha.
 */
export function correio(): void {
  tom({ hz: 784, tipo: 'sine', dur: 0.75, ganho: 0.11, ataque: 0.01, sala: 0.5 })
  tom({ hz: 1175, tipo: 'sine', dur: 0.6, ganho: 0.07, ataque: 0.01, sala: 0.5 })
}

/**
 * Missão concluída.
 *
 * Acorde tocado junto e depois um sino em cima, em vez de três notas subindo em
 * fila - a fila era o "level up" que denunciava o console.
 */
export function missao(): void {
  tom({ hz: 523, tipo: 'sine', dur: 0.7, ganho: 0.1, ataque: 0.015, sala: 0.45 })
  tom({ hz: 784, tipo: 'sine', dur: 0.7, ganho: 0.08, ataque: 0.015, sala: 0.45 })
  tom({ hz: 1568, tipo: 'sine', dur: 0.85, ganho: 0.06, ataque: 0.02,
        quando: 0.14, sala: 0.6 })
}

/** Arquivo baixado. Um "toc" seco de disco rígido, nada de fanfarra. */
export function baixou(): void {
  ruido({ dur: 0.035, ganho: 0.09, corte: 1200 })
  tom({ hz: 130, tipo: 'triangle', dur: 0.07, ganho: 0.07, quando: 0.01 })
}

/** Compra feita no darkmarket: o "kachunk" de uma máquina registradora. */
export function compra(): void {
  ruido({ dur: 0.06, ganho: 0.1, corte: 800 })
  tom({ hz: 147, tipo: 'triangle', dur: 0.13, ganho: 0.12, ataque: 0.006 })
  tom({ hz: 1245, tipo: 'sine', dur: 0.6, ganho: 0.07, quando: 0.09, sala: 0.5 })
}

/**
 * O micro ligando, quando a área de trabalho aparece.
 *
 * O acorde inteiro de uma vez, com ataque lento e cauda longa. É a diferença
 * entre uma abertura de sistema e um arpejo de fase nova: uma abre, a outra
 * corre.
 */
export function ligar(): void {
  const acorde = [196, 294, 392, 587]
  acorde.forEach((hz, i) => tom({
    hz, tipo: 'sine', dur: 1.5 - i * 0.15, ganho: 0.075,
    ataque: 0.16, quando: i * 0.018, sala: 0.5,
  }))
}

/** Fim de jogo. Desce até o chão e chia. */
export function travou(): void {
  tom({ hz: 262, ate: 33, tipo: 'sawtooth', dur: 1.3, ganho: 0.15, sala: 0.3 })
  tom({ hz: 259, ate: 31, tipo: 'sawtooth', dur: 1.3, ganho: 0.09 })
  ruido({ dur: 0.8, ganho: 0.07, corte: 600, quando: 0.25 })
}
