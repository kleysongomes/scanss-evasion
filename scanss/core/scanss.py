"""ScanSS — sistema de varredura global da V-Sec (mecânica de rastreamento).

Mantém o nível de rastreamento do jogador (0..100). Cada ação registra um risco;
ao atingir 100% o jogador é pego (a punição em si — encerrar o dia, confiscar o
loot e multar — é orquestrada pelo GameManager). O rastro decai a cada virada de
dia sem grandes infrações.
"""

from __future__ import annotations

import logging

from scanss.core.config import Chapter1
from scanss.core.models import Player

logger = logging.getLogger(__name__)


class ScanSS:
    def register(self, player: Player, risk: float, *, reason: str = "") -> bool:
        """Soma `risk` ao rastreamento. Retorna True se o ScanSS for acionado."""
        before = player.trace
        player.trace = min(Chapter1.TRACE_MAX, player.trace + risk)
        logger.info("rastro %.1f%% -> %.1f%% (+%.1f) [%s]",
                    before, player.trace, risk, reason or "ação")
        return player.trace >= Chapter1.TRACE_MAX

    def is_triggered(self, player: Player) -> bool:
        return player.trace >= Chapter1.TRACE_MAX

    def decay(self, player: Player) -> float:
        """Reduz o rastro na virada do dia. Retorna quanto reduziu."""
        before = player.trace
        player.trace = max(0.0, player.trace - Chapter1.TRACE_DECAY_PER_DAY)
        reduced = before - player.trace
        if reduced:
            logger.info("rastro decai %.1f%% -> %.1f%%", before, player.trace)
        return reduced

    def reset(self, player: Player) -> None:
        player.trace = 0.0
