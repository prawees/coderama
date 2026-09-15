"use client";

import { useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { initSync } from "@/lib/syncEngine";
import { initCloudSync } from "@/lib/cloudSync";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setOverlaysWebView({ overlay: true });
    }
    initSync();
    initCloudSync();
  }, []);

  return <>{children}</>;
}
