"use client"

import { Activity } from "lucide-react";
import type { VitalSign } from "./types";

export function VitalsPanel({
    vitals,
    requested,
    onRequest,
}: {
    vitals: Record<string, VitalSign>;
    requested: boolean;
    onRequest: () => void;
}) {
    if (!requested) {
        return (
            <div className="text-center py-12 bg-black/50 border border-ink-800 rounded-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <Activity size={48} className="text-ink-600 mb-4 animate-pulse" />
                    <p className="text-sm font-mono text-ink-500 mb-6 uppercase tracking-[0.2em]">Monitor Offline</p>
                    <button
                        onClick={onRequest}
                        className="rounded-full bg-emerald-900 border border-emerald-500/50 px-6 py-2 text-xs font-mono font-bold uppercase text-emerald-400 hover:bg-emerald-800 hover:text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] cursor-pointer"
                    >
                        Connect Leads
                    </button>
                </div>
            </div>
        );
    }

    const val = (key: string) => vitals[key] || { value: "---", abnormal: false };

    return (
        <div className="bg-black border-2 border-ink-900 rounded-lg p-4 font-mono select-none shadow-[inset_0_0_50px_rgba(0,0,0,1)] relative overflow-hidden">
            {/* Scanline effect overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none z-50"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {/* HR (ECG) - Green */}
                <div className="border-b border-r border-ink-900/50 p-2 flex flex-col justify-between relative">
                    <div className="flex justify-between items-start">
                        <span className="text-emerald-500 font-bold tracking-widest text-sm">ECG</span>
                        <div className={`text-5xl font-bold tracking-tighter ${val('hr').abnormal ? 'text-rose-500 animate-pulse' : 'text-emerald-400'} drop-shadow-[0_0_8px_currentColor]`}>
                            {val('hr').value}
                        </div>
                    </div>
                    {/* Fake Waveform */}
                    <div className="h-10 mt-2 border-b border-emerald-900/30 relative overflow-hidden flex items-end">
                        <svg className="w-full h-full text-emerald-500/50 absolute bottom-0 -left-full animate-[slideRight_2s_linear_infinite]" preserveAspectRatio="none" viewBox="0 0 100 20">
                            <path d="M0,10 L20,10 L25,0 L30,20 L35,10 L100,10" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
                            <path d="M100,10 L120,10 L125,0 L130,20 L135,10 L200,10" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
                        </svg>
                    </div>
                </div>

                {/* SpO2 - Yellow/Cyan */}
                <div className="border-b border-ink-900/50 p-2 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <span className="text-cyan-400 font-bold tracking-widest text-sm">SpO2</span>
                        <div className="flex items-baseline gap-1">
                            <div className={`text-5xl font-bold tracking-tighter ${val('spo2').abnormal ? 'text-rose-500 animate-pulse' : 'text-cyan-300'} drop-shadow-[0_0_8px_currentColor]`}>
                                {val('spo2').value}
                            </div>
                            <span className="text-cyan-600 text-sm">%</span>
                        </div>
                    </div>
                    <div className="h-10 mt-2 border-b border-cyan-900/30 relative overflow-hidden flex items-end">
                        <svg className="w-full h-full text-cyan-500/50 absolute bottom-0 -left-full animate-[slideRight_3s_linear_infinite]" preserveAspectRatio="none" viewBox="0 0 100 20">
                            <path d="M0,15 C20,15 25,5 30,5 C40,5 45,15 100,15" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
                            <path d="M100,15 C120,15 125,5 130,5 C140,5 145,15 200,15" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
                        </svg>
                    </div>
                </div>

                {/* NIBP - Red/Orange */}
                <div className="border-b border-r border-ink-900/50 p-2 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-rose-500 font-bold tracking-widest text-sm">NIBP</span>
                        <span className="text-rose-800 text-xs mt-1">mmHg</span>
                    </div>
                    <div className="flex items-baseline justify-end gap-1">
                        <div className={`text-4xl font-bold tracking-tighter ${val('sbp').abnormal || val('dbp').abnormal ? 'text-rose-500 animate-pulse drop-shadow-[0_0_10px_currentColor]' : 'text-rose-400 drop-shadow-[0_0_8px_currentColor]'}`}>
                            {val('sbp').value}
                            <span className="text-rose-700 mx-1 text-3xl">/</span>
                            {val('dbp').value}
                        </div>
                    </div>
                </div>

                {/* RR / TEMP / GCS - White/Gray */}
                <div className="border-b border-ink-900/50 p-2 grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                        <span className="text-amber-500 font-bold tracking-widest text-xs">RESP</span>
                        <div className={`text-3xl font-bold mt-1 ${val('rr').abnormal ? 'text-rose-500 animate-pulse' : 'text-amber-300'}`}>
                            {val('rr').value}
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-purple-400 font-bold tracking-widest text-xs">TEMP</span>
                        <div className={`text-2xl font-bold mt-1 ${val('temp').abnormal ? 'text-rose-500 animate-pulse' : 'text-purple-300'}`}>
                            {val('temp').value}<span className="text-sm text-purple-700">°C</span>
                        </div>
                    </div>
                    <div className="col-span-2 flex justify-between items-end mt-2 pt-2 border-t border-ink-900/30">
                        <span className="text-ink-400 font-bold tracking-widest text-xs">GCS</span>
                        <div className={`text-xl font-bold ${val('gcs').abnormal ? 'text-rose-500 animate-pulse' : 'text-ink-200'}`}>
                            {val('gcs').value} <span className="text-ink-600 text-sm">/15</span>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes slideRight {
                    from { transform: translateX(0); }
                    to { transform: translateX(100%); }
                }
            `}} />
        </div>
    );
}
