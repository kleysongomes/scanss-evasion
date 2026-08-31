/**
 * NetRipper - a suite de invasao.
 *
 * Cada programa que voce possui e um MODULO: clicar no nome abre o painel dele,
 * com as acoes e o retorno ali dentro. E mais parecido com um software de
 * verdade do que uma barra de botoes soltos - e resolve a duvida de "comprei,
 * e agora?", porque o lugar de usar cada coisa e o proprio item do menu.
 */

import { useEffect, useRef, useState } from 'react'
import {
  BRANCHES, cleanPower, heatFactor, levelOf, nextSkill, skillsOf,
} from '@/game/skills'
import { clockOf, heatColor, useGame, type Result } from '@/game/store'
import type { Branch, Machine, VFile } from '@/game/types'
import { launchApp } from '@/os/launch'
import { getDragFile } from './dnd'

const ICONE: Record<Machine['kind'], string> = {
  home: '🏠', office: '🏢', corp: '🏭',
}

const TIPO: Record<Machine['kind'], string> = {
  home: 'residencial', office: 'escritório', corp: 'corporativa',
}

interface Op { label: string; pct: number }

/** Roda uma acao com barra de progresso e escreve o resultado no log. */
type Operar = (label: string, ms: number, acao: () => Result | string) => void

interface ModuloProps {
  sel: string | null
  setSel: (id: string | null) => void
  op: Op | null
  operar: Operar
  escrever: (texto: string) => void
}

// ---------------------------------------------------------------------------

export function NetRipper() {
  const game = useGame()
  const [modulo, setModulo] = useState<Branch>('scanner')
  const [sel, setSel] = useState<string | null>(null)
  const [op, setOp] = useState<Op | null>(null)
  const [log, setLog] = useState<string[]>([
    'NetRipper 2.1 — pronto.',
    'Escolha um módulo à esquerda para começar.',
  ])
  const timer = useRef<number | null>(null)
  const fimDoLog = useRef<HTMLDivElement>(null)

  useEffect(() => { fimDoLog.current?.scrollIntoView({ block: 'end' }) }, [log])

  // Uma operacao em andamento nao pode sobreviver ao fechamento da janela.
  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  function escrever(texto: string) {
    setLog((l) => [...l.slice(-60), `[${clockOf(game.minutes)}] ${texto}`])
  }

  const operar: Operar = (label, ms, acao) => {
    if (op) return
    setOp({ label, pct: 0 })
    escrever(`${label}...`)

    const inicio = Date.now()
    timer.current = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - inicio) / ms) * 100)
      setOp({ label, pct })
      if (pct < 100) return

      if (timer.current) clearInterval(timer.current)
      timer.current = null
      setOp(null)

      const r = acao()
      if (typeof r === 'string') escrever(r)
      else escrever(`${r.ok ? '✔' : '✖'} ${r.message}`)
    }, 40)
  }

  const props: ModuloProps = { sel, setSel, op, operar, escrever }
  const nivel = levelOf(game.skills, modulo)

  return (
    <div className="grow col" style={{ gap: 3 }}>
      <div className="row netripper-bar">
        <span className="grow">
          <b>NetRipper 2.1</b>
          <span className="muted"> — suíte de invasão</span>
        </span>
        <span>{game.player.balance.toLocaleString('pt-BR')} VC</span>
        <span>·</span>
        <span>
          rastro{' '}
          <b style={{ color: heatColor(game.player.heat) }}>
            {game.player.heat.toFixed(0)}%
          </b>
        </span>
      </div>

      <div className="row grow" style={{ alignItems: 'stretch', gap: 3 }}>
        {/* menu de módulos */}
        <div className="sunken col modulos">
          <div className="netripper-titulo">Módulos</div>
          {BRANCHES.map((b) => {
            const n = levelOf(game.skills, b.id)
            return (
              <button
                key={b.id}
                className={`modulo-item${modulo === b.id ? ' ativo' : ''}` +
                           `${n === 0 ? ' vazio' : ''}`}
                onClick={() => setModulo(b.id)}
                title={b.role}
              >
                <span className="ic">{b.icon}</span>
                <span className="info">
                  <span className="nome">{b.name}</span>
                  <span className="niveis">
                    {Array.from({ length: skillsOf(b.id).length }, (_, i) => (
                      <span key={i} className={i < n ? 'on' : 'off'} />
                    ))}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {/* painel do módulo aberto */}
        <div className="col grow" style={{ gap: 3 }}>
          <div className="sunken grow scroll modulo-painel">
            {nivel === 0
              ? <NaoInstalado branch={modulo} />
              : modulo === 'scanner' ? <Rastreador {...props} />
              : modulo === 'breaker' ? <Intrusao {...props} />
              : modulo === 'crypto' ? <Decodificador {...props} />
              : modulo === 'cleaner' ? <Faxina {...props} />
              : <Anonimato />}
          </div>

          {op && (
            <div className="netripper-progresso">
              <div className="rotulo">{op.label}…</div>
              <div className="trilha">
                <div className="preenchido" style={{ width: `${op.pct}%` }} />
              </div>
            </div>
          )}

          <div className="netripper-log scroll">
            {log.map((l, i) => <div key={i}>{l}</div>)}
            <div ref={fimDoLog} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function NaoInstalado({ branch }: { branch: Branch }) {
  const game = useGame()
  const info = BRANCHES.find((b) => b.id === branch)!
  const proximo = nextSkill(game.skills, branch)

  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h3 style={{ margin: '0 0 6px', color: '#0046d5' }}>{info.name}</h3>
      <p className="muted" style={{ maxWidth: 340, margin: '0 auto 14px',
                                    lineHeight: 1.6 }}>
        {info.role}
      </p>
      <div className="manual-nota" style={{ maxWidth: 360, margin: '0 auto 14px',
                                            textAlign: 'left' }}>
        Você ainda não tem este programa.
        {proximo && <> O nível 1 custa <b>{proximo.price.toLocaleString('pt-BR')} VC</b>.</>}
      </div>
      <button className="xp"
              onClick={() => launchApp('browser', { args: { url: 'darkmarket.vc' } })}>
        Abrir o darkmarket
      </button>
    </div>
  )
}

// --------------------------------------------------------------------- 📡 ---

function Rastreador({ sel, setSel, op, operar }: ModuloProps) {
  const game = useGame()
  const achados = game.machines.filter((m) => m.found)
  const nivel = game.level('scanner')
  const capacidade = 4 + nivel * 2

  function varrer() {
    operar('Varrendo faixas de rede', 1400, () => {
      const r = game.scan()
      const partes = [`${r.visiveis} host(s) na lista`]
      partes.push(r.novos > 0 ? `${r.novos} novo(s)` : 'nenhum host novo')
      if (r.lotado) partes.push('lista cheia')
      return `✔ Varredura concluída: ${partes.join(' · ')}.`
    })
  }

  return (
    <>
      <Cabecalho titulo="Rastreador"
                 sub={`nível ${nivel} · alcança alvos até o andar ${nivel}`} />

      <div className="row" style={{ marginBottom: 10 }}>
        <button className="xp" disabled={!!op} onClick={varrer}>
          Varrer rede
        </button>
        <span className="muted grow">
          {achados.length} de {capacidade} vagas ocupadas
          {achados.length >= capacidade &&
            ' — esqueça hosts esvaziados ou suba o Rastreador'}
        </span>
      </div>

      {achados.length === 0 ? (
        <div className="muted" style={{ padding: 12, lineHeight: 1.6 }}>
          Nenhum host encontrado ainda. A varredura procura máquinas ligadas na
          sua faixa de rede — e traz alvos novos toda vez, então nunca fica sem
          o que fazer.
        </div>
      ) : (
        <ListaHosts hosts={achados} sel={sel} setSel={setSel}
                    ocupado={!!op} comEsquecer />
      )}

      <div className="muted" style={{ marginTop: 10, lineHeight: 1.5 }}>
        Clique num host para selecioná-lo, depois abra o módulo
        <b> Intrusão</b> para agir sobre ele.
      </div>
    </>
  )
}

// --------------------------------------------------------------------- 🔨 ---

function Intrusao({ sel, setSel, op, operar }: ModuloProps) {
  const game = useGame()
  const achados = game.machines.filter((m) => m.found)
  const alvo = achados.find((m) => m.id === sel) ?? null
  const nivel = game.level('breaker')
  const ocupado = !!op

  return (
    <>
      <Cabecalho titulo="Intrusão"
                 sub={`nível ${nivel} · abre alvos de dificuldade até ${nivel}`} />

      {achados.length === 0 ? (
        <div className="muted" style={{ padding: 12, lineHeight: 1.6 }}>
          Nenhum host encontrado. Use o módulo <b>Rastreador</b> primeiro.
        </div>
      ) : (
        <>
          <ListaHosts hosts={achados} sel={sel} setSel={setSel} ocupado={ocupado} />

          {alvo
            ? <Alvo m={alvo} ocupado={ocupado} operar={operar} nivel={nivel} />
            : <div className="muted" style={{ padding: 12, lineHeight: 1.6 }}>
                Escolha um host na lista acima para ver as portas e agir sobre ele.
              </div>}
        </>
      )}
    </>
  )
}

function Alvo({ m, ocupado, operar, nivel }: {
  m: Machine; ocupado: boolean; operar: Operar; nivel: number
}) {
  const game = useGame()
  const conectado = game.connectedId === m.id
  const pode = nivel >= m.requiredBreaker

  return (
    <>
      <fieldset className="xp">
        <legend>{m.hostname}</legend>
        <table className="netripper-tabela">
          <tbody>
            <tr><td>Proprietário</td><td>{m.owner}</td></tr>
            <tr><td>Tipo</td><td>{TIPO[m.kind]} · andar {m.tier}</td></tr>
            <tr>
              <td>Segurança</td>
              <td>
                <span className="barra-seg">
                  <span style={{ width: `${m.security * 10}%` }} />
                </span>
                {m.security}/10
              </td>
            </tr>
            <tr>
              <td>Porta aberta</td>
              <td>{m.probed
                ? <span className="mono">{m.port}/{m.service}</span>
                : <span className="muted">— analise para descobrir —</span>}</td>
            </tr>
            <tr>
              <td>Exige</td>
              <td>
                nível <b>{m.requiredBreaker}</b>{' '}
                {pode ? <span style={{ color: '#087' }}>✔ você tem</span>
                      : <span style={{ color: '#c00' }}>✖ você está no {nivel}</span>}
              </td>
            </tr>
          </tbody>
        </table>
      </fieldset>

      <fieldset className="xp">
        <legend>Ações</legend>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <button className="xp" disabled={ocupado || m.probed}
                  onClick={() => operar(`Analisando ${m.ip}`, 900,
                                        () => game.probe(m.id))}>
            Analisar
          </button>
          <button className="xp"
                  disabled={ocupado || !m.probed || m.exploited || !pode}
                  onClick={() => operar(`Invadindo ${m.hostname}`,
                                        1200 + m.security * 260,
                                        () => game.exploit(m.id))}>
            Invadir
          </button>
          {conectado ? (
            <button className="xp" disabled={ocupado}
                    onClick={() => game.disconnect()}>
              Desconectar
            </button>
          ) : (
            <button className="xp" disabled={ocupado || !m.exploited}
                    onClick={() => operar(`Montando ${m.hostname}`, 700,
                                          () => game.connect(m.id))}>
              Conectar
            </button>
          )}
          {conectado && (
            <button className="xp" onClick={() => launchApp('explorer')}>
              Abrir arquivos
            </button>
          )}
        </div>

        <div className="muted" style={{ marginTop: 8, lineHeight: 1.5 }}>
          {!m.probed && 'Comece analisando: sem isso você não sabe por onde entrar.'}
          {m.probed && !m.exploited && pode &&
            'Porta mapeada. Invadir custa rastro proporcional à segurança.'}
          {m.probed && !m.exploited && !pode &&
            `Exige Intrusão nível ${m.requiredBreaker}. Atualize no darkmarket.vc.`}
          {m.exploited && !conectado &&
            'Comprometida. Conecte para montar o disco na unidade Z:.'}
          {conectado && 'Disco montado. Os arquivos estão no Meu Computador (Z:).'}
        </div>
      </fieldset>
    </>
  )
}

// --------------------------------------------------------------------- 🔓 ---

function Decodificador({ op, operar, escrever }: ModuloProps) {
  const game = useGame()
  const nivel = game.level('crypto')
  const conectada = game.connected()
  const [sobre, setSobre] = useState(false)

  /** Arquivos trancados da máquina montada, com o caminho da pasta. */
  const trancados: { path: string[]; file: VFile }[] = []
  if (conectada) {
    const varrer = (nodes: typeof conectada.root, path: string[]) => {
      for (const n of nodes) {
        if (n.type === 'folder') varrer(n.children, [...path, n.name])
        else if (n.locked > 0) trancados.push({ path, file: n })
      }
    }
    varrer(conectada.root, [])
  }

  /** Quebra o cadeado e, se der certo, ja traz o arquivo. */
  function decodificar(path: string[], name: string, locked: number) {
    if (locked > nivel) {
      escrever(`✖ ${name}: cadeado nível ${locked}, seu Decodificador é ${nivel}.`)
      return
    }
    operar(`Quebrando ${name}`, 800 + locked * 400, () => {
      const r = game.crack(path, name)
      if (!r.ok) return r
      const d = game.download(path, name)
      return d.ok
        ? { ok: true, message: `${name} decodificado e baixado.` }
        : { ok: true, message: `${name} decodificado. ${d.message}` }
    })
  }

  return (
    <>
      <Cabecalho titulo="Decodificador"
                 sub={`nível ${nivel} · abre cadeados até o nível ${nivel}`} />

      <fieldset className="xp">
        <legend>Entrada</legend>
        <div
          className={`dropzone${sobre ? ' sobre' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setSobre(true) }}
          onDragLeave={() => setSobre(false)}
          onDrop={(e) => {
            e.preventDefault()
            setSobre(false)
            const f = getDragFile(e)
            if (!f) return escrever('✖ Isso não é um arquivo da unidade Z:.')
            if (!f.locked) return escrever(`${f.name} não está trancado — baixe direto.`)
            decodificar(f.path, f.name, f.locked)
          }}
        >
          <div className="miolo">
            <div style={{ fontSize: 26 }}>{sobre ? '🔓' : '🔒'}</div>
            <div style={{ marginTop: 5 }}>
              <b>Arraste um arquivo trancado aqui</b>
            </div>
            <div className="muted" style={{ marginTop: 2 }}>
              da unidade Z: no Meu Computador — ele é aberto e baixado de uma vez
            </div>
          </div>
        </div>
      </fieldset>

      {!conectada ? (
        <div className="muted" style={{ padding: 12, lineHeight: 1.6 }}>
          Nenhuma máquina montada. Invada e conecte pelo módulo <b>Intrusão</b>
          {' '}para ver os arquivos trancados dela aqui.
        </div>
      ) : trancados.length === 0 ? (
        <div className="muted" style={{ padding: 12 }}>
          Nada trancado em <b>{conectada.hostname}</b>.
        </div>
      ) : (
        <fieldset className="xp">
          <legend>Trancados em {conectada.hostname}</legend>
          <table className="netripper-lista">
            <thead>
              <tr>
                <th>Arquivo</th>
                <th style={{ width: 132 }}>Pasta</th>
                <th style={{ width: 56 }}>Cadeado</th>
                <th style={{ width: 96 }} />
              </tr>
            </thead>
            <tbody>
              {trancados.map(({ path, file }) => {
                const consegue = file.locked <= nivel
                return (
                  <tr key={path.join('/') + file.name}>
                    <td>🔒 {file.name}</td>
                    <td className="muted mono">{path.join('\\') || '(raiz)'}</td>
                    <td style={{ color: consegue ? '#087' : '#c00' }}>
                      nível {file.locked}
                    </td>
                    <td>
                      <button className="xp narrow" disabled={!!op || !consegue}
                              title={consegue ? 'Quebrar e baixar'
                                              : `Precisa do nível ${file.locked}`}
                              onClick={() => decodificar(path, file.name, file.locked)}>
                        Decodificar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </fieldset>
      )}
    </>
  )
}

// --------------------------------------------------------------------- 🧹 ---

function Faxina({ op, operar }: ModuloProps) {
  const game = useGame()
  const nivel = game.level('cleaner')
  const poder = cleanPower(game.skills)
  const heat = game.player.heat

  // O log e o registro real do que voce fez, guardado no estado. Ele so muda
  // quando voce age ou quando limpa - nunca sozinho.
  const registros = game.trail

  return (
    <>
      <Cabecalho titulo="Faxina"
                 sub={`nível ${nivel} · apaga ${poder} pontos de rastro por uso`} />

      <div className="row" style={{ marginBottom: 10 }}>
        <button className="xp" disabled={!!op || registros.length === 0}
                onClick={() => operar('Sobrescrevendo logs', 1100,
                                      () => game.cleanLogs())}>
          Limpar registros (−{poder})
        </button>
        <span className="grow" />
        <span>
          rastro atual{' '}
          <b style={{ color: heatColor(heat) }}>{heat.toFixed(0)}%</b>
        </span>
      </div>

      <fieldset className="xp">
        <legend>
          Registros que apontam para você ({registros.length})
        </legend>

        <div className="faxina-logs">
          {registros.length === 0
            ? <div style={{ opacity: .6 }}>
                nenhum registro — o ScanSS não tem o que correlacionar
              </div>
            : registros.map((r, i) => (
                <div key={i}>
                  {clockOf(r.at)}{'  '}
                  <span style={{ color: '#e8c07a' }}>
                    +{r.heat.toFixed(1).padStart(4)}
                  </span>
                  {'  '}{r.text}
                </div>
              ))}
        </div>

        <div className="muted" style={{ marginTop: 8, lineHeight: 1.5 }}>
          Cada linha é uma ação sua que ficou gravada, com o rastro que ela
          gerou. Limpar sobrescreve as <b>mais antigas</b> — que são justamente
          as que já foram correlacionadas — até esgotar o poder do programa.
        </div>
      </fieldset>

      {heat > 0 && registros.length === 0 && (
        <div className="manual-nota">
          Ainda resta rastro sem registro correspondente: ele vem da
          <b> evidência guardada no seu disco</b>, que o ScanSS relê o tempo
          todo. Limpar log não resolve isso — apague ou venda os arquivos no
          Meu Computador.
        </div>
      )}
    </>
  )
}

// --------------------------------------------------------------------- 🛰️ ---

const PAISES = ['🇧🇷 São Paulo', '🇺🇾 Montevidéu', '🇮🇸 Reiquiavique',
                '🇷🇴 Bucareste', '🇵🇦 Cidade do Panamá', '🇸🇨 Vitória',
                '🇳🇱 Amsterdã', '🇸🇬 Singapura', '🇲🇩 Chisinau', '🇭🇰 Hong Kong']

function Anonimato() {
  const game = useGame()
  const nivel = game.level('ghost')
  const reducao = Math.round((1 - heatFactor(game.skills)) * 100)
  const saltos = PAISES.slice(0, Math.max(1, nivel))

  return (
    <>
      <Cabecalho titulo="Anonimato"
                 sub={`nível ${nivel} · reduz ${reducao}% de todo rastro gerado`} />

      <div className="vpn-status">
        <span className="luz" />
        <div>
          <b>CONEXÃO ANÔNIMA ATIVA</b>
          <div className="muted">
            {saltos.length} salto(s) entre você e o alvo · rota reembaralhada a
            cada sessão
          </div>
        </div>
        <span className="grow" />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#2a8a2a' }}>
            −{reducao}%
          </div>
          <div className="muted">rastro gerado</div>
        </div>
      </div>

      <div style={{ fontWeight: 'bold', color: '#14396b', margin: '12px 0 6px' }}>
        Rota atual
      </div>
      <div className="vpn-rota">
        <div className="salto voce">
          <span className="bolha">🖥️</span>
          <span>você</span>
        </div>
        {saltos.map((p, i) => (
          <div key={p} className="salto">
            <span className="bolha">{i + 1}</span>
            <span>{p}</span>
          </div>
        ))}
        <div className="salto alvo">
          <span className="bolha">🎯</span>
          <span>alvo</span>
        </div>
      </div>

      <div className="muted" style={{ marginTop: 12, lineHeight: 1.5 }}>
        Este módulo não tem botão porque não precisa: ele age sozinho em
        <b> tudo</b> que você faz, o tempo todo. Cada nível acrescenta um salto
        e reduz mais o rastro — é o único upgrade que melhora todas as outras
        ações de uma vez.
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------

/**
 * Cabecalho de modulo. Sem icone: o item aceso no menu da esquerda ja diz onde
 * voce esta, e enfeitar cabecalho com emoji foge do visual do XP.
 */
function Cabecalho({ titulo, sub }: { titulo: string; sub: string }) {
  return (
    <div className="modulo-cabecalho">
      <div className="titulo">{titulo}</div>
      <div className="muted">{sub}</div>
    </div>
  )
}

/** A mesma lista nos dois modulos: achar e atacar olham para o mesmo lugar. */
function ListaHosts({ hosts, sel, setSel, ocupado, comEsquecer }: {
  hosts: Machine[]
  sel: string | null
  setSel: (id: string | null) => void
  ocupado: boolean
  comEsquecer?: boolean
}) {
  const game = useGame()
  return (
    <table className="netripper-lista">
      <thead>
        <tr>
          <th style={{ width: 22 }} />
          <th>Host</th>
          <th style={{ width: 96 }}>IP</th>
          <th style={{ width: 44 }}>Andar</th>
          <th style={{ width: 84 }}>Estado</th>
          {comEsquecer && <th style={{ width: 66 }} />}
        </tr>
      </thead>
      <tbody>
        {hosts.map((m) => (
          <tr key={m.id} className={m.id === sel ? 'sel' : ''}
              onClick={() => setSel(m.id)}>
            <td>{ICONE[m.kind]}</td>
            <td>
              <b>{m.hostname}</b>
              <div className="muted">{m.owner}</div>
            </td>
            <td className="mono">{m.ip}</td>
            <td>{m.tier}</td>
            <td><Estado m={m} conectado={game.connectedId === m.id} /></td>
            {comEsquecer && (
              <td>
                <button className="xp narrow" disabled={ocupado}
                        title="Tira o host da lista e abre vaga"
                        onClick={(e) => { e.stopPropagation(); game.forget(m.id) }}>
                  Remover
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Estado({ m, conectado }: { m: Machine; conectado: boolean }) {
  if (conectado) return <span className="badge conectado">Z:</span>
  if (m.exploited) return <span className="badge aberto">aberto</span>
  if (m.probed) return <span className="badge visto">visto</span>
  return <span className="badge novo">novo</span>
}
