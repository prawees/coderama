import { useState } from "react";
import { motion } from "framer-motion";
import { useERStore } from "@/lib/erStore";
import { PATIENTS } from "@/lib/patients";
import { GIFTS } from "@/lib/gifts";
import { GIFT_ICON } from "@/lib/pixel/icons";
import { arrivedLetters } from "@/lib/letters";
import { audio } from "@/lib/audio";
import { PixelIcon } from "@/components/ui/PixelIcon";

type Tab = "letters" | "scrapbook";

/** The postbox: letters from patients who went home, and a scrapbook of everyone you treated */
export function LettersModal({ onClose }: { onClose: () => void }) {
  const { patientLog, currentDay, readLetter, receiveGift } = useERStore();
  const [tab, setTab] = useState<Tab>("letters");
  const [open, setOpen] = useState<string | null>(null);
  const letters = arrivedLetters(patientLog, currentDay);
  const treated = Object.entries(patientLog).filter(([id]) => PATIENTS[id]).sort(([, a], [, b]) => b.day - a.day);

  const openLetter = (id: string) => {
    audio.playClick();
    const p = PATIENTS[id];
    if (!patientLog[id].letterRead) {
      readLetter(id);
      if (p.gift) receiveGift(p.gift);
    }
    setOpen(id);
  };

  const letter = open ? PATIENTS[open] : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[150] flex items-center justify-center bg-[#1c1522]/70 p-3" onClick={onClose}>
      <motion.div
        initial={{ y: 20, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20 }}
        className="cozy-panel w-full max-w-sm max-h-[82%] flex flex-col p-3 font-pixel"
        onClick={(e) => e.stopPropagation()}
        data-testid="letters-modal"
      >
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-[26px] leading-none flex items-center gap-2"><PixelIcon name="mail" size={18} />ตู้ไปรษณีย์</h2>
          <button onClick={() => { audio.playClick(); onClose(); }} className="cozy-btn px-2 py-0.5 text-lg leading-none" aria-label="close">✕</button>
        </div>

        {letter && open ? (
          <div className="flex-1 overflow-y-auto flex flex-col gap-2" data-testid="letter-open">
            <div className="bg-[#fffaf0] border-2 border-[#e7d3a8] rounded-[4px] p-3">
              <p className={`${letter.big ? "text-[24px] leading-snug" : "text-[17px] leading-snug"} text-[#3a2a2f]`}>{letter.letter!.th}</p>
              <p className="text-[16px] leading-none mt-3 text-right text-[#86522e]">{letter.from?.th ?? letter.name.th}</p>
            </div>
            {letter.gift && GIFTS[letter.gift] && (
              <p className="text-[15px] leading-none text-[#3f8a48] flex items-center gap-1.5">
                <PixelIcon name={GIFT_ICON[GIFTS[letter.gift].icon] ?? "heart"} size={13} />แนบมาด้วย: {GIFTS[letter.gift].name.th}
              </p>
            )}
            <button className="cozy-btn self-start px-2.5 py-0.5 text-[16px]" onClick={() => { audio.playClick(); setOpen(null); }}>◀ กลับ</button>
          </div>
        ) : (
          <>
            <div className="flex gap-1 mb-2">
              {([["letters", "จดหมาย"], ["scrapbook", "สมุดคนไข้"]] as [Tab, string][]).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => { audio.playClick(); setTab(k); }}
                  className={`flex-1 py-1 text-[16px] leading-none rounded-[4px] border-2 border-[#3a2a2f] ${tab === k ? "bg-[#f8ecd0]" : "bg-[#c48a52] text-[#fff3df]"}`}
                  data-testid={`letters-tab-${k}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
              {tab === "letters" && letters.length === 0 && (
                <p className="text-[16px] text-[#86522e] italic">ยังไม่มีจดหมาย คนไข้ที่กลับบ้านได้มักเขียนมาในเช้าวันถัดไป</p>
              )}
              {tab === "letters" && letters.map((id) => {
                const p = PATIENTS[id];
                const unread = !patientLog[id].letterRead;
                return (
                  <button key={id} onClick={() => openLetter(id)} className="text-left bg-[#fff6e3] border-2 border-[#e7d3a8] rounded-[4px] p-2 flex items-center gap-2" data-testid={`letter-${id}`}>
                    <PixelIcon name="mail" size={20} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[18px] leading-none">{p.from?.th ?? p.name.th}</span>
                      <span className="block text-[14px] leading-none mt-1 text-[#86522e]">วันที่ {patientLog[id].day + 1}</span>
                    </span>
                    {unread && <span className="cozy-tag !bg-[#f6c3c6] px-1.5 py-0.5 text-[13px] leading-none">ใหม่</span>}
                  </button>
                );
              })}
              {tab === "scrapbook" && treated.length === 0 && (
                <p className="text-[16px] text-[#86522e] italic">ยังไม่มีคนไข้ในสมุด</p>
              )}
              {tab === "scrapbook" && treated.map(([id, r]) => {
                const p = PATIENTS[id];
                return (
                  <div key={id} className="bg-[#fff6e3] border-2 border-[#e7d3a8] rounded-[4px] p-2" data-testid={`scrap-${id}`}>
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-[18px] leading-none">{p.name.th} {p.age.th}</span>
                      <span className="text-[13px] leading-none text-[#86522e]">วันที่ {r.day}</span>
                    </div>
                    <p className="text-[15px] leading-snug mt-1 text-[#5b4148]">{p.dx.th}</p>
                    <p className={`text-[14px] leading-none mt-1 ${r.good ? "text-[#3f8a48]" : "text-[#a93c4b]"}`}>{r.good ? "ผลการรักษาดี" : "ผลไม่ดี เก็บไว้เป็นบทเรียน"}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
