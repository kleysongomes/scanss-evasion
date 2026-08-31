# ScanSS Evasion

Simulador de hacker num **Windows XP fictício**. Você tem um micro montado de
peças usadas, invade máquinas pela rede e rouba arquivos — mas o dinheiro só
entra quando você abre o navegador, entra no site do banco com a senha da vítima
e faz a transferência você mesmo.

> Mundo: **2003**. O **V-Bank** lançou o V-Coin, um crédito digital que ninguém
> entende direito, e contratou a **V-Sec** para proteger. A V-Sec opera o
> **ScanSS**, que cruza logs de conexão e vai puxando a linha até a sua casa.
> Narrativa completa em [docs/lore.md](docs/lore.md).

## Rodar

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. Requer Node 18+.

```bash
npm test          # regras do jogo (sem interface)
npm run build     # build de produção em dist/
```

## Como se joga

Abra o **Manual do Operador** (ícone na área de trabalho, ou **iniciar › Ajuda e
suporte**): ele explica cada tela e cada botão, e o capítulo *Onde você está*
mostra o seu próximo passo. O resumo:


1. **NetRipper** → *Varrer rede*, clique num host, *Analisar* → *Invadir* →
   *Conectar*. Tudo em botão, sem digitar comando. Cada varredura traz alvos
   novos, sorteados — nem todos rendem alguma coisa.
2. **Meu Computador** → o disco da vítima vira a unidade `Z:`. **Vasculhe as
   pastas**: o arquivo de senhas está enterrado no meio de fotos e trabalho de
   faculdade. Os 🔒 precisam do Decodificador no nível certo.
3. **Bloco de Notas** → abra o arquivo de senhas. **É isto que salva a
   credencial** no navegador.
4. **Chroma** → `vbank.vc`, entre como a vítima, transfira para a sua conta
   laranja (o número aparece na tela de login).
5. **Meu Computador** de novo → **venda ou apague** o que você já usou. Arquivo
   roubado parado no seu disco gera rastro o tempo todo: o ScanSS também varre a
   *sua* máquina.
6. **darkmarket.vc** → suba o nível de um dos cinco programas (dez níveis cada).

Clique na bandeja (relógio/saldo/escudo) para abrir a **Situação**: o resumo de
quanto estão te caçando, quanto o seu disco está piorando isso, e o quanto falta
para o próximo upgrade.

Fique de olho no escudo 🛡️ na bandeja: é o rastreamento do ScanSS. Chegou a
100%, tela azul e você perde tudo. Ele cai sozinho com o tempo — a menos que
você esteja guardando evidência.

## Estrutura

Camadas separadas: `game/` (regras, sem React), `os/` (janelas, barra de
tarefas — não sabe nada do jogo), `apps/` (os programas) e `sites/` (as páginas
do navegador falso). Detalhes em [docs/arquitetura.md](docs/arquitetura.md).

```
src/
├── game/    # regras, árvore de habilidades e conteúdo (testável sem interface)
├── os/      # gerenciador de janelas, barra de tarefas, menu Iniciar
├── apps/    # NetRipper, Meu Computador, Bloco de Notas, Chroma, Painel, Manual
└── sites/   # vbank.vc, darkmarket.vc, noticias.vc, busca.vc
```

Adicionar um site novo é criar um componente e escrever uma linha em
`sites/registry.tsx`. Os alvos são gerados por `game/generator.ts` a partir das listas de
`game/content.ts` — adicionar um tipo de arquivo é uma linha lá. Balanceamento
mora em `priceOf` (`skills.ts`) e nas curvas de `generator.ts`.

## Design

O loop do jogo, o balanceamento atual e a lista do que vem em seguida: [docs/design.md](docs/design.md).

---

Bancos, empresas e pessoas deste jogo são fictícios. Os sites existem apenas
dentro da janela do jogo — nenhuma rede real é acessada.
