"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Activity, Stethoscope, FlaskConical, Pill, Heart, Bone, FileText, AlertTriangle, Clock, Syringe, Play } from "lucide-react";
import type { CaseData, VitalSign, PlayerEvent, OutcomeNodeData, Investigation, ManagementNode } from "./types";
import { VITAL_DEFS, DISEASES_DB } from "./database";
import { Modal } from "./ui";
import { MainMenu } from "./MainMenu";
import { calculateXp, saveXpLocally, XpBreakdown, RankTier } from "@/lib/gamification";
import { useGameStore } from "@/lib/store";
import { gameEvents } from "@/lib/events";
import { Rnd } from "react-rnd";
import { GameCanvas } from "./GameCanvas";
import { VitalsPanel } from "./VitalsPanel";
import { ExamPanel } from "./ExamPanel";
import { InvestigationsPanel } from "./InvestigationsPanel";
import { ImagingPanel } from "./ImagingPanel";
import { HistoryPanel } from "./HistoryPanel";
import { ManagementPanel } from "./ManagementPanel";
import { getOutgoingNodes, isInterventionRequired } from "./utils";
import { NodeUserData } from "three/webgpu";

type ActionTab = "vitals" | "history" | "exam" | "investigations" | "imaging" | "management";

const TABS: { key: ActionTab; label: string; icon: typeof Heart }[] = [
    { key: "vitals", label: "Vital Signs", icon: Activity },
    { key: "history", label: "History", icon: FileText },
    { key: "exam", label: "Physical Exam", icon: Stethoscope },
    { key: "investigations", label: "Investigations", icon: FlaskConical },
    { key: "imaging", label: "Imaging", icon: Bone },
    { key: "management", label: "Management", icon: Pill },
];

/* ------------------------------------------------------------------ */
/*  Game state                                                          */
/* ------------------------------------------------------------------ */

const GAME_DURATION_MINUTES = 30;
const TOTAL_GAME_SECONDS = GAME_DURATION_MINUTES * 60;

/* ------------------------------------------------------------------ */
/*  Main PlayCase component                                            */
/* ------------------------------------------------------------------ */

export default function PlayCase({ caseId }: { caseId: string }) {
    const [caseData, setCaseData] = useState<CaseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Game state
    const [activeTab, setActiveTab] = useState<ActionTab | null>(null); // null means closed
    const [vitalsRequested, setVitalsRequested] = useState(false);
    const [examinedSystems, setExaminedSystems] = useState<Set<string>>(new Set());
    const [requestedTests, setRequestedTests] = useState<Set<string>>(new Set());
    const [selectedInterventions, setSelectedInterventions] = useState<Set<string>>(new Set());
    const [selectedDoses, setSelectedDoses] = useState<Record<string, string>>({});
    const [requiredActions, setRequiredActions] = useState<string[][] | null>(null);
    const [requiredDoseMap, setRequiredDoseMap] = useState<Record<string, string> | null>(null);
    const [imagingResult, setImagingResult] = useState<Investigation | null>(null);
    const [outcomeModal, setOutcomeModal] = useState<OutcomeNodeData | null>(null);

    const { gameStarted, gameOver, gameOverReason, elapsed, minutes, seconds, health, playerEvents, startGame: storeStartGame, endGame, tickTimer, addPlayerEvent, resetGame } = useGameStore();

    // Helper setters for legacy code
    const setHealth = useCallback((val: number | ((h: number) => number)) => {
        useGameStore.setState(s => ({ health: typeof val === 'function' ? val(s.health) : val }));
    }, []);
    const setGameOver = useCallback((val: boolean) => useGameStore.setState({ gameOver: val }), []);
    const setGameOverReason = useCallback((val: any) => useGameStore.setState({ gameOverReason: val }), []);
    const setElapsed = useCallback((val: number | ((e: number) => number)) => {
        useGameStore.setState(s => ({ elapsed: typeof val === 'function' ? val(s.elapsed) : val }));
    }, []);
    const setMinutes = useCallback((val: number) => useGameStore.setState({ minutes: val }), []);
    const setSeconds = useCallback((val: number) => useGameStore.setState({ seconds: val }), []);
    const setGameStarted = useCallback((val: boolean) => useGameStore.setState({ gameStarted: val }), []);
    
    
    
    
    
    
    
    
    const [diagnosisInput, setDiagnosisInput] = useState("");
    const [activeIdx, setActiveIdx] = useState(-1);
    const [diagnosisResult, setDiagnosisResult] = useState<"correct" | "wrong" | null>(null);
    const [xpResult, setXpResult] = useState<{ breakdown: XpBreakdown, newRank: RankTier } | null>(null);
    const [currentNode, setCurrentNode] = useState<ManagementNode | null>(null);
    const [unlockedDispositions, setUnlockedDispositions] = useState<string[]>([]);
    
    

    const recordEvent = useCallback((event: PlayerEvent) => {
        addPlayerEvent(event);
    }, [addPlayerEvent]);

    // Timer
    useEffect(() => {
        if (!gameStarted || gameOver) return;
        const interval = setInterval(() => {
            tickTimer(TOTAL_GAME_SECONDS);
        }, 1000);
        return () => clearInterval(interval);
    }, [gameStarted, gameOver, tickTimer]);

    // Check for timeout from store state
    useEffect(() => {
        if (gameOver && gameOverReason?.event === "timeOut" && !playerEvents.some(e => e.kind === "game_over")) {
            recordEvent({ kind: "game_over", timestamp: elapsed, reason: "time_expired" });
        }
    }, [gameOver, gameOverReason, elapsed, recordEvent, playerEvents]);

    // Health reaches 0 → game over
    useEffect(() => {
        if (!gameStarted || gameOver || health > 0) return;
        setGameOver(true);
        setGameOverReason({ event: "patientDied", description: "Patient's health has reached zero." });
        recordEvent({ kind: "game_over", timestamp: elapsed, reason: "health_depleted" });
    }, [health, gameStarted, gameOver, elapsed, recordEvent]);

    // Fetch
    useEffect(() => {
        (async () => {
            try {
                const snap = await getDoc(doc(db, "simulations", caseId));
                if (snap.exists()) {
                    setCaseData(snap.data() as CaseData);
                    console.log(snap.data())
                } else {
                    setError("Case not found.");
                }
            } catch {
                setError("Failed to load case.");
            } finally {
                setLoading(false);
            }
        })();
    }, [caseId]);

    const startGame = useCallback(() => {
        setGameStarted(true);
        setHealth(100);
        recordEvent({ kind: "game_start", timestamp: elapsed });
    }, [recordEvent, elapsed]);

    const requestVitals = useCallback(() => {
        setVitalsRequested(true);
        recordEvent({ kind: "vitals_requested", timestamp: elapsed });
    }, [recordEvent, elapsed]);

    const requestExam = useCallback((sys: string) => {
        setExaminedSystems((prev) => new Set(prev).add(sys));
        recordEvent({ kind: "exam_performed", timestamp: elapsed, system: sys });
    }, [recordEvent, elapsed]);

    const requestBundle = useCallback((testNames: string[], cost: number, bundleName?: string) => {
        setRequestedTests((prev) => {
            const next = new Set(prev);
            testNames.forEach((n) => next.add(n));
            return next;
        });
        recordEvent({ kind: "test_ordered", timestamp: elapsed, name: bundleName ?? testNames[0] });
        setElapsed((e) => e + cost);
        setHealth((h) => Math.max(0, h - (cost / TOTAL_GAME_SECONDS) * 100));
        const total = minutes * 60 + seconds - cost;
        if (total <= 0) {
            setGameOver(true);
            setGameOverReason({ event: "timeOut", description: "Time has expired." });
            setMinutes(0);
            setSeconds(0);
        } else {
            setMinutes(Math.floor(total / 60));
            setSeconds(total % 60);
        }
    }, [minutes, seconds, recordEvent, elapsed]);

    const applyIntervention = useCallback((name: string, dose?: string) => {
        const nextSelected = new Set(selectedInterventions);
        nextSelected.add(name);
        setSelectedInterventions(nextSelected);

        if (dose) {
            setSelectedDoses((prev) => ({ ...prev, [name]: dose }));
        }

        recordEvent({ kind: "intervention_applied", timestamp: elapsed, name, dose });

        if (requiredActions) {
            const allFulfilled = requiredActions.every((group) =>
                group.some((action) => nextSelected.has(action))
            );
            if (allFulfilled) {
                setGameOver(true);
                setGameOverReason({ event: "won", description: "All required interventions completed." });
                recordEvent({ kind: "game_over", timestamp: elapsed, reason: "all_required_done" });
            }
        }

        const isRequired = requiredActions?.some((group) => group.includes(name));
        const requiredDoseOk = !isRequired || !requiredDoseMap?.[name] || requiredDoseMap[name] === dose;

        if (isRequired && requiredDoseOk) {
            const rewardNarrative = `"${name}" is the correct intervention. The patient is responding well.`;
            const rewardData: OutcomeNodeData = {
                outcomeType: "improved",
                narrative: rewardNarrative,
                newSymptoms: "",
                vitalChanges: {},
            };
            setOutcomeModal(rewardData);
            recordEvent({ kind: "outcome", timestamp: elapsed, outcomeType: "improved" });
            setHealth((h) => Math.min(100, h + 25));
        }

        if (caseData) {
            const graph = caseData.managementGraph;
            const startNode = graph.nodes.find(n => n.type === "start");

            if (startNode) {
                let outgoing: ManagementNode[];
                if (currentNode === null) {
                    outgoing = getOutgoingNodes(graph, startNode.id);
                }
                else {
                    console.log("currentNode", currentNode)
                    outgoing = getOutgoingNodes(graph, currentNode.id);
                }
                // no currentNode set, starting node it is
                const doseMatched = outgoing.find((n) =>
                    n.type === "intervention" &&
                    (n.data as any).actions?.includes(name) &&
                    (!(n.data as any).doseMap?.[name] || (n.data as any).doseMap[name] === dose)
                );

                const requiredNode = outgoing.find(n => n.type === "required");
                if (requiredNode) {
                    console.log("requiredNode unlocked", requiredNode);
                    setRequiredActions((requiredNode.data as any).actions.map((g: any) => g.or ?? g));
                    setRequiredDoseMap((requiredNode.data as any).doseMap ?? null);
                }
                // correct dose + intervention
                if (doseMatched) {
                    const outcomeNode = getOutgoingNodes(graph, doseMatched.id).find(n => n.type === "outcome");
                    // user gave intervention with outcome -> continue
                    if (outcomeNode) {
                        setCurrentNode(outcomeNode);
                        console.log(outcomeNode);
                        const data = outcomeNode.data;
                        const outcomeType = data.outcomeType;
                        setOutcomeModal(data);
                        recordEvent({ kind: "outcome", timestamp: elapsed, outcomeType: data.outcomeType });
                        if (outcomeType !== "unlockEvent") {
                            if (outcomeType === "deteriorated") {
                                setHealth(health - 30);
                            }
                            else if (outcomeType === "critical") {
                                setHealth(health - 70);
                            }
                            else if (outcomeType === "improved") {
                                if (health + 10 < 100) {
                                    setHealth(health + 10);
                                }
                                else {
                                    setHealth(100)
                                }
                            }
                            setCaseData((prev) => {
                                if (!prev) return prev;
                                const merged = { ...prev.vitals };
                                for (const [key, val] of Object.entries(data.vitalChanges)) {
                                    if (val) {
                                        merged[key] = { value: val as string, abnormal: true };
                                    }
                                }
                                return { ...prev, vitals: merged };
                            });
                        } else {
                            setUnlockedDispositions((data as any).unlockedDispositions ?? []);
                        }
                        }
                    } else {
                    // wrong dose or drug 
                    const nameMatched = outgoing.find((n) =>
                        n.type === "intervention" &&
                        (n.data as any).actions?.includes(name)
                    );
                    if (nameMatched) {
                        if (!(isRequired && requiredDoseOk)) {
                            const fallbackData: OutcomeNodeData = {
                                outcomeType: "deteriorated",
                                narrative: `"${name}" — wrong dose. The patient is not responding as expected.`,
                                newSymptoms: "",
                                vitalChanges: {},
                            };
                            setHealth((h) => Math.max(0, h - 30));
                            setOutcomeModal(fallbackData);
                            recordEvent({ kind: "outcome", timestamp: elapsed, outcomeType: "deteriorated" });
                        }
                    } else if (!isRequired) {
                        const fallbackData: OutcomeNodeData = {
                            outcomeType: "deteriorated",
                            narrative: `"${name}" is not an appropriate intervention for this case.`,
                            newSymptoms: "",
                            vitalChanges: {},
                        };
                        setHealth((h) => Math.max(0, h - 30));
                        setOutcomeModal(fallbackData);
                        recordEvent({ kind: "outcome", timestamp: elapsed, outcomeType: "deteriorated" });
                    }
                }
            }

        }
    }, [recordEvent, caseData, elapsed, requiredActions, requiredDoseMap, selectedInterventions]);

    const vitalRandCache = useRef<Map<string, string>>(new Map()).current;

    const resolvedVitals = useMemo(() => {
        const raw = caseData?.vitals || {};
        const out: Record<string, VitalSign> = {};
        for (const def of VITAL_DEFS) {
            const existing = raw[def.key];
            if (existing && existing.value) {
                out[def.key] = existing;
            } else {
                let cached = vitalRandCache.get(def.key);
                if (!cached) {
                    const [lo, hi] = def.normal;
                    const isInt = def.key === "hr" || def.key === "sbp" || def.key === "dbp" || def.key === "rr" || def.key === "spo2" || def.key === "gcs";
                    cached = isInt ? String(Math.round(lo + Math.random() * (hi - lo))) : (lo + Math.random() * (hi - lo)).toFixed(1);
                    vitalRandCache.set(def.key, cached);
                }
                const existingAbnormal = existing?.abnormal ?? false;
                out[def.key] = { value: cached, abnormal: existingAbnormal };
            }
        }
        return out;
    }, [caseData?.vitals, vitalRandCache]);

    const diagnosisSuggestions = useMemo(() => {
        if (!diagnosisInput.trim() || diagnosisResult) return [];
        const lower = diagnosisInput.toLowerCase();
        if (DISEASES_DB.some((d) => d.name.toLowerCase() === lower)) return [];
        return DISEASES_DB.filter((d) => d.name.toLowerCase().includes(lower));
    }, [diagnosisInput, diagnosisResult]);

    const handleDiagnosisSubmit = useCallback(() => {
        const correct = caseData?.diagnoses ?? [];
        const isCorrect = correct.some((d) => d.toLowerCase() === diagnosisInput.trim().toLowerCase());
        if (isCorrect) {
            setDiagnosisResult("correct");
        } else {
            setDiagnosisResult("wrong");
        }
        
        // Calculate XP
        if (gameOverReason) {
            const won = gameOverReason.event === "won";
            const breakdown = calculateXp(health, elapsed, TOTAL_GAME_SECONDS, isCorrect, won);
            const { newRank } = saveXpLocally(breakdown.total);
            setXpResult({ breakdown, newRank });
        }
    }, [diagnosisInput, caseData, gameOverReason, health, elapsed]);

    const handleDiagnosisKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (activeIdx >= 0 && activeIdx < diagnosisSuggestions.length) {
                setDiagnosisInput(diagnosisSuggestions[activeIdx].name);
                setActiveIdx(-1);
            } else {
                handleDiagnosisSubmit();
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((prev) => Math.min(prev + 1, diagnosisSuggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((prev) => Math.max(prev - 1, -1));
        } else if (e.key === "Escape") {
            setActiveIdx(-1);
        }
    }, [diagnosisSuggestions, activeIdx, handleDiagnosisSubmit]);

    // Loading
    if (loading) {
        return (
            <div className="flex items-center justify-center gap-2 bg-canvas font-sans text-ink-500 text-sm" style={{ height: "calc(100vh - 48px)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-iris-600 animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                </svg>
                Loading case…
            </div>
        );
    }

    if (error || !caseData) {
        return (
            <div className="flex items-center justify-center bg-canvas font-sans" style={{ height: "calc(100vh - 48px)" }}>
                <div className="text-center">
                    <AlertTriangle size={32} className="text-ink-400 mx-auto mb-3" />
                    <p className="text-sm text-ink-500">{error || "Could not load case."}</p>
                </div>
            </div>
        );
    }

    // Start screen
    if (!gameStarted) {
        return <MainMenu caseData={caseData} onStart={startGame} />;
    }

    const gameTimeUp = gameOver || (minutes === 0 && seconds === 0);

    return (
        <div className="fixed inset-x-0 top-12 bottom-0 bg-canvas font-sans">
            {/* Full-screen 3D scene */}
            <div className="absolute inset-0">
                <GameCanvas
                    vitals={resolvedVitals}
                    vitalsVisible={vitalsRequested}
                    elapsed={elapsed}
                    minutes={gameTimeUp ? 0 : minutes}
                    seconds={gameTimeUp ? 0 : seconds}
                    gameOver={gameTimeUp}
                    patientAppearance={caseData.patientAppearance}
                />
            </div>

            {/* 2026 HUD: Elapsed timer + health bar */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
                <div className="relative group">
                    {/* Sci-fi angled background wrapper */}
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md border border-iris-500 -skew-x-12 shadow-[0_0_25px_rgba(79,70,229,0.5)]"></div>
                    <div className="relative px-6 py-2 flex items-center gap-2">
                        <Clock size={16} className="text-iris-400 animate-pulse" />
                        <span className="text-lg font-mono font-bold text-white tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
                            {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
                        </span>
                    </div>
                </div>

                <div className="relative group">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md border border-ink-700 -skew-x-12 shadow-lg"></div>
                    <div className="relative px-6 py-2 flex items-center gap-3">
                        <div className="w-32 h-2.5 bg-ink-900 rounded-sm overflow-hidden border border-ink-800 shadow-inner">
                            <div
                                className="h-full transition-all duration-1000 relative"
                                style={{
                                    width: `${health}%`,
                                    background: health > 50
                                        ? "linear-gradient(90deg, #059669, #34d399)"
                                        : health > 25
                                            ? "linear-gradient(90deg, #d97706, #fbbf24)"
                                            : "linear-gradient(90deg, #b91c1c, #f87171)",
                                }}
                            >
                                {/* Health glow effect */}
                                <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/30 blur-sm" />
                            </div>
                        </div>
                        <span className="text-sm font-bold font-mono text-white w-10 text-right drop-shadow-md">
                            {Math.round(health)}%
                        </span>
                    </div>
                </div>

                {gameTimeUp && (
                    <div className="relative animate-bounce">
                        <div className="absolute inset-0 bg-rose-900/90 backdrop-blur-md border border-rose-500 -skew-x-12 shadow-[0_0_20px_rgba(225,29,72,0.8)]"></div>
                        <div className="relative px-6 py-2 text-sm font-bold text-white tracking-widest uppercase">
                            Time is up!
                        </div>
                    </div>
                )}
            </div>

            {/* 2026 HUD: Event log (Terminal style) */}
            <div className="absolute top-6 left-6 z-10 flex flex-col gap-2 w-[340px] max-h-[50vh] overflow-hidden">
                <div className="bg-ink-950/70 backdrop-blur-xl border-l-4 border-iris-500 rounded-r-xl shadow-2xl p-4 relative before:absolute before:inset-0 before:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] before:bg-[size:100%_4px] before:pointer-events-none">
                    <p className="text-[10px] font-mono font-bold text-iris-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-iris-500 rounded-full animate-ping"></span>
                        Action Feed
                    </p>
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[40vh] pr-2 custom-scrollbar">
                        {playerEvents.length === 0 && (
                            <p className="text-xs text-ink-300 italic">No events yet</p>
                        )}
                        {playerEvents.map((ev, i) => {
                        const time = `${String(Math.floor(ev.timestamp / 60)).padStart(2, "0")}:${String(ev.timestamp % 60).padStart(2, "0")}`;
                        const icon = ev.kind === "game_start" ? <Play size={12} /> :
                            ev.kind === "vitals_requested" ? <Activity size={12} /> :
                                ev.kind === "exam_performed" ? <Stethoscope size={12} /> :
                                    ev.kind === "test_ordered" ? <FlaskConical size={12} /> :
                                        ev.kind === "intervention_applied" ? <Syringe size={12} /> :
                                            ev.kind === "outcome" ? <AlertTriangle size={12} /> :
                                                ev.kind === "game_over" ? <Clock size={12} /> : null;
                        const label = ev.kind === "game_start" ? "Game started" :
                            ev.kind === "vitals_requested" ? "Vitals requested" :
                                ev.kind === "exam_performed" ? `Exam: ${ev.system}` :
                                    ev.kind === "test_ordered" ? `Test: ${ev.name}` :
                                        ev.kind === "intervention_applied" ? `Rx: ${ev.name}` :
                                            ev.kind === "outcome" ? `Outcome: ${ev.outcomeType}` :
                                                ev.kind === "game_over" ? "Time's up!" : ev.kind;
                        const outcomeBg: Record<string, string> = {
                            improved: "bg-emerald-100",
                            deteriorated: "bg-rose-100",
                            critical: "bg-red-100",
                            unchanged: "bg-ink-100",
                        };
                        const outcomeBgClass = ev.kind === "outcome" ? outcomeBg[ev.outcomeType] ?? "bg-ink-800/50" : "bg-black/60 border border-ink-700 hover:border-iris-400 backdrop-blur-md transition-colors";
                        return (
                            <div key={i} className={`flex items-center gap-2.5 text-xs rounded-md px-2 py-1.5 ${outcomeBgClass}`}>
                                <span className="text-iris-300 font-bold font-mono text-[11px] w-9 shrink-0 drop-shadow-md">{time}</span>
                                <span className="shrink-0 text-white/70">{icon}</span>
                                <span className="truncate text-white font-medium">{label}</span>
                            </div>
                        );
                    })}
                </div>
                </div>
            </div>
            {/* Active panel overlay (Telltale style) */}
            {activeTab && (
                <div className="absolute inset-0 z-30 pointer-events-none">
                <Rnd
                    default={{
                        x: window.innerWidth / 2 - 384,
                        y: window.innerHeight / 2 - 200,
                        width: 768,
                        height: 'auto',
                    }}
                    bounds="parent"
                    enableResizing={false}
                    dragHandleClassName="drag-handle"
                    className="pointer-events-auto absolute"
                >
                    <div className="relative w-full max-h-[70vh] overflow-hidden flex flex-col bg-ink-950/95 backdrop-blur-xl rounded-xl shadow-[0_10px_50px_rgba(0,0,0,0.8)] border border-iris-500/40 text-white pointer-events-auto">
                        <div className="drag-handle w-full h-8 cursor-grab active:cursor-grabbing bg-ink-900/50 border-b border-ink-800 flex items-center justify-center">
                            <div className="w-12 h-1.5 bg-ink-700 rounded-full" />
                        </div>
                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 relative">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-iris-500 to-transparent opacity-50" />
                        <button 
                            onClick={() => setActiveTab(null)}
                            className="absolute top-6 right-6 text-ink-400 hover:text-white bg-ink-900 p-2 rounded-full hover:bg-iris-600 hover:shadow-[0_0_15px_rgba(79,70,229,0.8)] transition-all"
                        >
                            ✕
                        </button>
                        <h2 className="text-2xl font-bold mb-6 tracking-wide uppercase border-b border-ink-800 pb-4">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-ink-400">
                                {TABS.find(t => t.key === activeTab)?.label}
                            </span>
                        </h2>
                        
                        {activeTab === "vitals" && (
                            <VitalsPanel
                                vitals={resolvedVitals}
                                requested={vitalsRequested}
                                onRequest={requestVitals}
                            />
                        )}
                        {activeTab === "history" && (
                            <HistoryPanel data={caseData} />
                        )}
                        {activeTab === "exam" && (
                            <ExamPanel
                                findings={caseData.exam}
                                onRequest={requestExam}
                                requestedSystems={examinedSystems}
                            />
                        )}
                        {activeTab === "investigations" && (
                            <InvestigationsPanel
                                caseInvestigations={caseData.investigations}
                                requestedTests={requestedTests}
                                onRequestBundle={requestBundle}
                            />
                        )}
                        {activeTab === "imaging" && (
                            <ImagingPanel
                                caseInvestigations={caseData.investigations}
                                requestedTests={requestedTests}
                                onRequestBundle={requestBundle}
                                onViewResult={setImagingResult}
                            />
                        )}
                        {activeTab === "management" && (
                            <ManagementPanel
                                caseData={caseData}
                                selectedInterventions={selectedInterventions}
                                unlockedDispositions={unlockedDispositions}
                                onSelectIntervention={applyIntervention}
                            />
                        )}
                        </div>
                    </div>
                </Rnd>
                </div>
            )}
            {/* Game over modal */}
            {(() => {
                if (!gameOverReason) return null;
                const eventConfig = {
                    won: { icon: "🏆", title: "You Won!", color: "text-emerald-700" },
                    patientDied: { icon: "💀", title: "Patient Died", color: "text-red-700" },
                    timeOut: { icon: "⏰", title: "Time's Up", color: "text-amber-700" },
                };
                const cfg = eventConfig[gameOverReason.event];
                return (
                    <Modal open zIndex="z-[60]">
                        <div className="p-8 text-center">
                            <span className="text-4xl mb-3 block">{cfg.icon}</span>
                            <h2 className={`text-2xl font-bold ${cfg.color} mb-2`}>{cfg.title}</h2>
                            <p className="text-sm text-ink-600 mb-6">{gameOverReason.description}</p>
                            <p className="text-xs text-ink-400 mb-6">Elapsed time: {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}</p>
                            <div className="border-t border-ink-900/8 pt-6">
                                <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">What is your diagnosis?</label>
                                <div className="relative mb-3">
                                    <input
                                        type="text"
                                        value={diagnosisInput}
                                        onChange={(e) => { setDiagnosisInput(e.target.value); setActiveIdx(-1); setDiagnosisResult(null); }}
                                        onKeyDown={handleDiagnosisKeyDown}
                                        className="w-full rounded-lg border border-ink-900/16 px-3 py-2.5 text-sm text-ink-900 placeholder-ink-300 outline-none focus:border-iris-600 transition-colors"
                                        placeholder="Enter diagnosis..."
                                        disabled={!!diagnosisResult}
                                    />
                                    {diagnosisSuggestions.length > 0 && !diagnosisResult && (
                                        <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white rounded-lg border border-ink-900/8 shadow-lg max-h-48 overflow-y-auto">
                                            {diagnosisSuggestions.map((d, i) => (
                                                <button
                                                    key={d.id}
                                                    onMouseDown={() => { setDiagnosisInput(d.name); setActiveIdx(-1); }}
                                                    className={`w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors ${i === activeIdx ? "bg-iris-100 text-iris-700" : "text-ink-700 hover:bg-ink-50"}`}
                                                >
                                                    {d.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {diagnosisResult === "correct" && (
                                    <p className="text-sm font-semibold text-emerald-600 mb-3">✓ Correct diagnosis!</p>
                                )}
                                {diagnosisResult === "wrong" && (
                                    <p className="text-sm font-semibold text-rose-600 mb-3">✗ Incorrect. Correct diagnoses: {caseData.diagnoses.join(", ")}</p>
                                )}
                                {xpResult && (
                                    <div className="bg-ink-50 rounded-lg p-4 mb-4 text-left">
                                        <h3 className="text-sm font-bold text-ink-900 mb-2">XP Earned</h3>
                                        <div className="flex justify-between text-xs text-ink-700 mb-1">
                                            <span>Survival Bonus</span>
                                            <span>+{xpResult.breakdown.survivalBonus} XP</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-ink-700 mb-1">
                                            <span>Time Bonus</span>
                                            <span>+{xpResult.breakdown.timeBonus} XP</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-ink-700 mb-2">
                                            <span>Diagnosis Bonus</span>
                                            <span>+{xpResult.breakdown.correctDiagnosis} XP</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-sm text-iris-700 border-t border-ink-200 pt-2">
                                            <span>Total XP</span>
                                            <span>+{xpResult.breakdown.total} XP</span>
                                        </div>
                                        <div className="mt-3 text-center text-xs font-semibold text-ink-500 uppercase tracking-wide">
                                            Current Rank: <span className="text-iris-600">{xpResult.newRank}</span>
                                        </div>
                                    </div>
                                )}
                                {!diagnosisResult && (
                                    <button
                                        onClick={handleDiagnosisSubmit}
                                        className="w-full rounded-lg bg-iris-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-iris-700 transition-colors cursor-pointer"
                                    >
                                        Submit
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="flex-1 rounded-lg border border-ink-900/8 px-4 py-2.5 text-sm font-semibold text-ink-500 hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={() => window.location.href = "/profile"}
                                    className="flex-1 rounded-lg bg-indigo-100 border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-200 transition-colors cursor-pointer"
                                >
                                    View ID Card
                                </button>
                                <button
                                    onClick={() => window.location.href = "/"}
                                    className="flex-1 rounded-lg bg-iris-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-iris-700 transition-colors cursor-pointer"
                                >
                                    Home
                                </button>
                            </div>
                        </div>
                    </Modal>
                );
            })()}

            {/* Imaging result modal */}
            {(() => {
                const img = imagingResult;
                if (!img || img.kind !== "imaging") return null;
                return (
                    <Modal open onClose={() => setImagingResult(null)} maxWidth="max-w-lg">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-ink-900 mb-4">{img.name}</h2>
                            <p className="text-sm text-ink-700 mb-3 leading-relaxed">{img.report || "No report entered."}</p>
                            {img.imageUrl && (
                                <img src={img.imageUrl} alt={img.name} className="max-w-full max-h-72 rounded border border-ink-900/8" />
                            )}
                            <button
                                onClick={() => setImagingResult(null)}
                                className="mt-4 w-full rounded-lg bg-iris-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-iris-700 transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </Modal>
                );
            })()}

            {/* Outcome modal */}
            {(() => {
                if (!outcomeModal) return null;
                const colors: Record<string, { title: string; heading: string; bg: string; hover: string; label: string }> = {
                    improved: { title: "Condition Improved", heading: "text-emerald-700", bg: "bg-emerald-600", hover: "hover:bg-emerald-700", label: "text-emerald-600" },
                    deteriorated: { title: "Condition Deteriorated", heading: "text-rose-700", bg: "bg-rose-600", hover: "hover:bg-rose-700", label: "text-rose-600" },
                    critical: { title: "Critical Condition", heading: "text-red-700", bg: "bg-red-600", hover: "hover:bg-red-700", label: "text-red-600" },
                    unchanged: { title: "No Change", heading: "text-ink-600", bg: "bg-ink-500", hover: "hover:bg-ink-600", label: "text-ink-500" },
                };
                const c = colors[outcomeModal.outcomeType] ?? colors.deteriorated;
                return (
                    <Modal open onClose={() => setOutcomeModal(null)}>
                        <div className="p-6">
                            <h2 className={`text-lg font-semibold ${c.heading} mb-4`}>{c.title}</h2>
                            {outcomeModal.outcomeType !== "unlockEvent" && (
                                <>
                                    {outcomeModal.narrative && (
                                        <p className="text-sm text-ink-700 mb-3 leading-relaxed">{outcomeModal.narrative}</p>
                                    )}
                                    {outcomeModal.newSymptoms && (
                                        <div className="mb-3">
                                            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">New Symptoms</p>
                                            <p className="text-sm text-ink-700">{outcomeModal.newSymptoms}</p>
                                        </div>
                                    )}
                                    {Object.keys(outcomeModal.vitalChanges).some(k => outcomeModal.vitalChanges[k]) && (
                                        <div>
                                            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">Vital Changes</p>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                {Object.entries(outcomeModal.vitalChanges).map(([key, val]) =>
                                                    val ? (
                                                        <div key={key} className="flex items-center gap-1.5">
                                                            <span className="font-mono text-xs text-ink-400 uppercase">{key}</span>
                                                            <span className={`font-semibold ${c.label}`}>{val}</span>
                                                        </div>
                                                    ) : null
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            <button
                                onClick={() => setOutcomeModal(null)}
                                className={`mt-4 w-full rounded-lg ${c.bg} px-4 py-2.5 text-sm font-semibold text-white ${c.hover} transition-colors cursor-pointer`}
                            >
                                Continue
                            </button>
                        </div>
                    </Modal>
                );
            })()}

            {/* 2026 HUD: Cinematic bottom action bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-4xl">
                <div className="flex justify-center gap-3 overflow-x-auto pb-4 pt-4 px-4">
                    {TABS.map((t) => {
                        const Icon = t.icon;
                        const isActive = activeTab === t.key;
                        return (
                            <div key={t.key} className="relative group">
                                {/* Angled Background */}
                                <div className={`absolute inset-0 -skew-x-12 transition-all duration-300 ${
                                    isActive 
                                        ? "bg-iris-600/90 border border-iris-300 shadow-[0_0_20px_rgba(79,70,229,0.8)]" 
                                        : "bg-ink-950/80 border border-white/10 group-hover:bg-ink-900 group-hover:border-iris-500/50 group-hover:shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                                }`}></div>
                                
                                <button
                                    onClick={() => setActiveTab(isActive ? null : t.key)}
                                    disabled={gameTimeUp && t.key !== "management"}
                                    className={`relative flex flex-col items-center justify-center gap-2 p-3 min-w-[80px] md:min-w-[100px] transition-all duration-300 cursor-pointer
                                        ${isActive ? "text-white scale-110 -translate-y-2" : "text-white/60 group-hover:text-white"}
                                        ${gameTimeUp && t.key !== "management" ? "opacity-30 cursor-not-allowed" : ""}`}
                                >
                                    <Icon size={24} className={isActive ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" : ""} />
                                    <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-center leading-tight">
                                        {t.label}
                                    </span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
