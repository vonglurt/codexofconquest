#!/usr/bin/env python3
"""Simple Wikisource text extractor using MediaWiki API."""
import sys
import urllib.request
import urllib.parse
import json

def fetch_wikisource_text(title):
    """Fetch full page text from Wikisource."""
    api_url = "https://en.wikisource.org/w/api.php"
    params = {
        'action': 'query',
        'titles': title,
        'prop': 'extracts',
        'explaintext': True,
        'format': 'json'
    }

    url = api_url + '?' + urllib.parse.urlencode(params)
    try:
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read())
            pages = data['query']['pages']
            for page_id, page in pages.items():
                if 'extract' in page:
                    return page['extract']
            return None
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return None

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <title> <output_file>")
        sys.exit(1)

    title = sys.argv[1]
    output_file = sys.argv[2]

    text = fetch_wikisource_text(title)
    if text:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Fetched {len(text)} characters → {output_file}")
    else:
        print(f"Failed to fetch '{title}'", file=sys.stderr)
        sys.exit(1)
