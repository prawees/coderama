"use client";

import { useEffect, useRef, useState } from "react";
import { audio } from "@/lib/audio";
import type { CardSpec } from "@/lib/shareCard";

/**
 * Preview of a Story card and the buttons to send it. The picture is drawn when this opens,
 * so what you see is exactly the file that gets shared, and the share button can call the
 * phone's share sheet from the tap itself, which browsers require.
 */
export function ShareSheet({ spec, onClose, filename = "code-rama.png" }: { spec: CardSpec; onClose: () => void; filename?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const blob = useRef<Blob | null>(null);
  const tools = useRef<typeof import("@/lib/shareCard") | null>(null);

  useEffect(() => {
    let alive = true;
    let made: string | null = null;
    (async () => {
      try {
        const m = await import("@/lib/shareCard");
        tools.current = m;
        const b = await m.canvasToBlob(await m.renderCard(spec));
        if (!alive) return;
        blob.current = b;
        made = URL.createObjectURL(b);
        setUrl(made);
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => { alive = false; if (made) URL.revokeObjectURL(made); };
  }, [spec]);

  const share = async () => {
    if (!blob.current || !tools.current) return;
    audio.playClick();
    const r = await tools.current.shareBlob(blob.current, filename);
    if (r === "unavailable" || r === "failed") {
      tools.current.saveBlob(blob.current, filename);
      setNote("เครื่องนี้แชร์ตรงไม่ได้ บันทึกรูปให้แล้ว เปิด Instagram แล้วเลือกรูปนี้ลงสตอรี่ได้เลย");
    }
  };
  const save = () => {
    if (!blob.current || !tools.current) return;
    audio.playClick();
    tools.current.saveBlob(blob.current, filename);
    setNote("บันทึกรูปแล้ว");
  };

  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-2.5 bg-[#1c1522]/90 p-3 font-pixel" data-testid="share-sheet" onClick={onClose}>
      <div className="flex-1 min-h-0 w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="การ์ดสำหรับแชร์" data-testid="share-image" className="max-h-full max-w-full rounded-[10px] border-[3px] border-[#3a2a2f] shadow-2xl" style={{ imageRendering: "auto" }} />
        ) : (
          <p className="text-[20px] text-[#fbf3e2]" data-testid={failed ? "share-failed" : "share-loading"}>{failed ? "สร้างรูปไม่สำเร็จ ลองใหม่อีกครั้งนะ" : "กำลังวาดการ์ด..."}</p>
        )}
      </div>
      {note && <p className="shrink-0 text-center text-[15px] leading-snug text-[#ffd66b] px-2" data-testid="share-note">{note}</p>}
      <div className="shrink-0 w-full max-w-sm flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
        <button onClick={share} disabled={!url} className="cozy-btn cozy-btn-leaf w-full py-2 text-[22px] leading-none" data-testid="share-go">แชร์ลงสตอรี่</button>
        <div className="flex gap-1.5">
          <button onClick={save} disabled={!url} className="cozy-btn flex-1 py-1.5 text-[18px] leading-none" data-testid="share-save">บันทึกรูป</button>
          <button onClick={onClose} className="cozy-btn flex-1 py-1.5 text-[18px] leading-none" data-testid="share-close">ปิด</button>
        </div>
      </div>
    </div>
  );
}
