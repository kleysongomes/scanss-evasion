/** Bloco de Notas. Ler um arquivo de senhas aqui e o que libera o login no banco. */

import type { VFile } from '@/game/types'

interface Props { args?: Record<string, unknown> }

export function Notepad({ args }: Props) {
  const file = args?.file as VFile | undefined

  if (!file) {
    return <div className="sunken grow" style={{ padding: 6 }} />
  }

  return (
    <div className="grow col" style={{ gap: 3 }}>
      <div className="row" style={{ padding: '1px 4px', gap: 12, borderBottom: '1px solid #d0d0bf' }}>
        <span>Arquivo</span><span>Editar</span><span>Formatar</span><span>Ajuda</span>
      </div>

      <div
        className="sunken grow scroll mono"
        style={{ padding: 6, whiteSpace: 'pre-wrap', userSelect: 'text', fontSize: 12 }}
      >
        {file.content}
      </div>

      {file.grants && (
        <div style={{ padding: '5px 7px', background: '#ffffe1', border: '1px solid #d5c98a' }}>
          🔑 Credencial salva no gerenciador do navegador. Abra o <b>Chroma</b>,
          vá em <b>{file.grants.site}</b> e entre como <b>{file.grants.user}</b>.
        </div>
      )}

      <div className="statusbar">
        <span className="grow">{file.name}</span>
        <span>Ln 1, Col 1</span>
      </div>
    </div>
  )
}
