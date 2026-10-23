# How Code Rama talks

The game has one language: Thai as it is spoken and written on a Thai ward. Thai holds the sentence together. Medical words stay in English, the way students write them in a case report or say them on rounds.

New text goes in the Thai fields only (`th`, `public/locales/th`, `STORY_CAMPAIGN_TH`). The English files are kept as the clinical source and are not shown in game.

## Medical words

Keep in English: drug names, doses, routes, tests, diagnoses, signs, scores, procedures, units.

- ให้ adrenaline 0.5 mg IM ที่ต้นขา
- เจาะ DTX, ส่ง CBC, BUN/Cr, electrolyte
- คิดถึง dengue shock syndrome มากที่สุด
- on O2 cannula 3 LPM, keep SpO2 ≥ 94%
- admit, consult, refer, observe, F/U, hold ยา, rule out, off ยา, load NSS

Use Thai for symptoms the patient or a nurse would say: ไข้ ไอ เหนื่อย หอบ ซึม ชัก ถ่ายเหลว อาเจียน ปวดท้อง เจ็บหน้าอก ใจสั่น หน้ามืด ขาบวม ฉี่น้อย.

Do not translate words nobody says in Thai. Write "differential" or "คิดถึงอะไรบ้าง", never "การวินิจฉัยแยกโรค". Write "pertinent" findings as just what was found. Write "ECG"/"EKG", never "คลื่นไฟฟ้าหัวใจ". Write "MI", never "กล้ามเนื้อหัวใจตายเฉียบพลัน". Write "SBP 80", never "ความดันตัวบน 80".

Numbers are digits: HR 38, 3 วัน, 72 ปี.

## Who says what

- Nurses call the player หมอ or น้องหมอ and end with ค่ะ/คะ (or ครับ for male nurses).
- Residents and staff call the player น้อง or น้อง{ชื่อ}. They speak short and casual: "น้องไปดูเตียง 2 หน่อย", "จัด fluid ไปก่อนเลย".
- Patients and relatives speak plain Thai with no jargon: "หมอคะ แม่ซึมไปตั้งแต่เช้า".
- Narration uses no pronoun where Thai allows it, otherwise คุณ.
- The player says ผม if male and หนู if female, at every rank. In the player's own lines write ผม/ฉัน, ครับ/ค่ะ and ครับ/คะ; lib/voice.ts swaps in the right word when the line is shown, so no slash ever reaches the screen. Anywhere else, rephrase so no pronoun is needed.

## Tone

Warm and short. A line on a phone screen should fit in two or three lines. Teaching text explains the why in one or two sentences, the way a senior would on rounds. No em dashes, no middle dots, no lecture endings.
