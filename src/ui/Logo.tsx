/**
 * A logo do jogo, em um lugar só.
 *
 * Existe como componente - e nao como duas marcacoes parecidas na vitrine e no
 * jogo - porque logo desenhada em dois lugares deixa de ser a mesma logo no
 * primeiro ajuste que alguem fizer de um lado so.
 *
 * O estilo mora em `styles/logo.css`, carregado pelas duas entradas.
 */

export type TamanhoDaLogo = 'grande' | 'medio' | 'pequeno'

interface Props {
  tamanho?: TamanhoDaLogo
  /** As duas palavras lado a lado, em vez de empilhadas. */
  linha?: boolean
}

export function Logo({ tamanho = 'medio', linha = false }: Props) {
  return (
    <span className={`logo ${tamanho}${linha ? ' linha' : ''}`}>
      <span className="logo-a">ScanSS</span>
      <span className="logo-b">
        Evasion<i className="logo-traco" />
      </span>
    </span>
  )
}
