/**
 * Abrir um app pelo id, venha ele do catalogo de programas ou do mercado negro.
 *
 * Centralizado aqui porque tres lugares precisam disso: os icones da area de
 * trabalho, o menu Iniciar e o Painel de Controle.
 */

import { APP_BY_ID } from '@/apps/catalog'
import { useWindows } from './windows'

export interface LaunchArgs { args?: Record<string, unknown> }

export function launchApp(appId: string, extra: LaunchArgs = {}): void {
  const { open } = useWindows.getState()

  const app = APP_BY_ID[appId]
  if (!app) return
  open(appId, {
    title: app.name,
    icon: app.icon,
    size: app.size,
    singleton: app.singleton,
    args: extra.args,
  })
}

/** Icone e nome de um app, para desenhar atalhos. */
export function appLabel(appId: string): { name: string; icon: string } {
  const app = APP_BY_ID[appId]
  return app ? { name: app.name, icon: app.icon } : { name: appId, icon: '❔' }
}
