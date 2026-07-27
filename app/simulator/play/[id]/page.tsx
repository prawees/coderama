import PlayCase from "@/components/simulator/PlayCase";
import SimulatorNav from "@/components/simulator/SimulatorNav";

export default function SimulatorPlayPage({ params }: { params: { id: string } }) {
    return (
        <div>
            <SimulatorNav caseId={params.id} hidePlay />
            <PlayCase caseId={params.id} />
        </div>
    );
}

export function generateStaticParams() {
  return [{ id: "ekZU9TLV0HfmfMV2MVKe" }];
}
