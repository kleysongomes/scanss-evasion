/** Barra de tarefas: Iniciar, janelas abertas e a bandeja com o medidor do ScanSS. */

import { clockOf, heatColor, useGame } from '@/game/store'
import { launchApp } from './launch'
import { StartMenu } from './StartMenu'
import { useWindows } from './windows'

export function Taskbar() {
  const windows = useWindows((s) => s.windows)
  const activeId = useWindows((s) => s.activeId)
  const startOpen = useWindows((s) => s.startOpen)
  const setStart = useWindows((s) => s.setStart)
  const toggleMinimize = useWindows((s) => s.toggleMinimize)

  const heat = useGame((s) => s.player.heat)
  const balance = useGame((s) => s.player.balance)
  const minutes = useGame((s) => s.minutes)

  return (
    <>
      {startOpen && <StartMenu />}

      <div className="taskbar" onPointerDown={(e) => e.stopPropagation()}>
        <button
          className={`start-button${startOpen ? ' open' : ''}`}
          onClick={() => setStart(!startOpen)}
        >
          <span className="flag">🪟</span> iniciar
        </button>

        <div className="task-buttons">
          {windows.map((w) => (
            <button
              key={w.id}
              className={`task-button${activeId === w.id && !w.minimized ? ' active' : ''}`}
              onClick={() => toggleMinimize(w.id)}
              title={w.title}
            >
              <span>{w.icon}</span>
              <span className="t">{w.title}</span>
            </button>
          ))}
        </div>

        {/* A bandeja inteira e um botao: abre o resumo da situacao. */}
        <button
          className="tray"
          title="Abrir o resumo da situação"
          onClick={() => launchApp('status')}
        >
          <span className="tray-icon">
            <span style={{ color: heatColor(heat) }}>🛡️</span>
            <span style={{ marginLeft: 3 }}>{heat.toFixed(0)}%</span>
          </span>
          <span className="tray-icon">{balance.toLocaleString('pt-BR')} VC</span>
          <span className="clock">{clockOf(minutes)}</span>
        </button>
      </div>
    </>
  )
}
