/**
 * Chroma - navegador falso. Nao carrega a internet de verdade: cada dominio e
 * um componente React registrado em `sites/registry.tsx`.
 *
 * Abas sao um anacronismo assumido (o IE6 nao tinha) - navegar entre o banco, a
 * loja e o jornal sem perder o lugar vale mais que a fidelidade aqui.
 */

import { useState } from 'react'
import { HOME, SITES } from '@/sites/registry'

interface Props { args?: Record<string, unknown> }

interface Aba {
  id: number
  /** Pilha de navegacao desta aba. */
  historico: string[]
  /** Posicao atual dentro do historico (para voltar/avancar). */
  cursor: number
  /** O que esta escrito na barra de endereco desta aba. */
  digitado: string
}

let seq = 0
const novaAba = (url: string): Aba =>
  ({ id: ++seq, historico: [url], cursor: 0, digitado: url })

export function Browser({ args }: Props) {
  const inicial = (args?.url as string) ?? HOME
  const [abas, setAbas] = useState<Aba[]>([novaAba(inicial)])
  const [ativa, setAtiva] = useState<number>(() => abas[0].id)

  const aba = abas.find((a) => a.id === ativa) ?? abas[0]
  const url = aba.historico[aba.cursor]
  const site = SITES[url]

  function atualizar(id: number, muda: (a: Aba) => Aba) {
    setAbas((as) => as.map((a) => (a.id === id ? muda(a) : a)))
  }

  function normalizar(entrada: string): string {
    return entrada.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
  }

  /** Navegar descarta o "avancar" pendente, como todo navegador faz. */
  function navegar(destino: string, emAba = aba.id) {
    const limpo = normalizar(destino)
    if (!limpo) return
    atualizar(emAba, (a) => ({
      ...a,
      historico: [...a.historico.slice(0, a.cursor + 1), limpo],
      cursor: a.cursor + 1,
      digitado: limpo,
    }))
  }

  function andar(delta: number) {
    const alvo = aba.cursor + delta
    if (alvo < 0 || alvo >= aba.historico.length) return
    atualizar(aba.id, (a) => ({ ...a, cursor: alvo, digitado: a.historico[alvo] }))
  }

  function abrirAba(url = HOME) {
    const nova = novaAba(url)
    setAbas((as) => [...as, nova])
    setAtiva(nova.id)
  }

  function fecharAba(id: number) {
    setAbas((as) => {
      if (as.length === 1) return as            // nunca fica sem nenhuma aba
      const resto = as.filter((a) => a.id !== id)
      if (id === ativa) {
        const i = as.findIndex((a) => a.id === id)
        setAtiva((resto[i] ?? resto[i - 1] ?? resto[0]).id)
      }
      return resto
    })
  }

  return (
    <div className="grow col" style={{ gap: 0, background: '#fff' }}>
      {/* barra de abas */}
      <div className="tabstrip">
        {abas.map((a) => {
          const s = SITES[a.historico[a.cursor]]
          return (
            <div
              key={a.id}
              className={`tab${a.id === ativa ? ' active' : ''}`}
              onPointerDown={() => setAtiva(a.id)}
              title={a.historico[a.cursor]}
            >
              <span>{s ? s.favicon : '⚠️'}</span>
              <span className="tab-title">{s ? s.title : 'Erro'}</span>
              {abas.length > 1 && (
                <button
                  className="tab-close"
                  title="Fechar aba"
                  onPointerDown={(e) => { e.stopPropagation(); fecharAba(a.id) }}
                />
              )}
            </div>
          )
        })}
        <button className="tab-new" title="Nova aba" onClick={() => abrirAba()}>+</button>
      </div>

      {/* barra de enderecos */}
      <div className="row browser-bar">
        <button className="xp narrow nav" title="Voltar"
                disabled={aba.cursor === 0} onClick={() => andar(-1)}>◀</button>
        <button className="xp narrow nav" title="Avançar"
                disabled={aba.cursor >= aba.historico.length - 1}
                onClick={() => andar(1)}>▶</button>
        <button className="xp narrow nav" title="Página inicial"
                onClick={() => navegar(HOME)}>🏠</button>
        <input
          className="xp grow address"
          value={aba.digitado}
          spellCheck={false}
          onChange={(e) => atualizar(aba.id, (a) => ({ ...a, digitado: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            // Ctrl+Enter abre em aba nova, como nos navegadores de verdade.
            if (e.ctrlKey) abrirAba(normalizar(aba.digitado))
            else navegar(aba.digitado)
          }}
        />
        <button className="xp narrow" onClick={() => navegar(aba.digitado)}>Ir</button>
      </div>

      {/* pagina */}
      <div className="grow scroll" style={{ background: '#fff', userSelect: 'text' }}>
        {site
          ? <site.component navigate={navegar} />
          : <NaoEncontrado url={url} onHome={() => navegar(HOME)} />}
      </div>
    </div>
  )
}

function NaoEncontrado({ url, onHome }: { url: string; onHome: () => void }) {
  return (
    <div className="web" style={{ padding: '40px 50px' }}>
      <h1>Não foi possível localizar o servidor</h1>
      <p>
        O endereço <b>{url}</b> não respondeu. Verifique se digitou corretamente
        ou tente novamente mais tarde.
      </p>
      <p style={{ color: '#666' }}>
        Dica: os endereços deste jogo terminam em <b>.vc</b>.
      </p>
      <button className="btn-old" onClick={onHome}>Voltar à página inicial</button>
    </div>
  )
}
