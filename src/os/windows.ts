/**
 * Gerenciador de janelas: posicao, tamanho, foco (z-order), minimizar/maximizar.
 *
 * Nao sabe nada sobre o jogo - so sobre janelas. Quem diz "qual componente
 * desenhar dentro" e o registry de apps (`apps/registry.tsx`).
 */

import { create } from 'zustand'

export interface Rect { x: number; y: number; w: number; h: number }

export interface WinState extends Rect {
  id: string
  appId: string
  title: string
  icon: string
  z: number
  minimized: boolean
  maximized: boolean
  /** Parametros da abertura (ex.: qual arquivo o Bloco de Notas deve mostrar). */
  args?: Record<string, unknown>
  /** Geometria guardada antes de maximizar. */
  restore?: Rect
}

export interface OpenOptions {
  title?: string
  icon?: string
  size?: { w: number; h: number }
  args?: Record<string, unknown>
  /** Se ja existe uma janela deste app, foca ela em vez de abrir outra. */
  singleton?: boolean
}

interface WindowStore {
  windows: WinState[]
  activeId: string | null
  zTop: number
  startOpen: boolean
  /** O balao do Klipe esta na tela? */
  assistantOpen: boolean

  open: (appId: string, opts?: OpenOptions) => string
  close: (id: string) => void
  focus: (id: string) => void
  minimize: (id: string) => void
  toggleMinimize: (id: string) => void
  toggleMaximize: (id: string) => void
  move: (id: string, x: number, y: number) => void
  resize: (id: string, w: number, h: number) => void
  setTitle: (id: string, title: string) => void
  setArgs: (id: string, args: Record<string, unknown>) => void
  setStart: (open: boolean) => void
  setAssistant: (open: boolean) => void
  closeAll: () => void
}

let seq = 0

/** Escadinha na abertura, para janelas novas nao caírem exatamente uma sobre a outra. */
function cascade(count: number): { x: number; y: number } {
  const step = (count % 8) * 24
  return { x: 60 + step, y: 40 + step }
}

export const useWindows = create<WindowStore>((set, get) => ({
  windows: [],
  activeId: null,
  zTop: 10,
  startOpen: false,
  assistantOpen: false,

  open: (appId, opts = {}) => {
    if (opts.singleton) {
      const existing = get().windows.find((w) => w.appId === appId)
      if (existing) {
        set((s) => ({
          windows: s.windows.map((w) => w.id !== existing.id ? w : {
            ...w,
            minimized: false,
            z: s.zTop + 1,
            args: opts.args ?? w.args,
          }),
          zTop: s.zTop + 1,
          activeId: existing.id,
          startOpen: false,
        }))
        return existing.id
      }
    }

    const id = `win-${++seq}`
    const size = opts.size ?? { w: 640, h: 440 }
    const pos = cascade(get().windows.length)
    set((s) => ({
      windows: [...s.windows, {
        id,
        appId,
        title: opts.title ?? appId,
        icon: opts.icon ?? '',
        x: pos.x,
        y: pos.y,
        w: size.w,
        h: size.h,
        z: s.zTop + 1,
        minimized: false,
        maximized: false,
        args: opts.args,
      }],
      zTop: s.zTop + 1,
      activeId: id,
      startOpen: false,
    }))
    return id
  },

  close: (id) => set((s) => {
    const windows = s.windows.filter((w) => w.id !== id)
    const activeId = s.activeId === id
      ? (windows.filter((w) => !w.minimized)
          .sort((a, b) => b.z - a.z)[0]?.id ?? null)
      : s.activeId
    return { windows, activeId }
  }),

  focus: (id) => set((s) => {
    if (s.activeId === id) {
      const w = s.windows.find((x) => x.id === id)
      if (w && !w.minimized) return s
    }
    return {
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, z: s.zTop + 1, minimized: false } : w),
      zTop: s.zTop + 1,
      activeId: id,
      startOpen: false,
    }
  }),

  minimize: (id) => set((s) => ({
    windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
    activeId: s.activeId === id ? null : s.activeId,
  })),

  toggleMinimize: (id) => {
    const w = get().windows.find((x) => x.id === id)
    if (!w) return
    if (w.minimized || get().activeId !== id) get().focus(id)
    else get().minimize(id)
  },

  toggleMaximize: (id) => set((s) => ({
    windows: s.windows.map((w) => {
      if (w.id !== id) return w
      if (w.maximized) {
        const r = w.restore ?? { x: 60, y: 40, w: 640, h: 440 }
        return { ...w, maximized: false, ...r, restore: undefined }
      }
      return {
        ...w,
        maximized: true,
        restore: { x: w.x, y: w.y, w: w.w, h: w.h },
      }
    }),
  })),

  move: (id, x, y) => set((s) => ({
    windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
  })),

  resize: (id, w, h) => set((s) => ({
    windows: s.windows.map((x) => (x.id === id ? { ...x, w, h } : x)),
  })),

  setTitle: (id, title) => set((s) => ({
    windows: s.windows.map((w) => (w.id === id ? { ...w, title } : w)),
  })),

  setArgs: (id, args) => set((s) => ({
    windows: s.windows.map((w) => (w.id === id ? { ...w, args } : w)),
  })),

  setStart: (open) => set({ startOpen: open }),

  setAssistant: (open) => set({ assistantOpen: open, startOpen: false }),

  closeAll: () => set({ windows: [], activeId: null }),
}))
