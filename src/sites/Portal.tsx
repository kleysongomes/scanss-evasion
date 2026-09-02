/**
 * busca.vc - pagina inicial do navegador, no visual dos buscadores de 2003:
 * logo colorido, caixa biselada, abas e resultados como lista de links.
 */

import { useState } from 'react'
import { SITE_LINKS, type SiteProps } from './registry'

const ABAS = ['Web', 'Imagens', 'Grupos', 'Diretório', 'Notícias']

export function Portal({ navigate }: SiteProps) {
  const [q, setQ] = useState('')

  const termo = q.trim().toLowerCase()
  const resultados = termo
    ? SITE_LINKS.filter((s) =>
        (s.url + s.title + s.blurb).toLowerCase().includes(termo))
    : SITE_LINKS

  function pesquisar() {
    // Digitou um endereco direto? vai nele.
    if (termo.endsWith('.vc')) navigate(termo)
  }

  return (
    <div className="web" style={{ background: '#fff', textAlign: 'center',
                                  paddingTop: 22 }}>
      <div style={{ textAlign: 'right', padding: '0 10px 14px', fontSize: 10 }}>
        <a>Preferências</a> &nbsp;|&nbsp; <a>Ferramentas de idioma</a> &nbsp;|&nbsp;{' '}
        <a>Ajuda</a>
      </div>

      <div style={{ fontFamily: '"Times New Roman", Georgia, serif', fontSize: 42,
                    letterSpacing: -2, lineHeight: 1 }}>
        <span style={{ color: '#3366cc' }}>b</span>
        <span style={{ color: '#cc0000' }}>u</span>
        <span style={{ color: '#ff9900' }}>s</span>
        <span style={{ color: '#3366cc' }}>c</span>
        <span style={{ color: '#009900' }}>a</span>
        <span style={{ color: '#cc0000' }}>.vc</span>
      </div>
      <div style={{ fontSize: 10, color: '#767676', marginBottom: 16 }}>
        Pesquisando 1.284.117 páginas da V-Net
      </div>

      {/* abas biseladas */}
      <div style={{ display: 'inline-block', borderBottom: '1px solid #3366cc',
                    paddingBottom: 2, marginBottom: 10 }}>
        {ABAS.map((a, i) => (
          <span key={a} style={{
            display: 'inline-block', padding: '2px 12px', fontSize: 10,
            border: '1px solid #3366cc', borderBottom: 'none', marginRight: 2,
            background: i === 0 ? '#3366cc' : '#e8eefa',
            color: i === 0 ? '#fff' : '#3366cc',
            fontWeight: i === 0 ? 'bold' : 'normal',
          }}>{a}</span>
        ))}
      </div>

      <div style={{ marginBottom: 6 }}>
        <input
          className="fld-old"
          style={{ width: 'min(380px, 70%)', fontSize: 13, padding: 3 }}
          value={q}
          spellCheck={false}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') pesquisar() }}
        />
      </div>
      <div style={{ marginBottom: 22 }}>
        <button className="btn-old" onClick={pesquisar}>Pesquisa busca.vc</button>
        &nbsp;
        <button className="btn-old"
                onClick={() => navigate(resultados[0]?.url ?? 'vbank.vc')}>
          Estou com sorte
        </button>
      </div>

      {/* resultados */}
      <table style={{ margin: '0 auto', width: 'min(560px, 88%)',
                      textAlign: 'left', borderSpacing: 0 }}>
        <tbody>
          <tr>
            <td style={{ background: '#e8eefa', border: '1px solid #3366cc',
                         padding: '2px 7px', fontSize: 10, marginBottom: 8 }}>
              Resultados <b>1 - {resultados.length}</b> de aproximadamente{' '}
              <b>{resultados.length}</b>. Tempo: 0,{12 + resultados.length}s
            </td>
          </tr>
          <tr><td style={{ height: 10 }} /></tr>
          {resultados.map((s) => (
            <tr key={s.url}>
              <td style={{ paddingBottom: 14 }}>
                <a style={{ fontSize: 13 }} onClick={() => navigate(s.url)}>
                  {s.favicon} {s.title}
                </a>
                <div style={{ color: '#333' }}>{s.blurb}</div>
                <div style={{ color: '#008000', fontSize: 10 }}>
                  {s.url} - 4k - <a>Em cache</a> - <a>Páginas semelhantes</a>
                </div>
              </td>
            </tr>
          ))}
          {resultados.length === 0 && (
            <tr><td style={{ color: '#333' }}>
              Sua pesquisa por <b>{q}</b> não encontrou nenhum documento.
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
