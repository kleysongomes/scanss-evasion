/**
 * O quadro de missoes: o que guia e o que desafia.
 *
 * Duas familias, um so mecanismo:
 *
 *   GUIAS    saem do roteiro (`story/*.txt`). Chegam por e-mail, ensinam o
 *            jogo passo a passo e sao a espinha do Capitulo 1.
 *   DESAFIOS ficam aqui, em codigo. Nao chegam por e-mail nem contam historia:
 *            sao metas grandes ("roubar 250 mil", "invadir 25 maquinas") que o
 *            jogador persegue no ritmo dele, e que pagam quando fecham.
 *
 * A divisao de arquivo segue essa diferenca. Guia e prosa - o 3stagiario
 * escreve, e prosa se edita em .txt. Desafio e numero: id, meta e premio. Botar
 * numero em .txt so criaria um segundo formato para manter.
 *
 * Toda missao tem duas condicoes: `quando` (aparece no quadro) e `feito` (fica
 * concluida). Sao separadas de proposito - "passar de 70% de rastro e voltar
 * abaixo de 20%" e impossivel de escrever numa condicao unica, porque as duas
 * metades nunca sao verdade ao mesmo tempo.
 */

import { totalEvidence } from './fs'
import { SKILLS, levelOf } from './skills'
import { ROTEIRO, lerCondicao } from './story'
import type { Condicao, Roteiro } from './story'
import type { Branch, GameState } from './types'

export type TipoMissao = 'guia' | 'desafio'

export interface Missao {
  id: string
  tipo: TipoMissao
  /** O que fazer, no imperativo. */
  titulo: string
  /** Onde se faz, em uma linha. */
  onde?: string
  /** Quando entra no quadro. */
  quando: Condicao[]
  /** O que a fecha. Vazio = missao que nunca conclui (erro de roteiro). */
  feito: Condicao[]
  /** Premio em VC, pago uma vez. As guias pagam 0: quem paga e o roubo. */
  premio: number
}

/** Atalho para escrever condicao na mesma sintaxe dos arquivos do roteiro. */
function cond(texto: string): Condicao {
  const lido = lerCondicao(texto)
  // Estoura no import de proposito: e dado de desenvolvedor, e um desafio que
  // nunca conclui por erro de digitacao e pior do que um erro na cara.
  if (!lido) throw new Error(`missions.ts: condicao invalida "${texto}"`)
  return lido
}

const c = (...textos: string[]): Condicao[] => textos.map(cond)

/**
 * Os desafios.
 *
 * Quase todos se destravam em cadeia (invadir 3 -> 10 -> 25) para o quadro
 * comecar curto e crescer junto com o jogador: mostrar "roubar 250 mil" para
 * quem tem 250 VC no bolso nao e desafio, e piada.
 *
 * Os premios somam menos de 100 mil VC - muito abaixo do custo de fechar a
 * arvore, que passa dos milhoes. Sao empurrao, nao atalho.
 */
export const DESAFIOS: Missao[] = [
  // --- invasao ---
  { id: 'd-tres-portas', tipo: 'desafio', premio: 400,
    titulo: 'Invadir 3 computadores',
    onde: 'NetRipper → Intrusão',
    quando: c('inicio'), feito: c('invasoes:3') },

  { id: 'd-dez-portas', tipo: 'desafio', premio: 1500,
    titulo: 'Invadir 10 computadores',
    onde: 'NetRipper → Intrusão',
    quando: c('invasoes:3'), feito: c('invasoes:10') },

  { id: 'd-vinte-cinco-portas', tipo: 'desafio', premio: 8000,
    titulo: 'Invadir 25 computadores',
    onde: 'NetRipper → Intrusão',
    quando: c('invasoes:10'), feito: c('invasoes:25') },

  { id: 'd-alvo-grande', tipo: 'desafio', premio: 3000,
    titulo: 'Invadir um alvo de nível 5 ou mais',
    onde: 'precisa de Intrusão nível 5 — o alvo aparece na varredura',
    quando: c('ramo:breaker:3'), feito: c('tier:5') },

  // --- dinheiro ---
  { id: 'd-cinco-mil', tipo: 'desafio', premio: 700,
    titulo: 'Roubar 5.000 VC no total',
    onde: 'vbank.vc → transferir para a sua conta laranja',
    quando: c('marco:transfer'), feito: c('roubado:5000') },

  { id: 'd-cinquenta-mil', tipo: 'desafio', premio: 5000,
    titulo: 'Roubar 50.000 VC no total',
    onde: 'alvos de nível alto guardam contas gordas',
    quando: c('roubado:5000'), feito: c('roubado:50000') },

  { id: 'd-quarto-de-milhao', tipo: 'desafio', premio: 25000,
    titulo: 'Roubar 250.000 VC no total',
    onde: 'só com Rastreador alto, para achar empresa em vez de casa',
    quando: c('roubado:50000'), feito: c('roubado:250000') },

  { id: 'd-cinco-contas', tipo: 'desafio', premio: 1200,
    titulo: 'Zerar 5 contas do V-Bank',
    onde: 'zerar é levar o saldo inteiro de uma vez',
    quando: c('contas:1'), feito: c('contas:5') },

  { id: 'd-quinze-contas', tipo: 'desafio', premio: 6000,
    titulo: 'Zerar 15 contas do V-Bank',
    onde: 'vbank.vc → uma conta por vítima',
    quando: c('contas:5'), feito: c('contas:15') },

  // --- arvore ---
  { id: 'd-chaveiro', tipo: 'desafio', premio: 2500,
    titulo: 'Levar o Decodificador ao nível 5',
    onde: 'darkmarket.vc → Decodificador',
    quando: c('marco:buy'), feito: c('ramo:crypto:5') },

  { id: 'd-vinte-upgrades', tipo: 'desafio', premio: 4000,
    titulo: 'Chegar a 20 níveis de programa',
    onde: 'darkmarket.vc — vale qualquer ramo',
    quando: c('marco:buy'), feito: c('upgrades:20') },

  { id: 'd-quarenta-cinco-upgrades', tipo: 'desafio', premio: 30000,
    titulo: 'Chegar a 45 níveis de programa',
    onde: 'darkmarket.vc — os últimos níveis custam centenas de milhares',
    quando: c('upgrades:20'), feito: c('upgrades:45') },

  // --- rastro ---
  { id: 'd-sangue-frio', tipo: 'desafio', premio: 2000,
    titulo: 'Passar de 70% de rastro e voltar para menos de 20%',
    onde: 'NetRipper → Faxina, e paciência',
    quando: c('rastro:70'), feito: c('abaixo:20') },

  { id: 'd-fantasma', tipo: 'desafio', premio: 6000,
    titulo: 'Levar o Anonimato ao nível 5',
    onde: 'darkmarket.vc → Anonimato, o ramo mais caro da árvore',
    quando: c('marco:buy'), feito: c('ramo:ghost:5') },

  // --- defesa ---
  { id: 'd-muralha', tipo: 'desafio', premio: 3500,
    titulo: 'Bloquear 3 ataques contra o seu micro',
    onde: 'NetRipper → Firewall (o nível dele é a força que ele segura)',
    quando: c('ataques:1'), feito: c('bloqueados:3') },

  { id: 'd-casa-fechada', tipo: 'desafio', premio: 6000,
    titulo: 'Levar o Firewall ao nível 5',
    onde: 'darkmarket.vc → Defesa',
    quando: c('ataques:1'), feito: c('ramo:firewall:5') },
]

/** As missoes que vem do roteiro: todo e-mail com `objetivo:` abre uma. */
export function guiaDe(r: Roteiro): Missao {
  return {
    id: r.id,
    tipo: 'guia',
    titulo: r.objetivo!,
    onde: r.onde,
    quando: r.quando,
    feito: r.feito ?? [],
    premio: 0,
  }
}

export const GUIAS: Missao[] = ROTEIRO.filter((r) => r.objetivo).map(guiaDe)

/** O quadro inteiro: primeiro a historia, depois os desafios. */
export const MISSOES: Missao[] = [...GUIAS, ...DESAFIOS]

export const MISSAO_POR_ID = Object.fromEntries(MISSOES.map((m) => [m.id, m]))

// ---------------------------------------------------------------------------
// Condicoes
// ---------------------------------------------------------------------------

/** O nivel de defesa e o melhor entre os dois ramos defensivos. */
function nivelDeDefesa(s: GameState): number {
  return Math.max(levelOf(s.skills, 'firewall'), levelOf(s.skills, 'antivirus'))
}

function concluidas(s: GameState, tipo?: TipoMissao): number {
  return s.missions.filter((id) => {
    const m = MISSAO_POR_ID[id]
    return m && (!tipo || m.tipo === tipo)
  }).length
}

export function condicaoAtendida(cond: Condicao, s: GameState): boolean {
  switch (cond.tipo) {
    case 'inicio': return true
    case 'marco': return s.milestones.includes(cond.valor)
    case 'email': return s.inbox.some((e) => e.id === cond.valor && e.lido)

    // Acumulados: leem o placar, nunca o estado volatil.
    case 'invasoes': return s.recordes.invasoes >= cond.n
    case 'roubado': return s.recordes.roubado >= cond.n
    case 'tier': return s.recordes.maiorAlvo >= cond.n

    case 'contas': return s.drained.length >= cond.n
    case 'saldo': return s.player.balance >= cond.n
    case 'rastro': return s.player.heat >= cond.n
    case 'abaixo': return s.player.heat <= cond.n
    case 'evidencia': return totalEvidence(s.disk) <= cond.n

    case 'defesa': return nivelDeDefesa(s) >= cond.n
    case 'ramo': return levelOf(s.skills, cond.valor as Branch) >= cond.n
    case 'upgrades': return s.skills.length >= cond.n

    // A lista de ataques e cortada nos 40 mais recentes; nao serve para metas
    // grandes, e por isso nenhuma passa de um punhado.
    case 'ataques': return s.attacks.length >= cond.n
    case 'bloqueados': return s.attacks.filter((a) => a.bloqueado).length >= cond.n

    case 'tudo':
      switch (cond.valor) {
        case 'upgrades': return s.skills.length >= SKILLS.length
        case 'missoes': return concluidas(s) >= MISSOES.length
        case 'desafios': return concluidas(s, 'desafio') >= DESAFIOS.length
      }
  }
}

const todas = (conds: Condicao[], s: GameState) =>
  conds.every((cond) => condicaoAtendida(cond, s))

// ---------------------------------------------------------------------------
// Leitura do quadro
// ---------------------------------------------------------------------------

export const foiConcluida = (s: GameState, id: string) => s.missions.includes(id)

/**
 * A missao ja apareceu para o jogador?
 *
 * Uma vez aberta, fica aberta - e por isso que existe `missionsSeen` no estado.
 * Sem essa memoria, "passar de 70% de rastro e voltar para menos de 20%" seria
 * impossivel: a missao desapareceria do quadro no caminho de volta, antes de
 * poder ser concluida.
 */
export function estaVisivel(s: GameState, m: Missao): boolean {
  return s.missionsSeen.includes(m.id) || foiConcluida(s, m.id) || todas(m.quando, s)
}

/** As missoes que devem entrar no quadro agora. */
export function recemAbertas(s: GameState): Missao[] {
  return MISSOES.filter((m) => !s.missionsSeen.includes(m.id) && todas(m.quando, s))
}

/** O que mostrar no quadro agora, na ordem do registro. */
export function visiveis(s: GameState, tipo?: TipoMissao): Missao[] {
  return MISSOES.filter((m) => (!tipo || m.tipo === tipo) && estaVisivel(s, m))
}

/** Quantas ainda nem apareceram - o quadro diz que existe mais por vir. */
export function trancadas(s: GameState): number {
  return MISSOES.filter((m) => !estaVisivel(s, m)).length
}

/**
 * Quantas estao abertas AGORA - visiveis e nao cumpridas.
 *
 * Nao e "total menos concluidas": esse numero incluiria as que o jogador ainda
 * nem viu, e o contador na aba do webmail prometeria trabalho invisivel.
 */
export function emAberto(s: GameState): number {
  return visiveis(s).filter((m) => !foiConcluida(s, m.id)).length
}

export function placar(s: GameState): { feitas: number; total: number } {
  return { feitas: concluidas(s), total: MISSOES.length }
}

/**
 * A missao da historia que esta aberta agora - a que o jogo mostra como
 * "missao atual".
 *
 * Derivada, e nao guardada: era um campo de texto no estado, e por isso a
 * missao cumprida ficava eternamente no topo do webmail ate outro e-mail
 * chegar e sobrescrever.
 */
export function missaoAtual(s: GameState): Missao | null {
  return visiveis(s, 'guia').find((m) => !foiConcluida(s, m.id))
    ?? visiveis(s, 'desafio').find((m) => !foiConcluida(s, m.id))
    ?? null
}

/** As missoes abertas que acabaram de fechar. */
export function recemConcluidas(s: GameState): Missao[] {
  return MISSOES.filter((m) => (
    !foiConcluida(s, m.id) &&
    m.feito.length > 0 &&
    estaVisivel(s, m) &&
    todas(m.feito, s)
  ))
}

// ---------------------------------------------------------------------------
// Entrega de e-mail
// ---------------------------------------------------------------------------

/** Os e-mails que devem chegar agora - na ordem do roteiro. */
export function pendentes(s: GameState): Roteiro[] {
  return ROTEIRO.filter((r) => (
    !s.inbox.some((e) => e.id === r.id) && todas(r.quando, s)
  ))
}
