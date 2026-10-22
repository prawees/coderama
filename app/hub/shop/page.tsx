"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useERStore, GEAR_DATABASE, GearItem, UPGRADES_DATABASE } from "@/lib/erStore";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { PixelPortrait } from "@/components/game/PixelPortrait";
import { PageTransition } from "@/components/ui/PageTransition";
import { GIFTS } from "@/lib/gifts";
import { GIFT_ICON } from "@/lib/pixel/icons";
import { audio } from "@/lib/audio";

type Tab = "gifts" | "treats" | "gear" | "upgrades";

const GREETINGS = {
  gifts: { en: "Gifts for the people who keep you upright. Everyone has a favourite.", th: "ของขวัญให้คนที่ช่วยประคองหนูไว้ ทุกคนมีของโปรดนะ" },
  treats: { en: "Running on empty? Auntie has just the thing.", th: "หมดแรงแล้วเหรอ ป้ามีของดี" },
  gear: { en: "A good stethoscope is a friend for life.", th: "หูฟังดีๆ เป็นเพื่อนไปตลอดชีวิต" },
  upgrades: { en: "Fix up the department and everyone works happier.", th: "แต่งแผนกให้ดี ทุกคนก็ทำงานมีความสุขขึ้น" },
};

export default function ShopPage() {
  const router = useRouter();
  const { currency, inventory, equipped, buyGear, equipGear, hospitalUpgrades, buyUpgrade, gifts, buyGift, language } = useERStore();
  const [tab, setTab] = useState<Tab>("gifts");
  const [flash, setFlash] = useState<string | null>(null);
  const tr = (en: string, th: string) => (language === "th" ? th : en);

  const bought = (key: string) => {
    audio.playCashRegister();
    setFlash(key);
    setTimeout(() => setFlash((f) => (f === key ? null : f)), 600);
  };

  const gearIcon = (type: string) => (type === "stethoscope" ? "heart" : type === "scrubs" ? "badge" : "energy");
  const upgradeIcon = (icon: string) => (icon === "coffee" ? "coffee" : icon === "zap" ? "coin" : "bed");

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "gifts", label: tr("Gifts", "ของขวัญ"), icon: "garland" },
    { key: "treats", label: tr("Treats", "ของว่าง"), icon: "coffee" },
    { key: "gear", label: tr("Gear", "อุปกรณ์"), icon: "badge" },
    { key: "upgrades", label: tr("Upgrades", "ปรับปรุง"), icon: "bed" },
  ];

  const Card = ({ k, icon, title, sub, price, action }: { k: string; icon: string; title: string; sub: string; price?: number; action: React.ReactNode }) => (
    <div className={`flex items-center gap-2.5 bg-[#fff6e3] border-2 border-[#e7d3a8] rounded-[4px] p-2 ${flash === k ? "animate-[cozyWiggle_0.3s_ease-in-out_2]" : ""}`}>
      <div className="w-11 h-11 shrink-0 flex items-center justify-center rounded-[4px] border-2 border-[#3a2a2f] bg-[#f1d9a7]">
        <PixelIcon name={icon} size={26} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[18px] leading-none">{title}</p>
        <p className="text-[14px] leading-tight mt-1 text-[#6b5258]">{sub}</p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        {price !== undefined && (
          <span className={`flex items-center gap-1 text-[17px] leading-none tabular-nums ${currency >= price ? "" : "text-[#a93c4b]"}`}>
            <PixelIcon name="coin" size={13} />{price}
          </span>
        )}
        {action}
      </div>
    </div>
  );

  return (
    <PageTransition>
      <div className="h-[100dvh] cozy-night font-pixel flex flex-col p-3 gap-2 pt-[calc(0.75rem+var(--safe-top))]" data-testid="shop">
        <div className="flex items-center justify-between">
          <PixelButton onClick={() => router.push("/hub")} variant="wood" className="text-[18px] px-3 py-1">◀ {tr("Back", "กลับ")}</PixelButton>
          <div className="cozy-tag px-2 py-1 flex items-center gap-1.5">
            <PixelIcon name="coin" size={15} />
            <span className="text-[20px] leading-none tabular-nums">{currency}</span>
          </div>
        </div>

        <div className="cozy-panel p-2.5 flex gap-2.5 items-center">
          <div className="w-14 h-14 shrink-0 rounded-[3px] overflow-hidden border-2 border-[#3a2a2f]">
            <PixelPortrait speaker="Auntie Noi" className="w-full h-full" />
          </div>
          <div>
            <p className="text-[15px] leading-none text-[#86522e]">{tr("Auntie Noi, Supply Closet", "ป้าน้อย ห้องเก็บของ")}</p>
            <p className="text-[17px] leading-snug mt-1">{GREETINGS[tab][language]}</p>
          </div>
        </div>

        <div className="flex gap-1 px-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { audio.playClick(); setTab(t.key); }}
              className={`flex-1 flex items-center justify-center gap-1 py-1 text-[16px] leading-none rounded-t-[5px] border-[3px] border-b-0 border-[#3a2a2f] ${tab === t.key ? "bg-[#f8ecd0] text-[#3a2a2f] -mb-[3px] pb-[7px] relative z-10" : "bg-[#c48a52] text-[#fff3df]"}`}
              data-testid={`shop-tab-${t.key}`}
            >
              <PixelIcon name={t.icon} size={13} />{t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 cozy-panel p-2.5 overflow-y-auto flex flex-col gap-2">
          {tab === "gifts" && Object.values(GIFTS).map((g) => (
            <Card
              key={g.id}
              k={g.id}
              icon={GIFT_ICON[g.icon]}
              title={g.name[language]}
              sub={`${g.blurb[language]}${gifts[g.id] ? tr(` You have ${gifts[g.id]}.`, ` มีอยู่ ${gifts[g.id]}`) : ""}`}
              price={g.cost}
              action={
                <button
                  className="cozy-btn cozy-btn-leaf px-2.5 py-0.5 text-[16px]"
                  disabled={currency < g.cost}
                  onClick={() => { if (buyGift(g.id, g.cost)) bought(g.id); }}
                  data-testid={`buy-${g.id}`}
                >
                  {tr("Buy", "ซื้อ")}
                </button>
              }
            />
          ))}

          {tab === "treats" && (
            <Card
              k="espresso"
              icon="coffee"
              title={tr("Double Espresso", "เอสเพรสโซ่ช็อตคู่")}
              sub={tr("Drink it now. Restores 50 energy.", "ดื่มทันที ฟื้นพลังงาน 50")}
              price={20}
              action={
                <button
                  className="cozy-btn cozy-btn-sun px-2.5 py-0.5 text-[16px]"
                  disabled={currency < 20}
                  onClick={() => { if (currency >= 20) { useERStore.getState().addCurrency(-20); useERStore.getState().restoreEnergy(50); bought("espresso"); } }}
                >
                  {tr("Drink", "ดื่ม")}
                </button>
              }
            />
          )}

          {tab === "gear" && Object.values(GEAR_DATABASE).filter((g) => g.id !== "special_coffee").map((item: GearItem) => {
            const owned = inventory.includes(item.id);
            const isEquipped = equipped[item.type] === item.id;
            const bonus = item.statBonus === "XP_BOOST" ? tr("+10% XP", "+10% XP") : item.statBonus === "CASH_BOOST" ? tr("+20% pay", "+20% ค่าตอบแทน") : tr("Time passes slower", "เวลาผ่านไปช้าลง");
            return (
              <Card
                key={item.id}
                k={item.id}
                icon={gearIcon(item.type)}
                title={item.name}
                sub={bonus}
                price={owned ? undefined : item.cost}
                action={
                  !owned ? (
                    <button className="cozy-btn cozy-btn-leaf px-2.5 py-0.5 text-[16px]" disabled={currency < item.cost} onClick={() => { if (currency >= item.cost) { buyGear(item.id, item.cost); bought(item.id); } }}>{tr("Buy", "ซื้อ")}</button>
                  ) : (
                    <button className={`cozy-btn px-2.5 py-0.5 text-[16px] ${isEquipped ? "cozy-btn-sun" : ""}`} disabled={isEquipped} onClick={() => { audio.playClick(); equipGear(item.id, item.type); }}>
                      {isEquipped ? tr("Worn", "ใส่อยู่") : tr("Wear", "ใส่")}
                    </button>
                  )
                }
              />
            );
          })}

          {tab === "upgrades" && Object.values(UPGRADES_DATABASE).map((item) => {
            const owned = hospitalUpgrades.includes(item.id);
            return (
              <Card
                key={item.id}
                k={item.id}
                icon={upgradeIcon(item.icon)}
                title={item.name}
                sub={item.description}
                price={owned ? undefined : item.cost}
                action={
                  owned ? <span className="cozy-tag !bg-[#c8ecb4] px-1.5 py-0.5 text-[14px] leading-none">{tr("Installed", "ติดตั้งแล้ว")}</span>
                  : <button className="cozy-btn cozy-btn-leaf px-2.5 py-0.5 text-[16px]" disabled={currency < item.cost} onClick={() => { if (currency >= item.cost) { buyUpgrade(item.id, item.cost); bought(item.id); } }}>{tr("Buy", "ซื้อ")}</button>
                }
              />
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}
