"""VM_Authenticator — lógica de login isolada (criação, verificação, 3 strikes).

Mantém a regra das 3 tentativas fora do loop principal do jogo. Na 3ª senha
errada, destrói a VM (apaga conta e saves); quem fecha o jogo é a camada de UI.
"""

from __future__ import annotations

from enum import Enum

from scanss.core import account


class AuthResult(str, Enum):
    OK = "ok"               # login correto
    CREATED = "created"     # conta criada (primeiro acesso)
    FAIL = "fail"           # senha errada (ainda há tentativas)
    DESTROYED = "destroyed" # 3 falhas -> VM destruída


class VM_Authenticator:
    MAX_ATTEMPTS = 3

    def __init__(self, db) -> None:
        self.db = db
        self.failures = 0

    def has_account(self) -> bool:
        return account.has_account(self.db)

    def username(self) -> str | None:
        return account.account_user(self.db)

    def create(self, username: str, password: str) -> AuthResult:
        account.create_account(self.db, username, password)
        self.failures = 0
        return AuthResult.CREATED

    def attempt(self, username: str, password: str) -> tuple[AuthResult, int]:
        """Tenta autenticar. Retorna (resultado, tentativas_restantes)."""
        if account.verify(self.db, username, password):
            self.failures = 0
            return AuthResult.OK, 0
        self.failures += 1
        remaining = self.MAX_ATTEMPTS - self.failures
        if remaining <= 0:
            self.destroy()
            return AuthResult.DESTROYED, 0
        return AuthResult.FAIL, remaining

    def destroy(self) -> None:
        self.db.wipe()
