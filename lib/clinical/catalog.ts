/**
 * CODE RAMA - Clinical catalog.
 *
 * Structured the way Thai medical schools teach the acutely ill patient:
 *   1. Primary survey (ABCDE), each letter its own group.
 *   2. Secondary survey (head-to-toe, system based).
 * Terminology follows standard undergraduate teaching (ATLS / ALS / OSCE
 * mark sheets). Thai labels keep the English clinical term, as used on the ward.
 */

export type ExamGroup = 'A' | 'B' | 'C' | 'D' | 'E' | 'SEC';
export type BodyRegion = 'head' | 'neck' | 'chest' | 'abdomen' | 'pelvis' | 'upperLimbs' | 'lowerLimbs' | 'back';

export interface ExamItem {
  id: string;
  group: ExamGroup;
  region: BodyRegion;
  en: string;
  th: string;
  /** Legacy case "system" labels whose finding this item reveals. */
  systems: RegExp;
  /** Default text when the case has no specific finding for this item. */
  normal: { en: string; th: string };
  seconds: number;
}

export const EXAM_GROUPS: { id: ExamGroup; en: string; th: string }[] = [
  { id: 'A', en: 'A: Airway (with C-spine control)', th: 'A: Airway (ทางเดินหายใจ + C-spine)' },
  { id: 'B', en: 'B: Breathing', th: 'B: Breathing (การหายใจ)' },
  { id: 'C', en: 'C: Circulation', th: 'C: Circulation (ระบบไหลเวียน)' },
  { id: 'D', en: 'D: Disability (neurological)', th: 'D: Disability (ระบบประสาท)' },
  { id: 'E', en: 'E: Exposure', th: 'E: Exposure (ตรวจทั่วร่างกาย)' },
  { id: 'SEC', en: 'Secondary survey', th: 'Secondary survey (ตรวจละเอียดรายระบบ)' },
];

export const EXAM_ITEMS: ExamItem[] = [
  // ── A ──────────────────────────────────────────────────────────────
  { id: 'a_patency', group: 'A', region: 'head', en: 'Airway patency (look, listen, feel)', th: 'ประเมิน airway patency (look, listen, feel)', systems: /airway|general|hent|heent/i, normal: { en: 'Talking in full sentences. Airway patent. No stridor, gurgling or snoring.', th: 'พูดได้เป็นประโยค airway patent ไม่มี stridor หรือเสียง gurgling' }, seconds: 10 },
  { id: 'a_oral', group: 'A', region: 'head', en: 'Inspect oropharynx (secretions, foreign body, oedema)', th: 'ตรวจช่องปากและคอหอย (secretion, foreign body, oedema)', systems: /hent|heent|airway|mouth/i, normal: { en: 'Oropharynx clear. No secretions, blood, foreign body or angio-oedema.', th: 'ช่องปากสะอาด ไม่มี secretion เลือด สิ่งแปลกปลอม หรือ angio-oedema' }, seconds: 15 },
  { id: 'a_cspine', group: 'A', region: 'neck', en: 'C-spine assessment', th: 'ประเมิน C-spine', systems: /spine|neck|trauma/i, normal: { en: 'No midline cervical tenderness. No mechanism suggesting C-spine injury.', th: 'ไม่กดเจ็บแนวกลางกระดูกคอ ไม่มีกลไกการบาดเจ็บที่สงสัย C-spine injury' }, seconds: 15 },

  // ── B ──────────────────────────────────────────────────────────────
  { id: 'b_inspect', group: 'B', region: 'chest', en: 'Inspection: work of breathing, accessory muscles, cyanosis', th: 'ดู work of breathing, accessory muscle, cyanosis', systems: /respir|chest|lung/i, normal: { en: 'No respiratory distress. No accessory muscle use. No central cyanosis.', th: 'ไม่มี respiratory distress ไม่ใช้ accessory muscle ไม่มี central cyanosis' }, seconds: 10 },
  { id: 'b_trachea', group: 'B', region: 'neck', en: 'Tracheal position', th: 'ตำแหน่ง trachea', systems: /respir|trachea|chest/i, normal: { en: 'Trachea central.', th: 'Trachea อยู่ตรงกลาง' }, seconds: 10 },
  { id: 'b_expansion', group: 'B', region: 'chest', en: 'Palpation: chest expansion', th: 'คลำ chest expansion', systems: /respir|chest/i, normal: { en: 'Chest expansion equal bilaterally.', th: 'Chest expansion เท่ากันสองข้าง' }, seconds: 15 },
  { id: 'b_percussion', group: 'B', region: 'chest', en: 'Percussion note', th: 'เคาะปอด (percussion)', systems: /respir|chest/i, normal: { en: 'Resonant throughout both lung fields.', th: 'Resonant ทั้งสองข้าง' }, seconds: 20 },
  { id: 'b_auscultate', group: 'B', region: 'chest', en: 'Auscultation: breath sounds, added sounds', th: 'ฟังปอด: breath sounds, added sounds', systems: /respir|chest|lung/i, normal: { en: 'Vesicular breath sounds bilaterally. No crackles or wheeze.', th: 'Vesicular breath sounds ทั้งสองข้าง ไม่มี crepitation หรือ wheeze' }, seconds: 20 },

  // ── C ──────────────────────────────────────────────────────────────
  { id: 'c_perfusion', group: 'C', region: 'upperLimbs', en: 'Peripheral perfusion: skin colour, temperature', th: 'Peripheral perfusion: สีผิว อุณหภูมิปลายมือปลายเท้า', systems: /cardio|circulat|skin|general/i, normal: { en: 'Warm and well perfused peripheries.', th: 'ปลายมือปลายเท้าอุ่น perfusion ดี' }, seconds: 10 },
  { id: 'c_crt', group: 'C', region: 'upperLimbs', en: 'Capillary refill time', th: 'Capillary refill time', systems: /cardio|circulat|perfus/i, normal: { en: 'Capillary refill time less than 2 seconds.', th: 'Capillary refill time น้อยกว่า 2 วินาที' }, seconds: 10 },
  { id: 'c_pulse', group: 'C', region: 'upperLimbs', en: 'Pulse: rate, rhythm, volume (radial and central)', th: 'ชีพจร: rate, rhythm, volume (radial และ central)', systems: /cardio|circulat|pulse/i, normal: { en: 'Radial pulse regular, good volume. Central pulse present.', th: 'Radial pulse สม่ำเสมอ volume ดี คลำ central pulse ได้' }, seconds: 15 },
  { id: 'c_jvp', group: 'C', region: 'neck', en: 'Jugular venous pressure', th: 'JVP', systems: /cardio|jvp|neck/i, normal: { en: 'JVP not raised.', th: 'JVP ไม่สูง' }, seconds: 15 },
  { id: 'c_heart', group: 'C', region: 'chest', en: 'Auscultation: heart sounds', th: 'ฟังเสียงหัวใจ', systems: /cardio|heart/i, normal: { en: 'S1 S2 normal. No murmur, no gallop, no pericardial rub.', th: 'S1 S2 ปกติ ไม่มี murmur ไม่มี gallop ไม่มี pericardial rub' }, seconds: 20 },
  { id: 'c_bleeding', group: 'C', region: 'abdomen', en: 'Look for sources of haemorrhage', th: 'หาแหล่งเลือดออก', systems: /bleed|haemorr|hemorr|trauma|abdom|skin/i, normal: { en: 'No external haemorrhage identified.', th: 'ไม่พบเลือดออกภายนอก' }, seconds: 20 },

  // ── D ──────────────────────────────────────────────────────────────
  { id: 'd_gcs', group: 'D', region: 'head', en: 'Glasgow Coma Scale (E, V, M)', th: 'Glasgow Coma Scale (E, V, M)', systems: /neuro|conscious|gcs|general/i, normal: { en: 'GCS 15 (E4 V5 M6). Alert and oriented.', th: 'GCS 15 (E4 V5 M6) รู้สึกตัวดี orientation ปกติ' }, seconds: 15 },
  { id: 'd_pupils', group: 'D', region: 'head', en: 'Pupils: size, symmetry, light reflex', th: 'รูม่านตา: ขนาด ความเท่ากัน light reflex', systems: /neuro|pupil|eye|hent|heent/i, normal: { en: 'Pupils equal, 3 mm, reactive to light bilaterally.', th: 'Pupils 3 mm เท่ากัน react to light ทั้งสองข้าง' }, seconds: 15 },
  { id: 'd_glucose', group: 'D', region: 'upperLimbs', en: 'Capillary blood glucose (DTX)', th: 'เจาะ DTX (capillary blood glucose)', systems: /glucose|dtx|sugar/i, normal: { en: 'DTX 110 mg/dL.', th: 'DTX 110 mg/dL' }, seconds: 30 },
  { id: 'd_lateral', group: 'D', region: 'lowerLimbs', en: 'Lateralising signs: limb power, tone, reflexes', th: 'Lateralising signs: motor power, tone, reflex', systems: /neuro|motor|power|limb/i, normal: { en: 'Moving all four limbs symmetrically. No focal deficit.', th: 'ขยับแขนขาได้ทั้ง 4 ข้างเท่ากัน ไม่มี focal deficit' }, seconds: 30 },
  { id: 'd_meningism', group: 'D', region: 'neck', en: 'Meningism (neck stiffness)', th: 'Meningeal signs (stiff neck)', systems: /mening|neck stiff|neuro/i, normal: { en: 'No neck stiffness. Kernig sign negative.', th: 'ไม่มี stiff neck Kernig sign ลบ' }, seconds: 15 },

  // ── E ──────────────────────────────────────────────────────────────
  { id: 'e_skin', group: 'E', region: 'chest', en: 'Full exposure: skin, rash, bruising, wounds', th: 'เปิดตรวจทั่วตัว: ผื่น จ้ำเลือด บาดแผล', systems: /skin|rash|wound|exposure/i, normal: { en: 'No rash, petechiae, bruising or wounds.', th: 'ไม่มีผื่น petechiae จ้ำเลือด หรือบาดแผล' }, seconds: 20 },
  { id: 'e_abdomen', group: 'E', region: 'abdomen', en: 'Abdomen: inspection, palpation (guarding, rebound)', th: 'ตรวจท้อง: ดู คลำ (guarding, rebound tenderness)', systems: /abdom|gi|gastro/i, normal: { en: 'Abdomen soft, non-tender. No guarding or rebound. No organomegaly.', th: 'ท้องนุ่ม ไม่กดเจ็บ ไม่มี guarding หรือ rebound ไม่มี organomegaly' }, seconds: 30 },
  { id: 'e_limbs', group: 'E', region: 'lowerLimbs', en: 'Extremities: oedema, calf tenderness, deformity', th: 'แขนขา: บวม กดเจ็บน่อง ผิดรูป', systems: /extrem|limb|oedema|edema|musculo|skin/i, normal: { en: 'No peripheral oedema. Calves soft, non-tender. No deformity.', th: 'ไม่มี pitting oedema น่องไม่กดเจ็บ ไม่มีผิดรูป' }, seconds: 20 },
  { id: 'e_logroll', group: 'E', region: 'back', en: 'Log roll: back and spine', th: 'Log roll ตรวจหลังและกระดูกสันหลัง', systems: /back|spine|trauma/i, normal: { en: 'No spinal step or tenderness. Back unremarkable.', th: 'ไม่มี step-off หรือกดเจ็บแนวกระดูกสันหลัง' }, seconds: 40 },

  // ── Secondary survey ──────────────────────────────────────────────
  { id: 's_general', group: 'SEC', region: 'head', en: 'General appearance', th: 'ลักษณะทั่วไป (general appearance)', systems: /general/i, normal: { en: 'Comfortable at rest.', th: 'ดูสบายดีขณะพัก' }, seconds: 10 },
  { id: 's_heent', group: 'SEC', region: 'head', en: 'HEENT (pallor, jaundice, mucosa)', th: 'HEENT (ซีด ตัวเหลือง mucosa)', systems: /hent|heent|eye|ent/i, normal: { en: 'No pallor or jaundice. Mucous membranes moist.', th: 'ไม่ซีด ไม่เหลือง mucosa ชุ่มชื้น' }, seconds: 20 },
  { id: 's_pelvis', group: 'SEC', region: 'pelvis', en: 'Pelvis and genitourinary', th: 'ตรวจเชิงกรานและระบบทางเดินปัสสาวะ', systems: /pelvi|genit|uro|renal/i, normal: { en: 'Pelvis stable. No genitourinary abnormality.', th: 'Pelvis stable ไม่พบความผิดปกติระบบทางเดินปัสสาวะ' }, seconds: 30 },
];

export const REGION_LABEL: Record<BodyRegion, { en: string; th: string }> = {
  head: { en: 'Head and face', th: 'ศีรษะและใบหน้า' },
  neck: { en: 'Neck', th: 'คอ' },
  chest: { en: 'Chest', th: 'ทรวงอก' },
  abdomen: { en: 'Abdomen', th: 'ท้อง' },
  pelvis: { en: 'Pelvis', th: 'เชิงกราน' },
  upperLimbs: { en: 'Hands and arms', th: 'มือและแขน' },
  lowerLimbs: { en: 'Legs', th: 'ขา' },
  back: { en: 'Back', th: 'หลัง' },
};

// ─── History taking (Porames categories + standard clerking headings) ──────
export type HistoryCategory = 'signs_symptoms' | 'past_history' | 'medication' | 'allergy' | 'family_history' | 'socioeconomics';

export const HISTORY_HEADINGS: { id: HistoryCategory; en: string; th: string }[] = [
  { id: 'signs_symptoms', en: 'Presenting complaint and HPI', th: 'อาการสำคัญและประวัติปัจจุบัน (CC / PI)' },
  { id: 'past_history', en: 'Past medical history', th: 'ประวัติอดีต (PMH)' },
  { id: 'medication', en: 'Drug history', th: 'ประวัติการใช้ยา (DH)' },
  { id: 'allergy', en: 'Allergies', th: 'ประวัติแพ้ยา / แพ้อาหาร' },
  { id: 'family_history', en: 'Family history', th: 'ประวัติครอบครัว (FH)' },
  { id: 'socioeconomics', en: 'Social history', th: 'ประวัติส่วนตัวและสังคม (SH)' },
];

// ─── Investigations ──────────────────────────────────────────────────────
export type InvKind = 'lab' | 'imaging' | 'ecg' | 'bedside';

export interface CatalogTest {
  name: string;
  kind: InvKind;
  category: string;
  unit?: string;
  normalRange?: string;
  /** Sim seconds until the result is available. */
  turnaround: number;
  aliases?: string[];
}

const lab = (category: string, name: string, unit: string, normalRange: string, turnaround = 420, aliases: string[] = []): CatalogTest =>
  ({ name, kind: 'lab', category, unit, normalRange, turnaround, aliases });

export const TEST_CATALOG: CatalogTest[] = [
  // Bedside / point of care
  { name: 'DTX (capillary blood glucose)', kind: 'bedside', category: 'Point of care', unit: 'mg/dL', normalRange: '70-140', turnaround: 30, aliases: ['glucose', 'blood sugar', 'dtx', 'capillary glucose'] },
  { name: '12-lead ECG', kind: 'ecg', category: 'ECG', turnaround: 60, aliases: ['ecg', 'ekg', 'electrocardiogram', '12 lead'] },
  { name: 'Arterial blood gas', kind: 'bedside', category: 'Point of care', turnaround: 180, aliases: ['abg', 'blood gas', 'vbg', 'venous blood gas', 'ph', 'pco2', 'hco3', 'base deficit'] },
  { name: 'Serum lactate (POC)', kind: 'bedside', category: 'Point of care', unit: 'mmol/L', normalRange: '0.5-2.0', turnaround: 120, aliases: ['lactate'] },
  { name: 'Urine pregnancy test', kind: 'bedside', category: 'Point of care', turnaround: 120, aliases: ['upt', 'beta hcg', 'pregnancy'] },
  { name: 'Urinalysis (dipstick)', kind: 'bedside', category: 'Point of care', turnaround: 120, aliases: ['ua', 'urine dipstick', 'urinalysis'] },
  // Haematology
  lab('Haematology', 'CBC', '', 'see report', 420, ['complete blood count', 'fbc', 'full blood count', 'haemoglobin', 'hemoglobin', 'haematocrit', 'hematocrit', 'hct', 'wbc', 'white cell', 'platelet']),
  lab('Haematology', 'Coagulation (PT/INR, aPTT)', '', 'INR 0.9-1.1', 480, ['pt', 'inr', 'aptt', 'ptt', 'coagulation', 'coag', 'fibrinogen']),
  lab('Haematology', 'Group and match', '', 'compatible', 900, ['type and screen', 'crossmatch', 'cross match', 'group and save', 'blood group']),
  lab('Haematology', 'Peripheral blood smear', '', 'normal morphology', 600, ['blood smear', 'smear', 'malaria film']),
  // Chemistry
  lab('Chemistry', 'BUN / Creatinine', 'mg/dL', 'Cr 0.6-1.2', 420, ['bun', 'creatinine', 'renal function', 'egfr', 'urea']),
  lab('Chemistry', 'Electrolytes (Na, K, Cl, HCO3)', 'mmol/L', 'Na 135-145, K 3.5-5.0', 420, ['electrolyte', 'sodium', 'potassium', 'chloride', 'bicarbonate', 'e lyte', 'elyte']),
  lab('Chemistry', 'Calcium, magnesium, phosphate', 'mg/dL', 'Ca 8.5-10.5', 420, ['calcium', 'magnesium', 'phosphate', 'phosphorus']),
  lab('Chemistry', 'Liver function test', '', 'see report', 480, ['lft', 'liver function', 'ast', 'alt', 'bilirubin', 'albumin', 'alp', 'transaminase']),
  lab('Chemistry', 'Lipase', 'U/L', '10-140', 480, ['amylase', 'lipase']),
  lab('Chemistry', 'Serum osmolality', 'mOsm/kg', '275-295', 480, ['osmolality', 'osmolar gap']),
  lab('Chemistry', 'Serum ketones', 'mmol/L', '<0.6', 300, ['ketone', 'beta hydroxybutyrate', 'bhb']),
  lab('Chemistry', 'Creatine kinase', 'U/L', '30-200', 480, ['ck', 'cpk', 'creatine kinase']),
  // Cardiac
  lab('Cardiac', 'hs-Troponin T', 'ng/L', '<14', 480, ['troponin', 'trop', 'cardiac enzyme', 'ck-mb']),
  lab('Cardiac', 'NT-proBNP', 'pg/mL', '<125', 480, ['bnp', 'nt-probnp']),
  lab('Cardiac', 'D-dimer', 'ng/mL', '<500', 480, ['d-dimer', 'ddimer']),
  // Microbiology / serology / toxicology
  lab('Microbiology', 'Blood culture x 2', '', 'no growth', 900, ['hemoculture', 'haemoculture', 'blood culture']),
  lab('Microbiology', 'Urine culture', '', 'no growth', 900, ['urine culture']),
  lab('Serology', 'Dengue NS1 Ag and IgM/IgG', '', 'negative', 600, ['dengue', 'ns1']),
  lab('Serology', 'Leptospirosis and scrub typhus serology', '', 'negative', 900, ['lepto', 'scrub typhus', 'rickettsia']),
  lab('Toxicology', 'Serum paracetamol level', 'mcg/mL', 'see nomogram', 600, ['paracetamol', 'acetaminophen']),
  lab('Toxicology', 'Serum cholinesterase', 'U/L', '>3000', 600, ['cholinesterase', 'organophosphate']),
  lab('Toxicology', 'Urine toxicology screen', '', 'negative', 600, ['tox screen', 'drug screen', 'toxicology']),
  lab('Toxicology', 'Serum ethanol level', 'mg/dL', '0', 480, ['alcohol level', 'ethanol']),
  // Imaging
  { name: 'Chest X-ray (portable AP)', kind: 'imaging', category: 'Imaging', turnaround: 240, aliases: ['cxr', 'chest x-ray', 'chest xray', 'chest film'] },
  { name: 'Plain film abdomen', kind: 'imaging', category: 'Imaging', turnaround: 300, aliases: ['abdominal x-ray', 'axr', 'film abdomen'] },
  { name: 'Pelvic X-ray', kind: 'imaging', category: 'Imaging', turnaround: 240, aliases: ['pelvis x-ray', 'pelvic film'] },
  { name: 'eFAST / POCUS', kind: 'imaging', category: 'Imaging', turnaround: 60, aliases: ['fast', 'efast', 'pocus', 'bedside ultrasound', 'ultrasound', 'echo', 'ivc'] },
  { name: 'CT brain (non-contrast)', kind: 'imaging', category: 'Imaging', turnaround: 900, aliases: ['ct brain', 'ct head', 'nc ct'] },
  { name: 'CT chest / CTPA', kind: 'imaging', category: 'Imaging', turnaround: 1200, aliases: ['ctpa', 'ct chest', 'ct pulmonary'] },
  { name: 'CT abdomen and pelvis', kind: 'imaging', category: 'Imaging', turnaround: 1200, aliases: ['ct abdomen', 'ct whole abdomen'] },
  { name: 'CT C-spine', kind: 'imaging', category: 'Imaging', turnaround: 900, aliases: ['c-spine', 'cervical spine'] },
];

// ─── Treatment catalog (Porames MANAGEMENT_LIBRARY, extended for ER) ─────
export interface CatalogAction {
  name: string;
  category: ActionCategory;
  doses?: string[];
  seconds: number;
  aliases?: string[];
  physical?: 'cpr' | 'procedure';
}

export type ActionCategory =
  | 'Monitoring and access'
  | 'Airway and breathing'
  | 'Circulation and fluids'
  | 'Resuscitation (ACLS)'
  | 'Medications'
  | 'Procedures'
  | 'Communication and consults'
  | 'Disposition';

export const ACTION_CATEGORIES: { id: ActionCategory; th: string }[] = [
  { id: 'Monitoring and access', th: 'Monitoring และเปิดเส้น' },
  { id: 'Airway and breathing', th: 'Airway และ Breathing' },
  { id: 'Circulation and fluids', th: 'Circulation และสารน้ำ' },
  { id: 'Resuscitation (ACLS)', th: 'กู้ชีพ (ACLS)' },
  { id: 'Medications', th: 'ยา' },
  { id: 'Procedures', th: 'หัตถการ' },
  { id: 'Communication and consults', th: 'สื่อสารและปรึกษา' },
  { id: 'Disposition', th: 'Disposition' },
];

const act = (category: ActionCategory, name: string, seconds = 30, doses?: string[], aliases: string[] = [], physical?: CatalogAction['physical']): CatalogAction =>
  ({ name, category, seconds, doses, aliases, physical });

export const ACTION_CATALOG: CatalogAction[] = [
  // Monitoring and access
  act('Monitoring and access', 'Attach cardiac monitor, SpO2 and NIBP', 15, undefined, ['monitor', 'cardiac monitoring', 'continuous monitoring', 'ekg monitor']),
  act('Monitoring and access', 'IV access: 2 large-bore cannulae (18G)', 60, undefined, ['iv access', 'large bore', 'cannula', 'iv line', 'venous access']),
  act('Monitoring and access', 'Intraosseous access', 60, undefined, ['io access', 'intraosseous']),
  act('Monitoring and access', 'Urinary catheter and hourly urine output', 120, undefined, ['foley', 'urinary catheter', 'urine output', 'hourly urine']),
  act('Monitoring and access', 'Strict fluid balance chart', 10, undefined, ['fluid balance', 'intake output', 'i/o']),
  act('Monitoring and access', 'Neuro observations (GCS, pupils) every 15 min', 10, undefined, ['neuro obs', 'neurological observation']),
  act('Monitoring and access', 'Nasogastric tube', 120, undefined, ['ng tube', 'ngt', 'nasogastric']),
  // Airway and breathing
  act('Airway and breathing', 'Head tilt, chin lift / jaw thrust', 10, undefined, ['jaw thrust', 'chin lift', 'airway manoeuvre']),
  act('Airway and breathing', 'Suction airway', 15, undefined, ['suction']),
  act('Airway and breathing', 'Oropharyngeal airway', 15, undefined, ['opa', 'guedel']),
  act('Airway and breathing', 'Oxygen via nasal cannula', 10, ['2 L/min', '4 L/min', '6 L/min'], ['nasal cannula']),
  act('Airway and breathing', 'Oxygen via non-rebreather mask 15 L/min', 10, undefined, ['non-rebreather', 'nrb', 'oxygen mask', 'high flow oxygen', 'supplemental oxygen', 'oxygen']),
  act('Airway and breathing', 'High-flow nasal cannula', 30, undefined, ['hfnc', 'high flow nasal']),
  act('Airway and breathing', 'Non-invasive ventilation (CPAP/BiPAP)', 60, undefined, ['niv', 'cpap', 'bipap']),
  act('Airway and breathing', 'Bag-valve-mask ventilation', 15, undefined, ['bvm', 'bag valve', 'bag mask', 'ambu']),
  act('Airway and breathing', 'Rapid sequence intubation', 180, undefined, ['rsi', 'intubat', 'endotracheal', 'ett', 'definitive airway'], 'procedure'),
  act('Airway and breathing', 'Needle decompression (2nd ICS MCL / 5th ICS)', 30, undefined, ['needle decompression', 'needle thoracostomy'], 'procedure'),
  act('Airway and breathing', 'Intercostal chest drain', 300, undefined, ['chest drain', 'chest tube', 'icd', 'tube thoracostomy'], 'procedure'),
  // Circulation and fluids
  act('Circulation and fluids', 'Crystalloid bolus (0.9% NSS / Ringer lactate)', 30, ['250 mL', '500 mL', '1000 mL', '10 mL/kg', '20 mL/kg', '30 mL/kg'], ['nss', 'normal saline', 'ringer', 'lrs', 'crystalloid', 'fluid bolus', 'iv fluid']),
  act('Circulation and fluids', 'Maintenance IV fluid', 20, undefined, ['maintenance fluid']),
  act('Circulation and fluids', 'Packed red cells transfusion', 60, ['1 unit', '2 units', '4 units'], ['prc', 'prbc', 'blood transfusion', 'red cell']),
  act('Circulation and fluids', 'Activate massive transfusion protocol', 30, undefined, ['mtp', 'massive transfusion']),
  act('Circulation and fluids', 'Fresh frozen plasma', 60, ['10 mL/kg', '15 mL/kg'], ['ffp']),
  act('Circulation and fluids', 'Platelet concentrate', 60, undefined, ['platelet transfusion']),
  act('Circulation and fluids', 'Pelvic binder', 60, undefined, ['pelvic binder', 'pelvic sheet']),
  act('Circulation and fluids', 'Direct pressure / tourniquet', 20, undefined, ['tourniquet', 'direct pressure', 'haemorrhage control']),
  act('Circulation and fluids', 'Norepinephrine infusion', 60, ['0.05 mcg/kg/min', '0.1 mcg/kg/min', '0.5 mcg/kg/min'], ['noradrenaline', 'norepinephrine', 'vasopressor', 'levophed']),
  // Resuscitation
  act('Resuscitation (ACLS)', 'High-quality CPR', 20, undefined, ['cpr', 'chest compression', 'compressions'], 'cpr'),
  act('Resuscitation (ACLS)', 'Defibrillation (unsynchronised)', 15, ['120 J biphasic', '200 J biphasic', '360 J monophasic'], ['defib', 'defibrillat', 'shock', 'unsynchronised'], 'cpr'),
  act('Resuscitation (ACLS)', 'Synchronised cardioversion', 30, ['50 J', '100 J', '200 J'], ['cardioversion', 'synchronised', 'synchronized'], 'procedure'),
  act('Resuscitation (ACLS)', 'Adrenaline IV (cardiac arrest)', 10, ['0.1 mg', '0.5 mg', '1 mg'], ['epinephrine 1 mg', 'adrenaline 1 mg', 'adrenaline iv', 'epinephrine iv']),
  act('Resuscitation (ACLS)', 'Amiodarone IV', 10, ['150 mg', '300 mg', '450 mg'], ['amiodarone']),
  act('Resuscitation (ACLS)', 'Transcutaneous pacing', 60, undefined, ['pacing', 'tcp']),
  act('Resuscitation (ACLS)', 'Vagal manoeuvre (modified Valsalva)', 20, undefined, ['vagal', 'valsalva']),
  // Medications
  act('Medications', 'Adrenaline IM (anaphylaxis)', 10, ['0.01 mg/kg', '0.3 mg', '0.5 mg', '1 mg'], ['epinephrine im', 'adrenaline im', 'intramuscular adrenaline']),
  act('Medications', 'Adenosine IV rapid push', 10, ['3 mg', '6 mg', '12 mg'], ['adenosine']),
  act('Medications', 'Atropine IV', 10, ['0.5 mg', '1 mg', '2 mg', '2-5 mg doubling'], ['atropine']),
  act('Medications', 'Aspirin (chewed)', 10, ['81 mg', '162 mg', '300 mg'], ['aspirin', 'asa']),
  act('Medications', 'Clopidogrel / ticagrelor loading', 10, ['clopidogrel 300 mg', 'clopidogrel 600 mg', 'ticagrelor 180 mg'], ['clopidogrel', 'ticagrelor', 'p2y12']),
  act('Medications', 'Unfractionated heparin', 10, ['60 U/kg bolus', '5000 U bolus', '80 U/kg bolus'], ['heparin', 'ufh', 'enoxaparin', 'anticoagul']),
  act('Medications', 'Nitroglycerin sublingual', 10, ['0.4 mg', '0.8 mg'], ['nitroglycerin', 'gtn', 'isordil', 'nitrate']),
  act('Medications', 'Salbutamol nebulisation', 15, ['2.5 mg', '5 mg'], ['salbutamol', 'albuterol', 'ventolin', 'beta agonist']),
  act('Medications', 'Ipratropium nebulisation', 15, ['250 mcg', '500 mcg'], ['ipratropium', 'berodual', 'atrovent']),
  act('Medications', 'Hydrocortisone / dexamethasone IV', 10, ['hydrocortisone 100 mg', 'hydrocortisone 200 mg', 'dexamethasone 0.15 mg/kg'], ['steroid', 'hydrocortisone', 'dexamethasone', 'methylprednisolone', 'prednisolone']),
  act('Medications', 'Magnesium sulphate IV', 20, ['2 g over 20 min', '4 g over 20 min'], ['magnesium']),
  act('Medications', 'Chlorpheniramine IV', 10, ['10 mg'], ['cpm', 'antihistamine', 'chlorpheniramine']),
  act('Medications', 'Ceftriaxone IV', 10, ['1 g', '2 g'], ['ceftriaxone']),
  act('Medications', 'Piperacillin-tazobactam IV', 10, ['4.5 g'], ['piperacillin', 'tazocin']),
  act('Medications', 'Meropenem IV', 10, ['1 g', '2 g'], ['meropenem', 'carbapenem']),
  act('Medications', 'Doxycycline', 10, ['100 mg'], ['doxycycline']),
  act('Medications', 'Paracetamol', 10, ['500 mg', '1 g', '15 mg/kg'], ['paracetamol', 'acetaminophen', 'antipyretic']),
  act('Medications', 'Morphine IV', 10, ['1 mg', '3 mg', '10 mg'], ['morphine', 'opioid analgesia']),
  act('Medications', 'Fentanyl IV', 10, ['25 mcg', '50 mcg', '1 mcg/kg'], ['fentanyl']),
  act('Medications', 'Ondansetron IV', 10, ['4 mg', '8 mg'], ['ondansetron', 'antiemetic']),
  act('Medications', 'Furosemide IV', 10, ['20 mg', '40 mg', '80 mg'], ['furosemide', 'frusemide', 'lasix', 'diuretic']),
  act('Medications', 'Regular insulin infusion', 20, ['0.05 U/kg/h', '0.1 U/kg/h', '10 U bolus'], ['insulin']),
  act('Medications', 'Potassium replacement IV', 20, ['10 mmol/h', '20 mmol/h', '40 mmol/h'], ['potassium chloride', 'kcl', 'potassium replacement']),
  act('Medications', 'Calcium gluconate 10% IV', 10, ['10 mL', '30 mL'], ['calcium gluconate', 'calcium chloride']),
  act('Medications', 'Sodium bicarbonate IV', 10, ['1 mEq/kg', '50 mEq', '100 mEq'], ['bicarbonate', 'nahco3', 'bicarb']),
  act('Medications', '50% glucose IV', 10, ['25 mL', '50 mL'], ['dextrose', '50% glucose', 'd50', 'hypoglycaemia']),
  act('Medications', 'Naloxone IV', 10, ['0.04 mg', '0.4 mg', '2 mg'], ['naloxone', 'narcan']),
  act('Medications', 'Pralidoxime (2-PAM) IV', 20, ['30 mg/kg', '1 g'], ['pralidoxime', '2-pam', 'oxime']),
  act('Medications', 'N-acetylcysteine IV', 20, ['150 mg/kg', '300 mg/kg'], ['nac', 'acetylcysteine']),
  act('Medications', 'Activated charcoal', 20, ['1 g/kg', '50 g'], ['charcoal']),
  act('Medications', 'Tranexamic acid IV', 10, ['1 g over 10 min', '2 g'], ['tranexamic', 'txa']),
  act('Medications', 'Diazepam / midazolam IV', 10, ['diazepam 5 mg', 'diazepam 10 mg', 'midazolam 0.1 mg/kg'], ['benzodiazepine', 'diazepam', 'midazolam', 'lorazepam', 'anticonvulsant']),
  act('Medications', 'Mannitol / hypertonic saline', 20, ['mannitol 0.5 g/kg', 'mannitol 1 g/kg', '3% NaCl 150 mL'], ['mannitol', 'hypertonic saline']),
  act('Medications', 'Tetanus prophylaxis', 10, undefined, ['tetanus', 'tt', 'dt']),
  // Procedures
  act('Procedures', 'Lumbar puncture', 600, undefined, ['lumbar puncture', 'lp', 'csf'], 'procedure'),
  act('Procedures', 'Central venous catheter', 600, undefined, ['central line', 'cvc', 'central venous'], 'procedure'),
  act('Procedures', 'Pericardiocentesis', 300, undefined, ['pericardiocentesis'], 'procedure'),
  act('Procedures', 'Splint / immobilise fracture', 120, undefined, ['splint', 'immobilis', 'traction']),
  act('Procedures', 'Wound irrigation and suture', 600, undefined, ['suture', 'wound care', 'irrigation']),
  act('Procedures', 'Gastric lavage', 600, undefined, ['gastric lavage', 'lavage'], 'procedure'),
  act('Procedures', 'Cervical collar / spinal immobilisation', 30, undefined, ['c-collar', 'hard collar', 'spinal immobilisation']),
  // Communication and consults
  act('Communication and consults', 'Call for help / activate team', 10, undefined, ['call for help', 'code blue', 'activate', 'team']),
  act('Communication and consults', 'Consult medicine', 30, undefined, ['medicine consult', 'med consult', 'internal medicine']),
  act('Communication and consults', 'Consult surgery / trauma team', 30, undefined, ['surgery', 'surgeon', 'trauma team', 'general surgery']),
  act('Communication and consults', 'Consult cardiology (activate cath lab)', 30, undefined, ['cardiology', 'cath lab', 'pci', 'primary pci']),
  act('Communication and consults', 'Consult neurosurgery', 30, undefined, ['neurosurg']),
  act('Communication and consults', 'Consult obstetrics and gynaecology', 30, undefined, ['obstetric', 'gynae', 'ob-gyn', 'obgyn']),
  act('Communication and consults', 'Consult poison centre (Ramathibodi 1367)', 30, undefined, ['poison centre', 'poison center', '1367']),
  act('Communication and consults', 'Explain plan and obtain consent', 30, undefined, ['consent', 'explain', 'counsel', 'inform the family', 'breaking bad news']),
  // Disposition
  act('Disposition', 'Admit to ICU', 10, undefined, ['icu', 'intensive care']),
  act('Disposition', 'Admit to ward', 10, undefined, ['admit', 'ward']),
  act('Disposition', 'Emergency surgery / operating theatre', 10, undefined, ['operating room', 'theatre', 'or ', 'laparotomy']),
  act('Disposition', 'Refer to tertiary centre', 10, undefined, ['refer', 'transfer']),
  act('Disposition', 'Discharge with advice', 10, undefined, ['discharge']),
];
