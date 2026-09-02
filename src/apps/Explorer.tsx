/**
 * Meu Computador: o seu disco C: e o disco da maquina invadida (Z:).
 *
 * As duas unidades sao arvores de pastas. No C: voce ainda organiza (criar
 * pasta, renomear, mover, apagar) - e apagar importa, porque arquivo roubado
 * parado no seu disco gera rastro.
 */

import { useState } from 'react'
import { DOWNLOADS, evidenceHeatPerHour, useGame, type Result } from '@/game/store'
import { isFolder, listAt, pathLabel, totalEvidence } from '@/game/fs'
import type { FileKind, VNode, VPath } from '@/game/types'
import { useWindows } from '@/os/windows'
import { setDragFile } from './dnd'

const ICONE: Record<FileKind, string> = {
  text: '📄', doc: '📝', sheet: '📊', image: '🖼️', audio: '🎵',
  archive: '📦', creds: '🔑', wallet: '💰', exe: '⚙️', system: '🔧',
}

function human(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** Pastas primeiro, depois arquivos - como no Windows. */
function ordenar(nodes: VNode[]): VNode[] {
  return [...nodes].sort((a, b) => {
    if (isFolder(a) !== isFolder(b)) return isFolder(a) ? -1 : 1
    return a.name.localeCompare(b.name, 'pt-BR')
  })
}

export function Explorer() {
  const game = useGame()
  const abrir = useWindows((s) => s.open)
  const remota = game.connected()

  const [unidade, setUnidade] = useState<'C' | 'Z'>('C')
  const [caminhoC, setCaminhoC] = useState<VPath>([])
  const [caminhoZ, setCaminhoZ] = useState<VPath>([])
  const [sel, setSel] = useState<string | null>(null)
  const [renomeando, setRenomeando] = useState<string | null>(null)
  const [rascunho, setRascunho] = useState('')
  const [recortado, setRecortado] = useState<{ path: VPath; name: string } | null>(null)
  const [status, setStatus] = useState('')

  const noZ = unidade === 'Z' && !!remota
  const caminho = noZ ? caminhoZ : caminhoC
  const setCaminho = noZ ? setCaminhoZ : setCaminhoC
  const arvore = noZ ? remota!.root : game.disk

  const itens = ordenar(listAt(arvore, caminho) ?? [])
  const atual = itens.find((n) => n.name === sel) ?? null

  const evidencia = totalEvidence(game.disk)
  const rastroPorHora = evidenceHeatPerHour(game.disk)

  function irPara(p: VPath) {
    setCaminho(p)
    setSel(null)
    setRenomeando(null)
  }

  function trocarUnidade(u: 'C' | 'Z') {
    if (u === 'Z' && !remota) return
    setUnidade(u)
    setSel(null)
    setRenomeando(null)
  }

  function aplicar(r: Result) {
    setStatus(r.message)
    if (r.ok) setSel(null)
  }

  function abrirNode(n: VNode) {
    if (isFolder(n)) return irPara([...caminho, n.name])
    if (n.locked) {
      setStatus(`${n.name} está trancado (cadeado nível ${n.locked}).`)
      return
    }
    abrir('notepad', {
      title: `${n.name} — Bloco de Notas`,
      icon: '📄',
      size: { w: 500, h: 400 },
      args: { file: n },
    })
    game.reveal(n)
  }

  function confirmarNome() {
    if (renomeando) aplicar(game.rename(caminho, renomeando, rascunho))
    setRenomeando(null)
  }

  return (
    <div className="grow col" style={{ gap: 3 }}>
      {/* barra de endereco */}
      <div className="row" style={{ padding: '2px 3px' }}>
        <button className="xp narrow" title="Ir para a pasta acima"
                disabled={caminho.length === 0}
                onClick={() => irPara(caminho.slice(0, -1))}>
          Acima
        </button>
        <span>Endereço</span>
        <div className="sunken row grow" style={{ padding: '2px 5px', gap: 6 }}>
          <span>{noZ ? '📡' : '💾'}</span>
          <span className="grow mono">
            {noZ ? pathLabel(`Z:\\\\${remota!.hostname}`, caminho)
                 : pathLabel('C:', caminho)}
          </span>
        </div>
      </div>

      <div className="row grow" style={{ alignItems: 'stretch', gap: 3 }}>
        {/* unidades e detalhes */}
        <div className="sunken col" style={{ width: 176, flex: '0 0 176px',
                                             padding: 5, gap: 2, background: '#f7f7f0' }}>
          <div style={{ fontWeight: 'bold', color: '#0046d5', marginBottom: 3 }}>
            Unidades
          </div>
          <Unidade
            glifo="💾" rotulo="Disco local (C:)"
            sub={`${game.disk.length} item(ns) na raiz`}
            ativo={!noZ} onClick={() => trocarUnidade('C')}
          />
          <Unidade
            glifo="📡"
            rotulo={remota ? `${remota.hostname} (Z:)` : 'Disco remoto (Z:)'}
            sub={remota ? remota.ip : 'não conectado'}
            ativo={noZ} desabilitado={!remota} onClick={() => trocarUnidade('Z')}
          />

          {atual && (
            <fieldset className="xp" style={{ marginTop: 8 }}>
              <legend>Detalhes</legend>
              <div style={{ wordBreak: 'break-word', fontWeight: 'bold' }}>
                {atual.name}
              </div>
              {isFolder(atual) ? (
                <div className="muted">pasta · {atual.children.length} item(ns)</div>
              ) : (
                <>
                  <div className="muted">{human(atual.size)}</div>
                  {atual.locked
                    ? <div style={{ color: '#c60' }}>🔒 cadeado nível {atual.locked}</div>
                    : <div className="muted">aberto</div>}
                  {atual.worth ? <div style={{ color: '#087' }}>vale ~{atual.worth} VC</div> : null}
                  {atual.evidence
                    ? <div style={{ color: '#c00' }}>incrimina: {atual.evidence}</div>
                    : null}
                </>
              )}
            </fieldset>
          )}

          {!noZ && evidencia > 0 && (
            <fieldset className="xp" style={{ marginTop: 'auto' }}>
              <legend>Risco do disco</legend>
              <div>Evidência guardada: <b>{evidencia}</b></div>
              <div style={{ color: rastroPorHora > 12 ? '#c00' : '#666' }}>
                gerando +{rastroPorHora.toFixed(1)} de rastro por hora
              </div>
              <div className="muted" style={{ marginTop: 4, lineHeight: 1.4 }}>
                Venda ou apague o que já usou.
              </div>
            </fieldset>
          )}
        </div>

        {/* listagem */}
        <div className="sunken grow scroll" style={{ padding: 4 }}>
          {itens.length === 0 && (
            <div className="muted" style={{ padding: 10 }}>Esta pasta está vazia.</div>
          )}
          {itens.map((n) => (
            <div
              key={n.name}
              className={`explorer-item${sel === n.name ? ' sel' : ''}` +
                         `${recortado?.name === n.name ? ' recortado' : ''}`}
              onClick={() => { setSel(n.name); setRenomeando(null) }}
              onDoubleClick={() => abrirNode(n)}
              // Arquivo da máquina invadida pode ser arrastado para o
              // Decodificador do NetRipper, que abre e baixa de uma vez.
              draggable={noZ && !isFolder(n)}
              onDragStart={(e) => {
                if (!noZ || isFolder(n)) return
                setDragFile(e, { path: caminho, name: n.name, locked: n.locked })
                setStatus(`Arrastando ${n.name}… solte no Decodificador.`)
              }}
            >
              <span style={{ fontSize: 15 }}>
                {isFolder(n) ? '📁' : n.locked ? '🔒' : ICONE[n.kind]}
              </span>

              {renomeando === n.name ? (
                <input
                  className="xp grow"
                  autoFocus
                  value={rascunho}
                  onChange={(e) => setRascunho(e.target.value)}
                  onBlur={confirmarNome}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmarNome()
                    if (e.key === 'Escape') setRenomeando(null)
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="grow">{n.name}</span>
              )}

              <span style={{ opacity: .7 }}>
                {isFolder(n) ? `${n.children.length} item(ns)` : human(n.size)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* acoes */}
      <div className="row" style={{ padding: '0 3px 3px', flexWrap: 'wrap' }}>
        <button className="xp" disabled={!atual} onClick={() => atual && abrirNode(atual)}>
          Abrir
        </button>

        {noZ ? (
          <>
            <button className="xp"
                    disabled={!atual || isFolder(atual) || !!atual.locked}
                    onClick={() => atual && aplicar(game.download(caminho, atual.name))}>
              Baixar
            </button>
            <button className="xp"
                    disabled={!atual || isFolder(atual) || !atual.locked}
                    onClick={() => atual && aplicar(game.crack(caminho, atual.name))}>
              Quebrar cadeado
            </button>
          </>
        ) : (
          <>
            <button className="xp" onClick={() => aplicar(game.mkdir(caminho))}>
              Nova pasta
            </button>
            <button className="xp" disabled={!atual}
                    onClick={() => { setRenomeando(atual!.name); setRascunho(atual!.name) }}>
              Renomear
            </button>
            <button className="xp" disabled={!atual}
                    onClick={() => {
                      setRecortado({ path: caminho, name: atual!.name })
                      setStatus(`"${atual!.name}" recortado. Abra a pasta destino e cole.`)
                    }}>
              Recortar
            </button>
            <button className="xp" disabled={!recortado}
                    onClick={() => {
                      aplicar(game.move(recortado!.path, recortado!.name, caminho))
                      setRecortado(null)
                    }}>
              Colar
            </button>
            <button className="xp"
                    disabled={!atual || isFolder(atual) || !atual.worth}
                    onClick={() => atual && aplicar(game.sell(caminho, atual.name))}>
              Vender
            </button>
            <button className="xp" disabled={!atual}
                    onClick={() => atual && aplicar(game.remove(caminho, atual.name))}>
              Excluir
            </button>
          </>
        )}
      </div>

      <div className="statusbar">
        <span className="grow">{status || `${itens.length} item(ns)`}</span>
        {!noZ && <span title="Evidência guardada no seu disco">🔥 {evidencia}</span>}
        <span>{game.player.balance.toLocaleString('pt-BR')} VC</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function Unidade(props: {
  glifo: string; rotulo: string; sub: string
  ativo: boolean; desabilitado?: boolean; onClick: () => void
}) {
  return (
    <div
      onClick={props.onClick}
      className="row explorer-unidade"
      style={{
        padding: '4px 5px', gap: 7, cursor: 'default',
        opacity: props.desabilitado ? .45 : 1,
        background: props.ativo ? 'var(--xp-selection)' : 'transparent',
        color: props.ativo ? '#fff' : 'inherit',
      }}
    >
      <span style={{ fontSize: 17 }}>{props.glifo}</span>
      <span className="grow">
        {props.rotulo}
        <span style={{ display: 'block', fontSize: 10, opacity: .75 }}>{props.sub}</span>
      </span>
    </div>
  )
}

export { DOWNLOADS }
