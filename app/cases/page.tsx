"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { patientFor } from "@/lib/patients";
import { useRouter } from "next/navigation";
import { CASE_DATA } from "@/lib/caseIndex";
import { listLocalCases, deleteLocalCase, exportCaseFile, importCaseFile, listCloudCases, StoredCase } from "@/lib/customCases";
import { checkCase, toGameCase } from "@/lib/customCase";

type Tab = "mine" | "shared" | "story";
const TABS: { id: Tab; label: string }[] = [
  { id: "mine", label: "เคสของฉัน" },
  { id: "shared", label: "เคสที่แชร์" },
  { id: "story", label: "เคสในเกม" },
];

/** The case library: custom cases, shared cases, and the story cases as practice or as templates. */
export default function CaseLibraryPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("mine");
  const [mine, setMine] = useState<StoredCase[]>([]);
  const [shared, setShared] = useState<{ id: string; title: string }[] | null>(null);
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => { setMine(listLocalCases()); }, []);
  useEffect(() => { if (tab === "shared" && shared === null) listCloudCases().then(setShared); }, [tab, shared]);
  // Story cases are listed as the patient and the complaint. The working title names the diagnosis, which would
  // spoil the working-diagnosis step for anyone practising.
  const story = useMemo(() => Object.entries<any>(CASE_DATA).map(([id, c]) => { const who = patientFor(id); return { id, title: who ? `${who.name.th} ${who.age.th}` : c.title, cc: c.chiefComplaint }; }), []);

  return (
    <div className="h-[100dvh] sm:h-full cozy-night text-pixel-text font-pixel flex flex-col p-2 gap-2" data-testid="case-library">
      <div className="cozy-panel p-2.5 flex items-center justify-between gap-2 shrink-0">
        <div>
          <h1 className="text-[22px] leading-none">คลังเคส</h1>
          <p className="text-[14px] leading-snug mt-1 text-[#86522e]">สร้างเคสเอง ฝึกเคสเดิม ไม่นับ XP และไม่กระทบเซฟ</p>
        </div>
        <button onClick={() => router.push("/")} className="cozy-btn px-2 py-0.5 text-[15px] leading-none self-start" aria-label="back">✕</button>
      </div>

      <div className="grid grid-cols-2 gap-2 shrink-0">
        <button onClick={() => router.push("/designer")} className="cozy-btn cozy-btn-leaf py-2 text-[17px] leading-none" data-testid="new-case">+ สร้างเคสใหม่</button>
        <button onClick={() => file.current?.click()} className="cozy-btn cozy-btn-sky py-2 text-[17px] leading-none">นำเข้าไฟล์เคส</button>
        <input ref={file} type="file" accept=".json,application/json" className="hidden" data-testid="import-case" onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try { await importCaseFile(f); setMine(listLocalCases()); setTab("mine"); setNote(""); }
          catch { setNote("ไฟล์นี้ไม่ใช่ไฟล์เคสของ Code Rama"); }
          e.target.value = "";
        }} />
      </div>
      {note && <p className="cozy-tag !bg-[#f6c3c6] px-2 py-1 text-[15px] leading-snug shrink-0">{note}</p>}

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex gap-1 px-1 relative z-10">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} data-testid={`tab-${t.id}`}
              className={`flex-1 py-1 text-[16px] leading-none rounded-t-[5px] border-[3px] border-b-0 border-[#3a2a2f] ${tab === t.id ? "bg-[#f8ecd0] text-[#3a2a2f] -mb-[3px] pb-[7px]" : "bg-[#c48a52] text-[#fff3df]"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0 cozy-panel p-2.5 overflow-y-auto space-y-2">
          {tab === "mine" && (mine.length === 0
            ? <p className="text-[16px] leading-snug">ยังไม่มีเคส กด &ldquo;สร้างเคสใหม่&rdquo; หรือคัดลอกเคสในเกมมาแก้ก็ได้</p>
            : mine.map((c) => {
              const problems = checkCase(toGameCase(c.data));
              return (
                <div key={c.id} className="rounded-[4px] border-2 bg-[#fff6e3] border-[#e7d3a8] p-2" data-testid="my-case">
                  <p className="text-[18px] leading-tight">{c.title}</p>
                  <p className="text-[14px] leading-snug text-[#86522e]">{c.data?.chiefComplaint}</p>
                  {problems.errors.length > 0 && <p className="text-[14px] leading-snug text-[#a93c4b] mt-1">ยังเล่นไม่ได้: {problems.errors[0]}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <button disabled={problems.errors.length > 0} onClick={() => router.push(`/simulator/play/custom?caseId=${c.id}`)} className="cozy-btn cozy-btn-leaf px-2.5 py-1 text-[15px] leading-none" data-testid="play-case">เล่น</button>
                    <button onClick={() => router.push(`/designer?id=${c.id}`)} className="cozy-btn px-2.5 py-1 text-[15px] leading-none">แก้ไข</button>
                    <button onClick={() => exportCaseFile(c)} className="cozy-btn px-2.5 py-1 text-[15px] leading-none">ส่งออก</button>
                    {confirming === c.id
                      ? <button onClick={() => { deleteLocalCase(c.id); setMine(listLocalCases()); setConfirming(null); }} className="cozy-btn cozy-btn-berry px-2.5 py-1 text-[15px] leading-none">ลบเลย</button>
                      : <button onClick={() => setConfirming(c.id)} className="cozy-btn px-2.5 py-1 text-[15px] leading-none">ลบ</button>}
                  </div>
                </div>
              );
            }))}

          {tab === "shared" && (shared === null
            ? <p className="text-[16px]">กำลังโหลด...</p>
            : shared.length === 0
              ? <p className="text-[16px] leading-snug">ยังไม่มีเคสที่แชร์ หรือยังไม่ได้ login</p>
              : shared.map((c) => (
                <div key={c.id} className="rounded-[4px] border-2 bg-[#fff6e3] border-[#e7d3a8] p-2">
                  <p className="text-[18px] leading-tight">{c.title}</p>
                  <div className="flex gap-1.5 mt-1.5">
                    <button onClick={() => router.push(`/simulator/play/custom?caseId=${c.id}`)} className="cozy-btn cozy-btn-leaf px-2.5 py-1 text-[15px] leading-none">เล่น</button>
                    <button onClick={() => router.push(`/designer?id=${c.id}`)} className="cozy-btn px-2.5 py-1 text-[15px] leading-none">แก้ไข</button>
                  </div>
                </div>
              )))}

          {tab === "story" && story.map((c) => (
            <div key={c.id} className="rounded-[4px] border-2 bg-[#fff6e3] border-[#e7d3a8] p-2" data-testid="story-case">
              <p className="text-[17px] leading-tight">{c.title}</p>
              {c.cc && <p className="text-[14px] leading-snug text-[#86522e] mt-0.5">{c.cc}</p>}
              <div className="flex gap-1.5 mt-1.5">
                <button onClick={() => router.push(`/simulator/play/${c.id}?practice=1`)} className="cozy-btn cozy-btn-leaf px-2.5 py-1 text-[15px] leading-none" data-testid={`practice-${c.id}`}>ฝึก</button>
                <button onClick={() => router.push(`/designer?template=${c.id}`)} className="cozy-btn px-2.5 py-1 text-[15px] leading-none">คัดลอกไปแก้</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
