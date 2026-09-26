"use client";
import { useCallback } from "react";
import { useERStore } from "@/lib/erStore";
import { tr, DictKey, Lang } from "./dictionary";

export type TFn = (key: DictKey | string, vars?: Record<string, string | number>) => string;

/** React hook: translate against the player's chosen language. */
export function useT(): { t: TFn; lang: Lang } {
  const lang = useERStore((s) => s.language);
  const t = useCallback<TFn>((key, vars) => tr(key, lang, vars), [lang]);
  return { t, lang };
}

/** Non-React helper for engine code (Pixi ticker, audio callbacks). */
export function tNow(key: DictKey | string, vars?: Record<string, string | number>): string {
  return tr(key, useERStore.getState().language, vars);
}
