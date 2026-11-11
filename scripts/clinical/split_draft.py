"""Draft the finding/reading split for text results and exam findings (reviewed by hand afterwards)."""
import json, glob, re, sys
TH = re.compile(r'(ยืนยัน|เข้าได้กับ|บ่งชี้|บ่งว่า|แสดงว่า|แปลว่า|เข้าเกณฑ์|ชี้ไปที่|เป็นลักษณะของ|ช่วยตัด|ตัด\S* ?\S*ออก|จึง|ดังนั้น|ทำหลัง|ใช้เวลา|ถ้า|ควร|ต้อง|ห้าม|อย่า|เพราะ|ซึ่ง|คือ|หมายถึง|ไม่ได้ตัด|ไม่จำเป็น|consistent with|suggest)')
EN = re.compile(r'(,? which |,? consistent with|,? suggest|,? indicat|,? signal|\. (This|The|It|That|These|Do|Never|Always|A |An |If|Not|No ))')
out = []
for f in sorted(glob.glob('public/locales/th/case_*.json')):
    d = json.load(open(f)); k = f.split('/')[-1][:-5]
    for inv in d.get('investigations', []):
        r = inv.get('report') or ''
        if not r or inv.get('value') not in (None, ''): continue
        m = TH.search(r)
        cut = m.start() if m and m.start() > 12 else len(r)
        out.append(f"{k} i.{inv['id']} [{inv['name']}]\n   {r[:cut].rstrip(' ,และ')} || {r[cut:]}")
    for e in d.get('exam', []) or []:
        t = e.get('finding', '')
        m = EN.search(t)
        if not m: continue
        cut = m.start() + (1 if t[m.start()] == '.' else 0)
        out.append(f"{k} e.{e['id']} [{e['system']}]\n   {t[:cut].rstrip(' ,')} || {t[cut:].lstrip(' ,')}")
open(sys.argv[1], 'w', encoding='utf8').write('\n'.join(out))
print(len(out))
