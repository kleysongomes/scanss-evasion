"""Sidebar de navegação + painel contextual de sugestões.

Em cima: navegação por feature. No meio: sugestões de comando que mudam conforme
o estado do jogador (com o custo de tempo alinhado à direita). Embaixo: ações
(reiniciar). A própria visibilidade da barra é controlada pelo MainWindow (TAB).
"""

from __future__ import annotations

import tkinter as tk
from typing import Callable

from scanss.core.config import FONT_MONO_SMALL, FONT_SIDEBAR, Palette
from scanss.core.feature import Feature
from scanss.core.textfmt import cost_line

SUGGESTION_WIDTH = 26


class Sidebar(tk.Frame):
    def __init__(self, master: tk.Misc, features: list[Feature],
                 on_select: Callable[[Feature], None],
                 on_suggestion: Callable[[str], None],
                 actions: list[tuple[str, Callable[[], None]]] | None = None,
                 menu_actions: list[tuple[str, Callable[[], None]]] | None = None) -> None:
        super().__init__(master, bg=Palette.BG_PANEL, width=230,
                         highlightbackground=Palette.BORDER, highlightthickness=1)
        self.pack_propagate(False)
        self.on_select = on_select
        self.on_suggestion = on_suggestion
        self.buttons: dict[str, tk.Label] = {}
        self.active_id: str | None = None

        tk.Label(self, text="// MENU", font=FONT_SIDEBAR, fg=Palette.AMBER,
                 bg=Palette.BG_PANEL).pack(anchor="w", padx=12, pady=(12, 6))
        for feature in features:
            self._build_button(feature)
        for label, callback in (menu_actions or []):
            self._build_menu_action(label, callback)

        # painel contextual de sugestões
        self._sugg_title = tk.Label(self, text="// SUGESTÕES", font=FONT_SIDEBAR,
                                    fg=Palette.AMBER, bg=Palette.BG_PANEL)
        self._sugg_title.pack(anchor="w", padx=12, pady=(14, 2))
        self._sugg_frame = tk.Frame(self, bg=Palette.BG_PANEL)
        self._sugg_frame.pack(fill="x", padx=4)

        for label, callback in (actions or []):
            self._build_action(label, callback)

    # --- navegação -----------------------------------------------------
    def _build_button(self, feature: Feature) -> None:
        btn = tk.Label(self, text=f"{feature.icon} {feature.title}", font=FONT_SIDEBAR,
                       fg=Palette.GREEN, bg=Palette.BG_PANEL, anchor="w",
                       padx=12, pady=8, cursor="hand2")
        btn.pack(fill="x")
        btn.bind("<Button-1>", lambda _e, f=feature: self.on_select(f))
        btn.bind("<Enter>", lambda _e, fid=feature.id: self._hover(fid, True))
        btn.bind("<Leave>", lambda _e, fid=feature.id: self._hover(fid, False))
        self.buttons[feature.id] = btn

    def _build_menu_action(self, label: str, callback: Callable[[], None]) -> None:
        btn = tk.Label(self, text=label, font=FONT_SIDEBAR, fg=Palette.CYAN,
                       bg=Palette.BG_PANEL, anchor="w", padx=12, pady=8, cursor="hand2")
        btn.pack(fill="x")
        btn.bind("<Button-1>", lambda _e: callback())
        btn.bind("<Enter>", lambda _e: btn.config(fg=Palette.GREEN_BRIGHT, bg=Palette.BG_INPUT))
        btn.bind("<Leave>", lambda _e: btn.config(fg=Palette.CYAN, bg=Palette.BG_PANEL))

    def _hover(self, fid: str, entering: bool) -> None:
        if fid == self.active_id:
            return
        self.buttons[fid].config(
            fg=Palette.GREEN_BRIGHT if entering else Palette.GREEN,
            bg=Palette.BG_INPUT if entering else Palette.BG_PANEL)

    def set_active(self, fid: str) -> None:
        self.active_id = fid
        for bid, btn in self.buttons.items():
            on = bid == fid
            btn.config(fg=Palette.BG if on else Palette.GREEN,
                       bg=Palette.GREEN if on else Palette.BG_PANEL)

    # --- ações ---------------------------------------------------------
    def _build_action(self, label: str, callback: Callable[[], None]) -> None:
        tk.Frame(self, bg=Palette.GREEN_DIM, height=1).pack(fill="x", padx=12, pady=(8, 4),
                                                            side="bottom")
        btn = tk.Label(self, text=label, font=FONT_SIDEBAR, fg=Palette.AMBER,
                       bg=Palette.BG_PANEL, anchor="w", padx=12, pady=8, cursor="hand2")
        btn.pack(fill="x", side="bottom")
        btn.bind("<Button-1>", lambda _e: callback())
        btn.bind("<Enter>", lambda _e: btn.config(fg=Palette.RED, bg=Palette.BG_INPUT))
        btn.bind("<Leave>", lambda _e: btn.config(fg=Palette.AMBER, bg=Palette.BG_PANEL))

    # --- sugestões contextuais -----------------------------------------
    def set_suggestions(self, state_label: str,
                        items: list[tuple[str, str, "int | None"]]) -> None:
        self._sugg_title.config(text=f"// SUGESTÕES ({state_label})")
        for child in self._sugg_frame.winfo_children():
            child.destroy()
        for insert_text, display, minutes in items:
            text = cost_line(display, minutes, width=SUGGESTION_WIDTH)
            lbl = tk.Label(self._sugg_frame, text=text, font=FONT_MONO_SMALL,
                           fg=Palette.GREEN, bg=Palette.BG_PANEL, anchor="w",
                           padx=10, pady=2, cursor="hand2")
            lbl.pack(fill="x")
            lbl.bind("<Button-1>", lambda _e, t=insert_text: self.on_suggestion(t))
            lbl.bind("<Enter>", lambda _e, w=lbl: w.config(fg=Palette.GREEN_BRIGHT))
            lbl.bind("<Leave>", lambda _e, w=lbl: w.config(fg=Palette.GREEN))
