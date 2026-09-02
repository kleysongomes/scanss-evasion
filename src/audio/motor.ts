/**
 * O motor de som: um oscilador e um envelope, e nada de arquivo.
 *
 * Todo som do jogo é SINTETIZADO na hora, com Web Audio. Três motivos, em
 * ordem de importância:
 *
 * 1. Som de sistema de verdade é marca registrada. O jogo inteiro se cuida
 *    para não usar nome nem cara de produto real, e sairia estranho quebrar
 *    isso justamente no "toc" de uma janela abrindo.
 * 2. Bipe sintetizado É o som da época. O que se ouvia num micro de 2003 saía
 *    de um oscilador barato, então a limitação aqui vira sotaque.
 * 3. Não pesa nada no download e funciona sem rede sem precisar de cache.
 *
 * Nada aqui estoura quando não existe Web Audio - nos testes, em navegador
 * antigo ou com o áudio bloqueado, as funções simplesmente não fazem nada.
 */

/** Nível de volume por categoria. */
export interface Mixagem {
  mudo: boolean
  musica: number
  efeitos: number
}

interface Barramentos {
  ctx: AudioContext
  mestre: GainNode
  musica: GainNode
  efeitos: GainNode
  /** Entrada da "sala": um eco curto que dá cauda aos sons. */
  sala: DelayNode
}

let barramentos: Barramentos | null = null
let mixagem: Mixagem = { mudo: false, musica: 0.35, efeitos: 0.7 }

function suportado(): boolean {
  return typeof window !== 'undefined' && typeof window.AudioContext === 'function'
}

/**
 * Liga o motor, criando o contexto de áudio na primeira vez.
 *
 * O navegador só deixa tocar som depois de um gesto da pessoa - por isso isto
 * é chamado do clique de "clique para iniciar", na abertura, e não na carga da
 * página. Chamar de novo depois é barato e serve para retomar um contexto que
 * o navegador suspendeu ao trocar de aba.
 */
export function destravar(): void {
  if (!suportado()) return

  if (!barramentos) {
    const ctx = new AudioContext()
    const mestre = ctx.createGain()
    const musica = ctx.createGain()
    const efeitos = ctx.createGain()
    musica.connect(mestre)
    efeitos.connect(mestre)
    mestre.connect(ctx.destination)

    /*
     * A sala.
     *
     * Um atraso curto realimentado, filtrado no agudo - um eco de quarto
     * pequeno, não de catedral. É o que mais separa "som de computador" de
     * "som de console": bipe seco, sem nenhuma cauda, é a assinatura do
     * videogame de 8 bits. Uma cauda de meio segundo põe o som numa mesa, num
     * quarto, com um gabinete zunindo do lado.
     */
    const sala = ctx.createDelay(0.5)
    sala.delayTime.value = 0.062
    const realimenta = ctx.createGain()
    realimenta.gain.value = 0.3
    const abafa = ctx.createBiquadFilter()
    abafa.type = 'lowpass'
    abafa.frequency.value = 2400
    sala.connect(abafa)
    abafa.connect(realimenta)
    realimenta.connect(sala)
    abafa.connect(efeitos)

    barramentos = { ctx, mestre, musica, efeitos, sala }
    aplicar(mixagem)
  }

  if (barramentos.ctx.state === 'suspended') void barramentos.ctx.resume()
}

/** O motor já foi ligado por um gesto? */
export const ligado = (): boolean => barramentos !== null

/** Aplica volumes. Guarda o valor mesmo antes de o motor existir. */
export function aplicar(nova: Mixagem): void {
  mixagem = nova
  if (!barramentos) return
  const { mestre, musica, efeitos, ctx } = barramentos
  const agora = ctx.currentTime
  // Rampa curta em vez de troca seca: mudar ganho de uma vez estala.
  mestre.gain.setTargetAtTime(nova.mudo ? 0 : 1, agora, 0.02)
  musica.gain.setTargetAtTime(nova.musica, agora, 0.05)
  efeitos.gain.setTargetAtTime(nova.efeitos, agora, 0.02)
}

/** O barramento de uma categoria, ou null se o motor está desligado. */
export function saida(canal: 'musica' | 'efeitos'): [AudioContext, GainNode] | null {
  if (!barramentos) return null
  return [barramentos.ctx, barramentos[canal]]
}

// ---------------------------------------------------------------------------
// Tijolos de síntese
// ---------------------------------------------------------------------------

export interface Nota {
  /** Frequência inicial, em hertz. */
  hz: number
  /** Para onde a frequência escorrega até o fim, se escorregar. */
  ate?: number
  tipo?: OscillatorType
  /** Duração em segundos. */
  dur?: number
  /** Pico do envelope, antes do volume da categoria. */
  ganho?: number
  /** Segundos até o pico. Curto demais estala; longo demais amolece. */
  ataque?: number
  /** Atraso, em segundos, para montar sequências. */
  quando?: number
  canal?: 'musica' | 'efeitos'
  /** Quanto do som vai para a sala, de 0 a 1. */
  sala?: number
}

/** Uma nota com envelope. É o tijolo de quase tudo. */
export function tom(nota: Nota): void {
  const barra = saida(nota.canal ?? 'efeitos')
  if (!barra) return
  const [ctx, destino] = barra

  const {
    hz, ate, tipo = 'square', dur = 0.12, ganho = 0.2,
    ataque = 0.005, quando = 0,
  } = nota

  const t = ctx.currentTime + quando
  const osc = ctx.createOscillator()
  const env = ctx.createGain()

  osc.type = tipo
  osc.frequency.setValueAtTime(hz, t)
  if (ate !== undefined) osc.frequency.exponentialRampToValueAtTime(
    Math.max(1, ate), t + dur)

  // Decaimento exponencial até quase zero: chegar a zero exato é proibido na
  // rampa exponencial, e cortar seco estala.
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(ganho, t + ataque)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)

  osc.connect(env)
  env.connect(destino)
  mandarParaSala(env, nota.sala)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

/** Manda uma cópia mais baixa do som para a sala. */
function mandarParaSala(origem: GainNode, quanto = 0): void {
  if (!barramentos || quanto <= 0) return
  const envio = barramentos.ctx.createGain()
  envio.gain.value = quanto
  origem.connect(envio)
  envio.connect(barramentos.sala)
}

/** Um chiado curto: clique de tecla, estática, disco rígido. */
export function ruido(
  { dur = 0.05, ganho = 0.15, corte = 3000, quando = 0, sala = 0 } = {},
): void {
  const barra = saida('efeitos')
  if (!barra) return
  const [ctx, destino] = barra

  const t = ctx.currentTime + quando
  const amostras = Math.max(1, Math.floor(ctx.sampleRate * dur))
  const buffer = ctx.createBuffer(1, amostras, ctx.sampleRate)
  const dados = buffer.getChannelData(0)
  for (let i = 0; i < amostras; i++) dados[i] = Math.random() * 2 - 1

  const fonte = ctx.createBufferSource()
  fonte.buffer = buffer

  // Sem filtro o chiado fica agudo e áspero; passa-baixa dá corpo de "toc".
  const filtro = ctx.createBiquadFilter()
  filtro.type = 'lowpass'
  filtro.frequency.setValueAtTime(corte, t)

  const env = ctx.createGain()
  env.gain.setValueAtTime(ganho, t)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)

  fonte.connect(filtro)
  filtro.connect(env)
  env.connect(destino)
  mandarParaSala(env, sala)
  fonte.start(t)
  fonte.stop(t + dur)
}
