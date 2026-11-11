"""
Finding versus reading. A text result or an exam finding is stored as "what was found || what it means".
In play only the first part shows until the player commits a working diagnosis; the debrief shows both.
Every split below was decided by hand (see split_draft.py for the first pass). Run from the repo root, then
`python3 scripts/thai/cases.py build all`. Safe to run again: text that already has " || " is left alone.

CUT: the reading starts at this phrase. CUSTOM: (finding, reading) written out, when the two were interleaved.
"""
import json, re, sys
SEP = " || "

CUT = {
 # Thai text results (scripts/thai/cases/*.txt)
 ("case_01", "i.ecg1"): "เข้าได้กับ digoxin toxicity",
 ("case_08", "i.us1"): "ทำข้างเตียง 90 วินาที",
 ("case_10", "i.ecg1"): "ไม่สนับสนุนว่ากินยา",
 ("case_12", "i.us1"): "มี plasma leak",
 ("case_13", "i.ecg1"): "QT ยาวใน OP",
 ("case_14", "i.fast1"): "FAST negative",
 ("case_14", "i.pxr1"): "APC injury",
 ("case_15", "i.cxr1"): "ไม่มี indication",
 ("case_19", "i.ecg1"): "เข้าได้กับ hypothermia",
 ("case_20", "i.xr1"): "การแตกละเอียดเป็นช่วงยาว",
 ("case_22", "i.cxr1"): "เป็น alveolar hemorrhage",
 ("case_23", "i.cxr1"): "ไม่มี indication ทำใน ER",
 ("case_24", "i.ecg1"): "ไม่สนับสนุนว่า PE",
 ("case_25", "i.cxr1"): "infiltrate ดูน้อยกว่า",
 ("case_25", "i.echo1"): "ไม่สนับสนุน massive PE",
 ("case_25", "i.ecg1"): "ไม่สนับสนุน lidocaine",
 ("case_26", "i.ecg1"): "เป็น inferior STEMI",
 ("case_26", "i.ecg2"): "ยืนยัน RV infarction",
 ("case_26", "i.cxr1"): "ช่วยตัด dissection",
 ("case_27", "i.mri1"): "ผู้ใหญ่ไม่มีอาการ",
 ("case_27", "i.ct1"): "effective dose",
 ("case_29", "i.ct1"): "bilateral putaminal necrosis",
 ("case_30", "i.cxr1"): "เป็น film baseline",
 ("case_30", "i.endo1"): "คาดว่ามีแผล",
 ("case_31", "i.us1"): "บ่งว่าลำไส้น่าจะยังไม่ตาย",
 ("case_31", "i.axr1"): "ตัดลำไส้ทะลุออกได้",
 ("case_32", "i.cxr1"): "การถ่าย CXR routine",
 ("case_34", "i.ctg1"): "fetal compromise น่าจะ",
 ("case_34", "i.ct1"): "เข้าได้กับ PRES",
 ("case_35", "i.echo1"): "รูปแบบ RV failure นี้",
 ("case_35", "i.ecg1"): "acute right heart strain",
 ("case_36", "i.echo1"): "ในคนไข้ที่ unstable",
 ("case_36", "i.ecg1"): "เป็น right heart strain",
 ("case_36", "i.ctpa1"): "บ่งชี้ right heart strain",
 ("case_36", "i.us2"): "ยืนยันต้นเหตุ",
 ("case_37", "i.ct1"): "นี่คือ definitive",
 ("case_37", "i.echo1"): "ทำได้ในไม่กี่นาที",
 ("case_37", "i.ecg1"): "flap ลามไปถึง",
 ("case_37", "i.cxr1"): "dissection ราว 12",
 ("case_39", "i.ct1"): "สนับสนุน necrotizing fasciitis",
 ("case_40", "i.ecg1"): "AF เจอใน thyrotoxicosis",
 ("case_42", "i.eeg1"): "ยืนยันว่ายังมี non-convulsive",
 ("case_43", "i.xr1"): "การทำ imaging ใน",
 ("case_44", "i.ct1"): "การตกต้อง work up",
 ("case_46", "i.ct1"): "ปกติ ทำเพราะ",
 ("case_47", "i.ct1"): "คำถามเดียวที่",
 ("case_47", "i.cta1"): "large vessel occlusion ทำให้",
 ("case_47", "i.ecg1"): "ยืนยันกลไก cardioembolic",
 ("case_49", "i.ecg1"): "เปลี่ยนเป็น sine wave",
 ("case_50", "i.fast1"): "ยืนยันทั้ง hemoperitoneum",
 ("case_50", "i.xr1"): "ถ่าย portable อย่างเดียว",
 # English exam findings (public/locales/en/*.json)
 ("case_12", "e.rs1"): "consistent with pleural effusion",
 ("case_13", "e.rs1"): "This is what kills",
 ("case_14", "e.abd1"): "Do not spring the pelvis",
 ("case_18", "e.cvs1"): "Note that a healthy young woman",
 ("case_18", "e.abd1"): "A soft high fundus is the diagnosis",
 ("case_24", "e.ga1"): "which is a classic presentation",
 ("case_24", "e.rs1"): "which makes pulmonary embolism",
 ("case_25", "e.hent1"): "which is close to diagnostic",
 ("case_25", "e.skin1"): "This petechial rash appears",
 ("case_26", "e.hent1"): "which is the combination that signals",
 ("case_27", "e.hent1"): "consistent with reflux",
 ("case_27", "e.cvs1"): "consistent with white coat effect",
 ("case_28", "e.ga1"): "Consciousness is preserved in tetanus",
 ("case_28", "e.cns1"): "This is the clinical picture",
 ("case_29", "e.ga1"): "which is itself a clue",
 ("case_30", "e.rs1"): "This is the crucial window",
 ("case_30", "e.cns1"): "This matters, because",
 ("case_31", "e.rs1"): "which suggests compensation",
 ("case_31", "e.skin1"): "Look specifically for",
 ("case_31", "e.cns1"): "which argues against meningitis",
 ("case_35", "e.ga1"): "The speed of deterioration",
 ("case_35", "e.hent1"): "which argues against anaphylaxis",
 ("case_39", "e.skin1"): "The border is indistinct",
 ("case_40", "e.cvs1"): "indicating high output cardiac failure",
 ("case_42", "e.cns1"): "After 30 minutes the motor activity",
 ("case_43", "e.ga1"): "Note this observation",
 ("case_43", "e.cns1"): "No red flags for cauda equina",
 ("case_46", "e.ga1"): "This combination of extreme agitation",
 ("case_46", "e.cns1"): "Any patient with an unexplained",
 ("case_47", "e.ga1"): "which is worth remembering",
 ("case_49", "e.ga1"): "The mismatch between",
 ("case_49", "e.cvs1"): "The ectopics are the warning",
 ("case_50", "e.rs1"): "consistent with a tension pneumothorax",
}

CUSTOM = {
 ("case_09", "i.ecg1"): ("Sinus tachycardia 122/min peaked T สูงที่ V2 ถึง V4 QRS ปกติ ไม่มี ischemic change", "peaked T เข้าได้กับ hyperkalemia"),
 ("case_10", "i.cxr1"): ("Patchy airspace opacity ที่ฐานปอดทั้งสองข้าง หัวใจขนาดปกติ ไม่มี pneumothorax", "เข้าได้กับ aspiration หรือ non-cardiogenic pulmonary edema จาก naloxone"),
 ("case_11", "i.us1"): ("Free fluid ใน Morison's pouch และ pelvis มี echogenic material หมุนวน มดลูกว่าง endometrium บาง มีห่วงอยู่ในโพรง มี heterogeneous mass ที่ right adnexa 34 mm แยกจากรังไข่ มี fluid รอบๆ ไม่มี intrauterine gestational sac", "echogenic material ที่หมุนวนบ่งว่าเป็นก้อนเลือด"),
 ("case_13", "i.cxr1"): ("Diffuse airspace opacity ทั้งสองข้าง ET tube อยู่เหนือ carina 3 cm", "เข้าได้กับ aspiration และ bronchorrhea"),
 ("case_18", "i.us1"): ("โพรงมดลูกขยาย มี echogenic material 3 cm มี free fluid ใน pouch of Douglas ไม่เห็น uterine rupture หรือ inversion", "echogenic material เข้าได้กับรกค้างหรือ clot"),
 ("case_19", "i.cxr1"): ("Diffuse perihilar และ basal airspace opacity ทั้งสองข้าง ET tube อยู่เหนือ carina 1 cm มี gastric distension ไม่มี pneumothorax ไม่มี rib fracture", "เข้าได้กับ aspiration และ pulmonary edema ET tube ลึกไป ต้องดึงออก 1.5 cm"),
 ("case_21", "i.ecg1"): ("Sinus tachycardia 146/min, peaked T ที่ V2 ถึง V4 ไม่มี ischemic ST elevation, QTc 420 ms", "peaked T จาก hyperkalemia"),
 ("case_23", "i.prev1"): ("ทั้งสองรายงานเห็น right posterior cervical node 9 mm มี fatty hilum รูปร่างรีปกติ vascular pattern ปกติ ไม่มี node ผิดปกติอื่น", "ลักษณะ benign reactive hilum ที่ยังอยู่ร่วมกับรูปรีเป็นลักษณะที่น่าวางใจ และตรงกับที่ตรวจข้างเตียง"),
 ("case_23", "i.petct1"): ("ไม่ได้ทำ", "ไม่มี indication effective dose ราว 15 mSv ค่าใช้จ่ายราว 60,000 บาท ในคนอายุ 29 ที่มี reactive node 9 mm ลักษณะไม่ร้าย โอกาสได้ผลบวกลวงที่ต้องตามด้วยหัตถการมีมากกว่าโอกาสเจอโรคหลายเท่า"),
 ("case_24", "i.us1"): ("Heterogeneous collection ขนาดราว 15 x 9 cm ใน subcutaneous plane ระหว่าง flap กับ fascia มีลักษณะหมุนวน ไม่มี free fluid ในช่องท้อง fascia ไม่ขาด", "ลักษณะหมุนวนบ่งว่ายังเลือดออกอยู่"),
 ("case_25", "i.ctpa1"): ("ไม่มี filling defect ใน pulmonary artery ถึงระดับ segmental มี ground glass opacity กระจายทั่วร่วมกับ interlobular septal thickening", "ตัด thromboembolism ก้อนใหญ่ออก ภาพแบบนี้สนับสนุน fat embolism มากกว่า thrombotic embolism"),
 ("case_41", "i.ecg1"): ("Sinus bradycardia 42/min, low voltage ทุก lead, QTc ยาว 540 ms มี J wave ที่ inferior leads", "J wave จาก hypothermia ส่วน low voltage สนับสนุนว่ามี pericardial effusion"),
 ("case_41", "i.cxr1"): ("เงาหัวใจโตกลม มี pleural effusion เล็กน้อยทั้งสองข้าง และ RLL consolidation", "เงาหัวใจเข้าได้กับ pericardial effusion ส่วน pneumonia คือตัวกระตุ้น"),
 ("case_42", "i.ct1"): ("Calcified lesion เล็กๆ หลายจุดในสมองทั้งสองซีก มี ring-enhancing lesion หนึ่งจุดที่ left parietal มี edema รอบๆ ไม่มีเลือดออก ไม่มี midline shift", "เข้าได้กับ neurocysticercosis หลายระยะ"),
 ("case_44", "i.ecg1"): ("Sinus tachycardia มี ventricular ectopic บ่อย peaked T ไม่มี ST elevation", "peaked T เข้าได้กับ hyperkalemia arrhythmia คือสาเหตุการเสียชีวิตทันทีในไฟดูด ต้อง monitor 24 ชม. หลังโดนไฟแรงสูงหรือหมดสติ"),
 ("case_45", "i.cxr1"): ("ปอดใส", "CXR มักปกติใน 24 ชม. แรกของ inhalation injury film ปกติจึงไม่ได้ทำให้วางใจได้เลย"),
 ("case_46", "i.ecg1"): ("Sinus tachycardia 152/min มี peaked T และ QRS 118 ms ไม่มี ST elevation, QTc 470 ms", "peaked T กับ QRS ที่กว้างมาจาก hyperkalemia และ acidosis"),
 ("case_17", "e.rs1"): ("Deep sighing Kussmaul respirations at 32/min, bibasal fine crackles, no consolidation", "The crackles suggest early acute lung injury"),
 ("case_29", "e.rs1"): ("Clear lung fields with deep rapid Kussmaul breathing", "The breathing is compensating for severe metabolic acidosis. Any fall in respiratory rate here signals decompensation, not improvement"),
 ("case_32", "e.ga1"): ("Miserable, exhausted rather than agitated. Grunting intermittently. Too breathless to feed", "Exhausted is the more worrying of the two"),
 ("case_32", "e.abd1"): ("Soft, mildly distended from air swallowing, liver edge palpable 1 cm below the costal margin, no masses", "A palpable liver edge is normal at this age and is pushed down by hyperinflation"),
 ("case_33", "e.hent1"): ("Anterior fontanelle full and slightly tense when held upright. Dry mucous membranes, no dysmorphic features, red reflex present bilaterally, no conjunctivitis", "A full fontanelle in a neonate is a late sign of meningitis"),
 ("case_33", "e.cvs1"): ("Tachycardia at 196/min, capillary refill 5 seconds centrally, weak brachial pulses, femoral pulses present and equal, no murmur, no hepatomegaly", "Equal femoral pulses argue against coarctation"),
 ("case_34", "e.rs1"): ("Bibasal crackles, saturations 94% on room air, no wheeze", "The crackles suggest early pulmonary oedema. Pulmonary oedema is a leading cause of death in severe pre-eclampsia and is worsened by careless fluid administration"),
 ("case_37", "e.cvs1"): ("Blood pressure 178/96 in the right arm and 132/74 in the left, a 46 mmHg differential. Early diastolic murmur at the left sternal edge. Right femoral pulse weak, left femoral pulse absent", "The murmur indicates new aortic regurgitation"),
 ("case_37", "e.abd1"): ("Soft with disproportionate periumbilical pain and no tenderness on palpation. No pulsatile mass palpable, bowel sounds present", "Pain out of proportion to the examination raises mesenteric malperfusion from the dissection flap"),
 ("case_38", "e.rs1"): ("Reduced air entry at the right base with dullness, no frank aspiration signs yet, tachypnoeic", "The dull base suggests a small hepatic hydrothorax"),
 ("case_38", "e.abd1"): ("Distended with tense ascites and shifting dullness, caput medusae, splenomegaly 5 cm below the costal margin, non-tender with no rebound", "A non-tender abdomen argues against spontaneous bacterial peritonitis for now"),
 ("case_41", "e.cvs1"): ("Bradycardia at 42/min, hypotensive, distant muffled heart sounds, non-pitting oedema of both legs, capillary refill 5 seconds", "Muffled heart sounds suggest a pericardial effusion"),
 ("case_41", "e.rs1"): ("Hypoventilating at 8 breaths per minute with shallow tidal volumes, right basal crackles, reduced air entry at both bases", "The crackles suggest pneumonia, the quiet bases pleural effusions"),
 ("case_41", "e.cns1"): ("GCS 7 (E1V2M4), delayed relaxation phase of the ankle reflexes, no focal deficit, no seizure activity, pupils sluggish", "Delayed reflex relaxation is close to specific for hypothyroidism"),
 ("case_42", "e.rs1"): ("Ineffective irregular respiration during tonic phases, saturations 84%, coarse crackles, chest wall rigidity", "The crackles suggest aspiration"),
 ("case_42", "e.skin1"): ("Cyanosed centrally, diaphoretic, a small palpable subcutaneous nodule over the left forearm, no rash or petechiae, no needle marks", "The nodule may be a cysticercus"),
 ("case_44", "e.skin1"): ("Deep charred contact wound over the right palm (entry) measuring 4 cm, and a similar exit wound over the left heel. Total burn surface area under 3%. Right forearm is tense, swollen and hard with pain on passive finger extension", "The small surface burn is deceptive: the damage is deep"),
 ("case_47", "e.hent1"): ("Right facial droop sparing the forehead. Forced gaze deviation to the left. Tongue deviates to the right on protrusion. No head injury, no tongue laceration to suggest a seizure", "Forehead sparing indicates an upper motor neurone lesion"),
 ("case_47", "e.cvs1"): ("Irregularly irregular pulse at 96/min, hypertensive at 192/104, no murmur, no carotid bruit, peripheries warm", "The pulse is consistent with atrial fibrillation"),
}

# Second pass: exam findings whose later sentence is the teaching note
CUT.update({
 ('case_16', 'e.hent1'): 'Absence of neurotoxic signs',
 ('case_17', 'e.abd1'): 'Handle the spleen gently',
 ('case_17', 'e.cns1'): 'Cerebral malaria is',
 ('case_18', 'e.cns1'): 'Consider eclampsia if',
 ('case_19', 'e.cvs1'): 'In hypothermia, pulses',
 ('case_19', 'e.rs1'): 'Surfactant washout',
 ('case_19', 'e.cns1'): 'Neurological prognosis in drowning',
 ('case_21', 'e.ga1'): 'Central nervous system dysfunction plus',
 ('case_21', 'e.rs1'): 'Watch for ARDS',
 ('case_21', 'e.skin1'): 'Anhidrosis is a late',
 ('case_22', 'e.cvs1'): 'Myocarditis occurs',
 ('case_22', 'e.rs1'): 'Pulmonary haemorrhage carries',
 ('case_24', 'e.abd1'): 'Remove the garment to examine',
 ('case_25', 'e.rs1'): 'Hypoxaemia disproportionate',
 ('case_25', 'e.cns1'): 'Cerebral involvement precedes',
 ('case_26', 'e.rs1'): 'Clear lungs plus hypotension',
 ('case_28', 'e.cvs1'): 'Autonomic instability appears',
 ('case_28', 'e.abd1'): 'Rigidity without peritonism',
 ('case_28', 'e.skin1'): 'Ten percent of tetanus cases',
 ('case_29', 'e.abd1'): 'Haemorrhagic pancreatitis is',
 ('case_29', 'e.cns1'): 'Basal ganglia damage',
 ('case_30', 'e.ga1'): 'Early paraquat poisoning',
 ('case_31', 'e.ga1'): 'Lethargy out of proportion',
 ('case_32', 'e.cns1'): 'Drowsiness in bronchiolitis',
 ('case_34', 'e.cns1'): 'Clonus is the sign',
 ('case_35', 'e.cvs1'): 'Initial right ventricular failure',
 ('case_35', 'e.skin1'): 'Oozing from every puncture site is',
 ('case_35', 'e.cns1'): 'Neurological injury here is hypoxic',
 ('case_36', 'e.cvs1'): 'Raised JVP with clear lungs and shock',
 ('case_36', 'e.rs1'): 'Hypoxaemia out of all proportion',
 ('case_37', 'e.rs1'): 'Left pleural effusion may develop',
 ('case_37', 'e.cns1'): 'Stroke-like features occur',
 ('case_38', 'e.cns1'): 'Grade 2 hepatic encephalopathy',
 ('case_39', 'e.ga1'): 'Pain far exceeding what the skin',
 ('case_44', 'e.abd1'): 'Blunt abdominal injury from the fall',
 ('case_44', 'e.cns1'): 'Peripheral nerve injury is common',
 ('case_45', 'e.hent1'): 'Every one of these predicts',
 ('case_45', 'e.cvs1'): 'Hypotension in the first hour',
 ('case_45', 'e.cns1'): 'In an enclosed space fire',
 ('case_46', 'e.rs1'): 'Prolonged prone restraint',
 ('case_47', 'e.rs1'): 'Swallow not yet tested',
 ('case_47', 'e.skin1'): 'Relevant because any of these',
 ('case_48', 'e.hent1'): 'Neck stiffness is absent in',
 ('case_48', 'e.cvs1'): 'Hypotension in a 17 year old',
 ('case_48', 'e.abd1'): 'Abdominal pain is a common early feature',
 ('case_48', 'e.cns1'): 'Deteriorating consciousness in this setting',
 ('case_50', 'e.ga1'): 'He walked past triage',
 ('case_50', 'e.hent1'): 'Nine of the thirty-four casualties',
 ('case_50', 'e.cvs1'): 'Under the START triage system',
 ('case_50', 'e.abd1'): 'He needs the one available operating theatre',
 ('case_50', 'e.cns1'): 'In a mass casualty setting',
})
CUSTOM.update({
 ('case_12', 'e.abd1'): ('Tender hepatomegaly 3 cm below the costal margin, shifting dullness, no rebound, severe abdominal pain', 'Severe abdominal pain is a dengue warning sign'),
 ('case_22', 'e.hent1'): ('Marked conjunctival suffusion without discharge. Scleral icterus, dry lips, no neck stiffness, no eschar found on full skin survey', 'A red eye with no exudate is close to pathognomonic in the right setting'),
 ('case_27', 'e.cns1'): ('GCS 15, fully orientated, no focal deficit. Calm and businesslike rather than anxious', 'He is transactional: he believes screening is a purchasable good and he is prepared to pay for the best version of it'),
 ('case_35', 'e.abd1'): ('Gravid uterus, hypertonic and firm, fetal heart rate 68 bpm and falling on the cardiotocograph. Torrential fresh vaginal bleeding beginning about eight minutes after collapse', 'The bleeding starts as the coagulopathy establishes'),
 ('case_39', 'e.cns1'): ('GCS 13 (E3V4M6), confused, no focal deficit. The skin over the affected area is numb', 'The confusion is from sepsis. Cutaneous anaesthesia from destruction of superficial nerves is an early and highly specific sign'),
 ('case_45', 'e.rs1'): ('Tachypnoeic at 32/min with a circumferential full thickness burn across the chest wall restricting expansion. Coarse crackles and wheeze. Oxygen saturation reads 99%', 'The saturation is unreliable, because pulse oximetry cannot distinguish carboxyhaemoglobin from oxyhaemoglobin'),
})

def split_at(text, phrase):
    i = text.find(phrase)
    if i <= 0: raise SystemExit(f"phrase not found: {phrase!r} in {text[:80]!r}")
    head = re.sub(r"[\s,]*(และ|ซึ่ง|which|,)?\s*$", "", text[:i]).rstrip(" ,.")
    tail = text[i:].strip()
    tail = re.sub(r"^which (is|makes|argues|suggests|means)", lambda m: {"is": "This is", "makes": "This makes", "argues": "This argues", "suggests": "This suggests", "means": "This means"}[m.group(1)], tail)
    return head, tail[0].upper() + tail[1:] if tail[:1].isascii() else tail

def joined(pair): return pair[0] + SEP + pair[1]

changed = 0
cases = sorted({c for c, _ in list(CUT) + list(CUSTOM)})
for case in cases:
    # Thai text results
    path = f"scripts/thai/cases/{case}.txt"
    lines = open(path, encoding="utf8").read().split("\n")
    for n, line in enumerate(lines):
        m = re.match(r"^(i\.[^:]+): (.*)$", line)
        if not m or SEP in line: continue
        key = (case, m.group(1))
        if key in CUSTOM: lines[n] = f"{m.group(1)}: {joined(CUSTOM[key])}"; changed += 1
        elif key in CUT: lines[n] = f"{m.group(1)}: {joined(split_at(m.group(2), CUT[key]))}"; changed += 1
    open(path, "w", encoding="utf8").write("\n".join(lines))
    # English exam findings: edit the string in place, so the file keeps its hand formatting
    path = f"public/locales/en/{case}.json"
    raw = open(path, encoding="utf8").read()
    data = json.loads(raw)
    for e in data.get("exam") or []:
        key = (case, f"e.{e.get('id')}")
        old = e.get("finding", "")
        if SEP in old or (key not in CUSTOM and key not in CUT): continue
        new = joined(CUSTOM[key]) if key in CUSTOM else joined(split_at(old, CUT[key]))
        for enc in (json.dumps(old, ensure_ascii=False), json.dumps(old)):
            if raw.count(enc) == 1: raw = raw.replace(enc, json.dumps(new, ensure_ascii=False)); changed += 1; break
        else: raise SystemExit(f"could not place {key}")
    json.loads(raw)
    open(path, "w", encoding="utf8").write(raw)
want = len(CUT) + len(CUSTOM)
print(f"split {changed} of {want}")
