"""View do terminal: área de saída (Text) + linha de comando (Entry).

É o coração jogável: aceita comandos digitados, delega ao GameEngine e imprime
o resultado com cores por tipo de mensagem.
"""

from __future__ import annotations

import os
import tkinter as tk

from scanss import APP_NAME
from scanss.core.config import FONT_MONO, Palette
from scanss.core.context import GameContext
from scanss.core.engine import GameEngine

PROMPT_HOST = "darknet"


class TerminalView(tk.Frame):
    def __init__(self, master: tk.Misc, context: GameContext) -> None:
        super().__init__(master, bg=Palette.BG)
        self.context = context
        self.engine = GameEngine(context)
        self.history: list[str] = []
        self.hist_index = 0

        self.output = tk.Text(self, bg=Palette.BG, fg=Palette.GREEN,
                              insertbackground=Palette.GREEN, font=FONT_MONO,
                              bd=0, padx=12, pady=10, wrap="word", state="disabled")
        self.output.pack(fill="both", expand=True)
        self.output.tag_config("sys", foreground=Palette.GREEN_DIM)
        self.output.tag_config("warn", foreground=Palette.AMBER)
        self.output.tag_config("danger", foreground=Palette.RED)
        self.output.tag_config("prompt", foreground=Palette.CYAN)

        row = tk.Frame(self, bg=Palette.BG)
        row.pack(fill="x", side="bottom")
        tk.Label(row, text=self._prompt(), font=FONT_MONO,
                 fg=Palette.GREEN_BRIGHT, bg=Palette.BG).pack(side="left", padx=(12, 4), pady=8)
        self.entry = tk.Entry(row, bg=Palette.BG_INPUT, fg=Palette.GREEN,
                              insertbackground=Palette.GREEN, font=FONT_MONO,
                              bd=0, relief="flat")
        self.entry.pack(side="left", fill="x", expand=True, padx=(0, 12), pady=8)
        self.entry.bind("<Return>", self._on_enter)
        self.entry.bind("<Up>", self._hist_prev)
        self.entry.bind("<Down>", self._hist_next)
        self.entry.bind("<Tab>", self._autocomplete)

        self._banner()
        self.after(100, self.entry.focus_set)

    def _prompt(self) -> str:
        return f"{self.context.player.handle}@{PROMPT_HOST}:~$"

    # --- saída ---------------------------------------------------------
    def write(self, text: str, tag: str | None = None) -> None:
        self.output.config(state="normal")
        self.output.insert("end", text + "\n", tag or ())
        self.output.see("end")
        self.output.config(state="disabled")

    def _banner(self) -> None:
        self.write(f"Bem-vindo ao {APP_NAME}", "sys")
        self.write("A V-Sec está de olho. Digite 'help' para ver os comandos.", "sys")
        self.write("")

    def reset(self) -> None:
        """Limpa o terminal e reimprime o banner (usado ao reiniciar o jogo)."""
        self.output.config(state="normal")
        self.output.delete("1.0", "end")
        self.output.config(state="disabled")
        self.history.clear()
        self.hist_index = 0
        self._banner()

    # --- entrada -------------------------------------------------------
    def _on_enter(self, _event=None) -> None:
        raw = self.entry.get().strip()
        self.entry.delete(0, "end")
        if not raw:
            return
        self.history.append(raw)
        self.hist_index = len(self.history)
        self.write(f"{self._prompt()} {raw}", "prompt")
        self._dispatch(raw)

    def _autocomplete(self, _event=None) -> str:
        """TAB completa o nome do comando (primeiro token)."""
        text = self.entry.get()
        if not text or " " in text:
            return "break"
        matches = [c for c in self.engine.command_names() if c.startswith(text)]
        if len(matches) == 1:
            self.insert_command(matches[0] + " ")
        elif len(matches) > 1:
            prefix = os.path.commonprefix(matches)
            if len(prefix) > len(text):
                self.insert_command(prefix)
            self.write("  ".join(matches), "sys")
        return "break"

    def insert_command(self, text: str) -> None:
        """Coloca um comando na linha de entrada (usado pelo painel de sugestões)."""
        self.entry.delete(0, "end")
        self.entry.insert(0, text)
        self.entry.icursor("end")
        self.entry.focus_set()

    def run_external(self, raw: str) -> None:
        """Executa um comando como se tivesse sido digitado (usado por atalhos)."""
        self.write(f"{self._prompt()} {raw}", "prompt")
        self._dispatch(raw)

    def _dispatch(self, raw: str) -> None:
        for line in self.engine.run(raw):
            if line == "__CLEAR__":
                self.output.config(state="normal")
                self.output.delete("1.0", "end")
                self.output.config(state="disabled")
                continue
            self.write(line, self._classify(line))
        self.write("")

    @staticmethod
    def _classify(line: str) -> str | None:
        low = line.lower()
        if "scanss acionado" in low or line.startswith("!!"):
            return "danger"
        if "rastro" in low or "offline" in low or line.startswith("   -"):
            return "warn"
        return None

    # --- histórico (setas) --------------------------------------------
    def _hist_prev(self, _event=None) -> str:
        if self.history and self.hist_index > 0:
            self.hist_index -= 1
            self.entry.delete(0, "end")
            self.entry.insert(0, self.history[self.hist_index])
        return "break"

    def _hist_next(self, _event=None) -> str:
        if self.hist_index < len(self.history) - 1:
            self.hist_index += 1
            self.entry.delete(0, "end")
            self.entry.insert(0, self.history[self.hist_index])
        else:
            self.hist_index = len(self.history)
            self.entry.delete(0, "end")
        return "break"
