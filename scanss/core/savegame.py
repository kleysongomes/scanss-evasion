"""Serialização do estado do jogo (GameContext <-> dict).

Converte o contexto num dicionário de tipos primitivos para o Database gravar,
e reconstrói o estado ao carregar. Alvos do scan e a conexão atual são efêmeros
e não são persistidos.
"""

from __future__ import annotations

from scanss.core.context import GameContext
from scanss.core.models import Software, Stats, ToolKind

SAVE_VERSION = 1


def serialize(ctx: GameContext) -> dict:
    p = ctx.player
    return {
        "version": SAVE_VERSION,
        "chapter": ctx.chapter,
        "next_target_id": ctx.next_target_id,
        "time": {"day": ctx.time.day, "minute_of_day": ctx.time.minute_of_day},
        "player": {
            "handle": p.handle,
            "level": p.level,
            "xp": p.xp,
            "balance": p.balance,
            "trace": p.trace,
            "masked": p.masked,
            "consecutive_negative_days": p.consecutive_negative_days,
            "day_loot": p.day_loot,
            "disk": p.disk,
            "tools": [_tool_dict(s) for s in p.tools.values()],
        },
        "market_owned": [s.label for s in ctx.market if s.owned],
        "stats": {
            "total_looted": ctx.stats.total_looted,
            "debts_paid": ctx.stats.debts_paid,
            "successful_invasions": ctx.stats.successful_invasions,
            "peak_trace": ctx.stats.peak_trace,
            "alerts_avoided": ctx.stats.alerts_avoided,
            "times_caught": ctx.stats.times_caught,
            "tool_usage": ctx.stats.tool_usage,
        },
    }


def apply(ctx: GameContext, data: dict) -> None:
    ctx.chapter = data.get("chapter", 1)
    ctx.next_target_id = data.get("next_target_id", 1)

    t = data.get("time", {})
    ctx.time.day = t.get("day", 1)
    ctx.time.minute_of_day = t.get("minute_of_day", ctx.time.minute_of_day)

    pd = data.get("player", {})
    p = ctx.player
    p.handle = pd.get("handle", p.handle)
    p.level = pd.get("level", p.level)
    p.xp = pd.get("xp", 0)
    p.balance = pd.get("balance", p.balance)
    p.trace = pd.get("trace", 0.0)
    p.masked = pd.get("masked", False)
    p.consecutive_negative_days = pd.get("consecutive_negative_days", 0)
    p.day_loot = pd.get("day_loot", 0)
    p.disk = list(pd.get("disk", []))
    p.tools = {ToolKind(d["kind"]): _tool_from_dict(d) for d in pd.get("tools", [])}

    owned = set(data.get("market_owned", []))
    for s in ctx.market:
        s.owned = s.label in owned

    sd = data.get("stats", {})
    ctx.stats = Stats(
        total_looted=sd.get("total_looted", 0),
        debts_paid=sd.get("debts_paid", 0),
        successful_invasions=sd.get("successful_invasions", 0),
        peak_trace=sd.get("peak_trace", 0.0),
        alerts_avoided=sd.get("alerts_avoided", 0),
        times_caught=sd.get("times_caught", 0),
        tool_usage=dict(sd.get("tool_usage", {})),
    )

    # efêmeros
    from scanss.core.states import PlayerState
    ctx.targets = []
    ctx.connected = None
    ctx.game_over = False
    ctx.chapter_complete = False
    ctx.state = PlayerState.OFFLINE


def _tool_dict(s: Software) -> dict:
    return {"kind": s.kind.value, "name": s.name, "version": s.version,
            "price": s.price, "function": s.function, "time_factor": s.time_factor,
            "risk_factor": s.risk_factor, "tier": s.tier}


def _tool_from_dict(d: dict) -> Software:
    return Software(ToolKind(d["kind"]), d["name"], d["version"],
                    price=d.get("price", 0), function=d.get("function", ""),
                    time_factor=d.get("time_factor", 1.0),
                    risk_factor=d.get("risk_factor", 1.0),
                    tier=d.get("tier", 1), owned=True)
