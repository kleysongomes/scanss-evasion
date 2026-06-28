"""GameEngine — tradutor de comandos do terminal.

Faz o parse da linha digitada e delega ao GameManager (regras). Inclui o modo
desenvolvedor (comando oculto 'sudo dev_mode') e formata o 'help' com o custo de
tempo alinhado à direita.
"""

from __future__ import annotations

from typing import Callable

from scanss.core.config import CURRENCY, Chapter1
from scanss.core.context import GameContext
from scanss.core.manager import GameManager
from scanss.core.models import ToolKind
from scanss.help_catalog import render_help, render_help_sys


class GameEngine:
    def __init__(self, context: GameContext) -> None:
        self.ctx = context
        self.manager = GameManager(context)
        self._pending: Callable[[], list[str]] | None = None

    def run(self, raw: str) -> list[str]:
        # Trava de confirmação: se há uma ação pendente, este input a resolve.
        if self._pending is not None:
            action, self._pending = self._pending, None
            if raw.strip() == "CONFIRMAR":
                return action()
            return ["operação cancelada."]

        parts = raw.strip().split()
        if not parts:
            return []
        cmd, args = parts[0].lower(), parts[1:]

        if self.ctx.game_over and cmd not in (
                "status", "help", "man", "clear", "sudo", "dev", "destroy_vm"):
            return ["*** GAME OVER (falência). Destrua a VM para recomeçar. ***"]

        handler = getattr(self, f"cmd_{cmd}", None)
        if handler is None:
            return [f"comando desconhecido: '{cmd}'. Digite 'help'."]
        return handler(args)

    # Trava reutilizável: arma uma confirmação que só executa com "CONFIRMAR".
    def confirm_action(self, action: Callable[[], list[str]],
                       warning: list[str]) -> list[str]:
        self._pending = action
        return warning

    # ------------------------------------------------------------------
    # Ajuda (com custo de tempo alinhado à direita)
    # ------------------------------------------------------------------
    def cmd_help(self, args: list[str]) -> list[str]:
        if args and args[0] == "sys":
            return render_help_sys()
        return render_help()

    def cmd_man(self, _args: list[str]) -> list[str]:
        from scanss.story import TUTORIAL_SYSTEM
        return ["__CLEAR__"] + TUTORIAL_SYSTEM.splitlines()

    def cmd_status(self, _args: list[str]) -> list[str]:
        p, t = self.ctx.player, self.ctx.time
        bar = self._trace_bar(p.trace)
        return [
            f"capítulo...: {self.ctx.chapter}   estado: {self.ctx.state.value}",
            f"dia........: {t.day}   relógio: [{t.clock()}]   "
            f"resta: {t.fmt_duration(t.remaining_minutes)}",
            f"saldo......: {p.balance} {CURRENCY}   "
            f"(dívida diária: {Chapter1.DAILY_DEBT} {CURRENCY})",
            f"loot do dia: {p.day_loot} {CURRENCY}   disco: {len(p.disk)} arquivo(s)",
            f"negativo...: {p.consecutive_negative_days}/{Chapter1.MAX_NEGATIVE_DAYS} dias",
            f"rastro.....: {p.trace:5.1f}% {bar}",
            f"mask.......: {'ATIVO' if p.masked else 'desligado'}",
        ]

    # ------------------------------------------------------------------
    # Ações (delegam ao manager)
    # ------------------------------------------------------------------
    def cmd_scan(self, _args: list[str]) -> list[str]:
        return self.manager.scan()

    def cmd_connect(self, args: list[str]) -> list[str]:
        if not args or not args[0].isdigit():
            return ["uso: connect <id>"]
        return self.manager.connect(int(args[0]))

    def cmd_ls(self, _args: list[str]) -> list[str]:
        return self.manager.ls()

    def cmd_crack(self, args: list[str]) -> list[str]:
        if not args:
            return ["uso: crack <arquivo>"]
        return self.manager.crack(args[0])

    def cmd_download(self, args: list[str]) -> list[str]:
        if not args:
            return ["uso: download <arquivo>"]
        return self.manager.download(args[0])

    def cmd_read(self, args: list[str]) -> list[str]:
        if not args:
            return ["uso: read <arquivo>"]
        return self.manager.read(args[0])

    def cmd_extract_funds(self, _args: list[str]) -> list[str]:
        return self.manager.extract_funds()

    def cmd_disconnect(self, _args: list[str]) -> list[str]:
        return self.manager.disconnect()

    def cmd_my_pc(self, _args: list[str]) -> list[str]:
        return self.manager.my_pc()

    def cmd_log_eraser(self, _args: list[str]) -> list[str]:
        return self.manager.log_eraser()

    def cmd_mask(self, args: list[str]) -> list[str]:
        if not self.ctx.player.has(ToolKind.MASK):
            return ["você não possui o Protocol_mask. Compre no mercado."]
        if not args or args[0] not in ("on", "off"):
            return ["uso: mask on|off"]
        self.ctx.player.masked = args[0] == "on"
        return [f"Protocol_mask {'ATIVO (risco/2, tempo x2)' if self.ctx.player.masked else 'desligado'}."]

    def cmd_targets(self, _args: list[str]) -> list[str]:
        if not self.ctx.targets:
            return ["nenhum alvo. Rode 'scan'."]
        lines = ["alvos do último scan:"]
        for tg in self.ctx.targets:
            mark = "*" if tg.extracted else " "
            lines.append(f" {mark}[{tg.id}] {tg.name:<14} {tg.ip:<15} "
                         f"{tg.kind:<9} dific:{tg.difficulty}  fundos~{tg.funds} {CURRENCY}")
        return lines

    def cmd_tools(self, _args: list[str]) -> list[str]:
        lines = ["ferramentas instaladas:"]
        for kind in ToolKind:
            tool = self.ctx.player.tool(kind)
            lines.append(f"  {tool.label:<22} {tool.function}" if tool
                         else f"  [{kind.value}] -- não instalado")
        return lines

    def cmd_market(self, _args: list[str]) -> list[str]:
        lines = ["== MERCADO NEGRO ==  (buy <n>)", ""]
        for i, s in enumerate(self.ctx.market, 1):
            preco = "INSTALADO" if s.owned else f"₿ {s.price}"
            lines.append(f"[{i}] {s.name} {s.version} - {preco} : {s.function}")
        return lines

    def cmd_buy(self, args: list[str]) -> list[str]:
        if not args or not args[0].isdigit():
            return ["uso: buy <número>"]
        return self.manager.buy(int(args[0]))   # índice 1-based

    def cmd_sleep(self, _args: list[str]) -> list[str]:
        return self.manager.sleep()

    def cmd_save(self, args: list[str]) -> list[str]:
        slot = int(args[0]) if args and args[0].isdigit() else None
        return self.manager.save(slot)

    def cmd_load(self, args: list[str]) -> list[str]:
        slot = int(args[0]) if args and args[0].isdigit() else None
        return self.manager.load(slot)

    def cmd_destroy_vm(self, _args: list[str]) -> list[str]:
        return self.confirm_action(
            lambda: ["__CLEAR__"] + self.manager.destroy_vm(),
            ["[!] ALERTA CRÍTICO: Isso vai DESTRUIR a VM — apaga TODO o progresso",
             "    e a conta (login/senha). Não há como recuperar.",
             "    Digite 'CONFIRMAR' para prosseguir ou 'N' para cancelar."])

    def command_names(self) -> list[str]:
        """Comandos para o autocompletar (TAB) do terminal."""
        return ["scan", "connect", "ls", "crack", "download", "read",
                "extract_funds", "disconnect", "my_pc", "log_eraser", "mask",
                "status", "targets", "tools", "market", "buy", "sleep",
                "save", "load", "destroy_vm", "man", "help", "clear"]

    def cmd_clear(self, _args: list[str]) -> list[str]:
        return ["__CLEAR__"]

    # ------------------------------------------------------------------
    # Modo desenvolvedor
    # ------------------------------------------------------------------
    def cmd_sudo(self, args: list[str]) -> list[str]:
        if args and args[0] == "dev_mode":
            self.ctx.dev_mode = not self.ctx.dev_mode
            if self.ctx.dev_mode:
                return self._dev_menu()
            return ["[DEV] modo desenvolvedor DESATIVADO."]
        return ["permissão negada."]

    def cmd_dev(self, args: list[str]) -> list[str]:
        if not self.ctx.dev_mode:
            return ["comando desconhecido: 'dev'. Digite 'help'."]
        if not args:
            return self._dev_menu()
        sub, rest = args[0], args[1:]
        if sub == "money" and rest and self._is_int(rest[0]):
            return self.manager.dev_set_balance(int(rest[0]))
        if sub == "trace" and rest and self._is_float(rest[0]):
            return self.manager.dev_set_trace(float(rest[0]))
        if sub == "chapter" and rest and rest[0].isdigit():
            return self.manager.dev_set_chapter(int(rest[0]))
        if sub == "day" and rest and rest[0].isdigit():
            return self.manager.dev_set_day(int(rest[0]))
        if sub == "level" and rest and rest[0].isdigit():
            return self.manager.dev_set_level(int(rest[0]))
        if sub == "destroy":
            return self.manager.destroy_vm()
        return self._dev_menu()

    @staticmethod
    def _dev_menu() -> list[str]:
        return [
            "[DEV] MODO DESENVOLVEDOR (sandbox):",
            "  dev money <n>     - define o saldo",
            "  dev trace <n>     - define o rastreamento (0..100)",
            "  dev level <n>     - define o nível",
            "  dev chapter <n>   - pula para o capítulo n (1..6)",
            "  dev day <n>       - define o dia",
            "  dev destroy       - DESTRUIR VM (apaga conta e progresso)",
            "  sudo dev_mode     - desativa o modo dev",
        ]

    # ------------------------------------------------------------------
    @staticmethod
    def _is_int(s: str) -> bool:
        return s.lstrip("-").isdigit()

    @staticmethod
    def _is_float(s: str) -> bool:
        try:
            float(s)
            return True
        except ValueError:
            return False

    @staticmethod
    def _trace_bar(trace: float, width: int = 20) -> str:
        filled = int((trace / Chapter1.TRACE_MAX) * width)
        return "[" + "#" * filled + "-" * (width - filled) + "]"
