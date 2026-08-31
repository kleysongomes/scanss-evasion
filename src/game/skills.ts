/**
 * Arvore de habilidades: cinco programas, dez niveis cada.
 *
 * Comprar nao te da "mais um icone": te da o nivel seguinte de um programa que
 * voce ja tem, e o nivel N exige o N-1. Como sao 50 upgrades com preco
 * exponencial, a economia nao satura - dá para jogar muito tempo sem "zerar a
 * loja".
 *
 * As regras nunca perguntam "tem tal item?", e sim "qual o nivel deste ramo?".
 */

import type { Branch, Skill } from './types'

export const MAX_LEVEL = 10

export interface BranchInfo {
  id: Branch
  name: string
  icon: string
  /** O que este programa faz, em uma linha. */
  role: string
  /** Como o nivel se traduz em vantagem, para a UI explicar. */
  scale: (level: number) => string
  /** Multiplicador de preco: ramos mais poderosos custam mais. */
  cost: number
  /** Nome dado a cada nivel, para nao ser tudo "nivel 4". */
  titles: string[]
}

/**
 * Preco do nivel N. A base cresce ~2,3x por nivel, entao o nivel 10 custa
 * centenas de milhares - e sempre existe algo caro para perseguir.
 *
 * O nivel 1 tambem e pago: so o Rastreador e a Intrusao vem de brinde, por
 * estarem em STARTING_SKILLS. Sem isso, Decodificador, Faxina e Anonimato
 * cairiam de graca no colo do jogador na primeira compra.
 */
export function priceOf(level: number, cost: number): number {
  const bruto = 260 * Math.pow(2.32, level - 1) * cost
  // Arredonda para um numero "de loja" (dezenas ou centenas).
  const casa = bruto < 1000 ? 10 : bruto < 20000 ? 50 : 500
  return Math.round(bruto / casa) * casa
}

export const BRANCHES: BranchInfo[] = [
  {
    id: 'scanner', name: 'Rastreador', icon: '📡', cost: 1,
    role: 'Enxerga máquinas na rede. Quanto maior o nível, mais alvos e melhores.',
    scale: (n) => `encontra alvos até o nível ${n} · até ${4 + n * 2} hosts na lista`,
    titles: ['Varredura local', 'Varredura de bairro', 'Varredura estendida',
             'Mapa de sub-redes', 'Sondagem passiva', 'Varredura profunda',
             'Rastreio de backbone', 'Espelho de tráfego', 'Sonda corporativa',
             'Visão total'],
  },
  {
    id: 'breaker', name: 'Intrusão', icon: '🔨', cost: 1.25,
    role: 'Arromba a porta do alvo. Define o que você consegue invadir.',
    scale: (n) => `invade alvos de dificuldade até ${n}`,
    titles: ['Compartilhamento SMB', 'Senha padrão', 'Força bruta SSH',
             'Estouro de buffer', 'Injeção em painel web', 'Escalada de privilégio',
             'Falha de autenticação', 'Execução remota', 'Cadeia de exploits',
             'Zero-day'],
  },
  {
    id: 'crypto', name: 'Decodificador', icon: '🔓', cost: 0.85,
    role: 'Abre os arquivos trancados. Os melhores estão atrás dos maiores cadeados.',
    scale: (n) => `abre cadeados até o nível ${n}`,
    titles: ['Senha simples', 'Dicionário', 'Dicionário estendido',
             'Tabela arco-íris', 'Quebra de ZIP', 'Chave fraca',
             'Fatoração parcial', 'Chave forte', 'Cofre corporativo',
             'Qualquer coisa'],
  },
  {
    id: 'cleaner', name: 'Faxina', icon: '🧹', cost: 0.7,
    role: 'Apaga os logs e derruba o rastreamento já acumulado.',
    scale: (n) => `−${cleanPowerAt(n)} de rastro por uso`,
    titles: ['Limpador de logs', 'Sobrescrita simples', 'Sobrescrita dupla',
             'Limpeza de cache', 'Sobrescrita profunda', 'Logs do provedor',
             'Rotação forjada', 'Carimbo de tempo falso', 'Faxina total',
             'Nunca estive aqui'],
  },
  {
    id: 'ghost', name: 'Anonimato', icon: '🛰️', cost: 1.7,
    role: 'Esconde a sua origem. Reduz TODO rastro que você gera, para sempre.',
    scale: (n) => `todo rastro gerado −${Math.round((1 - heatFactorAt(n)) * 100)}%`,
    titles: ['Proxy simples', 'Proxy duplo', 'Cadeia de 3 saltos',
             'Cadeia de 5 saltos', 'Cadeia de 7 saltos', 'Saltos rotativos',
             'Rota internacional', 'Túnel cifrado', 'Rota fantasma',
             'Você não existe'],
  },
]

export const BRANCH_BY_ID = Object.fromEntries(BRANCHES.map((b) => [b.id, b]))

/** Quanto a Faxina derruba num nivel. */
export function cleanPowerAt(level: number): number {
  return level <= 0 ? 0 : 18 + level * 5
}

/** Multiplicador de rastro gerado num nivel de Anonimato. */
export function heatFactorAt(level: number): number {
  return Math.max(0.18, 1 - level * 0.085)
}

/** As 50 habilidades, montadas a partir dos ramos. */
export const SKILLS: Skill[] = BRANCHES.flatMap((b) =>
  b.titles.map((title, i): Skill => {
    const level = i + 1
    return {
      id: `${b.id}${level}`,
      branch: b.id,
      level,
      name: title,
      price: priceOf(level, b.cost),
      description: b.role,
      effect: b.scale(level),
    }
  }))

export const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]))

/** Habilidades que ja vem no micro. */
export const STARTING_SKILLS = ['scanner1', 'breaker1']

export function skillsOf(branch: Branch): Skill[] {
  return SKILLS.filter((s) => s.branch === branch)
}

/** Nivel atual de um ramo (0 = nao possui). */
export function levelOf(owned: string[], branch: Branch): number {
  return skillsOf(branch)
    .filter((s) => owned.includes(s.id))
    .reduce((max, s) => Math.max(max, s.level), 0)
}

/** O proximo nivel comprável de um ramo, ou null se ja esta no maximo. */
export function nextSkill(owned: string[], branch: Branch): Skill | null {
  return skillsOf(branch).find((s) => !owned.includes(s.id)) ?? null
}

/**
 * Uma habilidade so pode ser comprada se o nivel anterior do mesmo ramo ja
 * estiver na mao - e por isso que a arvore e uma arvore.
 */
export function canBuy(owned: string[], id: string): boolean {
  const skill = SKILL_BY_ID[id]
  if (!skill || owned.includes(id)) return false
  return skill.level === 1 || levelOf(owned, skill.branch) >= skill.level - 1
}

// ---------------------------------------------------------------------------
// Efeitos: as regras leem daqui, nunca de ids soltos
// ---------------------------------------------------------------------------

/** Quanto o Anonimato multiplica o rastro gerado. */
export function heatFactor(owned: string[]): number {
  return heatFactorAt(levelOf(owned, 'ghost'))
}

/** Quanto a Faxina derruba por uso (0 = nao possui). */
export function cleanPower(owned: string[]): number {
  return cleanPowerAt(levelOf(owned, 'cleaner'))
}

/** Quantos hosts cabem na lista do NetRipper com o Rastreador atual. */
export function targetCapacity(owned: string[]): number {
  return 4 + levelOf(owned, 'scanner') * 2
}
