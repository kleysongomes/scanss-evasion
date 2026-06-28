"""Constantes globais, paleta de cores e parâmetros de balanceamento.

Centralizar tudo aqui facilita ajustar o "feeling" do jogo (cores, dificuldade,
economia) sem caçar números espalhados pelo código.
"""

# ---------------------------------------------------------------------------
# Paleta retro-hacker (fundo preto + verde/laranja de terminal antigo)
# ---------------------------------------------------------------------------
class Palette:
    BG = "#000000"          # fundo principal
    BG_PANEL = "#020a02"    # fundo dos painéis (verde quase preto)
    BG_INPUT = "#001000"

    GREEN = "#00ff66"       # texto padrão
    GREEN_DIM = "#0a8f3c"   # texto secundário / prompts antigos
    GREEN_BRIGHT = "#7dffb0"

    AMBER = "#ffae00"       # avisos / destaque alternativo
    RED = "#ff3b3b"         # perigo / ScanSS acionado
    CYAN = "#3bd6ff"        # links / dados

    BORDER = "#00ff66"
    GRID = "#031a05"        # linhas de grade decorativas


# ---------------------------------------------------------------------------
# Tipografia
# ---------------------------------------------------------------------------
FONT_MONO = ("Consolas", 11)
FONT_MONO_SMALL = ("Consolas", 9)
FONT_TITLE = ("Consolas", 18, "bold")
FONT_SIDEBAR = ("Consolas", 10, "bold")


CURRENCY = "VC"  # V-Coin, a moeda virtual da V-Sec


# ---------------------------------------------------------------------------
# Capítulo 1 — Sobrevivência no Submundo Digital
# Todas as constantes numéricas do capítulo ficam aqui (sem números mágicos
# espalhados pelo código). Ajustar dificuldade/economia = mexer só neste bloco.
# ---------------------------------------------------------------------------
class Chapter1:
    # --- Relógio (minutos a partir da meia-noite) ----------------------
    DAY_START_MIN = 8 * 60          # 08:00
    DAY_END_MIN = 24 * 60           # 00:00 (1440) -> fim do dia útil
    USEFUL_MINUTES = DAY_END_MIN - DAY_START_MIN   # 960 (16 h)

    # --- Custos de tempo das ações (minutos) ---------------------------
    TIME_SCAN = 30
    TIME_CONNECT = 10
    TIME_LS = 5
    TIME_READ = 5
    TIME_DOWNLOAD = 30
    TIME_EXTRACT = 15
    TIME_CRACK_BASE = 120           # base da quebra de senha
    TIME_CRACK_PER_DIFF = 30        # + por nível de dificuldade do alvo
    # quebra = TIME_CRACK_BASE + (dificuldade-1) * TIME_CRACK_PER_DIFF
    # dificuldade 1..5 -> 120..240 min (2 a 4 h), antes dos multiplicadores

    # --- Risco / ScanSS (% de rastreamento, 0..100) --------------------
    TRACE_MAX = 100.0
    TRACE_ALERT = 70.0              # UI fica vermelha
    RISK_SCAN = 2.0
    RISK_CONNECT = 4.0
    RISK_LS = 1.0
    RISK_READ = 1.0
    RISK_DOWNLOAD = 5.0
    RISK_EXTRACT = 10.0
    RISK_CRACK_BASE = 12.0
    RISK_CRACK_PER_DIFF = 4.0       # crack = BASE + dificuldade * PER_DIFF
    TRACE_DECAY_PER_DAY = 12.0      # decaimento por virada de dia (sem ser pego)

    # --- Protocol_mask (valores padrão; o JSON do item pode sobrepor) --
    MASK_RISK_FACTOR = 0.5          # reduz pela metade o risco da ação
    MASK_TIME_FACTOR = 2.0          # dobra o tempo da ação

    # --- Economia ------------------------------------------------------
    STARTING_BALANCE = 250          # saldo inicial do hacker endividado
    DAILY_DEBT = 100                # dívida fixa deduzida na virada do dia
    SCANSS_FINE = 200               # multa ao ser pego
    MAX_NEGATIVE_DAYS = 3           # dias seguidos no negativo -> Game Over
    SAVE_SLOT_PRICE = 500           # custo de um slot de save extra

    # --- Fundos dos alvos (extract_funds) ------------------------------
    FUNDS_BASE = 120
    FUNDS_PER_DIFF = 60            # fundos ~ BASE + dificuldade * PER_DIFF (+ ruído)
    FUNDS_TIER_MULT = 1.8         # cada tier do Net_Scanner multiplica os fundos

    # --- Geração procedural --------------------------------------------
    TARGETS_PER_SCAN = 4
    MAX_DIFFICULTY = 5

    # --- Log_Eraser (limpeza ativa de rastro) --------------------------
    TIME_ERASER = 240               # gasta 4 h do dia
    ERASER_REDUCTION = 20.0         # reduz 20% do rastro

    # --- Progressão de nível (XP = total de fundos extraídos) ----------
    # XP acumulado necessário para atingir cada nível (índice 0 = nível 1).
    XP_THRESHOLDS = [0, 600, 1500, 3000, 5000]

    # --- Condição de vitória do capítulo -------------------------------
    SURVIVE_DAYS = 7                # sobreviver a uma semana encerra o Cap. 1
