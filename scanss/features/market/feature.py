from __future__ import annotations

import tkinter as tk

from scanss.core.context import GameContext
from scanss.core.feature import Feature
from scanss.features.market.view import MarketView


class MarketFeature(Feature):
    id = "market"
    title = "MERCADO NEGRO"
    icon = "$"
    order = 30

    def create_view(self, master: tk.Misc, context: GameContext) -> tk.Frame:
        return MarketView(master, context)
