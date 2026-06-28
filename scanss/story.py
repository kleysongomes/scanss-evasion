"""Textos narrativos do jogo (separados da lógica).

Mantém a narrativa fora do código de regras, facilitando revisão e tradução.
O resumo de fim de capítulo é dinâmico: o GameManager preenche os números reais
da partida via `chapter1_summary(ctx)`.
"""

from __future__ import annotations

from scanss.core.config import Chapter1
from scanss.core.context import GameContext

_RULE = "=" * 57

# Nomes amigáveis das ferramentas para o relatório
_TOOL_LABELS = {
    "open_ds_hacker": "Open_ds_Hacker",
    "find_password": "find_password",
    "protocol_mask": "Protocol_mask",
}


# ---------------------------------------------------------------------------
# Capítulo 1
# ---------------------------------------------------------------------------
CHAPTER1_INTRO = f"""\
{_RULE}
INICIALIZANDO SISTEMA...
VERIFICANDO MÓDULOS DE REDE... [OK]
CONEXÃO ESTABELECIDA SECRETA.
{_RULE}

CAPÍTULO 1: SOBREVIVÊNCIA NO SUBMUNDO DIGITAL

A cidade lá fora não dorme, e as suas dívidas também não. O dinheiro de papel é
apenas uma lenda, e no presente, sua vida depende dos zeros e uns piscando na sua
carteira virtual.

Neste momento, seu saldo está no vermelho. Os credores não mandam cartas de
cobrança; eles simplesmente cortam seus suprimentos e sua energia. Você só tem um
terminal de baixo desempenho, algumas ferramentas rudimentares de quebra de portas
e um relógio que não para de correr.

A regra é clara: escaneie alvos vulneráveis, extraia os fundos e desconecte antes
que o sistema do governo, o ScanSS, rastreie o seu IP.

Você não quer derrubar o sistema corporativo ou ser um herói. Você só quer
sobreviver até o fim da semana.

> Tecle [ENTER] para iniciar o terminal e buscar alvos..."""


CHAPTER1_OUTRO = f"""\
{_RULE}
ALERTA DE SEGURANÇA: DESCONEXÃO FORÇADA INICIADA.
LIMPANDO RASTROS LOCAIS... [OK]
{_RULE}

As dívidas mais urgentes estão pagas. Pelo menos por agora.

Você sobreviveu operando nas sombras, roubando migalhas de roteadores domésticos e
sistemas de segurança falhos. O ScanSS continuou sua varredura implacável pelas
redes, mas seus scripts básicos de evasão foram suficientes para mantê-lo como um
fantasma.

No entanto, o submundo digital não perdoa quem faz barulho, mesmo que baixo. Suas
repetidas invasões e o padrão do seu código chamaram a atenção de entidades que
observam o fluxo de dados. Em fóruns encriptados da deep web, a sua assinatura
digital acabou de ser catalogada.

O governo não foi o único a notar você. O verdadeiro jogo está apenas começando.

> Tecle [ENTER] para compilar o relatório da operação..."""


TUTORIAL_SYSTEM = f"""\
+=======================================================+
|        MANUAL DO SISTEMA - GUIA DE SOBREVIVENCIA       |
+=======================================================+

+------------------ CICLO DE JOGO ----------------------+
|  scan         ->  ache um alvo na rede                |
|  connect <id> ->  conecte-se ao alvo                  |
|  ls           ->  liste os arquivos                   |
|  crack <arq>  ->  quebre o arquivo de senha trancado  |
|  download/read->  baixe e leia o arquivo de senha     |
|  extract_funds->  extraia o dinheiro                  |
|  disconnect   ->  saia e limpe os rastros             |
+-------------------------------------------------------+

+------------------- FALENCIA --------------------------+
|  O dia vira as 00:00 e desconta a divida diaria.      |
|  3 dias seguidos com saldo NEGATIVO = GAME OVER.      |
|  Sobreviva a {Chapter1.SURVIVE_DAYS} dias para concluir o capitulo.        |
+-------------------------------------------------------+

+--------------------- ScanSS --------------------------+
|  Toda acao gera RASTRO. Se chegar a 100%, voce e      |
|  pego: perde o dia e todo o dinheiro NAO guardado     |
|  (loot do dia confiscado + multa).                    |
|  Protocol_mask: risco/2, tempo x2.                    |
|  Log_Eraser: reduz o rastro (gasta horas, nao dias).  |
+-------------------------------------------------------+

> Digite 'help' para a lista de comandos."""


def chapter1_summary(ctx: GameContext) -> str:
    """Relatório de fim de capítulo, com números reais da partida."""
    s = ctx.stats
    dias = max(1, ctx.time.day - 1)
    status = "FALÊNCIA" if ctx.game_over else "SOBREVIVEU"
    tool_top = _TOOL_LABELS.get(s.top_tool(), s.top_tool())
    return f"""\
{_RULE}
RELATÓRIO DE DESEMPENHO: CAPÍTULO 1
{_RULE}
[STATUS FINAL] ................. {status}

> DIAS OPERACIONAIS ............ {dias} Dias
> MOEDAS VIRTUAIS EXTRAÍDAS .... ₿ {s.total_looted}
> TOTAL DE DÍVIDAS PAGAS ....... ₿ {s.debts_paid}
> INVASÕES BEM SUCEDIDAS ....... {s.successful_invasions}
> PICOS DE RASTREAMENTO (%) .... {s.peak_trace:.0f}%
> ALERTAS ScanSS EVITADOS ...... {s.alerts_avoided}
> FERRAMENTA MAIS UTILIZADA .... {tool_top}

{_RULE}
AVALIAÇÃO DE RISCO:
Você manteve um perfil funcional, mas seus padrões de
ataque foram mapeados. Atualize seus firewalls.

> PROGREDIR PARA O CAPÍTULO 2? [S/N]:
{_RULE}"""
