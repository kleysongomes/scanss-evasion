/**
 * Progresso do jogador pelo loop principal.
 *
 * Cada acao do store registra um marco; daqui sai a lista "o que voce ja fez /
 * o que falta" que o manual mostra. Como e derivado do estado real, o checklist
 * nunca fica dessincronizado do que o jogador de fato fez.
 */

import type { GameState } from './types'

export interface Step {
  /** Marco registrado pelo store quando o passo e concluido. */
  id: string
  label: string
  /** Onde se faz, em uma linha. */
  how: string
}

export const STEPS: Step[] = [
  { id: 'scan', label: 'Varrer a rede',
    how: 'NetRipper  →  botão "Varrer rede"' },
  { id: 'probe', label: 'Analisar um alvo',
    how: 'NetRipper  →  clique no host  →  "Analisar"' },
  { id: 'exploit', label: 'Invadir a máquina',
    how: 'NetRipper  →  "Invadir"' },
  { id: 'connect', label: 'Montar o disco dela',
    how: 'NetRipper  →  "Conectar" (vira a unidade Z:)' },
  { id: 'download', label: 'Achar e baixar o arquivo de senhas',
    how: 'Meu Computador  →  Z:  →  procure nas pastas  →  "Baixar"' },
  { id: 'creds', label: 'Ler o arquivo de senhas',
    how: 'Meu Computador  →  C:\Baixados  →  dois cliques no arquivo' },
  { id: 'login', label: 'Entrar no banco como a vítima',
    how: 'Chroma  →  vbank.vc  →  "Preencher" e "Entrar"' },
  { id: 'transfer', label: 'Transferir o dinheiro',
    how: 'vbank.vc  →  destino = sua conta laranja  →  "Confirmar"' },
  { id: 'delete', label: 'Limpar o rastro do seu disco',
    how: 'Meu Computador  →  C:  →  "Vender" ou "Excluir" o que já usou' },
  { id: 'buy', label: 'Melhorar um programa',
    how: 'Chroma  →  darkmarket.vc  →  "Comprar" o próximo nível' },
]

export function isDone(s: GameState, stepId: string): boolean {
  return s.milestones.includes(stepId)
}

/** Quantos passos do loop principal ja foram concluidos. */
export function progress(s: GameState): { feitos: number; total: number } {
  return {
    feitos: STEPS.filter((t) => s.milestones.includes(t.id)).length,
    total: STEPS.length,
  }
}

/** O proximo passo pendente, ou null se o jogador ja fez o loop inteiro. */
export function nextStep(s: GameState): Step | null {
  return STEPS.find((t) => !s.milestones.includes(t.id)) ?? null
}
