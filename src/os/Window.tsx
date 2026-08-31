/** Moldura da janela: barra de titulo, arrastar, redimensionar e os 3 botoes. */

import { useCallback, useRef, type ReactNode } from 'react'
import { useWindows, type WinState } from './windows'

export const TASKBAR_H = 30

interface Props {
  win: WinState
  active: boolean
  children: ReactNode
}

export function Window({ win, active, children }: Props) {
  const { focus, close, minimize, toggleMaximize, move, resize } = useWindows()
  const drag = useRef<{ dx: number; dy: number } | null>(null)
  const stretch = useRef<{ x: number; y: number; w: number; h: number } | null>(null)

  const onTitlePointerDown = useCallback((e: React.PointerEvent) => {
    if (win.maximized) return
    if ((e.target as HTMLElement).closest('.title-btn')) return
    focus(win.id)
    drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [focus, win.id, win.x, win.y, win.maximized])

  const onTitlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current) return
    const maxX = window.innerWidth - 80
    const maxY = window.innerHeight - TASKBAR_H - 28
    move(
      win.id,
      Math.min(maxX, Math.max(-win.w + 80, e.clientX - drag.current.dx)),
      Math.min(maxY, Math.max(0, e.clientY - drag.current.dy)),
    )
  }, [move, win.id, win.w])

  const endDrag = useCallback(() => { drag.current = null }, [])

  const onResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    focus(win.id)
    stretch.current = { x: e.clientX, y: e.clientY, w: win.w, h: win.h }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [focus, win.id, win.w, win.h])

  const onResizePointerMove = useCallback((e: React.PointerEvent) => {
    const s = stretch.current
    if (!s) return
    resize(
      win.id,
      Math.max(240, s.w + (e.clientX - s.x)),
      Math.max(140, s.h + (e.clientY - s.y)),
    )
  }, [resize, win.id])

  const endResize = useCallback(() => { stretch.current = null }, [])

  const geometry = win.maximized
    ? { left: 0, top: 0, width: '100%', height: `calc(100% - ${TASKBAR_H}px)` }
    : { left: win.x, top: win.y, width: win.w, height: win.h }

  return (
    <div
      className={`window${active ? '' : ' inactive'}${win.maximized ? ' maximized' : ''}`}
      style={{ ...geometry, zIndex: win.z, display: win.minimized ? 'none' : 'flex' }}
      onPointerDown={() => focus(win.id)}
    >
      <div
        className="title-bar"
        onPointerDown={onTitlePointerDown}
        onPointerMove={onTitlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => toggleMaximize(win.id)}
      >
        <span className="icon">{win.icon}</span>
        <span className="text">{win.title}</span>
        <div className="title-buttons">
          <button className="title-btn min" title="Minimizar"
                  onClick={() => minimize(win.id)} />
          <button className={`title-btn ${win.maximized ? 'restore' : 'max'}`}
                  title={win.maximized ? 'Restaurar' : 'Maximizar'}
                  onClick={() => toggleMaximize(win.id)} />
          <button className="title-btn close" title="Fechar"
                  onClick={() => close(win.id)} />
        </div>
      </div>

      <div className="window-body">{children}</div>

      {!win.maximized && (
        <div
          className="resize-handle"
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={endResize}
          onPointerCancel={endResize}
        />
      )}
    </div>
  )
}
