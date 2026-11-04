"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import CaseDesigner from "@/components/designer/CaseDesigner";

/** Porames' case designer. It needs a wide screen, so it steps outside the phone frame. */
function DesignerInner() {
  const id = useSearchParams().get("id") || "new";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return <CaseDesigner key={id} caseId={id} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
}

export default function DesignerPage() {
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-white text-black" style={{ touchAction: "auto", userSelect: "text", WebkitUserSelect: "text", imageRendering: "auto" }}>
      <Suspense fallback={null}><DesignerInner /></Suspense>
    </div>
  );
}
