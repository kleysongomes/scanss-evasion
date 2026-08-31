/**
 * Ferramentas de Desenvolvedor.
 *
 * Serve para inspecionar e forcar estados do jogo sem ter que jogar ate la -
 * util para ver como cada tela se comporta com rastro alto, muito dinheiro ou
 * programas no maximo.
 *
 * Nada aqui funciona antes de ATIVAR: o store ignora toda acao `dev*` enquanto
 * `devMode` estiver desligado, entao um clique perdido nao estraga a partida.
 */

import { useState } from 'react'
import { totalEvidence } from '@/game/fs'
import { BRANCHES, MAX_LEVEL, levelOf, skillsOf } from '@/game/skills'
import {
  clockOf, decayPerHour, evidenceHeatPerHour, heatColor, heatLevel, useGame,
} from '@/game/store'
import { useWindows } from '@/os/windows'

export function DevTools() {
  const game = useGame()
  const closeAll = useWindows((s) => s.closeAll)
  const [saldo, setSaldo] = useState('')
  const [tier, setTier] = useState(3)

  if (!game.devMode) return <Ativacao />

  const heat = game.player.heat

  return (
    <div className="grow col scroll dev" style={{ gap: 4, padding: 6 }}>
      <div className="dev-faixa">
        <b>MODO DESENVOLVEDOR ATIVO</b> — as alterações abaixo são imediatas.
        <button className="xp narrow" style={{ marginLeft: 'auto' }}
                onClick={() => game.setDevMode(false)}>
          Desativar
        </button>
      </div>

      {/* ------------------------------------------------ dinheiro */}
      <fieldset className="xp">
        <legend>Dinheiro</legend>
        <div className="row" style={{ marginBottom: 6 }}>
          <span className="grow">
            Saldo atual: <b>{game.player.balance.toLocaleString('pt-BR')} VC</b>
          </span>
        </div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {[1_000, 10_000, 100_000, 1_000_000].map((v) => (
            <button key={v} className="xp narrow"
                    onClick={() => game.devSetBalance(game.player.balance + v)}>
              +{v.toLocaleString('pt-BR')}
            </button>
          ))}
          <button className="xp narrow" onClick={() => game.devSetBalance(0)}>
            Zerar
          </button>
        </div>
        <div className="row" style={{ marginTop: 6 }}>
          <input className="xp" style={{ width: 120 }} value={saldo}
                 placeholder="valor exato" inputMode="numeric"
                 onChange={(e) => setSaldo(e.target.value)} />
          <button className="xp narrow"
                  onClick={() => { game.devSetBalance(Number(saldo) || 0); setSaldo('') }}>
            Definir
          </button>
        </div>
      </fieldset>

      {/* ------------------------------------------------ rastro */}
      <fieldset className="xp">
        <legend>Nível de procurado</legend>
        <div className="row" style={{ gap: 10, marginBottom: 8 }}>
          <b style={{ fontSize: 22, color: heatColor(heat), width: 70 }}>
            {heat.toFixed(0)}%
          </b>
          <div className="grow">
            <input
              type="range" min={0} max={100} step={1}
              value={Math.round(heat)}
              style={{ width: '100%' }}
              onChange={(e) => game.devSetHeat(Number(e.target.value))}
            />
            <div className="muted">
              faixa <b>{heatLevel(heat)}</b> · cai {decayPerHour(heat).toFixed(1)}/hora
              {totalEvidence(game.disk) > 0 &&
                ` · evidência devolve +${evidenceHeatPerHour(game.disk).toFixed(1)}/hora`}
            </div>
          </div>
        </div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {[0, 30, 60, 85, 99].map((v) => (
            <button key={v} className="xp narrow" onClick={() => game.devSetHeat(v)}>
              {v}%
            </button>
          ))}
          <button className="xp narrow" onClick={() => game.devSetHeat(100)}>
            Estourar (tela azul)
          </button>
        </div>
      </fieldset>

      {/* ------------------------------------------------ programas */}
      <fieldset className="xp">
        <legend>Programas</legend>
        <table className="painel-tabela">
          <tbody>
            {BRANCHES.map((b) => {
              const nivel = levelOf(game.skills, b.id)
              return (
                <tr key={b.id}>
                  <td style={{ width: 22, fontSize: 15 }}>{b.icon}</td>
                  <td style={{ width: 98 }}><b>{b.name}</b></td>
                  <td style={{ width: 116 }}>
                    <div className="niveis">
                      {Array.from({ length: skillsOf(b.id).length }, (_, i) => (
                        <span key={i} className={i < nivel ? 'on' : 'off'} />
                      ))}
                    </div>
                  </td>
                  <td style={{ width: 34 }}>{nivel}</td>
                  <td>
                    <button className="xp narrow" disabled={nivel === 0}
                            onClick={() => game.devSetLevel(b.id, nivel - 1)}>−</button>
                    <button className="xp narrow" disabled={nivel >= MAX_LEVEL}
                            onClick={() => game.devSetLevel(b.id, nivel + 1)}>+</button>
                    <button className="xp narrow"
                            onClick={() => game.devSetLevel(b.id, MAX_LEVEL)}>máx</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="row" style={{ marginTop: 6 }}>
          <button className="xp"
                  onClick={() => BRANCHES.forEach((b) => game.devSetLevel(b.id, MAX_LEVEL))}>
            Tudo no máximo
          </button>
          <button className="xp"
                  onClick={() => BRANCHES.forEach((b) => game.devSetLevel(
                    b.id, b.id === 'scanner' || b.id === 'breaker' ? 1 : 0))}>
            Voltar ao inicial
          </button>
        </div>
      </fieldset>

      {/* ------------------------------------------------ rede */}
      <fieldset className="xp">
        <legend>Rede</legend>
        <div className="row" style={{ marginBottom: 6 }}>
          <span>Gerar alvo do andar</span>
          <input type="range" min={1} max={10} value={tier} style={{ width: 120 }}
                 onChange={(e) => setTier(Number(e.target.value))} />
          <b style={{ width: 18 }}>{tier}</b>
          <button className="xp narrow" onClick={() => game.devSpawn(tier)}>+1</button>
          <button className="xp narrow" onClick={() => game.devSpawn(tier, 5)}>+5</button>
        </div>
        <div className="row">
          <button className="xp" onClick={() => game.devOpenAll()}>
            Abrir tudo (invadir + destrancar)
          </button>
          <span className="muted grow">
            {game.machines.length} host(s) · {game.machines.filter((m) => m.exploited).length} invadido(s)
          </span>
        </div>
      </fieldset>

      {/* ------------------------------------------------ tempo */}
      <fieldset className="xp">
        <legend>Tempo</legend>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <span className="grow">Relógio: <b>{clockOf(game.minutes)}</b></span>
          {[
            ['+1 h', 60], ['+6 h', 360], ['+24 h', 1440],
          ].map(([rotulo, min]) => (
            <button key={rotulo as string} className="xp narrow"
                    onClick={() => game.devAdvance(min as number)}>
              {rotulo}
            </button>
          ))}
        </div>
        <div className="muted" style={{ marginTop: 5 }}>
          Avançar o tempo aplica a queda de rastro e a evidência do disco, igual
          ao jogo rodando.
        </div>
      </fieldset>

      {/* ------------------------------------------------ estado */}
      <fieldset className="xp" style={{ margin: 0 }}>
        <legend>Estado bruto</legend>
        <table className="painel-tabela">
          <tbody>
            <tr><td>XP</td><td>{game.player.xp}</td></tr>
            <tr><td>Evidência no disco</td><td>{totalEvidence(game.disk)}</td></tr>
            <tr><td>Credenciais</td><td>{game.credentials.length}</td></tr>
            <tr><td>Contas geradas</td><td>{Object.keys(game.accounts).length}</td></tr>
            <tr><td>Contas zeradas</td><td>{game.drained.length}</td></tr>
            <tr><td>Marcos</td>
                <td className="mono" style={{ fontSize: 10 }}>
                  {game.milestones.join(', ') || '—'}
                </td></tr>
          </tbody>
        </table>
        <button className="xp" style={{ marginTop: 8 }}
                onClick={() => { game.reset(); closeAll() }}>
          Reiniciar partida
        </button>
      </fieldset>
    </div>
  )
}

// ---------------------------------------------------------------------------

function Ativacao() {
  const setDevMode = useGame((s) => s.setDevMode)
  const devUsed = useGame((s) => s.devUsed)
  const [ciente, setCiente] = useState(false)

  return (
    <div className="grow col" style={{ padding: 16, gap: 10 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 'bold', color: '#0046d5' }}>
          Ferramentas de Desenvolvedor
        </div>
        <div className="muted">Inspeção e edição do estado do jogo</div>
      </div>

      <fieldset className="xp">
        <legend>O que isto faz</legend>
        <p style={{ margin: '0 0 8px', lineHeight: 1.6 }}>
          Permite alterar dinheiro, nível de procurado, nível dos programas,
          gerar alvos de qualquer andar e avançar o relógio — para ver como cada
          tela se comporta sem precisar jogar até lá.
        </p>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          Enquanto estiver desativado, <b>nenhuma</b> dessas ações tem efeito:
          as regras ignoram tudo que vier daqui.
        </p>
      </fieldset>

      <div className="manual-nota aviso" style={{ margin: 0 }}>
        Usar isto <b>estraga a progressão</b> da partida em andamento, e fica
        registrado no save.
        {devUsed && <><br /><b>Esta partida já foi alterada antes.</b></>}
      </div>

      <label className="row" style={{ gap: 6, cursor: 'default' }}>
        <input type="checkbox" checked={ciente}
               onChange={(e) => setCiente(e.target.checked)} />
        Entendi, quero editar o estado do jogo
      </label>

      <div>
        <button className="xp" disabled={!ciente} onClick={() => setDevMode(true)}>
          Ativar modo desenvolvedor
        </button>
      </div>
    </div>
  )
}
