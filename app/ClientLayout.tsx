"use client";

import { useEffect } from "react";
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
  }, []);

  return <>{children}</>;
}
