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
| `objetivo` | não | Vira a "missão atual" mostrada no topo do webmail. |
| `feito` | não | Condição que marca a missão como cumprida. Mesma sintaxe do `quando`. |
| `de` | não | Remetente. O padrão é `3stagiario@vmail.vc`. |

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
