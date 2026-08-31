/**
 * Painel de Controle: os seus programas e o nivel de cada um, mais a
 * manutencao do micro.
 *
 * Aqui e so leitura da arvore de habilidades; comprar acontece no darkmarket.
 */

import { useState } from 'react'
import { BRANCHES, levelOf, nextSkill, skillsOf } from '@/game/skills'
import { evidenceHeatPerHour, useGame } from '@/game/store'
import { totalEvidence } from '@/game/fs'
import { launchApp } from '@/os/launch'
import { useWindows } from '@/os/windows'
import { APP_BY_ID } from './catalog'

export function Painel() {
  const game = useGame()
  const closeAll = useWindows((s) => s.closeAll)
  const [confirmando, setConfirmando] = useState(false)

  const evidencia = totalEvidence(game.disk)
  const porHora = evidenceHeatPerHour(game.disk)

  const programas = Object.values(APP_BY_ID).filter((a) => a.start || a.desktop)

  return (
    <div className="grow col" style={{ gap: 4, padding: 4 }}>
      <div style={{ fontSize: 15, fontWeight: 'bold', color: '#0046d5' }}>
        Programas e desempenho
      </div>

      <div className="scroll grow" style={{ paddingRight: 2 }}>
        {/* arvore de habilidades, so leitura */}
        <fieldset className="xp">
          <legend>Programas de invasão</legend>
          <table className="painel-tabela">
            <tbody>
              {BRANCHES.map((b) => {
                const nivel = levelOf(game.skills, b.id)
                const total = skillsOf(b.id).length
                const proximo = nextSkill(game.skills, b.id)
                return (
                  <tr key={b.id}>
                    <td style={{ width: 26, fontSize: 17 }}>{b.icon}</td>
                    <td>
                      <b>{b.name}</b>
                      <div className="muted">{b.role}</div>
                    </td>
                    <td style={{ width: 96 }}>
                      <div className="niveis">
                        {Array.from({ length: total }, (_, i) => (
                          <span key={i} className={i < nivel ? 'on' : 'off'} />
                        ))}
                      </div>
                      <div className="muted">nível {nivel} de {total}</div>
                    </td>
                    <td style={{ width: 128 }}>
                      {proximo
                        ? <span className="muted">
                            próximo: {proximo.price.toLocaleString('pt-BR')} VC
                          </span>
                        : <span style={{ color: '#087' }}>no máximo</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="muted" style={{ marginTop: 6 }}>
            Atualizações são compradas em <b>darkmarket.vc</b>, pelo navegador.
          </div>
        </fieldset>

        {/* risco do disco */}
        <fieldset className="xp">
          <legend>Risco do seu disco</legend>
          {evidencia === 0 ? (
            <div>
              Nenhum arquivo incriminador guardado. O ScanSS não tem o que achar
              aqui.
            </div>
          ) : (
            <>
              <div className="row">
                <span className="grow">
                  Evidência acumulada em <b>C:</b>
                </span>
                <b style={{ color: porHora > 12 ? '#c00' : '#c60' }}>{evidencia}</b>
              </div>
              <div className="muted" style={{ marginTop: 4, lineHeight: 1.5 }}>
                Isso gera <b>+{porHora.toFixed(1)} de rastro por hora</b>. Para
                efeito de comparação, o rastro cai 15 por hora sozinho.
                Venda ou apague o que você já usou.
              </div>
              <button className="xp" style={{ marginTop: 8 }}
                      onClick={() => launchApp('explorer')}>
                Abrir Meu Computador
              </button>
            </>
          )}
        </fieldset>

        {/* aplicativos instalados */}
        <fieldset className="xp">
          <legend>Aplicativos</legend>
          {programas.map((a) => (
            <div key={a.id} className="row" style={{ padding: '4px 0', gap: 8 }}>
              <span style={{ fontSize: 17, width: 22 }}>{a.icon}</span>
              <span className="grow">
                <b>{a.name}</b>
                <div className="muted">{a.description}</div>
              </span>
              <button className="xp narrow" onClick={() => launchApp(a.id)}>
                Abrir
              </button>
            </div>
          ))}
        </fieldset>
      </div>

      <fieldset className="xp" style={{ margin: 0 }}>
        <legend>Manutenção</legend>
        {confirmando ? (
          <div className="row">
            <span className="grow" style={{ color: '#c00' }}>
              Isto apaga saldo, arquivos, senhas e programas. Tem certeza?
            </span>
            <button className="xp" onClick={() => { game.reset(); closeAll() }}>
              Formatar
            </button>
            <button className="xp" onClick={() => setConfirmando(false)}>Cancelar</button>
          </div>
        ) : (
          <div className="row">
            <span className="grow">Formatar o micro e recomeçar do zero.</span>
            <button className="xp" onClick={() => setConfirmando(true)}>
              Formatar o micro
            </button>
          </div>
        )}
      </fieldset>

      <div className="statusbar">
        <span className="grow">XP {game.player.xp}</span>
        <span>{game.player.balance.toLocaleString('pt-BR')} VC</span>
      </div>
    </div>
  )
}
