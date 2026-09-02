/**
 * noticias.vc - portal de noticias no visual denso de 2003: faixa colorida,
 * coluna de links a esquerda, manchetes em tabela.
 *
 * E o termometro narrativo: quanto mais rastro e mais contas zeradas, mais o
 * noticiario aperta.
 */

import { clockOf, heatLevel, useGame } from '@/game/store'
import type { SiteProps } from './registry'

const SECOES = ['Últimas', 'Economia', 'Tecnologia', 'Segurança', 'Cidades',
                'Esportes', 'Classificados', 'Horóscopo']

export function News(_props: SiteProps) {
  const game = useGame()
  const level = heatLevel(game.player.heat)
  const hits = game.drained.length
  const invaded = game.machines.filter((m) => m.exploited).length

  const manchetes: { tag: string; cor: string; title: string; body: string }[] = []

  if (level === 'critico') {
    manchetes.push({
      tag: 'URGENTE', cor: '#cc0000',
      title: 'V-Sec confirma operação contra invasor não identificado',
      body: 'Fontes internas afirmam que o sistema ScanSS já isolou a faixa de IP ' +
            'utilizada nos ataques. A prisão seria "questão de horas".',
    })
  } else if (level === 'alerta') {
    manchetes.push({
      tag: 'SEGURANÇA', cor: '#cc6600',
      title: 'ScanSS eleva nível de monitoramento na rede metropolitana',
      body: 'A V-Sec informou que padrões anômalos de tráfego acionaram o ' +
            'protocolo de rastreamento reforçado.',
    })
  }

  if (hits > 0) {
    const vitimas = game.drained.map((u) => game.accounts[u]?.holder)
      .filter(Boolean).join(', ')
    manchetes.push({
      tag: 'ECONOMIA', cor: '#006699',
      title: `${hits} correntista(s) do V-Bank relatam contas zeradas`,
      body: `Clientes afetados: ${vitimas}. O banco alega que "não houve falha ` +
            'nos sistemas" e orienta a troca imediata de senhas.',
    })
  }

  if (invaded >= 3) {
    manchetes.push({
      tag: 'TECNOLOGIA', cor: '#006699',
      title: 'Onda de invasões atinge escritórios da zona norte',
      body: 'Especialistas apontam senhas anotadas em arquivos de texto como a ' +
            'porta de entrada mais comum.',
    })
  }

  manchetes.push({
    tag: 'ECONOMIA', cor: '#006699',
    title: 'V-Coin fecha o dia em leve alta',
    body: 'A moeda virtual segue como principal meio de pagamento no comércio ' +
          'digital, apesar das críticas do setor bancário.',
  })

  return (
    <div className="web" style={{ background: '#fff' }}>
      {/* faixa do portal */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ background: '#cc0000', padding: '8px 12px', width: 250 }}>
              <span style={{ color: '#fff', fontFamily: 'Arial, sans-serif',
                             fontSize: 22, fontWeight: 'bold', letterSpacing: -1 }}>
                notícias<span style={{ color: '#ffcc00' }}>.vc</span>
              </span>
            </td>
            <td style={{ background: '#cc0000', textAlign: 'right', padding: '8px 12px',
                         color: '#ffcccc', fontSize: 10 }}>
              Edição atualizada às {clockOf(game.minutes)} · sábado, 14 de março
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ background: '#333', padding: '3px 12px',
                                     fontSize: 10, color: '#fff' }}>
              {SECOES.map((s, i) => (
                <span key={s}>
                  {i > 0 && <span style={{ color: '#777' }}> | </span>}
                  <a style={{ color: i === 0 ? '#ffcc00' : '#fff' }}>{s}</a>
                </span>
              ))}
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderSpacing: 0 }}>
        <tbody>
          <tr style={{ verticalAlign: 'top' }}>
            {/* coluna de servicos, obrigatoria em qualquer portal de 2003 */}
            <td style={{ width: 152, background: '#eef1f5', padding: 8,
                         borderRight: '1px solid #ccc' }}>
              <div className="box" style={{ marginBottom: 8 }}>
                <div className="box-title" style={{ fontSize: 10 }}>SERVIÇOS</div>
                <div className="box-body" style={{ padding: 6, fontSize: 10 }}>
                  » <a>Previsão do tempo</a><br />
                  » <a>Cotação do V-Coin</a><br />
                  » <a>Loterias</a><br />
                  » <a>Trânsito</a><br />
                  » <a>Bate-papo</a>
                </div>
              </div>

              <div className="box">
                <div className="box-title" style={{ fontSize: 10,
                     background: 'linear-gradient(180deg,#cc4444,#990000)' }}>
                  ENQUETE
                </div>
                <div className="box-body" style={{ padding: 6, fontSize: 10 }}>
                  Você se sente seguro ao usar internet banking?<br /><br />
                  <label><input type="radio" name="q" /> Sim</label><br />
                  <label><input type="radio" name="q" /> Não</label><br />
                  <label><input type="radio" name="q" /> Não uso</label><br />
                  <button className="btn-old" style={{ marginTop: 6 }}>Votar</button>
                </div>
              </div>
            </td>

            <td style={{ padding: 12 }}>
              {manchetes.map((m, i) => (
                <div key={i} style={{ marginBottom: 18,
                                      paddingBottom: 14,
                                      borderBottom: '1px dotted #bbb' }}>
                  <span style={{ background: m.cor, color: '#fff', fontSize: 9,
                                 padding: '1px 5px', fontWeight: 'bold' }}>
                    {m.tag}
                  </span>
                  <h2 style={{ margin: '6px 0 4px', fontSize: i === 0 ? 15 : 13 }}>
                    <a>{m.title}</a>
                  </h2>
                  <p style={{ margin: 0, color: '#333' }}>{m.body}</p>
                  <div style={{ fontSize: 10, marginTop: 4 }}>
                    <a>leia mais »</a>
                  </div>
                </div>
              ))}

              <div style={{ fontSize: 10, color: '#666' }}>
                Redação notícias.vc — todo o conteúdo desta página é ficcional.
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
