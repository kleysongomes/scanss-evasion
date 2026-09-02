# Design — ScanSS Evasion 2.0

Documento de design do jogo. A narrativa que o sustenta está em
[lore.md](lore.md).

## A ideia central

Um simulador de hacker costuma resolver tudo com comandos: `extract_funds` e o
dinheiro aparece. Aqui **o arquivo roubado não é dinheiro — é uma senha**, e senha só
vira dinheiro se você abrir o navegador, entrar no site do banco como a vítima e
fazer a transferência com as próprias mãos.

Essa é a mudança que carrega o resto do design: o desktop existe porque o roubo
precisa de mais de um programa para acontecer.

## O loop

```
 NetRipper           Meu Computador (Z:)     Bloco de Notas      Chroma
 ─────────           ───────────────────     ──────────────      ──────
 Varrer rede         vasculha as pastas  →   abre senhas.txt  →  vbank.vc
 Analisar        →   quebra cadeados         credencial salva    login como a vítima
 Invadir             baixa o que serve                           transfere
 Conectar                                                        ↓
                     ↓                                           darkmarket.vc
                Meu Computador (C:)                              sobe um nível
                vende ou APAGA o loot   ←────────────────────────┘
                (senão o rastro nunca desce)
```

Cada etapa mora num programa diferente **de propósito**. Ninguém precisa decorar
comando para roubar: precisa entender o sistema.

## Recursos do jogador

| Recurso | O que é | Como sobe | Como desce |
|---|---|---|---|
| **V-Coin** | dinheiro | transferências, venda de arquivos, carteiras | upgrades no darkmarket |
| **Rastro** | atenção do ScanSS (0–100) | toda ação; **e a evidência parada no seu disco** | tempo (cada vez mais devagar) e o ramo Faxina |
| **Níveis** | os sete programas | comprar o nível seguinte de um ramo | — |

Chegar a **100 de rastro** = tela azul e micro apreendido. É o único fim de jogo.

### O esfriamento é não-linear

A queda do rastro **desacelera conforme ele sobe**: −6/hora no verde, −1,2/hora
no vermelho. Sair de 90% só esperando leva mais de trinta horas de jogo.

A primeira versão usava queda constante e generosa, e o resultado era que ficar
alguns segundos com o jogo aberto zerava o rastro — o recurso central não
custava nada. Agora ficar quieto ainda é jogada válida no verde e no amarelo,
mas deixar chegar no vermelho é um erro caro, e é o que dá razão de existir ao
ramo **Faxina**.

### A evidência no disco

Baixar não é de graça nem é definitivo: **o ScanSS também varre a sua máquina**.
Cada arquivo roubado tem um peso incriminador (`evidence`) e, enquanto estiver
no seu C:, converte-se em rastro contínuo. Para calibrar: o rastro cai 15 por
hora sozinho, e ~62 de evidência anulam essa queda por completo.

Isso resolve um problema do desenho anterior, em que baixar tudo era sempre
correto. Agora o ciclo é **baixar → usar → vender ou apagar na mesma sessão**, e
o botão *Excluir* do Explorer é uma jogada, não uma faxina cosmética.

## Progressão: a árvore de programas

Sete programas — cinco de ataque, dois de defesa —, **dez níveis cada**, e o
nível N só abre depois do N−1. O
jogador escolhe em qual ramo investir, e a escolha muda o que ele consegue
fazer:

| Ramo | O que o nível decide |
|---|---|
| 📡 **Rastreador** | quais alvos *aparecem* na varredura — e quantos cabem na lista (4 + 2 por nível) |
| 🔨 **Intrusão** | quais alvos você consegue abrir |
| 🔓 **Decodificador** | até que nível de cadeado você lê |
| 🧹 **Faxina** | quanto rastro cada limpeza derruba (23 → 68) |
| 🛰️ **Anonimato** | quanto rastro você deixa de gerar (−8,5% → −70%) |

Os preços saem de uma fórmula (`priceOf`), crescendo ~2,3× por nível: o nível 1
de um ramo custa algumas centenas, o nível 10 custa entre 350 mil e 860 mil.
Só Rastreador e Intrusão nível 1 vêm de brinde — os outros ramos se compram
desde o primeiro nível.

Rastreador e Intrusão andam em par: de nada adianta enxergar um alvo que você
não consegue abrir. É a tensão de compra mais interessante do começo.

## Os alvos são sorteados

Não existe lista fixa de vítimas. **Cada varredura gera máquinas novas** até a
capacidade do Rastreador, então esvaziar o que está na tela nunca trava o jogo —
antes, com dois alvos fixos, o jogador era obrigado a comprar upgrade para poder
continuar.

Cada alvo tem um **andar** de 1 a 10 que define, de uma vez, o Rastreador para
aparecer, a Intrusão para invadir e o quanto tende a render. E o que tem dentro
é sorteado com peso:

| Resultado | Chance | O que sai |
|---|---|---|
| Nada | 14% | só arquivo pessoal — você gastou rastro à toa |
| Pouco | 38% | conta pequena ou um documento vendável |
| Médio | 32% | conta razoável e um ou dois arquivos de valor |
| Bom | 13% | conta gorda e vários documentos caros |
| Prêmio | 3% | o achado da semana |

A faixa de "nada" é deliberada: varredura sem garantia é o que faz a boa achada
valer alguma coisa.

### A curva

Uma conta do andar 1 rende de 70 a 476 VC; do andar 10, de 8 a 60 mil. Contra
upgrades que vão de centenas a centenas de milhares, isso dá dezenas de horas de
progressão em vez dos **três roubos** que compravam a loja inteira na versão
anterior. Os alvos gerados ficam sempre perto do seu alcance atual (andar do seu
Rastreador, menos 0 a 2), então nem trivializa nem trava.

## Invadir é clicar, não digitar

A primeira versão fazia a invasão por linha de comando, com o jogador redigitando
o IP em quatro comandos seguidos. Foi trocada pelo **NetRipper**: lista de hosts
à esquerda, detalhes do alvo à direita, botões *Analisar / Invadir / Conectar*, e
cada operação com barra de progresso e log. Ninguém invade nada digitando
`connect 10.0.4.17` — e ficar redigitando IP era atrito puro.

## As máquinas têm pastas

Cada alvo tem uma árvore de pastas de um Windows de 2003 — *Meus documentos*,
*Minhas imagens*, *Área de trabalho*, *WINDOWS*, *Arquivos de programas* — com
fotos, MP3, trabalho de faculdade, lista de mercado e DLLs. O que interessa está
**enterrado no meio disso**, às vezes numa pasta `_particular`.

As pastas de sistema nunca têm nada de útil, de propósito: são o ruído que faz
vasculhar valer a pena. E o seu próprio C: é uma árvore que você organiza —
criar pasta, renomear, recortar/colar, excluir.

## A tela de Situação

Clicar em qualquer parte da bandeja (relógio, saldo ou escudo) abre um resumo:
o medidor de rastro em tamanho grande com o diagnóstico em texto, **a conta de
quanto sobe e quanto desce por hora** (queda natural −15 contra a evidência do
disco), dinheiro, contas zeradas, senhas guardadas, hosts na lista e o nível dos
programas.

O número que importa ali é o **saldo por hora**: se estiver positivo, o rastro
está subindo sozinho e o jogador precisa limpar o disco. Era a informação mais
difícil de deduzir e agora está escrita.

## O que dá o clima

- **A bandeja do sistema** mostra o rastro em tempo real, mudando de cor
  (verde → amarelo → laranja → vermelho).
- **Balões de notificação** do XP avisam quando o rastro sobe de faixa — a
  mesma linguagem visual de um antivírus reclamando.
- **noticias.vc** publica manchetes sobre os seus roubos. Zerou a conta de
  alguém, o nome da pessoa aparece no jornal. É o placar moral do jogo.
- **A tela azul** no lugar de um "game over" genérico.
- **Os sites são de 2003**, não de hoje: bordas biseladas, Verdana 11px, links
  azuis sublinhados, tabelas com grade, "melhor visualizado em 1024x768". O
  banco parece um internet banking da época; o darkmarket parece um site warez
  de fundo preto e texto verde; o busca.vc parece um buscador com abas e o
  botão "Estou com sorte". As classes ficam em `styles/retro-web.css` — use
  `.box`, `.btn-old`, `.fld-old` e `.tbl-old` ao criar um site novo.

  Nenhuma marca real aparece: o navegador é o **Chroma**, o buscador é o
  **busca.vc**, o sistema é o **WinDoors XP**. Tudo paródia.

## O tutorial: o Manual do Operador

O jogo tem muita tela e nenhum menu de missão, então um jogador novo precisa de
um manual de verdade — não de dicas soltas. O **Manual do Operador** é uma
janela como qualquer outra (ícone na área de trabalho e em **iniciar › Ajuda e
suporte**), com sumário à esquerda e 13 capítulos:

1. **Bem-vindo** — o que é o jogo e a regra que muda tudo (arquivo ≠ dinheiro).
2. **A área de trabalho** — ícones, janelas, barra de tarefas, bandeja.
3. **O rastro do ScanSS** — as 4 faixas, a tabela do que sobe e do que desce.
4. **Prompt de Comando** — a sequência da invasão e cada comando.
5. **Meu Computador** — as duas unidades, o cadeado, os 4 botões.
6. **Bloco de Notas** — por que ler é obrigatório.
7. **O navegador** — abas, endereços, controles.
8. **O banco** — o roubo passo a passo, o que mais confunde.
9. **A loja** — o catálogo e a ordem recomendada de compra.
10. **Painel de Controle** — programas instalados e formatar.
11. **Como jogar bem** — a tabela de alvos e as cinco decisões que importam.
12. **Onde você está** — checklist vivo, derivado dos marcos reais da partida.
13. **Referência rápida** — comandos, atalhos e "se você travou".

Duas coisas o mantêm honesto: os preços, os alvos e as ferramentas saem de
`game/content.ts`, então o manual não desatualiza quando o balanceamento muda;
e o capítulo 12 lê `game/progress.ts`, então o checklist reflete o que o jogador
de fato fez — se ele invadiu uma máquina sozinho, o passo já aparece marcado.

O **Klipe** — o clipe de papel animado, homenagem ao assistente do Office — é o
guia: fica no rodapé do sumário comentando o capítulo aberto, e aparece uma vez
na primeira partida oferecendo abrir o manual. Ele **não** é um sistema de dicas
avulsas; a primeira versão era, e o resultado foi uma fila com duas entradas
girando em círculo.

## Modo desenvolvedor

Em **iniciar › 🛠️ Desenvolvedor** há um programa para inspecionar e forçar
estados: dinheiro, nível de procurado, nível de cada programa, gerar alvos de
qualquer andar, abrir tudo e avançar o relógio.

Ele tem uma **trava de ativação**, e a trava é de verdade: o store ignora toda
ação `dev*` enquanto `devMode` estiver desligado, então o botão não é
decorativo — a garantia está na camada de regras, não na interface. A partida
também registra `devUsed`, para ficar honesto que aquele save foi alterado.

## A abertura e o prólogo

São duas coisas separadas, e a separação é o ponto.

**A abertura** roda toda visita, então é curta: tela preta, uma frase sobre o
jogo escrita letra a letra, e três cartelas com cursor piscando entre elas —
*um jogo independente*, *por Kleyson Gomes*, o título. Qualquer tecla entra no
menu, Esc pula.

**O prólogo** é a ambientação — 2003, a internet que chia, quem é o protagonista
— e só toca ao **começar uma partida nova**. A primeira versão colocava esse
texto na abertura, e o problema apareceu na hora: um texto de ambientação que se
repete a cada visita deixa de ambientar e vira obstáculo. Aqui ele é a primeira
coisa que o jogador vê do personagem, já chamando pelo apelido que ele acabou de
escolher.

A escrita é lenta de propósito (~48ms por letra, com respiro extra depois de
ponto). Texto que aparece rápido informa, não ambienta.

**Tela cheia** acontece antes de tudo. A abertura abre numa tela preta com um
*clique para iniciar* e nada mais — e é esse clique que dispara o pedido, antes
do primeiro texto.

Essa porta de entrada não é decoração: navegador nenhum aceita entrar em tela
cheia ao carregar a página, o pedido precisa vir de um gesto. Como o jogo tem
que estar em tela cheia antes de qualquer texto, o gesto precisa ser a primeira
coisa que existe. Dela em diante o jogo não pede mais nada — F11 resolve o
resto.

## O lobby

Abrir a URL cai na **tela de boas-vindas do XP**, não direto no desktop. Ela
resolve duas coisas de uma vez: é onde se escolhe entre continuar e recomeçar
(mostrando saldo, rastro e invasões da partida salva), e é onde o jogador digita
o **apelido** que o 3stagiario vai usar nos e-mails.

`started` e `paused` são deliberadamente **não persistidos**: recarregar a página
sempre volta ao lobby, e um jogo salvo pausado não faz sentido.

## A história chega por e-mail

Um personagem chamado **3stagiario** manda e-mail para o jogador em
`vmail.vc` — um webmail de 2003 dentro do Chroma. É por ele que a narrativa e as
missões acontecem, sem nenhuma tela de "missão" fora do mundo do jogo.

**O roteiro mora em arquivos de texto**, um por e-mail, em
[`src/game/story/`](../src/game/story/). Cada arquivo tem um cabeçalho com o
gatilho de entrega (`quando: marco:transfer`, `quando: rastro:55`,
`quando: contas:4`…) e o corpo. Adicionar um `.txt` na pasta é suficiente para
ele entrar no jogo — o formato está documentado em `story/LEIA-ME.md`.

### A pausa

Quando um e-mail chega, **o jogo pausa** e um aviso aparece no canto inferior
direito. O relógio para, o rastro não cai, ataques não acontecem. É o único
momento em que a narrativa tem prioridade sobre a jogatina — e é justamente por
isso que os textos precisam ser curtos. O jogador está parado esperando para
voltar a jogar.

A pausa **não é anunciada**. O balão dizia "o jogo está pausado até você ler", e
ler que se está num jogo — dentro de um sistema operacional de mentira —
quebrava a ilusão inteira por um aviso que ninguém pediu. Quem quiser continuar
clica em "Depois" e o relógio volta a andar, sem explicação.

Os três avisos do canto (e-mail, missão concluída e faixa de rastro) vivem numa
**pilha**, e não cada um com o seu `position: absolute`. Antes o balão do rastro
chegava por cima do aviso de e-mail e escondia os botões dele, deixando a pausa
sem saída visível.

### O spam morde

Nem todo e-mail é do 3stagiario. Oito mensagens de golpe chegam ao longo da
partida — prêmio de visitante, herança de parente distante, recadastramento do
banco, acelerador de conexão, corrente da tia, vaga de "representante
financeiro" — e o **link no meio do texto funciona**.

Clicar cobra: uma porcentagem do saldo (piso de 40 VC) ou rastro, que entra no
log do ScanSS como qualquer outra ação. É porcentagem e não valor fixo porque
golpe de 120 VC assusta no primeiro dia e vira piada com meio milhão no banco.

Um deles não faz nada. Isso é de propósito: se todo spam cobrasse, clicar
deixaria de ser aposta e viraria imposto — e o jogador simplesmente pararia de
abrir. O estrago fica guardado no próprio e-mail, então reabrir a mensagem
semanas depois continua contando o que aquele clique custou, e o golpe só
pega uma vez.

### O quadro de missões

O webmail tem uma segunda aba, **Missões**, com tudo que o jogador já fez e
tudo que ainda falta. O que está cumprido aparece **riscado**, não desaparece:
o valor da lista é justamente poder olhar para trás.

São duas famílias no mesmo quadro:

| | Missões da história | Desafios |
|---|---|---|
| **De onde vêm** | `story/*.txt`, por e-mail | `src/game/missions.ts` |
| **Para que servem** | ensinar o jogo na ordem | dar meta grande e livre |
| **Exemplo** | "monte o disco da vítima" | "roube 250.000 no total" |
| **Pagam?** | não — quem paga é o roubo | sim, prêmio em VC |

A divisão de arquivo segue a diferença de natureza: guia é prosa (e prosa se
edita em `.txt`), desafio é número. Os prêmios dos 16 desafios somam menos de
100 mil VC, contra milhões para fechar a árvore — são empurrão, não atalho, e
existe um teste que trava essa proporção.

Toda missão tem **duas** condições: `quando` (entra no quadro) e `feito` (fica
concluída). São separadas porque muitas metas boas são impossíveis numa condição
só — *"passou de 70% de rastro e voltou para menos de 20%"* tem as duas metades
nunca verdadeiras ao mesmo tempo.

Duas coisas são **estado salvo**, e não cálculo na hora de desenhar a tela:

- **quais missões já apareceram** — sem essa memória, o desafio de rastro sairia
  do quadro no caminho de volta e nunca poderia fechar;
- **quais já foram concluídas** — conclusão é definitiva. Uma missão que se
  desmarca quando o rastro sobe de novo não é missão, é termômetro.

Pelo mesmo motivo existe um **placar acumulado** (`recordes`) para invasões,
total roubado e maior alvo. As métricas óbvias enganam: o saldo cai quando o
jogador investe na árvore, e a lista de máquinas encolhe quando ele arruma o
NetRipper. Medir desafio por elas puniria justamente quem joga bem.

### O fim da beta

Quem fecha **todas** as missões e **todos** os 70 níveis recebe um último
e-mail (`15-beta.txt`) dizendo que chegou ao fim da versão beta. É o único
final "positivo" do jogo hoje — o outro é a tela azul.

### O tom

O 3stagiario nunca dá ordem: sugere, alfineta e some. Piada de informática de
2003 (computador de brinquedo, formata que resolve, modem que chia), três a seis
linhas por
e-mail, uma ideia por vez. Ele também comenta quando o jogador ignora o aviso
anterior — *"Eu avisei no e-mail passado. Você leu? Ninguém lê."*

## Defesa: eles também invadem você

Dois ramos novos na árvore, com os mesmos dez níveis:

| Ramo | O que faz |
|---|---|
| 🧱 **Firewall** | Segura ataques de força até o nível dele. Sem ele, tudo passa. |
| 🩺 **Antivírus** | Recupera 10% por nível do que foi levado pelo que passou. |

São duas compras porque são dois problemas — firewall segura na porta,
antivírus limpa a casa. Ataques só começam **depois de 4 contas zeradas**: antes
disso ninguém tem motivo para bater na porta de quem não incomodou ninguém. A
força escala com quantas contas o jogador zerou, então **roubar menos também é
uma forma de defesa**.

Um ataque que passa leva uma fatia do saldo e **soma rastro** — a invasão
sofrida entra no log do ScanSS como qualquer outra ação.

## O que ainda não existe

O jogo está em **beta**: o Capítulo 1 fecha, os capítulos 2 a 6 estão escritos
em [`lore.md`](lore.md) mas não implementados. A versão e a data da build saem
do `package.json` e do último commit, e aparecem no cabeçalho do site e no menu
do jogo — nenhum número escrito na mão.

Ordem sugerida para as próximas rodadas:

1. **Tela de boot + logon do XP** ao abrir o jogo (com a barrinha azul).
2. **Contratos** num quadro da deep web (`shadowboard.vc`): objetivos com prazo
   e reputação, para dar direção a quem não quer só farmar.
3. **Webmail das vítimas** (`vmail.vc`) — recuperar senha por e-mail em vez de
   só achar em arquivo de texto. Abre um segundo caminho de invasão.
4. **2FA no banco** para as contas corporativas.
5. **Varredura ativa do ScanSS**: um evento visível ("varredura em andamento")
   que dê ao jogador alguns segundos para apagar o disco antes de ser pego.
6. **Alvos gerados proceduralmente** em vez da lista fixa de `content.ts`.
7. **Empacotar com Tauri** para gerar o `.exe` (precisa instalar o Rust).

## A vitrine

A landing (`src/landing/`) segue três regras.

**A página é do mundo do jogo.** Foi a lição dos sites dos jogos do gênero: os
que funcionam não falam *sobre* o jogo de fora, eles vestem a linguagem dele —
o site do EXAPUNKS mistura artefatos da ficção com a divulgação, o do Hacknet
apresenta a informação como se fosse arquivo de sistema. Aqui isso virou
monoespaçada em tudo, cabeçalho em forma de barra de status, rótulo de seção com
prompt (`> a ferramenta`), linha de comando acima do título e o cursor do
prólogo piscando no fim do nome.

Foi essa a correção mais importante. As versões anteriores eram *uma página de
marketing moderna sobre um jogo de 2003*: fonte de sistema, azul neutro, botão
arredondado, grade de quatro cartões iguais com título e parágrafo — que é,
literalmente, o bloco de "features" de site de software. Por mais escura que a
página ficasse, o sotaque continuava sendo o de site institucional.

Daí também vem o resto: botão quadrado, amarelo, com sombra dura; a grade de
regras virou lista numerada; e as telas **sangram pela borda** da janela em vez
de ficarem presas dentro da coluna, que é o que separa cena de jogo de figura
de relatório.

**O print é o cenário, não a ilustração.** Cada seção ocupa a largura toda com
uma tela do jogo ao fundo, desfocada, e o texto por cima. A primeira versão era
um site de empresa — bloco de texto, imagem ao lado, repetir; site de jogo
funciona pelo avesso. E os prints das cenas são tirados com a **janela
maximizada**: janelinha no meio do papel de parede é 70% de nada, e a página
inteira acabava parecendo um único desktop esticado. A exceção é o Explorer, que
em tela cheia vira cinco pastas perdidas num campo branco.

**O texto não inventaria.** Havia duas colunas, "o que já está no jogo" e "ainda
não existe", com o roteiro dos próximos capítulos listado de graça para quem nem
tinha começado a jogar. Virou uma seção "em desenvolvimento" com promessas
curtas e vagas — *"um convite que é melhor recusar"* —, que dão vontade sem
contar o final. Vitrine de jogo não é catálogo.

O que fica explícito é o **estado**: versão e data da build no cabeçalho, vindas
do `package.json` e do último commit.

## Som

Todo som é **sintetizado na hora**, com Web Audio. Não existe um arquivo de
áudio no projeto, e a razão principal não é peso: som de sistema de verdade é
marca registrada, e o jogo inteiro se cuida para não usar nome nem cara de
produto real — sairia estranho quebrar isso justamente no "toc" de uma tecla.
De quebra, bipe de oscilador **é** o som da época, então a limitação vira
sotaque, e não sobra nada para baixar nem para guardar em cache.

A regra de desenho: som de jogo é pontuação, não trilha. Nada passa de meio
segundo, exceto a sirene — o único aviso que precisa assustar, e mesmo ela
dura 0,6s, porque alarme que se arrasta faz o jogador desligar o som e perder
justamente o aviso que importava.

**A trilha acompanha o rastreamento.** Um sequenciador de dezesseis passos toca
um baixo lento em tom menor, e acelera conforme o jogador esquenta. É o único
jeito honesto de uma música de fundo participar do jogo: dá para perceber que
apertou antes de olhar o número.

Quem dispara os sons é a interface, nunca as regras — `game/` não sabe que
existe tela, e não pode passar a saber que existe alto-falante. Um componente
(`os/Som.tsx`) assina o estado e compara o antes com o depois: roubo é o total
roubado que subiu, prisão é o `busted` que virou verdadeiro. A vantagem é que
fonte nova de dinheiro já nasce com som; a desvantagem é que o som não
distingue duas causas do mesmo efeito, e por isso a ordem dos testes importa —
roubo antes de venda, porque transferir mexe nos dois números.

Os volumes moram em `iniciar › Sons e dispositivos de áudio`, um applet no
formato do Painel de Controle da época, com a lista de eventos e botão de tocar
cada um. Configuração de jogo dentro de um sistema operacional falso tem que
morar onde a configuração moraria.

Eles são guardados **numa chave separada da do save**: volume não é progresso, e
começar uma partida nova não pode religar o som de quem desligou.

E tudo degrada em silêncio. Sem Web Audio — navegador antigo, áudio bloqueado,
os testes rodando em Node — as funções simplesmente não fazem nada. Som é
enfeite: nada aqui pode derrubar o jogo por causa de um "toc" de tecla.

## Instalar, e não baixar um `.exe`

O jogo se instala como **aplicativo** (PWA): ícone de verdade no sistema, janela
sem barra de navegação e funciona sem rede.

Não existe executável, e a decisão é deliberada. Um `.exe` sem assinatura
digital leva bronca do Windows na primeira execução; antivírus implica com um
programa cheio de "exploit", "scanner" e "keylogger" nos textos; e cada jogador
ficaria **congelado na versão que baixou**, o que é grave num jogo em beta cujo
save é aposentado quando as regras mudam. Some a isso empacotar com Rust para
ganhar, no fim, só a sensação de "jogo de verdade".

O trabalhador de serviço usa `registerType: 'autoUpdate'`: a build nova é
buscada em segundo plano e assume no carregamento seguinte. É justamente o que o
`.exe` não daria.

Três detalhes que valem lembrar:

- `start_url` aponta para `jogo/`, e não para a raiz — quem instalou já decidiu
  que quer jogar, não ler a vitrine.
- O registro é feito à mão nas duas entradas (`main.tsx`), porque são duas
  páginas e a injeção automática só cuida da principal.
- As fontes vêm de fora, então têm cache próprio. Sem isso, o jogo offline cairia
  na fonte reserva e **a logo mudaria de cara** justamente quando o jogador está
  sem rede.

Os ícones saem de `npm run icones`, que desenha a marca num navegador e
fotografa em cada tamanho — mesma ideia dos prints. Quando a logo mudar, um
comando refaz o conjunto inteiro, em vez de sobrar um PNG velho contando a
versão antiga da história.

## Uma janela por programa

O Chroma é **janela única**, como quase todo app do jogo. Ele tem abas, então
"abrir o vmail" a partir de um aviso vira uma aba — e não a quinta janela igual
na tela, que era o que acontecia: cada pedido de navegação abria um navegador
novo.

Como a janela já existe, o pedido chega trocando os `args` dela, o que exige um
efeito no componente e não só o estado inicial. A comparação é pela identidade
do objeto, e não pela url, porque pedir duas vezes o mesmo endereço tem que
funcionar das duas vezes.

## Ambientação

O jogo se passa em **2003** — não no futuro. Isso vale para os textos também:
é um *micro* montado de peças usadas, não uma "VM alugada"; o V-Coin é um
crédito digital que o jornal ainda precisa explicar para o leitor; perder é o
ScanSS puxar a linha até a sua casa. As âncoras de época estão listadas no fim
de [lore.md](lore.md).

## Nota

Bancos, lojas, empresas e pessoas deste jogo são **inteiramente fictícios**, e
os sites existem apenas dentro da janela do jogo — não há rede real envolvida.
