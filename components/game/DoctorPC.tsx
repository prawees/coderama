"use client";

import { audio } from "@/lib/audio";

/**
 * The computer in the doctors' room: where to look things up for real. External links only, to the
 * bodies that publish Thai emergency guidance. Each was checked to exist; the newest edition should
 * still be checked at the source.
 */
const LINKS: { title: string; note: string; url: string }[] = [
  { title: "ศูนย์พิษวิทยารามาธิบดี", note: "protocol พิษจากยา สารเคมี งู สายด่วน 1367 ตลอด 24 ชั่วโมง", url: "https://www.rama.mahidol.ac.th/poisoncenter/th/forMedicalStaff" },
  { title: "สถาบันการแพทย์ฉุกเฉินแห่งชาติ (สพฉ.)", note: "ระบบการแพทย์ฉุกเฉิน สายด่วน 1669", url: "https://www.niems.go.th" },
  { title: "Thai Resuscitation Council", note: "การช่วยชีวิตขั้นพื้นฐานและขั้นสูงของประเทศไทย", url: "https://www.thaicpr.org" },
  { title: "AHA CPR & ECC Guidelines 2020 ฉบับภาษาไทย", note: "สรุปสาระสำคัญ BLS ACLS PALS", url: "https://cpr.heart.org/-/media/cpr-files/cpr-guidelines-files/highlights/hghlghts_2020eccguidelines_thai.pdf" },
  { title: "สมาคมแพทย์โรคหัวใจแห่งประเทศไทย", note: "Thai Acute Coronary Syndromes Guidelines 2020", url: "https://www.thaiheart.org" },
  { title: "Journal of Thai Stroke Society", note: "แนวทางรักษา acute ischemic stroke ของไทย", url: "https://he01.tci-thaijo.org/index.php/jtss" },
  { title: "กรมควบคุมโรค", note: "ไข้เลือดออก โรคติดต่อ และเอกสารเผยแพร่", url: "https://ddc.moph.go.th" },
];

export function DoctorPC({ onClose, onConsults }: { onClose: () => void; onConsults: () => void }) {
  return (
    <div className="fixed inset-0 z-[150] bg-[#1c1522]/70 flex items-center justify-center p-4 font-pixel" onClick={onClose} data-testid="doctor-pc">
      <div className="w-full max-w-sm rounded-[8px] border-[3px] border-[#3a2a2f] bg-[#2b3a4a] p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-1 pb-1.5">
          <p className="text-[18px] leading-none text-[#cfe8ff]">คอมห้องแพทย์</p>
          <button className="cozy-btn px-2 py-0.5 text-[15px] leading-none" onClick={onClose} aria-label="ปิด">✕</button>
        </div>
        <div className="rounded-[4px] bg-[#fff8ea] max-h-[68vh] overflow-y-auto p-2.5 flex flex-col gap-2">
          <p className="text-[14px] leading-snug text-[#86522e]">Guideline ฉุกเฉินที่หมอไทยใช้จริง เปิดเป็นลิงก์ภายนอก ใช้ฉบับล่าสุดจากต้นทางเสมอ เกมนี้ใช้ฝึก ไม่ได้แทน guideline</p>
          {LINKS.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" onClick={() => audio.playClick()}
              className="block rounded-[4px] border-2 border-[#e7d3a8] bg-white px-2.5 py-1.5" data-testid="guideline-link">
              <span className="block text-[16px] leading-snug text-[#2f6f86]">{l.title}</span>
              <span className="block text-[13px] leading-snug text-[#5b4148]">{l.note}</span>
            </a>
          ))}
          <button onClick={() => { audio.playClick(); onConsults(); }} className="cozy-btn cozy-btn-sky w-full py-1.5 text-[16px]" data-testid="pc-consults">ห้องพักแพทย์ ฝากเคสถามเพื่อน</button>
        </div>
      </div>
    </div>
  );
}
