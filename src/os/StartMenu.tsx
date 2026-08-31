/** Menu Iniciar: programas fixos a esquerda, lugares e ferramentas a direita. */

import { APP_META } from '@/apps/catalog'
import { BRANCHES, levelOf, skillsOf } from '@/game/skills'
import { useGame } from '@/game/store'
import { launchApp } from './launch'
import { useWindows } from './windows'

export function StartMenu() {
  const setStart = useWindows((s) => s.setStart)
  const closeAll = useWindows((s) => s.closeAll)
  const handle = useGame((s) => s.player.handle)
  const skills = useGame((s) => s.skills)
  const reset = useGame((s) => s.reset)

  const pinned = APP_META.filter((a) => a.start && a.id !== 'tutorial')

  function run(appId: string) {
    launchApp(appId)
    setStart(false)
  }

  return (
    <div className="start-menu" onPointerDown={(e) => e.stopPropagation()}>
      <div className="start-header">
        <span className="avatar">🕶️</span>
        <span>{handle}</span>
      </div>

      <div className="start-columns">
        <div className="start-col left">
          {pinned.map((a) => (
            <button key={a.id} className="start-item" onClick={() => run(a.id)}>
              <span className="glyph">{a.icon}</span>
              <span className="nm">
                {a.name}
                <span className="sub">{a.description}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="start-col right">
          <div style={{ padding: '4px 7px', fontSize: 10, color: '#4a6ea8' }}>
            MEUS PROGRAMAS
          </div>
          {BRANCHES.map((b) => {
            const nivel = levelOf(skills, b.id)
            return (
              <button key={b.id} className="start-item" onClick={() => run('painel')}>
                <span className="glyph">{b.icon}</span>
                <span className="nm">
                  {b.name}
                  <span className="sub">
                    {nivel ? `nível ${nivel} de ${skillsOf(b.id).length}` : 'não instalado'}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="start-ajuda">
        <button className="start-item" onClick={() => run('tutorial')}>
          <span className="glyph">📎</span>
          <span className="nm">
            Ajuda e suporte
            <span className="sub">Manual do Operador — como jogar</span>
          </span>
        </button>
      </div>

      <div className="start-footer">
        <button className="action" onClick={() => run('dev')}
                title="Inspecionar e editar o estado do jogo">
          Desenvolvedor
        </button>
        <span style={{ flex: 1 }} />
        <button className="action" onClick={() => { closeAll(); setStart(false) }}>
          Fazer logoff
        </button>
        <button
          className="action"
          onClick={() => {
            if (confirm('Desligar formata o micro e apaga todo o progresso. Continuar?')) {
              reset(); closeAll(); setStart(false)
            }
          }}
        >
          Desligar
        </button>
      </div>
    </div>
  )
}
