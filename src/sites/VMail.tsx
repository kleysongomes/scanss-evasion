/**
 * vmail.vc - o webmail de 2003, e o canal por onde a historia chega.
 *
 * Layout de webmail da epoca: barra do provedor, lista de mensagens em tabela
 * com negrito nas nao lidas, e o corpo embaixo. Quem escreve e o 3stagiario;
 * os textos vivem em `game/story/`.
 *
 * O webmail tambem guarda o QUADRO DE MISSOES, numa segunda aba. Ele mora aqui
 * porque foi por aqui que as missoes chegaram: procurar o que ainda falta fazer
 * no mesmo lugar onde o 3stagiario pediu e o reflexo certo.
 */

import { useEffect, useState } from 'react'
import {
  emAberto, foiConcluida, missaoAtual, placar, trancadas, visiveis,
} from '@/game/missions'
import type { Missao, TipoMissao } from '@/game/missions'
import { clockOf, useGame } from '@/game/store'
import type { GameState } from '@/game/types'
import type { SiteProps } from './registry'

const SITE = 'vmail.vc'

type Aba = 'inbox' | 'missoes'

/**
 * Uma tabela de missoes.
 *
 * As concluidas ficam riscadas e cinzas em vez de sairem da lista: o pedido era
 * poder olhar as missoes PASSADAS, e uma lista que se apaga sozinha nao deixa
 * ninguem ver o que ja fez.
 */
function Quadro({ estado, titulo, tipo, vazio }: {
  estado: GameState
  titulo: string
  tipo: TipoMissao
  vazio: string
}) {
  const lista: Missao[] = visiveis(estado, tipo)

  return (
    <div className="box" style={{ marginBottom: 12 }}>
      <div className="box-title">{titulo}</div>
      <div className="box-body" style={{ padding: 0 }}>
        {lista.length === 0 ? (
          <div style={{ padding: '10px 12px', color: '#666' }}>{vazio}</div>
        ) : (
          <table className="tbl-old">
            <thead>
              <tr>
                <th style={{ width: 22 }} />
                <th>Missão</th>
                <th style={{ width: 84 }}>Situação</th>
                <th style={{ width: 84 }}>Prêmio</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((m) => {
                const pronta = foiConcluida(estado, m.id)
                return (
                  <tr key={m.id} style={{ color: pronta ? '#7a7a7a' : undefined }}>
                    <td style={{ textAlign: 'center' }}>{pronta ? '✔' : ''}</td>
                    <td>
                      <span style={{ textDecoration: pronta ? 'line-through' : 'none',
                                     fontWeight: pronta ? 'normal' : 'bold' }}>
                        {m.titulo}
                      </span>
                      {m.onde && (
                        <div style={{ fontSize: 10, color: '#777', marginTop: 1 }}>
                          {m.onde}
                        </div>
                      )}
                    </td>
                    <td>{pronta ? 'concluída' : 'em aberto'}</td>
                    <td>{m.premio > 0 ? `${m.premio.toLocaleString('pt-BR')} VC` : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export function VMail(_props: SiteProps) {
  const game = useGame()
  const naoLidos = game.inbox.filter((e) => !e.lido).length
  const [aba, setAba] = useState<Aba>('inbox')

  const conta = placar(game)
  const abertas = emAberto(game)
  const naoLiberadas = trancadas(game)
  const atual = missaoAtual(game)

  // Abre no mais recente nao lido; se nao houver, no mais recente.
  const [sel, setSel] = useState<string | null>(() => {
    const pendente = [...game.inbox].reverse().find((e) => !e.lido)
    return (pendente ?? game.inbox[game.inbox.length - 1])?.id ?? null
  })

  const aberto = game.inbox.find((e) => e.id === sel) ?? null

  const readMail = useGame((s) => s.readMail)

  // Abrir o webmail marca como lido o que esta na tela. Num efeito, nao no
  // render: marcar durante o render seria efeito colateral em render.
  useEffect(() => {
    if (aberto && !aberto.lido) readMail(aberto.id)
  }, [aberto, readMail])

  return (
    <div className="web" style={{ background: '#eef1f5' }}>
      {/* barra do provedor */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ background: '#1a3a6b', padding: '9px 14px', width: 220 }}>
              <span style={{ color: '#fff', fontFamily: 'Arial, sans-serif',
                             fontSize: 20, fontWeight: 'bold' }}>
                V<span style={{ color: '#ffcc00' }}>Mail</span>
              </span>
              <div style={{ color: '#93aacb', fontSize: 9 }}>
                seu e-mail grátis de 6 MB
              </div>
            </td>
            <td style={{ background: 'linear-gradient(180deg,#3c6aa8,#1a3a6b)',
                         padding: '9px 14px', textAlign: 'right',
                         color: '#cfe0f2', fontSize: 10 }}>
              conectado como <b>{game.player.handle}@vmail.vc</b><br />
              {naoLidos > 0
                ? `${naoLidos} mensagem(ns) não lida(s)`
                : 'nenhuma mensagem nova'}
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ background: '#c0c0c0', borderTop: '1px solid #fff',
                                     borderBottom: '1px solid #808080',
                                     padding: '3px 14px', fontSize: 10 }}>
              <a onClick={() => setAba('inbox')} style={{ cursor: 'pointer' }}>
                {aba === 'inbox' ? <b>Caixa de entrada</b> : 'Caixa de entrada'}
              </a>
              &nbsp;|&nbsp;
              <a onClick={() => setAba('missoes')} style={{ cursor: 'pointer' }}>
                {aba === 'missoes' ? <b>Missões</b> : 'Missões'}
                {abertas > 0 && ` (${abertas})`}
              </a>
              &nbsp;|&nbsp; <a>Enviados</a>
              &nbsp;|&nbsp; <a>Rascunhos</a> &nbsp;|&nbsp; <a>Lixeira</a>
              &nbsp;|&nbsp; <a>Opções</a>
              <span style={{ float: 'right', color: '#555' }}>
                {game.inbox.length} de 6 MB usados
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ padding: 12 }}>
        {atual && (
          <div className="alert-old" style={{ background: '#fffbe6' }}>
            <b>Missão atual:</b> {atual.titulo}
            {atual.onde && (
              <div style={{ fontSize: 10, marginTop: 2 }}>{atual.onde}</div>
            )}
          </div>
        )}

        {aba === 'missoes' ? (
          <>
            <div className="box" style={{ marginBottom: 12 }}>
              <div className="box-title">Quadro de missões</div>
              <div className="box-body">
                <b>{conta.feitas} de {conta.total}</b> concluídas
                {abertas > 0 && ` · ${abertas} em aberto agora`}
                <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
                  As da história chegam por e-mail e ensinam o jogo. Os desafios
                  são seus: faça na ordem que quiser, na hora que quiser.
                </div>
              </div>
            </div>

            <Quadro estado={game} tipo="guia" titulo="Missões da história"
                    vazio="Nada ainda. O 3stagiario vai escrever." />

            <Quadro estado={game} tipo="desafio" titulo="Desafios"
                    vazio="Nenhum liberado ainda." />

            {naoLiberadas > 0 && (
              <div style={{ fontSize: 10, color: '#666' }}>
                Mais {naoLiberadas} missão(ões) ainda não liberada(s) — elas
                aparecem aqui conforme você avança.
              </div>
            )}
          </>
        ) : game.inbox.length === 0 ? (
          <div className="box">
            <div className="box-title">Caixa de entrada</div>
            <div className="box-body">
              Nenhuma mensagem. Estranho — normalmente chega spam antes de
              qualquer coisa.
            </div>
          </div>
        ) : (
          <>
            <table className="tbl-old" style={{ marginBottom: 12 }}>
              <thead>
                <tr>
                  <th style={{ width: 22 }} />
                  <th style={{ width: 168 }}>De</th>
                  <th>Assunto</th>
                  <th style={{ width: 52 }}>Hora</th>
                </tr>
              </thead>
              <tbody>
                {[...game.inbox].reverse().map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => setSel(e.id)}
                    style={{
                      cursor: 'pointer',
                      background: e.id === sel ? '#d8e6ff' : undefined,
                      fontWeight: e.lido ? 'normal' : 'bold',
                    }}
                  >
                    <td>{e.lido ? '📭' : '✉️'}</td>
                    <td>{e.de}</td>
                    <td>{e.assunto}</td>
                    <td>{clockOf(e.em)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {aberto && (
              <div className="box">
                <div className="box-title">{aberto.assunto}</div>
                <div className="box-body">
                  <table className="tbl-old" style={{ marginBottom: 10 }}>
                    <tbody>
                      <tr>
                        <td style={{ width: 60 }}>De</td>
                        <td><b>{aberto.de}</b></td>
                      </tr>
                      <tr>
                        <td>Para</td>
                        <td>{game.player.handle}@vmail.vc</td>
                      </tr>
                      <tr>
                        <td>Hora</td>
                        <td>{clockOf(aberto.em)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="vmail-corpo">{aberto.corpo}</div>

                  <div style={{ marginTop: 12 }}>
                    <button className="btn-old" disabled>Responder</button>
                    &nbsp;
                    <button className="btn-old" disabled>Encaminhar</button>
                    <span style={{ marginLeft: 10, fontSize: 10, color: '#888' }}>
                      (o remetente não aceita resposta)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export { SITE as VMAIL }
