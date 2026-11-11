import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ClientLayout } from "./ClientLayout";
import { withBase } from "@/lib/basePath";

// Self-hosted so builds work offline (Electron, Capacitor, sandboxed CI).
const vt323 = localFont({
  src: "./fonts/VT323-Regular.woff2",
  weight: "400",
  variable: "--font-vt",
  display: "swap",
});

// What a pasted link shows in LINE, Messenger, Facebook and X. The image is public/og.jpg (1200x630).
const SITE = process.env.NEXT_PUBLIC_SHARE_URL
  ? (process.env.NEXT_PUBLIC_SHARE_URL.startsWith("http") ? process.env.NEXT_PUBLIC_SHARE_URL : `https://${process.env.NEXT_PUBLIC_SHARE_URL}`)
  : "https://coderama.prawees.com";
const DESCRIPTION = "เกม ER พิกเซลของ นศพ. มีเคสประจำวันที่ทุกคนได้คนไข้คนเดียวกัน ท้าเพื่อนวินิจฉัยและแข่ง CPR ได้ 51 เคสฉุกเฉิน 31 เวร เล่นฟรีบนมือถือ";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Code Rama เกม ER ของ นศพ.",
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Code Rama",
    title: "Code Rama เกม ER ของ นศพ.",
    description: DESCRIPTION,
    locale: "th_TH",
    images: [{ url: withBase("/og.jpg"), width: 1200, height: 630, alt: "Code Rama เกม ER พิกเซล" }],
  },
  twitter: { card: "summary_large_image", title: "Code Rama เกม ER ของ นศพ.", description: DESCRIPTION, images: [withBase("/og.jpg")] },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Code Rama",
  },
  formatDetection: {
    telephone: false,
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={vt323.variable}>
      <head>
        <meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#2b2133" />
        <link rel="icon" type="image/png" href={withBase("/favicon.png")} />
        <link rel="apple-touch-icon" href={withBase("/icon-192.png")} />
        <link rel="manifest" href={withBase("/manifest.json")} />
      </head>
      <body className="font-pixel text-slate-100 bg-neutral-900 antialiased flex justify-center items-center min-h-screen">
        <div className="w-full sm:max-w-[400px] h-[100dvh] sm:h-[800px] sm:max-h-[90vh] bg-black sm:border-[12px] sm:border-zinc-800 sm:rounded-[3rem] sm:shadow-2xl overflow-hidden relative">
          <ClientLayout>
            {children}
          </ClientLayout>
        </div>
      </body>
    </html>
  );
}
