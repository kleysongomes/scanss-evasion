/**
 * "Sons e dispositivos de áudio" - as opções de som, no formato de applet do
 * Painel de Controle.
 *
 * O nome e o desenho são os do sistema da época de propósito: configuração de
 * jogo dentro de um sistema operacional falso tem que morar onde a configuração
 * moraria, e não numa tela de menu que denuncia que aquilo ali é um jogo.
 *
 * A lista de sons com botão de tocar também é dali: era assim que se escolhia
 * o esquema de sons. Aqui ela serve para a pessoa regular o volume ouvindo, em
 * vez de arrastar a barrinha no escuro.
 */

import { useSom } from '@/audio/opcoes'
import * as som from '@/audio/sons'

interface Efeito {
  nome: string
  quando: string
  tocar: () => void
}

const EFEITOS: Efeito[] = [
  { nome: 'Iniciar o sistema', quando: 'quando a área de trabalho aparece',
    tocar: som.ligar },
  { nome: 'Digitação', quando: 'na abertura e no prólogo', tocar: som.tecla },
  { nome: 'Varredura concluída', quando: 'o Rastreador terminou', tocar: som.ping },
  { nome: 'Acesso obtido', quando: 'a porta abriu', tocar: som.acesso },
  { nome: 'Transferência', quando: 'dinheiro caindo na sua conta',
    tocar: som.dinheiroEntrando },
  { nome: 'Prejuízo', quando: 'golpe, ou ataque que passou',
    tocar: som.dinheiroSaindo },
  { nome: 'Venda', quando: 'arquivo vendido, prêmio de missão',
    tocar: som.moedinha },
  { nome: 'Compra', quando: 'nível novo no darkmarket', tocar: som.compra },
  { nome: 'Mensagem nova', quando: 'chegou e-mail', tocar: som.correio },
  { nome: 'Missão concluída', quando: 'fechou uma do quadro', tocar: som.missao },
  { nome: 'Alerta de rastreamento', quando: 'o ScanSS chegou perto',
    tocar: som.sirene },
  { nome: 'Falha do sistema', quando: 'fim de jogo', tocar: som.travou },
]

/** Uma barrinha de volume, com o número do lado. */
function Barra({ rotulo, valor, onChange, desligado }: {
  rotulo: string
  valor: number
  onChange: (v: number) => void
  desligado: boolean
}) {
  return (
    <div className="row" style={{ gap: 10, alignItems: 'center' }}>
      <span style={{ width: 78 }}>{rotulo}</span>
      <input
        type="range" min={0} max={100} step={1}
        value={Math.round(valor * 100)}
        disabled={desligado}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        style={{ flex: 1 }}
      />
      <span className="mono" style={{ width: 42, textAlign: 'right' }}>
        {Math.round(valor * 100)}%
      </span>
    </div>
  )
}

export function Audio() {
  const opcoes = useSom()

  return (
    <div className="grow col scroll" style={{ gap: 4, padding: 6 }}>
      <div style={{ fontSize: 15, fontWeight: 'bold', color: '#0046d5' }}>
        Sons e dispositivos de áudio
      </div>

      <fieldset className="xp">
        <legend>Volume do dispositivo</legend>

        <label className="row" style={{ gap: 6, marginBottom: 10 }}>
          <input
            type="checkbox"
            checked={opcoes.mudo}
            onChange={(e) => opcoes.setMudo(e.target.checked)}
          />
          Sem áudio
        </label>

        <div className="col" style={{ gap: 8 }}>
          <Barra rotulo="Música" valor={opcoes.musica} desligado={opcoes.mudo}
                 onChange={opcoes.setMusica} />
          <Barra rotulo="Efeitos" valor={opcoes.efeitos} desligado={opcoes.mudo}
                 onChange={opcoes.setEfeitos} />
        </div>

        <div className="muted" style={{ marginTop: 8 }}>
          A música acompanha o rastreamento: quanto mais perto eles chegam, mais
          apressada ela fica.
        </div>
      </fieldset>

      <fieldset className="xp">
        <legend>Eventos de programa</legend>
        <table className="painel-tabela">
          <tbody>
            {EFEITOS.map((e) => (
              <tr key={e.nome}>
                <td><b>{e.nome}</b><div className="muted">{e.quando}</div></td>
                <td style={{ width: 74 }}>
                  <button
                    className="xp narrow"
                    disabled={opcoes.mudo || opcoes.efeitos === 0}
                    onClick={e.tocar}
                  >
                    Tocar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </fieldset>

      <div className="muted" style={{ padding: '2px 4px 6px' }}>
        Nenhum som deste micro é gravado: todos são gerados na hora, do jeito
        que um alto-falante de 2003 faria.
      </div>
    </div>
  )
}
