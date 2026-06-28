"""Tela de narração em tela cheia com efeito 'máquina de escrever'.

Usada nas introduções/encerramentos dos capítulos. Em GUI não usamos
time.sleep (travaria a janela); o efeito é feito com `after()`, imprimindo
caractere a caractere. Uma tecla durante a digitação revela o texto inteiro.
"""

from __future__ import annotations

import tkinter as tk
from typing import Callable, Optional

from scanss.core.config import FONT_MONO, Palette


class NarrationScreen(tk.Frame):
    def __init__(self, master: tk.Misc, text: str, *,
                 on_done: Optional[Callable[[], None]] = None,
                 choices: Optional[dict[str, Callable[[], None]]] = None,
                 cps: int = 50) -> None:
        super().__init__(master, bg=Palette.BG)
        self._full = text
        self._on_done = on_done
        self._choices = {k.lower(): v for k, v in (choices or {}).items()}
        self._pos = 0
        self._typing = True
        self._delay = max(1, int(1000 / max(1, cps)))

        self.box = tk.Text(self, bg=Palette.BG, fg=Palette.GREEN, font=FONT_MONO,
                           bd=0, padx=48, pady=36, wrap="word", insertwidth=0,
                           highlightthickness=0)
        self.box.pack(fill="both", expand=True)
        self.box.config(state="disabled")

        self.hint = tk.Label(self, text="", font=("Consolas", 9),
                             fg=Palette.GREEN_DIM, bg=Palette.BG)
        self.hint.pack(side="bottom", anchor="e", padx=20, pady=8)

        self.bind_all("<Key>", self._on_key)
        self.after(250, self._tick)

    # --- digitação -----------------------------------------------------
    def _tick(self) -> None:
        if self._pos >= len(self._full):
            self._finish_typing()
            return
        ch = self._full[self._pos]
        self._pos += 1
        self._append(ch)
        self.after(self._delay * (3 if ch == "\n" else 1), self._tick)

    def _append(self, s: str) -> None:
        self.box.config(state="normal")
        self.box.insert("end", s)
        self.box.see("end")
        self.box.config(state="disabled")

    def _reveal_all(self) -> None:
        self.box.config(state="normal")
        self.box.delete("1.0", "end")
        self.box.insert("end", self._full)
        self.box.config(state="disabled")
        self._pos = len(self._full)
        self._finish_typing()

    def _finish_typing(self) -> None:
        if not self._typing:
            return
        self._typing = False
        self.hint.config(text="[S/N]" if self._choices else "[ENTER]")

    # --- teclado -------------------------------------------------------
    def _on_key(self, event: tk.Event) -> None:
        if self._typing:
            self._reveal_all()
            return
        char = (event.char or "").lower()
        key = event.keysym.lower()
        if self._choices:
            cb = self._choices.get(char) or self._choices.get(key)
            if cb:
                self._close()
                cb()
        elif self._on_done and key in ("return", "kp_enter", "space"):
            self._close()
            self._on_done()

    def _close(self) -> None:
        self.unbind_all("<Key>")
