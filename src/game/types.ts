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
   * Nivel de criptografia: 0 = aberto. 1..10 exigem o Decodificador naquele
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

/**
 * Os programas que evoluem por niveis: cinco de ataque, dois de defesa.
 *
 * Ate o Capitulo 1 o jogador só invade. Quando o Coletivo aparece, ele descobre
 * que passou o jogo entrando na casa dos outros sem nunca pensar que a dele
 * tinha porta.
 */
export type Branch =
  | 'scanner' | 'breaker' | 'crypto' | 'cleaner' | 'ghost'
  | 'firewall' | 'antivirus'

export interface Skill {
  id: string
  branch: Branch
  /** 1..10 - so da para comprar o nivel N depois do N-1. */
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

/**
 * O que acontece com quem clica na isca de um e-mail de golpe.
 *
 * `dinheiro` e uma PORCENTAGEM do saldo, nao um valor fixo: golpe de 120 VC
 * assusta no primeiro dia e vira piada com meio milhao no banco. Porcentagem
 * continua doendo a partida inteira.
 */
export type EfeitoGolpe =
  | { tipo: 'dinheiro'; n: number }
  | { tipo: 'rastro'; n: number }
  | { tipo: 'nada' }

/** O anzol de um e-mail de golpe. */
export interface Golpe {
  /** O texto do link, no meio do corpo do e-mail. */
  isca: string
  efeitos: EfeitoGolpe[]
  /**
   * O que aconteceu depois do clique. Vazio = ainda nao clicaram.
   * Fica guardado no e-mail porque o estrago tem que continuar visivel quando
   * o jogador reabrir a mensagem - e porque golpe so pega uma vez.
   */
  estrago?: string
}

/** Um e-mail que chegou na caixa do jogador. */
export interface Email {
  id: string
  de: string
  assunto: string
  corpo: string
  /** Minuto do jogo em que chegou. */
  em: number
  lido: boolean
  /** Presente so nos e-mails de golpe. */
  golpe?: Golpe
}

/** Uma tentativa de invasao CONTRA o jogador. */
export interface Attack {
  em: number
  /** Quem tentou. */
  de: string
  /** Forca do ataque, comparada com o seu Firewall. */
  forca: number
  /** O Firewall segurou? */
  bloqueado: boolean
  /** O que aconteceu, em uma linha. */
  efeito: string
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

/**
 * Placar acumulado da partida. Nunca diminui.
 *
 * Existe porque as metricas obvias sao todas enganosas para medir missao:
 * `balance` cai quando o jogador investe na arvore, e a lista de maquinas
 * encolhe quando ele arruma o NetRipper (o botao "esquecer" apaga o host).
 * Medir desafio por elas puniria justamente quem joga bem.
 */
export interface Recordes {
  /** Total transferido para a conta laranja, somando a partida inteira. */
  roubado: number
  /** Quantas maquinas foram invadidas, mesmo as ja esquecidas. */
  invasoes: number
  /** O maior `tier` que o jogador ja arrombou. */
  maiorAlvo: number
}

export interface GameState {
  /**
   * Existe partida salva para continuar?
   *
   * E um campo proprio, e nao "milestones.length > 0", porque o menu precisa
   * saber disso ANTES de o jogador fazer qualquer coisa - quem comecou e nao
   * agiu ainda tem uma partida.
   */
  hasSave: boolean
  /** A partida ja foi iniciada no lobby? Nao e salvo: abrir a url cai no menu. */
  started: boolean
  /**
   * Mostrar o prologo? So em jogo novo - quem continua ja viu. Nao e salvo:
   * e ambientacao de uma vez so, nao progresso.
   */
  prologue: boolean
  /**
   * Jogo pausado. Fica verdadeiro quando um e-mail chega: e o unico momento em
   * que a narrativa tem prioridade sobre a jogatina.
   */
  paused: boolean
  /** Caixa de entrada, do mais antigo ao mais recente. */
  inbox: Email[]
  /**
   * Ids das missoes ja concluidas (`game/missions.ts`).
   *
   * E estado salvo, e nao algo derivado das condicoes na hora de desenhar a
   * tela, porque conclusao tem que ser DEFINITIVA: "derrubar o rastro abaixo de
   * 30" e verdade por um instante, e uma missao que se desmarca sozinha quando
   * o rastro sobe de novo nao e missao, e termometro.
   */
  missions: string[]
  /**
   * Ids das missoes que ja apareceram no quadro.
   *
   * Missao aberta nao fecha sozinha: sem esta memoria, um desafio como "passar
   * de 70% de rastro e voltar para menos de 20%" sairia do quadro no meio do
   * caminho, e nunca poderia ser concluido.
   */
  missionsSeen: string[]
  /** Placar acumulado, para as missoes nao dependerem do estado volatil. */
  recordes: Recordes
  /** Tentativas de invasao sofridas. */
  attacks: Attack[]
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
