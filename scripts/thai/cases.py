"""
Ward-Thai case files.

The English case in public/locales/en is the clinical source. A Thai case is that file with
the reading text replaced: history, teaching labels, wrong-answer feedback, lab comments,
dose notes and outcome narratives. Physical exam findings, lab names and values stay in
English, the way a Thai case report is written. Orders on buttons are Thai with English terms.

  python3 scripts/thai/cases.py show case_12     # list strings with keys
  python3 scripts/thai/cases.py build case_12    # write th/case_12.json from scripts/thai/cases/case_12.txt
  python3 scripts/thai/cases.py build all
  python3 scripts/thai/cases.py check            # report cases with missing or stale keys

Translation files hold one "key: text" per line. Lines starting with # are ignored.
"""
import copy
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EN = ROOT / "public" / "locales" / "en"
TH = ROOT / "public" / "locales" / "th"
SRC = Path(__file__).resolve().parent / "cases"


def slots(data):
    """Yield (key, getter, setter, english) for every string that should be in Thai."""
    def field(obj, k, key):
        if isinstance(obj.get(k), str) and obj[k].strip():
            yield key, obj[k], (lambda v, o=obj, kk=k: o.__setitem__(kk, v))

    yield from field(data, "chiefComplaint", "cc")
    yield from field(data, "background", "bg")
    for inv in data.get("investigations", []) or []:
        yield from field(inv, "report", f"i.{inv.get('id')}")

    nodes = data.get("managementGraph", {}).get("nodes")
    items = nodes.items() if isinstance(nodes, dict) else [(n["id"], n) for n in nodes or []]
    for nid, n in items:
        d = n.get("data", n) if isinstance(nodes, list) else n
        if d.get("label") != "Start":
            yield from field(d, "label", f"{nid}.l")
        yield from field(d, "choice", f"{nid}.c")
        yield from field(d, "narrative", f"{nid}.n")
        for j, x in enumerate(d.get("distractors") or []):
            yield from field(x, "label", f"{nid}.d{j}")
            yield from field(x, "feedback", f"{nid}.f{j}")
        for j, (k, v) in enumerate((d.get("doseMap") or {}).items()):
            if isinstance(v, str) and v.strip():
                yield f"{nid}.m{j}", v, (lambda val, dm=d["doseMap"], kk=k: dm.__setitem__(kk, val))
        for j, o in enumerate(d.get("options") or []):
            yield from field(o, "text", f"{nid}.o{j}")
        if isinstance(nodes, dict) and isinstance(n.get("data"), dict):
            for j, x in enumerate(n["data"].get("distractors") or []):
                yield from field(x, "label", f"{nid}.d{j}")
                yield from field(x, "feedback", f"{nid}.f{j}")


def load_src(case):
    f = SRC / f"{case}.txt"
    if not f.exists():
        return None
    out = {}
    for ln in f.read_text().splitlines():
        if not ln.strip() or ln.lstrip().startswith("#"):
            continue
        k, _, v = ln.partition(": ")
        out[k.strip()] = v.strip()
    return out


def show(case):
    data = json.loads((EN / f"{case}.json").read_text())
    for key, en, _ in slots(data):
        print(f"{key}: {en}")


def build(case):
    data = json.loads((EN / f"{case}.json").read_text())
    tr = load_src(case)
    if tr is None:
        print(f"skip {case}: no translation file")
        return False
    out = copy.deepcopy(data)
    keys = set()
    missing = []
    for key, en, setter in slots(out):
        keys.add(key)
        if key in tr:
            setter(tr[key])
        else:
            missing.append(key)
    extra = sorted(set(tr) - keys)
    if missing or extra:
        print(f"{case}: missing {missing} extra {extra}")
    TH.mkdir(parents=True, exist_ok=True)
    (TH / f"{case}.json").write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
    return not missing and not extra


def check():
    for f in sorted(EN.glob("case_*.json")):
        case = f.stem
        tr = load_src(case)
        if tr is None:
            print(f"{case}: no translation")
            continue
        keys = {k for k, _, _ in slots(json.loads(f.read_text()))}
        miss, extra = keys - set(tr), set(tr) - keys
        if miss or extra:
            print(f"{case}: missing {sorted(miss)} extra {sorted(extra)}")


if __name__ == "__main__":
    cmd, *rest = sys.argv[1:]
    if cmd == "show":
        show(rest[0])
    elif cmd == "build":
        targets = [p.stem for p in sorted(SRC.glob("case_*.txt"))] if rest[0] == "all" else rest
        ok = all([build(c) for c in targets])
        sys.exit(0 if ok else 1)
    elif cmd == "check":
        check()
