/**
 * Registro dos sites do navegador falso.
 *
 * Adicionar um site novo = criar o componente e por uma linha em SITES. O
 * navegador nao precisa saber de mais nada.
 */

import type { ComponentType } from 'react'
import { DarkMarket } from './DarkMarket'
import { News } from './News'
import { Portal } from './Portal'
import { VBank } from './VBank'

export interface SiteProps {
  /** Navegar para outro dominio a partir da propria pagina. */
  navigate: (url: string) => void
}

export interface SiteDef {
  title: string
  favicon: string
  /** Resumo mostrado na pagina de busca. */
  blurb: string
  component: ComponentType<SiteProps>
  /** Aparece na lista da pagina inicial. */
  listed?: boolean
}

export const HOME = 'busca.vc'

export const SITES: Record<string, SiteDef> = {
  'busca.vc': {
    title: 'busca.vc', favicon: '🔍', blurb: 'Página inicial.',
    component: Portal,
  },
  'vbank.vc': {
    title: 'V-Bank · Internet Banking', favicon: '🏦', listed: true,
    blurb: 'Acesse sua conta, consulte o saldo e faça transferências.',
    component: VBank,
  },
  'darkmarket.vc': {
    title: 'darkmarket', favicon: '🕷️', listed: true,
    blurb: 'Exploits, utilitários e o que mais você não deveria comprar.',
    component: DarkMarket,
  },
  'noticias.vc': {
    title: 'O Diário da Rede', favicon: '📰', listed: true,
    blurb: 'As manchetes do dia — inclusive as que falam de você.',
    component: News,
  },
}

/** Links exibidos na pagina inicial. */
export const SITE_LINKS = Object.entries(SITES)
  .filter(([, s]) => s.listed)
  .map(([url, s]) => ({ url, ...s }))
