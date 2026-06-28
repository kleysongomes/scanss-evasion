"""View do mercado negro: lista de upgrades com botão Comprar por item.

Front-end gráfico para o mesmo comando 'buy' do terminal (via MarketService).
"""

from __future__ import annotations

import tkinter as tk

from scanss.core.config import CURRENCY, FONT_MONO, FONT_SIDEBAR, FONT_TITLE, Palette
from scanss.core.context import GameContext
from scanss.features.market.service import MarketService


class MarketView(tk.Frame):
    def __init__(self, master: tk.Misc, context: GameContext) -> None:
        super().__init__(master, bg=Palette.BG)
        self.service = MarketService(context)
        self._rows: list[tuple] = []   # (software, label, button)

        tk.Label(self, text="MERCADO NEGRO", font=FONT_TITLE,
                 fg=Palette.AMBER, bg=Palette.BG).pack(anchor="w", padx=20, pady=(20, 4))
        tk.Label(self, text="upgrades melhores exigem nível mais alto.",
                 font=FONT_MONO, fg=Palette.GREEN_DIM, bg=Palette.BG).pack(anchor="w", padx=20)

        listing = tk.Frame(self, bg=Palette.BG)
        listing.pack(fill="both", expand=True, padx=20, pady=12)

        for index, soft in self.service.items():
            self._build_row(listing, index, soft)

        self.message = tk.Label(self, text="", font=FONT_MONO,
                                fg=Palette.CYAN, bg=Palette.BG, anchor="w")
        self.message.pack(fill="x", padx=20, pady=(0, 16))

        self.refresh()

    def _build_row(self, parent: tk.Frame, index: int, soft) -> None:
        row = tk.Frame(parent, bg=Palette.BG_PANEL)
        row.pack(fill="x", pady=3)
        label = tk.Label(row, font=FONT_MONO, fg=Palette.GREEN, bg=Palette.BG_PANEL,
                         anchor="w", padx=10, pady=6)
        label.pack(side="left", fill="x", expand=True)
        button = tk.Button(row, text="COMPRAR", font=FONT_SIDEBAR,
                           bg=Palette.BG_INPUT, fg=Palette.GREEN,
                           activebackground=Palette.GREEN_DIM, activeforeground=Palette.BG,
                           bd=0, padx=12, cursor="hand2",
                           command=lambda i=index: self._buy(i))
        button.pack(side="right", padx=6, pady=4)
        self._rows.append((soft, label, button))

    def _buy(self, index: int) -> None:
        self.message.config(text=self.service.buy(index))
        self.refresh()

    def refresh(self) -> None:
        for soft, label, button in self._rows:
            tag = "[INSTALADO]" if soft.owned else f"req. LV{soft.level}"
            label.config(text=f"{soft.label:<26} {soft.price:>5} {CURRENCY}   {tag}")
            if soft.owned:
                button.config(text="OK", state="disabled")
            else:
                button.config(text="COMPRAR",
                              state="normal" if self.service.can_buy(soft) else "disabled")
