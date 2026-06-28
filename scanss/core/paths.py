"""Resolução de caminhos da aplicação (onde fica o banco de dados, etc.).

No Windows usa %LOCALAPPDATA%; nos demais, ~/.local/share (ou o HOME). Mantém os
saves fora do repositório, no perfil do usuário.
"""

from __future__ import annotations

import os
from pathlib import Path

APP_DIR_NAME = "ScanSS Evasion"


def app_data_dir() -> Path:
    base = (os.environ.get("LOCALAPPDATA")
            or os.environ.get("APPDATA")
            or os.environ.get("XDG_DATA_HOME")
            or str(Path.home() / ".local" / "share"))
    return Path(base) / APP_DIR_NAME


def ensure_data_dir() -> Path:
    path = app_data_dir()
    path.mkdir(parents=True, exist_ok=True)
    return path


def database_path() -> Path:
    return ensure_data_dir() / "scanss.db"
