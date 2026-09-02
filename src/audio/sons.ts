/**
 * O catálogo de sons do jogo.
 *
 * Cada um é uma receita curta de osciladores (`motor.ts`). A regra que guiou
 * todos: som de jogo é PONTUAÇÃO, não trilha sonora. Nada aqui passa de meio
 * segundo, exceto a sirene, que é o único aviso que precisa assustar.
 *
 * Quem dispara é a interface, nunca as regras: `game/` não sabe que existe som,
 * do mesmo jeito que não sabe que existe tela.
 */

import { ruido, tom } from './motor'

/** Tecla da máquina de escrever, na abertura e no prólogo. */
export function tecla(): void {
  // Cada tecla sai um pouco diferente da outra - igual vira metrônomo.
  ruido({ dur: 0.022, ganho: 0.05 + Math.random() * 0.02, corte: 2200 })
  tom({
    hz: 1400 + Math.random() * 500, tipo: 'square',
    dur: 0.016, ganho: 0.018,
  })
}

/** Dinheiro caindo na conta. O som mais gostoso do jogo, e tem que ser. */
export function dinheiroEntrando(): void {
  tom({ hz: 880, tipo: 'square', dur: 0.09, ganho: 0.14 })
  tom({ hz: 1174, tipo: 'square', dur: 0.09, ganho: 0.14, quando: 0.07 })
  tom({ hz: 1568, tipo: 'square', dur: 0.22, ganho: 0.16, quando: 0.14 })
  // A cauda senoidal é o brilho da moeda; sem ela fica só bipe.
  tom({ hz: 2349, tipo: 'sine', dur: 0.4, ganho: 0.07, quando: 0.16 })
}

/** Uma entrada pequena: venda de arquivo, prêmio de missão. */
export function moedinha(): void {
  tom({ hz: 1319, tipo: 'square', dur: 0.06, ganho: 0.1 })
  tom({ hz: 1760, tipo: 'square', dur: 0.14, ganho: 0.1, quando: 0.05 })
}

/** Dinheiro saindo: golpe, ataque que passou. Desce, e desafina. */
export function dinheiroSaindo(): void {
  tom({ hz: 440, ate: 180, tipo: 'sawtooth', dur: 0.42, ganho: 0.14 })
  tom({ hz: 437, ate: 176, tipo: 'sawtooth', dur: 0.42, ganho: 0.1 })
}

/**
 * A sirene: eles estão perto.
 *
 * Duas notas alternadas, quatro trocas, meio segundo no total. Aviso de perigo
 * que se arrasta vira irritação, e o jogador desliga o som - aí ele deixa de
 * ouvir justamente o que precisava.
 */
export function sirene(): void {
  for (let i = 0; i < 4; i++) {
    tom({
      hz: i % 2 === 0 ? 740 : 990, tipo: 'sawtooth',
      dur: 0.16, ganho: 0.11, quando: i * 0.15,
    })
  }
}

/** Varredura concluída: o ping de radar. */
export function ping(): void {
  tom({ hz: 1200, ate: 900, tipo: 'sine', dur: 0.5, ganho: 0.12 })
}

/** Porta arrombada. Duas notas subindo, curtas e secas. */
export function acesso(): void {
  tom({ hz: 587, tipo: 'square', dur: 0.07, ganho: 0.12 })
  tom({ hz: 880, tipo: 'square', dur: 0.16, ganho: 0.12, quando: 0.07 })
}

/** Negado: senha errada, nível insuficiente, saldo que não dá. */
export function negado(): void {
  tom({ hz: 200, tipo: 'square', dur: 0.16, ganho: 0.12 })
  tom({ hz: 150, tipo: 'square', dur: 0.22, ganho: 0.12, quando: 0.12 })
}

/** Chegou e-mail. Duas notas, uma pergunta. */
export function correio(): void {
  tom({ hz: 988, tipo: 'triangle', dur: 0.13, ganho: 0.13 })
  tom({ hz: 1319, tipo: 'triangle', dur: 0.3, ganho: 0.13, quando: 0.13 })
}

/** Missão concluída: três notas subindo. */
export function missao(): void {
  tom({ hz: 784, tipo: 'triangle', dur: 0.09, ganho: 0.12 })
  tom({ hz: 988, tipo: 'triangle', dur: 0.09, ganho: 0.12, quando: 0.08 })
  tom({ hz: 1319, tipo: 'triangle', dur: 0.3, ganho: 0.13, quando: 0.16 })
}

/** Arquivo baixado. Um "toc" seco, nada de fanfarra. */
export function baixou(): void {
  ruido({ dur: 0.04, ganho: 0.09, corte: 1400 })
  tom({ hz: 660, tipo: 'square', dur: 0.05, ganho: 0.07, quando: 0.02 })
}

/** Compra feita no darkmarket. */
export function compra(): void {
  tom({ hz: 523, tipo: 'square', dur: 0.07, ganho: 0.12 })
  tom({ hz: 784, tipo: 'square', dur: 0.07, ganho: 0.12, quando: 0.07 })
  tom({ hz: 1047, tipo: 'square', dur: 0.24, ganho: 0.13, quando: 0.14 })
}

/** O micro ligando, quando a área de trabalho aparece. */
export function ligar(): void {
  const acorde = [392, 523, 659, 784]
  acorde.forEach((hz, i) => tom({
    hz, tipo: 'triangle', dur: 0.9 - i * 0.1, ganho: 0.09, quando: i * 0.09,
    ataque: 0.02,
  }))
}

/** Fim de jogo. Desce até o chão e chia. */
export function travou(): void {
  tom({ hz: 330, ate: 40, tipo: 'sawtooth', dur: 1.1, ganho: 0.16 })
  ruido({ dur: 0.7, ganho: 0.08, corte: 700, quando: 0.2 })
}
