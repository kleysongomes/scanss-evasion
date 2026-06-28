"""Contrato de uma feature (módulo navegável na sidebar).

Mesma ideia do Feature do Toolza: cada módulo do jogo declara id/título/ícone/
ordem e sabe construir sua própria view. O registry descobre as subclasses
automaticamente.
"""

from __future__ import annotations

import tkinter as tk
from abc import ABC, abstractmethod

from scanss.core.context import GameContext


class Feature(ABC):
    id: str = ""
    title: str = ""
    icon: str = ">"
    order: int = 100

    @abstractmethod
    def create_view(self, master: tk.Misc, context: GameContext) -> tk.Frame:
        """Cria e retorna a view (um tk.Frame) desta feature."""
        ...
