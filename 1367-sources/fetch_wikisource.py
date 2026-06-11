#!/usr/bin/env python3
"""
Fetch a Wikisource book by requesting chapter pages via the MediaWiki parse API
(action=parse) which handles transclusion, then strip HTML to plain text.

Usage:
  python3 fetch_wikisource.py <TITLE_PREFIX> <NUM_CHAPTERS> <OUTPUT_FILE> [intro_title]

Examples:
  python3 fetch_wikisource.py "The_Story_of_Egil_Skallagrimsson" 92 RIX-egil-saga.txt
  python3 fetch_wikisource.py "The_Man_in_the_Panther%27s_Skin" 47 TBS-knight-panther-skin.txt
"""

import sys
import time
import json
import re
import urllib.request
import urllib.parse
from html.parser import HTMLParser

API = "https://en.wikisource.org/w/api.php"

class TextExtractor(HTMLParser):
    """Strip HTML tags, keeping block-level breaks as paragraph separators."""
    SKIP_TAGS = {"script", "style", "sup", "nav", "table", "td", "th"}
    BLOCK_TAGS = {"p", "div", "h1", "h2", "h3", "h4", "br", "li", "tr"}

    def __init__(self):
        super().__init__()
        self.text = []
        self._skip = 0
        self._pending_newline = False

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP_TAGS:
            self._skip += 1
        if self._skip:
            return
        if tag in self.BLOCK_TAGS:
            self._pending_newline = True

    def handle_endtag(self, tag):
        if tag in self.SKIP_TAGS:
            self._skip = max(0, self._skip - 1)
        if tag in self.BLOCK_TAGS:
            self._pending_newline = True

    def handle_data(self, data):
        if self._skip:
            return
        stripped = data  # keep whitespace for now
        if stripped:
            if self._pending_newline:
                self.text.append("\n\n")
                self._pending_newline = False
            self.text.append(stripped)

    def get_text(self):
        raw = "".join(self.text)
        # collapse runs of blank lines
        raw = re.sub(r'\n{3,}', '\n\n', raw)
        return raw.strip()


def parse_page(title):
    """Return plain text of a Wikisource page using action=parse. Retries on 429."""
    params = {
        "action": "parse",
        "page": title,
        "prop": "text",
        "disablelimitreport": "1",
        "format": "json",
    }
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "wikisource-fetch/1.0"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            break
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 30 * (2 ** attempt)
                print(f"  429 rate limit — sleeping {wait}s before retry...")
                time.sleep(wait)
                continue
            return None, f"HTTP {e.code}"
        except Exception as e:
            return None, str(e)
    else:
        return None, "rate limited after retries"

    if "error" in data:
        return None, data["error"].get("info", "unknown error")

    html = data.get("parse", {}).get("text", {}).get("*", "")
    if not html:
        return None, "no text returned"

    parser = TextExtractor()
    parser.feed(html)
    return parser.get_text(), None


def main():
    if len(sys.argv) < 4:
        print("Usage: fetch_wikisource.py <TITLE_PREFIX> <NUM_CHAPTERS> <OUTPUT_FILE>")
        sys.exit(1)

    prefix = sys.argv[1]
    num_chapters = int(sys.argv[2])
    outfile = sys.argv[3]

    titles = []
    # Try Introduction
    titles.append((f"{prefix}/Introduction", "Introduction"))
    for i in range(1, num_chapters + 1):
        titles.append((f"{prefix}/Chapter_{i}", f"Chapter {i}"))

    print(f"Fetching {len(titles)} pages for '{prefix}' → {outfile}")

    parts = []
    for page_title, label in titles:
        text, err = parse_page(page_title)
        if err:
            print(f"  SKIP {label}: {err}")
        elif text:
            parts.append(f"\n\n{'='*60}\n{label}\n{'='*60}\n\n{text}")
            print(f"  OK   {label} ({len(text)} chars)")
        else:
            print(f"  EMPTY {label}")
        time.sleep(1.0)

    combined = f"Source: {prefix} (Wikisource)\n" + "".join(parts)

    with open(outfile, "w", encoding="utf-8") as f:
        f.write(combined)

    size = len(combined.encode("utf-8"))
    print(f"\nDone: {outfile} ({size:,} bytes, {len(parts)} sections)")

if __name__ == "__main__":
    main()
