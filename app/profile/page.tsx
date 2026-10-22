"use client";

import { useRouter } from "next/navigation";
import { useERStore, PlayerAppearance, getRankFromXp } from "@/lib/erStore";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { SpritePreview } from "@/components/game/SpritePreview";
import { PixelPortrait } from "@/components/game/PixelPortrait";
import { PageTransition } from "@/components/ui/PageTransition";
import { playerLookFrom } from "@/lib/playerLook";
import { getLocalizedRankTitle } from "@/lib/localization";
import { NPCS, heartsFor } from "@/lib/npcs";
import { LOCATION_NAMES, phaseForDay } from "@/lib/world/maps";
import { audio } from "@/lib/audio";

const SKIN = ["#ffdcc2", "#f4c7a1", "#e8b089", "#d19a6e", "#b97f55", "#9a6544"];
const HAIR = ["#2c2328", "#5a3a2a", "#7a4a2c", "#8a3f2c", "#b8b2ad", "#d9739a", "#5b7fbf"];
const TOP = ["#ffffff", "#9fd3e6", "#86c35f", "#f4c7d8", "#ffd66b", "#c98ad1", "#e07a3a"];
const BOTTOM = ["#333333", "#3f4a6b", "#5a5466", "#6e4428", "#2f5f4f"];

/** Your hospital ID card: who you are, where you work, and who you have become close to. */
export default function ProfilePage() {
  const router = useRouter();
  const { appearance, setAppearance, playerName, playerGender, lifetimeXp, currentDay, friendships, completedQuests, university, language } = useERStore();
  const tr = (en: string, th: string) => (language === "th" ? th : en);
  const rank = getRankFromXp(lifetimeXp || 0);
  const look = playerLookFrom(appearance, rank);
  const place = LOCATION_NAMES[phaseForDay(currentDay)][language];

  const set = (key: keyof PlayerAppearance, val: string) => {
    audio.playClick();
    setAppearance({ [key]: val } as Partial<PlayerAppearance>);
  };

  const friends = Object.entries(friendships || {})
    .filter(([id, pts]) => NPCS[id] && pts > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  const swatches = (label: string, key: keyof PlayerAppearance, options: string[]) => (
    <div className="flex flex-col gap-1">
      <span className="text-[15px] leading-none text-[#6b5258]">{label}</span>
      <div className="flex gap-1 flex-wrap">
        {options.map((c) => (
          <button
            key={c}
            aria-label={`${label} ${c}`}
            onClick={() => set(key, c)}
            className={`w-7 h-7 rounded-[3px] border-[3px] ${appearance?.[key]?.toLowerCase() === c ? "border-[#3a2a2f] scale-110" : "border-[#c9a77a]"}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <PageTransition>
      <div className="min-h-[100dvh] cozy-night font-pixel flex flex-col p-3 gap-3 pt-[calc(0.75rem+var(--safe-top))]" data-testid="profile">
        <div className="flex items-center justify-between">
          <PixelButton onClick={() => router.push("/hub")} variant="wood" className="text-[18px] px-3 py-1">◀ {tr("Back", "กลับ")}</PixelButton>
          <span className="cozy-tag px-2 py-1 text-[18px] leading-none flex items-center gap-1.5"><PixelIcon name="badge" size={15} />{tr("ID badge", "บัตรประจำตัว")}</span>
        </div>

        {/* The card itself, on a lanyard */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute left-1/2 -top-3 -translate-x-1/2 w-10 h-4 rounded-t-[4px] bg-[#6b4f78] border-[3px] border-b-0 border-[#3a2a2f]" />
          <div className="cozy-panel p-3">
            <div className="flex items-center justify-between text-[14px] leading-none text-[#6b5258] border-b-2 border-dashed border-[#e7d3a8] pb-1.5">
              <span>{place}</span>
              <span>{tr(`Day ${currentDay}`, `วันที่ ${currentDay}`)}</span>
            </div>
            <div className="flex gap-3 mt-2.5">
              <div className="w-24 h-32 shrink-0 rounded-[4px] border-[3px] border-[#3a2a2f] bg-[#cfe8d8] flex items-end justify-center overflow-hidden">
                <SpritePreview look={look} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <p className="text-[26px] leading-none truncate">{playerName}</p>
                <p className="text-[17px] leading-none mt-1 text-[#86522e]">{getLocalizedRankTitle(rank, playerName, playerGender, language)}</p>
                {university && university !== "Unknown" && <p className="text-[14px] leading-none mt-1.5 text-[#6b5258] truncate">{university}</p>}
                <div className="mt-auto flex flex-col gap-1 text-[15px] leading-none">
                  <span className="flex items-center gap-1.5"><PixelIcon name="quest" size={13} />{tr(`${(completedQuests || []).length} favours done`, `ช่วยงานสำเร็จ ${(completedQuests || []).length} ครั้ง`)}</span>
                  <span className="flex items-center gap-1.5"><PixelIcon name="heart" size={13} />{tr(`${friends.length} friends at work`, `เพื่อนที่ทำงาน ${friends.length} คน`)}</span>
                </div>
              </div>
            </div>

            {friends.length > 0 && (
              <div className="mt-3 flex gap-2">
                {friends.map(([id, pts]) => (
                  <div key={id} className="flex flex-col items-center gap-0.5" title={NPCS[id].name[language]}>
                    <div className="w-11 h-11 rounded-[3px] overflow-hidden border-2 border-[#3a2a2f]">
                      <PixelPortrait speaker={NPCS[id].name.en} className="w-full h-full" />
                    </div>
                    <span className="text-[13px] leading-none flex items-center gap-0.5"><PixelIcon name="heart" size={10} />{heartsFor(pts)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Wardrobe */}
        <div className="cozy-panel p-3 w-full max-w-sm mx-auto flex flex-col gap-2.5">
          <p className="text-[20px] leading-none">{tr("Locker", "ล็อกเกอร์")}</p>
          {swatches(tr("Skin", "สีผิว"), "skinColor", SKIN)}
          {swatches(tr("Hair", "สีผม"), "hairColor", HAIR)}
          <div className="flex flex-col gap-1">
            <span className="text-[15px] leading-none text-[#6b5258]">{tr("Hair style", "ทรงผม")}</span>
            <div className="flex gap-1">
              {[["hair_1", tr("Short", "สั้น")], ["hair_2", tr("Long", "ยาว")]].map(([v, lbl]) => (
                <button key={v} onClick={() => set("hairStyle", v)} className={`cozy-btn flex-1 py-1 text-[17px] ${appearance?.hairStyle === v ? "cozy-btn-sky" : ""}`}>{lbl}</button>
              ))}
            </div>
          </div>
          {swatches(tr("Shirt", "เสื้อ"), "topColor", TOP)}
          {swatches(tr("Pants", "กางเกง"), "bottomColor", BOTTOM)}
          <p className="text-[14px] leading-snug text-[#6b5258]">{tr("From intern year on, the white coat goes over whatever you wear.", "ตั้งแต่เป็นอินเทิร์น เสื้อกาวน์จะคลุมทับชุดที่ใส่")}</p>
        </div>
      </div>
    </PageTransition>
  );
}
