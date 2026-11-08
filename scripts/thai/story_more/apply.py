"""
Insert the extra story in days11_31.py into lib/StoryManagerTH.ts. Safe to run again: it removes
what it added before (ids containing "_x_") and inserts afresh.

  python3 scripts/thai/story_more/apply.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from story_io import load, save_th, walk
from days11_31 import MORE, ROUNDS

MID_MINUTE_2 = 420  # the second mid-shift scene; the hub plays it after the second patient at the latest
MID_MINUTE_3 = 520  # teaching rounds, after the third patient

def node(nid, speaker, text, portraits):
    n = {"id": nid, "speaker": speaker, "text": text}
    if portraits.get(speaker): n["portrait"] = portraits[speaker]
    return n

def build(day, tag, lines, portraits):
    """Lines -> nodes chained by nextId. A choice attaches to the line before it and ends the scene."""
    out, k = [], 0
    for item in lines:
        if item[0] == "choice":
            prev = out[-1]
            prev.pop("nextId", None)
            prev["choices"] = []
            for j, (label, (sp, reply)) in enumerate(item[1]):
                rid = f"d{day}_x_{tag}_r{j + 1}"
                prev["choices"].append({"text": label, "nextId": rid})
                out.append(node(rid, sp, reply, portraits))
            continue
        k += 1
        n = node(f"d{day}_x_{tag}_{k:02d}", item[0], item[1], portraits)
        if out and "choices" not in out[-1]: out[-1]["nextId"] = n["id"]
        out.append(n)
    return out

def strip_added(day):
    for part in ("startShiftEvents", "endShiftEvents"):
        lst = day.get(part) or []
        day[part] = [n for n in lst if "_x_" not in n.get("id", "")]
        for n in day[part]:
            if "_x_" in str(n.get("nextId", "")): n.pop("nextId")
    mids = day.get("midShiftEvents") or []
    if mids and "cutscene" in mids[0]:
        mids = [m for m in mids if not any("_x_" in n.get("id", "") for n in m["cutscene"])]
        day["midShiftEvents"] = mids[0]["cutscene"] if len(mids) == 1 else mids

def main():
    data = load("th")
    portraits = {}
    for d in data.values():
        for _, n in walk(d):
            if n.get("speaker") and n.get("portrait"): portraits.setdefault(n["speaker"], n["portrait"])
    added = 0
    for dnum, more in MORE.items():
        day = data[str(dnum)]
        strip_added(day)
        start, end = day["startShiftEvents"], day["endShiftEvents"]
        if more.get("pre"):
            pre = build(dnum, "pre", more["pre"], portraits)
            pre[-1]["nextId"] = start[0]["id"]
            day["startShiftEvents"] = pre + start
            added += len(pre)
        if more.get("mid"):
            mid = build(dnum, "mid", more["mid"], portraits)
            old = day.get("midShiftEvents") or []
            events = old if (old and "cutscene" in old[0]) else ([{"triggerMinute": 240, "cutscene": old}] if old else [])
            day["midShiftEvents"] = events + [{"triggerMinute": MID_MINUTE_2, "cutscene": mid}]
            added += len(mid)
        if ROUNDS.get(dnum):
            rounds = build(dnum, "rounds", ROUNDS[dnum], portraits)
            day["midShiftEvents"] = day["midShiftEvents"] + [{"triggerMinute": MID_MINUTE_3, "cutscene": rounds}]
            added += len(rounds)
        if more.get("post"):
            post = build(dnum, "post", more["post"], portraits)
            tails = [n for n in end if not n.get("nextId") and not n.get("choices")]
            if len(tails) == 1 and tails[0] is end[-1]:
                end[-1]["nextId"] = post[0]["id"]      # one straight ending: the new lines follow it
                day["endShiftEvents"] = end + post
            else:
                post[-1]["nextId"] = end[0]["id"]      # a branching ending: the new lines come before it
                day["endShiftEvents"] = post + end
            added += len(post)
    save_th(data)
    print("added", added, "lines")

if __name__ == "__main__":
    main()
