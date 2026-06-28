"""Descoberta automática de features.

Importa todos os subpacotes de scanss.features e instancia cada subclasse de
Feature encontrada, ordenada por (order, title). Igual ao discover_features do
Toolza: para adicionar um módulo novo, basta criar a pasta da feature -- nenhum
registro manual.
"""

from __future__ import annotations

import importlib
import pkgutil

from scanss import features
from scanss.core.feature import Feature


def discover_features() -> list[Feature]:
    for module in pkgutil.iter_modules(features.__path__, features.__name__ + "."):
        importlib.import_module(module.name)
    instances = [cls() for cls in Feature.__subclasses__()]
    return sorted(instances, key=lambda f: (f.order, f.title))
