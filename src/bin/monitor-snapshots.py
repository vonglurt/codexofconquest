#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
"""
Monitor-Snapshots  —  TUI monitor for codexofconquest snapshot archiving.
paulr@sdf.org  MIT License

Watches for new play-YYYYMMDD-HHMMSS.html files, waits until all
file handles close (lsof), shows a scrollable unified diff between
consecutive snapshots, then saves a .patch file and advances _last.html.

Patch store layout (build/milepoints/patches/):
  _base.html.gz   — first snapshot, gzip-compressed (no previous to diff)
  _last.html      — most recent snapshot, kept plain for next diff
  _last.name      — filename of _last.html (for patch headers)
  play-YYYYMMDD-HHMMSS.patch  — unified diff: prev → this

Replaces watch-snapshots.sh — don't run both at once.

  ↑ ↓          scroll diff one line
  PgUp PgDn    scroll diff one page
  q / ESC      quit
"""

import curses
import fcntl
import gzip
import os
import random
import subprocess
import tempfile
import threading
import time
from pathlib import Path

_say_proc_lock = threading.Lock()   # guards _say_proc and _say_generation
_say_proc      = None
_say_generation = 0                 # incremented on each new _say() / _stop_say()

_VOICES = [
    "Samantha", "Daniel", "Karen", "Moira", "Tessa", "Rishi", "Fred",
    "Eddy (English (US))", "Flo (English (US))", "Reed (English (US))",
    "Rocko (English (US))", "Sandy (English (US))", "Shelley (English (US))",
]
_RATE = "190"

ROOT        = Path(__file__).resolve().parent.parent.parent
_TOGGLE     = "./src/bin/wbapi-toggle.sh"
PATCHES_DIR = ROOT / "milepoints" / "patches"
SAY_LOG     = ROOT / "milepoints" / "say.log"
SERVER_LOG  = ROOT / "milepoints" / "wbapi-server.log"
SAY_LOCK_FILE = ROOT / "milepoints" / "say.lock"  # shared with sayd.sh
LAST_HTML   = PATCHES_DIR / "_last.html"
LAST_NAME_F = PATCHES_DIR / "_last.name"
GLOB        = "play-????????-??????.html"
SETTLE      = 0.0   # grace seconds after lsof shows no handles
POLL        = 0.0   # directory scan interval

_TITLE     = "Monitor-Snapshots"
_COPYRIGHT = "paulr@sdf.org MIT License"
_COPY_MED  = "paulr@sdf.org ..."


# ── file-close helpers ───────────────────────────────────────────────────────

def _lsof_open(path):
    return bool(
        subprocess.run(["lsof", "-t", str(path)], capture_output=True).stdout.strip()
    )

def wait_closed(path, timeout=30):
    """Poll lsof until no handles, then settle and re-verify."""
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if not _lsof_open(path):
            return True
        time.sleep(0.05)
    return False


# ── diff helper ──────────────────────────────────────────────────────────────

def unified_diff(prev_text, prev_label, new_path, new_label, context=2):
    """Write prev_text to a temp file, diff against new_path via diff(1).
    Returns list of lines (no newlines). diff exits 1 when files differ — that's normal."""
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".html", delete=False, encoding="utf-8", errors="replace"
    ) as tmp:
        tmp.write(prev_text)
        tmp_path = tmp.name
    try:
        r = subprocess.run(
            ["diff", f"-U{context}",
             "--label", prev_label,
             "--label", new_label,
             tmp_path, str(new_path)],
            capture_output=True, text=True, errors="replace",
        )
        return r.stdout.splitlines()
    finally:
        os.unlink(tmp_path)


# ── text-to-speech helpers ───────────────────────────────────────────────────

def _stop_say():
    """Kill any in-progress say; cancel any thread waiting for the lock."""
    global _say_proc, _say_generation
    with _say_proc_lock:
        _say_generation += 1
        if _say_proc and _say_proc.poll() is None:
            _say_proc.terminate()
        _say_proc = None

def _say_worker(filtered, gen):
    """Wait for the cross-process voice lock, then speak (unless superseded)."""
    global _say_proc
    proc = None
    SAY_LOCK_FILE.parent.mkdir(parents=True, exist_ok=True)
    try:
        with open(SAY_LOCK_FILE, "w") as lf:
            fcntl.flock(lf, fcntl.LOCK_EX)          # block until sayd.sh is silent
            with _say_proc_lock:
                if _say_generation != gen:           # superseded while waiting
                    return
                proc = subprocess.Popen(["say", "-v", random.choice(_VOICES), "-r", _RATE, filtered])
                _say_proc = proc
            proc.wait()                              # hold lock for full utterance
    except Exception:
        pass
    finally:
        with _say_proc_lock:
            if _say_proc is proc:
                _say_proc = None

def _say(line):
    """Strip leading +, filter code symbols via sed, speak with say."""
    global _say_generation, _say_proc
    text = line.lstrip("+").strip()
    try:
        result = subprocess.run(
            ["sed", "s/[](){}[`$.]//g"],
            input=text, capture_output=True, text=True,
        )
        filtered = result.stdout.strip()
    except OSError:
        filtered = text
    if not filtered:
        return
    with _say_proc_lock:
        _say_generation += 1
        gen = _say_generation
        if _say_proc and _say_proc.poll() is None:
            _say_proc.terminate()
        _say_proc = None
    threading.Thread(target=_say_worker, args=(filtered, gen), daemon=True).start()


# ── server launcher ──────────────────────────────────────────────────────────

_SERVER_PORT = 1367


def _server_pid():
    """Return PID of the process listening on port 1367, or None."""
    out = subprocess.run(
        ["lsof", "-ti", f"tcp:{_SERVER_PORT}"], capture_output=True
    ).stdout.strip()
    if not out:
        return None
    try:
        return int(out.split()[0])
    except (ValueError, IndexError):
        return None


_last_spawn_time = 0.0   # shared cooldown — prevents double-spawn during startup
_SPAWN_GRACE     = 15.0  # seconds to wait after a spawn (210 MB file takes ~10 s)


def _find_terminal():
    """Return (kind, path) for the best available terminal emulator.
    Preference: Ghostty → Kitty → Alacritty → Terminal.app (fallback).
    Returns kind in {'ghostty', 'kitty', 'alacritty', 'terminal'}.
    """
    candidates = [
        ("ghostty",   ["/Applications/Ghostty.app/Contents/MacOS/ghostty",
                       "/usr/local/bin/ghostty", "/opt/homebrew/bin/ghostty"]),
        ("kitty",     ["/Applications/kitty.app/Contents/MacOS/kitty",
                       "/usr/local/bin/kitty", "/opt/homebrew/bin/kitty"]),
        ("alacritty", ["/Applications/Alacritty.app/Contents/MacOS/alacritty",
                       "/usr/local/bin/alacritty", "/opt/homebrew/bin/alacritty"]),
    ]
    for kind, paths in candidates:
        for path in paths:
            if os.path.isfile(path) and os.access(path, os.X_OK):
                return kind, path
        # also try PATH lookup
        result = subprocess.run(["which", kind], capture_output=True, text=True)
        if result.returncode == 0:
            return kind, result.stdout.strip()
    return "terminal", None


def _spawn_server_window():
    """Open a new terminal window running the server.
    Prefers Ghostty → Kitty → Alacritty → Terminal.app."""
    global _last_spawn_time
    _last_spawn_time = time.time()
    root = str(ROOT)
    # WBAPI_MANAGED_BY_MONITOR=1 tells wbapi-toggle.sh that this instance is
    # legitimately spawned by monitor-snapshots.py and should proceed normally,
    # even though monitor-snapshots.py is running. Without this flag, wbapi-toggle
    # would detect monitor-snapshots.py and exit to avoid a management conflict.
    #
    # Exit code contract (from wbapi-toggle.sh _run_once):
    #   0  — clean shutdown (POST /api/restart or port-in-use) — do NOT loop
    #   1  — crash / error                                     — loop: retry after 2 s
    #   127 — the launcher itself is missing: retrying cannot fix it, so stop and say so
    cmd = (
        f"cd {root} && "
        f"export WBAPI_MANAGED_BY_MONITOR=1 && "
        f"LAUNCH={_TOGGLE}; "
        f"if [ ! -x \"$LAUNCH\" ]; then "
        f"  echo '[launcher missing: '$LAUNCH' — nothing to restart]'; exec bash; "
        f"fi; "
        f"while true; do "
        f"  \"$LAUNCH\" fg; EXIT=$?; "
        f"  [ $EXIT -eq 0 ] && break; "
        f"  [ $EXIT -eq 127 ] && {{ echo '[launcher not runnable (127) — not retrying]'; break; }}; "
        f"  echo '[server crashed (exit '$EXIT') — restarting in 2 s…]'; sleep 2; "
        f"done"
    )

    kind, path = _find_terminal()

    if kind == "ghostty":
        subprocess.Popen([path, "-e", "bash", "-c", cmd])
    elif kind == "kitty":
        subprocess.Popen([path, "bash", "-c", cmd])
    elif kind == "alacritty":
        subprocess.Popen([path, "-e", "bash", "-c", cmd])
    else:
        # fallback: macOS Terminal via osascript
        # cmd must be shell-escaped for the AppleScript string literal
        escaped = cmd.replace("\\", "\\\\").replace('"', '\\"')
        script = (
            f'tell application "Terminal"\n'
            f'  do script "{escaped}"\n'
            f'  activate\n'
            f'end tell'
        )
        subprocess.Popen(["osascript", "-e", script])


_MANUAL_CMD = f"cd {ROOT}  &&  {_TOGGLE} fg"


def _set_trace_mode():
    """Tell the server to enable trace+debug mode via POST /api/mode."""
    try:
        subprocess.run(
            ["curl", "-s", "--max-time", "3", "-X", "POST",
             f"http://localhost:{_SERVER_PORT}/api/mode",
             "-H", "Content-Type: application/json",
             "-d", '{"mode":"trace"}'],
            capture_output=True, timeout=4,
        )
    except Exception:
        pass


def _ensure_server():
    """If server not running, spawn it in a new Terminal window.
    Polls for up to 8 s; if it never appears, prints instructions and
    continues (the TUI will show server DOWN — start the server manually
    and the keepalive will detect it)."""
    if _server_pid():
        _set_trace_mode()
        return
    _spawn_server_window()
    deadline = time.time() + _SPAWN_GRACE
    while time.time() < deadline:
        time.sleep(0.5)
        if _server_pid():
            _set_trace_mode()
            return
    # Server didn't appear — osascript probably needs Automation permission
    print()
    print("  ⚠  Server did not start automatically.")
    print()
    print("  macOS Automation permission may not be granted yet.")
    print("  The permission dialog appears the first time osascript runs.")
    print("  If nothing appeared, go to:")
    print("    System Settings → Privacy & Security → Automation")
    print("    Enable Terminal (or Python) to control Terminal.")
    print()
    print("  Or start the server manually in a new Terminal tab/window:")
    print(f"    {_MANUAL_CMD}")
    print()
    print("  Then re-run this script.  (Starting TUI now — server shows as DOWN)")
    print()


# ── monitor ──────────────────────────────────────────────────────────────────

class Monitor:
    def __init__(self):
        self.t0     = time.monotonic()
        self.lk     = threading.Lock()
        self.alive  = True

        # state shared with worker (guarded by self.lk)
        self.count         = 0
        self.status        = "scanning…"
        self.plbl          = ""
        self.clbl          = ""
        self.dlines        = []
        self.scroll        = 0
        self._prev         = ""    # text of last archived file (for diff input)
        self.flash_pending = False
        self.srv_pid       = _server_pid()
        self.srv_msg       = ""   # transient server action message

        # row → diff-line-index map; built each draw, only used on main thread
        self._row_map = {}

        # byte offsets — track lines already appended to prior patches
        self._say_log_pos    = SAY_LOG.stat().st_size    if SAY_LOG.exists()    else 0
        self._server_log_pos = SERVER_LOG.stat().st_size if SERVER_LOG.exists() else 0

        # resume from last session if patches dir has state
        if LAST_HTML.exists():
            try:
                self._prev = LAST_HTML.read_text(encoding="utf-8", errors="replace")
                self.clbl  = LAST_NAME_F.read_text(encoding="utf-8").strip() \
                             if LAST_NAME_F.exists() else "_last.html"
                self.status = f"resumed: {self.clbl}"
            except OSError:
                pass

    # ── worker ───────────────────────────────────────────────────────────────

    def _work(self):
        seen = set()
        while self.alive:
            for f in sorted(ROOT.glob(GLOB)):
                if f.name not in seen:
                    seen.add(f.name)
                    self._handle(f)
            time.sleep(0.05)

    # ── server keep-alive ────────────────────────────────────────────────────

    def _keepalive(self):
        """Poll port 1367 every 3 s; respawn server Terminal if it goes dark.
        Respects _last_spawn_time cooldown so we never spawn during the ~15 s
        startup window. After 2 failed spawns, stops and shows manual hint."""
        spawns = 0
        while self.alive:
            # Honour the shared spawn cooldown (startup loads 210 MB)
            grace_left = _SPAWN_GRACE - (time.time() - _last_spawn_time)
            if grace_left > 0:
                time.sleep(min(grace_left, 2))
                continue

            pid = _server_pid()
            with self.lk:
                self.srv_pid = pid
                if not pid:
                    self.srv_msg = ("respawning…" if spawns < 2
                                    else f"DOWN — run: {_TOGGLE} fg")
            if not pid:
                if spawns < 2:
                    _spawn_server_window()
                    spawns += 1
                    # grace period will be respected on next loop iteration
                else:
                    time.sleep(5)
            else:
                if spawns > 0:
                    # Server just came back up after a respawn — set trace mode
                    _set_trace_mode()
                spawns = 0
                with self.lk:
                    if self.srv_msg in ("respawning…", ""):
                        self.srv_msg = ""
                time.sleep(3)

    def _do_kill(self):
        pid = _server_pid()
        if pid:
            subprocess.run(["kill", str(pid)], capture_output=True)
            with self.lk:
                self.srv_msg = f"killed {pid}"
        else:
            with self.lk:
                self.srv_msg = "not running"

    def _do_restart(self):
        """Prefer curl /api/restart (exit 67 → wbapi-toggle loop relaunches).
        Falls back to kill if the server is not responding."""
        try:
            r = subprocess.run(
                ["curl", "-s", "--max-time", "3", "-X", "POST",
                 f"http://localhost:{_SERVER_PORT}/api/restart"],
                capture_output=True, text=True, timeout=4,
            )
            if r.returncode == 0:
                with self.lk:
                    self.srv_msg = "↺ restart via API"
                return
        except Exception:
            pass
        self._do_kill()
        with self.lk:
            self.srv_msg = "↺ killed — keepalive will respawn"

    def _handle(self, f):
        if not f.exists():
            return

        with self.lk:
            self.status = f"handles?  {f.name}"

        if not wait_closed(f):
            with self.lk:
                self.status = "watching…"
            return

        try:
            text = f.read_text(encoding="utf-8", errors="replace")
        except OSError:
            with self.lk:
                self.status = "watching…"
            return

        with self.lk:
            prev, plbl = self._prev, self.clbl
            self.status = f"patching  {f.name}"

        diff = unified_diff(prev, plbl, f, f.name) if prev else []

        # write to patch store
        PATCHES_DIR.mkdir(parents=True, exist_ok=True)
        if prev:
            patch_path = PATCHES_DIR / (f.stem + ".patch")
            patch_path.write_text("\n".join(diff) + "\n", encoding="utf-8")
            # collect say.log and server log lines written since the last patch
            say_lines = []
            if SAY_LOG.exists():
                try:
                    with SAY_LOG.open("r", encoding="utf-8", errors="replace") as sf:
                        sf.seek(self._say_log_pos)
                        say_lines = sf.readlines()
                        self._say_log_pos = sf.tell()
                except OSError:
                    pass
            server_lines = []
            if SERVER_LOG.exists():
                try:
                    with SERVER_LOG.open("r", encoding="utf-8", errors="replace") as sl:
                        sl.seek(self._server_log_pos)
                        server_lines = sl.readlines()
                        self._server_log_pos = sl.tell()
                except OSError:
                    pass
            if say_lines or server_lines:
                sidecar = PATCHES_DIR / (f.stem + ".patch.log")
                sidecar.write_text("".join(say_lines + server_lines), encoding="utf-8")
            # truncate both logs now that their contents are captured
            for log_path in (SAY_LOG, SERVER_LOG):
                try:
                    log_path.write_text("", encoding="utf-8")
                except OSError:
                    pass
            self._say_log_pos = 0
            self._server_log_pos = 0
        else:
            # first ever file: save as gzip base, no diff to store
            base_path = PATCHES_DIR / "_base.html.gz"
            base_path.write_bytes(gzip.compress(text.encode("utf-8", errors="replace"), compresslevel=9))

        # advance _last: keep the new content for the next diff
        LAST_HTML.write_text(text, encoding="utf-8", errors="replace")
        LAST_NAME_F.write_text(f.name, encoding="utf-8")

        f.unlink()

        with self.lk:
            self._prev         = text
            self.plbl          = plbl
            self.clbl          = f.name
            self.dlines        = diff
            self.scroll        = 0
            self.count        += 1
            self.status        = "watching…"
            self.flash_pending = True

    # ── drawing ──────────────────────────────────────────────────────────────

    def _hms(self):
        s = int(time.monotonic() - self.t0)
        return f"{s//3600:02d}:{s%3600//60:02d}:{s%60:02d}"

    def draw(self, scr):
        with self.lk:
            h, w      = scr.getmaxyx()
            hms       = self._hms()
            count     = self.count
            status    = self.status
            plbl      = self.plbl
            clbl      = self.clbl
            dl        = self.dlines
            sc        = self.scroll
            srv_pid   = self.srv_pid
            srv_msg   = self.srv_msg

        P = curses.color_pair
        scr.erase()

        def put(row, col, text, attr=0):
            if row >= h:
                return
            try:
                scr.addstr(row, col, text[: w - col], attr)
            except curses.error:
                pass

        def put_wrapped(row, text, attr=0):
            """Render text with line wrap; returns number of display rows used."""
            # first line: full width
            # continuation lines: indented 2 spaces to show they're wrapped
            col0, col1 = 0, 2
            used = 0
            first = True
            while text:
                col = col0 if first else col1
                avail = w - col
                chunk, text = text[:avail], text[avail:]
                put(row + used, col, chunk, attr)
                used += 1
                first = False
                if row + used >= h - 1:
                    break
            return used

        row = 0

        # title bar: "Monitor-Snapshots" left, copyright right-aligned
        left_t = f" {_TITLE} "
        avail_r = w - len(left_t)
        if avail_r >= len(_COPYRIGHT) + 2:
            right_t = (" " + _COPYRIGHT + " ").rjust(avail_r)
        elif avail_r >= len(_COPY_MED) + 2:
            right_t = (" " + _COPY_MED + " ").rjust(avail_r)
        elif avail_r >= 5:
            right_t = " ... ".rjust(avail_r)
        else:
            right_t = ""
        title_line = (left_t + right_t)[:w].ljust(w)[:w]
        put(row, 0, title_line, P(1) | curses.A_BOLD)
        row += 1

        # info bar
        hdr = f" ⏱ {hms}   {count} patched   {status}"
        put(row, 0, hdr.ljust(w), P(1))
        row += 1

        # server status bar
        if srv_pid:
            srv_text = f" ● server pid {srv_pid}"
            if srv_msg:
                srv_text += f"  {srv_msg}"
            srv_attr = P(3)   # green
        else:
            srv_text = f" ○ server DOWN" + (f"  {srv_msg}" if srv_msg else "")
            srv_attr = P(4)   # red
        put(row, 0, srv_text.ljust(w)[:w], srv_attr)
        row += 1

        # file label pair
        if clbl:
            put(row, 0, f" ← {plbl or '(base)'}", P(4))
            row += 1
            put(row, 0, f" → {clbl}", P(3))
            row += 1

        # separator
        put(row, 0, "─" * w, P(2))
        row += 1

        # diff pane — wrapped rendering; build display-row → diff-index map
        drow = row
        row_map = {}
        shown = 0
        for i, line in enumerate(dl[sc:]):
            if drow >= h - 1:
                break
            if line.startswith("+") and not line.startswith("+++"):
                attr = P(3)
            elif line.startswith("-") and not line.startswith("---"):
                attr = P(4)
            elif line.startswith("@@"):
                attr = P(5)
            elif line.startswith("+++") or line.startswith("---"):
                attr = P(2)
            else:
                attr = 0
            start_drow = drow
            drow += put_wrapped(drow, " " + line, attr)
            for r in range(start_drow, drow):
                row_map[r] = sc + i
            shown += 1

        self._row_map = row_map

        # footer
        if dl:
            hi   = sc + shown
            foot = f" ↑↓ · PgUp/Dn · r restart · k kill · dbl-click read · q quit    {sc+1}–{hi}/{len(dl)} lines"
        else:
            foot = " ↑↓ · PgUp/Dn · r restart · k kill · dbl-click read · q quit"
        put(h - 1, 0, foot[:w], P(2))

        scr.refresh()

    # ── main curses loop ─────────────────────────────────────────────────────

    def _scroll(self, delta, total):
        with self.lk:
            self.scroll = max(0, min(self.scroll + delta, max(0, total - 1)))

    def run(self, scr):
        curses.curs_set(0)
        curses.start_color()
        curses.use_default_colors()
        curses.init_pair(1, curses.COLOR_BLACK,  curses.COLOR_CYAN)
        curses.init_pair(2, curses.COLOR_CYAN,   -1)
        curses.init_pair(3, curses.COLOR_GREEN,  -1)
        curses.init_pair(4, curses.COLOR_RED,    -1)
        curses.init_pair(5, curses.COLOR_YELLOW, -1)

        curses.mousemask(curses.ALL_MOUSE_EVENTS | curses.REPORT_MOUSE_POSITION)
        curses.mouseinterval(200)

        scr.nodelay(True)
        scr.timeout(100)

        threading.Thread(target=self._work,      daemon=True).start()
        threading.Thread(target=self._keepalive, daemon=True).start()

        while self.alive:
            k = scr.getch()
            if k in (ord("q"), ord("Q"), 27):
                # Graceful: ask server to restart (no force kill — let it finish)
                subprocess.Popen(
                    ["curl", "-s", "--max-time", "3", "-X", "POST",
                     f"http://localhost:{_SERVER_PORT}/api/restart"],
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                )
                self.alive = False
                break

            with self.lk:
                n             = len(self.dlines)
                h, _          = scr.getmaxyx()
                fp            = self.flash_pending
                if fp:
                    self.flash_pending = False
            page = max(1, h - 8)

            if   k == curses.KEY_DOWN:   self._scroll(1,    n)
            elif k == curses.KEY_UP:     self._scroll(-1,   n)
            elif k == curses.KEY_NPAGE:  self._scroll(page, n)
            elif k == curses.KEY_PPAGE:  self._scroll(-page, n)
            elif k in (ord("k"), ord("K")):
                threading.Thread(target=self._do_kill,    daemon=True).start()
            elif k in (ord("r"), ord("R")):
                threading.Thread(target=self._do_restart, daemon=True).start()
            elif k == curses.KEY_MOUSE:
                try:
                    _, _mx, my, _, bstate = curses.getmouse()
                    if bstate & curses.BUTTON1_DOUBLE_CLICKED:
                        with self.lk:
                            dl = self.dlines
                        # find display rows that map to green (+) lines
                        green_rows = [r for r, i in self._row_map.items()
                                      if i < len(dl)
                                      and dl[i].startswith("+")
                                      and not dl[i].startswith("+++")]
                        if green_rows:
                            closest = min(green_rows, key=lambda r: abs(r - my))
                            line = dl[self._row_map[closest]]
                            threading.Thread(target=_say, args=(line,), daemon=True).start()
                    elif bstate & curses.BUTTON1_CLICKED:
                        _stop_say()
                except curses.error:
                    pass

            if fp:
                try:
                    curses.beep()
                except curses.error:
                    pass
                try:
                    curses.flash()
                except curses.error:
                    pass

            self.draw(scr)


if __name__ == "__main__":
    _ensure_server()
    curses.wrapper(Monitor().run)
