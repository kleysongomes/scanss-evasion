"""Catálogo de softwares carregado do JSON estático (scanss/data/market.json).

Manter os itens em JSON permite balancear preços e multiplicadores sem tocar no
código. Ferramentas com 'start': true já vêm com o jogador (v0.1).
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from scanss.core.models import Software, ToolKind

_MARKET_JSON = Path(__file__).resolve().parent.parent / "data" / "market.json"


@lru_cache(maxsize=1)
def _load_tools() -> list[dict]:
    data = json.loads(_MARKET_JSON.read_text(encoding="utf-8"))
    return data["tools"]


def _make(d: dict, owned: bool) -> Software:
    return Software(
        kind=ToolKind(d["kind"]),
        name=d["name"],
        version=d["version"],
        price=d.get("price", 0),
        function=d.get("function", ""),
        time_factor=d.get("time_factor", 1.0),
        risk_factor=d.get("risk_factor", 1.0),
        tier=d.get("tier", 1),
        owned=owned,
    )


def starting_tools() -> dict[ToolKind, Software]:
    """Kit inicial gratuito (entradas com 'start': true)."""
    return {ToolKind(d["kind"]): _make(d, owned=True)
            for d in _load_tools() if d.get("start")}


def build_software_catalog() -> list[Software]:
    """Itens à venda no mercado negro (entradas sem 'start')."""
    return [_make(d, owned=False) for d in _load_tools() if not d.get("start")]
