/** Barra de tarefas: Iniciar, janelas abertas e a bandeja com o medidor do ScanSS. */

import { useEffect, useRef, useState } from 'react'
import { clockOf, heatColor, heatLevel, useGame } from '@/game/store'
import { launchApp } from './launch'
import { StartMenu } from './StartMenu'
import { useWindows } from './windows'

const ALERTS: Record<string, { title: string; body: string }> = {
  atencao: {
    title: 'ScanSS · atividade registrada',
    body: 'Seus pacotes estão sendo amostrados. Nada grave ainda — mas o relógio começou.',
  },
  alerta: {
    title: 'ScanSS · rastreamento ativo',
    body: 'A V-Sec está correlacionando seus saltos. Considere limpar os logs.',
  },
  critico: {
    title: 'ScanSS · localização iminente',
    body: 'Eles estão a poucos saltos. Limpe os logs AGORA ou eles chegam aqui.',
  },
}

export function Taskbar() {
  const windows = useWindows((s) => s.windows)
  const activeId = useWindows((s) => s.activeId)
  const startOpen = useWindows((s) => s.startOpen)
  const setStart = useWindows((s) => s.setStart)
  const toggleMinimize = useWindows((s) => s.toggleMinimize)

  const heat = useGame((s) => s.player.heat)
  const balance = useGame((s) => s.player.balance)
  const minutes = useGame((s) => s.minutes)

  const level = heatLevel(heat)
  const [balloon, setBalloon] = useState<{ title: string; body: string } | null>(null)
  const lastLevel = useRef(level)

  // Avisa quando o rastreamento sobe de faixa (nunca quando desce).
  useEffect(() => {
    const order = ['calmo', 'atencao', 'alerta', 'critico']
    if (order.indexOf(level) > order.indexOf(lastLevel.current) && ALERTS[level]) {
      setBalloon(ALERTS[level])
      const t = setTimeout(() => setBalloon(null), 9000)
      lastLevel.current = level
      return () => clearTimeout(t)
    }
    lastLevel.current = level
  }, [level])

  return (
    <>
      {startOpen && <StartMenu />}

      {balloon && (
        <div className="balloon" onClick={() => setBalloon(null)}>
          <div className="title">
            <span style={{ color: heatColor(heat) }}>🛡️</span>
            {balloon.title}
          </div>
          <div style={{ lineHeight: 1.5 }}>{balloon.body}</div>
        </div>
      )}

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
