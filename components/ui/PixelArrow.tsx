/**
 * A pixel triangle. Unicode arrows like ◀ ▶ turn into emoji on iPhone, so the game draws its own.
 * Takes the text colour.
 */
const ROWS = ["10000", "11000", "11100", "11110", "11100", "11000", "10000"]; // pointing right

export function PixelArrow({ dir = "right", size = 14, className = "" }: { dir?: "left" | "right" | "up" | "down"; size?: number; className?: string }) {
  const rot = { right: 0, down: 90, left: 180, up: 270 }[dir];
  return (
    <svg viewBox="0 0 5 7" width={size * (5 / 7)} height={size} className={`inline-block align-[-0.1em] ${className}`} style={{ transform: `rotate(${rot}deg)` }} shapeRendering="crispEdges" aria-hidden>
      {ROWS.flatMap((row, y) => row.split("").map((c, x) => (c === "1" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" /> : null)))}
    </svg>
  );
}
