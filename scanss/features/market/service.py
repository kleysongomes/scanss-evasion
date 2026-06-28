"""Camada de serviço do mercado.

Concentra as consultas usadas pela view (itens, se dá pra comprar) e delega a
compra ao GameEngine -- mesma regra usada pelo comando 'buy' do terminal.
"""

from __future__ import annotations

from scanss.core.context import GameContext
from scanss.core.engine import GameEngine
from scanss.core.models import Software


class MarketService:
    def __init__(self, context: GameContext) -> None:
        self.context = context
        self.engine = GameEngine(context)

    def items(self) -> list[tuple[int, Software]]:
        return list(enumerate(self.context.market, 1))   # IDs 1-based

    def can_buy(self, software: Software) -> bool:
        p = self.context.player
        return (not software.owned
                and p.level >= software.level
                and p.balance >= software.price)

    def buy(self, index: int) -> str:
        # a última linha do engine é sempre o resultado da operação
        return self.engine.run(f"buy {index}")[-1]   # index 1-based
