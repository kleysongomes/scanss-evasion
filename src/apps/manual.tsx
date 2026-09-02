/**
 * Conteudo do Manual do Operador.
 *
 * Um capitulo por tela do jogo, explicando cada botao. Fica em `apps/` (e nao
 * em `game/`) porque e JSX: a camada de regras nao importa React.
 *
 * Os numeros (precos, alvos, niveis) saem do proprio conteudo do jogo, entao o
 * manual nao desatualiza quando o balanceamento muda.
 */

import type { ComponentType, ReactNode } from 'react'
import { DESAFIOS, missaoAtual, placar } from '@/game/missions'
import { STEPS, isDone, progress } from '@/game/progress'
import { BRANCHES, MAX_LEVEL, skillsOf } from '@/game/skills'
import { evidenceHeatPerHour, useGame } from '@/game/store'
import { totalEvidence } from '@/game/fs'

export interface Chapter {
  id: string
  title: string
  /** A fala do Klipe nesta pagina. */
  klipe: string
  Body: ComponentType
}

// ---------------------------------------------------------------------------
// Pecinhas reutilizadas pelos capitulos
// ---------------------------------------------------------------------------

/** Botao de verdade do jogo, para o jogador reconhecer na tela. */
const B = ({ children }: { children: ReactNode }) => (
  <button className="xp narrow" style={{ padding: '1px 8px', cursor: 'default' }}
          tabIndex={-1}>{children}</button>
)

const Nota = ({ children }: { children: ReactNode }) => (
  <div className="manual-nota">{children}</div>
)

const Aviso = ({ children }: { children: ReactNode }) => (
  <div className="manual-nota aviso">{children}</div>
)

const Passos = ({ itens }: { itens: ReactNode[] }) => (
  <ol className="manual-passos">
    {itens.map((n, i) => <li key={i}>{n}</li>)}
  </ol>
)

/** Linha "botão → o que faz". */
const Botoes = ({ linhas }: { linhas: [ReactNode, ReactNode][] }) => (
  <table className="manual-tabela">
    <tbody>
      {linhas.map(([b, d], i) => (
        <tr key={i}>
          <td style={{ width: 138, whiteSpace: 'nowrap' }}>{b}</td>
          <td>{d}</td>
        </tr>
      ))}
    </tbody>
  </table>
)

// ---------------------------------------------------------------------------
// Capitulos
// ---------------------------------------------------------------------------

const Bemvindo = () => (
  <>
    <h2>O que é este jogo</h2>
    <p>
      Estamos em <b>2003</b>. Você é um sujeito endividado com um micro montado
      de peças usadas. Aprendeu o que sabe copiando script de fórum, e resolveu
      usar isso para tirar dinheiro dos outros.
    </p>
    <p>
      O jogo inteiro acontece dentro deste <b>WinDoors XP</b>. Não existe menu de
      jogo nem tela de missão: você usa os programas do computador como usaria os
      de verdade.
    </p>

    <h3>A regra que muda tudo</h3>
    <p>
      Invadir um computador <b>não te dá dinheiro</b>. O que você acha lá dentro
      é um arquivo com a <b>senha do banco</b> da vítima — enterrado no meio de
      fotos, trabalho de faculdade e lista de mercado, como estaria num PC de
      verdade. Para virar dinheiro, você abre o navegador, entra no site do banco
      fingindo ser ela e faz a transferência com as suas próprias mãos.
    </p>

    <Nota>
      É por isso que existe um sistema operacional inteiro aqui: o roubo precisa
      de quatro programas diferentes para acontecer.
    </Nota>

    <h3>O caminho completo</h3>
    <Passos itens={[
      <>No <b>NetRipper</b>, varrer a rede, analisar e invadir uma máquina.</>,
      <>No <b>Meu Computador</b>, vasculhar as pastas dela e baixar o que serve.</>,
      <>No <b>Bloco de Notas</b>, ler o arquivo de senhas.</>,
      <>No <b>Chroma</b>, entrar no banco e transferir o dinheiro.</>,
      <>De volta ao <b>Meu Computador</b>, apagar o que te incrimina.</>,
      <>No <b>darkmarket</b>, subir o nível de um programa e mirar mais alto.</>,
    ]} />

    <p>
      O resto do manual explica cada tela, botão por botão. Se quiser ir direto
      ao ponto, pule para <b>Onde você está</b>: mostra o seu próximo passo.
    </p>

    <Nota>
      <b>Isto aqui é ficção.</b> O V-Bank, o darkmarket, o VMail, as empresas e
      as pessoas são todos inventados, e o navegador do jogo não acessa a
      internet — só as páginas que existem dentro desta janela.
    </Nota>
  </>
)

const AreaDeTrabalho = () => (
  <>
    <h2>A área de trabalho</h2>
    <p>
      A tela azul com os ícones. Funciona igual ao Windows de verdade — se você
      já usou um, já sabe usar este.
    </p>

    <h3>Abrir um programa</h3>
    <p>
      <b>Dois cliques</b> no ícone. Um clique só apenas seleciona. Os mesmos
      programas estão no menu <b>iniciar</b>, no canto inferior esquerdo.
    </p>

    <h3>As janelas</h3>
    <Botoes linhas={[
      [<b>Arrastar</b>, 'Segure a barra de título azul e mova.'],
      [<b>Redimensionar</b>, 'Arraste o canto inferior direito.'],
      [<b>Minimizar</b>, 'Primeiro botão do canto superior direito. A janela continua na barra de tarefas.'],
      [<b>Maximizar</b>, 'Botão do meio. Dois cliques na barra de título fazem o mesmo.'],
      [<b>Fechar</b>, 'Botão vermelho. Fechar não perde progresso — o jogo salva sozinho.'],
    ]} />
    <p>
      Você vai querer várias janelas abertas ao mesmo tempo: ler a senha no Bloco
      de Notas com o banco aberto do lado é o normal.
    </p>

    <h3>A barra de tarefas</h3>
    <Botoes linhas={[
      [<b>iniciar</b>, 'Todos os programas, o nível dos seus programas de invasão, o manual e o desligar.'],
      [<b>Janelas abertas</b>, 'Uma por janela. Clique para trazer à frente; de novo para minimizar.'],
      [<>🛡️ <b>Escudo</b></>, <>O rastreamento do ScanSS. <b>É o número mais importante do jogo.</b></>],
      [<>💰 <b>Saldo</b></>, 'Quanto V-Coin você tem agora.'],
      [<b>Relógio</b>, 'A hora no jogo. 1 segundo real = 1 minuto no jogo.'],
    ]} />
  </>
)

const Rastro = () => (
  <>
    <h2>O rastro do ScanSS</h2>
    <p>
      O <b>ScanSS</b> é o sistema da V-Sec que cruza logs de conexão. Toda ação
      sua deixa vestígio, e o escudo 🛡️ na barra de tarefas mostra o quanto ele
      já juntou sobre você, de <b>0% a 100%</b>.
    </p>

    <Aviso>
      Se o rastro chegar a <b>100%</b>, eles puxam a linha até a sua casa: tela
      azul, micro apreendido, partida encerrada. É a única forma de perder.
    </Aviso>

    <h3>As quatro faixas</h3>
    <table className="manual-tabela">
      <tbody>
        <tr><td style={{ width: 116 }}><b style={{ color: '#2a8a2a' }}>0–29% verde</b></td>
            <td>Tranquilo. Aja à vontade.</td></tr>
        <tr><td><b style={{ color: '#b39000' }}>30–59% amarelo</b></td>
            <td>Já estão te amostrando. Ainda dá para trabalhar.</td></tr>
        <tr><td><b style={{ color: '#cc6600' }}>60–84% laranja</b></td>
            <td>Correlacionando seus saltos. Hora de limpar ou parar.</td></tr>
        <tr><td><b style={{ color: '#cc0000' }}>85–100% vermelho</b></td>
            <td>A poucos saltos de você. Pare tudo agora.</td></tr>
      </tbody>
    </table>

    <h3>O que faz subir</h3>
    <table className="manual-tabela">
      <tbody>
        <tr><td style={{ width: 138 }}>Varrer a rede</td><td>+1 — quase nada</td></tr>
        <tr><td>Analisar um host</td><td>+2</td></tr>
        <tr><td>Quebrar cadeado</td><td>+2</td></tr>
        <tr><td>Baixar arquivo</td><td>+3</td></tr>
        <tr><td>Invadir</td><td>+4 mais a segurança do alvo (uma empresa custa +12)</td></tr>
        <tr><td>Entrar no banco</td><td>+6</td></tr>
        <tr><td><b>Transferir</b></td><td><b>até +22</b>, proporcional à fatia levada da conta</td></tr>
        <tr><td><b>Evidência no disco</b></td><td><b>contínuo</b> — o capítulo seguinte é só sobre isto</td></tr>
      </tbody>
    </table>

    <h3>O que faz descer</h3>
    <Passos itens={[
      <><b>Esperar</b> — mas cada vez menos. A queda <b>não é constante</b>:
        quanto mais quente, mais devagar ele esfria.</>,
      <><b>Faxina.</b> O programa de limpeza derruba de 23 a 68 pontos de uma
        vez, conforme o nível dele. É o único jeito rápido.</>,
      <><b>Anonimato.</b> Não limpa nada, mas corta até 70% de todo rastro que
        você <i>gerar</i> daí em diante.</>,
    ]} />

    <h3>A curva de esfriamento</h3>
    <table className="manual-tabela">
      <tbody>
        <tr><td style={{ width: 116 }}><b style={{ color: '#2a8a2a' }}>abaixo de 30%</b></td>
            <td>−6 por hora</td></tr>
        <tr><td><b style={{ color: '#b39000' }}>30 a 59%</b></td>
            <td>−4,2 por hora</td></tr>
        <tr><td><b style={{ color: '#cc6600' }}>60 a 84%</b></td>
            <td>−2,4 por hora</td></tr>
        <tr><td><b style={{ color: '#cc0000' }}>85% ou mais</b></td>
            <td>−1,2 por hora</td></tr>
      </tbody>
    </table>

    <Aviso>
      Quem está sendo investigado não sai da mira só por ficar quieto. Sair do
      vermelho apenas esperando leva <b>mais de trinta horas de jogo</b> — por
      isso o ramo <b>Faxina</b> vale o preço, e por isso deixar o rastro chegar
      lá em cima é o erro mais caro do jogo.
    </Aviso>
  </>
)

const Evidencia = () => {
  const game = useGame()
  const total = totalEvidence(game.disk)
  const porHora = evidenceHeatPerHour(game.disk)

  return (
    <>
      <h2>A evidência no seu disco</h2>
      <p>
        Esta é a mecânica que pega todo mundo de surpresa: <b>o ScanSS também
        varre a sua máquina</b>. Cada arquivo roubado guardado no seu C: é uma
        prova contra você, e prova parada gera rastro <b>o tempo todo</b>.
      </p>

      <Aviso>
        Baixar não é de graça e nem é definitivo. Um dump corporativo esquecido
        na pasta Baixados sozinho já anula boa parte da queda natural do rastro
        — você fica preso num patamar alto sem entender por quê.
      </Aviso>

      <h3>Como funciona</h3>
      <Passos itens={[
        <>Cada arquivo tem um peso incriminador. Foto de família pesa nada;
          arquivo de senhas pesa 8; um dump de clientes pesa 30.</>,
        <>A soma aparece no rodapé do Meu Computador (🔥) e no Painel de Controle.</>,
        <>A cada hora do jogo, essa soma vira rastro. Para comparar: o rastro cai
          15 por hora sozinho, então cerca de <b>62 de evidência</b> anulam a
          queda por completo.</>,
      ]} />

      <h3>O ciclo certo</h3>
      <Passos itens={[
        <><b>Baixe</b> o que precisa.</>,
        <><b>Use</b> — leia a senha, esvazie a conta.</>,
        <><b>Venda ou apague</b> na mesma sessão. Vender já remove o arquivo do
          disco; apagar serve para o que não vale nada mas incrimina.</>,
      ]} />

      <h3>O preço de apagar</h3>
      <p>
        Apagar não é de graça: a caixa <b>"Senhas gravadas neste computador"</b>
        do V-Bank lê o seu disco. Sumiu o arquivo, sumiu o botão
        <B>Preencher</B> daquela vítima.
      </p>
      <Nota>
        A senha do correntista <b>não muda</b> — só o atalho some. Se você
        anotou usuário e senha, ainda dá para digitar na mão e entrar. Vale a
        pena prestar atenção neles antes de apagar.
      </Nota>
      <p>
        É essa a decisão: guardar o bilhete e conviver com o rastro que ele gera,
        ou apagar, ficar limpo e depender da sua memória para voltar naquela
        conta.
      </p>

      <div className="manual-nota" style={{ borderLeftColor: '#cc2222' }}>
        <b>Agora no seu disco:</b> {total} de evidência
        {total > 0
          ? <> — gerando <b>+{porHora.toFixed(1)} de rastro por hora</b>.
              {porHora > 15 && ' Isso é mais do que a queda natural: seu rastro está subindo sozinho.'}</>
          : <> — limpo. Nada aqui para acharem.</>}
      </div>
    </>
  )
}

const Ferramenta = () => (
  <>
    <h2>NetRipper</h2>
    <p>
      A sua suíte de invasão. Cada programa que você possui é um <b>módulo</b>:
      clique no nome, à esquerda, e o painel dele abre com as ações e o retorno
      ali dentro. O que aparece no menu é exatamente o que você comprou.
    </p>

    <h3>Os cinco módulos</h3>
    <Botoes linhas={[
      [<>📡 <b>Rastreador</b></>, <>Botão <B>Varrer rede</B> e a lista de hosts
        encontrados, com IP, andar e estado. Clique num host para selecioná-lo;
        o botão <B>Remover</B> tira ele da lista e abre vaga.</>],
      [<>🔨 <b>Intrusão</b></>, <>A mesma lista de hosts do Rastreador. Clique
        num e aja: <B>Analisar</B>, <B>Invadir</B>, <B>Conectar</B>. Mostra a
        segurança, a porta aberta e o nível exigido.</>],
      [<>🔓 <b>Decodificador</b></>, <>Lista os arquivos trancados da máquina
        montada — e tem uma área onde você <b>arrasta o arquivo</b>.</>],
      [<>🧹 <b>Faxina</b></>, <>Mostra os registros que apontam para você e o
        botão que os apaga.</>],
      [<>🛰️ <b>Anonimato</b></>, <>Não tem botão: mostra a rota anônima ativa e
        o quanto ela está reduzindo do seu rastro.</>],
    ]} />

    <h3>A sequência de um roubo</h3>
    <Passos itens={[
      <>No <b>Rastreador</b>, <B>Varrer rede</B>. Aparecem hosts novos toda vez
        — o que você enxerga depende do nível dele.</>,
      <>Clique num host da lista para selecioná-lo.</>,
      <>Vá em <b>Intrusão</b>: <B>Analisar</B> descobre a porta,
        <B>Invadir</B> entra, <B>Conectar</B> monta o disco como unidade Z:.</>,
      <>Abra o <b>Meu Computador</b> e vasculhe as pastas da vítima.</>,
    ]} />

    <h3>Arrastar para decodificar</h3>
    <p>
      Achou um arquivo com 🔒 na unidade Z:? Deixe o <b>NetRipper</b> aberto no
      módulo <b>Decodificador</b> e <b>arraste o arquivo do Meu Computador até a
      área tracejada</b>. Ele é aberto e baixado de uma vez.
    </p>
    <Nota>
      Se preferir clicar, o módulo também lista todos os arquivos trancados da
      máquina montada com um botão <B>Decodificar</B> em cada linha — e diz
      quando o cadeado é forte demais para o seu nível.
    </Nota>

    <h3>Os selos da lista</h3>
    <Botoes linhas={[
      [<span className="badge novo">novo</span>, 'Encontrado, mas ainda não analisado.'],
      [<span className="badge visto">visto</span>, 'Analisado: você já sabe a porta e o que ela exige.'],
      [<span className="badge aberto">aberto</span>, 'Invadido. Pode conectar quando quiser.'],
      [<span className="badge conectado">Z:</span>, 'Conectado agora, montado no Meu Computador.'],
    ]} />

    <Nota>
      Máquina invadida <b>continua invadida</b>. Dá para desconectar, fazer outra
      coisa e voltar depois sem repetir a invasão. Invadir várias e coletar com
      calma depois é a jogada mais segura.
    </Nota>
  </>
)

const MeuComputador = () => (
  <>
    <h2>Meu Computador</h2>
    <p>
      Onde você mexe nos arquivos — nos seus e nos da vítima. As duas unidades
      ficam na coluna da esquerda:
    </p>
    <Botoes linhas={[
      [<>💾 <b>Disco local (C:)</b></>, 'O seu micro. Aqui você organiza, vende e apaga.'],
      [<>📡 <b>Unidade Z:</b></>, <>O disco da máquina invadida. Só existe depois
        de <b>Conectar</b> no NetRipper.</>],
    ]} />

    <h3>Navegar nas pastas</h3>
    <p>
      As máquinas têm pastas de verdade — <b>Meus documentos</b>, <b>Área de
      trabalho</b>, <b>Minhas imagens</b>, <b>WINDOWS</b>. Dois cliques numa
      pasta entram nela; o botão <B>Acima</B> sobe um nível; a barra de endereço
      mostra onde você está.
    </p>

    <Nota>
      Nada é entregue de bandeja: o arquivo de senhas pode estar na Área de
      trabalho, dentro de <b>Pessoal</b>, ou numa pasta chamada
      <b> _particular</b>. Vasculhar faz parte. Pastas de sistema (WINDOWS,
      Arquivos de programas) nunca têm nada de útil — são só ruído, como num PC
      de verdade.
    </Nota>

    <h3>Botões na unidade Z: (máquina da vítima)</h3>
    <Botoes linhas={[
      [<B>Abrir</B>, 'Lê o arquivo no Bloco de Notas.'],
      [<B>Baixar</B>, <>Copia para o seu <b>C:\\Baixados\\</b>.</>],
      [<B>Quebrar cadeado</B>, <>Destranca um arquivo 🔒. Exige o
        <b> Decodificador</b> no nível do cadeado.</>],
    ]} />

    <h3>Botões no disco C: (o seu)</h3>
    <Botoes linhas={[
      [<B>Nova pasta</B>, 'Cria uma pasta aqui, para organizar do seu jeito.'],
      [<B>Renomear</B>, 'Edita o nome ali mesmo na lista. Enter confirma, Esc cancela.'],
      [<B>Recortar</B> , <>Marca o item para mover. Depois entre na pasta destino e clique em <B>Colar</B>.</>],
      [<B>Vender</B>, 'Troca o arquivo por V-Coin. Some do disco — o que é ótimo.'],
      [<B>Excluir</B>, <>Apaga de vez. <b>É assim que você limpa a evidência.</b></>],
    ]} />

    <h3>O cadeado 🔒</h3>
    <p>
      Arquivo trancado não abre nem baixa. Cada cadeado tem um nível, e o seu
      <b> Decodificador</b> precisa estar naquele nível ou acima. Os arquivos
      mais valiosos estão atrás dos cadeados mais fortes.
    </p>
    <Nota>
      Para abrir um deles: <b>arraste o arquivo</b> da unidade Z: até o módulo
      <b> Decodificador</b> do NetRipper. Ele quebra o cadeado e baixa numa
      tacada só. (Ou use o botão <B>Decodificar</B> na lista do próprio módulo.)
    </Nota>
  </>
)

const BlocoDeNotas = () => (
  <>
    <h2>Bloco de Notas</h2>
    <p>
      Abre quando você dá dois cliques num arquivo. Parece o programa mais bobo
      do jogo, e é o mais importante.
    </p>

    <Aviso>
      <b>Baixar o arquivo de senhas não basta — você precisa abrir e ler.</b> É o
      ato de ler que grava a credencial no gerenciador de senhas do navegador.
      Sem isso, o banco não aceita você.
    </Aviso>

    <p>
      Quando o arquivo contém uma senha, uma faixa amarela aparece embaixo
      dizendo em que site ela funciona e com qual usuário.
    </p>
    <p>
      Vale abrir os outros arquivos também: uma ata de reunião ou um diário não
      servem para entrar em lugar nenhum, mas dão o clima de estar mexendo na
      vida de alguém — e alguns valem dinheiro no mercado.
    </p>
  </>
)

const Correio = () => {
  const game = useGame()
  return (
    <>
      <h2>O correio e a história</h2>
      <p>
        Alguém que se chama <b>3stagiario</b> te manda e-mail. Ninguém sabe quem
        é, nem como ele sabe tanto sobre o seu computador. Ele diz que instalou
        umas coisas nele "semana passada, quando você foi buscar café", e nunca
        explica isso.
      </p>
      <p>
        É por ele que a história acontece e que as missões chegam. Abra o
        <b> Chroma</b> e vá em <b>vmail.vc</b>.
      </p>

      <h3>Nem todo e-mail é do 3stagiario</h3>
      <p>
        Chega spam também, e o spam de 2003 não era inofensivo. Se a mensagem
        prometer prêmio, herança, emprego fácil ou disser que o seu micro tem
        47 vírus, <b>o link no meio do texto funciona</b> — e clicar nele custa
        dinheiro ou rastro. Uma vez cada, então não dá para desfazer.
      </p>
      <Aviso>
        Regra simples, igual à da vida real: se o e-mail está gritando em
        maiúsculas, não clique. Ler é de graça; clicar não.
      </Aviso>

      <h3>O jogo pausa quando chega e-mail</h3>
      <Aviso>
        Quando uma mensagem nova chega, um aviso aparece no canto inferior
        direito e <b>o relógio para</b>. O rastro não cai, nada acontece. É de
        propósito: é o único momento em que a história tem prioridade sobre a
        jogatina.
      </Aviso>
      <p>
        Você pode abrir na hora ou clicar em <B>Depois</B> — o jogo volta a
        rodar e a mensagem fica esperando na caixa.
      </p>

      <h3>Missões</h3>
      <p>
        No webmail existe uma aba <b>Missões</b>, ao lado da caixa de entrada.
        Tudo que você já fez e tudo que ainda falta está lá, e o que está
        cumprido aparece riscado — ninguém precisa lembrar de nada.
      </p>
      <p>
        São duas famílias. As <b>missões da história</b> chegam por e-mail, uma
        puxando a outra, e ensinam o jogo na ordem certa. Os <b>desafios</b> são
        metas grandes — {DESAFIOS.length} delas — que você persegue no seu
        ritmo: roubar tanto, invadir tantos, sobreviver a tanto rastro. Estes
        pagam prêmio em VC quando fecham.
      </p>
      <p>
        Não existe botão de "entregar". A missão se cumpre jogando, e o jogo
        percebe sozinho — um aviso verde aparece no canto quando alguma fecha.
      </p>

      {game.inbox.length > 0 && (
        <Nota>
          Você tem <b>{game.inbox.length}</b> mensagem(ns) na caixa
          {game.inbox.some((e) => !e.lido) && ', e alguma ainda não foi lida'}.
          <br />
          Missões: <b>{placar(game).feitas} de {placar(game).total}</b>{' '}
          concluídas.
          {missaoAtual(game) && (
            <><br />Missão atual: <b>{missaoAtual(game)!.titulo}</b></>
          )}
        </Nota>
      )}
    </>
  )
}

const Defesa = () => (
  <>
    <h2>Defesa: eles também invadem você</h2>
    <p>
      Você passa o começo do jogo entrando na casa dos outros sem nunca pensar
      que a sua tem porta. Depois de <b>4 contas zeradas</b>, um grupo chamado
      <b> O Coletivo</b> nota você — e a partir daí começam a bater.
    </p>

    <h3>Os dois programas</h3>
    <Botoes linhas={[
      [<>🧱 <b>Firewall</b></>, <>Segura quem bate na porta. Bloqueia ataques de
        força até o nível dele. Sem Firewall, <b>tudo passa</b>.</>],
      [<>🩺 <b>Antivírus</b></>, <>Tira quem já entrou. Recupera 10% por nível do
        que foi levado — no nível 10, devolve tudo.</>],
    ]} />
    <Nota>
      São duas compras porque são dois problemas. Firewall sem Antivírus deixa
      você exposto ao que passar; Antivírus sem Firewall é enxugar gelo.
    </Nota>

    <h3>Como o ataque é resolvido</h3>
    <Passos itens={[
      <>Um ataque tem uma <b>força</b>, que cresce com o número de contas que
        você zerou. Roubar menos também é uma forma de defesa.</>,
      <>Se o nível do Firewall for <b>maior ou igual</b> à força, ele segura.</>,
      <>Se passar, leva uma fatia do seu saldo e ainda soma rastro — a invasão
        sofrida aparece no log do ScanSS como qualquer outra.</>,
      <>O Antivírus devolve a parte dele do que foi levado.</>,
    ]} />

    <p>
      O módulo <b>Defesa</b> no NetRipper mostra a sua exposição, a força
      esperada do próximo ataque e o log de todas as tentativas.
    </p>
  </>
)

const Navegador = () => (
  <>
    <h2>Chroma</h2>
    <p>
      O navegador. É por onde o dinheiro efetivamente sai do banco. Ele não
      acessa a internet de verdade — só os sites que existem dentro do jogo.
    </p>

    <h3>Os controles</h3>
    <Botoes linhas={[
      [<b>Abas</b>, 'Uma por site, cada uma com histórico próprio.'],
      [<b>+ / ×</b>, 'Abre e fecha abas.'],
      [<b>◀ ▶</b>, 'Voltar e avançar no histórico da aba atual.'],
      [<b>🏠</b>, 'Volta para busca.vc.'],
      [<b>Barra de endereços</b>, <>Digite e tecle <b>Enter</b>. <b>Ctrl+Enter</b> abre em aba nova.</>],
    ]} />

    <h3>Os endereços que existem</h3>
    <table className="manual-tabela">
      <tbody>
        <tr><td style={{ width: 118 }}><b>busca.vc</b></td>
            <td>Página inicial, lista todos os outros.</td></tr>
        <tr><td><b>vbank.vc</b></td><td>O banco. Onde o roubo vira dinheiro.</td></tr>
        <tr><td><b>darkmarket.vc</b></td><td>A loja de atualizações.</td></tr>
        <tr><td><b>vmail.vc</b></td><td>Seu e-mail. É por onde a história chega.</td></tr>
        <tr><td><b>noticias.vc</b></td><td>O jornal — publica sobre os <i>seus</i> roubos.</td></tr>
      </tbody>
    </table>
  </>
)

const Banco = () => (
  <>
    <h2>vbank.vc — o roubo</h2>
    <p>
      O momento em que tudo que você fez até aqui vira dinheiro. É o passo que
      mais confunde, então leia com calma.
    </p>

    <h3>Antes de tudo: sua conta laranja</h3>
    <p>
      Na tela de login, do lado direito, tem uma caixa amarela com um número —
      algo como <b>4471-7734</b>. Essa é <b>a sua conta</b>, o destino do
      dinheiro. Você vai digitá-la toda vez.
    </p>

    <h3>Entrar como a vítima</h3>
    <Passos itens={[
      <>Na caixa <b>"Senhas gravadas neste computador"</b>, ache o usuário da
        vítima. Lista vazia significa que você ainda não <i>leu</i> o arquivo no
        Bloco de Notas.</>,
      <>Clique em <B>Preencher</B> — usuário e senha entram sozinhos.</>,
      <>Clique em <B>Entrar</B>.</>,
    ]} />

    <h3>Transferir</h3>
    <Passos itens={[
      <>Confira o <b>saldo disponível</b> da vítima.</>,
      <>Em <b>Conta de destino</b>, digite a <b>sua</b> conta laranja. Qualquer
        outro número é recusado.</>,
      <>Em <b>Valor</b>, digite quanto levar. <B>tudo</B> preenche o saldo inteiro.</>,
      <>Clique em <B>Confirmar transferência</B>.</>,
    ]} />

    <Aviso>
      <b>O rastro é proporcional à fatia levada.</b> Raspar uma conta custa o
      triplo de levar um terço dela — e conta zerada não pode ser roubada de
      novo, além de virar manchete com o nome da vítima.
    </Aviso>
  </>
)

const Loja = () => {
  const game = useGame()
  return (
    <>
      <h2>darkmarket.vc — a árvore de programas</h2>
      <p>
        Você não compra "mais um programa": compra o <b>próximo nível</b> de um
        que já tem. São <b>{BRANCHES.length} programas</b> de{' '}
        <b>{MAX_LEVEL} níveis</b> cada, e o nível seguinte só abre depois do
        anterior.
      </p>

      <h3>Os {BRANCHES.length} ramos</h3>
      <table className="manual-tabela">
        <thead>
          <tr><th style={{ width: 108 }}>Programa</th><th style={{ width: 46 }}>Seu</th>
              <th>O que ele decide</th></tr>
        </thead>
        <tbody>
          {BRANCHES.map((b) => (
            <tr key={b.id}>
              <td><b>{b.icon} {b.name}</b></td>
              <td>{game.level(b.id)}/{skillsOf(b.id).length}</td>
              <td>{b.role}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Os níveis, um a um</h3>
      {BRANCHES.map((b) => (
        <div key={b.id} style={{ marginBottom: 10 }}>
          <h3 style={{ margin: '10px 0 4px' }}>{b.icon} {b.name}</h3>
          <table className="manual-tabela">
            <tbody>
              {skillsOf(b.id).map((s) => (
                <tr key={s.id}>
                  <td style={{ width: 26 }}>{s.level}</td>
                  <td style={{ width: 168 }}><b>{s.name}</b></td>
                  <td style={{ width: 84 }}>
                    {s.price ? `${s.price.toLocaleString('pt-BR')} VC` : 'já vem'}
                  </td>
                  <td>{s.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <Nota>
        <b>Em que investir primeiro?</b> O <b>Decodificador</b> é o ramo mais
        barato e destrava metade do conteúdo das máquinas que você já consegue
        invadir. Depois, <b>Rastreador</b> e <b>Intrusão</b> andam juntos — de
        nada adianta enxergar alvos que você não consegue abrir. O
        <b>Anonimato</b> é o mais caro de todos, mas é o único que melhora
        <i>tudo</i> que você faz, para sempre.
      </Nota>
    </>
  )
}

const Painel = () => (
  <>
    <h2>Painel de Controle</h2>
    <p>
      Mostra o nível de cada um dos seus programas, quanto custa o próximo,
      e quanta evidência está guardada no seu disco agora.
    </p>
    <p>
      Embaixo tem <B>Formatar o micro</B>: apaga saldo, arquivos, senhas e
      programas, e recomeça do zero. Pede confirmação.
    </p>
    <h3>Som</h3>
    <p>
      Em <B>iniciar › Sons e dispositivos de áudio</B> ficam os volumes: música
      e efeitos separados, e uma caixa de <B>Sem áudio</B> para desligar tudo.
      A lista de baixo toca cada som, para você regular ouvindo.
    </p>
    <p>
      A música acompanha o rastreamento — quanto mais perto eles chegam, mais
      apressada ela fica. Vale prestar atenção nela antes de olhar o número.
    </p>
    <Nota>
      O jogo salva sozinho no navegador. Pode fechar a aba e voltar depois que
      está tudo onde você deixou. O volume fica guardado à parte: começar uma
      partida nova não devolve o som que você desligou.
    </Nota>
  </>
)

const Estrategia = () => {
  return (
    <>
      <h2>Como jogar bem</h2>

      <h3>Os alvos são sorteados</h3>
      <p>
        Não existe lista fixa de vítimas: <b>cada varredura gera máquinas
        novas</b>, e o que tem dentro é sorteado. Você nunca fica sem o que
        fazer — mas também não tem garantia de achar algo bom.
      </p>
      <table className="manual-tabela">
        <thead>
          <tr><th style={{ width: 100 }}>O que sai</th><th style={{ width: 58 }}>Chance</th>
              <th>O que você encontra</th></tr>
        </thead>
        <tbody>
          <tr><td><b>Nada</b></td><td>14%</td>
              <td>Só arquivo pessoal. Você gastou rastro à toa — faz parte.</td></tr>
          <tr><td><b>Pouco</b></td><td>38%</td>
              <td>Talvez uma conta pequena, talvez um documento vendável.</td></tr>
          <tr><td><b>Médio</b></td><td>32%</td>
              <td>Uma conta razoável e um ou dois arquivos de valor.</td></tr>
          <tr><td><b>Bom</b></td><td>13%</td>
              <td>Conta gorda e vários documentos caros.</td></tr>
          <tr><td><b>Prêmio</b></td><td>3%</td>
              <td>O achado da semana. Vale abrir tudo.</td></tr>
        </tbody>
      </table>

      <h3>Os andares</h3>
      <p>
        Cada alvo tem um <b>andar</b> de 1 a 10. O andar define três coisas de
        uma vez: o nível de <b>Rastreador</b> para ele aparecer, o de
        <b> Intrusão</b> para invadir, e o quanto ele tende a render. Andar 1
        rende centenas de VC; andar 10, dezenas de milhares.
      </p>
      <Nota>
        Subir o Rastreador não só revela alvos melhores — <b>aumenta o tamanho
        da lista</b> (4 + 2 por nível). Se a varredura disser "lista cheia",
        use <B>Remover</B> nos hosts que você já esvaziou.
      </Nota>

      <h3>Seis coisas que fazem diferença</h3>
      <Passos itens={[
        <><b>Leve em fatias.</b> Três visitas de um terço fazem menos rastro que
          uma que rapa a conta — e a conta continua existindo.</>,
        <><b>Limpe o disco na mesma sessão.</b> Baixou, usou, vendeu ou apagou.
          Guardar loot é o erro mais caro do jogo.</>,
        <><b>Venda arquivos.</b> Planilha e backup viram dinheiro sem passar por
          banco nenhum: quase sem rastro, e ainda tiram a evidência do disco.</>,
        <><b>Invada tudo antes de coletar.</b> Máquina comprometida continua
          comprometida. Abra várias e volte com calma.</>,
        <><b>Descanse.</b> O rastro cai sozinho. Ficar parado é jogada legítima
          — desde que o seu disco esteja limpo.</>,
        <><b>Suba Anonimato quando puder.</b> É o único upgrade que melhora
          <i> tudo</i> que você faz, para sempre.</>,
      ]} />

      <Aviso>
        O erro clássico: invadir, raspar a conta inteira e deixar todo o loot na
        pasta Baixados. O rastro sobe de uma vez com a transferência e depois
        <b> não desce</b>, porque a evidência no disco segura ele lá em cima.
      </Aviso>
    </>
  )
}

/** Capitulo vivo: le o estado real e mostra o que falta fazer. */
const OndeVoceEsta = () => {
  const game = useGame()
  const { feitos, total } = progress(game)

  return (
    <>
      <h2>Onde você está</h2>
      <p>
        Esta lista acompanha a sua partida de verdade. O que estiver marcado,
        você já fez.
      </p>

      <div className="manual-progresso">
        <div className="trilha">
          <div className="preenchido" style={{ width: `${(feitos / total) * 100}%` }} />
        </div>
        <span>{feitos} de {total}</span>
      </div>

      <ol className="manual-checklist">
        {STEPS.map((s) => {
          const ok = isDone(game, s.id)
          const atual = !ok &&
            STEPS.findIndex((x) => !isDone(game, x.id)) === STEPS.indexOf(s)
          return (
            <li key={s.id} className={ok ? 'ok' : atual ? 'atual' : ''}>
              <span className="marca">{ok ? '✔' : atual ? '▶' : '○'}</span>
              <span>
                <b>{s.label}</b>
                <span className="onde">{s.how}</span>
              </span>
            </li>
          )
        })}
      </ol>

      {feitos === total && (
        <Nota>
          Você fechou o ciclo inteiro. Daqui para frente é repetir mirando mais
          alto — e o capítulo <b>Como jogar bem</b> diz o que fazer com isso.
        </Nota>
      )}
    </>
  )
}

const Referencia = () => (
  <>
    <h2>Referência rápida</h2>

    <h3>Atalhos</h3>
    <table className="manual-tabela">
      <tbody>
        <tr><td style={{ width: 200 }}>Dois cliques no ícone</td><td>abre o programa</td></tr>
        <tr><td>Dois cliques na pasta</td><td>entra nela</td></tr>
        <tr><td>Dois cliques na barra de título</td><td>maximiza a janela</td></tr>
        <tr><td>Enter / Esc ao renomear</td><td>confirma / cancela</td></tr>
        <tr><td>Ctrl+Enter no endereço</td><td>abre o site em aba nova</td></tr>
      </tbody>
    </table>

    <h3>Se você travou</h3>
    <table className="manual-tabela">
      <tbody>
        <tr><td style={{ width: 214 }}>A varredura não acha nada de novo</td>
            <td>Os alvos melhores exigem <b>Rastreador</b> de nível maior. Suba no darkmarket.</td></tr>
        <tr><td>"Exige Intrusão nível 2"</td>
            <td>O alvo é forte demais para o seu nível. Suba <b>Intrusão</b>.</td></tr>
        <tr><td>"Analise o host antes de invadir"</td>
            <td>Clique em <B>Analisar</B> primeiro.</td></tr>
        <tr><td>Unidade Z: apagada</td>
            <td>Falta clicar em <B>Conectar</B> no NetRipper.</td></tr>
        <tr><td>Não acho o arquivo de senhas</td>
            <td>Vasculhe as pastas: Área de trabalho, Meus documentos, Pessoal, _particular.</td></tr>
        <tr><td>"Cadeado nível 2; seu Decodificador é nível 1"</td>
            <td>Suba o <b>Decodificador</b> no darkmarket.</td></tr>
        <tr><td>Banco diz "usuário ou senha inválidos"</td>
            <td>Você baixou mas não <i>leu</i>. Dois cliques no arquivo em C:\Baixados.</td></tr>
        <tr><td>"Conta de destino não encontrada"</td>
            <td>O destino tem que ser a sua conta laranja, o número da caixa amarela.</td></tr>
        <tr><td>Meu rastro não desce nunca</td>
            <td>Evidência no disco. Venda ou apague os arquivos em C:.</td></tr>
        <tr><td>Sumiu o "Preencher" de uma vítima</td>
            <td>Você apagou ou vendeu o arquivo de senhas dela. Dá para digitar
                usuário e senha na mão — a senha do correntista não mudou.</td></tr>
      </tbody>
    </table>
  </>
)

const Dev = () => (
  <>
    <h2>Modo desenvolvedor</h2>
    <p>
      Em <b>iniciar › Desenvolvedor</b> existe um programa para inspecionar e
      forçar estados do jogo — útil para ver como cada tela se comporta com
      rastro alto, muito dinheiro ou programas no máximo, sem ter que jogar até
      lá.
    </p>

    <h3>Ele precisa ser ativado</h3>
    <p>
      Ao abrir, ele só mostra um aviso e um botão. Enquanto estiver desativado,
      <b> nenhuma</b> das ações tem efeito — as regras do jogo ignoram tudo que
      vier dali. Isso é proposital: um clique perdido não estraga a partida.
    </p>

    <h3>O que dá para mexer</h3>
    <Botoes linhas={[
      [<b>Dinheiro</b>, 'Somar valores redondos ou definir um saldo exato.'],
      [<b>Nível de procurado</b>, 'Um controle deslizante de 0 a 100, com atalhos para cada faixa — inclusive estourar e ver a tela azul.'],
      [<b>Programas</b>, 'Subir ou descer o nível de cada ramo, ou jogar tudo no máximo.'],
      [<b>Rede</b>, 'Gerar alvos de qualquer andar e abrir tudo de uma vez (invadir + destrancar).'],
      [<b>Tempo</b>, 'Avançar 1, 6 ou 24 horas aplicando a queda de rastro e a evidência do disco.'],
      [<b>Estado bruto</b>, 'XP, evidência, credenciais, contas geradas e os marcos do tutorial.'],
    ]} />

    <Aviso>
      Usar isto estraga a progressão da partida em andamento, e fica registrado
      no save — a tela de ativação avisa se a partida já foi alterada antes.
    </Aviso>
  </>
)

// ---------------------------------------------------------------------------

export const CHAPTERS: Chapter[] = [
  { id: 'bemvindo', title: 'Bem-vindo', Body: Bemvindo,
    klipe: 'Parece que você quer roubar um banco! Deixa eu te explicar como.' },
  { id: 'desktop', title: 'A área de trabalho', Body: AreaDeTrabalho,
    klipe: 'Primeiro o básico: as janelas, os ícones e a barra de baixo.' },
  { id: 'rastro', title: 'O rastro do ScanSS', Body: Rastro,
    klipe: 'Este capítulo separa quem sobrevive de quem é preso.' },
  { id: 'evidencia', title: 'Evidência no disco', Body: Evidencia,
    klipe: 'Eles também vasculham o SEU computador. Quase ninguém percebe isso.' },
  { id: 'netripper', title: 'NetRipper', Body: Ferramenta,
    klipe: 'A ferramenta de invasão. Tudo aqui é clicar, na ordem certa.' },
  { id: 'explorer', title: 'Meu Computador', Body: MeuComputador,
    klipe: 'Aqui você vasculha as pastas da vítima. E arruma as suas.' },
  { id: 'notepad', title: 'Bloco de Notas', Body: BlocoDeNotas,
    klipe: 'O programa mais bobo do jogo é o que destrava o banco. Sério.' },
  { id: 'correio', title: 'O correio e a história', Body: Correio,
    klipe: 'Tem um cara te mandando e-mail. Eu também não sei quem é.' },
  { id: 'defesa', title: 'Defesa', Body: Defesa,
    klipe: 'Você invadiu meio bairro. Achou que ninguém ia revidar?' },
  { id: 'chroma', title: 'O navegador', Body: Navegador,
    klipe: 'Quatro sites, um navegador. É por aqui que o dinheiro anda.' },
  { id: 'banco', title: 'O banco: o roubo', Body: Banco,
    klipe: 'Chegamos na parte boa. É onde todo mundo se perde.' },
  { id: 'loja', title: 'A árvore de programas', Body: Loja,
    klipe: 'Dinheiro parado não invade ninguém. Vamos escolher um ramo.' },
  { id: 'painel', title: 'Painel de Controle', Body: Painel,
    klipe: 'O estado do seu micro numa tela só.' },
  { id: 'estrategia', title: 'Como jogar bem', Body: Estrategia,
    klipe: 'Você já sabe as regras. Agora te conto como não ser pego.' },
  { id: 'onde', title: 'Onde você está', Body: OndeVoceEsta,
    klipe: 'Perdido? Esta lista mostra exatamente o seu próximo passo.' },
  { id: 'referencia', title: 'Referência rápida', Body: Referencia,
    klipe: 'Tudo numa página só, para consultar no meio da partida.' },
  { id: 'dev', title: 'Modo desenvolvedor', Body: Dev,
    klipe: 'Isto aqui é para testar o jogo, não para jogá-lo. Você foi avisado.' },
]
