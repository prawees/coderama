"use client"

import Link from "next/link";
import { Activity, User as UserIcon, Play } from "lucide-react";
import { useGameStore } from "@/lib/store";
import { useEffect } from "react";

export default function CodeRamaHub() {
    // Reset game state when entering the hub
    const resetGame = useGameStore(state => state.resetGame);
    useEffect(() => {
        resetGame(30);
    }, [resetGame]);

    return (
        <div className="min-h-screen bg-canvas font-sans flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Grid & Gradient */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-iris-900/30 to-transparent pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center max-w-2xl w-full px-6 text-center">
                
                {/* Title Section */}
                <div className="mb-12 relative">
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-iris-200 to-iris-500 drop-shadow-[0_0_30px_rgba(79,70,229,0.8)]">
                        CODE RAMA
                    </h1>
                    <div className="absolute -inset-4 bg-iris-500/20 blur-3xl -z-10 rounded-full" />
                    <p className="mt-4 text-iris-300 uppercase tracking-[0.3em] font-mono text-sm font-bold">
                        Advanced Toxicology Simulator v2.0
                    </p>
                </div>

                {/* Main Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
                    <Link href="/simulator/v2/ekZU9TLV0HfmfMV2MVKe" className="group relative flex-1">
                        <div className="absolute inset-0 bg-iris-600 rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <button className="relative w-full flex items-center justify-center gap-3 bg-ink-950 border-2 border-iris-500 hover:bg-iris-900 text-white px-8 py-5 rounded-xl font-bold uppercase tracking-wider transition-all duration-300 transform group-hover:-translate-y-1">
                            <Play size={24} className="text-iris-400 group-hover:text-white transition-colors" />
                            Start Shift
                        </button>
                    </Link>

                    <Link href="/profile" className="group relative flex-1">
                        <div className="absolute inset-0 bg-ink-600 rounded-xl blur-lg opacity-30 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <button className="relative w-full flex items-center justify-center gap-3 bg-ink-900 border-2 border-ink-700 hover:border-ink-500 text-white px-8 py-5 rounded-xl font-bold uppercase tracking-wider transition-all duration-300 transform group-hover:-translate-y-1">
                            <UserIcon size={24} className="text-ink-400 group-hover:text-white transition-colors" />
                            ID Card
                        </button>
                    </Link>
                </div>

                {/* Decorative Stats/Info */}
                <div className="mt-20 flex items-center justify-center gap-8 text-ink-500 font-mono text-xs uppercase">
                    <div className="flex items-center gap-2">
                        <Activity size={14} className="text-emerald-500" />
                        <span>Systems Nominal</span>
                    </div>
                    <div className="w-1 h-1 bg-ink-700 rounded-full"></div>
                    <div>
                        Build 2026.1
                    </div>
                </div>
            </div>
        </div>
    );
}
