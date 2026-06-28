from __future__ import annotations

import tkinter as tk

from scanss.core.context import GameContext
from scanss.core.feature import Feature
from scanss.features.saves.view import SavesView


class SavesFeature(Feature):
    id = "saves"
    title = "SAVES"
    icon = "[S]"
    order = 40

    def create_view(self, master: tk.Misc, context: GameContext) -> tk.Frame:
        return SavesView(master, context)
