import { CaseEngineClient } from "./CaseEngineClient";

export async function generateStaticParams() {
  const caseIds = [
    'case_01', 'case_02_fluids', 'case_03_cardiac', 'case_04_svt', 'case_05_asthma', 'case_06_trauma',
    'case_07', 'case_07_vip',
    ...Array.from({ length: 43 }, (_, i) => {
      const num = (i + 8).toString().padStart(2, '0');
      return `case_${num}`;
    })
  ];
  return caseIds.map(id => ({ id }));
}

export default function CaseEnginePage({ params }: { params: { id: string } }) {
  return <CaseEngineClient params={params} />;
}

