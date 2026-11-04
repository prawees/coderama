"""Ward-Thai pass on lib/patients.ts: nurse-voice pager lines, English diagnoses, a few natural fixes."""
import re
from pathlib import Path

P = Path(__file__).resolve().parents[2] / "lib" / "patients.ts"
s = P.read_text()

PAGER = {
 "case_01": "หมดสติที่บ้าน HR 35 ขวด digoxin ว่างเปล่าค่ะ",
 "case_02_fluids": "ถ่ายเหลวมา 3 วัน ตอนนี้ซึม สับสนค่ะ",
 "case_03_cardiac": "ล้มในห้องรอตรวจ คลำ pulse ไม่ได้ค่ะ!",
 "case_04_svt": "ใจสั่นเร็วมาก หน้ามืด ตัวซีดค่ะ",
 "case_05_asthma": "เด็กหอบ มี wheeze พ่นยาที่บ้านไม่ดีขึ้นค่ะ",
 "case_06_trauma": "มอไซค์ชนเสา ไม่ใส่หมวก ซึมค่ะ",
 "case_07": "ผื่นขึ้น หายใจมี wheeze หลังกินกุ้งค่ะ",
 "case_07_vip": "เคส VIP แน่นหน้าอก เป็นกรรมการโรงพยาบาลค่ะ",
 "case_08": "รถล้ม เหนื่อยมากขึ้นเรื่อยๆ ค่ะ",
 "case_09": "นักศึกษา อาเจียน ซึม หายใจแปลกๆ ค่ะ",
 "case_10": "เรียกไม่ตื่น หายใจช้ามากค่ะ",
 "case_11": "ปวดท้องน้อยขวาทันที แล้วเป็นลมค่ะ",
 "case_12": "ไข้วันที่ 5 ไข้ลงแล้ว แต่ตัวเย็น ซึมค่ะ",
 "case_13": "เกษตรกร น้ำลายฟูมปาก HR ช้ามากค่ะ",
 "case_14": "วัยรุ่น มอไซค์ล้ม ปวดสะโพก ตัวซีดค่ะ",
 "case_15": "walk-in มีน้ำมูก ไอ ขอให้น้ำเกลือค่ะ",
 "case_16": "งูกัดในนา เลือดออกตามไรฟันค่ะ",
 "case_17": "แรงงานพม่า ไข้ 6 วัน ชักบนรถค่ะ",
 "case_18": "คลอดได้ 40 นาที เลือดออกไม่หยุดค่ะ",
 "case_19": "เด็กจมน้ำในคลอง พี่สาวดึงขึ้นมาค่ะ",
 "case_20": "มือขาดจากเครื่องตัดอ้อย เอามือมาด้วยค่ะ",
 "case_21": "ล้มในนา ตัวร้อนจี๋ ชักเกร็งค่ะ",
 "case_22": "ไข้ ตาเหลือง ไอเป็นเลือดค่ะ",
 "case_23": "กังวลก้อนที่คอ ขอทำ PET scan คืนนี้ค่ะ",
 "case_24": "หน้ามืดตอนเช้า หลังผ่าตัดหน้าท้องที่คลินิกค่ะ",
 "case_25": "หอบ สับสน หลังดูดไขมันค่ะ",
 "case_26": "เจ็บหน้าอก อยู่ชั้น VIP ค่ะ",
 "case_27": "ไม่มีอาการ แต่ขอ MRI ทั้งตัวคืนนี้ค่ะ",
 "case_28": "อ้าปากไม่ได้ เกร็งกระตุกทั้งตัวค่ะ",
 "case_29": "ดื่มเหล้าต้มที่งานศพ ตอนนี้มองไม่เห็นค่ะ",
 "case_30": "กินยาฆ่าหญ้า เจ็บปาก เจ็บคอค่ะ",
 "case_31": "ร้องเป็นพักๆ งอขา ตอนนี้ซึมค่ะ",
 "case_32": "เป็นหวัด หอบ หยุดหายใจไป 2 รอบค่ะ",
 "case_33": "ทารกไม่ดูดนม ตัวเย็นค่ะ",
 "case_34": "GA 34 wk ชักที่บ้าน แล้วชักอีกรอบบนรถค่ะ",
 "case_35": "ห้องคลอด คนไข้วูบหมดสติค่ะ!",
 "case_36": "เป็นลมที่สนามบินหลังบินไกล หอบค่ะ",
 "case_37": "ปวดหลังเหมือนถูกฉีก ตอนยกกระเป๋าค่ะ",
 "case_38": "อาเจียนเป็นเลือดสดเต็มถังค่ะ",
 "case_39": "ปวดขามาก ไข้ มีโรคตับอยู่เดิมค่ะ",
 "case_40": "ท้อง 22 wk ไข้สูง ใจสั่น สับสนค่ะ",
 "case_41": "พบตัวเย็นที่บ้าน ปลุกไม่ตื่นค่ะ",
 "case_42": "ชักไม่หยุดมา 25 นาทีแล้วค่ะ!",
 "case_43": "ปวดหลัง ขอ pethidine ค่ะ",
 "case_44": "ไฟดูด ตกจากหลังคาค่ะ",
 "case_45": "ถังแก๊สระเบิด ไฟไหม้ เสียงแหบค่ะ",
 "case_46": "คลุ้มคลั่ง ตัวร้อน ตำรวจพามาค่ะ",
 "case_47": "แขนขาขวาอ่อนแรง พูดไม่ได้ทันทีค่ะ",
 "case_48": "ไข้ ผื่นจ้ำเลือดลามเร็วค่ะ",
 "case_49": "ติดใต้แผ่นปูน 6 ชั่วโมง เพิ่งช่วยออกมาค่ะ",
 "case_50": "mass casualty รถทัวร์คว่ำ ระลอกแรกกำลังมาค่ะ!",
}

DX = {
 "case_01": "Digoxin toxicity", "case_02_fluids": "Severe hypovolemic hyponatremia",
 "case_03_cardiac": "Cardiac arrest (VF)", "case_04_svt": "Unstable SVT",
 "case_05_asthma": "Severe asthma exacerbation", "case_06_trauma": "Multiple trauma with hemorrhagic shock",
 "case_07": "Anaphylaxis", "case_07_vip": "Suspected ACS", "case_08": "Tension pneumothorax",
 "case_09": "DKA, new-onset T1DM", "case_10": "Opioid overdose", "case_11": "Ruptured ectopic pregnancy",
 "case_12": "Dengue shock syndrome", "case_13": "Organophosphate poisoning",
 "case_14": "Pelvic fracture with hemorrhagic shock", "case_15": "Common cold ไม่ใช่เคส emergency",
 "case_16": "Russell's viper bite (งูแมวเซา)", "case_17": "Severe falciparum malaria",
 "case_18": "Postpartum hemorrhage", "case_19": "Drowning with hypoxic brain injury",
 "case_20": "Traumatic hand amputation", "case_21": "Exertional heat stroke",
 "case_22": "Leptospirosis with pulmonary hemorrhage", "case_23": "Reactive lymph node กับ health anxiety",
 "case_24": "Bleeding after abdominoplasty", "case_25": "Fat embolism syndrome",
 "case_26": "Inferior STEMI with RV infarction", "case_27": "GERD กับความกังวล ไม่ใช่ emergency",
 "case_28": "Generalized tetanus", "case_29": "Methanol poisoning", "case_30": "Paraquat poisoning",
 "case_31": "Intussusception", "case_32": "Severe RSV bronchiolitis", "case_33": "GBS sepsis with meningitis",
 "case_34": "Eclampsia with HELLP syndrome", "case_35": "Amniotic fluid embolism", "case_36": "Massive PE",
 "case_37": "Type A aortic dissection", "case_38": "Variceal bleeding",
 "case_39": "Necrotizing fasciitis (Vibrio vulnificus)", "case_40": "Thyroid storm", "case_41": "Myxedema coma",
 "case_42": "Status epilepticus จาก neurocysticercosis", "case_43": "Chronic back pain กับ opioid use disorder",
 "case_44": "High-voltage electrical injury", "case_45": "Major burn with inhalation injury",
 "case_46": "Stimulant toxicity with hyperthermia", "case_47": "Acute ischemic stroke",
 "case_48": "Meningococcemia", "case_49": "Crush syndrome",
 "case_50": "Mass casualty triage: splenic injury กับ chest trauma",
}

FIX = [
 ("ฉันเจอเขานอนอยู่ที่พื้นห้องครัว ขวดยาว่างเปล่าเลย", "ป้าเจอลุงเขานอนอยู่ที่พื้นครัว ขวดยาก็ว่างเปล่าเลยหมอ"),
 ("เขากุมหน้าอกแล้วล้มลง คลำชีพจรไม่ได้ค่ะ", "กุมหน้าอกแล้วล้มลงเลยค่ะ คลำ pulse ไม่ได้"),
 ("ไข้ลดตั้งแต่เช้าแล้ว แต่ตอนนี้ตัวเย็นแล้วก็ซึมมากเลย", "ไข้ลงตั้งแต่เช้าแล้วนะหมอ แต่ตอนนี้ตัวเย็น ซึมมากเลย"),
 ("ตั้งครรภ์ 34 สัปดาห์ ชักที่บ้าน แล้วชักอีกรอบบนรถค่ะ", "GA 34 wk ค่ะ ชักที่บ้าน แล้วชักอีกรอบบนรถ"),
 ("พยาบาลบนรถพยาบาล", "พยาบาล EMS"),
 ("ดีใจที่ผมล้มในห้องรอตรวจของพวกคุณ", "ดีใจที่ผมล้มในห้องรอตรวจของพวกหมอ"),
 ("เลขาส่งกาแฟมาให้เวรดึกของคุณ", "เลขาส่งกาแฟมาให้หมอไว้กินตอนเวรดึก"),
 ("ตอนนี้ทางเข้าวีไอพีต้องผ่านแผนกฉุกเฉินของคุณก่อน", "ตอนนี้ทางเข้า VIP ต้องผ่าน ER ของหมอก่อน"),
 ("เพทิดีนช่วยได้ อย่างอื่นไม่ช่วยเลย", "ขอ pethidine เถอะ ตัวอื่นไม่ช่วยเลย"),
 ("ขอทำ PET scan คืนนี้เลยได้ไหมคะ", "ขอทำ PET scan คืนนี้เลยได้ไหมคะ"),
 ("ปากกาอะดรีนาลีน", "ปากกา adrenaline"),
 ("ตอนนี้ผมใช้เมทาโดน", "ตอนนี้ผมกิน methadone"),
 ("ผมไปคลินิกเมทาโดนทุกเช้า", "ผมไปคลินิก methadone ทุกเช้า"),
 ("ท้องหน้าจะกินแอสไพรินตั้งแต่เนิ่นๆ", "ท้องหน้าจะกิน aspirin ตั้งแต่เนิ่นๆ"),
 ("ปากกาอินซูลินเป็นสีชมพู", "ปากกา insulin เป็นสีชมพู"),
 ("หมอบอกว่าไตผมกลับมาทำงานเหมือนไม่เคยเป็นอะไร", "หมอบอกว่าไตกลับมาทำงานเหมือนไม่เคยเป็นอะไรเลย"),
]

def set_field(block, field, value):
    pat = re.compile(r'(\b' + field + r': l\("(?:[^"\\]|\\.)*", ")((?:[^"\\]|\\.)*)("\))')
    new, n = pat.subn(lambda m: m.group(1) + value.replace('"', '\\"') + m.group(3), block, count=1)
    assert n == 1, (field, block[:80])
    return new

out = []
for m in re.finditer(r'  (case_[a-z0-9_]+): \{\n(.*?)\n  \},\n', s, re.S):
    pass
def repl(m):
    cid, body = m.group(1), m.group(2)
    if cid in PAGER: body = set_field(body, "pager", PAGER[cid])
    if cid in DX: body = set_field(body, "dx", DX[cid])
    return f"  {cid}: {{\n{body}\n  }},\n"
s2, n = re.subn(r'  (case_[a-z0-9_]+): \{\n(.*?)\n  \},\n', repl, s, flags=re.S)
assert n == 51, n
for a, b in FIX:
    assert a in s2, a
    s2 = s2.replace(a, b)
s2 = s2.replace("const yrs = (n: number) => l(String(n), String(n));", "const yrs = (n: number) => l(String(n), `${n} ปี`);")
P.write_text(s2)
print("patched", n)
