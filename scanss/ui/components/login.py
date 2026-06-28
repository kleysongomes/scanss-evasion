"""Tela de login/criação de conta da VM (com a regra dos 3 strikes).

Primeiro acesso: cria login e senha. Demais acessos: exige as credenciais.
Na 3ª senha errada, a VM é destruída e o jogo fecha.
"""

from __future__ import annotations

import tkinter as tk
from typing import Callable

from scanss.core.auth import AuthResult, VM_Authenticator
from scanss.core.config import FONT_MONO, FONT_SIDEBAR, FONT_TITLE, Palette


class LoginScreen(tk.Frame):
    def __init__(self, master: tk.Misc, db, on_success: Callable[[str], None],
                 on_destroyed: Callable[[], None]) -> None:
        super().__init__(master, bg=Palette.BG)
        self.auth = VM_Authenticator(db)
        self.on_success = on_success
        self.on_destroyed = on_destroyed
        self.create_mode = not self.auth.has_account()

        box = tk.Frame(self, bg=Palette.BG)
        box.place(relx=0.5, rely=0.5, anchor="center")

        self.title = tk.Label(box, font=FONT_TITLE, fg=Palette.GREEN, bg=Palette.BG)
        self.title.grid(row=0, column=0, columnspan=2, pady=(0, 4))
        self.subtitle = tk.Label(box, font=FONT_MONO, fg=Palette.GREEN_DIM, bg=Palette.BG)
        self.subtitle.grid(row=1, column=0, columnspan=2, pady=(0, 16))

        tk.Label(box, text="login:", font=FONT_MONO, fg=Palette.GREEN,
                 bg=Palette.BG).grid(row=2, column=0, sticky="e", padx=6, pady=4)
        self.user = tk.Entry(box, font=FONT_MONO, bg=Palette.BG_INPUT, fg=Palette.GREEN,
                             insertbackground=Palette.GREEN, bd=0, width=22)
        self.user.grid(row=2, column=1, sticky="w", pady=4)

        tk.Label(box, text="senha:", font=FONT_MONO, fg=Palette.GREEN,
                 bg=Palette.BG).grid(row=3, column=0, sticky="e", padx=6, pady=4)
        self.pwd = tk.Entry(box, font=FONT_MONO, bg=Palette.BG_INPUT, fg=Palette.GREEN,
                            insertbackground=Palette.GREEN, bd=0, width=22, show="*")
        self.pwd.grid(row=3, column=1, sticky="w", pady=4)
        self.pwd.bind("<Return>", lambda _e: self._submit())

        self.btn = tk.Label(box, font=FONT_SIDEBAR, fg=Palette.BG, bg=Palette.GREEN,
                            padx=12, pady=6, cursor="hand2")
        self.btn.grid(row=4, column=0, columnspan=2, pady=(14, 4))
        self.btn.bind("<Button-1>", lambda _e: self._submit())

        self.message = tk.Label(box, text="", font=FONT_MONO, fg=Palette.AMBER,
                                bg=Palette.BG)
        self.message.grid(row=5, column=0, columnspan=2, pady=(10, 0))

        self._render_mode()
        self.after(120, self.user.focus_set)

    def _render_mode(self) -> None:
        if self.create_mode:
            self.title.config(text="CRIAR CONTA DA VM")
            self.subtitle.config(text="primeiro acesso — defina seu login e senha")
            self.btn.config(text="CRIAR E ENTRAR")
            self.message.config(text="")
        else:
            self.title.config(text="ACESSO À VM")
            self.subtitle.config(text="informe suas credenciais para liberar o sistema")
            self.btn.config(text="ENTRAR")
            self.message.config(
                text=f"Atenção: na {self.auth.MAX_ATTEMPTS}ª senha errada a VM é destruída.",
                fg=Palette.AMBER)

    def _submit(self) -> None:
        user = self.user.get().strip()
        pwd = self.pwd.get()
        if not user or not pwd:
            self.message.config(text="preencha login e senha.", fg=Palette.AMBER)
            return

        if self.create_mode:
            self.auth.create(user, pwd)
            self.on_success(user)
            return

        result, remaining = self.auth.attempt(user, pwd)
        if result is AuthResult.OK:
            self.on_success(user)
        elif result is AuthResult.FAIL:
            self.pwd.delete(0, "end")
            self.message.config(
                text=f"SENHA INCORRETA. Restam {remaining} tentativa(s) "
                     f"antes de DESTRUIR a VM.", fg=Palette.RED)
        else:  # DESTROYED — a VM já foi apagada pelo authenticator
            self.message.config(text="3 SENHAS ERRADAS. DESTRUINDO A VM...",
                                fg=Palette.RED)
            self.after(1500, self.on_destroyed)
