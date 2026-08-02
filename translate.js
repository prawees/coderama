const fs = require('fs');

const thDict = {
  "Triage": "จุดคัดกรอง",
  "28yo M found confused at home with empty pill bottles nearby.": "ชาย 28 ปี พบที่บ้านในสภาพสับสน มีขวดยาเปล่าอยู่ใกล้ๆ",
  "Patient appears disoriented, sweating profusely.": "ผู้ป่วยมีอาการสับสน เหงื่อออกมาก",
  "Administer Naloxone": "ให้ยา Naloxone",
  "Check Glucose": "ตรวจระดับน้ำตาล (Glucose)",
  "Assess ABCs": "ประเมิน ABCs",
  "Glucose is normal.": "ระดับน้ำตาลปกติ",
  "Patient becomes combative.": "ผู้ป่วยเริ่มก้าวร้าว",
  "Administer Sedation": "ให้ยาระงับประสาท",
  "Airway is secure, breathing is shallow.": "ทางเดินหายใจปกติ แต่หายใจตื้น",
  "Naloxone administered. Patient wakes up agitated.": "ให้ Naloxone แล้ว ผู้ป่วยตื่นขึ้นมาและกระสับกระส่าย",
  "Call for help": "ขอความช่วยเหลือ",
  "Patient stabilized. Good job.": "ผู้ป่วยอาการคงที่ ทำได้ดีมาก",
  
  "45yo F presents with severe dizziness, vomiting, and diarrhea for 3 days.": "หญิง 45 ปี มาด้วยอาการวิงเวียนศีรษะรุนแรง อาเจียน และท้องเสียมา 3 วัน",
  "Patient looks pale, skin turgor is poor, tachycardic.": "ผู้ป่วยดูซีด ความยืดหยุ่นผิวหนังแย่ หัวใจเต้นเร็ว",
  "Start IV NS 1L bolus": "ให้ IV Normal Saline 1L bolus",
  "Give Oral Rehydration": "ให้เกลือแร่กิน",
  "Check Labs": "ส่งตรวจ Labs",
  "IV started. BP improving.": "ให้ IV แล้ว ความดันดีขึ้น",
  "Patient cannot tolerate PO, vomits immediately.": "ผู้ป่วยกินไม่ได้ อาเจียนทันที",
  "Give Anti-emetic": "ให้ยาแก้คลื่นไส้อาเจียน",
  "BP drops further. Patient is lethargic.": "ความดันตกลงอีก ผู้ป่วยซึม",
  "Start 2nd IV bolus": "ให้ IV bolus ขวดที่ 2",
  "Patient stabilized. Fluids replaced successfully.": "ผู้ป่วยอาการคงที่ ชดเชยสารน้ำสำเร็จ",
  
  "60yo M collapses holding his chest.": "ชาย 60 ปี หมดสติและจับที่หน้าอก",
  "Patient is pulseless. Monitor shows V-Fib.": "ผู้ป่วยไม่มีชีพจร มอนิเตอร์แสดง V-Fib",
  "Start CPR & Defibrillate": "เริ่มทำ CPR & Defibrillate",
  "Give Epinephrine": "ให้ยา Epinephrine",
  "Check Pulse": "คลำชีพจร",
  "Defibrillation delivered. Rhythm is still V-Fib.": "ช็อกไฟฟ้าแล้ว จังหวะหัวใจยังเป็น V-Fib",
  "Continue CPR, Give Epi": "ทำ CPR ต่อ, ให้ Epi",
  "Give Amiodarone 300mg": "ให้ยา Amiodarone 300mg",
  "ROSC achieved. Patient has a pulse.": "ROSC สำเร็จ ผู้ป่วยมีชีพจรแล้ว",
  "Begin Post-Cardiac Arrest Care": "เริ่มการดูแลหลังหัวใจหยุดเต้น",
  "Epinephrine given.": "ให้ Epinephrine แล้ว",
  "Still V-Fib. Need to defibrillate.": "ยังคงเป็น V-Fib ต้อง Defibrillate",
  "CPR continued...": "ทำ CPR ต่อเนื่อง...",
  "Administering...": "กำลังให้ยา..."
};

const files = ['case_01', 'case_02_fluids', 'case_03_cardiac'];

files.forEach(file => {
  const data = JSON.parse(fs.readFileSync(`public/locales/en/${file}.json`, 'utf8'));
  
  if (thDict[data.title]) data.title = thDict[data.title];
  if (thDict[data.initialNarrative]) data.initialNarrative = thDict[data.initialNarrative];
  
  if (Array.isArray(data.managementGraph?.nodes)) {
    data.managementGraph.nodes.forEach(node => {
      if (node.data?.label && thDict[node.data.label]) node.data.label = thDict[node.data.label];
      if (node.data?.narrative && thDict[node.data.narrative]) node.data.narrative = thDict[node.data.narrative];
    });
  } else if (data.managementGraph?.nodes) {
    Object.values(data.managementGraph.nodes).forEach(node => {
      if (node.narrative && thDict[node.narrative]) node.narrative = thDict[node.narrative];
      if (node.options) {
        Object.values(node.options).forEach(opt => {
          if (opt.text && thDict[opt.text]) opt.text = thDict[opt.text];
        });
      }
    });
  }

  fs.writeFileSync(`public/locales/th/${file}.json`, JSON.stringify(data, null, 2));
});

console.log("Translations complete.");
