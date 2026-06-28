"""Entidades de domínio: ferramentas (Software) e jogador (Player).

O ScanSS vive em `core/scanss.py`, os alvos em `core/targets.py` e o relógio em
`core/time_system.py`. A UI nunca calcula regra: lê estes objetos via GameManager.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

from scanss.core.config import Chapter1


# ---------------------------------------------------------------------------
# Softwares / ferramentas
# ---------------------------------------------------------------------------
class ToolKind(str, Enum):
    SCANNER = "net_scanner"     # varre a rede em busca de alvos
    EXPLOIT = "open_ds_hacker"  # abre a conexão com a porta vulnerável
    CRACK = "find_password"     # quebra a criptografia de arquivos trancados
    MASK = "protocol_mask"      # reduz o risco da ação (e dobra o tempo)
    LEECH = "data_leech"        # baixa arquivos e extrai fundos
    ERASER = "log_eraser"       # limpa rastro (gasta horas, não dias)


@dataclass
class Software:
    """Ferramenta do mercado. Faz gating (é preciso possuir para usar a ação) e
    carrega multiplicadores de tempo/risco e o tier (alcance do Net_Scanner).
    """
    kind: ToolKind
    name: str
    version: str
    price: int
    function: str = ""
    time_factor: float = 1.0    # multiplicador de tempo da ação correspondente
    risk_factor: float = 1.0    # multiplicador de risco
    tier: int = 1               # Net_Scanner: alcance de alvos (corporativos)
    level: int = 1
    owned: bool = False

    @property
    def label(self) -> str:
        return f"{self.name}_{self.version}"


# ---------------------------------------------------------------------------
# Jogador
# ---------------------------------------------------------------------------
@dataclass
class Player:
    handle: str = "operador"
    level: int = 1
    xp: int = 0                         # experiência (total de fundos extraídos)
    balance: int = Chapter1.STARTING_BALANCE
    trace: float = 0.0                  # nível de rastreamento (0..100)
    masked: bool = False                # protocol_mask ativo
    consecutive_negative_days: int = 0  # dias seguidos no negativo
    day_loot: int = 0                   # moedas roubadas hoje (confiscáveis)
    tools: dict[ToolKind, Software] = field(default_factory=dict)
    disk: list[dict] = field(default_factory=list)   # arquivos baixados (no meu PC)

    def tool(self, kind: ToolKind) -> Optional[Software]:
        return self.tools.get(kind)

    def has(self, kind: ToolKind) -> bool:
        return kind in self.tools

    def add_money(self, amount: int) -> None:
        self.balance += amount   # pode ficar negativo (dívida) de propósito


# ---------------------------------------------------------------------------
# Estatísticas da partida (alimentam o relatório de fim de capítulo)
# ---------------------------------------------------------------------------
@dataclass
class Stats:
    total_looted: int = 0           # moedas virtuais extraídas
    debts_paid: int = 0             # total de dívidas pagas
    successful_invasions: int = 0   # alvos invadidos com sucesso
    peak_trace: float = 0.0         # maior rastreamento atingido (%)
    alerts_avoided: int = 0         # dias em alerta que terminaram sem ser pego
    times_caught: int = 0           # vezes pego pelo ScanSS
    tool_usage: dict[str, int] = field(default_factory=dict)
    day_hit_alert: bool = False     # controle interno por dia

    def use_tool(self, kind: "ToolKind") -> None:
        self.tool_usage[kind.value] = self.tool_usage.get(kind.value, 0) + 1

    def top_tool(self) -> str:
        if not self.tool_usage:
            return "-"
        return max(self.tool_usage.items(), key=lambda kv: kv[1])[0]
