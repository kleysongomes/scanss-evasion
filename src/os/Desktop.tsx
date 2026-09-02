/** Area de trabalho: icones, janelas abertas e a barra de tarefas. */

import { useEffect, useState } from 'react'
import { APP_META } from '@/apps/catalog'
import { APP_COMPONENTS, Missing } from '@/apps/registry'
import { useGame } from '@/game/store'
import { Assistant } from './Assistant'
import { HeatBalloon } from './HeatBalloon'
import { MailAlert } from './MailAlert'
import { MissionAlert } from './MissionAlert'
import { appLabel, launchApp } from './launch'
import { Taskbar } from './Taskbar'
import { Window } from './Window'
import { useWindows } from './windows'

export function Desktop() {
  const windows = useWindows((s) => s.windows)
  const activeId = useWindows((s) => s.activeId)
  const setStart = useWindows((s) => s.setStart)
  const assistantOpen = useWindows((s) => s.assistantOpen)
  const paused = useGame((s) => s.paused)
  const setAssistant = useWindows((s) => s.setAssistant)
  const assistantSeen = useGame((s) => s.assistantSeen)
  const [selected, setSelected] = useState<string | null>(null)

  // Na primeira partida o Klipe se apresenta sozinho, como o do Office fazia.
  useEffect(() => {
    if (!assistantSeen) setAssistant(true)
  }, [assistantSeen, setAssistant])

  const shortcuts = APP_META.filter((a) => a.desktop).map((a) => a.id)

  return (
    <div
      className="desktop"
      onPointerDown={() => { setSelected(null); setStart(false) }}
    >
      <div className="desktop-icons">
        {shortcuts.map((id) => {
          const { name, icon } = appLabel(id)
          return (
            <button
              key={id}
              className={`desktop-icon${selected === id ? ' selected' : ''}`}
              onPointerDown={(e) => { e.stopPropagation(); setSelected(id); setStart(false) }}
              onDoubleClick={() => launchApp(id)}
            >
              <span className="glyph">{icon}</span>
              <span className="label">{name}</span>
            </button>
          )
        })}
      </div>

      {windows.map((w) => {
        const Component = APP_COMPONENTS[w.appId]
        return (
          <Window key={w.id} win={w} active={activeId === w.id}>
            {Component ? <Component args={w.args} /> : <Missing appId={w.appId} />}
          </Window>
        )
      })}

      {/* O aviso de e-mail tem prioridade sobre o Klipe: o jogo esta parado. */}
      {paused ? null : assistantOpen && <Assistant />}

      {/* A bandeja empilha os avisos em vez de deixar os tres brigarem pelo
          mesmo canto - o balao do rastro chegava por cima do aviso de e-mail e
          escondia os botoes dele, deixando a pausa sem saida visivel.

          O de missao fica sempre montado: ele mesmo decide quando aparecer (e
          se esconde na pausa). Monta-lo so fora da pausa faria o aviso perder
          justamente o caso comum, em que a missao fecha junto com a chegada de
          um e-mail. */}
      <div className="bandeja-avisos">
        <HeatBalloon />
        <MissionAlert />
        {paused && <MailAlert />}
      </div>

      {!assistantOpen && !paused && (
        <div className="watermark">
          WinDoors XP<br />
          <span>Edição Doméstica · build 2600 · sem registro</span>
        </div>
      )}

      <Taskbar />
    </div>
  )
}
