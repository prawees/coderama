"use client";

import { useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { initSync } from "@/lib/syncEngine";
import { initCloudSync } from "@/lib/cloudSync";
import { useERStore } from "@/lib/erStore";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setOverlaysWebView({ overlay: true });
    }
    initSync();
    initCloudSync();
  }, []);

  const language = useERStore((st) => st.language);
  useEffect(() => { document.documentElement.lang = language; }, [language]);

  return <>{children}</>;
}
