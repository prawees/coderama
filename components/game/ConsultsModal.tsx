import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { useT } from "@/lib/i18n/useT";
import { PixelButton } from "@/components/ui/PixelButton";
import { useERStore } from "@/lib/erStore";

interface ConsultsModalProps {
  onClose: () => void;
}

export function ConsultsModal({ onClose }: ConsultsModalProps) {
  const { t } = useT();
  const [consults, setConsults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addXp, addCurrency } = useERStore();

  const fetchConsults = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "consults"), where("status", "==", "open"));
      const querySnapshot = await getDocs(q);
      const fetched: any[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filter out our own consults
      const othersConsults = fetched.filter((c: any) => c.requesterId !== auth.currentUser?.uid);
      setConsults(othersConsults);
    } catch (e) {
      console.error("Failed to fetch consults", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsults();
  }, []);

  const handleProvideConsult = async (consultId: string, isCorrect: boolean) => {
    try {
      const consultRef = doc(db, "consults", consultId);
      await updateDoc(consultRef, {
        status: "resolved",
        resolverId: auth.currentUser?.uid,
        resolvedAt: Date.now(),
        resolverWasCorrect: isCorrect
      });
      
      if (isCorrect) {
        addXp(50);
        addCurrency(100);
        alert("Consult provided! You earned 50 XP and $100!");
      } else {
        alert("Your consult was sent, but it might not have been the best advice...");
      }
      
      fetchConsults(); // Refresh list
    } catch (e) {
      console.error("Failed to update consult", e);
      alert("Error sending consult.");
    }
  };

  return (
    <div className="absolute inset-0 bg-[#0b1626]/80 z-50 flex items-center justify-center p-4">
      <PixelPanel className="w-full max-w-2xl max-h-[90vh] flex flex-col" variant="metal">
        <h2 className="font-heading text-sm text-[#ffd866] text-center mb-2">{t('cons.title')}</h2>
        <p className="text-center text-[#a9bfd9] text-lg mb-3">{t('cons.sub')}</p>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {loading ? (
            <div className="text-center text-[#a9bfd9] text-xl py-8 blink">{t('cons.loading')}</div>
          ) : (
            consults.map((consult) => (
              <div key={consult.id} className="bg-[#16263f] border-4 border-[#0b1626] p-3 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xl text-white">{t('cons.requested', { name: consult.requesterName })}</div>
                    <div className="text-base text-[#a9bfd9]">{consult.caseId}</div>
                  </div>
                  <div className="text-lg text-[#ffd866] bg-[#0b1626] px-2">{t('cons.reward')}</div>
                </div>
                
                <div className="bg-[#0b1626] p-2 text-lg text-[#f3f6ff] border-2 border-[#2c4a73]">
                  <span className="text-[#b5e2ff]">{t('cons.vitals')}:</span> {consult.vitals} <br/>
                  <span className="text-[#b5e2ff]">{t('cons.situation')}:</span> {consult.narrative}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {consult.options.map((opt: any, idx: number) => (
                    <PixelButton 
                      key={idx}
                      variant="secondary"
                      size="sm" className="whitespace-normal h-auto normal-case text-left"
                      onClick={() => handleProvideConsult(consult.id, opt.isCorrect)}
                    >
                      {t('cons.recommend')}: {opt.text}
                    </PixelButton>
                  ))}
                </div>
              </div>
            ))
          )}
          {!loading && consults.length === 0 && (
            <div className="text-center text-[#a9bfd9] text-xl py-8">{t('cons.empty')}</div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t-2 border-gray-800 flex justify-between">
          <PixelButton onClick={fetchConsults} variant="secondary">
            {t('cons.refresh')}
          </PixelButton>
          <PixelButton onClick={onClose} variant="primary">
            {t('cons.back')}
          </PixelButton>
        </div>
      </PixelPanel>
    </div>
  );
}
