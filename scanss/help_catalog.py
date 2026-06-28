"""Catálogo de comandos para o `help` (descrição + custo de tempo).

Separado do código lógico para facilitar revisão/tradução. O `help` mostra os
comandos por categoria; os comandos de sistema ficam só no `help sys`.
"""

from __future__ import annotations

from scanss.core.textfmt import cost_tag

NAME_W = 16

# (nome exibido, minutos, descrição)
_INVASION = [
    ("scan", 30, "Rastreia a rede local em busca de IPs vulneráveis."),
    ("connect <id>", 10, "Estabelece conexão com o IP alvo especificado."),
    ("disconnect", 0, "Encerra a conexão atual e limpa os rastros locais."),
    ("mask on|off", 0, "Liga/desliga o Protocol_mask (risco/2, tempo x2)."),
]
_FILES = [
    ("ls", 5, "Lista os diretórios e arquivos da máquina alvo."),
    ("crack <arq>", 120, "Quebra a criptografia de um arquivo trancado."),
    ("download <arq>", 30, "Copia um arquivo do alvo para o seu disco."),
    ("read <arq>", 5, "Lê o conteúdo de um arquivo de texto."),
    ("extract_funds", 15, "Extrai os fundos (após baixar e ler a senha)."),
]
_UTILS = [
    ("status", 0, "Mostra nível, relógio, saldo e rastro."),
    ("targets", 0, "Relista os alvos do último scan."),
    ("tools", 0, "Lista as ferramentas instaladas."),
    ("my_pc", 0, "Volta para o seu computador (disco e saldo)."),
    ("log_eraser", 240, "Reduz o rastro do ScanSS (gasta horas, não dias)."),
    ("market", 0, "Abre o mercado negro de upgrades."),
    ("buy <n>", 0, "Compra um item do mercado negro."),
    ("sleep", 0, "Encerra o dia (vira para o dia seguinte)."),
    ("man", 0, "Abre o Manual / Regras (guia de sobrevivência)."),
]
_SYS = [
    ("save [slot]", 0, "Salva o progresso (no slot indicado)."),
    ("load [slot]", 0, "Carrega o progresso (do slot indicado)."),
    ("destroy_vm", 0, "DESTRÓI a VM: apaga conta e progresso (pede confirmação)."),
    ("clear", 0, "Limpa o terminal."),
    ("sudo dev_mode", 0, "Abre o modo desenvolvedor (oculto)."),
]


def _block(title: str, rows: list[tuple[str, int, str]]) -> list[str]:
    lines = [f"[ {title} ]"]
    for name, minutes, desc in rows:
        lines.append(f"  {name:<{NAME_W}}{cost_tag(minutes):>11} : {desc}")
    lines.append("")
    return lines


def render_help() -> list[str]:
    out: list[str] = []
    out += _block("INVASÃO & REDE", _INVASION)
    out += _block("ARQUIVOS & DADOS", _FILES)
    out += _block("UTILITÁRIOS & STATUS", _UTILS)
    out.append("(use 'man' para o manual completo e 'help sys' para administração)")
    return out


def render_help_sys() -> list[str]:
    out = _block("SISTEMA / ADMINISTRAÇÃO", _SYS)
    out.append("cuidado: 'destroy_vm' apaga a conta e todo o progresso.")
    return out
