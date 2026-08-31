/** Sorteios. Funcoes puras e minusculas, para o gerador ficar legivel. */

/** Inteiro entre min e max, inclusive nos dois. */
export function int(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Um item qualquer da lista. */
export function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

/** `n` itens distintos da lista (ou todos, se `n` for maior que ela). */
export function sample<T>(list: readonly T[], n: number): T[] {
  const copia = [...list]
  const saida: T[] = []
  while (saida.length < n && copia.length > 0) {
    saida.push(copia.splice(Math.floor(Math.random() * copia.length), 1)[0])
  }
  return saida
}

/** Verdadeiro com probabilidade `p` (0..1). */
export function chance(p: number): boolean {
  return Math.random() < p
}

/**
 * Escolhe entre opcoes com peso. Pesos nao precisam somar 1.
 * `weighted([['nada', 20], ['pouco', 55], ['muito', 25]])`
 */
export function weighted<T>(opcoes: readonly (readonly [T, number])[]): T {
  const total = opcoes.reduce((s, [, peso]) => s + peso, 0)
  let n = Math.random() * total
  for (const [valor, peso] of opcoes) {
    n -= peso
    if (n <= 0) return valor
  }
  return opcoes[opcoes.length - 1][0]
}

/**
 * Numero em torno de uma base, variando `spread` para cada lado.
 * `around(1000, 0.4)` devolve algo entre 600 e 1400.
 */
export function around(base: number, spread: number): number {
  const fator = 1 + (Math.random() * 2 - 1) * spread
  return Math.max(1, Math.round(base * fator))
}
