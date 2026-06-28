from __future__ import annotations

import tkinter as tk

from scanss.core.context import GameContext
from scanss.core.feature import Feature
from scanss.features.terminal.view import TerminalView


class TerminalFeature(Feature):
    id = "terminal"
    title = "TERMINAL"
    icon = ">_"
    order = 10

    def create_view(self, master: tk.Misc, context: GameContext) -> tk.Frame:
        return TerminalView(master, context)
