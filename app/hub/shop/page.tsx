"use client";

import { useRouter } from "next/navigation";
import { useERStore, GEAR_DATABASE, GearItem } from "@/lib/erStore";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { PageTransition } from "@/components/ui/PageTransition";
import { Coffee, Stethoscope, Shirt, Footprints } from "lucide-react";
import { audio } from "@/lib/audio";

export default function ShopPage() {
  const router = useRouter();
  const { currency, inventory, equipped, buyGear, equipGear } = useERStore();

  const handleBuy = (item: GearItem) => {
    if (currency >= item.cost) {
      audio.playCashRegister();
      buyGear(item.id, item.cost);
    }
  };

  const handleEquip = (item: GearItem) => {
    equipGear(item.id, item.type);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'stethoscope': return <Stethoscope className="w-8 h-8 text-pixel-health" />;
      case 'scrubs': return <Shirt className="w-8 h-8 text-pixel-gold" />;
      case 'shoes': return <Footprints className="w-8 h-8 text-pixel-success" />;
      default: return <Stethoscope className="w-8 h-8" />;
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0d1117] text-white font-pixel flex flex-col relative pb-[var(--safe-bottom)]">
        
        {/* Header */}
        <div className="bg-[#161b22] border-b-4 border-[#30363d] p-4 flex justify-between items-center shadow-lg pt-[calc(1rem+var(--safe-top))] z-10 sticky top-0">
          <PixelButton onClick={() => router.push('/hub')} className="text-sm px-4 py-2 bg-gray-800 border-2 border-gray-600 rounded active:bg-gray-700">
            &larr; BACK
          </PixelButton>
          <div className="text-right">
            <p className="text-xs text-gray-400">BALANCE</p>
            <p className="text-xl text-pixel-success font-bold drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">${currency}</p>
          </div>
        </div>

        {/* Shop Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <h1 className="text-3xl text-center text-pixel-gold drop-shadow-md mb-2">SUPPLY CLOSET</h1>

          {/* Consumable: Coffee */}
          <div className="bg-gradient-to-r from-[#2a1708] to-[#1a0f05] rounded-xl border-2 border-[#54341b] p-4 shadow-black shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-20">
              <Coffee className="w-24 h-24" />
            </div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <h3 className="text-xl text-orange-200">Double Espresso</h3>
                <p className="text-xs text-orange-400 mt-1">Consumable • Restores 50 Energy</p>
              </div>
              <div className={`text-lg font-bold ${currency >= 20 ? 'text-pixel-success' : 'text-pixel-alert'}`}>
                $20
              </div>
            </div>
            <div className="mt-4 relative z-10">
              <PixelButton 
                onClick={() => {
                  if (currency >= 20) {
                    audio.playCashRegister();
                    useERStore.getState().addCurrency(-20);
                    useERStore.getState().restoreEnergy(50);
                  }
                }} 
                disabled={currency < 20}
                className={`w-full py-3 text-lg ${currency < 20 ? 'opacity-50 grayscale' : 'bg-orange-600 border-orange-400 text-white'}`}
              >
                BUY & DRINK
              </PixelButton>
            </div>
          </div>

          <div className="h-1 bg-gray-800 rounded-full" />

          {/* Gear Grid */}
          <div className="grid grid-cols-2 gap-4">
            {Object.values(GEAR_DATABASE).map((item) => {
              const isOwned = inventory.includes(item.id);
              const isEquipped = equipped[item.type] === item.id;
              const canAfford = currency >= item.cost;

              return (
                <div key={item.id} className={`flex flex-col bg-[#161b22] border-2 rounded-lg p-3 shadow-md ${isEquipped ? 'border-pixel-gold bg-[#262111]' : 'border-[#30363d]'}`}>
                  <div className="flex-1 flex flex-col items-center text-center">
                    <div className="mb-2 p-3 bg-black rounded-full border border-gray-700 shadow-inner">
                      {getIcon(item.type)}
                    </div>
                    <h3 className="text-sm text-white font-bold mb-1 leading-tight">{item.name}</h3>
                    <p className="text-[10px] text-gray-400 mb-2">{item.statBonus.replace('_', ' ')}</p>
                    
                    {!isOwned && (
                      <p className={`text-sm font-bold mt-auto mb-3 ${canAfford ? 'text-pixel-success' : 'text-pixel-alert'}`}>
                        ${item.cost}
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-auto">
                    {!isOwned ? (
                      <PixelButton 
                        onClick={() => handleBuy(item)} 
                        disabled={!canAfford}
                        className={`w-full text-xs py-2 ${!canAfford ? 'opacity-50' : 'bg-blue-600 border-blue-400'}`}
                      >
                        BUY
                      </PixelButton>
                    ) : (
                      <PixelButton 
                        onClick={() => handleEquip(item)}
                        className={`w-full text-xs py-2 ${isEquipped ? 'bg-pixel-gold text-black border-yellow-300' : 'bg-gray-700 border-gray-500'}`}
                        disabled={isEquipped}
                      >
                        {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                      </PixelButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
