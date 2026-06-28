"""TimeSystem: relógio interno do Capítulo 1.

O tempo é o recurso principal: o dia vai das 08:00 às 00:00 (16 h úteis) e cada
ação consome minutos. Expõe *listeners* (on_tick / on_day_end) para que, no
futuro, eventos aleatórios possam reagir ou interromper uma ação em andamento.
"""

from __future__ import annotations

import logging
from typing import Callable

from scanss.core.config import Chapter1

logger = logging.getLogger(__name__)

TickListener = Callable[["TimeSystem", int], None]   # (time, minutos_gastos)
DayEndListener = Callable[["TimeSystem"], None]


class TimeSystem:
    def __init__(self) -> None:
        self.day = 1
        self.minute_of_day = Chapter1.DAY_START_MIN
        self._tick_listeners: list[TickListener] = []
        self._day_end_listeners: list[DayEndListener] = []

    # --- listeners (para eventos futuros) ------------------------------
    def on_tick(self, fn: TickListener) -> None:
        self._tick_listeners.append(fn)

    def on_day_end(self, fn: DayEndListener) -> None:
        self._day_end_listeners.append(fn)

    # --- consultas -----------------------------------------------------
    @property
    def remaining_minutes(self) -> int:
        return Chapter1.DAY_END_MIN - self.minute_of_day

    @property
    def time_up(self) -> bool:
        return self.remaining_minutes <= 0

    def clock(self) -> str:
        m = self.minute_of_day % (24 * 60)
        return f"{m // 60:02d}:{m % 60:02d}"

    def can_spend(self, minutes: int) -> bool:
        return 0 < minutes <= self.remaining_minutes

    @staticmethod
    def fmt_duration(minutes: int) -> str:
        h, m = divmod(minutes, 60)
        return f"{h}h{m:02d}" if h else f"{m}min"

    # --- mutações ------------------------------------------------------
    def spend(self, minutes: int) -> bool:
        """Consome `minutes` do dia. Retorna False se não houver tempo."""
        if not self.can_spend(minutes):
            logger.info("spend(%d) negado: restam %d min", minutes, self.remaining_minutes)
            return False
        self.minute_of_day += minutes
        logger.info("gasto %d min -> relógio %s (restam %d)",
                    minutes, self.clock(), self.remaining_minutes)
        for fn in self._tick_listeners:
            fn(self, minutes)
        return True

    def next_day(self) -> None:
        """Encerra o dia atual e começa o próximo às 08:00."""
        for fn in self._day_end_listeners:
            fn(self)
        self.day += 1
        self.minute_of_day = Chapter1.DAY_START_MIN
        logger.info("novo dia: %d (relógio %s)", self.day, self.clock())
