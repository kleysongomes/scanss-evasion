"""Helpers de tema para a 'moldura' da aplicação (header, status, painéis).

As constantes de cor/fonte vivem em scanss.core.config (Palette/FONT_*); aqui
ficam só pequenas fábricas de widgets usadas pela camada de UI.
"""

from __future__ import annotations

import tkinter as tk

from scanss.core.config import Palette


def bordered_panel(master: tk.Misc, **kwargs) -> tk.Frame:
    """Frame com a borda verde característica do terminal."""
    return tk.Frame(master, bg=kwargs.pop("bg", Palette.BG),
                    highlightbackground=Palette.BORDER, highlightthickness=1, **kwargs)


def trace_color(trace: float) -> str:
    """Cor do rastro: verde (seguro) -> amarelo (atenção) -> vermelho (perigo)."""
    if trace >= 70:
        return Palette.RED
    if trace >= 40:
        return Palette.AMBER
    return Palette.GREEN
