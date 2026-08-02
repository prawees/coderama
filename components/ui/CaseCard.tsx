"use client";

import { ActiveCase } from "@/lib/erStore";
import { useRouter } from "next/navigation";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";

export function CaseCard({ activeCase }: { activeCase: ActiveCase }) {
  const router = useRouter();
  
  return (
    <PixelPanel className="mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl text-pixel-gold mb-1">Fluids & Resuscitation</h3>
          <p className="text-sm text-pixel-text-muted uppercase">Room 3 • 45yo F</p>
        </div>
        <div className="bg-pixel-alert-dark text-white px-2 py-1 pixel-border-sm text-xs uppercase animate-pulse">
          CRITICAL
        </div>
      </div>
      
      <PixelButton 
        onClick={() => router.push(`/simulator/play/${activeCase.caseDataId}?instanceId=${activeCase.id}`)}
        className="w-full mt-2 text-sm"
        variant="primary"
      >
        TREAT PATIENT
      </PixelButton>
    </PixelPanel>
  );
}
