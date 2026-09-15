import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { useERStore } from "@/lib/erStore";

interface ConsultsModalProps {
  onClose: () => void;
}

export function ConsultsModal({ onClose }: ConsultsModalProps) {
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
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <PixelPanel className="w-full max-w-2xl max-h-[90vh] flex flex-col" variant="dark">
        <h2 className="text-3xl text-pixel-primary font-bold text-center mb-2 uppercase">Doctors Lounge</h2>
        <p className="text-center text-gray-400 text-sm mb-4">Provide consults to other doctors to earn rewards!</p>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {loading ? (
            <div className="text-center text-gray-400 py-8 animate-pulse">Checking the pager for consult requests...</div>
          ) : (
            consults.map((consult) => (
              <div key={consult.id} className="bg-gray-900 border-2 border-gray-700 p-4 rounded flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white font-bold">{consult.requesterName} requested a consult!</div>
                    <div className="text-xs text-gray-400">Case: {consult.caseId} | Node: {consult.currentNodeId}</div>
                  </div>
                  <div className="text-xs text-pixel-gold bg-black px-2 py-1 rounded">Reward: 50 XP</div>
                </div>
                
                <div className="bg-black p-3 rounded text-sm text-gray-300 border border-gray-800">
                  <span className="text-pixel-accent">Vitals:</span> {consult.vitals} <br/>
                  <span className="text-pixel-accent">Situation:</span> {consult.narrative}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {consult.options.map((opt: any, idx: number) => (
                    <PixelButton 
                      key={idx}
                      variant="secondary"
                      className="text-xs py-2 whitespace-normal h-auto"
                      onClick={() => handleProvideConsult(consult.id, opt.isCorrect)}
                    >
                      Recommend: {opt.text}
                    </PixelButton>
                  ))}
                </div>
              </div>
            ))
          )}
          {!loading && consults.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              No open consults. Enjoy your coffee! ☕
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t-2 border-gray-800 flex justify-between">
          <PixelButton onClick={fetchConsults} variant="secondary">
            Refresh
          </PixelButton>
          <PixelButton onClick={onClose} variant="primary">
            Back to Shift
          </PixelButton>
        </div>
      </PixelPanel>
    </div>
  );
}
