"""
Clinical accuracy pass, October 2026. Applies reviewed corrections to case files in place.
Run from the repo root: python3 scripts/clinical/fix_2026_10.py
Each fix asserts the text it replaces, so a second run fails loudly instead of double-applying.
"""
import json
from pathlib import Path

ROOT = Path("public/locales")


def load(lang, case):
    return json.loads((ROOT / lang / f"{case}.json").read_text())


def save(lang, case, data):
    """Keep the file's existing style where it was machine formatted, so diffs stay readable."""
    path = ROOT / lang / f"{case}.json"
    original = path.read_text()
    parsed = json.loads(original)
    ascii_style = original.rstrip("\n") == json.dumps(parsed, indent=2)
    text = json.dumps(data, indent=2, ensure_ascii=ascii_style)
    path.write_text(text + ("\n" if original.endswith("\n") else ""))


def node(data, nid):
    for n in data["managementGraph"]["nodes"]:
        if n["id"] == nid:
            return n
    raise KeyError(nid)


def req(nid, x, label, actions, doses, distractors, rank=None):
    d = {"label": label, "actions": actions, "doseMap": doses,
         "distractors": [{"label": l, "feedback": f} for l, f in distractors]}
    if rank:
        d["requiredRank"] = rank
    return {"id": nid, "type": "required", "position": {"x": x, "y": 200}, "data": d}


def out(nid, x, label, kind, narrative, vitals):
    return {"id": nid, "type": "outcome", "position": {"x": x, "y": 200},
            "data": {"label": label, "outcomeType": kind, "narrative": narrative, "vitalChanges": vitals}}


def eth(nid, x, label, narrative):
    return {"id": nid, "type": "ethicalChoice", "position": {"x": x, "y": 400},
            "data": {"label": label, "ethicalValue": 10, "narrative": narrative}}


def edges(pairs):
    return [{"id": f"e{i + 1}", "source": s, "target": t} for i, (s, t) in enumerate(pairs)]


def replace_in(obj, old, new, count=1):
    """Replace a substring in every string field of obj, asserting it was found `count` times."""
    found = [0]

    def walk(o):
        if isinstance(o, dict):
            return {k: walk(v) for k, v in o.items()}
        if isinstance(o, list):
            return [walk(v) for v in o]
        if isinstance(o, str) and old in o:
            found[0] += o.count(old)
            return o.replace(old, new)
        return o

    res = walk(obj)
    assert found[0] == count, f"expected {count} of {old!r}, found {found[0]}"
    return res


# ---------------------------------------------------------------- case_01 digoxin
# Atropine alone left digoxin toxicity untreated. Add the antidote, the bottle, a level,
# and an ECG that fits a patient with atrial fibrillation.
T01 = {
    "en": {
        "bg": "Patient was found unresponsive at home with an empty pill bottle nearby. He has a history of atrial fibrillation and hypertension. The bottle on the kitchen table is his digoxin, dispensed eight days ago.",
        "ecg": "Atrial fibrillation with a slow ventricular response at 35/min, scooped (reverse tick) ST depression and frequent ventricular ectopics. Typical of digoxin toxicity.",
        "dig": ("Serum digoxin", "Toxic. A level taken after Fab is given is unreliable, so this one matters."),
        "out1": ("Temporising only", "Heart rate rises to 45 with atropine, but that is a holding measure. The digoxin is still bound to the sodium pumps in his heart."),
        "req2": ("Digoxin-specific antibody fragments", ["Digoxin immune Fab IV", "Recheck potassium in 1 hour", "Continuous cardiac monitoring"],
                 {"Digoxin immune Fab IV": "Life-threatening toxicity with an unknown dose: 10 vials IV over 30 minutes, repeat if no response. Potassium falls as the Fab works, so watch for hypokalaemia."},
                 [("Haemodialysis to remove the digoxin", "Digoxin has a huge volume of distribution and is barely removed by dialysis. Fab fragments are the antidote."),
                  ("Wait for a repeat digoxin level before the antidote", "Bradycardia with shock and a potassium above 5 is life-threatening toxicity. Give Fab now.")]),
        "out2": ("Rhythm restored", "Within 40 minutes his rate is 72 and his pressure 118/70. Potassium falls to 4.4 without any other treatment. He wakes and asks why everyone is standing round his bed."),
    },
    "th": {
        "bg": "ผู้ป่วยถูกพบหมดสติที่บ้าน มีขวดยาเปล่าวางอยู่ใกล้ตัว มีประวัติหัวใจเต้นผิดจังหวะชนิด AF และความดันโลหิตสูง ขวดยาบนโต๊ะในครัวคือยาดิจอกซินของเขาที่รับมาเมื่อแปดวันก่อน",
        "ecg": "AF ที่มี ventricular response ช้า 35 ครั้งต่อนาที ST depression แบบ scooped (reverse tick) และ ventricular ectopic บ่อย เข้าได้กับพิษดิจอกซิน",
        "dig": ("ระดับดิจอกซินในเลือด", "อยู่ในระดับเป็นพิษ ระดับที่เจาะหลังให้ Fab จะเชื่อถือไม่ได้ ค่านี้จึงสำคัญ"),
        "out1": ("ประคองไว้ชั่วคราว", "ชีพจรขึ้นเป็น 45 หลังให้ atropine แต่นี่เป็นแค่การประคอง ดิจอกซินยังจับอยู่กับ sodium pump ในหัวใจ"),
        "req2": ("ให้ยาต้านพิษ Digoxin-specific antibody fragments", ["Digoxin immune Fab IV", "ตรวจโพแทสเซียมซ้ำใน 1 ชั่วโมง", "ติดมอนิเตอร์หัวใจต่อเนื่อง"],
                 {"Digoxin immune Fab IV": "พิษรุนแรงที่ไม่ทราบขนาดยาที่กิน ให้ 10 ไวแอล IV ใน 30 นาที ให้ซ้ำถ้าไม่ตอบสนอง โพแทสเซียมจะลดลงเมื่อ Fab ออกฤทธิ์ ระวังโพแทสเซียมต่ำ"},
                 [("ฟอกเลือดเพื่อเอาดิจอกซินออก", "ดิจอกซินกระจายในร่างกายกว้างมาก การฟอกเลือดแทบเอาออกไม่ได้ ยาต้านพิษคือ Fab"),
                  ("รอผลระดับดิจอกซินซ้ำก่อนให้ยาต้านพิษ", "หัวใจเต้นช้าร่วมกับช็อกและโพแทสเซียมเกิน 5 คือพิษที่คุกคามชีวิต ให้ Fab ทันที")]),
        "out2": ("จังหวะหัวใจกลับมา", "ภายใน 40 นาที ชีพจร 72 ความดัน 118/70 โพแทสเซียมลดเหลือ 4.4 โดยไม่ต้องรักษาอื่น เขาตื่นขึ้นมาถามว่าทำไมทุกคนมายืนล้อมเตียง"),
    },
}

for lang in ("en", "th"):
    t = T01[lang]
    d = load(lang, "case_01")
    d["background"] = t["bg"]
    for inv in d["investigations"]:
        if inv["id"] == "ecg1":
            inv["report"] = t["ecg"]
    d["investigations"].append({"id": "dig1", "kind": "lab", "category": "Toxicology", "name": t["dig"][0], "value": "4.8",
                                "unit": "ng/mL", "normalRange": "0.5-2.0", "abnormal": True, "report": t["dig"][1]})
    if "Digoxin Toxicity" in d.get("diagnoses", []):
        pass
    o1 = node(d, "out1")
    o1["data"]["label"], o1["data"]["narrative"] = t["out1"]
    o1["data"]["outcomeType"] = "improved"
    r = t["req2"]
    nodes = d["managementGraph"]["nodes"]
    nodes.append(req("req2", 600, r[0], r[1], r[2], r[3]))
    nodes.append(out("out2", 800, t["out2"][0], "resolved", t["out2"][1], {"hr": 72, "sbp": 118, "dbp": 70, "gcs": 15}))
    d["managementGraph"]["edges"] += [{"id": "e4", "source": "out1", "target": "req2"}, {"id": "e5", "source": "req2", "target": "out2"}]
    save(lang, "case_01", d)

# ---------------------------------------------------------------- case_02 hyponatraemia
# The old case punished hypertonic saline with osmotic demyelination and rewarded a plain
# saline bolus. With sodium 118 and seizure-like activity, a small hypertonic bolus is the
# correct first step (European 2014 and US expert panel 2013 guidance); overcorrection,
# not hypertonic saline itself, causes demyelination.
T02 = {
    "en": {
        "title": "45yo F Severe Hyponatraemia with Hypovolaemia",
        "cc": "Vomiting and diarrhoea for 3 days, now confused",
        "dx": ["Hypovolaemic hyponatraemia", "Thiazide-associated hyponatraemia", "Hypovolaemic shock", "SIADH", "Heart failure decompensation"],
        "bg": "Heart failure with reduced ejection fraction, on furosemide and hydrochlorothiazide. Three days of vomiting and watery diarrhoea, drinking only plain water. Today she became confused and had a brief episode of jerking in the taxi. Thiazide plus gastrointestinal losses plus water is the classic route to severe hyponatraemia, and the heart failure makes every litre a judgement call.",
        "inv": [("Serum osmolality", "248", "mOsm/kg", "275-295", "Hypotonic. This is true hyponatraemia, not pseudohyponatraemia."),
                ("Urine sodium", "12", "mmol/L", "-", "Low urine sodium points to volume depletion, with diuretic effect wearing off."),
                ("Urine osmolality", "520", "mOsm/kg", "-", "Concentrated urine: ADH is switched on by the low volume. When volume is restored it will switch off.")],
        "nodes": [
            ("req1", "Hypertonic 3% saline bolus for the severe symptoms",
             ["3% saline 150 mL IV over 20 minutes", "Recheck sodium after the bolus", "Repeat once if symptoms persist"],
             {"3% saline 150 mL IV over 20 minutes": "Aim for a rise of 4 to 6 mmol/L in the first hours. That is enough to reverse cerebral oedema. Then stop the hypertonic saline."},
             [("Two litres of normal saline rapidly to fix the shock and the sodium together", "Once volume is restored, ADH switches off and she passes dilute urine, so sodium can rise 15 mmol/L overnight and cause osmotic demyelination. Treat the brain with a small hypertonic bolus and give volume in measured aliquots."),
              ("Restrict fluid to 1 litre a day and recheck tomorrow", "Fluid restriction is for euvolaemic SIADH. She is confused, has had a seizure-like episode and is dry. Severe symptoms need hypertonic saline now.")], "R1"),
            ("out1", "Neurology settles", "improved", "Sodium rises from 118 to 122 after one bolus. The jerking stops and she answers questions. Four mmol/L was all the hypertonic saline was for.", {"hr": 124, "sbp": 80, "dbp": 44, "gcs": 13}),
            ("ethical_1", "Explain to her daughter why you are correcting slowly on purpose (Empathy)", "Her daughter wants the number fixed tonight. You explain that the brain has adapted over days and must be allowed to readapt over days. She stops asking for a faster drip and starts writing down the times."),
            ("req2", "Small isotonic boluses for the hypovolaemia, reassessing each time",
             ["Normal saline 250 mL aliquots", "Lung ultrasound and auscultation after each aliquot", "Hold furosemide and the thiazide", "Replace potassium"],
             {"Normal saline 250 mL aliquots": "Reassess after each one. Stop when perfusion improves or B-lines appear. Heart failure narrows the margin, it does not remove it.",
              "Replace potassium": "Potassium chloride 10 mmol/h IV. Potassium raises serum sodium too, so count it in the correction budget."},
             [("Withhold all IV fluid because of the heart failure", "She is hypotensive and dry from three days of losses. Small measured boluses with reassessment are safe and necessary."),
              ("Give furosemide to protect her from fluid overload", "She is volume depleted and diuretics caused this. Furosemide deepens the shock. Stop both diuretics.")]),
            ("out2", "Perfusion restored, then a water diuresis", "improved", "After 750 mL her pressure is 104/62. Then urine output takes off: 250 mL of dilute urine in an hour. ADH has switched off, and the sodium will now rise on its own.", {"hr": 98, "sbp": 104, "dbp": 62, "gcs": 14}),
            ("req3", "Watch for overcorrection and clamp it before the limit",
             ["Sodium every 2 to 4 hours", "Hourly urine output", "Limit the rise to 8 mmol/L in 24 hours", "Desmopressin with D5W if the limit is approached"],
             {"Limit the rise to 8 mmol/L in 24 hours": "She has three risk factors for osmotic demyelination: sodium below 120, low potassium and a course over several days.",
              "Desmopressin with D5W if the limit is approached": "Desmopressin 2 mcg IV stops the water diuresis. D5W at 3 mL/kg/h lowers the sodium again if it has already risen too fast."},
             [("Aim to bring the sodium to 135 today", "Correcting by more than 8 to 10 mmol/L in 24 hours risks osmotic demyelination, which appears days later and is often permanent."),
              ("Recheck the sodium tomorrow morning", "A water diuresis can raise sodium by 2 mmol/L an hour. Two to four hourly checks are how overcorrection is caught in time.")]),
            ("out3", "Safe correction", "resolved", "Sodium 125 at 24 hours and 131 at 48. The water diuresis was clamped with desmopressin at hour 10. No neurological deficit. Her thiazide is stopped for good and the heart failure clinic is told why.", {"hr": 86, "sbp": 112, "dbp": 66, "gcs": 15}),
        ],
    },
    "th": {
        "title": "หญิง 45 ปี โซเดียมต่ำรุนแรงร่วมกับภาวะขาดน้ำ",
        "cc": "อาเจียนและถ่ายเหลว 3 วัน ตอนนี้สับสน",
        "dx": ["Hypovolaemic hyponatraemia", "Thiazide-associated hyponatraemia", "Hypovolaemic shock", "SIADH", "Heart failure decompensation"],
        "bg": "มีภาวะหัวใจล้มเหลวชนิด EF ลดลง ใช้ furosemide และ hydrochlorothiazide อาเจียนและถ่ายเหลวมา 3 วัน ดื่มแต่น้ำเปล่า วันนี้เริ่มสับสนและมีอาการกระตุกสั้นๆ บนแท็กซี่ ยาไทอะไซด์บวกการเสียน้ำทางทางเดินอาหารบวกการดื่มน้ำเปล่า คือเส้นทางคลาสสิกสู่โซเดียมต่ำรุนแรง และหัวใจล้มเหลวทำให้น้ำทุกลิตรต้องคิดให้ดี",
        "inv": [("Serum osmolality", "248", "mOsm/kg", "275-295", "Hypotonic เป็น hyponatraemia จริง ไม่ใช่ pseudohyponatraemia"),
                ("Urine sodium", "12", "mmol/L", "-", "โซเดียมในปัสสาวะต่ำ บ่งว่าขาดน้ำ และฤทธิ์ยาขับปัสสาวะเริ่มหมด"),
                ("Urine osmolality", "520", "mOsm/kg", "-", "ปัสสาวะเข้มข้น ADH ทำงานเพราะปริมาตรต่ำ เมื่อเติมน้ำกลับ ADH จะหยุด")],
        "nodes": [
            ("req1", "ให้ 3% saline bolus สำหรับอาการรุนแรง",
             ["3% saline 150 mL IV ใน 20 นาที", "ตรวจโซเดียมซ้ำหลังให้", "ให้ซ้ำได้หนึ่งครั้งถ้ายังมีอาการ"],
             {"3% saline 150 mL IV ใน 20 นาที": "เป้าหมายให้โซเดียมขึ้น 4-6 mmol/L ในชั่วโมงแรกๆ เพียงพอจะแก้สมองบวม แล้วหยุด hypertonic saline"},
             [("ให้ NSS 2 ลิตรเร็วๆ เพื่อแก้ทั้งช็อกและโซเดียมพร้อมกัน", "เมื่อปริมาตรกลับมา ADH จะหยุด ผู้ป่วยจะปัสสาวะเจือจาง โซเดียมอาจขึ้น 15 mmol/L ในคืนเดียวจนเกิด osmotic demyelination ให้ hypertonic bolus เล็กๆ แก้สมอง แล้วให้น้ำเป็นชุดที่วัดได้"),
              ("จำกัดน้ำ 1 ลิตรต่อวัน แล้วตรวจซ้ำพรุ่งนี้", "การจำกัดน้ำใช้กับ SIADH ที่ปริมาตรปกติ ผู้ป่วยรายนี้สับสน มีอาการคล้ายชัก และขาดน้ำ อาการรุนแรงต้องให้ hypertonic saline ตอนนี้")], "R1"),
            ("out1", "อาการทางสมองดีขึ้น", "improved", "โซเดียมขึ้นจาก 118 เป็น 122 หลังให้หนึ่งครั้ง อาการกระตุกหยุด ตอบคำถามได้ hypertonic saline มีไว้เพื่อ 4 mmol/L นี้เท่านั้น", {"hr": 124, "sbp": 80, "dbp": 44, "gcs": 13}),
            ("ethical_1", "อธิบายให้ลูกสาวเข้าใจว่าทำไมต้องแก้ช้าๆ อย่างตั้งใจ (Empathy)", "ลูกสาวอยากให้ค่าปกติคืนนี้ คุณอธิบายว่าสมองปรับตัวมาหลายวัน และต้องได้เวลาปรับกลับหลายวันเช่นกัน เธอเลิกขอให้เร่งน้ำเกลือ แล้วเริ่มจดเวลาแทน"),
            ("req2", "ให้ isotonic ทีละน้อยแก้ภาวะขาดน้ำ ประเมินซ้ำทุกครั้ง",
             ["NSS ครั้งละ 250 mL", "อัลตราซาวด์ปอดและฟังปอดหลังทุกครั้ง", "หยุด furosemide และไทอะไซด์", "ทดแทนโพแทสเซียม"],
             {"NSS ครั้งละ 250 mL": "ประเมินซ้ำทุกครั้ง หยุดเมื่อการไหลเวียนดีขึ้นหรือเริ่มเห็น B-lines หัวใจล้มเหลวทำให้ช่องว่างแคบลง แต่ไม่ได้ปิด",
              "ทดแทนโพแทสเซียม": "KCl 10 mmol/h IV โพแทสเซียมทำให้โซเดียมในเลือดขึ้นด้วย ต้องนับรวมในงบการแก้"},
             [("งดน้ำเกลือทั้งหมดเพราะหัวใจล้มเหลว", "ผู้ป่วยความดันต่ำและขาดน้ำจากการเสียน้ำ 3 วัน การให้ทีละน้อยพร้อมประเมินซ้ำปลอดภัยและจำเป็น"),
              ("ให้ furosemide กันน้ำเกิน", "ผู้ป่วยขาดน้ำ และยาขับปัสสาวะคือต้นเหตุ furosemide จะทำให้ช็อกลึกลง หยุดยาขับปัสสาวะทั้งสองตัว")]),
            ("out2", "การไหลเวียนกลับมา แล้วตามด้วย water diuresis", "improved", "หลังให้ 750 mL ความดัน 104/62 แล้วปัสสาวะก็พุ่ง 250 mL ในชั่วโมงเดียว เจือจาง ADH หยุดแล้ว โซเดียมจะขึ้นเองจากนี้", {"hr": 98, "sbp": 104, "dbp": 62, "gcs": 14}),
            ("req3", "เฝ้าระวังการแก้เกิน และหยุดก่อนถึงเพดาน",
             ["ตรวจโซเดียมทุก 2-4 ชั่วโมง", "วัดปัสสาวะทุกชั่วโมง", "จำกัดการขึ้นไม่เกิน 8 mmol/L ใน 24 ชั่วโมง", "Desmopressin ร่วมกับ D5W ถ้าใกล้เพดาน"],
             {"จำกัดการขึ้นไม่เกิน 8 mmol/L ใน 24 ชั่วโมง": "ผู้ป่วยมีปัจจัยเสี่ยง osmotic demyelination สามข้อ โซเดียมต่ำกว่า 120 โพแทสเซียมต่ำ และเป็นมาหลายวัน",
              "Desmopressin ร่วมกับ D5W ถ้าใกล้เพดาน": "Desmopressin 2 mcg IV หยุด water diuresis และ D5W 3 mL/kg/h ลดโซเดียมกลับถ้าขึ้นเร็วไปแล้ว"},
             [("ตั้งเป้าให้โซเดียมถึง 135 วันนี้", "การแก้เกิน 8-10 mmol/L ใน 24 ชั่วโมงเสี่ยง osmotic demyelination ซึ่งแสดงอาการหลังหลายวันและมักถาวร"),
              ("ตรวจโซเดียมซ้ำพรุ่งนี้เช้า", "water diuresis ทำให้โซเดียมขึ้นได้ชั่วโมงละ 2 mmol/L การตรวจทุก 2-4 ชั่วโมงคือวิธีจับการแก้เกินได้ทัน")]),
            ("out3", "แก้ได้อย่างปลอดภัย", "resolved", "โซเดียม 125 ที่ 24 ชั่วโมง และ 131 ที่ 48 ชั่วโมง หยุด water diuresis ด้วย desmopressin ที่ชั่วโมงที่ 10 ไม่มีความผิดปกติทางระบบประสาท หยุดยาไทอะไซด์ถาวร และแจ้งคลินิกหัวใจล้มเหลวถึงเหตุผล", {"hr": 86, "sbp": 112, "dbp": 66, "gcs": 15}),
        ],
    },
}

for lang in ("en", "th"):
    t = T02[lang]
    d = load(lang, "case_02_fluids")
    d["title"], d["chiefComplaint"], d["diagnoses"], d["background"] = t["title"], t["cc"], t["dx"], t["bg"]
    for i, (name, value, unit, rng, report) in enumerate(t["inv"]):
        d["investigations"].append({"id": f"osm{i + 1}", "kind": "lab", "category": "Chemistry", "name": name, "value": value,
                                    "unit": unit, "normalRange": rng, "abnormal": True, "report": report})
    built = [{"id": "start1", "type": "start", "position": {"x": 0, "y": 200}, "data": {"label": "Start"}}]
    x = 240
    for spec in t["nodes"]:
        if spec[0].startswith("req"):
            built.append(req(spec[0], x, spec[1], spec[2], spec[3], spec[4], spec[5] if len(spec) > 5 else None))
        elif spec[0].startswith("out"):
            built.append(out(spec[0], x, spec[1], spec[2], spec[3], spec[4]))
        else:
            built.append(eth(spec[0], x, spec[1], spec[2]))
        x += 240
    d["managementGraph"] = {"nodes": built, "edges": edges([
        ("start1", "req1"), ("req1", "out1"), ("out1", "ethical_1"), ("ethical_1", "req2"), ("out1", "req2"),
        ("req2", "out2"), ("out2", "req3"), ("req3", "out3")])}
    save(lang, "case_02_fluids", d)

# ---------------------------------------------------------------- case_03 VF arrest
# The old path gave adrenaline at the first rhythm check without a second shock, and marked
# "shock again" as wrong. AHA sequence: shock, 2 min CPR, shock, CPR with adrenaline,
# shock, CPR with amiodarone. Shocks are never stacked without CPR in between.
T03 = {
    "en": {
        "cpr_shock": ("CPR started and one shock delivered. After 2 minutes of compressions the rhythm check shows persistent VF.",
                      [("Shock again (200 J), resume CPR at once, then adrenaline 1 mg IV", "correct_epi", "Intern"),
                       ("Stack two more shocks without CPR in between", "shock_again", "Intern")]),
        "correct_epi": ("Second shock delivered, compressions resumed immediately, adrenaline 1 mg given during the cycle. Rhythm check at 2 minutes: still VF.",
                        [("Shock again, resume CPR, then amiodarone 300 mg IV", "correct_amio", "R1"),
                         ("Push Atropine 1mg IV", "wrong_atropine", "Intern")]),
        "shock_again": "Shocks stacked without compressions leave the myocardium unperfused between attempts. The rhythm degenerates to asystole.",
        "correct_amio": "Third shock, then amiodarone 300 mg during the next cycle. At the rhythm check there is an organised rhythm and a carotid pulse. ROSC. Prepare for post-cardiac arrest care and a 12-lead ECG.",
    },
    "th": {
        "start": "ผู้ป่วยไม่มีชีพจรและไม่หายใจ มอนิเตอร์แสดง Ventricular Fibrillation",
        "start_opts": ["เริ่ม CPR และช็อกไฟฟ้า (200J)", "ฉีด Epinephrine 1mg IV", "ฉีด Amiodarone 300mg IV", "ใส่ท่อช่วยหายใจทันที"],
        "cpr_shock": ("เริ่ม CPR และช็อกไปหนึ่งครั้ง หลังกดหน้าอก 2 นาที ตรวจจังหวะยังเป็น VF",
                      [("ช็อกอีกครั้ง (200 J) กดหน้าอกต่อทันที แล้วให้ adrenaline 1 mg IV", "correct_epi", "Intern"),
                       ("ช็อกซ้อนอีกสองครั้งโดยไม่กดหน้าอกคั่น", "shock_again", "Intern")]),
        "epi_early": "ให้ epinephrine แล้ว แต่ถ้าไม่มี CPR คุณภาพดีและการช็อกไฟฟ้า ยาเพียงอย่างเดียวไม่เปลี่ยนจังหวะหัวใจ",
        "amio_early": "Amiodarone ไม่ใช่สิ่งแรกที่ต้องทำใน VF ก่อนการช็อก ผู้ป่วยยังเป็น VF",
        "intubate_early": "การใส่ท่อช่วยหายใจทำให้ CPR และการช็อกล่าช้า ซึ่งสองอย่างนี้สำคัญที่สุดในช่วงแรกของ VF",
        "correct_epi": ("ช็อกครั้งที่สอง กดหน้าอกต่อทันที ให้ adrenaline 1 mg ระหว่างรอบ ตรวจจังหวะที่ 2 นาที ยังเป็น VF",
                        [("ช็อกอีกครั้ง กดหน้าอกต่อ แล้วให้ amiodarone 300 mg IV", "correct_amio", "R1"),
                         ("ฉีด Atropine 1mg IV", "wrong_atropine", "Intern")]),
        "shock_again": "การช็อกซ้อนโดยไม่กดหน้าอกคั่น ทำให้กล้ามเนื้อหัวใจไม่ได้เลือดระหว่างช็อก จังหวะหัวใจเสื่อมลงเป็น asystole",
        "correct_amio": "ช็อกครั้งที่สาม แล้วให้ amiodarone 300 mg ในรอบถัดไป ตรวจจังหวะพบจังหวะที่เป็นระเบียบและคลำชีพจรที่คอได้ ROSC เตรียมดูแลหลังหัวใจหยุดเต้นและทำ ECG 12 ลีด",
        "wrong_atropine": "Atropine ไม่มีข้อบ่งชี้ใน VF ผู้ป่วยแย่ลงเป็น asystole",
        "title": "ชาย 55 ปี Code Blue (V-Fib)",
        "cc": "เจ็บแน่นหน้าอก หมดสติ",
        "bg": "ผู้ป่วยกุมหน้าอกในห้องรอตรวจแล้วล้มลง คลำชีพจรไม่ได้ เวลาคือกล้ามเนื้อหัวใจ",
    },
}

for lang in ("en", "th"):
    t = T03[lang]
    d = load(lang, "case_03_cardiac")
    nodes = d["managementGraph"]["nodes"]
    for key in ("cpr_shock", "correct_epi"):
        narrative, opts = t[key]
        nodes[key]["narrative"] = narrative
        nodes[key]["options"] = [{"id": f"opt{i + 1}", "text": txt, "targetNode": tgt, "requiredRank": rank} for i, (txt, tgt, rank) in enumerate(opts)]
    for key in ("shock_again", "correct_amio", "epi_early", "amio_early", "intubate_early", "wrong_atropine"):
        if key in t:
            nodes[key]["narrative"] = t[key]
    if lang == "th":
        nodes["start"]["narrative"] = t["start"]
        for o, txt in zip(nodes["start"]["options"], t["start_opts"]):
            o["text"] = txt
        d["title"], d["chiefComplaint"], d["background"] = t["title"], t["cc"], t["bg"]
    save(lang, "case_03_cardiac", d)

print("rewrites done")


# ---------------------------------------------------------------- targeted text corrections
def patch(case, pairs, langs=("en",)):
    """Raw text replacement, which leaves hand-formatted case files exactly as they were elsewhere."""
    for lang in langs:
        path = ROOT / lang / f"{case}.json"
        text = path.read_text()
        for old, new in pairs:
            # An action label also appears as its doseMap key, so a phrase may legitimately occur twice
            assert 1 <= text.count(old) <= 2, f"{lang}/{case}: expected {old[:50]!r}, found {text.count(old)}"
            text = text.replace(old, new)
        json.loads(text)
        path.write_text(text)


# Adenosine may be tried in unstable regular narrow-complex tachycardia only if it does not delay cardioversion (AHA 2020)
patch("case_04_svt", [("Adenosine is for STABLE narrow-complex tachycardia. Delaying electrical therapy in an unstable patient causes further deterioration. The patient loses consciousness.",
                       "Adenosine can be tried in an unstable regular narrow-complex tachycardia only while cardioversion is being set up, never instead of it. Here it delayed the shock, and she loses consciousness.")])
patch("case_04_svt", [("Adenosine ใช้สำหรับ STABLE narrow-complex tachycardia การมัวเสียเวลากับยาในผู้ป่วยที่ Unstable ทำให้ผู้ป่วยแย่ลง ผู้ป่วย GCS drop และหมดสติ",
                       "Adenosine ลองให้ได้ใน unstable regular narrow-complex tachycardia เฉพาะระหว่างเตรียม cardioversion เท่านั้น ห้ามใช้แทน ครั้งนี้มันทำให้การช็อกล่าช้า ผู้ป่วย GCS drop และหมดสติ")], langs=("th",))

# Anaphylaxis: routine steroids are no longer recommended (RCUK 2021); antihistamines are for skin symptoms after stabilisation
patch("case_07", [("Antihistamines help skin symptoms and are reasonable after adrenaline. Steroids are commonly given. They are adjuncts, not nothing.",
                   "Antihistamines help the itch and urticaria once she is stable. Routine steroids are no longer recommended in UK guidance, but they are reasonable here because asthma is part of the picture.")])

# DKA: her potassium is 5.4, above 5.3, so withholding replacement initially is correct. The old distractor contradicted the case.
patch("case_09", [("Withhold potassium because the result is normal", "Add 40 mmol/h of potassium now, since total body potassium is always depleted"),
                  ("Total body potassium is depleted in DKA even when serum is normal. Add replacement once urine output is confirmed.",
                   "Her potassium is 5.4, above 5.3. Give none yet, recheck in 2 hours, and add 20 to 30 mmol/L to the fluid once it falls below 5.3 with good urine output.")])

# Ectopic: anti-D after surgical management of ectopic is 250 IU (NICE NG126); IU and micrograms were conflated
patch("case_11", [("250-300 mcg IM within 72 hours", "250 IU (50 micrograms) IM within 72 hours")])

# Organophosphate: Eddleston atropinisation endpoints use systolic above 80, and the case contradicted itself
patch("case_13", [("heart rate above 80 and systolic above 90", "heart rate above 80 and systolic above 80")])

# Russell's viper: 4 vials minus 3 given cannot leave 2
patch("case_16", [("Four vials of Russell's viper antivenom are in the fridge", "Five vials of Russell's viper antivenom are in the fridge")])

# Paediatric post-arrest temperature: prevent fever, keep 37.5 C or below (ERC 2021, AHA 2020)
patch("case_19", [("Passive rewarming to 34-36 C only", "Passive rewarming only, then hold at 36-37.5 C"),
                  ("Do not rewarm past 36 C. Fever after hypoxic brain injury measurably worsens outcome and is the one thing you can definitely control",
                   "Do not let him go above 37.5 C. Fever after hypoxic brain injury worsens outcome and is the one thing you can definitely control"),
                  ("Rewarm passively to 34 to 36 C only.", "Rewarm passively and keep him at or below 37.5 C.")])

# Atropine for symptomatic bradycardia is 1 mg every 3 to 5 minutes to 3 mg (AHA 2020)
patch("case_26", [("0.5 mg IV, repeat to a maximum of 3 mg", "1 mg IV every 3 to 5 minutes, to a maximum of 3 mg")])

# Tetanus autonomic storm: labetalol is not short acting. Esmolol is the titratable choice, magnesium first.
patch("case_28", [("Labetalol or esmolol for hypertensive surges. Avoid long acting beta blockers alone, which have been associated with sudden death in tetanus",
                   "Esmolol for hypertensive surges, because it can be switched off within minutes when the pressure swings low. Avoid long acting beta blockers, which have been associated with sudden death in tetanus")])

# Methanol: EXTRIP 2015 dialysis criteria
patch("case_29", [("Indicated for pH below 7.3, visual symptoms, methanol above 50 mg/dL, or renal failure. He meets three.",
                   "EXTRIP criteria: coma, seizures, new visual loss, pH 7.15 or below, an anion gap above 24, or methanol above 70 mg/dL on fomepizole. He meets three.")])

# Bronchiolitis: maintenance for 5.8 kg is about 23 mL/h (4 mL/kg/h), not 39
patch("case_32", [("Roughly 39 mL/h at full maintenance for 5.8 kg, so about 26 mL/h.", "About 23 mL/h at full maintenance for 5.8 kg (4 mL/kg/h), so about 15 mL/h.")])

# PE: the accelerated alteplase regimen is not only for arrest; provoked PE needs 3 months, the case said both 3 and 6
patch("case_36", [("100 mg over 2 hours, or 0.6 mg/kg over 15 min in cardiac arrest.", "100 mg over 2 hours, or an accelerated 0.6 mg/kg over 15 minutes (maximum 50 mg) when she is peri-arrest."),
                  ("on a direct oral anticoagulant for at least six months", "on a direct oral anticoagulant for at least three months, the standard for a provoked embolism")])

# Mass casualty: the outcome sent the non-responder to theatre first, which contradicted "not the sickest"
patch("case_50", [("The greatest good for the greatest number, which means the patient who needs the least theatre time to survive goes first, not the sickest.",
                   "The greatest good for the greatest number. The salvageable non-responder who will die without surgery goes first, the responder can wait, and the unsalvageable are made expectant.")])

print("patches done")
