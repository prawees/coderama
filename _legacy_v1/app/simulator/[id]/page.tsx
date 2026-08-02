import ClientSimulatorPage from "./ClientSimulatorPage";

export default function SimulatorPage({ params }: { params: { id: string } }) {
    return <ClientSimulatorPage id={params.id} />;
}

export function generateStaticParams() {
  return [{ id: "ekZU9TLV0HfmfMV2MVKe" }];
}
