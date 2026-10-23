"use client";

import { useEffect } from "react";
import { withBase } from "@/lib/basePath";

/** Something broke. Keep the save, offer a way back to the clinic. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="w-full h-[100dvh] cozy-night font-pixel flex items-center justify-center p-5">
      <div className="cozy-panel w-full max-w-sm p-4 text-center">
        <p className="text-[34px] leading-none">Oops</p>
        <p className="text-[18px] leading-snug mt-2">
          Kanom knocked something off the desk. Your save is safe.
          <span className="block mt-1 text-[#6b5258]">ขนมทำของตกจากโต๊ะ เซฟของหนูยังอยู่ครบ</span>
        </p>
        <div className="mt-4 flex gap-2">
          <button className="cozy-btn cozy-btn-sky flex-1 py-1.5 text-[19px]" onClick={() => reset()}>Try again</button>
          <button className="cozy-btn cozy-btn-leaf flex-1 py-1.5 text-[19px]" onClick={() => { window.location.href = withBase("/hub"); }}>Back to the clinic</button>
        </div>
      </div>
    </div>
  );
}
