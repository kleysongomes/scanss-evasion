import { registerSW } from 'virtual:pwa-register'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/logo.css'
import './styles/xp.css'

/**
 * Guarda o jogo para abrir sem rede, e troca de versão sozinho.
 *
 * `immediate` registra na hora em vez de esperar o `load`: a primeira visita é
 * a única chance de guardar tudo antes de alguém fechar a aba.
 */
registerSW({ immediate: true })
import './styles/retro-web.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
