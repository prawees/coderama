"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { auth, usingEmulator } from "@/lib/firebase";
import { useERStore } from "@/lib/erStore";
import { useCloud, resolveConflict, signOut, saveNow } from "@/lib/account";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { withBase } from "@/lib/basePath";
import { PageTransition } from "@/components/ui/PageTransition";
import { PixelLogo } from "@/components/game/PixelLogo";
import { audio } from "@/lib/audio";

const EMAIL_KEY = "coderama.emailForSignIn";

/** Sign in to keep the game in the cloud, play it on any device, and appear on the leaderboard. */
export default function AccountPage() {
  const router = useRouter();
  const cloud = useCloud();
  const optIn = useERStore((s) => s.leaderboardOptIn);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const native = typeof window !== "undefined" && Capacitor.isNativePlatform();

  // Coming back from the link in the email
  useEffect(() => {
    if (!isSignInWithEmailLink(auth, window.location.href)) return;
    const saved = window.localStorage.getItem(EMAIL_KEY) || window.prompt("ยืนยันอีเมลที่ใช้ขอลิงก์") || "";
    setBusy(true);
    signInWithEmailLink(auth, saved, window.location.href)
      .then(() => { window.localStorage.removeItem(EMAIL_KEY); window.history.replaceState(null, "", withBase("/login")); })
      .catch((e) => setError(getAuthErrorMessage(e.code)))
      .finally(() => setBusy(false));
  }, []);

  const google = async () => {
    audio.playClick();
    setError(null); setBusy(true);
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (e: any) { setError(getAuthErrorMessage(e.code)); }
    finally { setBusy(false); }
  };

  const sendLink = async () => {
    audio.playClick();
    setError(null); setNote(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError(getAuthErrorMessage("auth/invalid-email")); return; }
    setBusy(true);
    try {
      await sendSignInLinkToEmail(auth, email, { url: window.location.origin + withBase("/login"), handleCodeInApp: true });
      window.localStorage.setItem(EMAIL_KEY, email);
      setNote(`ส่งลิงก์ไปที่ ${email} แล้ว เปิดอีเมลบนเครื่องนี้แล้วกดลิงก์ได้เลย`);
    } catch (e: any) { setError(getAuthErrorMessage(e.code)); }
    finally { setBusy(false); }
  };

  const toggleBoard = () => {
    audio.playClick();
    useERStore.setState({ leaderboardOptIn: !optIn });
    setTimeout(saveNow, 0);
  };

  const fmt = (d: { day: number; saved: number; name: string }) => `${d.name || "ไม่มีชื่อ"} วันที่ ${d.day} ช่วยไว้ ${d.saved} คน`;
  const time = cloud.savedAt ? new Date(cloud.savedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <PageTransition>
      <div className="min-h-[100dvh] cozy-night font-pixel flex flex-col items-center justify-center gap-3 p-4" data-testid="account">
        <PixelLogo scale={3} />
        <div className="cozy-panel w-full max-w-sm p-4 flex flex-col gap-3">
          {cloud.phase === "conflict" && cloud.conflict ? (
            <>
              <p className="text-[22px] leading-tight text-center">เจอเซฟสองที่</p>
              <p className="text-[16px] leading-snug text-[#86522e] text-center">เลือกเก็บอันเดียว อีกอันจะถูกแทนที่</p>
              <button onClick={() => { audio.playClick(); resolveConflict("cloud"); }} className="cozy-btn cozy-btn-leaf w-full py-2 text-left px-3" data-testid="keep-cloud">
                <span className="block text-[19px] leading-none">ใช้เซฟในคลาวด์</span>
                <span className="block text-[14px] leading-snug mt-1 opacity-90">{fmt(cloud.conflict.cloud)}</span>
              </button>
              <button onClick={() => { audio.playClick(); resolveConflict("local"); }} className="cozy-btn w-full py-2 text-left px-3" data-testid="keep-local">
                <span className="block text-[19px] leading-none">ใช้เซฟในเครื่องนี้</span>
                <span className="block text-[14px] leading-snug mt-1 opacity-90">{fmt(cloud.conflict.local)}</span>
              </button>
            </>
          ) : cloud.user ? (
            <>
              <p className="text-[15px] leading-none text-[#86522e]">เข้าสู่ระบบแล้ว</p>
              <p className="text-[19px] leading-tight break-all" data-testid="account-email">{cloud.user.email || cloud.user.displayName || "บัญชีนี้"}</p>
              <p className="text-[16px] leading-snug" data-testid="cloud-status">
                {cloud.phase === "saving" || cloud.phase === "loading" ? "กำลังเซฟขึ้นคลาวด์..." : cloud.phase === "error" ? "เซฟขึ้นคลาวด์ไม่สำเร็จ จะลองใหม่ตอนเล่นต่อ" : time ? `เซฟในคลาวด์แล้ว ${time} น.` : "เซฟในคลาวด์แล้ว"}
              </p>
              <button onClick={toggleBoard} className="flex items-center justify-between gap-2 rounded-[4px] border-2 border-[#e7d3a8] bg-[#fff6e3] px-2.5 py-2 text-left" data-testid="board-toggle" aria-pressed={optIn}>
                <span className="text-[16px] leading-snug">แสดงชื่อในกระดานอันดับ<span className="block text-[13px] text-[#86522e]">ใช้ชื่อในเกมกับคณะ ไม่แสดงอีเมล</span></span>
                <span className={`shrink-0 cozy-tag px-2 py-0.5 text-[15px] ${optIn ? "!bg-[#86c35f]" : ""}`}>{optIn ? "เปิด" : "ปิด"}</span>
              </button>
              <button onClick={async () => { audio.playClick(); await signOut(); }} className="cozy-btn w-full py-1.5 text-[18px]" data-testid="sign-out">ออกจากระบบ</button>
              <p className="text-[13px] leading-snug text-[#86522e] text-center">ออกจากระบบแล้วเกมยังอยู่ในเครื่องนี้ แค่ไม่เซฟขึ้นคลาวด์</p>
            </>
          ) : (
            <>
              <p className="text-[22px] leading-tight text-center">เซฟไว้เล่นได้ทุกเครื่อง</p>
              <p className="text-[16px] leading-snug text-center text-[#86522e]">เข้าสู่ระบบแล้วเกมจะเซฟขึ้นคลาวด์ให้เอง เปลี่ยนเครื่องก็เล่นต่อได้ และขึ้นกระดานอันดับกับเพื่อนๆ</p>
              {!native && (
                <button onClick={google} disabled={busy} className="cozy-btn w-full py-2 text-[19px] flex items-center justify-center gap-2" data-testid="sign-in-google">
                  <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>
                  เข้าสู่ระบบด้วย Google
                </button>
              )}
              <div className="flex flex-col gap-1.5">
                <p className="text-[15px] leading-none text-[#86522e]">{native ? "รับลิงก์เข้าสู่ระบบทางอีเมล" : "หรือรับลิงก์ทางอีเมล ไม่ต้องตั้งรหัส"}</p>
                <input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mahidol.ac.th"
                  className="w-full bg-[#fff6e3] border-[3px] border-[#3a2a2f] rounded-[4px] px-2.5 py-1.5 text-[18px] outline-none" data-testid="email" />
                <button onClick={sendLink} disabled={busy} className="cozy-btn cozy-btn-sky w-full py-1.5 text-[18px]" data-testid="send-link">ส่งลิงก์ให้หน่อย</button>
              </div>
              {usingEmulator && (
                <button data-testid="emulator-sign-in" className="cozy-btn w-full py-1 text-[14px]" onClick={async () => {
                  const e = email || "tester@example.com";
                  await signInWithEmailAndPassword(auth, e, "test-password").catch(() => createUserWithEmailAndPassword(auth, e, "test-password"));
                }}>emulator sign in</button>
              )}
            </>
          )}
          {note && <p className="text-[15px] leading-snug text-[#3f8a48]" data-testid="account-note">{note}</p>}
          {error && <p className="text-[15px] leading-snug text-[#a93c4b]" data-testid="account-error">{error}</p>}
        </div>
        <button onClick={() => { audio.playClick(); router.back(); }} className="cozy-btn px-6 py-1.5 text-[18px]" data-testid="account-back">กลับ</button>
      </div>
    </PageTransition>
  );
}
