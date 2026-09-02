/**
 * A landing: a vitrine do jogo, na url principal.
 *
 * Duas regras que valem para tudo aqui.
 *
 * O print nao e ilustracao ao lado do texto - ele e o CENARIO. Cada secao ocupa
 * a largura toda com uma tela do jogo ao fundo, escurecida, e o texto por cima.
 * A primeira versao era um site de empresa: bloco de texto, imagem ao lado,
 * repetir. Site de jogo funciona pelo avesso - a imagem manda e o texto se
 * encaixa nela.
 *
 * E a pagina VESTE A LINGUAGEM DO JOGO, em vez de falar sobre ele de fora. Foi
 * o que os sites dos jogos do genero ensinaram: monoespacada em tudo, cabecalho
 * em forma de barra de status, rotulo de secao com prompt, cursor piscando no
 * titulo. Uma pagina de marketing moderna sobre um jogo de 2003 sempre vai
 * parecer site de empresa, por mais escura que fique.
 *
 * E o texto NAO INVENTARIA. A versao anterior tinha duas colunas, "o que ja
 * esta no jogo" e "ainda nao existe", com o roteiro dos proximos capitulos
 * listado de graca para quem nem tinha comecado a jogar. Vitrine de jogo nao e
 * catalogo: o que vem por ai entra como promessa curta e vaga.
 *
 * O botao "Jogar" resolve de quebra um problema tecnico: ele e um gesto, entao
 * a aba do jogo ja abre com permissao para tela cheia.
 */

import { useEffect, useState } from 'react'
import { Logo } from '@/ui/Logo'
import { BUILD, ETIQUETA } from '@/version'
import { baixarAtalho, comoInstalar, comoUsar, detectarSistema } from './atalho'

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
}

const CENAS: Cena[] = [
  {
    arquivo: '04-netripper', etiqueta: 'a ferramenta', lado: 'esq',
    titulo: 'Tudo que você precisa\ncabe numa janela.',
    texto: 'Varre a rede, escolhe quem deixou a porta aberta e entra. Sem ' +
           'digitar comando nenhum: é clicar, ver a barrinha andar e torcer ' +
           'para não ter ninguém do outro lado olhando.',
  },
  {
    arquivo: '05-explorer', etiqueta: 'o alvo', lado: 'dir',
    titulo: 'O computador\nde outra pessoa.',
    texto: 'Foto de churrasco, MP3 gravado de CD emprestado, trabalho de ' +
           'faculdade em três versões. E, enterrada em algum lugar aí, a ' +
           'senha do banco.',
  },
  {
    arquivo: '06-banco', etiqueta: 'o roubo', lado: 'esq',
    titulo: 'Invadir não\nte dá dinheiro.',
    texto: 'Lá dentro você acha a senha. O dinheiro sai como sairia de ' +
           'verdade: abrindo o site do banco, fingindo ser ela e apertando ' +
           'confirmar com as suas próprias mãos.',
  },
  {
    arquivo: '08-vmail', etiqueta: 'a história', lado: 'dir',
    titulo: 'Alguém não para\nde te escrever.',
    texto: 'Ele assina 3stagiario. Sabe coisa demais sobre o seu micro para ' +
           'alguém que você nunca viu, e muda de assunto toda vez que você ' +
           'pergunta como.',
  },
]

const REGRAS = [
  { titulo: 'O rastro sobe rápido e desce devagar',
    texto: 'Cada coisa que você faz deixa registro. Quanto mais quente você ' +
           'está, mais devagar esfria.' },
  { titulo: 'O que você guarda te queima',
    texto: 'Arquivo roubado parado no seu disco continua contando contra ' +
           'você enquanto estiver lá.' },
  { titulo: 'Nunca é a mesma partida',
    texto: 'Alvos, contas e o que tem dentro deles são sorteados. Às vezes ' +
           'não tem nada — e é isso que faz a boa achada valer alguma coisa.' },
  { titulo: 'Eles também invadem você',
    texto: 'Uma hora alguém nota. E aí você descobre que passou o jogo ' +
           'inteiro sem pensar que a sua casa também tem porta.' },
]

/**
 * O que vem por ai: frase curta, sem explicar.
 *
 * A tentacao e detalhar - "o convite do Coletivo", "contratos com prazo",
 * "quem e o 3stagiario de verdade". Isso e o roteiro dos proximos capitulos
 * entregue de graca. Promessa boa da vontade sem contar o final.
 */
const PROMESSAS = [
  'Um convite que é melhor recusar',
  'Trabalho por encomenda, com hora marcada',
  'Gente com nome e cara atrás de você',
  'O motivo de ele saber tanto sobre o seu micro',
]

/** Onde o jogo roda, no lugar onde um jogo de loja poria os selos de plataforma. */
const FICHAS = ['no navegador', 'de graça', 'sem cadastro', 'um jogador']

const GALERIA = [
  '08b-missoes', '07-darkmarket', '10-defesa', '09-manual', '02-menu',
  '03-desktop',
]

export function Landing() {
  const [sistema] = useState(detectarSistema)
  const [instalar, setInstalar] = useState<(() => void) | null>(null)
  const [ajuda, setAjuda] = useState(false)
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

  /**
   * O botao diz "Instalar" sempre.
   *
   * Antes ele so virava "Instalar" quando o navegador oferecia o convite, e
   * mostrava "Baixar atalho" no resto do tempo - ou seja, escondia a opcao boa
   * de quase todo mundo, porque `beforeinstallprompt` e so do Chrome e
   * derivados e mesmo la costuma demorar. Sem o convite, o clique abre o passo
   * a passo do navegador da pessoa, com o atalho como ultimo recurso.
   */
  function aoInstalar() {
    if (instalar) return instalar()
    setAjuda(true)
  }

  function baixar() {
    baixarAtalho(URL_DO_JOGO, sistema)
    setBaixou(true)
  }

  return (
    <div className="lp">
      <header className="lp-topo">
        <div className="lp-largura lp-topo-linha">
          <Logo tamanho="pequeno" linha />
          <span className="lp-build">
            <b>{ETIQUETA}</b>
            <span>build de {BUILD}</span>
          </span>
          <a className="lp-botao pequeno" href="jogo/">Jogar</a>
        </div>
      </header>

      {/* ===================================================== capa ======= */}
      <section className="lp-capa" style={{ backgroundImage: `url(${print('03-desktop')})` }}>
        <div className="lp-capa-veu" />
        <div className="lp-largura lp-capa-corpo">
          <div className="lp-capa-texto">
            <p className="lp-prompt">C:\&gt; scanss_evasion.exe</p>
            <h1 className="lp-titulo"><Logo tamanho="grande" /></h1>
            <p className="lp-tagline">
              Um jogo sobre computadores dos outros, dinheiro e não ser pego.
            </p>

            <ul className="lp-fichas">
              {FICHAS.map((f) => <li key={f}>{f}</li>)}
            </ul>

            <div className="lp-acoes">
              <a className="lp-botao grande" href="jogo/">▶ Jogar agora</a>
              <button className="lp-botao grande vazado" onClick={aoInstalar}>
                Instalar
              </button>
            </div>

            {ajuda && (
              <div className="lp-ajuda">
                <p>{comoInstalar()}</p>
                <p className="fraco">
                  Instalado, ele ganha ícone no sistema, abre em janela própria
                  e funciona sem internet.
                </p>
                <button className="lp-link" onClick={baixar}>
                  ou baixe só um atalho para a área de trabalho
                </button>
                {baixou && <p className="fraco">{comoUsar(sistema)}</p>}
              </div>
            )}
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
          style={{ backgroundImage: `url(${print(c.arquivo)})` }}
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

      {/* =================================================== regras ======= */}
      <section className="lp-regras">
        <div className="lp-largura">
          <p className="lp-etiqueta">as regras da casa</p>
          <ul className="lp-lista">
            {REGRAS.map((r, i) => (
              <li key={r.titulo}>
                <span className="lp-num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{r.titulo}</h3>
                <p>{r.texto}</p>
              </li>
            ))}
          </ul>
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

      {/* ============================================ em desenvolvimento == */}
      <section className="lp-futuro"
               style={{ backgroundImage: `url(${print('01-abertura')})` }}>
        <div className="lp-futuro-veu" />
        <div className="lp-largura lp-futuro-corpo">
          <div>
            <p className="lp-etiqueta">em desenvolvimento</p>
            <h2>Ainda estão<br />escrevendo o resto.</h2>
            <p className="lp-linha">
              O que está no ar já se joga do começo ao fim. Mas a história chega
              por e-mail, um capítulo por vez — e o 3stagiario ainda tem coisa
              para contar.
            </p>
            <p className="lp-futuro-data">
              última build · {BUILD} · sem data para a próxima
            </p>
          </div>

          <ul className="lp-promessas">
            {PROMESSAS.map((p) => <li key={p}>{p}</li>)}
            <li className="reticencias">e o resto você descobre sozinho</li>
          </ul>
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
          <p>
            <b>ScanSS Evasion</b> — um jogo independente por Kleyson Gomes.
            {' '}{ETIQUETA}, build de {BUILD}.
          </p>
          <p className="lp-ficcao">
            Jogo de ficção. Bancos, empresas, sites e pessoas são inventados —
            nenhuma rede real é acessada. A partida fica salva no seu próprio
            navegador; como ainda é beta, uma mudança grande nas regras pode
            aposentar partidas antigas.
          </p>
        </div>
      </footer>
    </div>
  )
}
