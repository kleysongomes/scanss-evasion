/**
 * Gerador procedural de alvos.
 *
 * Cada varredura pode trazer maquinas novas, entao o jogador nunca fica sem o
 * que fazer - antes, com dois alvos fixos, esvaziar os dois obrigava a comprar
 * upgrade para o jogo continuar.
 *
 * O loot e sorteado com peso: a maioria dos alvos rende pouco, alguns rendem
 * bem e uma minoria e um bilhete premiado. Tem alvo que nao rende nada, e isso
 * e proposital: varredura sem garantia e o que faz a boa achada valer algo.
 */

import {
  APELIDOS_PC, EMPRESAS, IMAGENS, MUSICAS, NOMES, NOMES_SENHAS,
  PALAVRAS_SENHA, PASTAS_CORPORATIVAS, PASTAS_PESSOAIS, SISTEMA, TEXTOS,
  VALIOSOS,
} from './content'
import { folder } from './fs'
import { around, chance, int, pick, sample, weighted } from './rng'
import type {
  BankAccount, FileKind, Machine, MachineKind, VFile, VNode,
} from './types'

/**
 * Quanto uma conta daquele andar costuma ter.
 *
 * O expoente e o que faz o jogo ter progressao: andar 1 rende algumas centenas
 * (nao paga upgrade nenhum sozinho), andar 10 rende dezenas de milhares.
 */
function saldoDoTier(tier: number): number {
  return around(140 * Math.pow(tier, 2.1), 0.45)
}

/** Quanto um documento valioso daquele andar vale. */
function valorDoTier(tier: number): number {
  return around(70 * Math.pow(tier, 1.9), 0.5)
}

const arquivo = (name: string, kind: FileKind, size: number,
                 content: string, extra: Partial<VFile> = {}): VFile => ({
  type: 'file', name, kind, size, locked: 0, content, ...extra,
})

/** Senha de 2003: palavra + números, fraca como eram. */
function senhaAleatoria(): string {
  const p = pick(PALAVRAS_SENHA)
  const estilo = weighted([
    ['ano', 40], ['numero', 30], ['maiuscula', 20], ['simbolo', 10],
  ] as const)
  switch (estilo) {
    case 'ano': return `${p}${int(1970, 2003)}`
    case 'numero': return `${p}${int(1, 999)}`
    case 'maiuscula': return `${p[0].toUpperCase()}${p.slice(1)}${int(10, 99)}`
    default: return `${p}@${int(10, 99)}`
  }
}

/** Usuario do banco a partir do nome do dono, sem acento. */
function usuarioDe(nome: string, usados: Set<string>): string {
  const partes = nome.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // tira os acentos combinantes
    .replace(/[^a-z\s]/g, '')          // e qualquer sobra fora do ASCII
    .split(/\s+/)
    .filter(Boolean)
  let base = `${partes[0][0]}.${partes[partes.length - 1]}`
  let n = 2
  while (usados.has(base)) base = `${partes[0][0]}.${partes[partes.length - 1]}${n++}`
  return base
}

function conteudoDeSenhas(user: string, pass: string, owner: string): string {
  return `${'-'.repeat(34)}\n  NAO APAGAR\n${'-'.repeat(34)}\n\n` +
    `banco....: vbank.vc\nusuario..: ${user}\nsenha....: ${pass}\n\n` +
    `(anotado por ${owner})\n`
}

/** Enche uma pasta com coisa banal: texto, foto, música. */
function recheio(qtd: number): VNode[] {
  const saida: VNode[] = []
  for (let i = 0; i < qtd; i++) {
    const tipo = weighted([['texto', 45], ['imagem', 40], ['musica', 15]] as const)
    if (tipo === 'texto') {
      const [nome, corpo] = pick(TEXTOS)
      saida.push(arquivo(nome, 'text', corpo.length + 180, corpo))
    } else if (tipo === 'imagem') {
      const [nome, desc] = pick(IMAGENS)
      const kb = int(90, 340)
      saida.push(arquivo(nome, 'image', kb * 1024, `[imagem ${kb}KB]\n\n${desc}`,
        // Uma minoria de fotos rende trocado para quem vende.
        chance(0.18) ? { worth: int(15, 60) } : {}))
    } else {
      const [nome, desc] = pick(MUSICAS)
      saida.push(arquivo(nome, 'audio', 3_800_000,
                         `[áudio MP3, 128kbps]\n\n${desc}`))
    }
  }
  // Nomes repetidos na mesma pasta atrapalham a navegacao.
  return dedup(saida)
}

function dedup(nodes: VNode[]): VNode[] {
  const vistos = new Set<string>()
  return nodes.filter((n) => {
    if (vistos.has(n.name)) return false
    vistos.add(n.name)
    return true
  })
}

/**
 * As pastas de sistema. Tudo com nome do WinDoors, o sistema ficticio: nenhum
 * produto de verdade aparece dentro do jogo.
 */
const pastasDeSistema = (): VNode[] => [
  folder('WINDOORS', [
    folder('sistema32', sample(SISTEMA, 3).map(([n, d]) =>
      arquivo(n, 'system', 45_000, `[arquivo de sistema]\n\n${d}`))),
    folder('Temp', [arquivo('~df3a91.tmp', 'text', 900,
                            'Arquivo temporário. Lixo.\n')]),
  ]),
  folder('Arquivos de programas', [
    folder('Navegador', [
      arquivo('navega.exe', 'exe', 89_000, '[navegador do sistema]')]),
    folder('Correio', [
      arquivo('correio.exe', 'exe', 76_000, '[cliente de e-mail]')]),
  ]),
]

export interface AlvoGerado {
  machine: Machine
  /** Conta criada junto, se este alvo tiver um arquivo de senhas. */
  account: BankAccount | null
}

/**
 * Monta um alvo do andar pedido.
 *
 * `usados` evita usuario de banco repetido entre maquinas.
 */
export function gerarAlvo(tier: number, id: string,
                          usados: Set<string>): AlvoGerado {
  const kind: MachineKind = tier <= 2 ? 'home' : tier <= 5 ? 'office' : 'corp'
  const corporativo = kind !== 'home'

  const owner = corporativo && chance(0.75) ? pick(EMPRESAS) : pick(NOMES)
  const hostname = corporativo
    ? `${owner.split(' ')[0].toUpperCase().slice(0, 8)}-${pick(['SRV', 'FIN', 'BKP', 'ADM'])}${int(1, 9)}`
    : `${pick(APELIDOS_PC)}-${owner.split(' ')[0].toUpperCase()}`

  const ip = kind === 'home' ? `10.0.${int(1, 9)}.${int(2, 254)}`
    : kind === 'office' ? `10.0.${int(10, 40)}.${int(2, 254)}`
    : `172.16.${int(1, 30)}.${int(2, 254)}`

  // --- que tipo de achado este alvo guarda ---------------------------------
  const sorte = weighted([
    ['nada', 14],      // só arquivo pessoal: você gastou rastro à toa
    ['pouco', 38],
    ['medio', 32],
    ['bom', 13],
    ['premio', 3],
  ] as const)

  // --- conta de banco -----------------------------------------------------
  let account: BankAccount | null = null
  const temSenhas = sorte !== 'nada' && chance(sorte === 'pouco' ? 0.55 : 0.85)
  if (temSenhas) {
    const user = usuarioDe(owner, usados)
    usados.add(user)
    const multiplicador = { nada: 0, pouco: 0.5, medio: 1, bom: 1.8, premio: 3.4 }[sorte]
    account = {
      user,
      holder: owner,
      number: `${int(1000, 9999)}-${String(int(0, 9999)).padStart(4, '0')}`,
      balance: Math.max(60, Math.round(saldoDoTier(tier) * multiplicador)),
      pass: senhaAleatoria(),
    }
  }

  // --- arquivos que valem dinheiro ----------------------------------------
  const quantosValiosos = { nada: 0, pouco: int(0, 1), medio: int(1, 2),
                            bom: int(2, 3), premio: int(3, 4) }[sorte]
  const valiosos = sample(VALIOSOS, quantosValiosos).map(([nome, kind_, corpo]) =>
    arquivo(nome, kind_ as FileKind, int(40_000, 15_728_640), corpo, {
      worth: valorDoTier(tier),
      evidence: int(6, 10) + tier * 2,
      // Quanto mais alto o andar, mais provável estar trancado - e mais forte.
      locked: chance(0.35 + tier * 0.05) ? Math.min(10, int(1, tier)) : 0,
    }))

  // --- carteira solta de V-Coin -------------------------------------------
  const carteiras: VNode[] = chance(0.12) ? [
    arquivo('carteira.wallet', 'wallet', 2048,
            '[carteira de V-Coin]\n\nSaldo em créditos soltos.', {
      coins: Math.round(saldoDoTier(tier) * 0.35),
      evidence: 5,
      locked: chance(0.6) ? Math.min(10, int(1, tier)) : 0,
    }),
  ] : []

  // --- monta as pastas ----------------------------------------------------
  const nomesPastas = sample(
    corporativo ? PASTAS_CORPORATIVAS : PASTAS_PESSOAIS, int(2, 4))

  const pastas: VNode[] = nomesPastas.map((nome) => folder(nome, recheio(int(1, 4))))

  /** Guarda um arquivo numa pasta sorteada (ou na raiz, se nao houver). */
  const guardar = (f: VFile) => {
    if (pastas.length === 0) return
    const alvo = pick(pastas) as { children: VNode[] }
    alvo.children = dedup([...alvo.children, f])
  }

  if (account) {
    guardar(arquivo(pick(NOMES_SENHAS), 'creds', int(320, 480),
                    conteudoDeSenhas(account.user, account.pass, owner), {
      grants: { site: 'vbank.vc', user: account.user, pass: account.pass, owner },
      evidence: 8,
      // O tutorial (andar 1) nunca vem trancado: o jogador ainda não tem chave.
      locked: tier === 1 ? 0 : chance(0.45) ? Math.min(10, int(1, tier)) : 0,
    }))
  }
  valiosos.forEach(guardar)
  carteiras.forEach((c) => guardar(c as VFile))

  return {
    machine: {
      id,
      ip,
      hostname,
      owner,
      kind,
      tier,
      security: Math.min(10, tier + int(-1, 1)),
      visibility: tier,
      requiredBreaker: tier,
      port: kind === 'home' ? 445 : kind === 'office' ? 22 : 8080,
      service: kind === 'home' ? 'SMB' : kind === 'office' ? 'SSH' : 'HTTP-ADM',
      root: [...pastas, ...pastasDeSistema()],
      found: false,
      probed: false,
      exploited: false,
    },
    account,
  }
}

/**
 * Alvos com que a partida comeca: varios do andar 1, para o jogador ter o que
 * fazer sem depender de comprar nada.
 */
export function alvosIniciais(): { machines: Machine[]
                                   accounts: Record<string, BankAccount> } {
  const usados = new Set<string>()
  const machines: Machine[] = []
  const accounts: Record<string, BankAccount> = {}

  for (let i = 0; i < 5; i++) {
    const { machine, account } = gerarAlvo(1, `m${i + 1}`, usados)
    machines.push(machine)
    if (account) accounts[account.user] = account
  }

  // O primeiro alvo tem que render algo: e o tutorial. Insiste ate sair um
  // com arquivo de senhas, com teto para nunca virar laco infinito.
  for (let tentativa = 0; Object.keys(accounts).length === 0 && tentativa < 40;
       tentativa++) {
    const { machine, account } = gerarAlvo(1, 'm1', usados)
    if (account) {
      machines[0] = machine
      accounts[account.user] = account
    }
  }

  return { machines, accounts }
}
