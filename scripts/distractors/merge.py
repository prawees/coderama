#!/usr/bin/env python3
"""
Merge authored wrong options (distractors) into the English case files.

Each batch*.json (English) or th_batch*.json (Thai) maps
case id -> required node id -> [[label, feedback], ...].
The case files keep one node per line, so the field is inserted into that line
rather than re-serialising the whole file. Re-running replaces existing distractors.

Usage: python3 scripts/distractors/merge.py
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HERE = os.path.dirname(os.path.abspath(__file__))
LOCALES = os.path.join(ROOT, "public", "locales")

authored = {}
for lang, pattern in (("en", "batch*.json"), ("th", "th_batch*.json")):
    for path in sorted(glob.glob(os.path.join(HERE, pattern))):
        with open(path, encoding="utf-8") as f:
            for case_id, steps in json.load(f).items():
                if (lang, case_id) in authored:
                    sys.exit(f"{lang}/{case_id} appears in more than one batch")
                authored[(lang, case_id)] = steps

DISTRACTORS_RE = re.compile(r'"distractors": \[.*?\], (?="label")')
problems = []
changed = 0
for (lang, case_id), steps in authored.items():
    path = os.path.join(LOCALES, lang, f"{case_id}.json")
    if not os.path.exists(path):
        problems.append(f"{case_id}: no case file")
        continue
    with open(path, encoding="utf-8") as f:
        original = f.read()
    data = json.loads(original)
    graph_nodes = {n["id"]: n for n in data["managementGraph"]["nodes"]}

    # Pretty-printed files (one field per line) are re-serialised, but only if that is lossless
    pretty = original in (json.dumps(data, indent=2), json.dumps(data, indent=2, ensure_ascii=False))
    if pretty:
        ensure_ascii = original == json.dumps(data, indent=2)
        for node_id, items in steps.items():
            node = graph_nodes.get(node_id)
            if not node:
                problems.append(f"{case_id}/{node_id}: node not found")
                continue
            if node.get("type") != "required":
                problems.append(f"{case_id}/{node_id}: not a required step")
            rest = {k: v for k, v in node["data"].items() if k != "distractors"}
            node["data"] = {"distractors": [{"label": l, "feedback": fb} for l, fb in items], **rest}
        with open(path, "w", encoding="utf-8") as f:
            f.write(json.dumps(data, indent=2, ensure_ascii=ensure_ascii))
        changed += 1
        continue

    lines = original.split("\n")

    for node_id, items in steps.items():
        node = graph_nodes.get(node_id)
        if not node:
            problems.append(f"{case_id}/{node_id}: node not found")
            continue
        if node.get("type") != "required":
            problems.append(f"{case_id}/{node_id}: not a required step")
        for label, feedback in items:
            if not label.strip() or not feedback.strip():
                problems.append(f"{case_id}/{node_id}: empty label or feedback")
        payload = json.dumps([{"label": l, "feedback": fb} for l, fb in items], ensure_ascii=False)
        idx = next((i for i, ln in enumerate(lines) if f'"id": "{node_id}"' in ln and '"data": {' in ln), None)
        if idx is None:
            problems.append(f"{case_id}/{node_id}: node is not on a single line, edit by hand")
            continue
        line = DISTRACTORS_RE.sub("", lines[idx])
        lines[idx] = line.replace('"data": { ', f'"data": {{ "distractors": {payload}, ', 1)

    out = "\n".join(lines)
    json.loads(out)  # still valid JSON
    with open(path, "w", encoding="utf-8") as f:
        f.write(out)
    changed += 1

for p in problems:
    print("!", p)
print(f"merged distractors into {changed} case files, {sum(len(s) for s in authored.values())} steps")
sys.exit(1 if problems else 0)
