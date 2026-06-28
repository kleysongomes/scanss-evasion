"""View de status: painel do operador, atualizado em tempo real.

Apenas LÊ o contexto (não altera estado). O MainWindow chama refresh()
periodicamente, então relógio/saldo/rastro ficam sempre vivos.
"""

from __future__ import annotations

import tkinter as tk

from scanss.core.config import CURRENCY, Chapter1, FONT_MONO, FONT_TITLE, Palette
from scanss.core.context import GameContext
from scanss.ui.theme import trace_color


class StatusView(tk.Frame):
    def __init__(self, master: tk.Misc, context: GameContext) -> None:
        super().__init__(master, bg=Palette.BG)
        self.context = context

        tk.Label(self, text="PERFIL DO OPERADOR", font=FONT_TITLE,
                 fg=Palette.AMBER, bg=Palette.BG).pack(anchor="w", padx=20, pady=(20, 10))

        self.body = tk.Label(self, font=FONT_MONO, fg=Palette.GREEN, bg=Palette.BG,
                             justify="left", anchor="nw")
        self.body.pack(fill="x", padx=20, pady=4)

        # barra de rastro com cor dinâmica (verde/amarelo/vermelho)
        self.trace_label = tk.Label(self, font=FONT_MONO, bg=Palette.BG,
                                    justify="left", anchor="nw")
        self.trace_label.pack(fill="x", padx=20, pady=4)

        self.refresh()

    def refresh(self) -> None:
        p = self.context.player
        t = self.context.time
        s = self.context.stats
        nxt = self._next_threshold(p.level)
        self.body.config(text="\n".join([
            f"capítulo .....: {self.context.chapter}   estado: {self.context.state.value}",
            f"nível ........: {p.level}   XP: {p.xp}"
            + (f" / {nxt}" if nxt else "  (máx)"),
            f"dia ..........: {t.day}   relógio [{t.clock()}]   "
            f"resta {t.fmt_duration(t.remaining_minutes)}",
            "",
            f"saldo ........: ₿ {p.balance:.2f}",
            f"dívida diária : {Chapter1.DAILY_DEBT} {CURRENCY}",
            f"loot do dia ..: {p.day_loot} {CURRENCY}",
            f"dias negativo : {p.consecutive_negative_days}/{Chapter1.MAX_NEGATIVE_DAYS}",
            f"protocol_mask : {'ATIVO' if p.masked else 'desligado'}",
            f"invasões .....: {s.successful_invasions}   extraído {s.total_looted} {CURRENCY}",
            "",
        ]))
        bar = self._trace_bar(p.trace)
        self.trace_label.config(
            text=f"RASTRO (ScanSS): {p.trace:5.1f}%\n{bar}",
            fg=trace_color(p.trace))

    @staticmethod
    def _next_threshold(level: int) -> int | None:
        th = Chapter1.XP_THRESHOLDS
        return th[level] if level < len(th) else None

    @staticmethod
    def _trace_bar(trace: float, width: int = 30) -> str:
        filled = int((trace / Chapter1.TRACE_MAX) * width)
        return "[" + "#" * filled + "-" * (width - filled) + "]"
