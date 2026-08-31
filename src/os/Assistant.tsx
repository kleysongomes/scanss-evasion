/**
 * O convite do Klipe: aparece uma vez, na primeira partida, oferecendo o
 * Manual do Operador.
 *
 * De proposito NAO e um sistema de dicas soltas - o tutorial de verdade e o
 * manual em `apps/Tutorial.tsx`. Aqui e so a porta de entrada.
 */

import { useEffect } from 'react'
import { useGame } from '@/game/store'
import { Klipe } from './Klipe'
import { launchApp } from './launch'
import { useWindows } from './windows'

export function Assistant() {
  const seeAssistant = useGame((s) => s.seeAssistant)
  const setAssistant = useWindows((s) => s.setAssistant)

  // Marca que ja apareceu, para nao abrir sozinho de novo.
  // A dependencia e a acao (referencia estavel), nunca o estado inteiro.
  useEffect(() => { seeAssistant() }, [seeAssistant])

  function abrirManual() {
    launchApp('tutorial')
    setAssistant(false)
  }

  return (
    <div className="assistente">
      <div className="balao">
        <div className="balao-titulo">Parece que você quer roubar um banco!</div>

        <div className="balao-corpo">
          Este computador é o jogo inteiro: você invade pelo Prompt de Comando,
          pega os arquivos no Meu Computador e tira o dinheiro pelo navegador.
          <br /><br />
          Nunca jogou? Eu te explico tudo, tela por tela.
        </div>

        <div className="balao-acoes">
          <button className="xp" onClick={abrirManual}>Abrir o manual</button>
          <button className="xp" onClick={() => setAssistant(false)}>Agora não</button>
        </div>

        <div className="balao-rodape">
          Depois é só chamar em <b>iniciar › Ajuda e suporte</b>.
        </div>
      </div>

      <div onClick={abrirManual} title="Abrir o Manual do Operador">
        <Klipe />
      </div>
    </div>
  )
}
