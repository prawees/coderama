"use client";

import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { applyCalm, useCalm } from "@/lib/calm";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { startAccount } from "@/lib/account";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setOverlaysWebView({ overlay: true });
    }
    startAccount();
    applyCalm();
  }, []);
  const calm = useCalm();

  // Calm mode (lib/calm.ts) turns framer-motion movement off; "user" follows the phone's reduced-motion setting
  return <MotionConfig reducedMotion={calm ? "always" : "user"}>{children}</MotionConfig>;
}
