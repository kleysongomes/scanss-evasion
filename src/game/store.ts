/**
 * Estado e regras do jogo (fonte unica da verdade).
 *
 * Toda mutacao passa por uma acao daqui - a ferramenta de invasao, o Explorer e
 * os sites do navegador chamam as mesmas funcoes, entao nao existe regra
 * duplicada na UI.
 */

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { alvosIniciais, gerarAlvo } from './generator'
import {
  addAt, folder, isFile, listAt, nodeAt, removeAt, renameAt, totalEvidence,
  unlockAt, walk,
} from './fs'
import {
  MAX_LEVEL, SKILL_BY_ID, STARTING_SKILLS, canBuy, cleanPower, heatFactor,
  levelOf, recoveryRate, shieldPower, skillsOf, targetCapacity,
} from './skills'
import { chance, int, pick } from './rng'
import { pendentes, personalizar } from './story'
import type {
  Attack, BankAccount, Branch, Credential, Email, GameState, HeatLevel,
  Machine, TrailEntry, VFile, VNode, VPath,
} from './types'

/** Custo de rastreamento de cada acao (antes do Anonimato). */
const HEAT = {
  scan: 1,
  probe: 2,
  exploit: 4,
  crack: 2,
  download: 3,
  login: 6,
  transfer: 22,
} as const

/**
 * Rastro por minuto, por ponto de evidencia guardada no seu disco.
 * O ScanSS tambem varre a SUA maquina: arquivo roubado parado te queima.
 * Com o decaimento em faixas, ~40 de evidencia ja anulam a queda no verde.
 */
const EVIDENCE_RATE = 0.0025

const START_BALANCE = 250

/**
 * Quanto o rastro cai por minuto de jogo.
 *
 * Nao e linear de proposito: quanto mais quente, MAIS DEVAGAR ele esfria -
 * quem esta sendo investigado nao sai da mira so por ficar quieto. Sair do
 * vermelho so esperando leva dezenas de minutos reais, e e isso que faz o ramo
 * Faxina valer o preco.
 */
export function decayPerMinute(heat: number): number {
  if (heat >= 85) return 0.02
  if (heat >= 60) return 0.04
  if (heat >= 30) return 0.07
  return 0.10
}

/** Queda por hora de jogo na faixa atual, para a UI explicar. */
export function decayPerHour(heat: number): number {
  return decayPerMinute(heat) * 60
}

/** Pasta onde tudo que voce baixa cai primeiro. */
export const DOWNLOADS = 'Baixados'

/** Nomes dos atacantes, para o log de defesa ter cara de gente. */
const INVASORES = [
  'coletivo.irc', 'v0id@coletivo', 'n3mesis', 'kr0w', 'sombra_br',
  'anon@irc.undernet', 'zer0cool',
]

/**
 * Chance de sofrer um ataque por minuto de jogo.
 *
 * So vale depois que o Coletivo notou o jogador (4 contas zeradas): antes
 * disso, ninguem tem motivo para bater na porta dele.
 */
const CHANCE_ATAQUE = 0.0025

function initialState(): GameState {
  const { machines, accounts } = alvosIniciais()
  return {
    hasSave: false,
    started: false,
    prologue: false,
    paused: false,
    inbox: [],
    objetivo: null,
    attacks: [],
    player: {
      handle: 'operador',
      balance: START_BALANCE,
      heat: 0,
      xp: 0,
      muleAccount: '4471-7734',
    },
    skills: [...STARTING_SKILLS],
    machines,
    accounts,
    nextMachine: machines.length + 1,
    connectedId: null,
    disk: [folder(DOWNLOADS), folder('Meus documentos')],
    credentials: [],
    sessions: {},
    drained: [],
    trail: [],
    milestones: [],
    assistantSeen: false,
    busted: false,
    minutes: 8 * 60,
    devMode: false,
    devUsed: false,
  }
}

export function heatLevel(heat: number): HeatLevel {
  if (heat >= 85) return 'critico'
  if (heat >= 60) return 'alerta'
  if (heat >= 30) return 'atencao'
  return 'calmo'
}

export function heatColor(heat: number): string {
  const level = heatLevel(heat)
  return level === 'critico' ? '#ff4136'
    : level === 'alerta' ? '#ff851b'
    : level === 'atencao' ? '#ffdc00'
    : '#2ecc40'
}

/** Relogio "HH:MM" a partir dos minutos decorridos. */
export function clockOf(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = Math.floor(minutes % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Quanto rastro por hora a evidencia guardada esta gerando. */
export function evidenceHeatPerHour(disk: VNode[]): number {
  return totalEvidence(disk) * EVIDENCE_RATE * 60
}

/**
 * O gerenciador de senhas do navegador so lista o que ainda esta no disco.
 *
 * Sem isto, apagar o arquivo roubado saia de graca: o jogador zerava a
 * evidencia e continuava com o acesso rapido ao banco. Agora ha escolha real -
 * guardar o bilhete (e o rastro que ele gera) ou perder o preenchimento
 * automatico.
 */
function pruneCredentials(disk: VNode[], creds: Credential[]): Credential[] {
  const noDisco = new Set(
    walk(disk)
      .filter((f) => f.grants)
      .map((f) => `${f.grants!.site}|${f.grants!.user}`))
  return creds.filter((c) => noDisco.has(`${c.site}|${c.user}`))
}

/**
 * O save carregado faz sentido?
 *
 * Existe para um bug que ja aconteceu: mudar o formato do estado sem subir a
 * `version` faz o zustand misturar o save velho com o estado novo. O sintoma
 * foi cruel de diagnosticar - as maquinas vinham do save antigo e as contas do
 * banco de uma geracao nova, entao o arquivo de senhas apontava para um usuario
 * inexistente e o banco recusava um login que parecia correto.
 *
 * Em vez de confiar so na disciplina de lembrar da `version`, o save agora se
 * verifica: toda credencial espalhada pelo mundo precisa ter conta no banco.
 */
export function saveConsistente(s: Partial<GameState> | undefined): boolean {
  if (!s || !s.accounts || !Array.isArray(s.machines) || !Array.isArray(s.disk)) {
    return false
  }
  const contas = new Set(Object.keys(s.accounts))
  const arvores = [...s.machines.map((m) => m.root), s.disk]

  for (const arvore of arvores) {
    if (!Array.isArray(arvore)) return false
    for (const f of walk(arvore)) {
      if (f.grants && !contas.has(f.grants.user)) return false
    }
  }
  return true
}

/** Abre todos os cadeados de uma arvore (so o modo dev usa). */
function destrancarTudo(nodes: VNode[]): VNode[] {
  return nodes.map((n) => (
    n.type === 'folder'
      ? { ...n, children: destrancarTudo(n.children) }
      : { ...n, locked: 0 }))
}

/** Aviso para quando o item removido levava senha junto. */
function perdaDeSenha(node: VNode): string {
  const usuarios = walk([node]).filter((f) => f.grants).map((f) => f.grants!.user)
  if (usuarios.length === 0) return ''
  return ` A senha de ${usuarios.join(', ')} saiu do gerenciador do navegador.`
}

export interface Result { ok: boolean; message: string }

const ok = (message: string): Result => ({ ok: true, message })
const no = (message: string): Result => ({ ok: false, message })

export interface GameActions {
  /** Continua a partida salva. */
  start: (apelido: string) => void
  /** Apaga tudo e comeca do zero - e so aqui que o prologo toca. */
  startNew: (apelido: string) => void
  endPrologue: () => void
  /** Retoma o jogo pausado por um e-mail. */
  resume: () => void

  /** Entrega os e-mails cujo gatilho foi atendido. Pausa o jogo se entregar. */
  deliverMail: () => Email[]
  readMail: (id: string) => void

  /** Sorteia um ataque contra o jogador, se for a hora. */
  rollAttack: () => Attack | null

  tick: (deltaMinutes: number) => void
  /**
   * Soma rastro. `reason` vira uma linha no log do ScanSS - toda acao que
   * queima o jogador deve passar uma, senao o log nao conta a historia.
   */
  addHeat: (amount: number, reason?: string) => void
  mark: (milestone: string) => void
  reached: (milestone: string) => boolean
  seeAssistant: () => void

  /** Nivel atual de um ramo da arvore de habilidades. */
  level: (branch: Branch) => number
  buySkill: (id: string) => Result

  machine: (idOrIp: string) => Machine | undefined
  connected: () => Machine | undefined

  /** Varre a rede. Devolve quantos hosts apareceram e quantos ficaram fora. */
  scan: () => { novos: number; visiveis: number; lotado: boolean }
  /** Tira um host da lista (util depois de esvazia-lo). */
  forget: (id: string) => void
  probe: (id: string) => Result
  exploit: (id: string) => Result
  connect: (id: string) => Result
  disconnect: () => void

  // --- disco remoto (Z:) ---
  crack: (path: VPath, name: string) => Result
  download: (path: VPath, name: string) => Result

  // --- disco local (C:) ---
  reveal: (file: VFile) => void
  sell: (path: VPath, name: string) => Result
  remove: (path: VPath, name: string) => Result
  mkdir: (path: VPath, name?: string) => Result
  rename: (path: VPath, from: string, to: string) => Result
  move: (from: VPath, name: string, to: VPath) => Result

  cleanLogs: () => Result

  login: (site: string, user: string, pass: string) => Result
  logout: (site: string) => void
  transfer: (fromUser: string, toAccount: string, amount: number) => Result

  // --- modo desenvolvedor ---
  /**
   * Liga/desliga o modo dev. Enquanto desligado, TODA acao `dev*` e ignorada -
   * o jogo nao pode ser alterado por acidente nem por um clique perdido.
   */
  setDevMode: (on: boolean) => void
  devSetBalance: (vc: number) => void
  devSetHeat: (heat: number) => void
  devSetLevel: (branch: Branch, level: number) => void
  devSpawn: (tier: number, quantos?: number) => void
  devOpenAll: () => void
  devAdvance: (minutes: number) => void

  reset: () => void
}

export type GameStore = GameState & GameActions

/**
 * Fallback para quando nao ha localStorage: testes em Node e navegadores com o
 * armazenamento bloqueado. Sem isto o save some com um aviso a cada mudanca.
 */
function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() { return data.size },
    key: (i) => [...data.keys()][i] ?? null,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => { data.set(k, v) },
    removeItem: (k) => { data.delete(k) },
    clear: () => data.clear(),
  }
}

const saveStorage = createJSONStorage(() =>
  typeof localStorage !== 'undefined' ? localStorage : memoryStorage())

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState(),

      // ------------------------------------------------------------------
      // Nucleo
      // ------------------------------------------------------------------
      start: (apelido) => set((s) => ({
        started: true,
        hasSave: true,
        player: { ...s.player, handle: apelido.trim() || 'operador' },
      })),

      startNew: (apelido) => {
        get().reset()
        set((s) => ({
          started: true,
          hasSave: true,
          prologue: true,
          player: { ...s.player, handle: apelido.trim() || 'operador' },
        }))
      },

      endPrologue: () => set({ prologue: false }),

      resume: () => set({ paused: false }),

      /**
       * Entrega o que o roteiro liberou. Um e-mail novo PAUSA o jogo: e o unico
       * momento em que a narrativa tem prioridade sobre a jogatina.
       */
      deliverMail: () => {
        const novos = pendentes(get())
        if (novos.length === 0) return []

        const apelido = get().player.handle
        const emails: Email[] = novos.map((r) => ({
          id: r.id,
          de: r.de,
          assunto: personalizar(r.assunto, apelido),
          corpo: personalizar(r.corpo, apelido),
          em: get().minutes,
          lido: false,
        }))

        // O objetivo do e-mail mais recente que trouxe um substitui o anterior.
        const comObjetivo = [...novos].reverse().find((r) => r.objetivo)

        set((s) => ({
          inbox: [...s.inbox, ...emails],
          paused: true,
          objetivo: comObjetivo
            ? personalizar(comObjetivo.objetivo!, apelido)
            : s.objetivo,
        }))
        return emails
      },

      readMail: (id) => set((s) => ({
        inbox: s.inbox.map((e) => (e.id === id ? { ...e, lido: true } : e)),
      })),

      /**
       * Um ataque contra o jogador. O Firewall segura pela forca; o Antivirus
       * devolve parte do prejuizo do que passou.
       */
      rollAttack: () => {
        const s = get()
        // Ninguem bate na porta de quem ainda nao incomodou ninguem.
        if (s.drained.length < 4 || s.busted || s.paused) return null
        if (!chance(CHANCE_ATAQUE)) return null

        // Ataques escalam com o quanto o jogador se expos.
        const forca = Math.min(10, 1 + Math.floor(s.drained.length / 2) + int(0, 2))
        const bloqueado = shieldPower(s.skills) >= forca

        let efeito = 'Tentativa bloqueada pelo Firewall.'
        if (!bloqueado) {
          const bruto = Math.round(s.player.balance * (0.05 + forca * 0.02))
          const devolvido = Math.round(bruto * recoveryRate(s.skills))
          const perda = Math.max(0, bruto - devolvido)

          set((st) => ({
            player: { ...st.player, balance: Math.max(0, st.player.balance - perda) },
          }))
          get().addHeat(forca, `intrusão SOFRIDA: implante de ${forca} de força`)

          efeito = perda > 0
            ? `Passou. −${perda} VC` +
              (devolvido > 0 ? ` (o Antivírus recuperou ${devolvido})` : '')
            : 'Passou, mas o Antivírus recuperou tudo.'
        }

        const ataque: Attack = {
          em: get().minutes, de: pick(INVASORES), forca, bloqueado, efeito,
        }
        set((st) => ({ attacks: [...st.attacks, ataque].slice(-40) }))
        return ataque
      },

      tick: (deltaMinutes) => set((s) => {
        if (s.busted || s.paused) return s

        // Minuto a minuto, porque a queda muda de faixa conforme esfria.
        const sujeiraPorMin = totalEvidence(s.disk) * EVIDENCE_RATE
        let heat = s.player.heat
        for (let i = 0; i < deltaMinutes; i++) {
          heat = Math.min(100, Math.max(0,
            heat - decayPerMinute(heat) + sujeiraPorMin))
        }

        return {
          minutes: s.minutes + deltaMinutes,
          player: { ...s.player, heat },
          busted: heat >= 100,
        }
      }),

      addHeat: (amount, reason) => set((s) => {
        const gerado = amount * heatFactor(s.skills)
        const heat = Math.min(100, s.player.heat + gerado)
        const linha: TrailEntry[] = reason
          ? [{ at: s.minutes, text: reason, heat: gerado }]
          : []
        return {
          player: { ...s.player, heat },
          // O log guarda as ultimas 60 linhas: o suficiente para ler, sem
          // deixar o save crescer sem limite.
          trail: [...s.trail, ...linha].slice(-60),
          busted: s.busted || heat >= 100,
        }
      }),

      mark: (milestone) => set((s) => (
        s.milestones.includes(milestone)
          ? s
          : { milestones: [...s.milestones, milestone] }
      )),

      reached: (milestone) => get().milestones.includes(milestone),
      seeAssistant: () => set({ assistantSeen: true }),

      // ------------------------------------------------------------------
      // Arvore de habilidades
      // ------------------------------------------------------------------
      level: (branch) => levelOf(get().skills, branch),

      buySkill: (id) => {
        const skill = SKILL_BY_ID[id]
        if (!skill) return no('Programa desconhecido.')
        if (get().skills.includes(id)) return no(`${skill.name} já está instalado.`)
        if (!canBuy(get().skills, id)) {
          return no(`Instale antes o nível ${skill.level - 1} deste programa.`)
        }
        const falta = skill.price - get().player.balance
        if (falta > 0) return no(`Saldo insuficiente: faltam ${falta} VC.`)

        get().mark('buy')
        set((s) => ({
          skills: [...s.skills, id],
          player: { ...s.player, balance: s.player.balance - skill.price },
        }))
        return ok(`${skill.name} instalado. ${skill.effect}.`)
      },

      machine: (idOrIp) =>
        get().machines.find((m) => m.id === idOrIp || m.ip === idOrIp),

      connected: () => {
        const id = get().connectedId
        return id ? get().machines.find((m) => m.id === id) : undefined
      },

      // ------------------------------------------------------------------
      // Invasao
      // ------------------------------------------------------------------
      /**
       * Cada varredura revela o que ja existia e ainda GERA alvos novos, ate a
       * capacidade do Rastreador. Sem isso o jogador esvaziava a lista e ficava
       * obrigado a comprar upgrade para o jogo continuar.
       */
      scan: () => {
        const alcance = get().level('scanner')
        const capacidade = targetCapacity(get().skills)
        get().addHeat(HEAT.scan, 'varredura de faixa 10.0.0.0/16')
        get().mark('scan')

        const antes = get().machines.filter((m) => m.found).length

        // 1) o que estava fora do alcance e agora cabe
        set((s) => ({
          machines: s.machines.map((m) => (
            m.visibility <= alcance ? { ...m, found: true } : m
          )),
        }))

        // 2) alvos novos ate encher a lista
        const usados = new Set(Object.keys(get().accounts))
        const novasMaquinas: Machine[] = []
        const novasContas: Record<string, BankAccount> = {}
        let proximo = get().nextMachine

        const espaco = capacidade - get().machines.filter((m) => m.found).length
        const quantos = Math.max(0, Math.min(espaco, int(1, 3)))

        for (let i = 0; i < quantos; i++) {
          // Alvos de andar proximo ao seu alcance: nem trivial, nem impossivel.
          const tier = Math.max(1, Math.min(alcance, alcance - int(0, 2)))
          const { machine, account } = gerarAlvo(tier, `m${proximo++}`, usados)
          novasMaquinas.push({ ...machine, found: true })
          if (account) {
            novasContas[account.user] = account
            usados.add(account.user)
          }
        }

        set((s) => ({
          machines: [...s.machines, ...novasMaquinas],
          accounts: { ...s.accounts, ...novasContas },
          nextMachine: proximo,
        }))

        const visiveis = get().machines.filter((m) => m.found).length
        return {
          novos: visiveis - antes,
          visiveis,
          lotado: visiveis >= capacidade,
        }
      },

      forget: (id) => set((s) => ({
        machines: s.machines.filter((m) => m.id !== id),
        connectedId: s.connectedId === id ? null : s.connectedId,
      })),

      probe: (id) => {
        const m = get().machine(id)
        if (!m) return no('Host não encontrado.')
        get().addHeat(HEAT.probe, `sondagem de portas em ${m.ip}`)
        get().mark('probe')
        set((s) => ({
          machines: s.machines.map((x) => (x.id === m.id ? { ...x, probed: true } : x)),
        }))
        return ok(`${m.hostname}: porta ${m.port}/${m.service} aberta.`)
      },

      exploit: (id) => {
        const m = get().machine(id)
        if (!m) return no('Host não encontrado.')
        if (!m.probed) return no('Analise o host antes de invadir.')
        if (m.exploited) return no(`${m.hostname} já está comprometido.`)
        if (get().level('breaker') < m.requiredBreaker) {
          return no(`Exige Intrusão nível ${m.requiredBreaker}; você está no ` +
                    `nível ${get().level('breaker')}.`)
        }

        get().addHeat(HEAT.exploit + m.security,
                      `intrusão em ${m.ip} (${m.hostname}) porta ${m.port}`)
        get().mark('exploit')
        set((s) => ({
          machines: s.machines.map((x) => (x.id === m.id ? { ...x, exploited: true } : x)),
          player: { ...s.player, xp: s.player.xp + m.security * 10 },
        }))
        return ok(`Acesso obtido em ${m.hostname}.`)
      },

      connect: (id) => {
        const m = get().machine(id)
        if (!m) return no('Host não encontrado.')
        if (!m.exploited) return no(`${m.hostname} ainda não foi invadido.`)
        set({ connectedId: m.id })
        get().mark('connect')
        return ok(`${m.hostname} montado na unidade Z:.`)
      },

      disconnect: () => set({ connectedId: null }),

      // ------------------------------------------------------------------
      // Disco remoto (Z:)
      // ------------------------------------------------------------------
      crack: (path, name) => {
        const m = get().connected()
        if (!m) return no('Nenhuma máquina conectada.')
        const alvo = nodeAt(m.root, [...path, name])
        if (!alvo || !isFile(alvo)) return no('Arquivo não encontrado.')
        if (!alvo.locked) return no(`${name} não está trancado.`)

        const nivel = get().level('crypto')
        if (nivel < alvo.locked) {
          return no(`Cadeado nível ${alvo.locked}; seu Decodificador é nível ` +
                    `${nivel}. Atualize no darkmarket.vc.`)
        }

        get().addHeat(HEAT.crack, `quebra de cifra: ${name} em ${m.ip}`)
        get().mark('crack')
        set((s) => ({
          machines: s.machines.map((x) => (
            x.id === m.id ? { ...x, root: unlockAt(x.root, path, name) } : x
          )),
        }))
        return ok(`${name} destrancado.`)
      },

      download: (path, name) => {
        const m = get().connected()
        if (!m) return no('Nenhuma máquina conectada.')
        const alvo = nodeAt(m.root, [...path, name])
        if (!alvo) return no('Arquivo não encontrado.')
        if (!isFile(alvo)) return no('Selecione um arquivo, não uma pasta.')
        if (alvo.locked) return no(`${name} está trancado. Quebre o cadeado antes.`)

        const destino = listAt(get().disk, [DOWNLOADS]) ?? []
        if (destino.some((n) => n.name === alvo.name)) {
          return no(`${name} já está no seu disco.`)
        }

        get().addHeat(HEAT.download, `transferência de ${name} de ${m.ip}`)
        get().mark('download')
        set((s) => ({
          disk: addAt(s.disk, [DOWNLOADS], alvo),
          player: {
            ...s.player,
            balance: s.player.balance + (alvo.coins ?? 0),
            xp: s.player.xp + 5,
          },
        }))
        return ok(alvo.coins
          ? `${name} baixado. Carteira aberta: +${alvo.coins} VC.`
          : `${name} baixado para C:\\${DOWNLOADS}\\`)
      },

      // ------------------------------------------------------------------
      // Disco local (C:)
      // ------------------------------------------------------------------
      reveal: (file) => {
        if (!file.grants) return
        get().mark('creds')
        const g: Credential = file.grants
        set((s) => (
          s.credentials.some((c) => c.site === g.site && c.user === g.user)
            ? s
            : { credentials: [...s.credentials, g] }
        ))
      },

      sell: (path, name) => {
        const alvo = nodeAt(get().disk, [...path, name])
        if (!alvo || !isFile(alvo)) return no('Selecione um arquivo.')
        if (!alvo.worth) return no(`Ninguém paga por ${name}.`)

        get().mark('sell')
        set((s) => {
          const disk = removeAt(s.disk, path, name)
          return {
            disk,
            credentials: pruneCredentials(disk, s.credentials),
            player: {
              ...s.player,
              balance: s.player.balance + alvo.worth!,
              xp: s.player.xp + 10,
            },
          }
        })
        return ok(`${name} vendido por ${alvo.worth} VC — e saiu do seu disco.` +
                  perdaDeSenha(alvo))
      },

      remove: (path, name) => {
        const alvo = nodeAt(get().disk, [...path, name])
        if (!alvo) return no('Item não encontrado.')
        get().mark('delete')
        set((s) => {
          const disk = removeAt(s.disk, path, name)
          return { disk, credentials: pruneCredentials(disk, s.credentials) }
        })
        const peso = isFile(alvo) ? alvo.evidence ?? 0 : 0
        return ok((peso
          ? `${name} apagado: −${peso} de evidência no seu disco.`
          : `${name} apagado.`) + perdaDeSenha(alvo))
      },

      mkdir: (path, name = 'Nova pasta') => {
        set((s) => ({ disk: addAt(s.disk, path, folder(name)) }))
        return ok('Pasta criada.')
      },

      rename: (path, from, to) => {
        const limpo = to.trim()
        if (!limpo) return no('O nome não pode ficar vazio.')
        const irmaos = listAt(get().disk, path) ?? []
        if (irmaos.some((n) => n.name === limpo && n.name !== from)) {
          return no(`Já existe "${limpo}" nesta pasta.`)
        }
        set((s) => ({ disk: renameAt(s.disk, path, from, limpo) }))
        return ok(`Renomeado para "${limpo}".`)
      },

      move: (from, name, to) => {
        const alvo = nodeAt(get().disk, [...from, name])
        if (!alvo) return no('Item não encontrado.')
        if (from.join('\\') === to.join('\\')) return no('Já está nesta pasta.')
        // Mover uma pasta para dentro dela mesma quebraria a arvore.
        const origemCompleta = [...from, name]
        if (alvo.type === 'folder' &&
            to.slice(0, origemCompleta.length).join('\\') === origemCompleta.join('\\')) {
          return no('Não dá para mover uma pasta para dentro dela mesma.')
        }

        set((s) => ({ disk: addAt(removeAt(s.disk, from, name), to, alvo) }))
        return ok(`"${name}" movido.`)
      },

      /**
       * Sobrescreve os registros mais antigos - sao os que ja foram
       * correlacionados. Apaga do log ate esgotar o poder do programa, e o
       * rastro cai junto: o log e a leitura do rastro, nao um enfeite.
       */
      cleanLogs: () => {
        const poder = cleanPower(get().skills)
        if (!poder) return no('Você não tem o programa de Faxina. Compre no darkmarket.vc.')

        const antes = get().player.heat
        let restante = poder
        const trail = [...get().trail]
        let apagadas = 0
        while (trail.length > 0 && restante > 0) {
          restante -= trail[0].heat
          trail.shift()
          apagadas++
        }

        set((s) => ({
          trail,
          player: { ...s.player, heat: Math.max(0, s.player.heat - poder) },
        }))
        get().mark('clean')
        return ok(`${apagadas} registro(s) sobrescrito(s): rastro ` +
                  `${antes.toFixed(0)}% → ${get().player.heat.toFixed(0)}%.`)
      },

      // ------------------------------------------------------------------
      // Navegador / banco
      // ------------------------------------------------------------------
      /**
       * O banco valida contra os registros DELE, nao contra o que voce coletou.
       * Assim, apagar o bilhete tira o preenchimento automatico mas nao muda a
       * senha do correntista: quem anotou num papel ainda consegue entrar.
       */
      login: (site, user, pass) => {
        if (site !== 'vbank.vc') return no('Site desconhecido.')
        const acc = get().accounts?.[user]
        if (!acc || acc.pass !== pass) return no('Usuário ou senha inválidos.')
        get().addHeat(HEAT.login, `autenticação em ${site} como ${user}`)
        get().mark('login')
        set((s) => ({ sessions: { ...s.sessions, [site]: user } }))
        return ok(`Bem-vindo, ${acc.holder}.`)
      },

      logout: (site) => set((s) => {
        const next = { ...s.sessions }
        delete next[site]
        return { sessions: next }
      }),

      transfer: (fromUser, toAccount, amount) => {
        const acc = get().accounts?.[fromUser]
        if (!acc) return no('Conta de origem inválida.')
        if (get().drained.includes(fromUser)) return no('Esta conta já foi zerada.')
        if (toAccount.trim() !== get().player.muleAccount) {
          return no('Conta de destino não encontrada.')
        }
        if (!Number.isFinite(amount) || amount <= 0) return no('Valor inválido.')
        if (amount > acc.balance) return no('Saldo insuficiente na conta de origem.')

        // Transferir e a acao mais barulhenta do jogo, e o custo e proporcional
        // a fatia levada: raspar a conta custa o triplo de levar um terco.
        get().addHeat(HEAT.transfer * (amount / acc.balance),
                      `TED de ${acc.number} para ${toAccount}: ${amount} VC`)
        get().mark('transfer')
        set((s) => ({
          player: {
            ...s.player,
            balance: s.player.balance + amount,
            xp: s.player.xp + Math.floor(amount / 100),
          },
          drained: amount >= acc.balance ? [...s.drained, fromUser] : s.drained,
        }))
        return ok(`Transferência de ${amount} VC concluída.`)
      },

      // ------------------------------------------------------------------
      // Modo desenvolvedor
      // ------------------------------------------------------------------
      setDevMode: (on) => set((s) => ({
        devMode: on,
        devUsed: s.devUsed || on,
      })),

      devSetBalance: (vc) => set((s) => (s.devMode
        ? { player: { ...s.player, balance: Math.max(0, Math.round(vc)) } }
        : s)),

      devSetHeat: (heat) => set((s) => {
        if (!s.devMode) return s
        const valor = Math.min(100, Math.max(0, heat))
        return {
          player: { ...s.player, heat: valor },
          // Baixar o rastro no dev tem que tirar da tela azul tambem.
          busted: valor >= 100,
        }
      }),

      devSetLevel: (branch, level) => set((s) => {
        if (!s.devMode) return s
        const alvo = Math.min(MAX_LEVEL, Math.max(0, level))
        const outros = s.skills.filter((id) => SKILL_BY_ID[id]?.branch !== branch)
        const novos = skillsOf(branch)
          .filter((sk) => sk.level <= alvo)
          .map((sk) => sk.id)
        return { skills: [...outros, ...novos] }
      }),

      devSpawn: (tier, quantos = 1) => {
        if (!get().devMode) return
        const usados = new Set(Object.keys(get().accounts))
        const maquinas: Machine[] = []
        const contas: Record<string, BankAccount> = {}
        let proximo = get().nextMachine

        for (let i = 0; i < quantos; i++) {
          const { machine, account } = gerarAlvo(
            Math.min(10, Math.max(1, tier)), `m${proximo++}`, usados)
          maquinas.push({ ...machine, found: true })
          if (account) {
            contas[account.user] = account
            usados.add(account.user)
          }
        }

        set((s) => ({
          machines: [...s.machines, ...maquinas],
          accounts: { ...s.accounts, ...contas },
          nextMachine: proximo,
        }))
      },

      devOpenAll: () => set((s) => (s.devMode ? {
        machines: s.machines.map((m) => ({
          ...m, found: true, probed: true, exploited: true,
          root: destrancarTudo(m.root),
        })),
      } : s)),

      devAdvance: (minutes) => {
        if (!get().devMode) return
        get().tick(minutes)
      },

      reset: () => set(initialState()),
    }),
    {
      name: 'scanss-evasion-save',
      // ATENCAO: subir sempre que o formato de GameState mudar.
      version: 5,
      storage: saveStorage,
      // Acoes nao vao pro localStorage - so o estado.
      partialize: (s): GameState => ({
        player: s.player,
        skills: s.skills,
        machines: s.machines,
        connectedId: s.connectedId,
        disk: s.disk,
        accounts: s.accounts,
        nextMachine: s.nextMachine,
        credentials: s.credentials,
        sessions: s.sessions,
        hasSave: s.hasSave,
        // `started`, `prologue` e `paused` NAO sao salvos de proposito: abrir a
        // url cai sempre no menu, o prologo e de uma vez so, e jogo salvo
        // pausado nao faz sentido.
        started: false,
        prologue: false,
        paused: false,
        inbox: s.inbox,
        objetivo: s.objetivo,
        attacks: s.attacks,
        drained: s.drained,
        trail: s.trail,
        milestones: s.milestones,
        assistantSeen: s.assistantSeen,
        busted: s.busted,
        minutes: s.minutes,
        devMode: s.devMode,
        devUsed: s.devUsed,
      }),
      // Formatos antigos nao tem migracao honesta: comeca de novo.
      migrate: () => initialState(),

      /**
       * Ultima linha de defesa: se o save carregado estiver incoerente (por
       * exemplo, salvo por uma versao anterior sem `accounts`), descarta e
       * comeca uma partida nova em vez de deixar o jogador com um banco que
       * recusa a senha certa.
       */
      merge: (persisted, current) => {
        const salvo = persisted as Partial<GameState> | undefined
        return saveConsistente(salvo)
          ? { ...current, ...salvo }
          : { ...current, ...initialState() }
      },
    },
  ),
)
