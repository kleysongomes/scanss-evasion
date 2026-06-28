# ScanSS Evasion

Jogo de simulação onde você atua como hacker independente: invade sistemas e
redes WiFi de luxo para roubar moeda virtual (V-Coin), aprimora seus malwares no
mercado negro e tenta não ser rastreado pelo temido **ScanSS** da V-Sec.

## Requisitos

- Python 3.10 ou superior
- Windows (também funciona em Linux/macOS)

A interface usa **Tkinter**, que já vem com o Python — não é preciso instalar
nada para jogar.

## Instalação

O projeto usa um ambiente virtual (`.venv`) para não bagunçar o Python da máquina.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1        # Windows (PowerShell)
# source .venv/bin/activate         # Linux/macOS

pip install -r requirements.txt     # instala o pytest (dev); o jogo não tem deps
```

> Se o `Activate.ps1` for bloqueado pela política do Windows, rode uma vez:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Como executar

```powershell
python run.py
```

Execute pelo terminal para acompanhar mensagens e erros no console. Para sair do
ambiente virtual depois, use `deactivate`.

## Testes

```powershell
pytest
```

Os testes cobrem o motor do ScanSS (cálculo de rastro e punição) sem abrir a
janela — só dependem de `scanss/core`.

## Estrutura

Padrão de projeto baseado no **Toolza** (`core` / `features` / `ui`). Detalhes
em [docs/arquitetura.md](docs/arquitetura.md).

```
scanss/
├── app.py            # bootstrap (contexto + descoberta de features + janela)
├── core/             # regras e infra (config, models, catalog, engine, context)
├── features/         # módulos navegáveis: terminal, status, market
└── ui/               # janela principal, tema e componentes (sidebar)
```

Para adicionar um módulo novo (ex.: Missões), crie `scanss/features/missoes/`
com `feature.py` + `view.py`. O registry descobre e a sidebar ganha o botão
automaticamente.

## Capítulo 1 (atual)

O jogo é uma **história em capítulos**. Cada capítulo abre com uma tela narrativa
(fundo preto, efeito máquina de escrever). No Capítulo 1 você é um hacker
endividado: o **tempo** é o recurso (dia das 08:00 às 00:00), cada ação gasta
horas e aumenta o **rastreamento** do ScanSS. Na virada do dia a **dívida** é
deduzida; 3 dias no negativo = falência. **Sobreviver a 7 dias** conclui o
capítulo. Detalhes em [docs/capitulo-01.md](docs/capitulo-01.md) e a narrativa
completa em [docs/lore.md](docs/lore.md).

## Comandos do terminal

Fluxo de roubo: `scan` → `connect <id>` → `ls` → `crack <arquivo>` →
`download <arquivo>` → `read <arquivo>` → `extract_funds` (liberado só após
baixar **e** ler o arquivo de senha).

No `ls` os arquivos têm **ID** (`[1] senhas.txt`); os comandos aceitam o ID
(`download 1`, `read 1`, `crack 1`). **TAB autocompleta** os comandos.

Outros: `man` (tutorial), `my_pc`, `log_eraser` (limpa rastro: gasta horas, não
dias), `disconnect`, `mask on|off`, `status`, `targets`, `tools`, `market`,
`buy <n>`, `sleep`, `save [slot]`, `load [slot]`, `destroy_vm`, `clear`.

O `help` é categorizado ([ INVASÃO & REDE ], [ ARQUIVOS & DADOS ],
[ UTILITÁRIOS & STATUS ]) com descrição e custo de tempo alinhado; os comandos
de administração ficam em `help sys`. O botão **[?] MANUAL / REGRAS** no menu (ou
`man`) abre o guia de sobrevivência — que também abre sozinho na primeira partida.

O **header** mostra `[NÍVEL] | RELÓGIO | SALDO | RASTRO`, com a cor do rastro
mudando (verde → amarelo → vermelho). Você sobe de **nível** acumulando XP
(fundos extraídos). A barra lateral é **contextual** e **colapsável** (**TAB**).
O catálogo de ferramentas fica em
[scanss/data/market.json](scanss/data/market.json) para balancear sem mexer no código.

`destroy_vm` (e o botão **[X] DESTRUIR VM**) têm trava: exibem um alerta e só
executam se você digitar exatamente **CONFIRMAR**.

## Conta, boot e saves

Ao abrir, o jogo mostra uma tela de carregamento cinemática (~4s, com barra de
progresso ASCII) e pede **login/senha** (criados no primeiro acesso; a senha é
gravada com hash, não em texto puro). A autenticação tem a regra dos **3 strikes**
(classe `VM_Authenticator`): a cada senha errada o jogo avisa as tentativas
restantes e, na **3ª falha, a VM é destruída e o jogo fecha**. A intro do capítulo
aparece só na primeira vez. O menu tem **[S] GERENCIAR SAVES**: você começa com
**2 slots grátis** e pode comprar mais por 500 VC cada, escolhendo onde
salvar/carregar.

## Modo desenvolvedor (testes)

Ative com `sudo dev_mode` no terminal ou **Ctrl+D**. Comandos: `dev money <n>`,
`dev trace <n>` (testar o limite do ScanSS), `dev level <n>`, `dev chapter <n>`,
`dev day <n>`, `dev destroy` (Destruir VM).

## Saves e configurações

O progresso e as preferências ficam em um **SQLite local** no perfil do usuário
(`%LOCALAPPDATA%/ScanSS Evasion/scanss.db`). O jogo salva sozinho na virada do
dia; use `save`/`load` no terminal ou o botão **⟲ REINICIAR JOGO** no menu (apaga
tudo e começa do zero — útil para testes).

## Convenções

- **Idioma:** identificadores e nomes de classe em inglês; todo texto de
  interface, comentários e docstrings em **português** (mesma convenção do Toolza).
- Toda mutação de estado passa pelo `GameEngine` (uma fonte de verdade).
