"use client"

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { getLocalCase, saveLocalCase, publishCloud, getCloudCase, exportCaseFile } from "@/lib/clinical/customCases";
import { getBuiltinRaw } from "@/lib/clinical/registry";
import type {
    CaseData, VitalSign, ExamFinding, Investigation, LabTest, LabInvestigation,
    ImagingInvestigation, StepProps, StepReviewProps,
} from "./types";
import {
    C, FONT_LINK, LAB_LIBRARY, IMAGING_LIBRARY, EXAM_SYSTEMS,
    MANAGEMENT_LIBRARY, OUTCOME_TYPES, VITAL_DEFS, DISEASES_DB, HISTORY_CATEGORIES,
} from "./database";
import {
    inputStyle, TextInput, TextArea, Field, PrimaryButton, GhostButton, Chip, Card, SectionHeading,
} from "./ui";
import StepManagement from "./GraphEditor";
import StepHistory from "./HistoryGraphEditor";

const uid = () => Math.random().toString(36).slice(2, 10);

/** Downscale an image file to a JPEG data URL (keeps local storage small). */
function downscale(file: File, max: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const k = Math.min(1, max / Math.max(img.width, img.height));
            const cv = document.createElement("canvas");
            cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
            cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
            resolve(cv.toDataURL("image/jpeg", 0.82));
            URL.revokeObjectURL(img.src);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

/** Accept story-case JSON (position:{x,y}, string actions, ethicalChoice) as well as designer JSON. */
function normalizeImported(raw: any): any {
    const g = raw.managementGraph;
    if (g && !Array.isArray(g.nodes) && g.nodes && typeof g.nodes === "object") {
        // Early decision-tree cases: flatten to intervention branches from start.
        const nodes: any[] = [{ id: "start", type: "start", x: 40, y: 260, data: {} }];
        const edges: any[] = [];
        let row = 0;
        for (const [id, d] of Object.entries<any>(g.nodes)) {
            for (const o of d.options || []) {
                const iv = `iv_${id}_${o.id}`; const out = `out_${o.targetNode}`;
                nodes.push({ id: iv, type: "intervention", x: 320, y: 60 + row * 110, data: { actions: [o.text] } });
                if (!nodes.some((n) => n.id === out)) {
                    const t = g.nodes[o.targetNode] || {};
                    const bad = /^wrong|fail|death|critical/i.test(o.targetNode);
                    nodes.push({ id: out, type: "outcome", x: 620, y: 60 + row * 110, data: { outcomeType: bad ? "deteriorated" : "improved", narrative: t.narrative || "", newSymptoms: "", vitalChanges: {} } });
                }
                edges.push({ id: `e_${iv}_a`, source: id === "start" ? "start" : `out_${id}`, target: iv, label: "" });
                edges.push({ id: `e_${iv}_b`, source: iv, target: out, label: "" });
                row++;
            }
        }
        raw = { ...raw, managementGraph: { nodes, edges } };
    } else if (g && Array.isArray(g.nodes)) {
        raw = {
            ...raw,
            managementGraph: {
                edges: (g.edges || []).map((e: any) => ({ label: "", ...e })),
                nodes: g.nodes.map((n: any) => {
                    const x = n.x ?? n.position?.x ?? 0, y = n.y ?? n.position?.y ?? 0;
                    const data = { ...(n.data || {}) };
                    if (n.type === "required" && Array.isArray(data.actions)) data.actions = data.actions.map((a: any) => (typeof a === "string" ? { or: [a] } : a));
                    if (n.type === "outcome") data.vitalChanges = Object.fromEntries(Object.entries(data.vitalChanges || {}).map(([k, v]) => [k, String(v)]));
                    return { id: n.id, type: n.type, x, y, data };
                }),
            },
        };
    }
    if (/^m(ale)?$/i.test(raw.sex || '')) raw.sex = "Male";
    else if (/^f(emale)?$/i.test(raw.sex || '')) raw.sex = "Female";
    raw.age = String(raw.age ?? "");
    raw.historyGraph ??= { nodes: [], edges: [] };
    raw.exam ??= []; raw.investigations ??= []; raw.diagnoses ??= [];
    raw.vitals = Object.fromEntries(Object.entries(raw.vitals || {}).map(([k, v]: [string, any]) => [k, { value: String(v?.value ?? v ?? ""), abnormal: !!v?.abnormal }]));
    return raw;
}

/* ---------------------------------------------------------------
   INITIAL STATE
--------------------------------------------------------------- */
const emptyCase: CaseData = {
    title: "",
    age: "",
    sex: "Female",
    chiefComplaint: "",
    diagnoses: [],
    background: "",
    vitals: VITAL_DEFS.reduce((acc, v) => {
        acc[v.key] = { value: "", abnormal: false };
        return acc;
    }, {} as Record<string, VitalSign>),
    exam: [],
    investigations: [],
    managementGraph: {
        nodes: [{ id: "start", type: "start", x: 40, y: 260, data: {} }],
        edges: [],
    },
    historyGraph: {
        nodes: [],
        edges: [],
    },
};



/* ---------------------------------------------------------------
   STEP 0 - BACKGROUND
--------------------------------------------------------------- */
function StepBackground({ data, update }: StepProps) {
    const [diagInput, setDiagInput] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const addDiagnosis = (name?: string) => {
        const val = (name ?? diagInput).trim();
        if (!val) return;
        if ((data.diagnoses ?? []).includes(val)) return;
        update({ diagnoses: [...(data.diagnoses ?? []), val] });
        setDiagInput("");
        setShowSuggestions(false);
        setActiveIndex(-1);
    };
    const removeDiagnosis = (idx: number) => {
        update({ diagnoses: (data.diagnoses ?? []).filter((_, i) => i !== idx) });
    };

    const suggestions = useMemo(() => {
        if (!diagInput.trim()) return [];
        const lower = diagInput.toLowerCase();
        const existing = data.diagnoses ?? [];
        return DISEASES_DB.filter(
            (d) => d.name.toLowerCase().includes(lower) && !existing.includes(d.name)
        );
    }, [diagInput, data.diagnoses]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < suggestions.length) {
                addDiagnosis(suggestions[activeIndex].name);
            } else {
                addDiagnosis();
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) => Math.max(prev - 1, -1));
        } else if (e.key === "Escape") {
            setShowSuggestions(false);
            setActiveIndex(-1);
        }
    };

    return (
        <div>
            <SectionHeading eyebrow="01 · Setup" title="Case background" desc="Set the scene: who the patient is and why they presented to the emergency department." />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Case title">
                    <TextInput value={data.title} onChange={(e) => update({ title: e.target.value })} placeholder="e.g. 58F with sudden chest pain" />
                </Field>
                <Field label="Chief complaint">
                    <TextInput value={data.chiefComplaint} onChange={(e) => update({ chiefComplaint: e.target.value })} placeholder="e.g. Crushing central chest pain, 45 minutes" />
                </Field>
                <Field label="Patient age">
                    <TextInput type="number" value={data.age} onChange={(e) => update({ age: e.target.value })} placeholder="e.g. 58" />
                </Field>
                <Field label="Patient sex">
                    <select value={data.sex} onChange={(e) => update({ sex: e.target.value })} style={inputStyle}>
                        <option>Female</option>
                        <option>Male</option>
                        <option>Intersex / Unspecified</option>
                    </select>
                </Field>
            </div>
            <Field label="Diagnoses" hint="Definitive diagnosis/diagnoses for this case (hidden from students during play).">
                <div style={{ position: "relative", display: "flex", gap: 8, marginBottom: 8 }}>
                    <TextInput
                        value={diagInput}
                        onChange={(e) => { setDiagInput(e.target.value); setShowSuggestions(true); setActiveIndex(-1); }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g. ST-elevation myocardial infarction (STEMI)"
                        style={{ flex: 1 }}
                    />
                    <PrimaryButton onClick={() => addDiagnosis()} style={{ height: 40, flexShrink: 0 }}>Add</PrimaryButton>
                    {showSuggestions && suggestions.length > 0 && (
                        <div style={{
                            position: "absolute", top: "100%", left: 0, right: 80, zIndex: 50,
                            background: C.surface, border: `1px solid ${C.line}`,
                            borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                            maxHeight: 220, overflowY: "auto", marginTop: 2,
                        }}>
                            {suggestions.map((s, i) => (
                                <div
                                    key={s.id}
                                    onMouseDown={() => addDiagnosis(s.name)}
                                    style={{
                                        padding: "8px 12px", cursor: "pointer",
                                        fontFamily: "'IBM Plex Sans'", fontSize: 13.5, color: C.ink,
                                        background: i === activeIndex ? C.accentSoft : "transparent",
                                    }}
                                >
                                    {s.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {(data.diagnoses?.length ?? 0) > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {data.diagnoses?.map((d, i) => (
                            <Chip key={i} color={C.accent} soft={C.accentSoft}>
                                {d}
                                <button onClick={() => removeDiagnosis(i)} style={{ border: "none", background: "none", color: C.inkFaint, cursor: "pointer", fontSize: 12, marginLeft: 6, padding: 0 }}>×</button>
                            </Chip>
                        ))}
                    </div>
                )}
            </Field>
            <Field label="Background & history" hint="Presenting story, past medical history, medications, allergies - whatever the student should see on arrival.">
                <TextArea value={data.background} onChange={(e) => update({ background: e.target.value })} placeholder="e.g. Known hypertension and type 2 diabetes. Sudden onset central chest pain radiating to the left arm while climbing stairs, associated with diaphoresis and nausea..." />
            </Field>
        </div>
    );
}

/* ---------------------------------------------------------------
   STEP 1 - VITALS
--------------------------------------------------------------- */
function StepVitals({ data, update }: StepProps) {
    const setVital = (key: string, patch: Partial<VitalSign>) => {
        update({ vitals: { ...data.vitals, [key]: { ...data.vitals[key], ...patch } } });
    };
    return (
        <div>
            <SectionHeading eyebrow="02 · Baseline" title="Vital signs" desc="Enter the values students see on the monitor at the start of the case. Flag any that are deliberately abnormal." />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {VITAL_DEFS.map((v) => {
                    const cur = data.vitals[v.key];
                    return (
                        <Card key={v.key} style={{ borderColor: cur.abnormal ? C.abnormal : C.line }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <span style={{ fontFamily: "'IBM Plex Sans'", fontSize: 13, fontWeight: 600, color: C.ink }}>{v.label}</span>
                                <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.inkSoft, cursor: "pointer" }}>
                                    <input type="checkbox" checked={cur.abnormal} onChange={(e) => setVital(v.key, { abnormal: e.target.checked })} />
                                    abnormal
                                </label>
                            </div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                                <input
                                    value={cur.value}
                                    onChange={(e) => setVital(v.key, { value: e.target.value })}
                                    placeholder="-"
                                    style={{
                                        width: 80,
                                        border: "none",
                                        borderBottom: `2px solid ${cur.abnormal ? C.abnormal : C.line}`,
                                        fontFamily: "'IBM Plex Mono'",
                                        fontSize: 22,
                                        fontWeight: 600,
                                        color: cur.abnormal ? C.abnormal : C.ink,
                                        background: "transparent",
                                        outline: "none",
                                        padding: "2px 0",
                                    }}
                                />
                                <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, color: C.inkFaint }}>{v.unit}</span>
                            </div>
                            <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.inkFaint, marginTop: 6 }}>
                                normal {v.normal[0]}–{v.normal[1]}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

/* ---------------------------------------------------------------
   STEP 2 - PHYSICAL EXAM
--------------------------------------------------------------- */
function StepExam({ data, update }: StepProps) {
    const [system, setSystem] = useState(EXAM_SYSTEMS[0]);
    const [finding, setFinding] = useState("");
    const [abnormal, setAbnormal] = useState(true);

    const add = () => {
        if (!finding.trim()) return;
        update({ exam: [...data.exam, { id: uid(), system, finding, abnormal }] });
        setFinding("");
    };
    const remove = (id: string) => update({ exam: data.exam.filter((e) => e.id !== id) });

    return (
        <div>
            <SectionHeading eyebrow="03 · Baseline" title="Physical examination" desc="Add findings by system. Mark each as abnormal or a normal/reassuring finding." />
            <Card style={{ marginBottom: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "180px 1fr auto auto", gap: 10, alignItems: "end" }}>
                    <Field label="System">
                        <select value={system} onChange={(e) => setSystem(e.target.value)} style={inputStyle}>
                            {EXAM_SYSTEMS.map((s) => (
                                <option key={s}>{s}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Finding">
                        <TextInput value={finding} onChange={(e) => setFinding(e.target.value)} placeholder="e.g. Diaphoretic, S4 gallop present" onKeyDown={(e) => e.key === "Enter" && add()} />
                    </Field>
                    <Field label="Status">
                        <select value={abnormal ? "1" : "0"} onChange={(e) => setAbnormal(e.target.value === "1")} style={inputStyle}>
                            <option value="1">Abnormal</option>
                            <option value="0">Normal</option>
                        </select>
                    </Field>
                    <PrimaryButton onClick={add} style={{ height: 40 }}>Add finding</PrimaryButton>
                </div>
            </Card>

            {EXAM_SYSTEMS.map((s) => {
                const items = data.exam.filter((e) => e.system === s);
                if (!items.length) return null;
                return (
                    <div key={s} style={{ marginBottom: 16 }}>
                        <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 12.5, fontWeight: 600, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 8 }}>{s}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {items.map((it) => (
                                <div key={it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surface, border: `1px solid ${C.line}`, borderRadius: 6, padding: "8px 12px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <Chip color={it.abnormal ? C.abnormal : C.normal} soft={it.abnormal ? C.abnormalSoft : C.normalSoft}>
                                            {it.abnormal ? "ABN" : "NL"}
                                        </Chip>
                                        <span style={{ fontFamily: "'IBM Plex Sans'", fontSize: 14, color: C.ink }}>{it.finding}</span>
                                    </div>
                                    <button onClick={() => remove(it.id)} style={{ border: "none", background: "none", color: C.inkFaint, cursor: "pointer", fontSize: 12 }}>remove</button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
            {data.exam.length === 0 && <div style={{ color: C.inkFaint, fontFamily: "'IBM Plex Sans'", fontSize: 14 }}>No findings added yet.</div>}
        </div>
    );
}

/* ---------------------------------------------------------------
   STEP 3 - INVESTIGATIONS
--------------------------------------------------------------- */
function StepInvestigations({ data, update, caseId }: StepProps & { caseId: string | null }) {
    const [tab, setTab] = useState("labs");
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    const addLab = (category: string, test: LabTest) => {
        const lab: LabInvestigation = { id: uid(), kind: "lab", category, name: test.name, unit: test.unit, normalRange: test.normal, value: "", abnormal: false };
        update({
            investigations: [
                ...data.investigations,
                lab,
            ],
        });
    };
    const addImaging = (name: string) => {
        const img: ImagingInvestigation = { id: uid(), kind: "imaging", category: "Imaging", name, unit: "", normalRange: "unremarkable", value: "", abnormal: false, report: "", imageUrl: "" };
        update({
            investigations: [
                ...data.investigations,
                img,
            ],
        });
    };

    const handleImageUpload = async (id: string, file: File) => {
        setUploadingId(id);
        const token = await auth.currentUser?.getIdToken();
        if (!token || !caseId) {
            // Offline author: embed a downscaled copy so the case stays playable locally.
            try { patch(id, { imageUrl: await downscale(file, 900) }); } finally { setUploadingId(null); }
            return;
        }
        const reader = new FileReader();
        reader.onload = async () => {
            const imageData = reader.result as string;
            try {
                const res = await fetch("https://us-central1-rama-toxico-edu.cloudfunctions.net/imageUpload", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ imageData, caseId, investigationId: id }),
                });
                const data = await res.json();
                console.log(data)
                if (data.imageUrl) {
                    patch(id, { imageUrl: data.imageUrl });
                }

            } catch (err) {
                console.error("Image upload failed:", err);
            } finally {
                setUploadingId(null);
            }
        };
        reader.readAsDataURL(file);
    };
    const patch = (id: string, p: Partial<Investigation>) => update({ investigations: data.investigations.map((i) => (i.id === id ? { ...i, ...p } : i)) as Investigation[] });
    const remove = (id: string) => update({ investigations: data.investigations.filter((i) => i.id !== id) });

    const added = data.investigations;

    return (
        <div>
            <SectionHeading eyebrow="04 · Baseline" title="Investigations" desc="Pick from common ER labs and imaging, then set the value the student will see." />

            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                {["labs", "imaging"].map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                            border: "none",
                            background: tab === t ? C.accent : C.paperDeep,
                            color: tab === t ? "#fff" : C.inkSoft,
                            fontFamily: "'IBM Plex Sans'",
                            fontWeight: 600,
                            fontSize: 13,
                            borderRadius: 6,
                            padding: "8px 16px",
                            cursor: "pointer",
                            textTransform: "capitalize",
                        }}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {tab === "labs" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 26 }}>
                    {Object.entries(LAB_LIBRARY).map(([cat, tests]) => (
                        <Card key={cat}>
                            <div style={{ fontFamily: "'IBM Plex Sans'", fontWeight: 600, fontSize: 13.5, color: C.ink, marginBottom: 10 }}>{cat}</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {tests.map((t) => (
                                    <button
                                        key={t.name}
                                        onClick={() => addLab(cat, t)}
                                        style={{
                                            textAlign: "left",
                                            border: `1px solid ${C.line}`,
                                            background: C.paper,
                                            borderRadius: 5,
                                            padding: "6px 9px",
                                            fontFamily: "'IBM Plex Sans'",
                                            fontSize: 12.5,
                                            color: C.inkSoft,
                                            cursor: "pointer",
                                        }}
                                    >
                                        + {t.name}
                                    </button>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {tab === "imaging" && (
                <Card style={{ marginBottom: 26 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {IMAGING_LIBRARY.map((name) => (
                            <button
                                key={name}
                                onClick={() => addImaging(name)}
                                style={{
                                    border: `1px solid ${C.accent}`,
                                    background: C.accentSoft,
                                    color: C.accent,
                                    borderRadius: 6,
                                    padding: "7px 13px",
                                    fontFamily: "'IBM Plex Sans'",
                                    fontWeight: 600,
                                    fontSize: 12.5,
                                    cursor: "pointer",
                                }}
                            >
                                + {name}
                            </button>
                        ))}
                    </div>
                </Card>
            )}

            <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 12.5, fontWeight: 600, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 10 }}>
                Selected for this case ({added.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {added.map((inv) => (
                    <div key={inv.id} style={{ background: C.surface, border: `1px solid ${inv.abnormal ? C.abnormal : C.line}`, borderRadius: 7, padding: "10px 14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: inv.kind === "lab" ? 8 : 6 }}>
                            <div>
                                <span style={{ fontFamily: "'IBM Plex Sans'", fontWeight: 600, fontSize: 14, color: C.ink }}>{inv.name}</span>
                                <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.inkFaint, marginLeft: 8 }}>{inv.category}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.inkSoft, cursor: "pointer" }}>
                                    <input type="checkbox" checked={inv.abnormal} onChange={(e) => patch(inv.id, { abnormal: e.target.checked })} />
                                    abnormal
                                </label>
                                <button onClick={() => remove(inv.id)} style={{ border: "none", background: "none", color: C.inkFaint, cursor: "pointer", fontSize: 12 }}>remove</button>
                            </div>
                        </div>
                        {inv.kind === "lab" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <input
                                    value={inv.value}
                                    onChange={(e) => patch(inv.id, { value: e.target.value })}
                                    placeholder="value"
                                    style={{ width: 110, border: `1px solid ${C.line}`, borderRadius: 5, padding: "5px 8px", fontFamily: "'IBM Plex Mono'", fontSize: 13.5, color: inv.abnormal ? C.abnormal : C.ink }}
                                />
                                <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11.5, color: C.inkFaint }}>{inv.unit}</span>
                                <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.inkFaint }}>· normal {inv.normalRange}</span>
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                    <TextArea
                                        value={inv.report}
                                        onChange={(e) => patch(inv.id, { report: e.target.value })}
                                        placeholder="Describe the reported finding, e.g. 'ST elevation in leads II, III, aVF' or 'Widened mediastinum'"
                                        style={{ minHeight: 56, fontSize: 13.5, flex: 1 }}
                                    />
                                    <label
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 4,
                                            width: 80,
                                            minHeight: 56,
                                            border: `1px dashed ${uploadingId === inv.id ? C.accent : C.line}`,
                                            borderRadius: 6,
                                            cursor: uploadingId === inv.id ? "default" : "pointer",
                                            color: uploadingId === inv.id ? C.accent : C.inkFaint,
                                            fontSize: 11,
                                            fontFamily: "'IBM Plex Sans'",
                                            flexShrink: 0,
                                            opacity: uploadingId === inv.id ? 0.6 : 1,
                                        }}
                                    >
                                        {uploadingId === inv.id ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" style={{ animation: "spin 0.8s linear infinite" }}>
                                                <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="17 8 12 3 7 8" />
                                                <line x1="12" y1="3" x2="12" y2="15" />
                                            </svg>
                                        )}
                                        {uploadingId === inv.id ? "Uploading…" : "Upload"}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: "none" }}
                                            disabled={uploadingId === inv.id}
                                            onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                if (f) handleImageUpload(inv.id, f);
                                            }}
                                        />
                                    </label>
                                </div>
                                <Field label="Image URL or path" hint="e.g. /cases/my_case/ecg.png (file in public/), or an https link">
                                    <TextInput value={inv.imageUrl?.startsWith("data:") ? "(embedded image)" : inv.imageUrl || ""} onChange={(e) => patch(inv.id, { imageUrl: e.target.value })} placeholder="/cases/<case>/<file>.png" />
                                </Field>
                                {inv.imageUrl && (
                                    <div style={{ position: "relative", display: "inline-block" }}>
                                        <img
                                            src={inv.imageUrl}
                                            alt={inv.name}
                                            style={{ maxWidth: "100%", maxHeight: 240, borderRadius: 6, border: `1px solid ${C.line}`, display: "block" }}
                                        />
                                        <button
                                            onClick={() => patch(inv.id, { imageUrl: "" })}
                                            style={{
                                                position: "absolute",
                                                top: 4,
                                                right: 4,
                                                border: "none",
                                                background: "rgba(0,0,0,0.5)",
                                                color: "#fff",
                                                borderRadius: 4,
                                                width: 22,
                                                height: 22,
                                                cursor: "pointer",
                                                fontSize: 13,
                                                lineHeight: "22px",
                                                textAlign: "center",
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {added.length === 0 && <div style={{ color: C.inkFaint, fontFamily: "'IBM Plex Sans'", fontSize: 14 }}>Nothing selected yet - click an item above to add it.</div>}
            </div>
        </div>
    );
}



/* ---------------------------------------------------------------
   STEP 5 - REVIEW
--------------------------------------------------------------- */
function StepReview({ data }: StepReviewProps) {
    const abnormalVitals = VITAL_DEFS.filter((v) => data.vitals[v.key].abnormal);
    return (
        <div>
            <SectionHeading eyebrow="07 · Review" title="Case sheet" desc="This is how the case will read once published. Scroll back through the steps to make changes." />
            <Card style={{ padding: 24 }}>
                <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11.5, color: C.accent, fontWeight: 600, letterSpacing: 1 }}>
                    {data.age || "-"} y/o {data.sex} · {data.chiefComplaint || "no chief complaint set"}
                </div>
                <h3 style={{ fontFamily: "'IBM Plex Sans'", fontSize: 26, color: C.ink, margin: "6px 0 14px" }}>{data.title || "Untitled case"}</h3>
                {data.diagnoses?.length > 0 && (
                    <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, color: C.accent, fontWeight: 600, marginBottom: 10 }}>
                        Diagnoses: {data.diagnoses.join(", ")}
                    </div>
                )}
                <p style={{ fontFamily: "'IBM Plex Sans'", fontSize: 14.5, color: C.inkSoft, lineHeight: 1.6, marginBottom: 22 }}>{data.background || "No background written yet."}</p>

                <div style={{ marginBottom: 22 }}>
                    <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 12.5, fontWeight: 600, color: C.inkSoft, textTransform: "uppercase", marginBottom: 10 }}>Vital signs on arrival</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {VITAL_DEFS.map((v) => {
                            const cur = data.vitals[v.key];
                            return (
                                <div key={v.key} style={{ background: cur.abnormal ? C.abnormalSoft : C.paperDeep, borderRadius: 6, padding: "8px 12px", minWidth: 84 }}>
                                    <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.inkFaint }}>{v.label}</div>
                                    <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 17, fontWeight: 600, color: cur.abnormal ? C.abnormal : C.ink }}>{cur.value || "-"}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ marginBottom: 22 }}>
                    <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 12.5, fontWeight: 600, color: C.inkSoft, textTransform: "uppercase", marginBottom: 10 }}>
                        Physical exam ({data.exam.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {data.exam.map((e) => (
                            <div key={e.id} style={{ fontFamily: "'IBM Plex Sans'", fontSize: 13.5, color: C.ink }}>
                                <Chip color={e.abnormal ? C.abnormal : C.normal} soft={e.abnormal ? C.abnormalSoft : C.normalSoft}>{e.abnormal ? "ABN" : "NL"}</Chip>{" "}
                                <span style={{ color: C.inkSoft }}>{e.system}:</span> {e.finding}
                            </div>
                        ))}
                        {data.exam.length === 0 && <span style={{ color: C.inkFaint, fontSize: 13.5 }}>None recorded.</span>}
                    </div>
                </div>

                <div style={{ marginBottom: 22 }}>
                    <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 12.5, fontWeight: 600, color: C.inkSoft, textTransform: "uppercase", marginBottom: 10 }}>
                        Investigations ({data.investigations.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {data.investigations.map((i) => (
                            <div key={i.id} style={{ fontFamily: "'IBM Plex Sans'", fontSize: 13.5, color: C.ink }}>
                                <Chip color={i.abnormal ? C.abnormal : C.normal} soft={i.abnormal ? C.abnormalSoft : C.normalSoft}>{i.abnormal ? "ABN" : "NL"}</Chip>{" "}
                                {i.name}: <span style={{ fontFamily: "'IBM Plex Mono'" }}>{i.kind === "lab" ? `${i.value || "-"} ${i.unit}` : i.report || "-"}</span>
                            </div>
                        ))}
                        {data.investigations.length === 0 && <span style={{ color: C.inkFaint, fontSize: 13.5 }}>None recorded.</span>}
                    </div>
                </div>

                <div style={{ marginBottom: 22 }}>
                    <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 12.5, fontWeight: 600, color: C.inkSoft, textTransform: "uppercase", marginBottom: 10 }}>
                        History questions ({data.historyGraph?.nodes?.length ?? 0})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {(data.historyGraph?.nodes ?? []).map((n) => {
                            const cat = HISTORY_CATEGORIES.find((c) => c.key === n.data.category);
                            return (
                                <div key={n.id} style={{ fontFamily: "'IBM Plex Sans'", fontSize: 13.5, color: C.ink }}>
                                    {cat && <Chip color={cat.color} soft={cat.soft}>{cat.label}</Chip>}{" "}
                                    {n.data.question || "No question"}
                                </div>
                            );
                        })}
                        {(data.historyGraph?.nodes?.length ?? 0) === 0 && <span style={{ color: C.inkFaint, fontSize: 13.5 }}>No history questions created yet.</span>}
                    </div>
                </div>

                <div style={{ marginBottom: 22 }}>
                    {(() => {
                        const nodes = data.managementGraph.nodes;
                        const edges = data.managementGraph.edges;
                        const interventions = nodes.filter((n) => n.type === "intervention");
                        const timers = nodes.filter((n) => n.type === "timer");
                        const outcomes = nodes.filter((n) => n.type === "outcome");
                        return (
                            <>
                                <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 12.5, fontWeight: 600, color: C.inkSoft, textTransform: "uppercase", marginBottom: 10 }}>
                                    Decision graph - {interventions.length} intervention{interventions.length !== 1 ? "s" : ""}, {timers.length} timer{timers.length !== 1 ? "s" : ""}, {outcomes.length} outcome{outcomes.length !== 1 ? "s" : ""}, {edges.length} connection{edges.length !== 1 ? "s" : ""}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {outcomes.map((n) => {
                                        const o = OUTCOME_TYPES.find((x) => x.key === n.data.outcomeType);
                                        if (!o) return null;
                                        const incoming = edges.filter((e) => e.target === n.id).map((e) => {
                                            const src = nodes.find((s) => s.id === e.source);
                                            if (!src) return null;
                                            const label = src.type === "intervention" ? (src.data.actions?.length > 1 ? `${src.data.actions[0]} +${src.data.actions.length - 1}` : src.data.actions?.[0] || "?") : src.type === "timer" ? `${src.data.minutes}min: ${src.data.note}` : "Case start";
                                            return e.label ? `${label} (${e.label})` : label;
                                        }).filter(Boolean);
                                        return (
                                            <div key={n.id} style={{ fontFamily: "'IBM Plex Sans'", fontSize: 13.5 }}>
                                                <Chip color={o.color} soft={o.soft}>{o.label}</Chip>{" "}
                                                <span style={{ color: C.inkSoft }}>{incoming.length ? `from: ${incoming.join(", ")}` : "not yet connected"}</span>
                                                {n.data.outcomeType !== "unlockEvent" && n.data.narrative && <div style={{ color: C.ink, marginTop: 2, marginLeft: 2 }}>{n.data.narrative}</div>}
                                            </div>
                                        );
                                    })}
                                    {outcomes.length === 0 && <span style={{ color: C.inkFaint, fontSize: 13.5 }}>No outcome nodes yet - build the graph in the Management step.</span>}
                                </div>
                            </>
                        );
                    })()}
                </div>
            </Card>
        </div>
    );
}

/* ---------------------------------------------------------------
   APP SHELL
--------------------------------------------------------------- */
const STEPS = [
    { key: "background", label: "Background", num: "01" },
    { key: "vitals", label: "Vital signs", num: "02" },
    { key: "history", label: "History taking", num: "03" },
    { key: "exam", label: "Physical exam", num: "04" },
    { key: "investigations", label: "Investigations", num: "05" },
    { key: "management", label: "Management & outcomes", num: "06" },
    { key: "review", label: "Case sheet", num: "07" },
];

export default function CaseDesigner({ caseId: initialCaseId, sidebarOpen, setSidebarOpen }: { caseId?: string; sidebarOpen: boolean; setSidebarOpen: (v: boolean) => void }) {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [caseData, setCaseData] = useState(emptyCase);
    const [saving, setSaving] = useState(false);
    const [caseId, setCaseId] = useState<string | null>(initialCaseId && initialCaseId !== "new" ? initialCaseId : null);
    const [loading, setLoading] = useState(!!initialCaseId && initialCaseId !== "new");
    const update = (patch: Partial<CaseData>) => {

        setCaseData((d) => ({ ...d, ...patch }))
        console.log(caseData)
    };

    useEffect(() => {
        const template = new URLSearchParams(window.location.search).get("template");
        if (template && (!initialCaseId || initialCaseId === "new")) {
            const src = getBuiltinRaw(template, "en");
            if (src) {
                const copy = normalizeImported(JSON.parse(JSON.stringify(src)));
                copy.title = `${copy.title} (copy)`;
                setCaseData(copy as CaseData);
            }
            return;
        }
        if (!initialCaseId || initialCaseId === "new") return;
        (async () => {
            try {
                const fromLocal = getLocalCase(initialCaseId)?.data;
                const fetched = fromLocal ? JSON.parse(JSON.stringify(fromLocal)) : await getCloudCase(initialCaseId);
                if (fetched) {
                    const raw = normalizeImported(fetched) as CaseData & { diagnosis?: string };
                    if (!Array.isArray(raw.diagnoses) && raw.diagnosis) {
                        raw.diagnoses = [raw.diagnosis];
                    }
                    raw.diagnoses ??= [];
                    // migrate old node data formats
                    if (raw.managementGraph?.nodes) {
                        raw.managementGraph.nodes = raw.managementGraph.nodes.map((n) => {
                            if (n.type === "intervention" && !Array.isArray((n.data as any).actions)) {
                                const old = n.data as any;
                                const actions: string[] = [];
                                if (old.custom) actions.push(old.custom);
                                if (old.name && !actions.includes(old.name)) actions.push(old.name);
                                if (Array.isArray(old.options)) old.options.forEach((o: string) => { if (!actions.includes(o)) actions.push(o); });
                                return { ...n, data: { actions: actions.length > 0 ? actions : [old.name || "?"] } };
                            }
                            if (n.type === "required" && !Array.isArray((n.data as any).actions)) {
                                const old = n.data as any;
                                if (Array.isArray(old.required)) {
                                    if (old.required[0]?.items) {
                                        return { ...n, data: { actions: old.required.map((g: any) => ({ or: g.items.map((r: any) => r.name) })) } };
                                    }
                                    if (old.required[0]?.category) {
                                        return { ...n, data: { actions: old.required.map((r: any) => ({ or: [r.name] })) } };
                                    }
                                }
                                return { ...n, data: { actions: [{ or: ["?"] }] } };
                            }
                            if (n.type === "required" && Array.isArray((n.data as any).actions) && Array.isArray((n.data as any).actions[0])) {
                                const old = n.data as any;
                                return { ...n, data: { actions: old.actions.map((g: string[]) => ({ or: g })) } };
                            }
                            return n;
                        });
                    }
                    setCaseData(raw as CaseData);
                }
            } catch (err) {
                console.error("Failed to load case:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [initialCaseId]);

    function stripUndefined(obj: unknown): unknown {
        if (Array.isArray(obj)) return obj.map(stripUndefined);
        if (obj && typeof obj === "object" && !(obj as any).toDate && !(obj as any).isEqual) {
            const clean: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(obj)) {
                if (v !== undefined) clean[k] = stripUndefined(v);
            }
            return clean;
        }
        return obj;
    }

    const [savedNote, setSavedNote] = useState<string>("");
    const updateCase = async () => {
        setSaving(true);
        try {
            // Local first: works offline and without an account.
            const rec = saveLocalCase(stripUndefined(caseData), caseId ?? undefined);
            if (!caseId) {
                setCaseId(rec.id);
                router.replace(`/designer?id=${rec.id}`);
            }
            let note = "Saved on this device";
            try {
                const cloudId = await publishCloud(caseData, rec.cloudId);
                if (cloudId) { saveLocalCase(stripUndefined(caseData), rec.id, cloudId); note = "Saved and shared to the cloud"; }
            } catch (err) {
                console.error("Cloud publish failed, kept local copy:", err);
                note = "Saved on this device (cloud publish failed)";
            }
            setSavedNote(note);
        } catch (err) {
            console.error("Failed to save case:", err);
            setSavedNote("Save failed: storage may be full");
        } finally {
            setSaving(false);
        }
    };

    const progress = useMemo(() => {
        let filled = 0;
        if (caseData.title && caseData.background) filled++;
        if (Object.values(caseData.vitals).some((v) => v.value)) filled++;
        if ((caseData.historyGraph?.nodes?.length ?? 0) > 0) filled++;
        if (caseData.exam.length) filled++;
        if (caseData.investigations.length) filled++;
        if (caseData.managementGraph.nodes.length > 1) filled++;
        return filled;
    }, [caseData]);

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, minHeight: "100vh", background: C.paper, fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", color: C.inkSoft, fontSize: 14 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" style={{ animation: "spin 0.8s linear infinite" }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                </svg>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                Loading case…
            </div>
        );
    }

    return (
        <div style={{ background: C.paper, minHeight: "100vh", fontFamily: "'IBM Plex Sans'" }}>
            {/* font + global reset */}
            <style dangerouslySetInnerHTML={{
                __html: `@import url('${FONT_LINK}'); * { box-sizing: border-box; } input:focus, textarea:focus, select:focus { border-color: ${C.accent} !important; }
                .sidebar-overlay { display: none; }
                @media (max-width: 768px) {
                    .sidebar-desktop { display: none !important; }
                    .sidebar-overlay { display: block; }
                }
                @media (min-width: 769px) {
                    .sidebar-mobile { display: none !important; }
                }
            ` }} />

            <div style={{ display: "flex", maxWidth: 1180, margin: "0 auto" }}>
                {/* sidebar overlay for mobile */}
                {sidebarOpen && (
                    <div
                        className="sidebar-overlay"
                        onClick={() => setSidebarOpen(false)}
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.35)",
                            zIndex: 99,
                        }}
                    />
                )}

                {/* stepper - desktop */}
                <div className="sidebar-desktop" style={{ width: 240, flexShrink: 0, padding: "28px 16px", borderRight: `1px solid ${C.line}` }}>
                    {STEPS.map((s, i) => {
                        const disabled = !caseId && i > 0;
                        return (
                            <button
                                key={s.key}
                                onClick={() => !disabled && setStep(i)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    width: "100%",
                                    textAlign: "left",
                                    border: "none",
                                    background: i === step ? C.accentSoft : "transparent",
                                    borderRadius: 7,
                                    padding: "10px 12px",
                                    marginBottom: 4,
                                    cursor: disabled ? "default" : "pointer",
                                    opacity: disabled ? 0.4 : 1,
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: "'IBM Plex Mono'",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: i === step ? C.accent : C.inkFaint,
                                    }}
                                >
                                    {s.num}
                                </span>
                                <span style={{ fontFamily: "'IBM Plex Sans'", fontSize: 13.5, fontWeight: i === step ? 600 : 500, color: i === step ? C.accent : (disabled ? C.inkFaint : C.inkSoft) }}>{s.label}</span>
                            </button>
                        );
                    })}

                    <div style={{ marginTop: 24, padding: "0 12px" }}>
                        <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10.5, color: C.inkFaint, marginBottom: 6 }}>
                            {progress}/6 SECTIONS STARTED
                        </div>
                        <div style={{ height: 4, background: C.line, borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${(progress / 6) * 100}%`, background: C.normal }} />
                        </div>
                    </div>
                </div>

                {/* stepper - mobile drawer */}
                <div
                    className="sidebar-mobile"
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: 260,
                        background: C.surface,
                        borderRight: `1px solid ${C.line}`,
                        zIndex: 100,
                        padding: "28px 16px",
                        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
                        transition: "transform 0.2s ease",
                        overflowY: "auto",
                    }}
                >
                    {STEPS.map((s, i) => {
                        const disabled = !caseId && i > 0;
                        return (
                            <button
                                key={s.key}
                                onClick={() => { if (!disabled) { setStep(i); setSidebarOpen(false); } }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    width: "100%",
                                    textAlign: "left",
                                    border: "none",
                                    background: i === step ? C.accentSoft : "transparent",
                                    borderRadius: 7,
                                    padding: "10px 12px",
                                    marginBottom: 4,
                                    cursor: disabled ? "default" : "pointer",
                                    opacity: disabled ? 0.4 : 1,
                                }}
                            >
                                <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, fontWeight: 700, color: i === step ? C.accent : C.inkFaint }}>
                                    {s.num}
                                </span>
                                <span style={{ fontFamily: "'IBM Plex Sans'", fontSize: 13.5, fontWeight: i === step ? 600 : 500, color: i === step ? C.accent : (disabled ? C.inkFaint : C.inkSoft) }}>{s.label}</span>
                            </button>
                        );
                    })}
                    <div style={{ marginTop: 24, padding: "0 12px" }}>
                        <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10.5, color: C.inkFaint, marginBottom: 6 }}>
                            {progress}/6 SECTIONS STARTED
                        </div>
                        <div style={{ height: 4, background: C.line, borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${(progress / 6) * 100}%`, background: C.normal }} />
                        </div>
                    </div>
                </div>

                {/* main content */}
                <div style={{ flex: 1, padding: "20px 40px 80px", overflowX: "auto", minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
                        <GhostButton onClick={() => router.push("/cases")}>← Case library</GhostButton>
                        <PrimaryButton onClick={updateCase} disabled={saving || !caseData.title}>{saving ? "Saving…" : "Save"}</PrimaryButton>
                        <GhostButton onClick={async () => { await updateCase(); const id = caseId ?? new URLSearchParams(window.location.search).get("id"); if (id) router.push(`/simulator/play/custom?caseId=${id}&from=library`); }}>▶ Playtest</GhostButton>
                        <GhostButton onClick={() => exportCaseFile({ title: caseData.title, data: caseData })}>Export file</GhostButton>
                        <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11.5, color: C.inkFaint }}>{savedNote || (auth.currentUser ? "Signed in: saves also publish to the cloud" : "Not signed in: saves stay on this device")}</span>
                    </div>
                    {step === 0 && <StepBackground data={caseData} update={update} />}
                    {step === 1 && <StepVitals data={caseData} update={update} />}
                    {step === 2 && <StepHistory data={caseData} update={update} />}
                    {step === 3 && <StepExam data={caseData} update={update} />}
                    {step === 4 && <StepInvestigations data={caseData} update={update} caseId={caseId} />}
                    {step === 5 && <StepManagement data={caseData} update={update} />}
                    {step === 6 && <StepReview data={caseData} />}

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, paddingTop: 20, borderTop: `1px solid ${C.line}` }}>
                        <GhostButton onClick={() => setStep((s) => Math.max(0, s - 1))} style={{ visibility: step === 0 ? "hidden" : "visible" }}>
                            ← Back
                        </GhostButton>
                        {step < STEPS.length - 1 ? (
                            <PrimaryButton
                                onClick={async () => { await updateCase(); setStep((s) => Math.min(STEPS.length - 1, s + 1)) }}
                                disabled={saving || (step === 0 && !caseId && (!caseData.title || !caseData.chiefComplaint || !caseData.age || !caseData.background))}
                            >{saving ? "Saving…" : step === 0 && !caseId ? "Create new case →" : "Continue →"}</PrimaryButton>
                        ) : (
                            <PrimaryButton onClick={updateCase} disabled={saving}>{saving ? "Saving…" : "Publish case"}</PrimaryButton>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}