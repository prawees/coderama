"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/useT";
import { useTransition } from "@/lib/transition";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { builtinIds, getBuiltinRaw } from "@/lib/clinical/registry";
import { listLocalCases, deleteLocalCase, exportCaseFile, importCaseFile, listCloudCases, StoredCase } from "@/lib/clinical/customCases";
import { auth } from "@/lib/firebase";

type Tab = 'builtin' | 'custom' | 'cloud';

export default function CaseLibraryPage() {
  const router = useRouter();
  const { t, lang } = useT();
  const { wipeTo } = useTransition();
  const [tab, setTab] = useState<Tab>('builtin');
  const [local, setLocal] = useState<StoredCase[]>([]);
  const [cloud, setCloud] = useState<{ id: string; title: string }[] | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLocal(listLocalCases()); }, []);
  useEffect(() => { if (tab === 'cloud' && cloud === null) listCloudCases().then(setCloud); }, [tab, cloud]);

  const builtins = builtinIds().map((id) => {
    const raw = getBuiltinRaw(id, lang);
    return { id, title: raw?.title || id, cc: raw?.chiefComplaint || '', age: raw?.age, sex: raw?.sex };
  });

  const play = (path: string) => wipeTo(path, t('lib.play'));
  const Card = ({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) => (
    <div className="bg-[#1a1c2c] border-4 border-[#333c57] p-3 flex flex-col gap-2">
      <div className="text-xl leading-tight text-[#ffe9c9]">{title}</div>
      {sub && <div className="text-base text-pixel-text-muted leading-tight line-clamp-2">{sub}</div>}
      <div className="flex flex-wrap gap-2 mt-auto">{children}</div>
    </div>
  );

  return (
    <div className="absolute inset-0 flex flex-col bg-pixel-bg font-pixel p-4 gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-sm text-pixel-gold tracking-widest">{t('lib.title')}</h1>
          <p className="text-lg text-pixel-text-muted">{t('lib.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <PixelButton size="sm" variant="success" onClick={() => router.push('/designer')}>+ {t('lib.new')}</PixelButton>
          <PixelButton size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>{t('lib.import')}</PixelButton>
          <PixelButton size="sm" variant="primary" onClick={() => router.push('/hub')}>{t('nav.back_to_hub')}</PixelButton>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            try { await importCaseFile(f); setLocal(listLocalCases()); setTab('custom'); setError(''); } catch { setError(t('lib.import_fail')); }
            e.target.value = '';
          }} />
        </div>
      </div>
      {error && <div className="text-lg text-[#d95763]">{error}</div>}

      <div className="flex gap-2">
        {(['builtin', 'custom', 'cloud'] as Tab[]).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-1 text-xl border-4 ${tab === k ? 'border-[#fbf236] bg-[#29366f] text-white' : 'border-[#333c57] text-pixel-text-muted'}`}>
            {t(`lib.${k}`)} {k === 'builtin' ? `(${builtins.length})` : k === 'custom' ? `(${local.length})` : ''}
          </button>
        ))}
      </div>

      <PixelPanel variant="metal" className="flex-1 min-h-0">
        <div className="overflow-y-auto h-full grid grid-cols-3 gap-2 content-start pr-1">
          {tab === 'builtin' && builtins.map((b) => (
            <Card key={b.id} title={b.title} sub={`${b.age ?? ''} ${b.sex ?? ''} · ${b.cc}`}>
              <PixelButton size="sm" variant="success" onClick={() => play(`/simulator/play/${b.id}?from=library`)}>{t('lib.play')}</PixelButton>
              <PixelButton size="sm" variant="secondary" onClick={() => router.push(`/designer?template=${b.id}`)}>{t('lib.duplicate')}</PixelButton>
            </Card>
          ))}
          {tab === 'custom' && (local.length === 0 ? <p className="text-xl text-pixel-text-muted col-span-3">{t('lib.empty')}</p> : local.map((c) => (
            <Card key={c.id} title={c.title} sub={`${c.data?.age ?? ''} ${c.data?.sex ?? ''} · ${c.data?.chiefComplaint ?? ''}`}>
              <PixelButton size="sm" variant="success" onClick={() => play(`/simulator/play/custom?caseId=${c.id}&from=library`)}>{t('lib.play')}</PixelButton>
              <PixelButton size="sm" variant="secondary" onClick={() => router.push(`/designer?id=${c.id}`)}>{t('lib.edit')}</PixelButton>
              <PixelButton size="sm" variant="secondary" onClick={() => exportCaseFile(c)}>{t('lib.export')}</PixelButton>
              <PixelButton size="sm" variant="alert" onClick={() => { if (confirm(t('lib.confirm_delete'))) { deleteLocalCase(c.id); setLocal(listLocalCases()); } }}>{t('lib.delete')}</PixelButton>
            </Card>
          )))}
          {tab === 'cloud' && (
            cloud === null ? <p className="text-xl text-pixel-text-muted col-span-3">{t('nav.loading')}</p>
              : cloud.length === 0 ? <p className="text-xl text-pixel-text-muted col-span-3">{auth.currentUser ? t('lib.empty') : t('lib.cloud_signin')}</p>
              : cloud.map((c) => (
                <Card key={c.id} title={c.title}>
                  <PixelButton size="sm" variant="success" onClick={() => play(`/simulator/play/custom?caseId=${c.id}&from=library`)}>{t('lib.play')}</PixelButton>
                  <PixelButton size="sm" variant="secondary" onClick={() => router.push(`/designer?id=${c.id}`)}>{t('lib.edit')}</PixelButton>
                </Card>
              ))
          )}
        </div>
      </PixelPanel>
    </div>
  );
}
