/**
 * Carrega o roteiro de `story/*.txt` e decide quando cada e-mail chega.
 *
 * Os textos ficam em arquivo, nao em codigo, para o roteiro poder ser escrito e
 * reescrito sem recompilar nada mentalmente. O formato esta documentado em
 * `story/LEIA-ME.md`.
 */

import { levelOf } from './skills'
import type { GameState } from './types'

/** Uma condicao de entrega, ja interpretada. */
export type Condicao =
  | { tipo: 'inicio' }
  | { tipo: 'marco'; valor: string }
  | { tipo: 'email'; valor: string }
  | { tipo: 'invasoes'; n: number }
  | { tipo: 'rastro'; n: number }
  | { tipo: 'saldo'; n: number }
  | { tipo: 'contas'; n: number }
  | { tipo: 'defesa'; n: number }
  | { tipo: 'ataques'; n: number }

export interface Roteiro {
  id: string
  de: string
  assunto: string
  corpo: string
  /** Todas precisam ser verdade para o e-mail chegar. */
  quando: Condicao[]
  /** Missao que este e-mail abre, se abrir alguma. */
  objetivo?: string
  /** O que fecha a missao. Sem isto, ela fica aberta ate o proximo objetivo. */
  feito?: Condicao[]
}

const REMETENTE_PADRAO = '3stagiario@vmail.vc'

/** Interpreta uma linha de condicao. Devolve null se nao reconhecer. */
export function lerCondicao(texto: string): Condicao | null {
  const limpo = texto.trim()
  if (limpo === 'inicio') return { tipo: 'inicio' }

  const [chave, valor] = limpo.split(':').map((p) => p.trim())
  if (!valor) return null

  switch (chave) {
    case 'marco': return { tipo: 'marco', valor }
    case 'email': return { tipo: 'email', valor }
    case 'invasoes': return { tipo: 'invasoes', n: Number(valor) }
    case 'rastro': return { tipo: 'rastro', n: Number(valor) }
    case 'saldo': return { tipo: 'saldo', n: Number(valor) }
    case 'contas': return { tipo: 'contas', n: Number(valor) }
    case 'defesa': return { tipo: 'defesa', n: Number(valor) }
    case 'ataques': return { tipo: 'ataques', n: Number(valor) }
    default: return null
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
    const corte = linha.indexOf(':')
    if (corte < 0) continue
    const chave = linha.slice(0, corte).trim()
    const valor = linha.slice(corte + 1).trim()

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

// ---------------------------------------------------------------------------

/** O nivel de defesa e o melhor entre os dois ramos defensivos. */
function nivelDeDefesa(s: GameState): number {
  return Math.max(levelOf(s.skills, 'firewall'), levelOf(s.skills, 'antivirus'))
}

export function condicaoAtendida(c: Condicao, s: GameState): boolean {
  switch (c.tipo) {
    case 'inicio': return true
    case 'marco': return s.milestones.includes(c.valor)
    case 'email': return s.inbox.some((e) => e.id === c.valor && e.lido)
    case 'invasoes': return s.machines.filter((m) => m.exploited).length >= c.n
    case 'rastro': return s.player.heat >= c.n
    case 'saldo': return s.player.balance >= c.n
    case 'contas': return s.drained.length >= c.n
    case 'defesa': return nivelDeDefesa(s) >= c.n
    case 'ataques': return s.attacks.length >= c.n
  }
}

/** Os e-mails que devem chegar agora - na ordem do roteiro. */
export function pendentes(s: GameState): Roteiro[] {
  return ROTEIRO.filter((r) => (
    !s.inbox.some((e) => e.id === r.id) &&
    r.quando.every((c) => condicaoAtendida(c, s))
  ))
}

/** Troca {apelido} pelo nome que o jogador escolheu. */
export function personalizar(texto: string, apelido: string): string {
  return texto.replace(/\{apelido\}/g, apelido)
}
