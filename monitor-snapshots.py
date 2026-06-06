#!/usr/bin/env python3
"""
Monitor-Snapshots  —  TUI monitor for roll2hit snapshot archiving.
PaulRicheson@Roll2hit.com  MIT License

Watches for new roll2hit-v3-YYYYMMDD-HHMMSS.html files, waits until all
file handles close (lsof), shows a scrollable unified diff between
consecutive snapshots, then saves a .patch file and advances _last.html.

Patch store layout (milepoints/patches/):
  _base.html.gz   — first snapshot, gzip-compressed (no previous to diff)
  _last.html      — most recent snapshot, kept plain for next diff
  _last.name      — filename of _last.html (for patch headers)
  roll2hit-v3-YYYYMMDD-HHMMSS.patch  — unified diff: prev → this

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

ROOT        = Path(__file__).resolve().parent
PATCHES_DIR = ROOT / "milepoints" / "patches"
SAY_LOG     = ROOT / "milepoints" / "say.log"
SERVER_LOG  = ROOT / "milepoints" / "wbapi-server.log"
SAY_LOCK_FILE = ROOT / "milepoints" / "say.lock"  # shared with sayd.sh
LAST_HTML   = PATCHES_DIR / "_last.html"
LAST_NAME_F = PATCHES_DIR / "_last.name"
GLOB        = "roll2hit-v3-????????-??????.html"
SETTLE      = 2.0   # grace seconds after lsof shows no handles
POLL        = 0.8   # directory scan interval

_TITLE     = "Monitor-Snapshots"
_COPYRIGHT = "PaulRicheson@Roll2hit.com MIT License"
_COPY_MED  = "PaulRicheson@Roll2hit.com ..."


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
            time.sleep(SETTLE)
            return not _lsof_open(path)
        time.sleep(0.5)
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
            time.sleep(POLL)

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
            h, w   = scr.getmaxyx()
            hms    = self._hms()
            count  = self.count
            status = self.status
            plbl   = self.plbl
            clbl   = self.clbl
            dl     = self.dlines
            sc     = self.scroll

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
            foot = f" ↑↓ · PgUp/Dn · dbl-click read · click stop · q quit    {sc+1}–{hi}/{len(dl)} lines"
        else:
            foot = " ↑↓ · PgUp/Dn · dbl-click read · click stop · q quit"
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

        threading.Thread(target=self._work, daemon=True).start()

        while self.alive:
            k = scr.getch()
            if k in (ord("q"), ord("Q"), 27):
                self.alive = False
                break

            with self.lk:
                n             = len(self.dlines)
                h, _          = scr.getmaxyx()
                fp            = self.flash_pending
                if fp:
                    self.flash_pending = False
            page = max(1, h - 7)

            if   k == curses.KEY_DOWN:   self._scroll(1,    n)
            elif k == curses.KEY_UP:     self._scroll(-1,   n)
            elif k == curses.KEY_NPAGE:  self._scroll(page, n)
            elif k == curses.KEY_PPAGE:  self._scroll(-page, n)
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
    curses.wrapper(Monitor().run)
