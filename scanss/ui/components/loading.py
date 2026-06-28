"""Tela de carregamento cinemática (boot da VM) com barra de progresso ASCII.

Em GUI não usamos time.sleep (congelaria a janela e a barra não animaria); o
delay cinematográfico de ~4 s é feito com after(), passo a passo.
"""

from __future__ import annotations

import tkinter as tk
from typing import Callable

from scanss.core.config import FONT_MONO, FONT_MONO_SMALL, FONT_TITLE, Palette

LOADING_MS = 4000
BAR_WIDTH = 24


class LoadingScreen(tk.Frame):
    def __init__(self, master: tk.Misc, on_done: Callable[[], None]) -> None:
        super().__init__(master, bg=Palette.BG)
        self._on_done = on_done
        self._step = 0
        self._step_ms = max(40, LOADING_MS // BAR_WIDTH)

        tk.Label(self, text="Aguarde, estamos iniciando sua VM...",
                 font=FONT_TITLE, fg=Palette.GREEN, bg=Palette.BG).place(
            relx=0.5, rely=0.42, anchor="center")

        self._bar = tk.Label(self, text="", font=FONT_MONO, fg=Palette.GREEN_BRIGHT,
                             bg=Palette.BG)
        self._bar.place(relx=0.5, rely=0.52, anchor="center")

        tk.Label(self, text="Desenvolvido por Kleyson Gomes", font=FONT_MONO_SMALL,
                 fg=Palette.GREEN_DIM, bg=Palette.BG).place(relx=0.5, rely=0.95,
                                                            anchor="center")
        self._tick()

    def _tick(self) -> None:
        filled = "█" * self._step
        empty = "░" * (BAR_WIDTH - self._step)
        pct = int(self._step / BAR_WIDTH * 100)
        self._bar.config(text=f"[{filled}{empty}] {pct:3d}%")
        if self._step >= BAR_WIDTH:
            self.after(300, self._on_done)
            return
        self._step += 1
        self.after(self._step_ms, self._tick)
