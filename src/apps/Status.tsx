/**
 * Resumo da situacao: abre clicando no relogio, no saldo ou no escudo da
 * bandeja.
 *
 * Junta numa tela so as coisas que estavam espalhadas: o quanto voce esta sendo
 * cacado (e o que esta alimentando isso), o dinheiro, o disco e o progresso dos
 * programas.
 */

import { useState } from 'react'
import { totalEvidence } from '@/game/fs'
import { missaoAtual, placar } from '@/game/missions'
import { BRANCHES, cleanPower, levelOf, nextSkill, skillsOf } from '@/game/skills'
import {
  clockOf, decayPerHour, evidenceHeatPerHour, heatColor, heatLevel, useGame,
} from '@/game/store'
import { launchApp } from '@/os/launch'

const DIAGNOSTICO: Record<string, string> = {
  calmo: 'Você está limpo. Nenhuma correlação em andamento.',
  atencao: 'Seus pacotes estão sendo amostrados. Ainda dá para trabalhar.',
  alerta: 'A V-Sec está correlacionando seus saltos. Limpe ou pare.',
  critico: 'Localização iminente. Pare tudo e limpe agora.',
}

export function Status() {
  const game = useGame()
  const [aviso, setAviso] = useState('')
  const heat = game.player.heat
  const nivel = heatLevel(heat)
  const evidencia = totalEvidence(game.disk)
  const porHora = evidenceHeatPerHour(game.disk)
  const queda = decayPerHour(heat)
  const poderDeFaxina = cleanPower(game.skills)
  const liquido = porHora - queda

  const naLista = game.machines.filter((m) => m.found).length
  const missoes = placar(game)
  const atual = missaoAtual(game)

  return (
    <div className="grow col scroll" style={{ gap: 4, padding: 6 }}>
      {/* o medidor, em destaque */}
      <fieldset className="xp">
        <legend>Quanto estão te caçando</legend>
        <div className="row" style={{ gap: 12, alignItems: 'flex-end' }}>
          <div style={{ fontSize: 38, fontWeight: 'bold', lineHeight: 1,
                        color: heatColor(heat) }}>
            {heat.toFixed(0)}%
          </div>
          <div className="grow">
            <div className="status-medidor">
              <div style={{ width: `${heat}%`, background: heatColor(heat) }} />
              <span className="marca" style={{ left: '60%' }} title="alerta" />
              <span className="marca" style={{ left: '85%' }} title="crítico" />
            </div>
            <div style={{ marginTop: 4 }}>
              <b style={{ color: heatColor(heat) }}>{nivel.toUpperCase()}</b>
              {' — '}{DIAGNOSTICO[nivel]}
            </div>
          </div>
        </div>

        <table className="manual-tabela" style={{ marginTop: 10 }}>
          <tbody>
            <tr>
              <td style={{ width: 190 }}>Queda natural</td>
              <td style={{ color: '#087' }}>
                −{queda.toFixed(1)} por hora
                <div className="muted">
                  quanto mais alto o rastro, mais devagar ele esfria
                </div>
              </td>
            </tr>
            <tr>
              <td>Evidência no seu disco</td>
              <td style={{ color: porHora > 0 ? '#c00' : '#666' }}>
                +{porHora.toFixed(1)} por hora
                {evidencia > 0 && <span className="muted"> ({evidencia} de peso)</span>}
              </td>
            </tr>
            <tr>
              <td><b>Saldo</b></td>
              <td>
                <b style={{ color: liquido > 0 ? '#c00' : '#087' }}>
                  {liquido > 0 ? '+' : ''}{liquido.toFixed(1)} por hora
                </b>
                <div className="muted">
                  {liquido > 0
                    ? 'Seu rastro está SUBINDO sozinho. Venda ou apague arquivos.'
                    : 'Seu rastro cai sozinho se você ficar parado.'}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
          <button
            className="xp"
            disabled={!poderDeFaxina || heat <= 0}
            title={poderDeFaxina
              ? `Sobrescreve os logs: −${poderDeFaxina} de rastro`
              : 'Você não tem o programa de Faxina. Compre no darkmarket.vc.'}
            onClick={() => setAviso(game.cleanLogs().message)}
          >
            Limpar rastros
            {poderDeFaxina > 0 && ` (−${poderDeFaxina})`}
          </button>

          {evidencia > 0 && (
            <button className="xp" onClick={() => launchApp('explorer')}>
              Abrir o disco para limpar
            </button>
          )}
        </div>

        {!poderDeFaxina && (
          <div className="muted" style={{ marginTop: 6 }}>
            A limpeza <b>não é automática</b>: exige o programa de <b>Faxina</b>,
            comprado em darkmarket.vc.
          </div>
        )}
        {aviso && (
          <div className="manual-nota" style={{ margin: '8px 0 0' }}>{aviso}</div>
        )}
      </fieldset>

      {/* dinheiro e operacao */}
      <div className="row" style={{ alignItems: 'stretch', gap: 4 }}>
        <fieldset className="xp grow" style={{ margin: 0 }}>
          <legend>Dinheiro</legend>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: '#087' }}>
            {game.player.balance.toLocaleString('pt-BR')} <span style={{ fontSize: 12 }}>VC</span>
          </div>
          <table className="manual-tabela" style={{ marginTop: 6 }}>
            <tbody>
              <tr><td>Sua conta laranja</td><td className="mono">{game.player.muleAccount}</td></tr>
              <tr>
                <td>Total roubado</td>
                <td>{game.recordes.roubado.toLocaleString('pt-BR')} VC</td>
              </tr>
              <tr><td>Contas zeradas</td><td>{game.drained.length}</td></tr>
              <tr><td>Senhas no navegador</td><td>{game.credentials.length}</td></tr>
              <tr><td>Experiência</td><td>{game.player.xp} XP</td></tr>
            </tbody>
          </table>
        </fieldset>

        <fieldset className="xp grow" style={{ margin: 0 }}>
          <legend>Operação</legend>
          <table className="manual-tabela">
            <tbody>
              <tr><td>Hora</td><td>{clockOf(game.minutes)}</td></tr>
              <tr><td>Hosts na lista</td><td>{naLista}</td></tr>
              <tr><td>Máquinas invadidas</td><td>{game.recordes.invasoes}</td></tr>
              <tr>
                <td>Maior alvo</td>
                <td>{game.recordes.maiorAlvo > 0
                  ? `nível ${game.recordes.maiorAlvo}`
                  : <span className="muted">nenhum ainda</span>}</td>
              </tr>
              <tr>
                <td>Conectado agora</td>
                <td>{game.connected()?.hostname ?? <span className="muted">nenhum</span>}</td>
              </tr>
            </tbody>
          </table>
        </fieldset>
      </div>

      {/* missoes */}
      <fieldset className="xp" style={{ margin: 0 }}>
        <legend>Missões</legend>
        <table className="manual-tabela">
          <tbody>
            <tr>
              <td style={{ width: 190 }}>Concluídas</td>
              <td><b>{missoes.feitas}</b> de {missoes.total}</td>
            </tr>
            <tr>
              <td>Agora</td>
              <td>{atual
                ? <b>{atual.titulo}</b>
                : <span className="muted">nada em aberto</span>}</td>
            </tr>
          </tbody>
        </table>
        <button className="xp" style={{ marginTop: 8 }}
                onClick={() => launchApp('browser', { args: { url: 'vmail.vc' } })}>
          Abrir o quadro de missões
        </button>
      </fieldset>

      {/* programas */}
      <fieldset className="xp" style={{ margin: 0 }}>
        <legend>Seus programas</legend>
        <table className="painel-tabela">
          <tbody>
            {BRANCHES.map((b) => {
              const nivel = levelOf(game.skills, b.id)
              const total = skillsOf(b.id).length
              const proximo = nextSkill(game.skills, b.id)
              return (
                <tr key={b.id}>
                  <td style={{ width: 24, fontSize: 15 }}>{b.icon}</td>
                  <td style={{ width: 96 }}><b>{b.name}</b></td>
                  <td style={{ width: 128 }}>
                    <div className="niveis">
                      {Array.from({ length: total }, (_, i) => (
                        <span key={i} className={i < nivel ? 'on' : 'off'} />
                      ))}
                    </div>
                    <span className="muted">nível {nivel}/{total}</span>
                  </td>
                  <td>
                    {proximo
                      ? <span className={game.player.balance >= proximo.price
                                         ? '' : 'muted'}>
                          próximo: {proximo.price.toLocaleString('pt-BR')} VC
                        </span>
                      : <span style={{ color: '#087' }}>no máximo</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <button className="xp" style={{ marginTop: 8 }}
                onClick={() => launchApp('browser', { args: { url: 'darkmarket.vc' } })}>
          Ir às compras
        </button>
      </fieldset>
    </div>
  )
}
