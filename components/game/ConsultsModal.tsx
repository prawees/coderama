import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { useERStore } from "@/lib/erStore";

interface ConsultsModalProps {
  onClose: () => void;
}

export function ConsultsModal({ onClose }: ConsultsModalProps) {
  const [consults, setConsults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const { addXp, addCurrency, language } = useERStore();
  const tr = (en: string, th: string) => (language === "th" ? th : en);

  const fetchConsults = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const q = query(collection(db, "consults"), where("status", "==", "open"));
      const snap = await getDocs(q);
      const fetched: any[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setConsults(fetched.filter((c: any) => c.requesterId !== auth.currentUser?.uid));
    } catch (e) {
      console.warn("Consults unavailable", e);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsults();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleProvideConsult = async (consultId: string, isCorrect: boolean) => {
    try {
      await updateDoc(doc(db, "consults", consultId), {
        status: "resolved",
        resolverId: auth.currentUser?.uid,
        resolvedAt: Date.now(),
        resolverWasCorrect: isCorrect,
      });
      if (isCorrect) {
        addXp(50);
        addCurrency(100);
        setNote(tr("Good call. +50 XP, +100 coins.", "แนะนำได้ดี +50 XP +100 เหรียญ"));
      } else {
        setNote(tr("Sent. You have a nagging feeling about that one.", "ส่งแล้ว แต่รู้สึกแปลกๆ กับคำแนะนำนี้"));
      }
      fetchConsults();
    } catch (e) {
      console.warn("Failed to update consult", e);
      setNote(tr("The message did not go through.", "ส่งข้อความไม่สำเร็จ"));
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1c1522]/70 z-[150] flex items-center justify-center p-4 font-pixel" onClick={onClose}>
      <div className="cozy-panel w-full max-w-sm max-h-[85vh] flex flex-col p-3" onClick={(e) => e.stopPropagation()} data-testid="consults">
        <div className="flex items-center justify-between">
          <h2 className="text-[26px] leading-none flex items-center gap-2"><PixelIcon name="friends" size={20} />{tr("Doctors' lounge", "ห้องพักแพทย์")}</h2>
          <button className="cozy-btn px-2 py-0.5 text-lg leading-none" onClick={onClose}>✕</button>
        </div>
        <p className="text-[16px] leading-snug mt-1 mb-2 text-[#86522e]">{tr("Other doctors leave questions here. Help one out for a little thank-you.", "หมอคนอื่นฝากคำถามไว้ที่นี่ ช่วยตอบแล้วจะมีของตอบแทนนิดหน่อย")}</p>

        {note && <p className="cozy-tag px-2 py-1 mb-2 text-[16px] text-center" data-testid="consult-note">{note}</p>}

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2">
          {loading ? (
            <p className="text-center text-[18px] text-[#86522e] py-8 animate-pulse">{tr("Checking the pigeonholes...", "กำลังดูช่องฝากข้อความ...")}</p>
          ) : failed ? (
            <p className="text-center text-[18px] text-[#86522e] py-8">{tr("The lounge is closed while you are offline.", "ห้องพักปิดอยู่ระหว่างออฟไลน์")}</p>
          ) : consults.length === 0 ? (
            <p className="text-center text-[18px] text-[#86522e] py-8">{tr("No notes today. Put the kettle on.", "วันนี้ไม่มีโน้ต ไปต้มน้ำชงชาเถอะ")}</p>
          ) : (
            consults.map((c) => (
              <div key={c.id} className="bg-[#fff6e3] border-2 border-[#e7d3a8] rounded-[4px] p-2 flex flex-col gap-1.5">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-[18px] leading-tight">{tr(`${c.requesterName} needs a second opinion`, `${c.requesterName} ขอความเห็นที่สอง`)}</p>
                  <span className="cozy-tag px-1.5 py-0.5 text-[13px] leading-none whitespace-nowrap">+50 XP</span>
                </div>
                <p className="text-[15px] leading-snug text-[#86522e]">{tr("Vitals", "สัญญาณชีพ")}: {c.vitals}</p>
                <p className="text-[16px] leading-snug">{c.narrative}</p>
                <div className="flex flex-col gap-1.5 mt-1">
                  {(c.options || []).map((opt: any, idx: number) => (
                    <PixelButton key={idx} variant="secondary" className="text-[16px] py-1 whitespace-normal h-auto text-left" onClick={() => handleProvideConsult(c.id, opt.isCorrect)}>
                      {opt.text}
                    </PixelButton>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-2 flex gap-2">
          <PixelButton onClick={fetchConsults} variant="sky" className="flex-1 py-1 text-[18px]">{tr("Refresh", "รีเฟรช")}</PixelButton>
          <PixelButton onClick={onClose} variant="primary" className="flex-1 py-1 text-[18px]">{tr("Back", "กลับ")}</PixelButton>
        </div>
      </div>
    </div>
  );
}
