# Arquitetura

Padrão baseado no projeto **Toolza**: um pacote nomeado, com `core/` (infra),
`features/` (módulos auto-descobertos) e `ui/` (apresentação).

```
scanss-evasion/
├── run.py                      # ponto de entrada -> scanss.app:main
├── pyproject.toml              # metadados + script "scanss-evasion" + config do pytest
├── requirements.txt            # só pytest (dev); o jogo usa apenas a biblioteca padrão
├── docs/                       # documentação
├── tests/                      # testes do core (sem UI)
└── scanss/                     # pacote da aplicação
    ├── app.py                  # bootstrap: build_context + discover_features + janela
    ├── story.py                # textos narrativos (intro/outro/resumo dinâmico)
    ├── data/market.json        # catálogo de ferramentas (balanceamento via JSON)
    ├── core/                   # infraestrutura e regras (sem Tkinter)
    │   ├── config.py           # Palette, fontes e constantes do capítulo (Chapter1)
    │   ├── models.py           # Player, Software, Stats, ToolKind
    │   ├── states.py           # PlayerState + comandos por estado (state machine)
    │   ├── targets.py          # Target + TargetFile + geração procedural
    │   ├── time_system.py      # TimeSystem: relógio, dia, listeners
    │   ├── scanss.py           # ScanSS: rastreamento e decaimento
    │   ├── manager.py          # GameManager: ações, estados, dia, punição, dev
    │   ├── catalog.py          # carrega o catálogo do JSON
    │   ├── textfmt.py          # formatação de custo de tempo (alinhado à direita)
    │   ├── context.py          # GameContext: estado compartilhado
    │   ├── engine.py           # GameEngine: tradutor de comandos do terminal
    │   ├── paths.py            # pasta de dados do usuário
    │   ├── storage.py          # Database (SQLite): settings + savegame
    │   ├── savegame.py         # serialização GameContext <-> dict
    │   ├── feature.py          # contrato Feature (ABC)
    │   └── registry.py         # discover_features()
    ├── features/               # cada módulo = pasta navegável
    │   ├── terminal/           # console de comandos (feature + view)
    │   ├── status/             # painel do operador (feature + view)
    │   └── market/             # mercado negro (feature + service + view)
    └── ui/                     # janela, tema e componentes
        ├── main_window.py      # moldura + telas de capítulo + tick + reset
        ├── theme.py            # fábricas de widget da moldura
        └── components/
            ├── sidebar.py      # navegação + ações (reiniciar)
            └── narration.py    # tela de narração (efeito máquina de escrever)
```

## Fluxo de uma ação (Capítulo 1)

`GameEngine` (parse do comando) → `GameManager` (valida tempo no `TimeSystem`,
gasta minutos, registra risco no `ScanSS`, aplica loot/punição, dispara virada do
dia e checa game over / fim de capítulo) → linhas de texto para a view. O
`GameManager` também emite `logging` para validar a matemática sem a GUI.

## Princípios

- **Camadas:** `features/` e `ui/` dependem de `core/`; `core/` não depende de
  ninguém (nem do Tkinter, exceto o contrato `feature.py`). Isso mantém as regras
  testáveis sem abrir a janela (ver `tests/`).
- **Uma fonte de verdade:** toda mutação de estado passa pelo `GameEngine`. O
  terminal (texto) e o mercado (botões) chamam o mesmo `run()`/serviço — sem
  regra duplicada.
- **Features plugáveis:** para adicionar um módulo (ex.: Missões), basta criar
  `scanss/features/missoes/` com `feature.py` (subclasse de `Feature`) e `view.py`.
  O `registry` descobre sozinho e a sidebar ganha o botão. Nenhum registro manual.

## Idioma

Identificadores e nomes de classe em **inglês**; texto de interface, comentários e
docstrings em **português** (mesma convenção do Toolza).

## Como rodar

```bash
python run.py            # abre o jogo
pytest                   # roda os testes do core
```
