"use client"

import { useState } from "react";
import CaseDesigner from "@/components/simulator/CaseDesigner";
import SimulatorNav from "@/components/simulator/SimulatorNav";

export default function ClientSimulatorPage({ id }: { id: string }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div>
            <SimulatorNav
                caseId={id}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen((v) => !v)}
            />
            <CaseDesigner
                caseId={id}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />
        </div>
    );
}
