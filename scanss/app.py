"""Bootstrap da aplicação: monta o contexto, descobre features e abre a janela."""

from __future__ import annotations

import logging

from scanss.core.context import GameContext
from scanss.core.registry import discover_features
from scanss.ui.main_window import MainWindow

logger = logging.getLogger(__name__)


def build_context() -> GameContext:
    ctx = GameContext.new_game()
    try:
        from scanss.core.storage import Database
        ctx.db = Database()   # login e carregamento são feitos pela janela (boot)
    except Exception as exc:  # persistência é opcional; o jogo roda sem ela
        logger.warning("persistência indisponível: %s", exc)
    return ctx


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S")
    logger.info("iniciando ScanSS Evasion")

    context = build_context()
    features = discover_features()
    window = MainWindow(context, features)
    window.mainloop()
