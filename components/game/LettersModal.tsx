import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useERStore } from "@/lib/erStore";
import { PATIENTS } from "@/lib/patients";
import { GIFTS } from "@/lib/gifts";
import { GIFT_ICON } from "@/lib/pixel/icons";
import { arrivedLetters } from "@/lib/letters";
import { audio } from "@/lib/audio";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { CASEBOOK_IDS, CASEBOOK_MILESTONES, claimableMilestones, keySteps } from "@/lib/casebook";

export type LettersTab = "letters" | "casebook";

/** The postbox: letters from patients who went home, and the casebook of every patient in the game */
export function LettersModal({ onClose, initialTab = "letters" }: { onClose: () => void; initialTab?: LettersTab }) {
  const { patientLog, currentDay, readLetter, receiveGift, casebookClaimed, claimCasebook } = useERStore();
  const [tab, setTab] = useState<LettersTab>(initialTab);
  const [open, setOpen] = useState<string | null>(null);
  const [page, setPage] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[] | null>(null);
  const [claimedNow, setClaimedNow] = useState<string | null>(null);
  const letters = arrivedLetters(patientLog, currentDay);
  const filled = CASEBOOK_IDS.filter((id) => patientLog[id]);
  const stars = filled.filter((id) => patientLog[id].star).length;
  const claimable = claimableMilestones(filled.length, casebookClaimed ?? []);
  const next = CASEBOOK_MILESTONES.find((m) => filled.length < m.count);

  // The key steps live in the case files, which only load when a page is opened
  useEffect(() => {
    if (!page) { setSteps(null); return; }
    let live = true;
    import("@/lib/caseIndex").then(({ CASE_DATA }) => { if (live) setSteps(keySteps(CASE_DATA[page])); });
    return () => { live = false; };
  }, [page]);

  const claim = (count: number) => {
    const m = CASEBOOK_MILESTONES.find((x) => x.count === count);
    if (!m || !claimCasebook(count)) return;
    audio.playCashRegister();
    setClaimedNow(`${m.title}: +${m.cash} เหรียญ${m.giftId && GIFTS[m.giftId] ? ` และ${GIFTS[m.giftId].name.th}` : ""}`);
  };

  const openLetter = (id: string) => {
    if (patientLog[id].letterRead) audio.playClick();
    else audio.playSparkle();
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
              {([["letters", "จดหมาย"], ["casebook", `สมุดเคส ${filled.length}/${CASEBOOK_IDS.length}`]] as [LettersTab, string][]).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => { audio.playClick(); setTab(k); setPage(null); }}
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
              {tab === "casebook" && page && PATIENTS[page] && (() => {
                const p = PATIENTS[page];
                const r = patientLog[page];
                return (
                  <div className="flex flex-col gap-2" data-testid="casebook-page">
                    <div className="bg-[#fffaf0] border-2 border-[#e7d3a8] rounded-[4px] p-2.5">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-[20px] leading-none">{p.name.th} {p.age.th}</span>
                        <span className="text-[13px] leading-none text-[#86522e] shrink-0">เคส {CASEBOOK_IDS.indexOf(page) + 1} · วันที่ {r.day}</span>
                      </div>
                      <p className="text-[16px] leading-snug mt-1.5"><span className="text-[#86522e]">Dx </span>{p.dx.th}</p>
                      <p className={`text-[14px] leading-snug mt-1.5 ${r.star ? "text-[#c08a1e]" : r.good ? "text-[#3f8a48]" : "text-[#a93c4b]"}`}>
                        {r.star ? "★ ดูแลได้ดี" : r.good ? "รอด แต่ดูแลได้ดีกว่านี้ ถ้าได้เจออีก ทำให้ดีจะได้ดาว" : "ผลไม่ดี เก็บไว้เป็นบทเรียน ถ้าได้เจออีก ทำให้ดีจะได้ดาว"}
                      </p>
                      <p className="text-[15px] leading-snug mt-2 text-[#5b4148] italic">{`${p.by.th}: "${p.quote.th}"`}</p>
                    </div>
                    <div className="bg-[#fff6e3] border-2 border-[#e7d3a8] rounded-[4px] p-2.5">
                      <p className="text-[16px] leading-none text-[#3f8a48] mb-1.5">ขั้นสำคัญของเคสนี้</p>
                      {steps === null ? (
                        <p className="text-[15px] text-[#86522e] italic">กำลังเปิดแฟ้ม...</p>
                      ) : (
                        <ol className="list-decimal pl-5 space-y-1 text-[15px] leading-snug">{steps.map((st, i) => <li key={i}>{st}</li>)}</ol>
                      )}
                    </div>
                    <button className="cozy-btn self-start px-2.5 py-0.5 text-[16px]" onClick={() => { audio.playClick(); setPage(null); }}>◀ กลับ</button>
                  </div>
                );
              })()}
              {tab === "casebook" && !page && (
                <>
                  <div className="bg-[#fff6e3] border-2 border-[#e7d3a8] rounded-[4px] p-2" data-testid="casebook-progress">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[17px] leading-none">เจอแล้ว {filled.length} จาก {CASEBOOK_IDS.length} คน</span>
                      <span className="text-[15px] leading-none text-[#c08a1e]">★ {stars}</span>
                    </div>
                    <div className="cozy-bar h-3 mt-1.5"><span style={{ width: `${(filled.length / CASEBOOK_IDS.length) * 100}%`, background: "#e7b04a" }} /></div>
                    {claimable.map((m) => (
                      <button key={m.count} onClick={() => claim(m.count)} className="cozy-btn cozy-btn-sun w-full mt-2 py-1 text-[16px] leading-none" data-testid={`casebook-claim-${m.count}`}>
                        รับรางวัล {m.count} คน: {m.title}
                      </button>
                    ))}
                    {claimedNow && <p className="text-[14px] leading-snug mt-1.5 text-[#3f8a48]">{`✓ ${claimedNow}`}</p>}
                    {!claimable.length && next && (
                      <p className="text-[14px] leading-snug mt-1.5 text-[#86522e]">
                        {`อีก ${next.count - filled.length} คน ได้รางวัล "${next.title}" ${next.cash} เหรียญ${next.giftId && GIFTS[next.giftId] ? ` และ${GIFTS[next.giftId].name.th}` : ""}`}
                      </p>
                    )}
                  </div>
                  {CASEBOOK_IDS.map((id, i) => {
                    const p = PATIENTS[id];
                    const r = patientLog[id];
                    if (!r) {
                      return (
                        <div key={id} className="bg-[#efe3c8] border-2 border-dashed border-[#d9c49a] rounded-[4px] px-2 py-1.5 flex items-center gap-2 text-[#a88d64]" data-testid={`casebook-locked-${id}`}>
                          <span className="text-[13px] leading-none w-7 shrink-0">{i + 1}</span>
                          <span className="text-[16px] leading-none">???</span>
                        </div>
                      );
                    }
                    return (
                      <button key={id} onClick={() => { audio.playClick(); setPage(id); }} className="text-left bg-[#fff6e3] border-2 border-[#e7d3a8] rounded-[4px] px-2 py-1.5 flex items-center gap-2" data-testid={`casebook-${id}`}>
                        <span className="text-[13px] leading-none w-7 shrink-0 text-[#86522e]">{i + 1}</span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[17px] leading-none truncate">{p.name.th} {p.age.th}</span>
                          <span className="block text-[14px] leading-none mt-1 text-[#5b4148] truncate">{p.dx.th}</span>
                        </span>
                        <span className={`text-[16px] leading-none shrink-0 ${r.star ? "text-[#c08a1e]" : "text-[#c9b48c]"}`}>{r.star ? "★" : "☆"}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
