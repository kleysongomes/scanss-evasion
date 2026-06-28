"""Gerenciador de saves: salvar/carregar por slot e comprar slots extras.

O jogador começa com 2 slots gratuitos e pode comprar mais por
Chapter1.SAVE_SLOT_PRICE moedas cada.
"""

from __future__ import annotations

import tkinter as tk

from scanss.core.config import CURRENCY, Chapter1, FONT_MONO, FONT_SIDEBAR, FONT_TITLE, Palette
from scanss.core.context import GameContext
from scanss.core.manager import GameManager


class SavesView(tk.Frame):
    def __init__(self, master: tk.Misc, context: GameContext) -> None:
        super().__init__(master, bg=Palette.BG)
        self.context = context
        self.manager = GameManager(context)

        tk.Label(self, text="GERENCIAR SAVES", font=FONT_TITLE,
                 fg=Palette.AMBER, bg=Palette.BG).pack(anchor="w", padx=20, pady=(20, 6))
        self._info = tk.Label(self, font=FONT_MONO, fg=Palette.GREEN_DIM, bg=Palette.BG,
                              anchor="w", justify="left")
        self._info.pack(anchor="w", padx=20)

        self._rows = tk.Frame(self, bg=Palette.BG)
        self._rows.pack(fill="x", padx=20, pady=12)

        buy = tk.Label(self, text=f"[+] COMPRAR SLOT ({Chapter1.SAVE_SLOT_PRICE} {CURRENCY})",
                       font=FONT_SIDEBAR, fg=Palette.AMBER, bg=Palette.BG_PANEL,
                       padx=12, pady=8, cursor="hand2")
        buy.pack(anchor="w", padx=20)
        buy.bind("<Button-1>", lambda _e: self._buy_slot())

        self._message = tk.Label(self, text="", font=FONT_MONO, fg=Palette.CYAN,
                                 bg=Palette.BG, anchor="w")
        self._message.pack(fill="x", padx=20, pady=(10, 0))
        self.refresh()

    def refresh(self) -> None:
        db = self.context.db
        if db is None:
            self._info.config(text="persistência indisponível.")
            return
        slots = db.slot_count()
        saves = db.list_saves()
        self._info.config(text=f"slots: {slots}   |   saldo: {self.context.player.balance} "
                               f"{CURRENCY}   |   slot atual: {self.context.slot}")
        for child in self._rows.winfo_children():
            child.destroy()
        for slot in range(1, slots + 1):
            self._build_row(slot, saves.get(slot))

    def _build_row(self, slot: int, meta: dict | None) -> None:
        row = tk.Frame(self._rows, bg=Palette.BG_PANEL)
        row.pack(fill="x", pady=3)
        desc = (f"dia {meta['day']}, ₿ {meta['balance']}  ({meta['updated_at']})"
                if meta else "vazio")
        tk.Label(row, text=f"Slot {slot}: {desc}", font=FONT_MONO, fg=Palette.GREEN,
                 bg=Palette.BG_PANEL, anchor="w", padx=10, pady=6).pack(
            side="left", fill="x", expand=True)
        self._btn(row, "Salvar", lambda s=slot: self._save(s))
        if meta:
            self._btn(row, "Carregar", lambda s=slot: self._load(s))

    def _btn(self, parent: tk.Misc, text: str, cmd) -> None:
        b = tk.Label(parent, text=text, font=FONT_SIDEBAR, fg=Palette.GREEN,
                     bg=Palette.BG_INPUT, padx=10, pady=4, cursor="hand2")
        b.pack(side="right", padx=4, pady=4)
        b.bind("<Button-1>", lambda _e: cmd())

    def _save(self, slot: int) -> None:
        self._message.config(text=self.manager.save(slot)[-1])
        self.refresh()

    def _load(self, slot: int) -> None:
        self._message.config(text=self.manager.load(slot)[-1])
        self.refresh()

    def _buy_slot(self) -> None:
        self._message.config(text=self.manager.buy_slot()[-1])
        self.refresh()
