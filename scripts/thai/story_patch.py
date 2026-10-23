"""
Apply ward-Thai rewrites to lib/StoryManagerTH.ts.

Files in scripts/thai/story/dayNN.txt hold lines "node_id: new text" and "node_id>N: new choice text"
(N is the choice index). Lines starting with # are ignored. Text tags such as [IF_FLAG:X] must be kept.

  python3 scripts/thai/story_patch.py          # apply every day file
"""
import re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from story_io import load, save_th, walk

SRC = Path(__file__).resolve().parent / "story"
TAG = re.compile(r"\[(?:IF_FLAG|IF_NOT_FLAG|ELSE)[^\]]*\]")

def main():
    data = load("th")
    changed = 0
    for f in sorted(SRC.glob("day*.txt")):
        day = str(int(re.findall(r"\d+", f.stem)[0]))
        nodes = {n["id"]: n for _, n in walk(data[day])}
        for ln in f.read_text().splitlines():
            if not ln.strip() or ln.startswith("#"):
                continue
            key, _, text = ln.partition(": ")
            key, text = key.strip(), text.strip()
            m = re.fullmatch(r"(.+?)>(\d+)", key)
            nid, idx = (m.group(1), int(m.group(2))) if m else (key, None)
            assert nid in nodes, f"{f.name}: no node {nid}"
            node = nodes[nid]
            target = node["choices"][idx] if idx is not None else node
            old = target["text"]
            # keep flag tags exactly as they were
            if TAG.findall(old) != TAG.findall(text):
                raise SystemExit(f"{f.name} {key}: tags differ {TAG.findall(old)} vs {TAG.findall(text)}")
            if old != text:
                target["text"] = text
                changed += 1
    save_th(data)
    print("changed", changed)

if __name__ == "__main__":
    main()
