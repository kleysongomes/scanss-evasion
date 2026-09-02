/**
 * O menu principal, antes de qualquer coisa.
 *
 * Duas coisas importantes aprendidas na marra:
 *
 * 1. Se existe save, quem decide e o campo `hasSave` lido A CADA RENDER. A
 *    primeira versao decidia no inicializador do `useState`, que roda uma vez
 *    na montagem - se a rehidratacao do save chegasse depois, o menu ficava
 *    preso na tela de apelido para sempre.
 * 2. `reset()` so e chamado ao CONFIRMAR um jogo novo. Antes ele rodava junto
 *    com o apelido, entao passar pela tela de apelido apagava o save.
 */

import { useState } from 'react'
import { totalEvidence } from '@/game/fs'
import { clockOf, heatColor, useGame } from '@/game/store'

type Tela = 'menu' | 'novo' | 'ajuda' | 'creditos'

export function Lobby() {
  const [tela, setTela] = useState<Tela>('menu')

  return (
    <div className="lobby">
      <div className="lobby-faixa topo" />

      <div className="lobby-corpo">
        <div className="lobby-marca">
          <div className="nome">
            WinDoors<span className="xpzinho">XP</span>
          </div>
          <div className="sub">ScanSS Evasion</div>
          <div className="versao">versão 2.0 · 2003</div>
        </div>

        <div className="lobby-divisor" />

        <div className="lobby-painel">
          {tela === 'menu' && <Menu ir={setTela} />}
          {tela === 'novo' && <NovoJogo voltar={() => setTela('menu')} />}
          {tela === 'ajuda' && <Ajuda voltar={() => setTela('menu')} />}
          {tela === 'creditos' && <Creditos voltar={() => setTela('menu')} />}
        </div>
      </div>

      <div className="lobby-faixa base" />

      {/* O aviso de ficção vive aqui e no manual, em nenhuma tela de jogo. */}
      <div className="lobby-nota">
        Jogo de ficção. Bancos, empresas, sites e pessoas são inventados —
        nenhuma rede real é acessada.
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function Menu({ ir }: { ir: (t: Tela) => void }) {
  const game = useGame()
  // Lido a cada render, nunca capturado na montagem.
  const temSave = game.hasSave
  const invadidas = game.machines.filter((m) => m.exploited).length
  const naoLidos = game.inbox.filter((e) => !e.lido).length

  return (
    <>
      <div className="lobby-titulo">Menu principal</div>

      <div className="lobby-menu">
        <button
          className="lobby-opcao destaque"
          disabled={!temSave}
          onClick={() => game.start(game.player.handle)}
        >
          <span className="rotulo">Continuar</span>
          {temSave ? (
            <span className="detalhe">
              {game.player.handle} · {game.player.balance.toLocaleString('pt-BR')} VC ·
              {' '}rastro <b style={{ color: heatColor(game.player.heat) }}>
                {game.player.heat.toFixed(0)}%
              </b>
              <br />
              {invadidas} invasão(ões) · relógio {clockOf(game.minutes)}
              {totalEvidence(game.disk) > 0 &&
                ` · ${totalEvidence(game.disk)} de evidência no disco`}
              {naoLidos > 0 && ` · ${naoLidos} e-mail(s) por ler`}
            </span>
          ) : (
            <span className="detalhe">Nenhuma partida salva.</span>
          )}
        </button>

        <button className="lobby-opcao" onClick={() => ir('novo')}>
          <span className="rotulo">Novo jogo</span>
          <span className="detalhe">
            {temSave
              ? 'Apaga a partida salva e começa do zero.'
              : 'Escolher um apelido e começar.'}
          </span>
        </button>

        <button className="lobby-opcao" onClick={() => ir('ajuda')}>
          <span className="rotulo">Como jogar</span>
          <span className="detalhe">O resumo. O manual completo fica no jogo.</span>
        </button>

        <button className="lobby-opcao" onClick={() => ir('creditos')}>
          <span className="rotulo">Créditos</span>
          <span className="detalhe">Quem fez e do que se trata.</span>
        </button>
      </div>

      {game.busted && (
        <div className="lobby-aviso">
          A última partida acabou: o ScanSS chegou até você.
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------

function NovoJogo({ voltar }: { voltar: () => void }) {
  const game = useGame()
  const [apelido, setApelido] = useState('')
  const [confirmando, setConfirmando] = useState(false)

  const temSave = game.hasSave
  const nome = apelido.trim()

  /** Só aqui o save é apagado — nunca ao apenas visitar esta tela. */
  function comecar() {
    if (!nome) return
    game.startNew(nome)
  }

  return (
    <>
      <div className="lobby-titulo">Novo jogo</div>

      {temSave && !confirmando && (
        <div className="lobby-aviso">
          Você tem uma partida salva de <b>{game.player.handle}</b>. Começar de
          novo apaga ela.
        </div>
      )}

      <p className="lobby-texto">
        Alguém vai te mandar e-mail. Não sabemos quem, mas ele já sabe do seu
        computador. Como você quer ser chamado?
      </p>

      <input
        className="xp lobby-campo"
        autoFocus
        maxLength={18}
        placeholder="seu apelido"
        value={apelido}
        spellCheck={false}
        onChange={(e) => setApelido(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' || !nome) return
          if (temSave && !confirmando) setConfirmando(true)
          else comecar()
        }}
      />

      {confirmando ? (
        <>
          <div className="lobby-aviso">
            Isto apaga a partida de <b>{game.player.handle}</b> para sempre.
          </div>
          <div className="lobby-acoes">
            <button className="xp" onClick={comecar}>Apagar e começar</button>
            <button className="xp" onClick={() => setConfirmando(false)}>
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <div className="lobby-acoes">
          <button
            className="xp"
            disabled={!nome}
            onClick={() => (temSave ? setConfirmando(true) : comecar())}
          >
            Começar
          </button>
          <button className="xp" onClick={voltar}>Voltar</button>
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------

function Ajuda({ voltar }: { voltar: () => void }) {
  return (
    <>
      <div className="lobby-titulo">Como jogar</div>

      <p className="lobby-texto">
        Você é um sujeito endividado em 2003 com um micro montado de peças
        usadas. Invadir um computador <b>não te dá dinheiro</b> — o que você
        acha lá dentro é a senha do banco da vítima.
      </p>

      <ol className="lobby-passos">
        <li>No <b>NetRipper</b>, varra a rede e invada uma máquina.</li>
        <li>No <b>Meu Computador</b>, vasculhe as pastas e baixe o que serve.</li>
        <li>No <b>Bloco de Notas</b>, leia o arquivo de senhas.</li>
        <li>No <b>Chroma</b>, entre no banco como a vítima e transfira.</li>
        <li>Apague o que já usou — arquivo roubado parado gera rastro.</li>
      </ol>

      <p className="lobby-texto">
        Dentro do jogo existe um <b>Manual do Operador</b> completo, explicando
        cada tela e cada botão.
      </p>

      <div className="lobby-acoes">
        <button className="xp" onClick={voltar}>Voltar</button>
      </div>
    </>
  )
}

function Creditos({ voltar }: { voltar: () => void }) {
  return (
    <>
      <div className="lobby-titulo">Créditos</div>

      <p className="lobby-texto">
        <b>ScanSS Evasion</b> — simulador de hacker num Windows XP fictício.
      </p>
      <p className="lobby-texto">
        Ideia e desenvolvimento: <b>Kleyson Gomes</b>.
      </p>
      <p className="lobby-texto">
        Ambientado em 2003, quando senha morava em arquivo de texto na Área de
        trabalho e ninguém achava isso estranho.
      </p>

      <div className="lobby-acoes">
        <button className="xp" onClick={voltar}>Voltar</button>
      </div>
    </>
  )
}
