"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import CaseDesigner from "@/components/designer/CaseDesigner";

/** Porames's case designer, hosted inside Code Rama. Authoring UI stays light-themed for long editing sessions. */
function DesignerInner() {
  const id = useSearchParams().get("id") || "new";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return <CaseDesigner key={id} caseId={id} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
}

export default function DesignerPage() {
  return (
    <div className="absolute inset-0 overflow-auto select-text bg-white text-black font-sans" style={{ imageRendering: "auto", WebkitFontSmoothing: "antialiased" }}>
      <Suspense fallback={null}><DesignerInner /></Suspense>
    </div>
  );
}
