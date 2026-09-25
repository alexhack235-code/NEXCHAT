#!/usr/bin/env python3
"""
Validate a JSON file and print detailed parse errors.
Usage: python scripts/validate_json.py path/to/file.json
"""
import json
import sys


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/validate_json.py path/to/file.json")
        sys.exit(2)
    path = sys.argv[1]
    try:
        with open(path, 'r', encoding='utf-8') as f:
            json.load(f)
        print(f"OK: {path} is valid JSON")
    except Exception as e:
        print(f"ERROR: failed to parse {path}")
        print(repr(e))
        # Try to show a bit of context if possible
        try:
            msg = str(e)
            # look for position info like line X column Y
            import re
            m = re.search(r'line (\d+) column (\d+)', msg)
            if m:
                line = int(m.group(1))
                col = int(m.group(2))
                with open(path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                start = max(0, line-3)
                end = min(len(lines), line+2)
                print('\nContext around error:')
                for i in range(start, end):
                    prefix = '>' if i == line-1 else ' '
                    print(f"{prefix} {i+1}: {lines[i].rstrip()}")
        except Exception:
            pass


if __name__ == '__main__':
    main()
