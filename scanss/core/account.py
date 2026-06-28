"""Conta da VM (login/senha) com armazenamento seguro.

A senha NUNCA é gravada em texto puro: guardamos um hash SHA-256 com salt,
codificado em base64, no banco local. Assim o jogador não burla o login só
lendo o arquivo de save no PC real.
"""

from __future__ import annotations

import base64
import hashlib
import os

_USER = "account_user"
_HASH = "account_pwhash"
_SALT = "account_salt"


def _hash(password: str, salt: str) -> str:
    digest = hashlib.sha256((salt + password).encode("utf-8")).digest()
    return base64.b64encode(digest).decode("ascii")


def has_account(db) -> bool:
    return db.get_setting(_USER) is not None


def account_user(db) -> str | None:
    return db.get_setting(_USER)


def create_account(db, user: str, password: str) -> None:
    salt = base64.b64encode(os.urandom(8)).decode("ascii")
    db.set_setting(_SALT, salt)
    db.set_setting(_USER, user)
    db.set_setting(_HASH, _hash(password, salt))


def verify(db, user: str, password: str) -> bool:
    if db.get_setting(_USER) != user:
        return False
    salt = db.get_setting(_SALT, "")
    return db.get_setting(_HASH) == _hash(password, salt)
