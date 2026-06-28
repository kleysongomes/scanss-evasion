"""Alvos locais e seus arquivos (Capítulo 1) + geração procedural.

Cada alvo tem arquivos. O fluxo de roubo: 'ls' -> 'crack' (desbloqueia o arquivo
de senha trancado) -> 'download' + 'read' (revela a senha) -> 'extract_funds'.
O tier do Net_Scanner amplia os fundos (alvos corporativos).
"""

from __future__ import annotations

import random
from dataclasses import dataclass, field

from scanss.core.config import Chapter1
from scanss.data.easter_eggs import EASTER_EGGS, SPAWN_RATE

# pools para gerar logins/senhas plausíveis (nada de "vitima12")
_FIRST = ["ana", "bruno", "carla", "diego", "elena", "felipe", "gustavo", "helena",
          "igor", "julia", "lucas", "marina", "nina", "otavio", "paula", "rafael",
          "sofia", "thiago", "vitor", "yara"]
_LAST = ["souza", "silva", "costa", "lima", "alves", "rocha", "melo", "dias",
         "campos", "freitas", "barros", "pinto", "moura", "teixeira"]
_PWD_WORDS = ["amor", "casa", "futebol", "praia", "cafe", "sol", "lua", "cofre",
              "gato", "rede", "banco", "viagem", "musica", "verao"]
_PWD_SYMBOLS = ["!", "@", "#", "$", "*", ""]
# contas de sistema/serviço (ex.: admin_db, root_sys)
_SYS_PREFIX = ["admin", "root", "sys", "db", "sa", "backup", "svc", "ops", "web"]
_SYS_SUFFIX = ["db", "sys", "adm", "01", "prod", "srv", "core", "net"]

_DEVICE_POOL = [
    ("roteador", ["NET_VIRTUA", "VIVO-FIBRA", "CLARO_2G", "TP-LINK_4421", "HOME_5G"]),
    ("câmera",   ["CAM-PORTÃO", "IPCAM-LOJA", "CFTV-GARAGEM"]),
    ("notebook", ["DESKTOP-K3L", "LAPTOP-ANA", "PC-CASA-02"]),
    ("celular",  ["iPhone-de-Léo", "Galaxy-J5", "Moto-G"]),
]
_CORP_POOL = [
    ("servidor", ["VSEC-NODE-07", "FINBANK-DC2", "CORP-VLAN-12", "DATACENTER-X"]),
]

# arquivos "lixo" (sem valor; só ruído realista)
_JUNK_FILES = ["fotos.zip", "ferias.mp4", "curriculo.docx", "memes.rar", "config.ini"]
_PASSWORD_FILES = ["senhas.txt", "bank_login.dat", "credenciais.kdbx", "acesso_banco.txt"]


@dataclass
class TargetFile:
    name: str
    locked: bool = False
    is_password: bool = False
    content: str = ""
    unlocked: bool = False
    downloaded: bool = False
    read: bool = False

    def status(self) -> str:
        if self.locked and not self.unlocked:
            return "[trancado]"
        tags = []
        if self.downloaded:
            tags.append("baixado")
        if self.read:
            tags.append("lido")
        return f"[{', '.join(tags)}]" if tags else "[ok]"


@dataclass
class Target:
    id: int
    name: str
    ip: str
    kind: str
    difficulty: int
    funds: int
    port: int
    files: list[TargetFile] = field(default_factory=list)
    extracted: bool = False

    def file(self, name: str) -> TargetFile | None:
        return next((f for f in self.files if f.name.lower() == name.lower()), None)

    @property
    def password_file(self) -> TargetFile | None:
        return next((f for f in self.files if f.is_password), None)

    # --- fórmulas do Capítulo 1 (a quebra usa a dificuldade) -----------
    def crack_minutes(self) -> int:
        return Chapter1.TIME_CRACK_BASE + (self.difficulty - 1) * Chapter1.TIME_CRACK_PER_DIFF

    def crack_risk(self) -> float:
        return Chapter1.RISK_CRACK_BASE + self.difficulty * Chapter1.RISK_CRACK_PER_DIFF


def _random_ip() -> str:
    return f"192.168.{random.randint(0, 4)}.{random.randint(2, 254)}"


def _gen_credentials() -> tuple[str, str]:
    """Login e senha procedurais e plausíveis (pessoa ou conta de sistema)."""
    if random.random() < 0.5:
        user = f"{random.choice(_SYS_PREFIX)}_{random.choice(_SYS_SUFFIX)}"
    else:
        user = f"{random.choice(_FIRST)}.{random.choice(_LAST)}"
    word = random.choice(_PWD_WORDS).capitalize()
    password = f"{word}{random.randint(10, 999)}{random.choice(_PWD_SYMBOLS)}"
    return user, password


def _make_files(funds: int, user: str, password: str) -> list[TargetFile]:
    pwd_name = random.choice(_PASSWORD_FILES)
    pwd = TargetFile(
        name=pwd_name, locked=True, is_password=True,
        content=(f"# {pwd_name}\nbanco: V-Sec Financial\n"
                 f"usuario: {user}\nsenha: {password}\n"
                 f"saldo_disponivel: {funds} VC"))
    files = [pwd]
    for name in random.sample(_JUNK_FILES, k=random.randint(1, 3)):
        files.append(TargetFile(name=name, content="(arquivo sem valor)"))
    random.shuffle(files)
    return files


def generate_targets(start_id: int = 1,
                     count: int = Chapter1.TARGETS_PER_SCAN,
                     tier: int = 1) -> list[Target]:
    """Gera `count` alvos com credenciais procedurais. Cada alvo tem uma chance
    baixa (SPAWN_RATE) de ser um easter egg."""
    pool = _DEVICE_POOL + (_CORP_POOL if tier >= 2 else [])
    targets: list[Target] = []
    for i in range(count):
        difficulty = random.randint(1, Chapter1.MAX_DIFFICULTY)
        base = Chapter1.FUNDS_BASE + difficulty * Chapter1.FUNDS_PER_DIFF
        funds = max(20, int((base + random.randint(-15, 30))
                            * (Chapter1.FUNDS_TIER_MULT ** (tier - 1))))

        egg = random.random() < SPAWN_RATE
        if egg:
            data = random.choice(EASTER_EGGS)
            name, kind = data["ssid"], "easter-egg"
            user, password = data["user"], data["password"]
        else:
            kind, names = random.choice(pool)
            name = random.choice(names)
            user, password = _gen_credentials()

        targets.append(Target(
            id=start_id + i,
            name=name,
            ip=_random_ip(),
            kind=kind,
            difficulty=difficulty,
            funds=funds,
            port=random.choice([22, 23, 80, 81, 554, 8080]),
            files=_make_files(funds, user, password),
        ))
    return targets
