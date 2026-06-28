"""Testes do núcleo do Capítulo 1: tempo, estados, fluxo de roubo e persistência.

Rodar:  pytest
Não exige UI: usa só core/.
"""

from __future__ import annotations

from scanss.core.config import Chapter1
from scanss.core.context import GameContext
from scanss.core.manager import GameManager
from scanss.core.models import Software, ToolKind
from scanss.core.states import PlayerState
from scanss.core.targets import Target, TargetFile


def _ctx() -> GameContext:
    return GameContext.new_game()


def _target_with_pwd(tid: int = 1, difficulty: int = 1, funds: int = 200) -> Target:
    pwd = TargetFile(name="senhas.txt", locked=True, is_password=True,
                     content="banco: V-Sec\nsenha: Cofre123!")
    junk = TargetFile(name="fotos.zip", content="(lixo)")
    return Target(id=tid, name="ALVO", ip="192.168.0.2", kind="roteador",
                  difficulty=difficulty, funds=funds, port=80, files=[pwd, junk])


# --- fórmulas / mask -------------------------------------------------------
def test_crack_time_and_risk_formula():
    t = _target_with_pwd(difficulty=3)
    assert t.crack_minutes() == Chapter1.TIME_CRACK_BASE + 2 * Chapter1.TIME_CRACK_PER_DIFF
    assert t.crack_risk() == Chapter1.RISK_CRACK_BASE + 3 * Chapter1.RISK_CRACK_PER_DIFF


def test_mask_doubles_time_and_halves_risk():
    plain = _ctx()
    GameManager(plain).scan()
    masked = _ctx()
    masked.player.tools[ToolKind.MASK] = Software(
        ToolKind.MASK, "Protocol_mask", "v1.0", price=0,
        time_factor=2.0, risk_factor=0.5, owned=True)
    masked.player.masked = True
    GameManager(masked).scan()
    # com mask: dobra o tempo gasto e reduz o rastro pela metade
    assert (Chapter1.USEFUL_MINUTES - masked.time.remaining_minutes
            == 2 * (Chapter1.USEFUL_MINUTES - plain.time.remaining_minutes))
    assert masked.player.trace == plain.player.trace / 2


# --- máquina de estados / fluxo de roubo -----------------------------------
def test_state_transitions():
    ctx = _ctx()
    ctx.targets = [_target_with_pwd()]
    mgr = GameManager(ctx)
    assert ctx.state is PlayerState.OFFLINE
    mgr.connect(1)
    assert ctx.state is PlayerState.CONNECTED
    mgr.ls()
    assert ctx.state is PlayerState.DIR_VIEW
    mgr.disconnect()
    assert ctx.state is PlayerState.OFFLINE


def test_full_theft_flow_extracts_funds():
    ctx = _ctx()
    ctx.targets = [_target_with_pwd(funds=300)]
    mgr = GameManager(ctx)
    mgr.connect(1)
    mgr.ls()
    mgr.crack("senhas.txt")
    mgr.download("senhas.txt")
    mgr.read("senhas.txt")
    saldo = ctx.player.balance
    mgr.extract_funds()
    assert ctx.player.balance == saldo + 300
    assert ctx.stats.successful_invasions == 1
    assert len(ctx.player.disk) == 1


def test_extract_blocked_without_download_and_read():
    ctx = _ctx()
    ctx.targets = [_target_with_pwd(funds=300)]
    mgr = GameManager(ctx)
    mgr.connect(1)
    mgr.ls()
    mgr.crack("senhas.txt")
    saldo = ctx.player.balance
    out = mgr.extract_funds()              # sem download/read
    assert any("acesso negado" in line for line in out)
    assert ctx.player.balance == saldo


def test_crack_required_before_download():
    ctx = _ctx()
    ctx.targets = [_target_with_pwd()]
    mgr = GameManager(ctx)
    mgr.connect(1)
    mgr.ls()
    out = mgr.download("senhas.txt")       # arquivo ainda trancado
    assert any("trancado" in line for line in out)


def test_insufficient_time_blocks_scan():
    ctx = _ctx()
    ctx.time.minute_of_day = Chapter1.DAY_END_MIN - 10   # restam 10 min
    out = GameManager(ctx).scan()
    assert any("tempo insuficiente" in line for line in out)


# --- ScanSS / economia -----------------------------------------------------
def test_scanss_catch_ends_day_and_fines():
    ctx = _ctx()
    ctx.player.trace = 99.0
    ctx.player.day_loot = 50
    saldo = ctx.player.balance
    out = GameManager(ctx).scan()
    assert any("ScanSS ACIONADO" in line for line in out)
    assert ctx.stats.times_caught == 1
    assert ctx.player.trace == 0.0
    assert ctx.time.day == 2
    assert ctx.player.balance == saldo - 50 - Chapter1.SCANSS_FINE - Chapter1.DAILY_DEBT


def test_daily_debt_causes_bankruptcy():
    ctx = _ctx()
    mgr = GameManager(ctx)
    for _ in range(6):
        if ctx.game_over:
            break
        mgr.sleep()
    assert ctx.game_over is True


def test_chapter_complete_after_surviving_week():
    ctx = _ctx()
    ctx.player.balance = 100_000
    mgr = GameManager(ctx)
    for _ in range(Chapter1.SURVIVE_DAYS):
        mgr.sleep()
    assert ctx.chapter_complete is True
    assert ctx.game_over is False


# --- Log_Eraser / progressão -----------------------------------------------
def test_log_eraser_reduces_trace_and_spends_hours():
    ctx = _ctx()
    ctx.player.trace = 50.0
    before = ctx.time.remaining_minutes
    GameManager(ctx).log_eraser()
    assert ctx.player.trace == 50.0 - Chapter1.ERASER_REDUCTION
    assert ctx.time.remaining_minutes == before - Chapter1.TIME_ERASER


def test_level_up_from_extraction_xp():
    ctx = _ctx()
    mgr = GameManager(ctx)
    mgr._apply_xp(Chapter1.XP_THRESHOLDS[1])   # XP exato para o nível 2
    assert ctx.player.level == 2


# --- modo dev --------------------------------------------------------------
def test_dev_commands():
    ctx = _ctx()
    mgr = GameManager(ctx)
    mgr.dev_set_balance(9999)
    mgr.dev_set_trace(150)        # deve travar em 100
    mgr.dev_set_chapter(3)
    assert ctx.player.balance == 9999
    assert ctx.player.trace == Chapter1.TRACE_MAX
    assert ctx.chapter == 3


# --- ajuda / trava de confirmação ------------------------------------------
def test_help_hides_system_commands():
    from scanss.core.engine import GameEngine
    eng = GameEngine(_ctx())
    principal = " ".join(eng.run("help"))
    assert "save" not in principal and "clear" not in principal
    sistema = " ".join(eng.run("help sys"))
    assert "save" in sistema and "destroy_vm" in sistema


def test_destroy_vm_requires_exact_confirmation():
    from scanss.core.engine import GameEngine
    ctx = _ctx()
    ctx.player.balance = 9999
    eng = GameEngine(ctx)

    out = eng.run("destroy_vm")
    assert any("ALERTA" in line for line in out)
    assert ctx.player.balance == 9999          # ainda não destruiu

    eng.run("N")                                # cancela
    assert ctx.player.balance == 9999

    eng.run("destroy_vm")
    eng.run("CONFIRMAR")                        # palavra exata executa
    assert ctx.player.balance == Chapter1.STARTING_BALANCE
    assert ctx.needs_auth is True


def test_command_by_id():
    ctx = _ctx()
    t = Target(id=1, name="ALVO", ip="192.168.0.2", kind="roteador",
               difficulty=1, funds=300,
               files=[TargetFile(name="senhas.txt", locked=True, is_password=True,
                                 content="senha: X")], port=80)
    ctx.targets = [t]
    mgr = GameManager(ctx)
    mgr.connect(1)
    mgr.ls()
    mgr.crack("1")              # por ID
    mgr.download("1")
    mgr.read("1")
    saldo = ctx.player.balance
    mgr.extract_funds()
    assert ctx.player.balance == saldo + 300


# --- persistência ----------------------------------------------------------
def test_save_load_roundtrip(tmp_path):
    from scanss.core.savegame import apply, serialize
    from scanss.core.storage import Database

    db = Database(tmp_path / "t.db")
    ctx = _ctx()
    ctx.player.balance = 777
    ctx.player.disk.append({"name": "senhas.txt", "content": "x", "source": "ALVO"})
    ctx.time.day = 4
    db.save_game(1, serialize(ctx))

    fresh = _ctx()
    apply(fresh, db.load_game(1))
    assert fresh.player.balance == 777
    assert fresh.time.day == 4
    assert len(fresh.player.disk) == 1
    assert fresh.player.has(ToolKind.SCANNER)
    db.close()


def test_settings_persist(tmp_path):
    from scanss.core.storage import Database
    db = Database(tmp_path / "s.db")
    db.set_setting("typewriter_cps", 80)
    assert db.get_setting("typewriter_cps", 50) == 80
    db.close()


def test_market_line_format():
    from scanss.core.engine import GameEngine
    out = GameEngine(_ctx()).run("market")
    item = next(l for l in out if l.startswith("[1]"))
    assert " - " in item and " : " in item and "₿" in item


def test_authenticator_three_strikes(tmp_path):
    from scanss.core import account
    from scanss.core.auth import AuthResult, VM_Authenticator
    from scanss.core.storage import Database
    db = Database(tmp_path / "auth.db")
    auth = VM_Authenticator(db)
    auth.create("neo", "matrix")
    assert auth.attempt("neo", "x")[0] is AuthResult.FAIL
    assert auth.attempt("neo", "x")[0] is AuthResult.FAIL
    assert auth.attempt("neo", "x")[0] is AuthResult.DESTROYED
    assert not account.has_account(db)        # VM destruída no 3º erro
    assert auth.attempt("neo", "matrix")[0] is not AuthResult.OK
    db.close()


def test_account_hash_and_verify(tmp_path):
    from scanss.core import account
    from scanss.core.storage import Database
    db = Database(tmp_path / "a.db")
    assert not account.has_account(db)
    account.create_account(db, "neo", "matrix")
    assert account.has_account(db)
    assert account.verify(db, "neo", "matrix")
    assert not account.verify(db, "neo", "errado")
    assert db.get_setting("account_pwhash") != "matrix"   # não é texto puro
    db.close()


def test_save_slots_and_buy(tmp_path):
    from scanss.core.storage import Database
    ctx = _ctx()
    ctx.db = Database(tmp_path / "slots.db")
    ctx.player.balance = 1000
    mgr = GameManager(ctx)
    assert ctx.db.slot_count() == 2          # 2 grátis
    mgr.buy_slot()
    assert ctx.db.slot_count() == 3
    assert ctx.player.balance == 1000 - Chapter1.SAVE_SLOT_PRICE
    mgr.save(2)
    assert 2 in ctx.db.list_saves()
    ctx.db.close()
