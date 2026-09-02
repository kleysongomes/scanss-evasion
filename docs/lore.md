# Lore — ScanSS Evasion

Documento-fonte da narrativa: o mundo, quem é quem, e o arco dos seis capítulos
com os beats de e-mail de cada um. Serve como roteiro — o que ainda não foi
implementado está marcado.

Os e-mails já escritos vivem em [`src/game/story/`](../src/game/story/), um
arquivo de texto por e-mail. As frases reutilizáveis (manchetes, avisos) estão
no fim deste documento.

---

## O mundo

**2003.** A banda larga está chegando devagar e ainda divide espaço com o modem
discado. Lan house em cada esquina. Ninguém tem antivírus atualizado, senha é
palavra do time de futebol mais o ano de nascimento, e "pasta compartilhada" é
sinônimo de pasta aberta para o prédio inteiro.

O **V-Bank** acabou de lançar o **V-Coin**, um crédito digital que promete
aposentar o cheque e que ninguém entende direito — o jornal ainda publica
matéria explicando o que é. Para proteger a novidade, os bancos e as operadoras
contrataram a **V-Sec**, que opera o **ScanSS** (*Scanning and Security
Systems*): um sistema que cruza logs de conexão e vai puxando a linha até a casa
de quem fez.

O ScanSS é implacável com peixe pequeno e curiosamente cego para a fraude que
vem de cima. Essa assimetria é o tema do jogo.

### As três forças

| | Quem é | O que quer |
|---|---|---|
| **V-Sec / ScanSS** | A empresa contratada pelos bancos | Fechar caso. Não justiça — estatística de caso fechado. |
| **O Coletivo** | Sindicato hacker de um canal de IRC | Território. Quem não é deles é concorrente. |
| **A delegacia** | Crimes de informática, recém-criada | Provar que existe. Precisa de um caso grande. |

Nenhuma das três é boa. É de propósito.

---

## Personagens

### O protagonista — você

Sem nome até o jogador dar um no lobby. Jovem, endividado, um micro montado de
peças usadas e uma conexão que ele não deveria estar pagando. Aprendeu o que
sabe copiando script de fórum e apanhando.

Não é gênio. **É o que dá certo por insistência.** Não quer ser herói nem vilão
— quer chegar no fim do mês.

### 3stagiario — o narrador

O único personagem que fala com o jogador, e só por e-mail. Ninguém sabe quem
é, nem como sabe tanto. Aparece no primeiro dia dizendo que instalou umas coisas
no seu PC "semana passada, quando você foi buscar café", e nunca explica isso.

**Como ele escreve:** curto, debochado, informal, sempre bem informado. Nunca dá
ordem — sugere, alfineta e some. Usa piada de informática da época. Assina
sempre `-- 3stagiario`.

**Regra de ouro:** ele nunca resolve nada para o jogador. Ele avisa, e depois
comenta o resultado — inclusive quando o jogador ignora o aviso ("Eu avisei no
e-mail passado. Você leu? Ninguém lê.").

**O que ele é de verdade:** revelado no Capítulo 4. Ver *A reviravolta*.

### O Coletivo

Um grupo que se identifica pelo canal onde se reúne. Não tem líder visível, tem
apelidos. Convidam o protagonista no Capítulo 2 e viram caçadores quando ele
recusa.

Falam em plural e em terceira pessoa, sempre com desprezo educado. São
tecnicamente superiores e sabem disso.

### A reviravolta (Capítulo 4)

O **3stagiario** é um analista júnior da própria **V-Sec** — o estagiário que
ninguém olha, com acesso a tudo porque ninguém revoga acesso de estagiário. Ele
não está ajudando por bondade: está usando o protagonista como sonda para
mapear as falhas que a V-Sec esconde dos clientes.

Isso recontextualiza cada e-mail anterior. Ele sempre soube exatamente o quanto
de rastro o jogador tinha, porque ele **lê o painel do ScanSS de dentro**.

---

## Os capítulos

### Capítulo 1 — Sobrevivência no Submundo Digital ✅ implementado

**Premissa.** Endividado, o protagonista aceita a sugestão de um conhecido e
começa a desviar créditos de contas domésticas. Nada sofisticado: senha anotada
em `.txt`, pasta compartilhada esquecida aberta.

**O que o jogador faz.** Aprende o loop: varrer → invadir → conectar →
vasculhar → ler a senha → entrar no banco → transferir → limpar o disco →
comprar upgrade.

**Mecânica que entra.** Rastro do ScanSS, evidência no disco, árvore de
programas, e no fim do capítulo a **defesa** — quando o Coletivo bate na porta.

**Beats de e-mail** (todos escritos):

| # | Gatilho | O beat |
|---|---|---|
| 01 | início | 3stagiario se apresenta, sugere usar o computador velho |
| 02 | primeira varredura | "falei ou não falei" — quanta gente sem senha |
| 03 | primeira conexão | ensina a vasculhar; avisa que baixar não basta, tem que ler |
| 04 | primeira transferência | comemora torto; manda apagar o que já usou |
| 05 | 2 contas zeradas | aponta o jornal: já tem matéria |
| 06 | rastro 55% | explica que o esfriamento desacelera; sugere Faxina |
| 07 | primeira compra | conselho de build: não espalhar níveis |
| 08 | 4 contas zeradas | **o Coletivo notou.** Manda comprar Firewall |
| 09 | firewall nível 1 | "agora você tem uma porta. Ela é de madeira." |
| 10 | primeiro ataque sofrido | "não foi aviso, foi teste" |
| 11 | rastro 85% | pânico; instrução direta |
| 12 | leu o 11 | "o rastro não é um número, é um cronômetro" |
| 13 | saldo 25 mil | deboche sobre o micro; manda subir Anonimato |
| 14 | 8 invasões | gancho: o Coletivo vai mandar um convite. Recuse com jeito |
| 99 | primeiro login no banco | spam de "visitante 1.000.000" pedindo a senha do banco |

O spam existe por dois motivos: humor de época, e ensinar phishing pelo avesso —
o jogador reconhece o golpe que ele mesmo está aplicando.

### Capítulo 2 — O Convite Sombrio 🔲 a fazer

**Premissa.** O Coletivo intercepta a conexão e oferece uma vaga. Recusar é
declarar guerra; aceitar é entregar o próprio micro a eles.

**Mecânica que entra.** A defesa deixa de ser opcional e passa a ser metade do
jogo. Ataques deixam de ser aleatórios e passam a ser **dirigidos**: eles miram
o que dói (o saldo, os arquivos, as credenciais salvas).

**Beats planejados.**

1. O convite. Formal, arrogante, com prazo.
2. A recusa — e o jogador escolhe *como* recusar (a escolha só muda o tom).
3. 3stagiario aprova a recusa e avisa: "agora sobe tudo de defesa".
4. Primeiro ataque coordenado: três tentativas na mesma hora.
5. Eles roubam algo do jogador. Precisa doer.
6. 3stagiario: "eles fizeram com você o que você fez com o Renato Tavares."

**A frase-chave do capítulo:** o jogo vira o espelho para o jogador.

### Capítulo 3 — Falso Positivo 🔲 a fazer

**Premissa.** A delegacia localiza uma assinatura do protagonista, mas o acusa
de um ataque que ele não fez — o Coletivo plantou os rastros. A delegacia quer
um caso grande e não vai checar duas vezes.

**Mecânica que entra.** **Prazo.** Um contador real: dias até a operação. E
invasão de território hostil — os servidores do Coletivo revidam enquanto você
está dentro.

**Beats planejados.**

1. Notícia no jornal com o crime errado.
2. 3stagiario em pânico, sem deboche pela primeira vez.
3. O plano: entrar no Coletivo e extrair os logs originais.
4. Dentro do servidor deles: um arquivo com o seu próprio nome numa lista.
5. Entrega das provas.

**O momento de virada:** achar a lista prova que eles planejaram isso desde o
Capítulo 2. A caçada nunca foi sobre orgulho ferido — era sobre precisar de um
bode expiatório.

### Capítulo 4 — O Consultor Fantasma 🔲 a fazer

**Premissa.** Nome limpo, mas a delegacia conhece o potencial dele. Acordo que
não existe no papel: ele caça o Coletivo para eles.

**Mecânica que entra.** Alvos com contramedida ativa (puzzles de criptografia
em vez de barra de progresso), e ferramentas de nível corporativo.

**Beats planejados.**

1. A proposta, por um canal que não é o e-mail — e isso incomoda.
2. Primeiro alvo entregue pela polícia. Fácil demais. Suspeito.
3. **A revelação:** o jogador invade um servidor da V-Sec e acha o crachá do
   3stagiario. Ele é de dentro.
4. A conversa difícil. 3stagiario não se desculpa: "eu te dei ferramentas,
   informação e aviso. Você nunca perguntou por quê."
5. O jogador decide se continua ouvindo.

### Capítulo 5 — Traição de Estado 🔲 a fazer

**Premissa.** Enquanto usava os serviços dele, a polícia rodava um rastreador em
segundo plano mapeando a conta de créditos principal. Num golpe só, congelam
tudo.

**Mecânica que entra.** Saldo zerado à força — o jogador recomeça a economia com
todos os programas no máximo. O alvo final é a **central de compensação do
V-Bank**, o nó por onde todo V-Coin do país passa.

**Beats planejados.**

1. A tela de saldo zerado, sem aviso.
2. 3stagiario, agora escancarado sobre quem é, oferece a planta da central.
3. Preparação: é o único alvo que exige nível 10 em três ramos.
4. O assalto, em etapas, com o ScanSS na cola em tempo real.

### Capítulo 6 — Fortaleza Digital (endgame) 🔲 a fazer

**Premissa.** O assalto dá certo. Recursos praticamente infinitos, e alvo número
um de todas as agências e sindicatos.

**Mecânica que entra.** **O jogo se inverte.** A tela principal deixa de ser o
IP da vítima e passa a ser o próprio servidor, com portas sendo atacadas em
tempo real. De atacante a defensor: firewalls, contramedidas (Ice / Black ICE),
gestão de recursos.

**O fim.** Sem final feliz disponível. Três saídas:

- **Sumir** — queimar tudo, perder a fortuna, ficar vivo e anônimo.
- **Aguentar** — defender para sempre; o jogo nunca acaba, só fica mais difícil.
- **Entregar** — dar a fortuna e os logs à imprensa. Você cai, a V-Sec cai junto.

O 3stagiario aparece nas três, e em nenhuma ele explica o que ganhou com isso.

---

## Diretrizes de evolução

- **A narrativa está nas ferramentas.** Os programas do Capítulo 1 têm cara de
  coisa feita por gente de fórum (`Varredura local`, `Senha padrão`); os do
  Capítulo 6 têm cara de produto corporativo (`Zero-day`, `Você não existe`).
- **Cada capítulo entra com uma mecânica, não com um número maior.** Capítulo 2
  traz defesa dirigida; 3 traz prazo; 4 traz puzzle; 5 traz reset econômico; 6
  inverte a tela.
- **O jornal é o placar moral.** Quanto mais o jogador rouba, mais nome de
  vítima aparece em `noticias.vc`. Nunca é comentado pelo jogo — só publicado.

## Nada de real

**Regra dura, sem exceção:** nenhum nome de produto, empresa, pessoa, time ou
serviço que exista de verdade entra no jogo — nem nos textos, nem nos nomes de
arquivo, nem nas pastas de sistema, nem nas senhas geradas. E em lugar nenhum se
diz que o jogo foi "inspirado" em algo real.

O sistema é o **WinDoors**, com `WINDOORS\sistema32\wdcore32.dll`. O navegador
é o **Chroma**, o buscador é o **busca.vc**, o banco é o **V-Bank**, o correio é
o **VMail**. As referências de época são todas genéricas: *computador de
brinquedo*, *modem que chia*, *canal de bate-papo*, *programa de troca de
arquivos*.

O único nome verdadeiro no jogo inteiro é o do autor, na abertura.

## Âncoras de época

O que mantém o jogo em 2003 e deve aparecer nos textos:

- Micro montado de peças, não "VM alugada". Formatar o micro é o reset.
- Modem discado que cai, banda larga como luxo, lan house como alternativa.
- Senha em `.txt` no Desktop, pasta compartilhada aberta, `senhas.doc`.
- Fórum, canal de bate-papo, mensageiro, programa de troca de arquivos.
  Sempre genérico: nada de marca ou produto que exista de verdade.
- CD-R gravado, disquete, pendrive ainda caro, gabinete com neon.
- "Formata que resolve", "tá no cabo", "reinicia que volta".
- V-Coin como novidade que o jornal ainda explica para o leitor.

## Frases reutilizáveis

Banco de linhas prontas para as telas que precisam de sabor. Use, misture,
reescreva — mas mantenha o tom.

### Manchetes do jornal (por situação)

**Contas zeradas**
- "{n} correntista(s) do V-Bank relatam contas zeradas"
- "Banco nega falha e orienta troca de senhas"
- "Cliente descobre conta vazia ao tentar pagar o aluguel"
- "V-Bank diz que 'não houve invasão' e não explica o que houve"

**Rastro alto**
- "ScanSS eleva nível de monitoramento na rede metropolitana"
- "V-Sec confirma operação contra invasor não identificado"
- "Fontes: prisão seria 'questão de horas'"
- "Delegacia de crimes de informática pede reforço de equipe"

**Muitas invasões**
- "Onda de invasões atinge escritórios da zona norte"
- "Especialistas apontam senha em arquivo de texto como porta de entrada"
- "Comércio adia adesão ao V-Coin por 'insegurança'"

**Ruído de fundo (sempre disponíveis)**
- "V-Coin fecha o dia em leve alta"
- "Prefeitura promete internet em todas as escolas até 2006"
- "Lan house do centro é fechada por falta de licença"
- "Especialista ensina: como escolher uma senha segura"

### Avisos do ScanSS (bandeja)

- **atenção** — "Seus pacotes estão sendo amostrados. Nada grave ainda — mas o relógio começou."
- **alerta** — "A V-Sec está correlacionando seus saltos. Considere limpar os logs."
- **crítico** — "Eles estão a poucos saltos. Limpe os logs AGORA ou eles chegam aqui."

### Falas do Klipe (assistente)

- "Parece que você quer roubar um banco!"
- "O programa mais bobo do jogo é o que destrava o banco. Sério."
- "Este capítulo separa quem sobrevive de quem é preso."
- "Eles também vasculham o SEU computador. Quase ninguém percebe isso."
- "Isto aqui é para testar o jogo, não para jogá-lo. Você foi avisado."

### Linhas do Coletivo (Capítulo 2+)

- "Nós vimos o que você fez. Foi feio, mas funcionou."
- "Estamos oferecendo uma vez."
- "Você não é bom. Você é sortudo. Isso acaba."
- "Não é pessoal. É território."

## Créditos (registro de ideias)

Kleyson Gomes.
