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
import re
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
        for j, a in enumerate(d.get("actions") or []):
            if isinstance(a, str) and a.strip():
                yield f"{nid}.a{j}", a, (lambda val, arr=d["actions"], jj=j: arr.__setitem__(jj, val))
        for j, (k, v) in enumerate((d.get("doseMap") or {}).items()):
            if isinstance(v, str) and v.strip():
                yield f"{nid}.m{j}", v, (lambda val, dm=d["doseMap"], kk=k: dm.__setitem__(kk, val))
        for j, o in enumerate(d.get("options") or []):
            yield from field(o, "text", f"{nid}.o{j}")
        if isinstance(nodes, dict) and isinstance(n.get("data"), dict):
            for j, x in enumerate(n["data"].get("distractors") or []):
                yield from field(x, "label", f"{nid}.d{j}")
                yield from field(x, "feedback", f"{nid}.f{j}")


# Test names stay in English, as on a Thai ward, except the few that are phrases rather than tests
NAME_TH = {
    "Previous neck ultrasounds (2, from other hospitals)": "U/S คอเดิม 2 ครั้ง จาก รพ. อื่น",
    "Executive health package, 11 weeks ago": "ผลตรวจสุขภาพผู้บริหาร เมื่อ 11 สัปดาห์ก่อน",
    "START triage distribution at 40 minutes": "ผล START triage ที่ 40 นาที",
    "Departmental capacity audit": "ทรัพยากรของแผนกตอนนี้",
    "Shared prescription monitoring record": "ประวัติการรับยาจากทุก รพ.",
    "Clinical Opiate Withdrawal Scale": "COWS (Clinical Opiate Withdrawal Scale)",
}


# Whole names that read badly after the word swaps below
NAME_TH.update({
    "Thick and thin blood smear": "Thick และ thin blood smear",
    "Complete blood count with differential": "CBC with diff",
    "Bedside FAST and transvaginal ultrasound": "FAST ข้างเตียง และ transvaginal US",
    "Bedside echocardiogram": "Echo ข้างเตียง",
    "Bedside transthoracic echocardiogram": "Echo ข้างเตียง",
    "Bedside pelvic ultrasound": "US pelvis ข้างเตียง",
    "Bedside ultrasound": "US ข้างเตียง",
    "Bedside ultrasound of the abdominal wall": "US ผนังหน้าท้องข้างเตียง",
    "Abdominal ultrasound": "US ท้อง",
    "Compression ultrasound of the right leg": "Compression US ขาขวา",
    "Abdominal X-ray": "Film ท้อง",
    "Pelvic X-ray": "Film pelvis",
    "Lumbar spine X-ray": "Film L-spine",
    "X-ray right hand and forearm": "Film มือและปลายแขนขวา",
    "Portable chest and pelvis X-ray": "CXR และ film pelvis portable",
    "CT of the leg with contrast": "CT ขาฉีดสี",
    "CT angiogram of head and neck": "CTA ศีรษะและคอ",
    "CT angiogram of the aorta": "CTA aorta",
    "CT pulmonary angiogram": "CTPA",
    "CT head, cervical spine and torso": "CT head, C-spine และลำตัว",
    "Non-contrast CT brain": "CT brain ไม่ฉีดสี",
    "CT brain (non-contrast)": "CT brain ไม่ฉีดสี",
    "CT brain (once sedated and stable)": "CT brain (หลังให้ยาและ stable)",
    "CT trauma series with contrast (after stabilisation)": "CT trauma series ฉีดสี (หลัง stable)",
    "Rectal core temperature": "อุณหภูมิทางทวาร",
    "Tympanic temperature (repeat)": "อุณหภูมิทางหู (ซ้ำ)",
    "Core (oesophageal) temperature": "Core temperature ทางหลอดอาหาร",
    "Pulse oximetry on room air": "SpO2 ที่ room air",
    "Blood bank status": "เลือดในคลัง",
    "Lumbar puncture (CSF)": "LP (CSF)",
    "Diagnostic ascitic tap": "เจาะท้องส่งตรวจ",
    "Upper GI endoscopy": "ส่องกล้อง upper GI",
    "Upper GI endoscopy assessment": "ประเมินการส่องกล้อง upper GI",
    "LRINEC score components": "ค่าที่ใช้คิด LRINEC score",
    "Rapid streptococcal antigen": "Rapid strep test",
    "Respiratory viral PCR (nasopharyngeal)": "Respiratory viral PCR (NP swab)",
    "Urine protein-creatinine ratio": "UPCR",
    "Haemoglobin and renal function": "Hb, BUN/Cr",
    "Co-oximetry (carboxyhaemoglobin)": "Co-oximetry (COHb)",
    "eFAST Ultrasound": "eFAST",
    "eFAST (bedside ultrasound)": "eFAST",
    "eFAST (index patient)": "eFAST (คนไข้รายแรก)",
    "Blood gas and lactate (index patient)": "Blood gas, lactate (คนไข้รายแรก)",
})

# Ward shorthand, applied in order
WARD = [
    (r"Complete blood count", "CBC"),
    (r"Capillary glucose", "DTX"),
    (r"Portable Chest X-ray", "CXR portable"),
    (r"Chest X-[Rr]ay", "CXR"),
    (r"12-Lead ECG", "EKG 12 lead"),
    (r"Right-sided ECG", "Right-sided EKG"),
    (r"Rhythm Strip", "Rhythm strip"),
    (r"Arterial blood gas", "ABG"),
    (r"Venous blood gas", "VBG"),
    (r"(Blood )?[Gg]roup and crossmatch", "G/M"),
    (r"Blood cultures?", "H/C"),
    (r"High sensitivity troponin T", "hs-TnT"),
    (r"^Troponin T$", "TnT"),
    (r"Creatine kinase", "CK"),
    (r"\bCreatinine\b", "Cr"),
    (r"\bcreatinine\b", "Cr"),
    (r"\b[Pp]otassium\b", "K"),
    (r"\b[Ss]odium\b", "Na"),
    (r"\b[Mm]agnesium\b", "Mg"),
    (r"Ionised calcium", "iCa"),
    (r"[Hh]aemoglobin", "Hb"),
    (r"Haematocrit", "Hct"),
    (r"[Hh]aematocrit", "Hct"),
    (r"Platelet count", "Platelet"),
    (r"\bplatelets\b", "platelet"),
    (r"White cell count", "WBC"),
    (r"White cells", "WBC"),
    (r"Liver function tests?", "LFT"),
    (r"Thyroid function", "TFT"),
    (r"Urinalysis", "UA"),
    (r"antigen", "Ag"),
    (r"\(serial\)", "(เป็นระยะ)"),
    (r"\(once sedated\)", "(หลังให้ยานอนหลับ)"),
    (r"\(room air\)| on room air", " (room air)"),
    (r"\(on 15 L/min\)", "(O2 15 L/min)"),
    (r"\(acute\)", "(ระยะเฉียบพลัน)"),
    (r"\(post decompression\)", "(หลัง decompress)"),
    (r"\(point of care\)", "(ข้างเตียง)"),
    (r",? and ", ", "),
    (r" with ", ", "),
    (r"  +", " "),
]


def thai_name(name):
    name = name.replace(" (if ordered)", "").replace(" (requested by patient)", " (คนไข้ขอ)")
    if name in NAME_TH:
        return NAME_TH[name]
    for pat, rep in WARD:
        name = re.sub(pat, rep, name)
    return name


def rekey_doses(en, out):
    """doseMap is keyed by the action text, so follow the actions into Thai."""
    def node_data(data):
        nodes = data.get("managementGraph", {}).get("nodes")
        items = nodes.items() if isinstance(nodes, dict) else [(n["id"], n) for n in nodes or []]
        return {nid: (n.get("data", n) if isinstance(nodes, list) else n) for nid, n in items}
    src, dst = node_data(en), node_data(out)
    for nid, d in dst.items():
        dm = d.get("doseMap")
        if not dm:
            continue
        names = dict(zip(src[nid].get("actions") or [], d.get("actions") or []))
        d["doseMap"] = {names.get(k, k): v for k, v in dm.items()}


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
    # Result values stay in ward English unless the txt gives a Thai one (iv.<id>)
    for inv in out.get("investigations", []) or []:
        key = f"iv.{inv.get('id')}"
        keys.add(key)
        if key in tr:
            inv["value"] = tr[key]
    extra = sorted(set(tr) - keys)
    if missing or extra:
        print(f"{case}: missing {missing} extra {extra}")
    rekey_doses(data, out)
    for inv in out.get("investigations", []) or []:
        inv["name"] = thai_name(inv.get("name", ""))
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
        data = json.loads(f.read_text())
        keys = {k for k, _, _ in slots(data)}
        optional = {f"iv.{inv.get('id')}" for inv in data.get("investigations", []) or []}
        miss, extra = keys - set(tr), set(tr) - keys - optional
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
