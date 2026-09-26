import type { Metadata, Viewport } from "next";
import { VT323, Press_Start_2P, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "./ClientLayout";
import { CloudSync } from "@/components/CloudSync";
import { ScreenWipe } from "@/components/ui/ScreenWipe";
import { RotateOverlay } from "@/components/ui/RotateOverlay";

const bodyFont = VT323({ weight: "400", subsets: ["latin"], variable: "--font-pixel-body", display: "swap" });
const headingFont = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-pixel-heading", display: "swap" });
// Thai glyph fallback. Rendered with font-smoothing off so it sits next to the bitmap Latin faces.
const thaiFont = Noto_Sans_Thai({ weight: ["400", "700"], subsets: ["thai"], variable: "--font-thai", display: "swap" });

export const metadata: Metadata = {
  title: "Code Rama",
  description: "Emergency medicine simulation RPG - Faculty of Medicine edition",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Code Rama" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0d0b14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${headingFont.variable} ${thaiFont.variable}`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-pixel text-pixel-text bg-black flex items-center justify-center h-[100dvh] w-screen overflow-hidden">
        {/* 16:9 landscape stage. Letterboxes on ultrawide/portrait; fills a 16:9 monitor edge-to-edge. */}
        <div className="game-stage">
          <ClientLayout>
            {children}
            <CloudSync />
          </ClientLayout>
          <ScreenWipe />
        </div>
        <RotateOverlay />
      </body>
    </html>
  );
}
