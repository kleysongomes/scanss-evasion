from __future__ import annotations

import tkinter as tk

from scanss.core.context import GameContext
from scanss.core.feature import Feature
from scanss.features.status.view import StatusView


class StatusFeature(Feature):
    id = "status"
    title = "STATUS"
    icon = "::"
    order = 20

    def create_view(self, master: tk.Misc, context: GameContext) -> tk.Frame:
        return StatusView(master, context)
