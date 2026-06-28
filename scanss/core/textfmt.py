"""Formatação de texto do terminal (custo de tempo alinhado à direita).

Usado tanto pelo terminal quanto pelo painel lateral para manter a estética
retro perfeitamente simétrica.
"""

from __future__ import annotations

LINE_WIDTH = 46


def format_cost(minutes: int) -> str:
    """'30 min', '02 hrs', '01h30' — formato compacto do custo de tempo."""
    if minutes >= 60 and minutes % 60 == 0:
        return f"{minutes // 60:02d} hrs"
    if minutes < 60:
        return f"{minutes:02d} min"
    return f"{minutes // 60:02d}h{minutes % 60:02d}"


def cost_tag(minutes: "int | None") -> str:
    """Etiqueta de custo: '[- 30 min]' (ou '[ instant]' quando 0/None)."""
    if not minutes:
        return "[ instant]"
    return f"[- {format_cost(minutes)}]"


def cost_line(label: str, minutes: "int | None", width: int = LINE_WIDTH) -> str:
    """Linha 'label .......... [- 30 min]' com a etiqueta alinhada à direita."""
    tag = f"[- {format_cost(minutes)}]" if minutes is not None else ""
    fill = max(1, width - len(label) - len(tag) - 2)
    return f"{label} {'.' * fill} {tag}".rstrip()
