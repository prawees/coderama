import { CaseEngineClient } from "./CaseEngineClient";

export async function generateStaticParams() {
  return [
    { id: 'case_02_fluids' },
    { id: 'case_01' } // Add more as we create them
  ];
}

export default function CaseEnginePage({ params }: { params: { id: string } }) {
  return <CaseEngineClient params={params} />;
}
