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
| **Níveis** | os cinco programas | comprar o nível seguinte de um ramo | — |

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

Cinco programas, **dez níveis cada**, e o nível N só abre depois do N−1. O
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

## Invadir é clicar, não digitar## Invadir é clicar, não digitar

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
cinco programas.

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
estados: dinheiro, nível de procurado, nível dos cinco programas, gerar alvos de
qualquer andar, abrir tudo e avançar o relógio.

Ele tem uma **trava de ativação**, e a trava é de verdade: o store ignora toda
ação `dev*` enquanto `devMode` estiver desligado, então o botão não é
decorativo — a garantia está na camada de regras, não na interface. A partida
também registra `devUsed`, para ficar honesto que aquele save foi alterado.

## O que ainda não existe

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

## Ambientação

O jogo se passa em **2003** — não no futuro. Isso vale para os textos também:
é um *micro* montado de peças usadas, não uma "VM alugada"; o V-Coin é um
crédito digital que o jornal ainda precisa explicar para o leitor; perder é o
ScanSS puxar a linha até a sua casa. As âncoras de época estão listadas no fim
de [lore.md](lore.md).

## Nota

Bancos, lojas, empresas e pessoas deste jogo são **inteiramente fictícios**, e
os sites existem apenas dentro da janela do jogo — não há rede real envolvida.
