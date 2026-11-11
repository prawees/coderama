"""Read and write the story scripts as Python data. The Thai file is JSON after the type header."""
import json, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TH = ROOT / "lib" / "StoryManagerTH.ts"
_HEAD_MARK = "> = {"

def load(lang):
    if lang == "th":
        s = TH.read_text()
        i = s.index(_HEAD_MARK) + len(_HEAD_MARK) - 1
        return json.loads(s[i:].rstrip().rstrip(";"))
    out = subprocess.run(["npx", "--yes", "tsx", "-e",
        'import { STORY_CAMPAIGN } from "./lib/StoryManager"; console.log(JSON.stringify(STORY_CAMPAIGN));'],
        cwd=ROOT, capture_output=True, text=True, check=True).stdout
    return json.loads(out)

def save_th(data):
    s = TH.read_text()
    i = s.index(_HEAD_MARK) + len(_HEAD_MARK) - 1
    TH.write_text(s[:i] + json.dumps(data, indent=2, ensure_ascii=False) + ";\n")

def walk(day):
    """Every node of a day, in order, across all parts (mid-shift events flattened)."""
    for part in ["startOfDayCutscene", "startShiftEvents", "midShiftEvents", "endOfDayCutscene", "endShiftEvents"]:
        for n in day.get(part) or []:
            if isinstance(n, dict) and "cutscene" in n:
                for m in n["cutscene"]:
                    yield part, m
            else:
                yield part, n
