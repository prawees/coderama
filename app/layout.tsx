import type { Metadata } from "next";
import { VT323 } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "./ClientLayout";
import { CloudSync } from "@/components/CloudSync";

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Code Rama",
  description: "ER Management Idle RPG",
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
    <html lang="en" className={vt323.variable}>
      <head>
        <meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0d1117" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-pixel text-slate-100 bg-neutral-900 antialiased flex justify-center items-center min-h-screen">
        <div className="w-full sm:max-w-[400px] h-[100dvh] sm:h-[800px] sm:max-h-[90vh] bg-black sm:border-[12px] sm:border-zinc-800 sm:rounded-[3rem] sm:shadow-2xl overflow-hidden relative">
          <ClientLayout>
            {children}
            <CloudSync />
          </ClientLayout>
        </div>
      </body>
    </html>
  );
}
