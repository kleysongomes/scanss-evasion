/**
 * vbank.vc - internet banking no visual de 2003.
 *
 * E aqui que o roubo vira dinheiro: sem uma credencial lida no Bloco de Notas
 * voce nao entra, e sem entrar nao transfere.
 */

import { useState } from 'react'
import { useGame } from '@/game/store'
import type { SiteProps } from './registry'

const SITE = 'vbank.vc'

export function VBank(_props: SiteProps) {
  const game = useGame()
  const user = game.sessions[SITE]

  return (
    <div className="web" style={{ background: '#e8ebf0' }}>
      {/* cabecalho com faixa e barra de menu, como todo banco tinha */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ background: '#003366', padding: '10px 14px', width: 240 }}>
              <span style={{ color: '#fff', fontSize: 21, fontWeight: 'bold',
                             fontFamily: 'Arial, sans-serif', letterSpacing: -1 }}>
                V<span style={{ color: '#ffcc00' }}>-</span>BANK
              </span>
              <div style={{ color: '#99b3cc', fontSize: 9 }}>internet banking</div>
            </td>
            <td style={{ background: 'linear-gradient(180deg,#4b7ab5,#003366)',
                         padding: '10px 14px', textAlign: 'right', color: '#cfe0f2',
                         fontSize: 10 }}>
              Central de Atendimento 0800 000 0000<br />
              <span style={{ color: '#ffcc00' }}>🔒</span> Ambiente seguro · 128 bits
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{
              background: '#c0c0c0', borderTop: '1px solid #fff',
              borderBottom: '1px solid #808080', padding: '3px 14px', fontSize: 10,
            }}>
              <a>Início</a> &nbsp;|&nbsp; <a>Conta Corrente</a> &nbsp;|&nbsp;{' '}
              <a>Investimentos</a> &nbsp;|&nbsp; <a>Empréstimos</a> &nbsp;|&nbsp;{' '}
              <a>Segurança</a>
              {user && (
                <span style={{ float: 'right' }}>
                  <a onClick={() => game.logout(SITE)}>Sair com segurança</a>
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ padding: 14 }}>
        {user ? <LoggedIn user={user} /> : <LoginPage />}
      </div>

      <div className="web-footer">
        V-Bank S.A. — instituição fictícia · Este site existe apenas dentro do jogo<br />
        Melhor visualizado em 800x600 com Chroma 1.0 ou superior
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
function LoginPage() {
  const game = useGame()
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')

  const saved = game.credentials.filter((c) => c.site === SITE)

  function submit() {
    const r = game.login(SITE, user.trim(), pass)
    setError(r.ok ? '' : r.message)
  }

  return (
    <table style={{ borderCollapse: 'separate', borderSpacing: 10, width: '100%' }}>
      <tbody>
        <tr style={{ verticalAlign: 'top' }}>
          <td style={{ width: 300 }}>
            <div className="box">
              <div className="box-title">Acesse sua conta</div>
              <div className="box-body">
                {error && <div className="alert-old err">⚠ {error}</div>}

                <table style={{ borderSpacing: 0 }}>
                  <tbody>
                    <tr>
                      <td style={{ paddingBottom: 6 }}>Usuário:&nbsp;</td>
                      <td style={{ paddingBottom: 6 }}>
                        <input className="fld-old" value={user} spellCheck={false}
                               size={18} onChange={(e) => setUser(e.target.value)} />
                      </td>
                    </tr>
                    <tr>
                      <td>Senha:&nbsp;</td>
                      <td>
                        <input className="fld-old" type="password" value={pass} size={18}
                               onChange={(e) => setPass(e.target.value)}
                               onKeyDown={(e) => { if (e.key === 'Enter') submit() }} />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ marginTop: 12 }}>
                  <button className="btn-old" onClick={submit}>Entrar</button>
                  &nbsp;
                  <button className="btn-old" onClick={() => { setUser(''); setPass('') }}>
                    Limpar
                  </button>
                </div>

                <hr />
                <div style={{ fontSize: 10, color: '#666' }}>
                  🔒 Sua conexão está protegida por certificado <b>VeriSeg</b>.<br />
                  Nunca informe sua senha por e-mail.
                </div>
              </div>
            </div>
          </td>

          <td>
            <div className="box">
              <div className="box-title">🔑 Senhas gravadas neste computador</div>
              <div className="box-body">
                {saved.length === 0 ? (
                  <p style={{ margin: 0, color: '#555' }}>
                    Nenhuma senha gravada. Invada uma máquina, baixe o arquivo de
                    senhas e <b>abra ele no Bloco de Notas</b> — a credencial
                    aparece nesta lista.<br /><br />
                    Se você <b>apagou</b> o arquivo, ele sumiu daqui junto: o
                    preenchimento automático lê o que está no seu disco. Digitar
                    usuário e senha na mão continua funcionando, se você anotou.
                  </p>
                ) : (
                  <table className="tbl-old">
                    <thead>
                      <tr><th>Usuário</th><th>Titular</th><th style={{ width: 90 }}>Ação</th></tr>
                    </thead>
                    <tbody>
                      {saved.map((c) => (
                        <tr key={c.user}>
                          <td><b>{c.user}</b></td>
                          <td>
                            {c.owner}
                            {game.drained.includes(c.user) && (
                              <span style={{ color: '#999' }}> (zerada)</span>
                            )}
                          </td>
                          <td>
                            <button className="btn-old"
                                    onClick={() => { setUser(c.user); setPass(c.pass); setError('') }}>
                              Preencher
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {saved.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 10, color: '#777' }}>
                    Esta lista some se você apagar o arquivo de senhas do seu
                    disco — mas guardá-lo lá também gera rastro.
                  </div>
                )}
              </div>
            </div>

            <div className="box">
              <div className="box-title">Sua conta laranja</div>
              <div className="box-body">
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr>
                      <td style={{ fontSize: 20, fontFamily: 'var(--xp-mono)',
                                   color: '#003366', width: 130 }}>
                        {game.player.muleAccount}
                      </td>
                      <td style={{ color: '#555' }}>
                        Use este número como <b>conta de destino</b>. O dinheiro
                        cai direto no seu saldo em V-Coin.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

// ---------------------------------------------------------------------------
// Area logada
// ---------------------------------------------------------------------------
function LoggedIn({ user }: { user: string }) {
  const game = useGame()
  const acc = game.accounts[user]
  const [dest, setDest] = useState('')
  const [amount, setAmount] = useState('')
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  if (!acc) return <div>Conta indisponível.</div>

  const shown = game.drained.includes(user) ? 0 : acc.balance

  function submit() {
    const r = game.transfer(user, dest, Number(amount))
    setResult(r)
    if (r.ok) { setAmount(''); setDest('') }
  }

  return (
    <>
      <div style={{ background: '#ffffcc', border: '1px solid #999',
                    padding: '4px 9px', marginBottom: 10, fontSize: 10 }}>
        Bem-vindo(a), <b>{acc.holder}</b>. Seu último acesso foi em 14/03 às 21:07.
      </div>

      <table style={{ borderCollapse: 'separate', borderSpacing: 10, width: '100%' }}>
        <tbody>
          <tr style={{ verticalAlign: 'top' }}>
            <td style={{ width: 300 }}>
              <div className="box">
                <div className="box-title">Saldo em conta corrente</div>
                <div className="box-body">
                  <table className="tbl-old">
                    <tbody>
                      <tr><td>Titular</td><td><b>{acc.holder}</b></td></tr>
                      <tr><td>Agência / Conta</td>
                          <td className="mono">0001 / {acc.number}</td></tr>
                      <tr><td>Saldo disponível</td>
                          <td style={{ fontSize: 15, fontWeight: 'bold',
                                       color: shown > 0 ? '#006600' : '#cc0000' }}>
                            {shown.toLocaleString('pt-BR')} VC
                          </td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </td>

            <td>
              <div className="box">
                <div className="box-title">Transferência entre contas</div>
                <div className="box-body">
                  {result && (
                    <div className={`alert-old ${result.ok ? 'ok' : 'err'}`}>
                      {result.ok ? '✔' : '⚠'} {result.message}
                    </div>
                  )}

                  <table style={{ borderSpacing: 0 }}>
                    <tbody>
                      <tr>
                        <td style={{ paddingBottom: 6 }}>Conta de destino:&nbsp;</td>
                        <td style={{ paddingBottom: 6 }}>
                          <input className="fld-old" size={14} value={dest}
                                 placeholder="0000-0000" spellCheck={false}
                                 onChange={(e) => setDest(e.target.value)} />
                        </td>
                      </tr>
                      <tr>
                        <td>Valor (VC):&nbsp;</td>
                        <td>
                          <input className="fld-old" size={14} value={amount}
                                 inputMode="numeric"
                                 onChange={(e) => setAmount(e.target.value)} />
                          &nbsp;
                          <button className="btn-old"
                                  onClick={() => setAmount(String(shown))}>
                            tudo
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ marginTop: 12 }}>
                    <button className="btn-old" disabled={shown <= 0} onClick={submit}>
                      Confirmar transferência
                    </button>
                  </div>

                  <hr />
                  <div style={{ fontSize: 10, color: '#cc0000' }}>
                    <span className="blink">⚠</span> Todas as transferências são
                    registradas e monitoradas. Quanto maior a fatia levada de uma
                    vez, mais rastro o ScanSS acumula.
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  )
}
