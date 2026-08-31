/** Tela azul: o fim de jogo do ScanSS Evasion. */

import { useGame } from '@/game/store'
import { useWindows } from './windows'

export function Bsod() {
  const game = useGame()
  const closeAll = useWindows((s) => s.closeAll)

  return (
    <div
      style={{
        height: '100%', background: '#0000aa', color: '#fff',
        fontFamily: 'var(--xp-mono)', fontSize: 14, lineHeight: 1.7,
        padding: '10vh 12vw', cursor: 'default',
      }}
      onClick={() => { game.reset(); closeAll() }}
    >
      <div style={{ background: '#aaa', color: '#0000aa', display: 'inline-block',
                    padding: '0 8px', marginBottom: 26 }}>
        SCANSS
      </div>

      <p>
        O ScanSS puxou a linha até esta casa. A conexão foi cortada e o micro,
        apreendido.
      </p>

      <p>
        Se esta é a primeira vez que você vê esta tela, arrume outro micro e seja
        mais cuidadoso. Se ela aparece de novo, siga estes passos:
      </p>

      <p style={{ marginLeft: 24 }}>
        · Limpe os logs antes que o rastro passe de 60%.<br />
        · Compre o Proxy_Chain: ele corta pela metade todo rastro gerado.<br />
        · Não leve o saldo inteiro de uma conta só de uma vez.
      </p>

      <p style={{ marginTop: 26 }}>
        Sessão encerrada: {game.machines.filter((m) => m.exploited).length} host(s)
        invadido(s), {game.player.balance.toLocaleString('pt-BR')} VC perdido(s).
      </p>

      <p style={{ marginTop: 34, opacity: .85 }}>
        Clique em qualquer lugar para começar de novo em outro micro.
      </p>
    </div>
  )
}
