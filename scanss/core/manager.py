"""GameManager — orquestra as regras do Capítulo 1 (com máquina de estados).

Fluxo de invasão:
  scan (Net_Scanner) -> connect (Open_ds_Hacker) -> ls -> crack (find_password)
  -> download + read (Data_Leech) -> extract_funds (liberado só após download+read
  do arquivo de senha).

Cada ação valida o tempo do dia, consome minutos e registra risco no ScanSS; o
Protocol_mask (quando ativo) reduz o risco pela metade e dobra o tempo. Tudo
retorna linhas de texto e emite logs para validar a matemática sem a GUI.
"""

from __future__ import annotations

import logging

from scanss.core.config import CURRENCY, Chapter1
from scanss.core.context import GameContext
from scanss.core.models import ToolKind
from scanss.core.states import PlayerState
from scanss.core.targets import Target, TargetFile, generate_targets

logger = logging.getLogger(__name__)


def level_for_xp(xp: int) -> int:
    """Nível correspondente ao XP acumulado (segundo Chapter1.XP_THRESHOLDS)."""
    level = 1
    for i, threshold in enumerate(Chapter1.XP_THRESHOLDS):
        if xp >= threshold:
            level = i + 1
    return level


class GameManager:
    def __init__(self, context: GameContext) -> None:
        self.ctx = context

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _clock(self) -> str:
        return self.ctx.time.clock()

    def _has(self, kind: ToolKind) -> bool:
        return self.ctx.player.has(kind)

    def _tool_time_factor(self, kind: ToolKind) -> float:
        t = self.ctx.player.tool(kind)
        return t.time_factor if t else 1.0

    def _require(self, kind: ToolKind, label: str) -> str | None:
        if not self._has(kind):
            return f"você não possui {label}. Compre no mercado."
        return None

    def _spend_and_risk(self, minutes: int, risk: float, reason: str
                        ) -> tuple[bool, bool, list[str]]:
        """Aplica o Protocol_mask, valida o tempo, consome e registra o risco.
        Retorna (executou, pego, linhas)."""
        p = self.ctx.player
        mask = p.tool(ToolKind.MASK)
        if p.masked and mask:
            minutes = round(minutes * mask.time_factor)
            risk *= mask.risk_factor
            self.ctx.stats.use_tool(ToolKind.MASK)

        t = self.ctx.time
        if not t.can_spend(minutes):
            return False, False, [
                f"tempo insuficiente: '{reason}' leva {t.fmt_duration(minutes)} "
                f"e restam só {t.fmt_duration(t.remaining_minutes)} hoje."]
        t.spend(minutes)
        caught = self.ctx.scanss.register(p, risk, reason=reason)
        self.ctx.stats.peak_trace = max(self.ctx.stats.peak_trace, p.trace)
        if p.trace >= Chapter1.TRACE_ALERT:
            self.ctx.stats.day_hit_alert = True
        lines = [f"[{self._clock()}] {reason}: -{t.fmt_duration(minutes)}, "
                 f"rastro +{risk:.0f}% (total {p.trace:.0f}%)"]
        if caught:
            lines += self._handle_caught()
        return True, caught, lines

    # ------------------------------------------------------------------
    # Ações — OFFLINE
    # ------------------------------------------------------------------
    def scan(self) -> list[str]:
        if self.ctx.state is not PlayerState.OFFLINE:
            return ["você precisa estar desconectado para escanear (use 'disconnect')."]
        err = self._require(ToolKind.SCANNER, "o Net_Scanner")
        if err:
            return [err]
        scanner = self.ctx.player.tool(ToolKind.SCANNER)
        ok, caught, lines = self._spend_and_risk(
            Chapter1.TIME_SCAN, Chapter1.RISK_SCAN, "scan")
        if not ok or caught:
            return lines
        self.ctx.stats.use_tool(ToolKind.SCANNER)
        tier = scanner.tier if scanner else 1
        targets = generate_targets(start_id=self.ctx.next_target_id, tier=tier)
        self.ctx.next_target_id += len(targets)
        self.ctx.targets = targets
        lines.append(f"Net_Scanner (tier {tier}) — alvos encontrados:")
        for tg in targets:
            lines.append(
                f"  [{tg.id}] {tg.name:<14} {tg.ip:<15} {tg.kind:<9} "
                f"dific:{tg.difficulty}  fundos~{tg.funds} {CURRENCY}")
        return lines

    def connect(self, tid: int) -> list[str]:
        if self.ctx.state is not PlayerState.OFFLINE:
            return ["você já está conectado. Use 'disconnect' antes."]
        err = self._require(ToolKind.EXPLOIT, "o Open_ds_Hacker")
        if err:
            return [err]
        target = next((t for t in self.ctx.targets if t.id == tid), None)
        if target is None:
            return ["alvo inexistente. Rode 'scan' primeiro."]
        if target.extracted:
            return [f"{target.name} já foi esvaziado."]
        minutes = round(Chapter1.TIME_CONNECT * self._tool_time_factor(ToolKind.EXPLOIT))
        ok, caught, lines = self._spend_and_risk(
            minutes, Chapter1.RISK_CONNECT, f"connect {target.name}")
        if not ok or caught:
            return lines
        self.ctx.stats.use_tool(ToolKind.EXPLOIT)
        self.ctx.connected = target
        self.ctx.state = PlayerState.CONNECTED
        lines.append(f">> conectado a {target.name} ({target.ip}:{target.port}). "
                     f"Use 'ls' para listar os arquivos.")
        return lines

    # ------------------------------------------------------------------
    # Ações — CONNECTED / DIR_VIEW
    # ------------------------------------------------------------------
    def ls(self) -> list[str]:
        if self.ctx.state not in (PlayerState.CONNECTED, PlayerState.DIR_VIEW):
            return ["nenhuma conexão ativa. Use 'connect <id>'."]
        ok, caught, lines = self._spend_and_risk(Chapter1.TIME_LS, Chapter1.RISK_LS, "ls")
        if not ok or caught:
            return lines
        self.ctx.state = PlayerState.DIR_VIEW
        t = self.ctx.connected
        lines.append(f"~/{t.name}/Desktop:")
        for i, f in enumerate(t.files, 1):
            flag = " (senha)" if f.is_password else ""
            lines.append(f"  [{i}] {f.name:<20} {f.status()}{flag}")
        lines.append("dica: use o ID, ex.: 'download 1' ou 'read 1'.")
        return lines

    def crack(self, ref: str) -> list[str]:
        guard = self._dir_guard(ToolKind.CRACK, "o find_password")
        if guard:
            return guard
        f = self._resolve_file(ref)
        if f is None:
            return [f"arquivo '{ref}' não existe aqui."]
        if not f.locked:
            return [f"{f.name} não está trancado."]
        if f.unlocked:
            return [f"{f.name} já foi desbloqueado."]
        target = self.ctx.connected
        minutes = round(target.crack_minutes() * self._tool_time_factor(ToolKind.CRACK))
        ok, caught, lines = self._spend_and_risk(
            minutes, target.crack_risk(), f"crack {f.name}")
        if not ok or caught:
            return lines
        self.ctx.stats.use_tool(ToolKind.CRACK)
        f.unlocked = True
        lines.append(f">> {f.name} desbloqueado. Agora use 'download' e 'read'.")
        return lines

    def download(self, ref: str) -> list[str]:
        guard = self._dir_guard(ToolKind.LEECH, "o Data_Leech")
        if guard:
            return guard
        f = self._resolve_file(ref)
        if f is None:
            return [f"arquivo '{ref}' não existe aqui."]
        if f.locked and not f.unlocked:
            return [f"{f.name} está trancado. Use 'crack {f.name}' antes."]
        minutes = round(Chapter1.TIME_DOWNLOAD * self._tool_time_factor(ToolKind.LEECH))
        ok, caught, lines = self._spend_and_risk(minutes, Chapter1.RISK_DOWNLOAD,
                                                 f"download {f.name}")
        if not ok or caught:
            return lines
        self.ctx.stats.use_tool(ToolKind.LEECH)
        f.downloaded = True
        self.ctx.player.disk.append(
            {"name": f.name, "content": f.content, "source": self.ctx.connected.name})
        lines.append(f">> {f.name} copiado para o seu disco.")
        return lines

    def read(self, ref: str) -> list[str]:
        if self.ctx.state is not PlayerState.DIR_VIEW:
            return ["liste os arquivos primeiro (use 'ls')."]
        f = self._resolve_file(ref)
        if f is None:
            return [f"arquivo '{ref}' não existe aqui."]
        if f.locked and not f.unlocked:
            return [f"{f.name} está trancado. Use 'crack {f.name}' antes."]
        ok, caught, lines = self._spend_and_risk(Chapter1.TIME_READ, Chapter1.RISK_READ,
                                                 f"read {f.name}")
        if not ok or caught:
            return lines
        f.read = True
        lines.append(f"----- {f.name} -----")
        lines += f.content.splitlines()
        lines.append("--------------------")
        return lines

    def extract_funds(self) -> list[str]:
        guard = self._dir_guard(ToolKind.LEECH, "o Data_Leech")
        if guard:
            return guard
        t = self.ctx.connected
        pwd = t.password_file
        if t.extracted:
            return ["os fundos deste alvo já foram extraídos."]
        if not (pwd and pwd.downloaded and pwd.read):
            return ["acesso negado: baixe ('download') e leia ('read') o arquivo de "
                    "senha antes de extrair os fundos."]
        minutes = round(Chapter1.TIME_EXTRACT * self._tool_time_factor(ToolKind.LEECH))
        ok, caught, lines = self._spend_and_risk(minutes, Chapter1.RISK_EXTRACT,
                                                 "extract_funds")
        if not ok or caught:
            return lines
        self.ctx.stats.use_tool(ToolKind.LEECH)
        funds = t.funds
        self.ctx.player.add_money(funds)
        self.ctx.player.day_loot += funds
        self.ctx.stats.total_looted += funds
        self.ctx.stats.successful_invasions += 1
        t.extracted = True
        lines.append(f">> FUNDOS EXTRAÍDOS: +{funds} {CURRENCY}. "
                     f"Saldo: {self.ctx.player.balance} {CURRENCY}")
        lines += self._apply_xp(funds)
        lines.append("recomendo 'disconnect' para limpar os rastros.")
        return lines

    def _apply_xp(self, amount: int) -> list[str]:
        """XP = fundos extraídos. Sobe de nível ao cruzar os limiares."""
        p = self.ctx.player
        p.xp += amount
        new_level = level_for_xp(p.xp)
        if new_level > p.level:
            p.level = new_level
            return [f">> NÍVEL UP! Você agora é nível {new_level}."]
        return []

    def disconnect(self) -> list[str]:
        if self.ctx.connected is None:
            return ["nenhuma conexão ativa."]
        name = self.ctx.connected.name
        self.ctx.connected = None
        self.ctx.state = PlayerState.OFFLINE
        return [f"conexão com {name} encerrada."]

    def my_pc(self) -> list[str]:
        p = self.ctx.player
        lines = ["=== MEU PC ===",
                 f"nível: {p.level}   XP: {p.xp}",
                 f"saldo consolidado: {p.balance} {CURRENCY}",
                 f"arquivos no disco: {len(p.disk)}"]
        for d in p.disk:
            lines.append(f"  {d['name']:<20} (de {d['source']})")
        return lines

    def log_eraser(self) -> list[str]:
        """Limpa rastro ativamente: gasta horas do dia (não dias), sem risco."""
        if self.ctx.state is not PlayerState.OFFLINE:
            return ["rode o Log_Eraser no seu PC (use 'disconnect' antes)."]
        err = self._require(ToolKind.ERASER, "o Log_Eraser")
        if err:
            return [err]
        minutes = round(Chapter1.TIME_ERASER * self._tool_time_factor(ToolKind.ERASER))
        t = self.ctx.time
        if not t.can_spend(minutes):
            return [f"tempo insuficiente: o Log_Eraser leva {t.fmt_duration(minutes)} "
                    f"e restam só {t.fmt_duration(t.remaining_minutes)} hoje."]
        t.spend(minutes)
        self.ctx.stats.use_tool(ToolKind.ERASER)
        before = self.ctx.player.trace
        self.ctx.player.trace = max(0.0, before - Chapter1.ERASER_REDUCTION)
        logger.info("Log_Eraser: rastro %.0f%% -> %.0f%%", before, self.ctx.player.trace)
        return [f"[{self._clock()}] Log_Eraser: -{t.fmt_duration(minutes)}, "
                f"rastro {before:.0f}% -> {self.ctx.player.trace:.0f}%"]

    # --- helpers de guarda de estado -----------------------------------
    def _dir_guard(self, kind: ToolKind, label: str) -> list[str] | None:
        if self.ctx.state is not PlayerState.DIR_VIEW:
            return ["liste os arquivos primeiro (use 'ls')."]
        err = self._require(kind, label)
        return [err] if err else None

    def _file(self, name: str) -> TargetFile | None:
        return self.ctx.connected.file(name) if self.ctx.connected else None

    def _resolve_file(self, ref: str) -> TargetFile | None:
        """Resolve um arquivo por ID numérico (1-based) ou por nome."""
        t = self.ctx.connected
        if t is None:
            return None
        if ref.isdigit():
            idx = int(ref) - 1
            return t.files[idx] if 0 <= idx < len(t.files) else None
        return t.file(ref)

    # ------------------------------------------------------------------
    # Mercado
    # ------------------------------------------------------------------
    def buy(self, index: int) -> list[str]:
        i = index - 1   # 'buy 1' compra o primeiro item
        if not 0 <= i < len(self.ctx.market):
            return ["item inexistente."]
        s = self.ctx.market[i]
        if s.owned:
            return [f"{s.label} já instalado."]
        if self.ctx.player.balance < s.price:
            return [f"saldo insuficiente ({s.price} {CURRENCY})."]
        self.ctx.player.add_money(-s.price)
        s.owned = True
        self.ctx.player.tools[s.kind] = s
        return [f"instalado: {s.label}. Saldo: {self.ctx.player.balance} {CURRENCY}"]

    # ------------------------------------------------------------------
    # Virada do dia / punição
    # ------------------------------------------------------------------
    def sleep(self) -> list[str]:
        if self.ctx.game_over:
            return ["o jogo acabou (falência)."]
        return self._end_day("você encerrou o dia")

    def _handle_caught(self) -> list[str]:
        p = self.ctx.player
        confiscated = p.day_loot
        p.add_money(-confiscated)
        p.add_money(-Chapter1.SCANSS_FINE)
        self.ctx.scanss.reset(p)
        self.ctx.connected = None
        self.ctx.state = PlayerState.OFFLINE
        self.ctx.stats.times_caught += 1
        logger.info("PEGO pelo ScanSS: confisco=%d multa=%d saldo=%d",
                    confiscated, Chapter1.SCANSS_FINE, p.balance)
        lines = [
            "!! ScanSS ACIONADO (100%) !!",
            f"loot do dia confiscado: -{confiscated} {CURRENCY}",
            f"multa aplicada: -{Chapter1.SCANSS_FINE} {CURRENCY}",
            "conexão derrubada; o dia foi encerrado à força.",
        ]
        return lines + self._end_day("pego pelo ScanSS", caught=True)

    def _end_day(self, reason: str, caught: bool = False) -> list[str]:
        ctx = self.ctx
        p = ctx.player
        lines = [f"--- fim do dia {ctx.time.day} ({reason}) ---"]

        p.add_money(-Chapter1.DAILY_DEBT)
        ctx.stats.debts_paid += Chapter1.DAILY_DEBT
        lines.append(f"dívida diária: -{Chapter1.DAILY_DEBT} {CURRENCY}  "
                     f"-> saldo {p.balance} {CURRENCY}")

        if p.balance < 0:
            p.consecutive_negative_days += 1
            lines.append(f"SALDO NEGATIVO ({p.consecutive_negative_days}/"
                         f"{Chapter1.MAX_NEGATIVE_DAYS} dias).")
        else:
            p.consecutive_negative_days = 0

        if ctx.stats.day_hit_alert and not caught:
            ctx.stats.alerts_avoided += 1
        ctx.stats.day_hit_alert = False

        reduced = ctx.scanss.decay(p)
        if reduced:
            lines.append(f"rastreamento esfria: -{reduced:.0f}% (agora {p.trace:.0f}%).")

        p.day_loot = 0
        ctx.targets = []
        ctx.connected = None
        ctx.state = PlayerState.OFFLINE
        ended_day_number = ctx.time.day
        ctx.time.next_day()

        if p.consecutive_negative_days >= Chapter1.MAX_NEGATIVE_DAYS:
            ctx.game_over = True
            lines += ["", "*** FALÊNCIA — GAME OVER ***",
                      "Você não pagou as dívidas por tempo demais."]
        elif ended_day_number >= Chapter1.SURVIVE_DAYS:
            ctx.chapter_complete = True
            lines += ["", f"*** Você sobreviveu a {Chapter1.SURVIVE_DAYS} dias! "
                      f"Capítulo {ctx.chapter} concluído. ***"]
        else:
            lines.append(f"[{ctx.time.clock()}] começa o dia {ctx.time.day}.")

        self._autosave()
        return lines

    # ------------------------------------------------------------------
    # Persistência
    # ------------------------------------------------------------------
    def _autosave(self) -> None:
        if self.ctx.db is None:
            return
        from scanss.core.savegame import serialize
        self.ctx.db.save_game(self.ctx.slot, serialize(self.ctx))

    def save(self, slot: int | None = None) -> list[str]:
        if self.ctx.db is None:
            return ["persistência indisponível (sem banco de dados)."]
        if slot is not None:
            if not 1 <= slot <= self.ctx.db.slot_count():
                return [f"slot inválido (você tem {self.ctx.db.slot_count()} slots)."]
            self.ctx.slot = slot
        self._autosave()
        return [f"jogo salvo no slot {self.ctx.slot}."]

    def load(self, slot: int | None = None) -> list[str]:
        if self.ctx.db is None:
            return ["persistência indisponível (sem banco de dados)."]
        target_slot = slot if slot is not None else self.ctx.slot
        data = self.ctx.db.load_game(target_slot)
        if data is None:
            return [f"slot {target_slot} está vazio."]
        from scanss.core.savegame import apply
        self.ctx.slot = target_slot
        apply(self.ctx, data)
        return [f"slot {target_slot} carregado (dia {self.ctx.time.day}, "
                f"saldo {self.ctx.player.balance})."]

    def buy_slot(self) -> list[str]:
        if self.ctx.db is None:
            return ["persistência indisponível."]
        if self.ctx.player.balance < Chapter1.SAVE_SLOT_PRICE:
            return [f"saldo insuficiente ({Chapter1.SAVE_SLOT_PRICE} {CURRENCY})."]
        self.ctx.player.add_money(-Chapter1.SAVE_SLOT_PRICE)
        self.ctx.db.set_slot_count(self.ctx.db.slot_count() + 1)
        return [f"slot de save comprado! Agora você tem {self.ctx.db.slot_count()} slots."]

    def _reset_context(self) -> None:
        from scanss.core.catalog import build_software_catalog, starting_tools
        from scanss.core.models import Player, Stats
        from scanss.core.scanss import ScanSS
        from scanss.core.time_system import TimeSystem

        ctx = self.ctx
        ctx.player = Player(tools=starting_tools())
        ctx.scanss = ScanSS()
        ctx.time = TimeSystem()
        ctx.market = build_software_catalog()
        ctx.stats = Stats()
        ctx.chapter = 1
        ctx.state = PlayerState.OFFLINE
        ctx.targets = []
        ctx.connected = None
        ctx.game_over = False
        ctx.chapter_complete = False
        ctx.dev_mode = False
        ctx.next_target_id = 1

    def reset_game(self) -> list[str]:
        """Zera a sessão atual e apaga o slot corrente (sem mexer na conta)."""
        if self.ctx.db is not None:
            self.ctx.db.delete_game(self.ctx.slot)
        self._reset_context()
        logger.info("reset do slot %d", self.ctx.slot)
        return ["jogo reiniciado do zero."]

    def destroy_vm(self) -> list[str]:
        """Destruir VM: apaga conta, todos os saves e zera a sessão."""
        if self.ctx.db is not None:
            self.ctx.db.wipe()
        self._reset_context()
        self.ctx.username = ""
        self.ctx.slot = 1
        self.ctx.needs_auth = True
        logger.info("VM DESTRUÍDA")
        return ["VM destruída. Todos os dados foram apagados."]

    # ------------------------------------------------------------------
    # Modo desenvolvedor (sandbox)
    # ------------------------------------------------------------------
    def dev_set_balance(self, value: int) -> list[str]:
        self.ctx.player.balance = value
        return [f"[DEV] saldo = {value} {CURRENCY}"]

    def dev_set_trace(self, value: float) -> list[str]:
        self.ctx.player.trace = max(0.0, min(Chapter1.TRACE_MAX, value))
        return [f"[DEV] rastreamento = {self.ctx.player.trace:.0f}%"]

    def dev_set_chapter(self, value: int) -> list[str]:
        self.ctx.chapter = max(1, min(6, value))
        return [f"[DEV] capítulo = {self.ctx.chapter}"]

    def dev_set_day(self, value: int) -> list[str]:
        self.ctx.time.day = max(1, value)
        return [f"[DEV] dia = {self.ctx.time.day}"]

    def dev_set_level(self, value: int) -> list[str]:
        self.ctx.player.level = max(1, min(len(Chapter1.XP_THRESHOLDS), value))
        return [f"[DEV] nível = {self.ctx.player.level}"]
