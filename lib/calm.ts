"use client";

import { useEffect, useState } from "react";

/**
 * Calm reading mode: text appears whole instead of typing out, nothing bobs, pulses, wiggles or shakes.
 * Asked for by a paediatrician who found the moving pop-ups dizzying; good for anyone who reads slower or plays
 * on a train. Kept per device. On by default when the phone asks for reduced motion.
 * The `calm` class on <html> stops CSS animation (globals.css) and ClientLayout tells framer-motion.
 */
const KEY = "coderama.calm";
const EVENT = "coderama-calm";

export function isCalm(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = localStorage.getItem(KEY);
    if (v === "1") return true;
    if (v === "0") return false;
  } catch { /* private mode */ }
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function setCalm(on: boolean) {
  try { localStorage.setItem(KEY, on ? "1" : "0"); } catch { /* private mode */ }
  applyCalm();
  window.dispatchEvent(new Event(EVENT));
}

export function applyCalm() {
  if (typeof document !== "undefined") document.documentElement.classList.toggle("calm", isCalm());
}

export function useCalm(): boolean {
  const [calm, setState] = useState(false);
  useEffect(() => {
    const read = () => setState(isCalm());
    read();
    window.addEventListener(EVENT, read);
    return () => window.removeEventListener(EVENT, read);
  }, []);
  return calm;
}
