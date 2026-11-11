"use client";

import { Fragment, type ReactNode } from "react";

import { sentences } from "@/lib/sentences";

/** English words with the numbers that belong to them, and doses: "VF", "defib 200 J", "0.5 mg", "HR 88". A bare "ปี 5" stays plain. */
const TERM = /([A-Za-z][A-Za-z0-9/.+%-]*(?:\s+[A-Za-z0-9/.+%-]*[A-Za-z0-9%])*|\d[\d.,]*\s?(?:mg|mcg|ml|mL|J|cm|mmHg|%)(?![A-Za-z]))/g;

function terms(line: string, tone: "light" | "dark", key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of line.matchAll(TERM)) {
    const i = m.index ?? 0;
    if (i > last) out.push(line.slice(last, i));
    out.push(<span key={`${key}-${i}`} className={tone === "dark" ? "text-[#9fd8ec]" : "text-[#2f6f86]"}>{m[0]}</span>);
    last = i + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

/**
 * The laid-out text, revealed up to `shown` characters for a typewriter. Pass shown = Infinity for all of it.
 * The hidden remainder keeps its place, so the box does not jump while it types.
 */
export function RichText({ text, shown = Infinity, tone = "light", className = "", testid, gap = "0.3em" }:
  { text: string; shown?: number; tone?: "light" | "dark"; className?: string; testid?: string; gap?: string }) {
  let budget = shown;
  const lines = sentences(text);
  return (
    <span className={`block ${className}`} data-testid={testid} data-text={text}>
      {lines.map((line, li) => {
        const visible = Math.max(0, Math.min(line.length, budget));
        budget -= line.length + 1;
        return (
          <span key={li} className="block" style={{ marginTop: li ? gap : 0 }}>
            {visible > 0 && <Fragment>{terms(line.slice(0, visible), tone, `${li}`)}</Fragment>}
            {visible < line.length && <span className="opacity-0">{line.slice(visible)}</span>}
          </span>
        );
      })}
    </span>
  );
}
