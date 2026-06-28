"""Janela principal: boot (loading + login), moldura e telas narrativas.

Fluxo de inicialização:
  LoadingScreen -> LoginScreen (criar/entrar) -> carrega o save mais recente
  -> intro do capítulo (só na 1ª vez) -> jogo.

Header (topo): USUÁRIO | CAPÍTULO | DIA | NÍVEL | SALDO.
Footer (rodapé): RASTRO (ScanSS) + ferramentas ativas (MASK).
"""

from __future__ import annotations

import tkinter as tk

from scanss import APP_NAME, __version__
from scanss.core import account
from scanss.core.config import CURRENCY, Chapter1, FONT_TITLE, Palette
from scanss.core.context import GameContext
from scanss.core.feature import Feature
from scanss.core.states import CONTEXT_COMMANDS
from scanss.story import CHAPTER1_INTRO, CHAPTER1_OUTRO, chapter1_summary
from scanss.ui.components.loading import LoadingScreen
from scanss.ui.components.login import LoginScreen
from scanss.ui.components.narration import NarrationScreen
from scanss.ui.components.sidebar import Sidebar
from scanss.ui.theme import bordered_panel, trace_color

REFRESH_MS = 500

GAME_OVER_TEXT = (
    "=========================================================\n"
    "FALÊNCIA — CONTA ZERADA. SUPRIMENTOS CORTADOS.\n"
    "=========================================================\n\n"
    "As dívidas venceram você antes do ScanSS. Sem fundos, sem energia,\n"
    "o terminal apaga.\n\n"
    "> Tecle [ENTER] para destruir a VM e recomeçar..."
)


class MainWindow(tk.Tk):
    def __init__(self, context: GameContext, features: list[Feature]) -> None:
        super().__init__()
        self.context = context
        self.features = features
        self.views: dict[str, tk.Frame] = {}
        self.current: Feature | None = None
        self._overlay: tk.Frame | None = None
        self._end_shown = False
        self._booted = False

        self.title(f"{APP_NAME} v{__version__}")
        self.configure(bg=Palette.BG)
        self.geometry("1100x720")
        self.minsize(900, 600)

        self._build_header()
        body = tk.Frame(self, bg=Palette.BG)
        body.pack(fill="both", expand=True, padx=8, pady=4)
        self.sidebar = Sidebar(
            body, features, self.select, self._on_suggestion,
            actions=[("[X] DESTRUIR VM", self._destroy_vm)],
            menu_actions=[("[?] MANUAL / REGRAS", self._show_manual),
                          ("[S] GERENCIAR SAVES", self._show_saves)])
        self.sidebar.pack(side="right", fill="y", padx=(8, 0))   # fixo, sempre visível
        self.page_host = bordered_panel(body, bg=Palette.BG_PANEL)
        self.page_host.pack(side="left", fill="both", expand=True)
        self._build_footer()

        self.bind_all("<Control-d>", self._toggle_dev)   # modo dev (TAB = autocompletar)

        if features:
            self.select(features[0])

        self._boot()
        self._tick()

    # ------------------------------------------------------------------
    # Boot: loading -> login -> carregar -> intro
    # ------------------------------------------------------------------
    def _boot(self) -> None:
        self._set_overlay(LoadingScreen(self, on_done=self._auth))

    def _auth(self) -> None:
        if self.context.db is None:           # sem persistência: pula o login
            self._after_login("operador")
            return
        self._set_overlay(LoginScreen(self, self.context.db, self._after_login,
                                      self._vm_destroyed_exit))

    def _vm_destroyed_exit(self) -> None:
        """3 senhas erradas: a VM já foi apagada; fecha o jogo abruptamente."""
        import os
        try:
            self.destroy()
        finally:
            os._exit(0)

    def _after_login(self, user: str) -> None:
        self.context.username = user
        self._load_recent()
        self._enter_game()

    def _load_recent(self) -> None:
        db = self.context.db
        if db is None:
            return
        saves = db.list_saves()
        if not saves:
            return
        slot = max(saves, key=lambda s: saves[s]["updated_at"])
        from scanss.core.savegame import apply
        self.context.slot = slot
        apply(self.context, db.load_game(slot))

    def _enter_game(self) -> None:
        self._booted = True
        self._hide_overlay()
        if not self._intro_seen():
            self._set_overlay(NarrationScreen(self, CHAPTER1_INTRO,
                                              on_done=self._after_intro))
        else:
            self._start_play()

    def _after_intro(self) -> None:
        self._mark_intro_seen()
        self._hide_overlay()
        tv = self.views.get("terminal")
        if tv is not None:
            tv.run_external("man")     # manual na primeira vez
        self._start_play()

    def _start_play(self) -> None:
        self._hide_overlay()
        tv = self.views.get("terminal")
        if tv is not None and hasattr(tv, "entry"):
            tv.entry.focus_set()

    # narrativa única por capítulo
    def _intro_key(self) -> str:
        return f"seen_intro_ch{self.context.chapter}"

    def _intro_seen(self) -> bool:
        if self.context.db is not None:
            return bool(self.context.db.get_setting(self._intro_key(), False))
        return getattr(self, "_session_intro", False)

    def _mark_intro_seen(self) -> None:
        if self.context.db is not None:
            self.context.db.set_setting(self._intro_key(), True)
        else:
            self._session_intro = True

    # ------------------------------------------------------------------
    # Overlays
    # ------------------------------------------------------------------
    def _set_overlay(self, frame: tk.Frame) -> None:
        self._hide_overlay()
        self._overlay = frame
        frame.place(relx=0, rely=0, relwidth=1, relheight=1)

    def _hide_overlay(self) -> None:
        if self._overlay is not None:
            self._overlay.destroy()
            self._overlay = None

    def _show_narration(self, text: str, *, on_done=None, choices=None) -> None:
        self._set_overlay(NarrationScreen(self, text, on_done=on_done, choices=choices,
                                          cps=self._cps()))

    def _cps(self) -> int:
        if self.context.db is not None:
            return int(self.context.db.get_setting("typewriter_cps", 50))
        return 50

    def _show_chapter_end(self) -> None:
        self._show_narration(
            CHAPTER1_OUTRO,
            on_done=lambda: self._show_narration(
                chapter1_summary(self.context),
                choices={"s": self._next_chapter, "n": self._start_play}))

    def _next_chapter(self) -> None:
        self._show_narration(
            "=========================================================\n"
            "CAPÍTULO 2 — O CONVITE SOMBRIO\n"
            "=========================================================\n\n"
            "Em desenvolvimento. O Coletivo já está de olho em você...\n\n"
            "> Tecle [ENTER] para voltar ao terminal...",
            on_done=self._start_play)

    def _show_game_over(self) -> None:
        self._show_narration(GAME_OVER_TEXT, on_done=self._destroy_vm)

    # ------------------------------------------------------------------
    # Menu / atalhos
    # ------------------------------------------------------------------
    def _terminal(self):
        feat = next((f for f in self.features if f.id == "terminal"), None)
        if feat is not None:
            self.select(feat)
            return self.views.get("terminal")
        return None

    def _goto_terminal(self):
        return self._terminal()

    def _show_manual(self) -> None:
        tv = self._terminal()
        if tv is not None:
            tv.run_external("man")

    def _show_saves(self) -> None:
        feat = next((f for f in self.features if f.id == "saves"), None)
        if feat is not None:
            self.select(feat)

    def _destroy_vm(self) -> None:
        tv = self._terminal()
        if tv is not None:
            tv.run_external("destroy_vm")

    def _toggle_dev(self, _event=None) -> str:
        tv = self._terminal()
        if tv is not None:
            tv.run_external("sudo dev_mode")
        return "break"

    def _on_suggestion(self, text: str) -> None:
        tv = self._terminal()
        if tv is None:
            return
        if text.endswith(" "):
            tv.insert_command(text)
        else:
            tv.run_external(text)

    # ------------------------------------------------------------------
    # Moldura
    # ------------------------------------------------------------------
    def _build_header(self) -> None:
        head = bordered_panel(self, bg=Palette.BG)
        head.pack(fill="x", padx=8, pady=(8, 4))
        tk.Label(head, text=APP_NAME.upper(), font=FONT_TITLE,
                 fg=Palette.GREEN, bg=Palette.BG).pack(side="left", padx=12, pady=8)
        self.head_info = tk.Label(head, text="", font=("Consolas", 10, "bold"),
                                  fg=Palette.GREEN_DIM, bg=Palette.BG)
        self.head_info.pack(side="right", padx=12)

    def _build_footer(self) -> None:
        bar = bordered_panel(self, bg=Palette.BG)
        bar.pack(fill="x", padx=8, pady=(4, 8))
        self.footer = tk.Label(bar, text="", font=("Consolas", 10),
                               fg=Palette.GREEN_DIM, bg=Palette.BG, anchor="w")
        self.footer.pack(fill="x", padx=12, pady=6)

    def select(self, feature: Feature) -> None:
        if self.current and self.current.id in self.views:
            self.views[self.current.id].pack_forget()
        view = self.views.get(feature.id)
        if view is None:
            view = feature.create_view(self.page_host, self.context)
            self.views[feature.id] = view
        view.pack(fill="both", expand=True)
        if hasattr(view, "refresh"):
            view.refresh()
        self.current = feature
        self.sidebar.set_active(feature.id)

    def _tick(self) -> None:
        self._refresh_chrome()
        state = self.context.state
        self.sidebar.set_suggestions(state.value, CONTEXT_COMMANDS.get(state, []))
        if self.current and self.current.id in self.views:
            view = self.views[self.current.id]
            if hasattr(view, "refresh"):
                view.refresh()

        # Destruir VM -> volta ao login
        if self.context.needs_auth and self._overlay is None:
            self.context.needs_auth = False
            self.context.username = ""
            self._auth()
        elif self._booted:
            if (self.context.time.day == 1 and not self.context.game_over
                    and not self.context.chapter_complete):
                self._end_shown = False
            if not self._end_shown and self._overlay is None:
                if self.context.game_over:
                    self._end_shown = True
                    self._show_game_over()
                elif self.context.chapter_complete:
                    self._end_shown = True
                    self._show_chapter_end()
        self.after(REFRESH_MS, self._tick)

    def _refresh_chrome(self) -> None:
        p, t, ctx = self.context.player, self.context.time, self.context
        self.head_info.config(
            text=(f"[USUÁRIO: {ctx.username or '-'}]  |  [CAPÍTULO: {ctx.chapter}]  |  "
                  f"[DIA: {t.day}]  |  [NÍVEL: {p.level}]  |  [SALDO: ₿ {p.balance:.2f}]"))
        estado = "GAME OVER" if ctx.game_over else ctx.state.value
        dev = "   [DEV]" if ctx.dev_mode else ""
        self.footer.config(
            text=(f"⚠ RASTRO (ScanSS): {p.trace:.0f}%   |   MASK: "
                  f"{'ON' if p.masked else 'OFF'}   |   ESTADO: {estado}"
                  f"   |   resta {t.fmt_duration(t.remaining_minutes)}{dev}"),
            fg=trace_color(p.trace))
