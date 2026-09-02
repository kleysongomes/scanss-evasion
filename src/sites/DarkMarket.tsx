/**
 * darkmarket.vc - a loja, no formato de arvore de upgrades.
 *
 * Voce nao compra "mais um programa": compra o proximo nivel de um programa que
 * ja tem. O nivel N so libera depois do N-1 - e isso que torna interessante a
 * escolha de em qual ramo investir primeiro.
 */

import { useState } from 'react'
import { BRANCHES, canBuy, levelOf, skillsOf } from '@/game/skills'
import { useGame } from '@/game/store'
import type { Branch, Skill } from '@/game/types'
import type { SiteProps } from './registry'

export function DarkMarket(_props: SiteProps) {
  const game = useGame()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [foco, setFoco] = useState<Branch | 'todos'>('todos')

  const ramos = foco === 'todos' ? BRANCHES : BRANCHES.filter((b) => b.id === foco)

  return (
    <div className="web" style={{ background: '#dcdcdc' }}>
      {/* banner */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ background: 'linear-gradient(180deg,#3a2030,#1a0e16)',
                         padding: '12px 14px', width: 300 }}>
              <span style={{ fontFamily: 'Arial Black, Arial, sans-serif', fontSize: 24,
                             color: '#fff', letterSpacing: -1 }}>
                dark<span style={{ color: '#cc2222' }}>market</span>
              </span>
              <div style={{ color: '#a08898', fontSize: 10 }}>
                atualizações para os seus programas · desde 2001
              </div>
            </td>
            <td style={{ background: 'linear-gradient(180deg,#3a2030,#1a0e16)',
                         padding: '12px 14px', textAlign: 'right', color: '#a08898',
                         fontSize: 10 }}>
              <span style={{ color: '#ffcc00' }}>★</span> entrega imediata ·
              sem reembolso<br />
              seu saldo:{' '}
              <b style={{ color: '#8ee08e', fontSize: 14 }}>
                {game.player.balance.toLocaleString('pt-BR')} VC
              </b>
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ background: '#c0c0c0', borderTop: '1px solid #fff',
                                     borderBottom: '1px solid #808080',
                                     padding: '3px 14px', fontSize: 10 }}>
              <a onClick={() => setFoco('todos')}
                 style={{ fontWeight: foco === 'todos' ? 'bold' : 'normal' }}>
                Todos os programas
              </a>
              {BRANCHES.map((b) => (
                <span key={b.id}>
                  {' | '}
                  <a onClick={() => setFoco(b.id)}
                     style={{ fontWeight: foco === b.id ? 'bold' : 'normal' }}>
                    {b.name}
                  </a>
                </span>
              ))}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ padding: 14 }}>
        {msg && (
          <div className={`alert-old ${msg.ok ? 'ok' : 'err'}`}>
            {msg.ok ? '✔' : '⚠'} {msg.text}
          </div>
        )}

        <div className="alert-old" style={{ background: '#eef2f7', borderColor: '#aab' }}>
          Cada programa tem <b>3 níveis</b>. O seguinte só abre depois do
          anterior — escolha bem em qual investir primeiro.
        </div>

        {ramos.map((b) => (
          <Ramo
            key={b.id}
            branch={b.id}
            nome={b.name}
            icone={b.icon}
            papel={b.role}
            onComprar={(id) => {
              const r = game.buySkill(id)
              setMsg({ ok: r.ok, text: r.message })
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

interface RamoProps {
  branch: Branch
  nome: string
  icone: string
  papel: string
  onComprar: (id: string) => void
}

function Ramo({ branch, nome, icone, papel, onComprar }: RamoProps) {
  const game = useGame()
  const niveis = skillsOf(branch)
  const atual = levelOf(game.skills, branch)

  return (
    <div className="box">
      <div className="box-title">
        {icone} {nome}
        <span style={{ float: 'right', fontWeight: 'normal' }}>
          nível {atual} de {niveis.length}
        </span>
      </div>
      <div className="box-body">
        <p style={{ color: '#555', margin: '0 0 12px' }}>{papel}</p>

        <div className="arvore">
          {niveis.map((s, i) => (
            <Nivel
              key={s.id}
              skill={s}
              tem={game.skills.includes(s.id)}
              liberado={canBuy(game.skills, s.id)}
              temSaldo={game.player.balance >= s.price}
              ultimo={i === niveis.length - 1}
              onComprar={() => onComprar(s.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface NivelProps {
  skill: Skill
  tem: boolean
  liberado: boolean
  temSaldo: boolean
  ultimo: boolean
  onComprar: () => void
}

function Nivel({ skill, tem, liberado, temSaldo, ultimo, onComprar }: NivelProps) {
  const estado = tem ? 'tem' : liberado ? 'liberado' : 'bloqueado'

  return (
    <div className={`no ${estado}`}>
      <div className="conector">
        <span className="bolinha">{tem ? '✔' : skill.level}</span>
        {!ultimo && <span className="linha" />}
      </div>

      <div className="corpo">
        <div className="cabeca">
          <b>{skill.name}</b>
          <span className="efeito">{skill.effect}</span>
        </div>
        <div className="desc">{skill.description}</div>
      </div>

      <div className="compra">
        {tem ? (
          <span className="instalado">instalado</span>
        ) : (
          <>
            <div className="preco">
              {skill.price ? `${skill.price.toLocaleString('pt-BR')} VC` : 'grátis'}
            </div>
            <button className="btn-old" disabled={!liberado || !temSaldo}
                    onClick={onComprar}>
              {!liberado ? 'bloqueado' : temSaldo ? 'Comprar' : 'sem saldo'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
