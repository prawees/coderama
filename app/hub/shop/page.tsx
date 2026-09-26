"use client";

import { useRouter } from "next/navigation";
import { useERStore, GEAR_DATABASE, GearItem, UPGRADES_DATABASE } from "@/lib/erStore";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { Coffee, Stethoscope, Shirt, Footprints, Zap, Sofa, CupSoda } from "lucide-react";
import { audio } from "@/lib/audio";
import { useT } from "@/lib/i18n/useT";

const ICONS: Record<string, JSX.Element> = {
  stethoscope: <Stethoscope className="w-8 h-8" />, scrubs: <Shirt className="w-8 h-8" />, shoes: <Footprints className="w-8 h-8" />,
  coffee: <Coffee className="w-8 h-8" />, zap: <Zap className="w-8 h-8" />, sofa: <Sofa className="w-8 h-8" />, espresso: <CupSoda className="w-8 h-8" />,
};

function Item({ icon, name, desc, price, children, highlight }: { icon: string; name: string; desc: string; price?: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-3 border-4 p-2 ${highlight ? 'border-[#ffd866] bg-[#1e3a66]' : 'border-[#0b1626] bg-[#16263f]'}`}>
      <div className="w-14 h-14 shrink-0 bg-[#c7dafa] border-4 border-[#0b1626] flex items-center justify-center text-[#254671]">{ICONS[icon]}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xl leading-tight text-white">{name}</div>
        <div className="text-base leading-tight text-[#a9bfd9]">{desc}</div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {price && <span className="text-xl text-[#ffd866]">{price}</span>}
        {children}
      </div>
    </div>
  );
}

export default function ShopPage() {
  const router = useRouter();
  const { t } = useT();
  const { currency, inventory, equipped, buyGear, equipGear, hospitalUpgrades, buyUpgrade, addCurrency, restoreEnergy, energy, maxEnergy } = useERStore();
  const gear = Object.values(GEAR_DATABASE).filter((g) => g.id !== 'special_coffee');
  const coffee = GEAR_DATABASE['special_coffee'];

  const buyGearItem = (item: GearItem) => { if (currency >= item.cost && buyGear(item.id, item.cost)) audio.playCashRegister(); };

  return (
    <div className="absolute inset-0 bg-pixel-bg font-pixel p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-sm text-[#ffd866] tracking-widest">{t('shop.title')}</h1>
        <div className="flex items-center gap-4">
          <span className="text-xl text-[#a9bfd9]">{t('hub.energy')} {Math.round(energy)}/{maxEnergy}</span>
          <span className="bg-[#0b1626] border-4 border-[#2c4a73] px-3 py-1 text-2xl text-[#99e550]">{t('shop.balance')} ${currency}</span>
          <PixelButton size="sm" variant="primary" onClick={() => router.push('/hub')}>{t('nav.back_to_hub')}</PixelButton>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-3 gap-4">
        <PixelPanel variant="wood" title={t('shop.consumables')}>
          <div className="space-y-2 overflow-y-auto">
            <Item icon="espresso" name={t('shop.espresso_name')} desc={t('shop.espresso_desc')} price="$20">
              <PixelButton size="sm" variant="success" disabled={currency < 20} onClick={() => { if (currency < 20) return; audio.playCashRegister(); addCurrency(-20); restoreEnergy(50); }}>{t('shop.drink_now')}</PixelButton>
            </Item>
            <Item icon="coffee" name={t('shop.coffee_name')} desc={t('shop.coffee_desc')} price={`$${coffee.cost}`} highlight={inventory.includes('special_coffee')}>
              {inventory.includes('special_coffee')
                ? <span className="text-lg text-[#ffd866]">{t('shop.owned')}</span>
                : <PixelButton size="sm" variant="success" disabled={currency < coffee.cost} onClick={() => buyGearItem(coffee)}>{t('shop.buy')}</PixelButton>}
            </Item>
          </div>
        </PixelPanel>

        <PixelPanel variant="wood" title={t('shop.gear')}>
          <div className="space-y-2 overflow-y-auto">
            {gear.map((item) => {
              const owned = inventory.includes(item.id);
              const isEq = equipped[item.type] === item.id;
              return (
                <Item key={item.id} icon={item.type} name={t(`shop.item.${item.id}`)} desc={t(`shop.item.${item.id}_desc`)} price={owned ? undefined : `$${item.cost}`} highlight={isEq}>
                  {!owned
                    ? <PixelButton size="sm" variant="success" disabled={currency < item.cost} onClick={() => buyGearItem(item)}>{t('shop.buy')}</PixelButton>
                    : <PixelButton size="sm" variant={isEq ? 'gold' : 'secondary'} disabled={isEq} onClick={() => equipGear(item.id, item.type)}>{isEq ? t('shop.equipped') : t('shop.equip')}</PixelButton>}
                </Item>
              );
            })}
          </div>
        </PixelPanel>

        <PixelPanel variant="wood" title={t('shop.upgrades')}>
          <div className="space-y-2 overflow-y-auto">
            {Object.values(UPGRADES_DATABASE).map((item) => {
              const owned = hospitalUpgrades.includes(item.id);
              return (
                <Item key={item.id} icon={item.icon} name={t(`shop.item.${item.id}`)} desc={t(`shop.item.${item.id}_desc`)} price={owned ? undefined : `$${item.cost}`} highlight={owned}>
                  {owned ? <span className="text-lg text-[#ffd866]">{t('shop.owned')}</span>
                    : <PixelButton size="sm" variant="success" disabled={currency < item.cost} onClick={() => { if (currency >= item.cost && buyUpgrade(item.id, item.cost)) audio.playCashRegister(); }}>{t('shop.buy')}</PixelButton>}
                </Item>
              );
            })}
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}
