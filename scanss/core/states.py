"""Máquina de estados do jogador e mapa de comandos por estado.

O estado controla o que é permitido/sugerido a cada momento (controle de acesso):
  OFFLINE   -> no próprio PC / pronto para escanear
  CONNECTED -> conectado a um alvo (pode listar arquivos)
  DIR_VIEW  -> navegando os arquivos do alvo (pode crack/download/read/extract)
"""

from __future__ import annotations

from enum import Enum


class PlayerState(str, Enum):
    OFFLINE = "OFFLINE"
    CONNECTED = "CONNECTED"
    DIR_VIEW = "DIR_VIEW"


# Comandos sugeridos no painel contextual, por estado.
# Cada item: (texto_inserido_no_terminal, rótulo_exibido, minutos_base | None)
CONTEXT_COMMANDS: dict[PlayerState, list[tuple[str, str, "int | None"]]] = {
    PlayerState.OFFLINE: [
        ("scan", "scan", 30),
        ("log_eraser", "log_eraser", 240),
        ("my_pc", "my_pc", None),
        ("market", "market", None),
    ],
    PlayerState.CONNECTED: [
        ("ls", "ls", 5),
        ("disconnect", "disconnect", None),
        ("my_pc", "my_pc", None),
    ],
    PlayerState.DIR_VIEW: [
        ("crack ", "crack <arquivo>", 120),
        ("download ", "download <arquivo>", 30),
        ("read ", "read <arquivo>", 5),
        ("extract_funds", "extract_funds", 15),
        ("disconnect", "disconnect", None),
    ],
}

# Comandos que só podem rodar em certos estados (controle de acesso).
STATE_ALLOWED: dict[str, set[PlayerState]] = {
    "scan": {PlayerState.OFFLINE},
    "connect": {PlayerState.OFFLINE},
    "ls": {PlayerState.CONNECTED, PlayerState.DIR_VIEW},
    "crack": {PlayerState.DIR_VIEW},
    "download": {PlayerState.DIR_VIEW},
    "read": {PlayerState.DIR_VIEW},
    "extract_funds": {PlayerState.DIR_VIEW},
}
