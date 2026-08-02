import PlayCaseV2 from "@/components/simulator/PlayCaseV2";
import SimulatorNav from "@/components/simulator/SimulatorNav";

export default function SimulatorPlayPageV2({ params }: { params: { id: string } }) {
    return (
        <div>
            <SimulatorNav caseId={params.id} hidePlay />
            <PlayCaseV2 caseId={params.id} />
        </div>
    );
}

export function generateStaticParams() {
  return [{ id: "ekZU9TLV0HfmfMV2MVKe" }];
}
