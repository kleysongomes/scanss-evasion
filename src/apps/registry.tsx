/** Liga o id do app ao componente que desenha o miolo da janela. */

import type { ComponentType } from 'react'
import { Browser } from './Browser'
import { DevTools } from './DevTools'
import { Explorer } from './Explorer'
import { Notepad } from './Notepad'
import { Painel } from './Painel'
import { Status } from './Status'
import { NetRipper } from './NetRipper'
import { Tutorial } from './Tutorial'

export interface AppProps {
  args?: Record<string, unknown>
}

export const APP_COMPONENTS: Record<string, ComponentType<AppProps>> = {
  browser: Browser,
  netripper: NetRipper,
  explorer: Explorer,
  notepad: Notepad,
  painel: Painel,
  status: Status,
  dev: DevTools,
  tutorial: Tutorial,
}

export function Missing({ appId }: { appId: string }) {
  return (
    <div style={{ padding: 16 }}>
      O aplicativo <b>{appId}</b> não está instalado neste micro.
    </div>
  )
}
