"""Banco de dados local (SQLite, biblioteca padrão).

Guarda dois tipos de coisa, e cresce conforme o jogo evoluir:
  - settings : pares chave/valor (preferências do usuário);
  - savegame : estado do jogo serializado em JSON, por slot.

A serialização do estado do jogo fica em `core/savegame.py`; aqui o BD só grava
e lê dicionários, sem conhecer as regras.
"""

from __future__ import annotations

import json
import logging
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from scanss.core.paths import database_path

logger = logging.getLogger(__name__)


class Database:
    def __init__(self, path: Optional[Path] = None) -> None:
        self.path = Path(path) if path else database_path()
        self.conn = sqlite3.connect(str(self.path))
        self.conn.row_factory = sqlite3.Row
        self._init_schema()
        logger.info("banco de dados em %s", self.path)

    def _init_schema(self) -> None:
        self.conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS settings (
                key   TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS savegame (
                slot       INTEGER PRIMARY KEY,
                data       TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )
        self.conn.commit()

    # --- settings (chave/valor) ----------------------------------------
    def get_setting(self, key: str, default: Any = None) -> Any:
        row = self.conn.execute(
            "SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
        return json.loads(row["value"]) if row else default

    def set_setting(self, key: str, value: Any) -> None:
        self.conn.execute(
            "INSERT INTO settings(key, value) VALUES(?, ?) "
            "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (key, json.dumps(value)))
        self.conn.commit()

    def delete_setting(self, key: str) -> None:
        self.conn.execute("DELETE FROM settings WHERE key = ?", (key,))
        self.conn.commit()

    # --- slots de save -------------------------------------------------
    def slot_count(self) -> int:
        return int(self.get_setting("save_slots", 2))   # 2 slots gratuitos

    def set_slot_count(self, n: int) -> None:
        self.set_setting("save_slots", n)

    def list_saves(self) -> dict[int, dict]:
        """Mapa slot -> metadados (dia, saldo, atualizado_em) dos saves ocupados."""
        out: dict[int, dict] = {}
        for row in self.conn.execute(
                "SELECT slot, data, updated_at FROM savegame ORDER BY slot"):
            try:
                data = json.loads(row["data"])
            except (ValueError, TypeError):
                continue
            out[row["slot"]] = {
                "updated_at": row["updated_at"],
                "day": data.get("time", {}).get("day", 1),
                "balance": data.get("player", {}).get("balance", 0),
                "chapter": data.get("chapter", 1),
            }
        return out

    # --- savegame ------------------------------------------------------
    def save_game(self, slot: int, data: dict) -> None:
        self.conn.execute(
            "INSERT INTO savegame(slot, data, updated_at) VALUES(?, ?, ?) "
            "ON CONFLICT(slot) DO UPDATE SET data = excluded.data, "
            "updated_at = excluded.updated_at",
            (slot, json.dumps(data), datetime.now().isoformat(timespec="seconds")))
        self.conn.commit()
        logger.info("jogo salvo no slot %d", slot)

    def load_game(self, slot: int) -> Optional[dict]:
        row = self.conn.execute(
            "SELECT data FROM savegame WHERE slot = ?", (slot,)).fetchone()
        return json.loads(row["data"]) if row else None

    def has_save(self, slot: int) -> bool:
        return self.conn.execute(
            "SELECT 1 FROM savegame WHERE slot = ?", (slot,)).fetchone() is not None

    def delete_game(self, slot: int) -> None:
        self.conn.execute("DELETE FROM savegame WHERE slot = ?", (slot,))
        self.conn.commit()

    def wipe(self) -> None:
        """Destruir VM: apaga TODOS os saves, settings e a conta."""
        self.conn.executescript("DELETE FROM savegame; DELETE FROM settings;")
        self.conn.commit()
        logger.info("VM destruída: banco zerado")

    def close(self) -> None:
        self.conn.close()
