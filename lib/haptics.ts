import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

/**
 * Haptics that never throw and never need awaiting. Safari on iPhone has no vibration API, so the
 * plugin's web version throws there; when a tap handler awaited it, everything after it was skipped
 * (the setup's start button, answering a case step, finishing a case). Use this, never Haptics directly.
 */
const STYLE = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };

function fire(run: () => Promise<unknown>) {
  if (typeof window === "undefined") return;
  if (!Capacitor.isNativePlatform() && typeof navigator.vibrate !== "function") return;
  try { run().catch(() => {}); } catch { /* no haptics here */ }
}

export const haptic = {
  impact: (style: keyof typeof STYLE = "light") => fire(() => Haptics.impact({ style: STYLE[style] })),
  vibrate: () => fire(() => Haptics.vibrate()),
  error: () => fire(() => Haptics.notification({ type: NotificationType.Error })),
};
