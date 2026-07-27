const fs = require('fs');
const file = 'components/simulator/PlayCaseV2.tsx';
let content = fs.readFileSync(file, 'utf8');

// Imports
content = content.replace(
  'import { calculateXp, saveXpLocally, XpBreakdown, RankTier } from "@/lib/gamification";',
  `import { calculateXp, saveXpLocally, XpBreakdown, RankTier } from "@/lib/gamification";\nimport { useGameStore } from "@/lib/store";\nimport { gameEvents } from "@/lib/events";\nimport { Rnd } from "react-rnd";`
);

// Remove local state
const stateToRemove = [
  'const [gameOverReason, setGameOverReason] = useState<{ event: "won" | "patientDied" | "timeOut", description: string } | null>(null);',
  'const [minutes, setMinutes] = useState(GAME_DURATION_MINUTES);',
  'const [seconds, setSeconds] = useState(0);',
  'const [gameOver, setGameOver] = useState(false);',
  'const [gameStarted, setGameStarted] = useState(false);',
  'const [elapsed, setElapsed] = useState(0);',
  'const [playerEvents, setPlayerEvents] = useState<PlayerEvent[]>([]);',
  'const [health, setHealth] = useState(100);',
  'const elapsedRef = useRef(elapsed);',
  'elapsedRef.current = elapsed;',
];

stateToRemove.forEach(s => {
  content = content.replace(s, '');
});

// Add store bindings
content = content.replace(
  'const [outcomeModal, setOutcomeModal] = useState<OutcomeNodeData | null>(null);',
  `const [outcomeModal, setOutcomeModal] = useState<OutcomeNodeData | null>(null);\n\n    const { gameStarted, gameOver, gameOverReason, elapsed, minutes, seconds, health, playerEvents, startGame: storeStartGame, endGame, tickTimer, addPlayerEvent, resetGame } = useGameStore();`
);

// Update recordEvent to use store
content = content.replace(
  `    const recordEvent = useCallback((event: PlayerEvent) => {
        setPlayerEvents((prev) => [...prev, event]);
    }, []);`,
  `    const recordEvent = useCallback((event: PlayerEvent) => {
        addPlayerEvent(event);
    }, [addPlayerEvent]);`
);

// Update Timer
const oldTimer = `    // Timer
    useEffect(() => {
        if (!gameStarted || gameOver) return;
        const interval = setInterval(() => {
            setElapsed((e) => e + 1);
            setHealth((h) => Math.max(0, h - 100 / TOTAL_GAME_SECONDS));
            setSeconds((s) => {
                if (s === 0) {
                    setMinutes((m) => {
                        if (m === 0) {
                            setGameOver(true);
                            setGameOverReason({ event: "timeOut", description: "Time has expired." });
                            recordEvent({ kind: "game_over", timestamp: elapsedRef.current, reason: "time_expired" });
                            return 0;
                        }
                        return m - 1;
                    });
                    return 59;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [gameStarted, gameOver, recordEvent]);`;

const newTimer = `    // Timer
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
    }, [gameOver, gameOverReason, elapsed, recordEvent, playerEvents]);`;

content = content.replace(oldTimer, newTimer);

// Update startGame
content = content.replace(
  `        setGameStarted(true);
        setMinutes(GAME_DURATION_MINUTES);
        setSeconds(0);
        setElapsed(0);
        setHealth(100);
        setGameOver(false);
        setGameOverReason(null);
        setPlayerEvents([]);`,
  `        resetGame(GAME_DURATION_MINUTES);
        storeStartGame();`
);

// Update applyIntervention ending
content = content.replace(
  `                setGameOver(true);
                setGameOverReason({ event: "patientDied", description: next.description || "The patient did not survive." });
                recordEvent({ kind: "game_over", timestamp: elapsed, reason: "patient_died" });`,
  `                endGame({ event: "patientDied", description: next.description || "The patient did not survive." });
                recordEvent({ kind: "game_over", timestamp: elapsed, reason: "patient_died" });`
);

content = content.replace(
  `                setGameOver(true);
                setGameOverReason({ event: "won", description: next.description || "Patient successfully stabilized." });
                recordEvent({ kind: "game_over", timestamp: elapsed, reason: "won" });`,
  `                endGame({ event: "won", description: next.description || "Patient successfully stabilized." });
                recordEvent({ kind: "game_over", timestamp: elapsed, reason: "won" });`
);


// Replace panel wrapper with react-rnd
const oldPanel = `{/* Active panel overlay (Telltale style) */}
            {activeTab && (
                <div className="absolute inset-x-0 bottom-36 z-30 flex items-end justify-center pointer-events-none p-4">
                    <div className="relative w-full max-w-3xl max-h-[60vh] overflow-y-auto bg-ink-950/90 backdrop-blur-xl rounded-t-3xl rounded-b-lg shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-x border-iris-500/30 p-8 text-white pointer-events-auto">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-iris-500 to-transparent opacity-50" />`;

const newPanel = `{/* Active panel overlay (Telltale style) */}
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
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-iris-500 to-transparent opacity-50" />`;

content = content.replace(oldPanel, newPanel);

content = content.replace(
  `                            />
                        )}
                    </div>
                </div>
            )}
            {/* Game over modal */}`,
  `                            />
                        )}
                        </div>
                    </div>
                </Rnd>
                </div>
            )}
            {/* Game over modal */}`
);

fs.writeFileSync(file, content);
console.log('Patched PlayCaseV2.tsx');
