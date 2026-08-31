/**
 * Metadados dos aplicativos (sem componentes React).
 *
 * Fica separado do `registry.tsx` de proposito: assim o Painel de Controle pode
 * listar os apps sem criar import circular com as janelas.
 */

export interface AppMeta {
  id: string
  name: string
  icon: string
  description: string
  size: { w: number; h: number }
  /** Abrir de novo foca a janela existente em vez de duplicar. */
  singleton?: boolean
  /** Ganha icone na area de trabalho. */
  desktop?: boolean
  /** Aparece na coluna esquerda do menu Iniciar. */
  start?: boolean
}

export const APP_META: AppMeta[] = [
  {
    id: 'browser', name: 'Chroma', icon: '🌐',
    description: 'Navegador. É por aqui que o dinheiro sai do banco.',
    size: { w: 860, h: 560 }, desktop: true, start: true,
  },
  {
    id: 'netripper', name: 'NetRipper', icon: '📡',
    description: 'Suas ferramentas de invasão, num lugar só.',
    size: { w: 880, h: 580 }, singleton: true, desktop: true, start: true,
  },
  {
    id: 'explorer', name: 'Meu Computador', icon: '💻',
    description: 'Disco local e o disco da máquina invadida.',
    size: { w: 780, h: 500 }, singleton: true, desktop: true, start: true,
  },
  {
    id: 'painel', name: 'Painel de Controle', icon: '⚙️',
    description: 'Programas instalados e manutenção do micro.',
    size: { w: 560, h: 440 }, singleton: true, start: true,
  },
  {
    id: 'tutorial', name: 'Manual do Operador', icon: '📎',
    description: 'Como jogar: cada tela e cada botão, explicados.',
    size: { w: 780, h: 560 }, singleton: true, desktop: true, start: true,
  },
  {
    id: 'status', name: 'Situação', icon: '📊',
    description: 'Rastro, dinheiro e programas numa tela só.',
    size: { w: 560, h: 560 }, singleton: true, start: true,
  },
  {
    id: 'dev', name: 'Ferramentas de Desenvolvedor', icon: '🛠️',
    description: 'Inspecionar e editar o estado do jogo.',
    size: { w: 600, h: 620 }, singleton: true,
  },
  {
    id: 'notepad', name: 'Bloco de Notas', icon: '📄',
    description: 'Abre os arquivos baixados.',
    size: { w: 480, h: 380 },
  },
]

export const APP_BY_ID = Object.fromEntries(APP_META.map((a) => [a.id, a]))
