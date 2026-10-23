"""
Adds `choice`, the plain action shown on the button, to correct steps whose full label
explains why the step is right or is much longer than the wrong options.
Run from the repo root: python3 scripts/clinical/merge_choices.py
"""
import json
from pathlib import Path

ROOT = Path("public/locales")
spec = json.loads(Path("scripts/clinical/choices.json").read_text())
done = 0
for case, steps in spec.items():
    for li, lang in enumerate(("en", "th")):
        path = ROOT / lang / f"{case}.json"
        if not path.exists():
            continue
        text = path.read_text()
        data = json.loads(text)
        pretty_ascii = text.rstrip("\n") == json.dumps(data, indent=2)
        pretty_utf8 = text.rstrip("\n") == json.dumps(data, indent=2, ensure_ascii=False)
        nodes = {n["id"]: n for n in data["managementGraph"]["nodes"]}
        lines = text.split("\n")
        for nid, labels in steps.items():
            if li >= len(labels):
                continue
            choice = labels[li]
            n = nodes[nid]
            assert n["type"] == "required", f"{case}/{nid}"
            if n["data"].get("choice") == choice:
                continue
            if pretty_ascii or pretty_utf8:
                n["data"] = {"choice": choice, **{k: v for k, v in n["data"].items() if k != "choice"}}
            else:
                idx = next(i for i, ln in enumerate(lines) if f'"id": "{nid}"' in ln and '"data": {' in ln)
                assert '"choice"' not in lines[idx], f"{case}/{nid} already has a choice"
                lines[idx] = lines[idx].replace('"data": {', '"data": { "choice": ' + json.dumps(choice, ensure_ascii=False) + ",", 1)
            done += 1
        if pretty_ascii or pretty_utf8:
            out = json.dumps(data, indent=2, ensure_ascii=pretty_ascii) + ("\n" if text.endswith("\n") else "")
        else:
            out = "\n".join(lines)
        json.loads(out)
        path.write_text(out)
print("choices added:", done)
