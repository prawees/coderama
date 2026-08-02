"use client";

import { useState } from "react";
import case01 from "../../../public/locales/en/case_01.json";
import case02 from "../../../public/locales/en/case_02_fluids.json";
import case03 from "../../../public/locales/en/case_03_cardiac.json";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { useRouter } from "next/navigation";

const ALL_CASES: Record<string, any> = {
  "case_01": case01,
  "case_02_fluids": case02,
  "case_03_cardiac": case03
};

export default function ProfessorPortal() {
  const router = useRouter();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const selectedCase = selectedCaseId ? ALL_CASES[selectedCaseId] : null;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6 font-mono flex flex-col h-screen">
      <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-400">Toxico Learning - Professor Portal</h1>
          <p className="text-sm text-gray-400">Medical Case Auditing Dashboard</p>
        </div>
        <PixelButton onClick={() => router.push('/hub')} variant="primary" className="px-4 py-2 text-xs">
          BACK TO GAME
        </PixelButton>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Sidebar: Case List */}
        <div className="w-1/4 bg-[#161b22] border border-gray-700 rounded-lg p-4 overflow-y-auto">
          <h2 className="text-lg font-bold mb-4 text-gray-300 border-b border-gray-700 pb-2">Available Cases</h2>
          <div className="flex flex-col gap-2">
            {Object.keys(ALL_CASES).map(caseId => (
              <button
                key={caseId}
                onClick={() => setSelectedCaseId(caseId)}
                className={`text-left px-3 py-2 rounded text-sm transition-colors ${selectedCaseId === caseId ? 'bg-blue-900 border-blue-500 border' : 'bg-gray-800 hover:bg-gray-700 border border-transparent'}`}
              >
                {caseId}
              </button>
            ))}
          </div>
        </div>

        {/* Right Area: Case Viewer */}
        <div className="flex-1 bg-[#161b22] border border-gray-700 rounded-lg p-6 overflow-y-auto">
          {!selectedCase ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a case from the sidebar to review its logic.
            </div>
          ) : (
            <div>
              <div className="mb-6 border-b border-gray-700 pb-4">
                <h2 className="text-2xl text-green-400 font-bold mb-2">Reviewing: {selectedCaseId}</h2>
                <p className="text-gray-400 text-sm">Total Nodes: {Object.keys(selectedCase.nodes).length}</p>
              </div>

              <div className="flex flex-col gap-6">
                {Object.entries(selectedCase.nodes).map(([nodeId, nodeData]: [string, any]) => (
                  <div key={nodeId} className="bg-gray-900 border border-gray-700 rounded p-4 relative">
                    <span className="absolute -top-3 left-4 bg-gray-800 px-2 text-xs font-bold text-blue-300 border border-gray-600 rounded">
                      Node: {nodeId}
                    </span>
                    
                    <div className="mt-2 grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-black p-2 rounded border border-gray-800">
                        <span className="text-xs text-gray-500">BP:</span> <span className={nodeData.vitals.bp.includes('Critical') ? 'text-red-400' : 'text-green-400'}>{nodeData.vitals.bp}</span>
                      </div>
                      <div className="bg-black p-2 rounded border border-gray-800">
                        <span className="text-xs text-gray-500">HR:</span> <span className="text-green-400">{nodeData.vitals.hr}</span>
                      </div>
                      <div className="bg-black p-2 rounded border border-gray-800">
                        <span className="text-xs text-gray-500">O2:</span> <span className="text-green-400">{nodeData.vitals.o2}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-300 mb-4 bg-black p-3 rounded">{nodeData.narrative}</p>

                    {nodeData.options && nodeData.options.length > 0 ? (
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">Decisions</h4>
                        <div className="flex flex-col gap-2">
                          {nodeData.options.map((opt: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-[#21262d] p-2 rounded text-sm border-l-4 border-blue-500">
                              <span>{opt.text}</span>
                              <div className="flex gap-4">
                                <span className="text-xs text-gray-400">Req: <span className="text-yellow-400">{opt.requiredRank}</span></span>
                                <span className="text-xs text-gray-400">Target: <span className="text-purple-400">{opt.targetNode}</span></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 italic">Terminal Node (No options)</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
