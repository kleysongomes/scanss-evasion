"""GameContext: estado compartilhado do jogo (a "fonte da verdade").

Guarda o jogador, o ScanSS, o relógio (TimeSystem), o mercado e os alvos do
último scan. O GameManager lê/altera este contexto; as features só o exibem.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from scanss.core.catalog import build_software_catalog, starting_tools
from scanss.core.models import Player, Software, Stats
from scanss.core.scanss import ScanSS
from scanss.core.states import PlayerState
from scanss.core.targets import Target
from scanss.core.time_system import TimeSystem


@dataclass
class GameContext:
    player: Player
    scanss: ScanSS
    time: TimeSystem
    market: list[Software]
    stats: Stats
    chapter: int = 1
    state: PlayerState = PlayerState.OFFLINE
    targets: list[Target] = field(default_factory=list)   # resultado do último scan
    connected: Target | None = None
    game_over: bool = False
    chapter_complete: bool = False
    dev_mode: bool = False
    next_target_id: int = 1   # contador para ids de alvos entre scans

    # Sessão / persistência (não serializadas no save).
    db: Any = None            # instância de storage.Database, se houver
    slot: int = 1
    username: str = ""        # usuário logado na VM
    needs_auth: bool = False   # True após Destruir VM (volta ao login)

    @classmethod
    def new_game(cls) -> "GameContext":
        return cls(
            player=Player(tools=starting_tools()),
            scanss=ScanSS(),
            time=TimeSystem(),
            market=build_software_catalog(),
            stats=Stats(),
        )
