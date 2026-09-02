# Os e-mails do 3stagiario

Esta pasta é **o roteiro do jogo**. Cada arquivo `.txt` aqui é um e-mail que o
jogador vai receber, e dá para escrever, reescrever e reordenar tudo sem tocar
em uma linha de código — o jogo lê a pasta inteira sozinho.

## Formato

Um cabeçalho de `chave: valor`, uma linha com três traços, e o texto do e-mail:

```
id: 03-primeiro-roubo
assunto: CARACA FUNCIONOU
quando: marco:transfer
objetivo: Comprar o primeiro upgrade no darkmarket
onde: darkmarket.vc -> qualquer ramo -> "Comprar"
feito: marco:buy
---
Iae {apelido}, eu vi o extrato.
Você é oficialmente um criminoso. Parabéns?
```

### Chaves do cabeçalho

| Chave | Obrigatória | O que faz |
|---|---|---|
| `id` | sim | Identificador único. Use um número na frente para manter a ordem legível. |
| `assunto` | sim | O assunto que aparece na caixa de entrada. |
| `quando` | sim | Quando o e-mail chega. Pode repetir a linha: aí **todas** precisam ser verdade. |
| `objetivo` | não | Abre uma missão no quadro do webmail. O texto é o título dela. |
| `onde` | não | Dica de uma linha, mostrada embaixo do título da missão. |
| `feito` | não | O que **conclui** a missão. Pode repetir a linha (todas precisam valer). |
| `de` | não | Remetente. O padrão é `3stagiario@vmail.vc`. |
| `golpe` | não | Transforma o e-mail em golpe: o que acontece com quem clica. Pode repetir a linha. |
| `isca` | não | O texto do link. O padrão é `CLIQUE AQUI`. |

**Sem `feito`, a missão nunca fica concluída** — ela entra no quadro e fica lá
para sempre. Todo `objetivo` precisa de um `feito`, e existe um teste que
reclama se algum ficar sem.

O `quando` da missão é o mesmo `quando` do e-mail: ela entra no quadro quando a
mensagem chega. Missão aberta **não fecha sozinha**, então dá para pedir o
contrário do gatilho — é assim que "chegou a 85% de rastro, agora derruba"
funciona.

### Condições aceitas em `quando` e `feito`

| Condição | Dispara quando |
|---|---|
| `inicio` | Assim que a partida começa. |
| `marco:<id>` | O jogador cumpre um passo do loop (`scan`, `probe`, `exploit`, `connect`, `download`, `creds`, `login`, `transfer`, `delete`, `buy`, `clean`, `sell`). |
| `invasoes:<n>` | Ele já invadiu `n` máquinas. |
| `rastro:<n>` | O rastreamento chega a `n`%. |
| `saldo:<n>` | O saldo chega a `n` V-Coin. |
| `contas:<n>` | Ele zerou `n` contas bancárias. |
| `email:<id>` | Ele **leu** o e-mail de id `<id>`. É assim que se encadeia uma conversa. |
| `defesa:<n>` | Firewall ou Antivírus chegam ao nível `n`. |
| `ataques:<n>` | Ele já sofreu `n` ataques. |
| `bloqueados:<n>` | O Firewall dele já segurou `n` ataques. |
| `roubado:<n>` | Ele já roubou `n` V-Coin **somando a partida inteira**. |
| `tier:<n>` | Ele já invadiu um alvo de nível `n` ou mais. |
| `ramo:<nome>:<n>` | Um ramo chega ao nível `n` (`scanner`, `breaker`, `crypto`, `cleaner`, `ghost`, `firewall`, `antivirus`). |
| `upgrades:<n>` | Ele comprou `n` níveis, somando todos os ramos. |
| `abaixo:<n>` | O rastreamento **cai** para `n`% ou menos. |
| `evidencia:<n>` | A evidência guardada no disco dele cai para `n` ou menos. |
| `tudo:upgrades` | Ele comprou **todos** os níveis de **todos** os ramos. |
| `tudo:missoes` | Ele concluiu **todas** as missões do quadro. |
| `tudo:desafios` | Ele concluiu todos os desafios (sem contar as da história). |

Quase todas comparam por *maior-ou-igual* ("chegou em"). As duas exceções são
`abaixo` e `evidencia`, que comparam por *menor-ou-igual* — são elas que
permitem missão de recuar, e não só de avançar.

`invasoes`, `roubado` e `tier` leem um placar acumulado que **nunca diminui**:
gastar o dinheiro ou esquecer um host no NetRipper não desfaz progresso.

## E-mails de golpe

Um e-mail com `golpe:` ganha um **link clicável** no meio do texto. Escreva
`{isca}` no corpo, na linha onde o link deve aparecer — é ali que ele entra.

```
id: 93-banco
assunto: RECADASTRAMENTO OBRIGATORIO
de: seguranca@vbank-clientes.vc
quando: saldo:3000
golpe: dinheiro:25
isca: ATUALIZAR MEUS DADOS AGORA
---
Confirme sua agencia, conta e senha no formulario abaixo.

{isca}
```

| Efeito | O que faz |
|---|---|
| `golpe: dinheiro:<n>` | Leva **n% do saldo**, com piso de 40 VC. |
| `golpe: rastro:<n>` | Soma `n` de rastreamento e entra no log do ScanSS. |
| `golpe: nada` | Não acontece nada. É a piada. |

É porcentagem, e não valor fixo, porque golpe de 120 VC assusta no primeiro dia
e vira piada com meio milhão no banco.

Cada golpe pega **uma vez só**: depois do clique o link fica riscado e o e-mail
passa a mostrar o estrago. E vale ter algum `golpe: nada` na mistura — se todo
spam cobrar, clicar deixa de ser aposta e vira imposto.

## Missões da história × desafios

O que está nesta pasta são as missões **da história**: chegam por e-mail, uma
puxando a outra, e ensinam o jogo. Os **desafios** ("roubar 250.000",
"invadir 25 computadores") não moram aqui — são números, e vivem em
`src/game/missions.ts`. Os dois aparecem no mesmo quadro, dentro do webmail.

## Como escrever

O narrador é o **3stagiario**: um conhecido que ninguém sabe quem é, sempre bem
informado, sempre debochado. Ele nunca dá ordem — ele sugere, alfineta e some.

- **Curto.** Três a seis linhas. Ninguém lê e-mail de jogo que parece contrato.
- **Direto.** Uma ideia por e-mail. Se tem duas, são dois e-mails.
- **Engraçado.** Piada de informática da época, sempre genérica: computador de
  brinquedo, modem que chia, formata que resolve, gabinete com neon, disquete,
  canal de bate-papo, programa de troca de arquivos.
- `{apelido}` é trocado pelo nome que o jogador escolheu no lobby.
- Sem crase de e-mail corporativo. Ele escreve como gente em mensageiro.

## Uma coisa importante

Quando um e-mail chega, **o jogo pausa**. Isso é de propósito: é o único momento
em que a narrativa tem prioridade sobre a jogatina. Por isso os textos precisam
ser curtos — o jogador está parado esperando para voltar a jogar.
