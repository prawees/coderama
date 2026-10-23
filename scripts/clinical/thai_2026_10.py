"""
Thai guideline alignment, October 2026. Run from the repo root:
    python3 scripts/clinical/thai_2026_10.py

Sources, preferring Ramathibodi and Siriraj:
- Ramathibodi Poison Center protocols: methanol algorithm, oral ethanol table,
  organophosphate and carbamate, paraquat adult treatment, status epilepticus,
  cooling techniques, and the centre's antidote list
- Ramathibodi obstetric checklist for postpartum haemorrhage (revised 2022)
- Siriraj anaesthesia protocol for anaphylaxis
- Department of Medical Services dengue guideline (2023 to 2024), Ramathibodi paediatric DHF guideline
- Ramathibodi internal medicine handbook, snakebite chapter (already matched: 3 vials, repeat 6 hourly)
"""
from casefile import edit


def doses(n, mapping):
    n["data"]["doseMap"] = mapping


# ------------------------------------------------------------ dengue (case_12)
c = edit("en", "case_12")
n = c.node("req2")
n["data"]["label"] = "Dextrose isotonic bolus for compensated shock"
n["data"]["choice"] = "5%D/NSS 500 mL over 1 to 2 hours"
n["data"]["actions"] = ["5%D/NSS bolus", "Haematocrit before and after"]
doses(n, {"5%D/NSS bolus": "500 mL over 1 to 2 hours in an adult, 10 mL/kg in a child, as in the Thai Department of Medical Services dengue guideline. Thai wards use dextrose-containing isotonic fluid such as 5%D/NSS. Reassess haematocrit, pulse pressure and urine output after it."})
for x in n["data"]["distractors"]:
    if x["label"].startswith("Hold all fluids"):
        x["feedback"] = "He is in compensated shock now. He needs an isotonic bolus, then a careful step-down."
n = c.node("req4")
n["data"]["actions"] = ["Step down 250, 150, 100, 80, then 40 mL/h", "Hourly urine output", "Haematocrit every 4 to 6 hours", "Strict fluid balance chart"]
doses(n, {
    "Step down 250, 150, 100, 80, then 40 mL/h": "The adult step-down in the Thai guideline, one step at a time as vital signs and haematocrit allow. Aim for urine output of 0.5 mL/kg/h. Across the 24 to 48 hour leak the total should stay near maintenance plus 5% deficit, the M+5% Thai wards are taught to respect.",
    "Haematocrit every 4 to 6 hours": "The critical phase interval in the Thai guideline. A rising haematocrit means more leak. A falling haematocrit with unstable vital signs means hidden bleeding.",
})
c.save()

# ------------------------------------------------------------ organophosphate (case_13)
c = edit("en", "case_13")
n = c.node("req1")
for x in n["data"]["distractors"]:
    if x["label"].startswith("Gastric lavage"):
        x["feedback"] = "Not before the airway and the skin. The Ramathibodi protocol allows lavage only within an hour of a swallowed dose, once the airway is safe."
n = c.node("req3")
n["data"]["choice"] = "Atropine 1.8-3 mg IV, doubling every 5 minutes"
doses(n, {"Atropine IV bolus": "1.8 to 3 mg IV (3 to 5 ampoules of 0.6 mg). Reassess every 5 minutes and double the dose until the chest is clear, secretions are dry, heart rate is above 80 and systolic above 80. This follows the Ramathibodi Poison Center protocol. Totals over 50 mg are common."})
n = c.node("req4")
doses(n, {
    "Pralidoxime IV loading dose": "1 to 2 g IV over 30 to 60 minutes in an adult, 30 mg/kg in a child (Ramathibodi Poison Center protocol)",
    "Pralidoxime infusion": "0.5 to 1 g/h until the cholinergic signs settle",
})
n = c.node("req5")
n["data"]["doseMap"]["ICU admission with atropine infusion"] = "Start at 10 to 20% of the total loading dose per hour, usually 0.5 to 1.5 mg/h, and reassess hourly. Intermediate syndrome causes respiratory failure 24 to 96 hours after apparent recovery."
c.save()

# ------------------------------------------------------------ postpartum haemorrhage (case_18)
c = edit("en", "case_18")
n = c.node("req3")
n["data"]["actions"] = ["Oxytocin infusion", "Methylergonovine", "Misoprostol", "Tranexamic acid IV"]
doses(n, {
    "Oxytocin infusion": "10 to 40 units in 500 to 1000 mL, run continuously (Ramathibodi postpartum haemorrhage protocol)",
    "Methylergonovine": "0.2 mg IM or slow IV, repeat every 15 minutes up to 5 doses. Not with hypertension or pre-eclampsia.",
    "Misoprostol": "800 mcg sublingually or rectally",
    "Tranexamic acid IV": "1 g slowly at 1 mL per minute, within 3 hours of delivery. Repeat once after 30 minutes if she is still bleeding.",
})
for x in n["data"]["distractors"]:
    if x["label"].startswith("Ergometrine"):
        x["label"] = "Methylergonovine as a rapid IV push first"
        x["feedback"] = "Oxytocin comes first. Methylergonovine goes IM or slowly IV, never as a rapid push, and not at all with hypertension."
n = c.node("out1")
n["data"]["narrative"] = n["data"]["narrative"].replace("after ergometrine", "after methylergonovine")
n = c.node("req5")
n["data"]["doseMap"]["Examination under anaesthesia"] = "The Ramathibodi protocol moves to theatre when the uterus has not responded within 15 minutes, or vital signs stay abnormal."
c.save()

# ------------------------------------------------------------ heat stroke (case_21)
c = edit("en", "case_21")
n = c.node("req2")
n["data"]["label"] = "Active cooling, stopping at about 38 C"
n["data"]["actions"] = ["Evaporative cooling: strip, mist and fan", "Cold water immersion if a tub is ready", "Ice packs to neck, axillae and groin", "Cold IV fluids"]
doses(n, {
    "Evaporative cooling: strip, mist and fan": "The first method in the Ramathibodi cooling protocol. Mist the skin with water at about 15 C and keep air moving over it.",
    "Cold water immersion if a tub is ready": "The fastest option for exertional heat stroke, about 0.2 C per minute. Water below 14 C, with monitoring and a defibrillator at hand.",
    "Ice packs to neck, axillae and groin": "Stop all active cooling when the rectal temperature reaches about 38 C, so he does not overshoot into hypothermia.",
    "Cold IV fluids": "Normal saline at 4 C, 20 mL/kg. No antipyretics: paracetamol and NSAIDs do not work in heat stroke because the hypothalamic set point is normal, and both worsen the liver and kidney injury.",
})
for x in n["data"]["distractors"]:
    if x["label"].startswith("Keep cooling"):
        x["feedback"] = "Overshoot causes hypothermia. Stop active cooling at about 38 C."
n = c.node("out1")
n["data"]["label"] = "Cooled to 38.1 C in 34 minutes"
n["data"]["narrative"] = n["data"]["narrative"].replace("Cooling stops at 38.4 C.", "Cooling stops at 38.1 C.")
n["data"]["vitalChanges"]["temp"] = 38.1
c.save()

# ------------------------------------------------------------ methanol (case_29)
c = edit("en", "case_29")
n = c.node("req2")
n["data"]["choice"] = "Ethanol by NG tube, or fomepizole if stocked"
n["data"]["actions"] = ["Ethanol by nasogastric tube", "Or fomepizole IV if available"]
doses(n, {
    "Ethanol by nasogastric tube": "Ramathibodi Poison Center regimen: a 37% spirit diluted 1:1 with water. Load 800 mg/kg, then 80 to 130 mg/kg/h (150 in regular drinkers), aiming for a blood ethanol of 100 mg/dL. For a 60 kg man that is about 165 mL of spirit with 165 mL of water, then about 23 mL with 23 mL each hour.",
    "Or fomepizole IV if available": "15 mg/kg over 30 minutes, then 10 mg/kg every 12 hours. No sedation and no level monitoring, but it is not on the poison centre's antidote list and few Thai hospitals stock it.",
})
for x in n["data"]["distractors"]:
    if x["label"] == "Give activated charcoal":
        x["feedback"] = "Charcoal does not bind alcohols. Block alcohol dehydrogenase with ethanol or fomepizole."
n = c.node("req3")
n["data"]["doseMap"]["Folinic acid IV"] = "1 mg/kg, maximum 50 mg, IV every 4 hours. Speeds formate breakdown to carbon dioxide and water."
n = c.node("req4")
doses(n, {
    "Emergency haemodialysis": "Ramathibodi Poison Center thresholds: visual impairment, more than 30 mL swallowed, methanol above 50 mg/dL, or pH below 7.25. He meets three. Dialysis removes both methanol and formate, which nothing else does.",
    "Continue the alcohol dehydrogenase blocker during dialysis": "Dialysis clears ethanol too. Raise the ethanol to 250 to 350 mg/kg/h during the run, or give fomepizole every 4 hours.",
})
for x in n["data"]["distractors"]:
    if x["label"].startswith("Stop fomepizole"):
        x["label"] = "Stop the ethanol once dialysis starts"
        x["feedback"] = "Methanol is still being metabolised and dialysis clears ethanol quickly. Increase the ethanol during the run."
c.save()

# ------------------------------------------------------------ paraquat (case_30)
c = edit("en", "case_30")
n = c.node("req3")
n["data"]["label"] = "Decontamination and the poison centre regimen"
n["data"]["choice"] = "Fuller's earth, haemoperfusion, the Rama regimen"
n["data"]["actions"] = ["Fuller's earth or activated charcoal", "Charcoal haemoperfusion within 4 hours", "Cyclophosphamide and dexamethasone", "Vitamin C and vitamin E", "Analgesia for the oropharyngeal burns", "Antiemetic"]
doses(n, {
    "Fuller's earth or activated charcoal": "15% Fuller's earth 1000 mL or activated charcoal 100 g, if the airway is safe. Repeat it if she vomits the first dose (Ramathibodi Poison Center protocol).",
    "Charcoal haemoperfusion within 4 hours": "Run it for 6 to 8 hours. She arrived at 3 hours, so the window is open but closing.",
    "Cyclophosphamide and dexamethasone": "Cyclophosphamide 5 mg/kg/day IV in divided doses with dexamethasone 10 mg IV every 8 hours. The evidence for benefit is limited, and she should hear that honestly.",
    "Vitamin C and vitamin E": "Vitamin C 6 g IV over 24 hours. Vitamin E 800 IU four times a day.",
    "Analgesia for the oropharyngeal burns": "Titrated opioid. The ulceration is severely painful and undertreating it is common.",
})
n = c.node("out1")
n["data"]["narrative"] = "The dithionite test is dark blue and creatinine climbs from 1.1 to 4.1 mg/dL over 24 hours, despite haemoperfusion and the full regimen. A dark blue test usually means a fatal dose. Being honest about that now is part of the treatment."
c.save()

# ------------------------------------------------------------ myxoedema coma (case_41)
c = edit("en", "case_41")
n = c.node("req3")
n["data"]["label"] = "Thyroid hormone replacement, by vein or by tube"
n["data"]["choice"] = "Levothyroxine 200-400 mcg, IV or by NG tube"
n["data"]["actions"] = ["Levothyroxine loading dose", "Then 50-100 mcg daily", "Consider adding liothyronine in severe cases"]
doses(n, {
    "Levothyroxine loading dose": "200 to 400 mcg, less in the elderly and in ischaemic heart disease. Give it IV if your hospital stocks the injection. Many Thai hospitals stock only tablets, so crush them down a nasogastric tube. Absorption is slower, but it works.",
    "Then 50-100 mcg daily": "IV, or by tube at a slightly higher dose because gut absorption is incomplete.",
    "Consider adding liothyronine in severe cases": "5 to 20 mcg then 2.5 to 10 mcg every 8 hours, if available. Faster onset, but more arrhythmia in an elderly heart.",
})
for x in n["data"]["distractors"]:
    if x["label"].startswith("Oral levothyroxine 50"):
        x["feedback"] = "A maintenance dose with no loading is far too little and too slow. Give a 200 to 400 mcg loading dose, by vein if you have it or down a nasogastric tube if you do not."
c.save()

# ------------------------------------------------------------ status epilepticus (case_42)
c = edit("en", "case_42")
n = c.node("req2")
n["data"]["choice"] = "Diazepam 10 mg IV, repeat once at 5 minutes"
n["data"]["actions"] = ["Diazepam IV or midazolam IM", "Repeat once after 5 minutes if seizures continue", "Thiamine if alcohol is a possibility"]
doses(n, {
    "Diazepam IV or midazolam IM": "Diazepam 0.15 to 0.2 mg/kg IV, maximum 10 mg a dose, or midazolam 10 mg IM without IV access (Ramathibodi status epilepticus protocol). He has had one prehospital dose, so give a full second dose now.",
    "Repeat once after 5 minutes if seizures continue": "Two doses at most. Underdosing benzodiazepines, then giving a third and fourth instead of moving on, is the most common error in status.",
})
n = c.node("req3")
doses(n, {
    "Levetiracetam IV": "60 mg/kg, maximum 4500 mg, over 10 minutes. Levetiracetam, valproate and phenytoin worked equally well in the ESETT trial, so choose on side effects and what is on the shelf.",
    "Or sodium valproate IV": "40 mg/kg, maximum 3000 mg",
    "Or phenytoin IV with cardiac monitoring": "15 to 20 mg/kg at no more than 50 mg/min with continuous ECG. Hypotension and arrhythmia if run fast, tissue necrosis if it leaks. His level is undetectable, so treat him as phenytoin naive.",
})
c.save()

# ------------------------------------------------------------ anaphylaxis adjuncts (case_07)
c = edit("en", "case_07")
n = c.node("req6")
for x in n["data"]["distractors"]:
    if x["label"].startswith("Skip all adjuncts"):
        x["feedback"] = "Chlorpheniramine helps the itch and urticaria once she is stable. Steroids do not treat the acute reaction, but Siriraj's protocol still adds hydrocortisone 200 mg, and with her asthma it is reasonable."
c.save()

# ------------------------------------------------------------ opioids: what Thailand actually offers (case_10, case_43)
c = edit("en", "case_10")
n = c.node("req5")
n["data"]["label"] = "Discharge planning with treatment linkage and an overdose plan"
n["data"]["choice"] = "Methadone clinic referral and an overdose plan"
n["data"]["actions"] = ["Methadone maintenance clinic referral", "Naloxone through a harm reduction programme", "Hepatitis C and HIV screening offer", "Written overdose advice for him and his brother"]
doses(n, {
    "Methadone maintenance clinic referral": "Many Thai government hospitals run methadone maintenance clinics. Buprenorphine programmes are not generally available in Thailand.",
    "Naloxone through a harm reduction programme": "Take-home naloxone is not routine in Thai hospitals, but outreach programmes for people who inject drugs carry it.",
})
for x in n["data"]["distractors"]:
    if x["label"].startswith("Discharge with a lecture"):
        x["feedback"] = "Recent rehab discharge means lost tolerance and very high overdose risk. Link him to a methadone clinic and give an overdose plan."
n = c.node("out3")
n["data"]["narrative"] = "After 12 hours he is off the infusion, breathing normally, and his creatine kinase is falling on fluids. He leaves with a methadone clinic appointment in two days. His brother knows the recovery position and has the number of the outreach team, who carry naloxone."
c.save()

c = edit("en", "case_43")
n = c.node("req4")
n["data"]["actions"] = ["Refer to a methadone maintenance clinic", "Refer to a chronic pain clinic", "Connect him with a harm reduction programme", "Suggest a single named prescriber to consolidate his care"]
dm = n["data"]["doseMap"]
dm.pop("Offer a take-home naloxone kit", None)
dm["Connect him with a harm reduction programme"] = "He is using opioids from several sources and is at real overdose risk. Outreach programmes can supply naloxone. Offering it is not an accusation, it is the same logic as a seatbelt."
for x in n["data"]["distractors"]:
    if x["label"] == "Discharge with no referral":
        x["feedback"] = "He likely has opioid use disorder. Offer methadone and a harm reduction contact."
n = c.node("out2")
n["data"]["narrative"] = "He leaves without an injection, with a pain clinic referral, a harm reduction contact and a methadone clinic appointment for the following week. He goes. Ten weeks later he is on methadone, has not been back to any emergency department, and the pain is no worse than it was. What worked was nineteen minutes and a referral, not an analgesic."
c.save()

# ------------------------------------------------------------ malaria discharge (case_17)
c = edit("en", "case_17")
n = c.node("out3")
n["data"]["narrative"] = "He completes a full oral artemisinin combination course, plus a single low dose of primaquine (0.25 mg/kg) so he cannot infect mosquitoes, which matters in a district working toward elimination. Discharged day 7 with written return advice in Burmese for delayed haemolysis. The plantation is notified so the other twelve workers can be screened. Two of them are positive and well."
c.save()

# ------------------------------------------------------------ digoxin antidote access (case_01, both languages)
for lang, note in (("en", " Digoxin Fab is on the Ramathibodi Poison Center antidote list. Call 1367 to find the nearest vials."),
                   ("th", " Digoxin Fab อยู่ในรายการยาต้านพิษของศูนย์พิษวิทยารามาธิบดี โทร 1367 เพื่อหาโรงพยาบาลที่มียาใกล้ที่สุด")):
    c = edit(lang, "case_01")
    n = c.node("req2")
    key = "Digoxin immune Fab IV"
    if note.strip() not in n["data"]["doseMap"][key]:
        n["data"]["doseMap"][key] += note
    c.save()

print("thai alignment applied")
