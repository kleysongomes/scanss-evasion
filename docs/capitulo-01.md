# Capítulo 1 — Sobrevivência no Submundo Digital (mecânicas)

## Contexto

Hacker iniciante e endividado. Alvos de baixo nível (roteadores domésticos,
câmeras de segurança) para conseguir moeda virtual e pagar a dívida diária. O
ScanSS já está ativo: equilíbrio constante entre **risco de rastreamento** e
**tempo disponível no dia**.

## Mecânica 1 — Relógio e Economia

- **Relógio interno**: o dia começa às **08:00** e termina às **00:00** (16h úteis).
- O **tempo é o recurso principal**: toda ação consome frações do dia
  (ex.: escanear = 30 min; quebrar senha = 2 a 4 h, conforme a dificuldade).
- Ao bater **00:00**, o dia vira e a **dívida diária** fixa é deduzida do saldo.
- Saldo negativo por **3 dias consecutivos** → **Game Over** (falência).

## Mecânica 2 — Invasão básica

- Escanear gera **alvos locais procedurais** (tipo, dificuldade, loot).
- Ferramentas iniciais (amadoras):
  - **Open_ds_Hacker_v0.1** — inicia a conexão (tempo mínimo).
  - **find_password_v0.1** — força bruta; tempo **dinâmico** conforme a
    dificuldade. O jogador decide se ainda há horas no dia para concluir.
- Invasão concluída antes da virada do dia → coleta o **loot** (moedas).

## Mecânica 3 — Risco e ScanSS

- Variável global de **Nível de Rastreamento (%)**.
- Cada ação aumenta o rastreamento por uma taxa.
- Rastreamento em **100%** → pego pelo ScanSS: a conexão cai, **o dia encerra
  imediatamente** (perde as horas restantes), **todo o dinheiro roubado no dia é
  confiscado** e uma **multa** é aplicada.
- **Protocol_mask_v1.0** (estratégico): reduz **pela metade** o risco da quebra de
  senha, mas **dobra** o tempo consumido pela ação.
- O rastreamento **diminui** lentamente a cada virada de dia sem grandes infrações
  (ser pego conta como grande infração: nesse dia não há decaimento).

## Entregáveis

- Arquitetura: classes separadas `GameManager`, `TimeSystem`, `Player`, `Target`,
  `ScanSS`.
- Loop principal no terminal exibindo **Relógio** (ex.: `[14:30]`), **Saldo** e
  **Rastreamento (%)** constantemente.
- Menu interativo: o jogador escolhe ações; o jogo **valida se há horas
  suficientes** no dia antes de executar.

## Diretrizes técnicas

- Regras de negócio do tempo e **constantes numéricas isoladas** num config
  estático (classe `Chapter1` em `core/config.py`) — sem números mágicos espalhados.
- **Logs detalhados** (módulo `logging`) para validar o cálculo de consumo de horas
  e a dedução do saldo antes/independente da GUI.
- O sistema de tempo expõe **listeners/callbacks** (`on_tick`, `on_day_end`) para
  que, no futuro, eventos aleatórios possam interromper uma invasão em andamento.

## Ferramentas (catálogo em `scanss/data/market.json`)

- **Net_Scanner** — varre a rede (`scan`); tiers maiores acham alvos corporativos.
- **Open_ds_Hacker** — exploit (`connect`); tempo mínimo.
- **find_password** — quebra arquivos trancados (`crack`); versões reduzem o tempo.
- **Protocol_mask** — tático (`mask on`): risco/2 e tempo x2 em qualquer ação.
- **Data_Leech** — `download` e `extract_funds` (canal criptografado).

## Mapeamento de comandos (terminal)

| Comando              | Ação                                              | Estado exigido |
|----------------------|---------------------------------------------------|----------------|
| `scan`               | gera alvos locais (Net_Scanner)                   | OFFLINE        |
| `connect <id>`       | conecta no alvo (Open_ds_Hacker)                  | OFFLINE        |
| `ls`                 | lista os arquivos do alvo                         | CONNECTED      |
| `crack <arquivo>`    | desbloqueia arquivo trancado (find_password)      | DIR_VIEW       |
| `download <arquivo>` | copia o arquivo p/ o disco (Data_Leech)           | DIR_VIEW       |
| `read <arquivo>`     | lê o conteúdo do arquivo                          | DIR_VIEW       |
| `extract_funds`      | extrai fundos (após download+read da senha)       | DIR_VIEW       |
| `mask on\|off`       | liga/desliga o Protocol_mask                      | qualquer       |
| `my_pc`              | volta para o seu computador                       | qualquer       |
| `sleep`              | encerra o dia                                     | qualquer       |

A barra lateral é colapsável (**TAB**) e contextual. Modo dev: `sudo dev_mode`
ou **Ctrl+D**.
