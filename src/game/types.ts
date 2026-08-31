/**
 * Tipos do dominio do jogo.
 *
 * Regra de camadas: `game/` nao importa nada de `os/`, `apps/` ou `sites/`.
 * A UI le e muda o estado apenas pelas acoes do store (`game/store.ts`).
 */

/** Credencial roubada: e o que destrava um site no navegador. */
export interface Credential {
  /** Dominio onde ela funciona, ex.: "vbank.vc". */
  site: string
  user: string
  pass: string
  /** De quem veio (aparece no gerenciador de senhas). */
  owner: string
}

export type FileKind =
  | 'text' | 'doc' | 'sheet' | 'image' | 'audio' | 'archive'
  | 'creds' | 'wallet' | 'exe' | 'system'

/** Um arquivo dentro de uma pasta. */
export interface VFile {
  type: 'file'
  name: string
  kind: FileKind
  size: number
  /**
   * Nivel de criptografia: 0 = aberto. 1..3 exigem o Decodificador naquele
   * nivel para abrir ou baixar.
   */
  locked: number
  /** Texto exibido no Bloco de Notas. */
  content: string
  /** Credencial que este arquivo entrega ao ser lido. */
  grants?: Credential
  /** V-Coin direto (carteiras soltas). */
  coins?: number
  /** Vale dinheiro se vendido no mercado negro. */
  worth?: number
  /**
   * Peso incriminador. Enquanto estiver no SEU disco, gera rastro continuo -
   * o ScanSS tambem varre a sua maquina. Apagar ou vender zera isso.
   */
  evidence?: number
}

export interface VFolder {
  type: 'folder'
  name: string
  children: VNode[]
}

export type VNode = VFile | VFolder

/** Caminho dentro de uma arvore, do topo para baixo. */
export type VPath = string[]

export type MachineKind = 'home' | 'office' | 'corp'

export interface Machine {
  id: string
  ip: string
  hostname: string
  owner: string
  kind: MachineKind
  /** 1..10 - o "andar" do alvo. Define visibilidade, dificuldade e loot. */
  tier: number
  /** 1..10 - quanto rastro a invasao custa. */
  security: number
  /** Nivel de Rastreador necessario para o host aparecer na varredura. */
  visibility: number
  /** Nivel de Intrusao necessario para invadir. */
  requiredBreaker: number
  port: number
  service: string
  root: VNode[]
  /** Ja apareceu em alguma varredura. */
  found: boolean
  probed: boolean
  exploited: boolean
}

/** Conta do V-Bank. Geradas junto com as maquinas, vivem no estado do jogo. */
export interface BankAccount {
  user: string
  holder: string
  number: string
  balance: number
  pass: string
}

// ---------------------------------------------------------------------------
// Arvore de habilidades
// ---------------------------------------------------------------------------

/** Os cinco programas que evoluem por niveis. */
export type Branch = 'scanner' | 'breaker' | 'crypto' | 'cleaner' | 'ghost'

export interface Skill {
  id: string
  branch: Branch
  /** 1..3 - so da para comprar o nivel N depois do N-1. */
  level: number
  name: string
  price: number
  description: string
  /** Resumo do ganho, mostrado em destaque na loja. */
  effect: string
}

/**
 * Uma linha do log que o ScanSS guardou sobre voce.
 *
 * E o registro REAL do que voce fez - nao um numero derivado do rastro. A
 * primeira versao gerava as linhas a partir do rastro atual, entao elas sumiam
 * sozinhas conforme ele caia, como se o log se apagasse sem ninguem mexer.
 */
export interface TrailEntry {
  /** Minuto do jogo em que aconteceu. */
  at: number
  text: string
  /** Quanto de rastro este evento gerou. */
  heat: number
}

export type HeatLevel = 'calmo' | 'atencao' | 'alerta' | 'critico'

export interface Player {
  handle: string
  balance: number
  /** Rastreamento do ScanSS: 0..100. Chegou em 100, eles batem na porta. */
  heat: number
  xp: number
  /** Numero da sua conta laranja no V-Bank (destino das transferencias). */
  muleAccount: string
}

export interface GameState {
  player: Player
  /** Ids de habilidades compradas (`game/skills.ts`). */
  skills: string[]
  machines: Machine[]
  /** Contas do V-Bank existentes nesta partida, por usuario. */
  accounts: Record<string, BankAccount>
  /** Contador para dar id unico a cada maquina gerada. */
  nextMachine: number
  /** Maquina montada na unidade Z: (id) ou null. */
  connectedId: string | null
  /** O seu disco C: - uma arvore que voce organiza. */
  disk: VNode[]
  /** Credenciais ja lidas (o Bloco de Notas as revela). */
  credentials: Credential[]
  /** Sessoes abertas no navegador, por dominio -> usuario logado. */
  sessions: Record<string, string>
  /** Contas ja esvaziadas, para nao transferir duas vezes. */
  drained: string[]
  /** O que o ScanSS registrou sobre voce, do mais antigo ao mais recente. */
  trail: TrailEntry[]
  /** Marcos de progresso, para o checklist do manual. */
  milestones: string[]
  /** O Klipe ja apareceu sozinho alguma vez? */
  assistantSeen: boolean
  busted: boolean
  /** Minutos desde o inicio da partida (relogio do XP). */
  minutes: number
  /** Modo desenvolvedor ligado agora? */
  devMode: boolean
  /** Ja foi usado alguma vez nesta partida (fica registrado, por honestidade). */
  devUsed: boolean
}
