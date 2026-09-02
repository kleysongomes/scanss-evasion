/**
 * A landing: a vitrine do jogo, na url principal.
 *
 * O print nao e ilustracao ao lado do texto - ele e o CENARIO. Cada secao ocupa
 * a largura toda com uma tela do jogo ao fundo, escurecida, e o texto por cima.
 * A primeira versao era um site de empresa: bloco de texto, imagem ao lado,
 * repetir. Site de jogo funciona pelo avesso - a imagem manda e o texto se
 * encaixa nela.
 *
 * O botao "Jogar" resolve de quebra um problema tecnico: ele e um gesto, entao
 * a aba do jogo ja abre com permissao para tela cheia.
 */

import { useEffect, useState } from 'react'
import { baixarAtalho, comoUsar, detectarSistema } from './atalho'

/** A url exata do jogo - e ela que vai para o atalho. */
const URL_DO_JOGO = new URL('jogo/', window.location.href).href

const print = (nome: string) => `prints/${nome}.png`

interface Cena {
  arquivo: string
  etiqueta: string
  titulo: string
  texto: string
  /** De que lado fica o texto. */
  lado: 'esq' | 'dir'
  /** Onde ancorar o fundo, para a parte interessante do print não sair. */
  foco?: string
}

const CENAS: Cena[] = [
  {
    arquivo: '04-netripper', etiqueta: 'a ferramenta', lado: 'esq',
    titulo: 'Sete programas.\nDez níveis cada.',
    texto: 'Varra a rede, escolha um alvo, arrombe a porta. Cada programa que ' +
           'você compra vira um módulo com painel próprio — e o nível seguinte ' +
           'só abre depois do anterior.',
  },
  {
    arquivo: '05-explorer', etiqueta: 'o alvo', lado: 'dir',
    titulo: 'O computador\nde outra pessoa.',
    texto: 'Pastas de verdade, cheias de foto de churrasco, MP3 gravado de CD ' +
           'emprestado e trabalho de faculdade em três versões. A senha do ' +
           'banco está enterrada em algum lugar aí.',
  },
  {
    arquivo: '06-banco', etiqueta: 'o roubo', lado: 'esq',
    titulo: 'Invadir não\nte dá dinheiro.',
    texto: 'O que você acha lá dentro é a senha do banco da vítima. Para virar ' +
           'dinheiro, você abre o navegador, entra no site do banco fingindo ' +
           'ser ela e faz a transferência com as suas próprias mãos.',
  },
  {
    arquivo: '08-vmail', etiqueta: 'a história', lado: 'dir',
    titulo: 'Alguém não para\nde te escrever.',
    texto: 'Ele se chama 3stagiario. Ninguém sabe quem é, nem como sabe tanto ' +
           'sobre o seu computador. Diz que instalou umas coisas nele semana ' +
           'passada, quando você foi buscar café, e nunca explica isso.',
  },
]

const PILARES = [
  { titulo: 'O rastro sobe rápido e desce devagar',
    texto: 'Cada ação deixa registro. Quanto mais quente você está, mais ' +
           'devagar esfria — sair do vermelho só esperando leva horas.' },
  { titulo: 'O que você guarda te queima',
    texto: 'Arquivo roubado parado no seu disco continua gerando rastro ' +
           'enquanto estiver lá. Apagar é jogada, não faxina.' },
  { titulo: 'Alvos sorteados, sem garantia',
    texto: 'Cada varredura traz máquinas novas. Uma em cada sete não tem nada ' +
           'dentro — e é isso que faz a boa achada valer alguma coisa.' },
  { titulo: 'Eles também invadem você',
    texto: 'Depois de umas quantas contas zeradas, alguém nota. Você passou o ' +
           'jogo entrando na casa dos outros sem pensar que a sua tem porta.' },
]

const GALERIA = [
  '02-menu', '03-desktop', '07-darkmarket', '10-defesa', '09-manual',
]

export function Landing() {
  const [sistema] = useState(detectarSistema)
  const [instalar, setInstalar] = useState<(() => void) | null>(null)
  const [baixou, setBaixou] = useState(false)

  /**
   * Se o navegador oferecer instalacao, ela e melhor que baixar arquivo: cria
   * um icone de verdade. Guardamos o evento para disparar no clique.
   */
  useEffect(() => {
    function capturar(e: Event) {
      e.preventDefault()
      const prompt = e as Event & { prompt: () => Promise<void> }
      setInstalar(() => () => void prompt.prompt())
    }
    window.addEventListener('beforeinstallprompt', capturar)
    return () => window.removeEventListener('beforeinstallprompt', capturar)
  }, [])

  function baixar() {
    if (instalar) return instalar()
    baixarAtalho(URL_DO_JOGO, sistema)
    setBaixou(true)
  }

  return (
    <div className="lp">
      <header className="lp-topo">
        <div className="lp-largura lp-topo-linha">
          <span className="lp-marca">ScanSS<em>Evasion</em></span>
          <a className="lp-botao pequeno" href="jogo/">Jogar</a>
        </div>
      </header>

      {/* ===================================================== capa ======= */}
      <section className="lp-capa" style={{ backgroundImage: `url(${print('03-desktop')})` }}>
        <div className="lp-capa-veu" />
        <div className="lp-largura lp-capa-corpo">
          <div className="lp-capa-texto">
            <h1>ScanSS<span>Evasion</span></h1>
            <p className="lp-tagline">
              Um jogo sobre computadores dos outros, dinheiro e não ser pego.
            </p>

            <div className="lp-acoes">
              <a className="lp-botao grande" href="jogo/">Jogar agora</a>
              <button className="lp-botao grande vazado" onClick={baixar}>
                {instalar ? 'Instalar' : 'Baixar atalho'}
              </button>
            </div>

            <p className="lp-nota">
              No navegador, de graça, sem cadastro.
              {baixou && <> {comoUsar(sistema)}</>}
            </p>
          </div>

          {/* A capa tem que MOSTRAR o jogo, não só a paisagem dele. */}
          <figure className="lp-capa-tela">
            <img src={print('04-netripper')} alt="O NetRipper, a suíte de invasão"
                 width={1280} height={800} />
          </figure>
        </div>
        <div className="lp-capa-desce">▼</div>
      </section>

      {/* ==================================================== cenas ======= */}
      {CENAS.map((c) => (
        <section
          key={c.arquivo}
          className={`lp-cena ${c.lado}`}
          style={{ backgroundImage: `url(${print(c.arquivo)})`,
                   backgroundPosition: c.foco ?? 'center' }}
        >
          <div className="lp-cena-veu" />
          <div className="lp-largura lp-cena-corpo">
            <div className="lp-cena-texto">
              <p className="lp-etiqueta">{c.etiqueta}</p>
              <h2>{c.titulo}</h2>
              <p>{c.texto}</p>
            </div>
            <figure className="lp-cena-quadro">
              <img src={print(c.arquivo)} alt={c.titulo.replace('\n', ' ')}
                   loading="lazy" width={1280} height={800} />
            </figure>
          </div>
        </section>
      ))}

      {/* =================================================== pilares ====== */}
      <section className="lp-pilares">
        <div className="lp-largura">
          <p className="lp-etiqueta">como o jogo aperta</p>
          <div className="lp-grade">
            {PILARES.map((p) => (
              <div key={p.titulo}>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================== a derrota ===== */}
      <section className="lp-derrota">
        <div className="lp-largura lp-derrota-corpo">
          <div>
            <p className="lp-etiqueta">e um jeito de perder</p>
            <h2>Eles puxam a linha<br />até a sua casa.</h2>
            <p className="lp-linha">
              Chegou a 100% de rastro? Tela azul, micro apreendido, partida
              encerrada. Sem checkpoint, sem segunda chance — só um menu
              perguntando qual vai ser o seu novo apelido.
            </p>
          </div>
          <figure className="lp-cena-quadro">
            <img src={print('11-tela-azul')} alt="A tela azul do ScanSS"
                 width={1280} height={800} />
          </figure>
        </div>
      </section>

      {/* =================================================== galeria ====== */}
      <section className="lp-galeria">
        <div className="lp-largura">
          <p className="lp-etiqueta">mais telas</p>
        </div>
        <div className="lp-tira">
          {GALERIA.map((g) => (
            <img key={g} src={print(g)} alt="" width={1280} height={800} />
          ))}
        </div>
      </section>

      {/* ===================================================== fecho ====== */}
      <section className="lp-fecho"
               style={{ backgroundImage: `url(${print('03-desktop')})` }}>
        <div className="lp-fecho-veu" />
        <div className="lp-largura">
          <h2>Hoje alguém vai<br />te mandar um e-mail.</h2>
          <div className="lp-acoes">
            <a className="lp-botao grande" href="jogo/">Jogar agora</a>
          </div>
        </div>
      </section>

      <footer className="lp-rodape">
        <div className="lp-largura">
          <p><b>ScanSS Evasion</b> — um jogo independente por Kleyson Gomes.</p>
          <p className="lp-ficcao">
            Jogo de ficção. Bancos, empresas, sites e pessoas são inventados —
            nenhuma rede real é acessada.
          </p>
        </div>
      </footer>
    </div>
  )
}
