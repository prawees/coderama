"""Replace whole lines in scripts/thai/story/dayNN.txt by node id, then run story_patch.py. Usage: python3 rewrite.py"""
import re, sys, glob
from pathlib import Path
STORY = Path(__file__).resolve().parents[1] / "story"

def apply(new):
    left = dict(new)
    for f in sorted(STORY.glob("day*.txt")):
        lines = f.read_text().splitlines()
        changed = False
        for i, ln in enumerate(lines):
            key, sep, _ = ln.partition(": ")
            if sep and key.strip() in left:
                lines[i] = f"{key.strip()}: {left.pop(key.strip())}"
                changed = True
        if changed: f.write_text("\n".join(lines) + "\n")
    if left: raise SystemExit(f"not found: {list(left)}")
