# Arquitetura

O jogo é um **Windows XP fictício rodando no navegador**. React desenha o
sistema operacional; o estado do jogo vive fora da UI.

```
scanss-evasion/
├── index.html
├── src/
│   ├── main.tsx              # ponto de entrada
│   ├── App.tsx               # relógio do jogo + escolhe Desktop ou tela azul
│   ├── styles/
│   │   ├── xp.css            # tema Luna escrito à mão (sem dependência)
│   │   └── retro-web.css     # visual de site de 2003 para as páginas
│   │
│   ├── game/                 # REGRAS — não importa nada de os/, apps/ ou sites/
│   │   ├── types.ts          # Machine, VNode/VFile/VFolder, Skill, GameState
│   │   ├── fs.ts             # árvore de pastas: funções puras de leitura e escrita
│   │   ├── skills.ts         # 5 ramos × 10 níveis, preços por fórmula e efeitos
│   │   ├── rng.ts            # sorteios: int, pick, sample, chance, weighted
│   │   ├── content.ts        # matéria-prima: nomes, pastas e arquivos possíveis
│   │   ├── generator.ts      # monta os alvos sorteando de content.ts
│   │   ├── progress.ts       # marcos do loop, para o checklist do manual
│   │   ├── store.ts          # estado + todas as ações (fonte única da verdade)
│   │   └── *.test.ts         # testam o loop inteiro sem abrir a interface
│   │
│   ├── os/                   # O SISTEMA OPERACIONAL — não sabe nada do jogo
│   │   ├── windows.ts        # gerenciador de janelas (posição, z-order, foco)
│   │   ├── Window.tsx        # moldura: título, arrastar, redimensionar
│   │   ├── Desktop.tsx       # ícones + janelas abertas
│   │   ├── Taskbar.tsx       # barra de tarefas + bandeja (medidor do ScanSS)
│   │   ├── StartMenu.tsx     # menu Iniciar
│   │   ├── Bsod.tsx          # tela azul = fim de jogo
│   │   └── launch.ts         # abrir um app por id (usado em 3 lugares)
│   │
│   ├── apps/                 # PROGRAMAS — o miolo de cada janela
│   │   ├── catalog.ts        # metadados (nome, ícone, tamanho) sem componentes
│   │   ├── registry.tsx      # id do app -> componente React
│   │   ├── NetRipper.tsx     # suíte de invasão (varrer, analisar, invadir)
│   │   ├── Explorer.tsx      # Meu Computador: C: e Z:, com pastas e organização
│   │   ├── Notepad.tsx       # ler arquivos — é o que revela as senhas
│   │   ├── Browser.tsx       # navegador falso
│   │   ├── Painel.tsx        # níveis dos programas, risco do disco, formatar
│   │   ├── Status.tsx        # resumo da situação (abre pela bandeja)
│   │   ├── Tutorial.tsx      # Manual do Operador (janela com capítulos)
│   │   └── manual.tsx        # o conteúdo dos capítulos
│   │
│   └── sites/                # SITES do navegador falso
│       ├── registry.tsx      # domínio -> componente
│       ├── Portal.tsx        # busca.vc (página inicial)
│       ├── VBank.tsx         # vbank.vc — login e transferência
│       ├── DarkMarket.tsx    # darkmarket.vc — loja de exploits
│       └── News.tsx          # noticias.vc — manchetes que reagem ao seu rastro
│
└── docs/                     # arquitetura, design e lore
```

## Camadas

O sentido das dependências é sempre para baixo, nunca de volta:

```
sites/  apps/          →  os/  →  (nada)
   ↓       ↓
        game/          →  (nada)
```

- **`game/` não importa React.** Isso é o que permite testar o loop completo
  (invadir → baixar → ler senha → transferir) sem montar um componente.
- **`os/` não conhece o jogo.** Trocar o tema para Windows 98 ou macOS 9 não
  encosta em nenhuma regra.
- **A UI nunca calcula regra.** O Terminal, o Explorer e os sites chamam as
  mesmas ações do store — não existe cálculo de rastro duplicado.

## Como o estado flui

```
clique no Explorer  ─┐
comando no Terminal ─┼─→  ação do game/store.ts  ─→  novo estado  ─→  React redesenha
formulário do banco ─┘        (aplica rastro,
                               valida ferramenta,
                               move dinheiro)
```

O `ScanSS` (rastreamento) é o único acoplamento global. Duas fontes o alimentam:

- **ações** — cada uma chama `addHeat()`, que aplica o desconto do ramo
  *Anonimato* antes de somar;
- **evidência parada** — o `tick()` soma o peso incriminador de tudo que está no
  seu disco. É o que torna apagar arquivo uma jogada, e não uma faxina cosmética.

Chegando a 100, a partida acaba.

## A árvore de habilidades

Nenhuma regra pergunta "o jogador tem tal item?". Ela pergunta **"qual o nível
deste ramo?"** (`level('breaker')`), e os efeitos numéricos saem de funções em
`game/skills.ts` (`heatFactor`, `cleanPower`). Assim dá para rebalancear a
progressão inteira sem tocar em nenhuma ação do store.

## Adicionar coisas

| O quê | Onde |
|---|---|
| Um programa novo | componente em `apps/` + linha em `catalog.ts` e `registry.tsx` |
| Um site novo | componente em `sites/` + linha em `sites/registry.tsx` |
| Um tipo de arquivo/pasta novo | uma linha nas listas de `game/content.ts` — o gerador passa a sorteá-lo |
| Mudar a chance de loot | os pesos de `sorte` em `game/generator.ts` |
| Um upgrade | uma linha em `SKILLS` (`game/skills.ts`) e o efeito lido pelas regras |
| Balancear rastro | as constantes `HEAT` e `EVIDENCE_RATE` no topo de `game/store.ts` |
| Balancear economia | `priceOf` (`skills.ts`) e `saldoDoTier`/`valorDoTier` (`generator.ts`) |

Nenhum deles exige mexer no gerenciador de janelas.

## Convenção de idioma

Identificadores e nomes de tipo em **inglês**; texto de interface, comentários e
documentação em **português**.

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # regras do jogo, sem interface
npm run build    # produção em dist/
```
