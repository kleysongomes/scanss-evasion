/**
 * Le o roteiro de `story/*.txt`.
 *
 * Este arquivo so INTERPRETA: transforma texto em `Roteiro` e em `Condicao`.
 * Quem decide se uma condicao esta atendida - e quando cada e-mail chega - e
 * `missions.ts`, que enxerga tambem o quadro de missoes.
 *
 * Os textos ficam em arquivo, e nao em codigo, para o roteiro poder ser escrito
 * e reescrito sem mexer em nada compilado. O formato esta documentado em
 * `story/LEIA-ME.md`.
 */

/**
 * Uma condicao de entrega, ja interpretada.
 *
 * Quase todas comparam por MAIOR-OU-IGUAL ("chegou em"). As duas excecoes sao
 * `abaixo` e `evidencia`, que comparam por menor-ou-igual - sao elas que
 * permitem missoes de recuar, e nao so de avancar.
 */
export type Condicao =
  | { tipo: 'inicio' }
  | { tipo: 'marco'; valor: string }
  | { tipo: 'email'; valor: string }
  | { tipo: 'invasoes'; n: number }
  | { tipo: 'contas'; n: number }
  | { tipo: 'rastro'; n: number }
  | { tipo: 'abaixo'; n: number }
  | { tipo: 'evidencia'; n: number }
  | { tipo: 'saldo'; n: number }
  | { tipo: 'roubado'; n: number }
  | { tipo: 'defesa'; n: number }
  | { tipo: 'ramo'; valor: string; n: number }
  | { tipo: 'upgrades'; n: number }
  | { tipo: 'ataques'; n: number }
  | { tipo: 'bloqueados'; n: number }
  | { tipo: 'tier'; n: number }
  | { tipo: 'tudo'; valor: 'upgrades' | 'missoes' | 'desafios' }

export interface Roteiro {
  id: string
  de: string
  assunto: string
  corpo: string
  /** Todas precisam ser verdade para o e-mail chegar. */
  quando: Condicao[]
  /** Missao que este e-mail abre, se abrir alguma. */
  objetivo?: string
  /** Onde se faz, em uma linha - o quadro de missoes mostra como dica. */
  onde?: string
  /** O que fecha a missao. Sem isto, ela nunca fica concluida. */
  feito?: Condicao[]
}

const REMETENTE_PADRAO = '3stagiario@vmail.vc'

/** Parte um `chave: resto` no PRIMEIRO dois-pontos. */
function partir(texto: string): [string, string] {
  const corte = texto.indexOf(':')
  if (corte < 0) return [texto.trim(), '']
  return [texto.slice(0, corte).trim(), texto.slice(corte + 1).trim()]
}

/** As condicoes que sao so `chave: numero`. */
const NUMERICAS = [
  'invasoes', 'contas', 'rastro', 'abaixo', 'evidencia', 'saldo', 'roubado',
  'defesa', 'upgrades', 'ataques', 'bloqueados', 'tier',
] as const

type Numerica = (typeof NUMERICAS)[number]

const eNumerica = (chave: string): chave is Numerica =>
  (NUMERICAS as readonly string[]).includes(chave)

/** Interpreta uma linha de condicao. Devolve null se nao reconhecer. */
export function lerCondicao(texto: string): Condicao | null {
  const limpo = texto.trim()
  if (limpo === 'inicio') return { tipo: 'inicio' }

  const [chave, valor] = partir(limpo)
  if (!valor) return null

  if (eNumerica(chave)) {
    const n = Number(valor)
    return Number.isFinite(n) ? { tipo: chave, n } : null
  }

  switch (chave) {
    case 'marco':
    case 'email':
      return { tipo: chave, valor }

    // `ramo:crypto:5` - a unica com dois argumentos.
    case 'ramo': {
      const [nome, nivel] = partir(valor)
      const n = Number(nivel)
      // `nivel` vazio nao pode virar zero: Number('') e 0, e um `ramo:crypto`
      // sem nivel passaria como "nivel 0", que e sempre verdade.
      if (!nome || !nivel || !Number.isFinite(n)) return null
      return { tipo: 'ramo', valor: nome, n }
    }

    case 'tudo':
      return valor === 'upgrades' || valor === 'missoes' || valor === 'desafios'
        ? { tipo: 'tudo', valor }
        : null

    default:
      return null
  }
}

/**
 * Interpreta um arquivo do roteiro.
 *
 * Devolve null (em vez de estourar) quando o arquivo esta malformado: um erro
 * de digitacao no roteiro nao deve derrubar o jogo inteiro.
 */
export function lerArquivo(texto: string): Roteiro | null {
  const [cabecalho, ...resto] = texto.split(/^---\s*$/m)
  if (resto.length === 0) return null

  const campos: Record<string, string> = {}
  const quando: Condicao[] = []
  const feito: Condicao[] = []

  for (const linha of cabecalho.split('\n')) {
    if (!linha.includes(':')) continue
    const [chave, valor] = partir(linha)

    if (chave === 'quando') {
      const c = lerCondicao(valor)
      if (c) quando.push(c)
    } else if (chave === 'feito') {
      const c = lerCondicao(valor)
      if (c) feito.push(c)
    } else {
      campos[chave] = valor
    }
  }

  if (!campos.id || !campos.assunto || quando.length === 0) return null

  return {
    id: campos.id,
    de: campos.de ?? REMETENTE_PADRAO,
    assunto: campos.assunto,
    corpo: resto.join('---').trim(),
    quando,
    objetivo: campos.objetivo,
    onde: campos.onde,
    feito: feito.length > 0 ? feito : undefined,
  }
}

/**
 * O roteiro inteiro, lido da pasta em tempo de build.
 *
 * `import.meta.glob` faz o Vite embutir os arquivos: adicionar um `.txt` na
 * pasta e suficiente para ele entrar no jogo.
 */
const ARQUIVOS = import.meta.glob('./story/*.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const ROTEIRO: Roteiro[] = Object.entries(ARQUIVOS)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, texto]) => lerArquivo(texto))
  .filter((r): r is Roteiro => r !== null)

/** Troca {apelido} pelo nome que o jogador escolheu. */
export function personalizar(texto: string, apelido: string): string {
  return texto.replace(/\{apelido\}/g, apelido)
}
