import React, { useState } from 'react';
import { Card, Input, Select, Button, Label, cn } from '@/components/ui/base';
import { ColonoscopyData, GIFinding } from '@/types/schema';
import { Plus, Trash2 } from 'lucide-react';

interface ColonoscopyProps {
    data: ColonoscopyData;
    onChange: (data: ColonoscopyData) => void;
}

export function Colonoscopy({ data, onChange }: ColonoscopyProps) {
    const updateField = (field: keyof ColonoscopyData, value: any) => {
        onChange({ ...data, [field]: value });
    };

    const updateBowelPrep = (field: string, value: any) => {
        if (field === 'agent') {
            onChange({ ...data, bowelPrep: { ...data.bowelPrep, agent: value } });
        } else {
            // BBPS Logic
            const newQuality = { ...data.bowelPrep.quality, [field]: Number(value) };
            newQuality.total = newQuality.right + newQuality.transverse + newQuality.left;
            onChange({ ...data, bowelPrep: { ...data.bowelPrep, quality: newQuality } });
        }
    };

    // Findings Logic
    const addFinding = () => {
        const newFinding: GIFinding = {
            id: Math.random().toString(36).substr(2, 9),
            location: 'Rectum',
            type: 'Normal'
        };
        updateField('findings', [...data.findings, newFinding]);
    };

    const removeFinding = (id: string) => {
        updateField('findings', data.findings.filter(f => f.id !== id));
    };

    const updateFinding = (id: string, field: keyof GIFinding, value: any) => {
        const updatedFindings = data.findings.map((f: GIFinding) => {
            if (f.id === id) {
                const updated = { ...f, [field]: value };
                // Reset sub-forms if type changes
                if (field === 'type') {
                    updated.polyp = undefined;
                    updated.diverticulosis = undefined;
                    updated.colitis = undefined;
                    updated.hemorrhoids = undefined;

                    // Initialize sub-form based on type
                    if (value === 'Polyp') {
                        updated.polyp = { size: 5, number: 1, morphology: 'Sessile (Is)', intervention: 'Cold Snare', retrieved: true };
                    } else if (value === 'Diverticulosis') {
                        updated.diverticulosis = { severity: 'Sparse', signs: [] };
                    } else if (value === 'Inflammation') {
                        updated.colitis = { mayoScore: 0, appearance: [] };
                    } else if (value === 'Hemorrhoids') {
                        updated.hemorrhoids = { grade: 'I', bleeding: false, therapy: 'None' };
                    }
                }
                return updated;
            }
            return f;
        });
        updateField('findings', updatedFindings);
    };

    const updateSubFinding = (id: string, subType: 'polyp' | 'diverticulosis' | 'colitis' | 'hemorrhoids', field: string, value: any) => {
        const updatedFindings = data.findings.map((f: GIFinding) => {
            if (f.id === id && f[subType]) {
                const subData: any = f[subType]; // Explicit cast to avoid type errors
                return { ...f, [subType]: { ...subData, [field]: value } };
            }
            return f;
        });
        updateField('findings', updatedFindings);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Section 1: Pre-Procedure & Quality */}
            <Card>
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Pre-Procedure & Quality</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <Label>Indication</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {['Screening', 'Surveillance', 'Bleeding', 'Pain', 'Diarrhea', 'Constipation', 'Anemia'].map((opt: string) => (
                                <label key={opt} className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={data.indication.includes(opt)}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            if (e.target.checked) updateField('indication', [...data.indication, opt]);
                                            else updateField('indication', data.indication.filter((i: string) => i !== opt));
                                        }}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <Select
                        label="Bowel Prep Agent"
                        options={[
                            { label: 'PEG (Golytely)', value: 'PEG' },
                            { label: 'Sodium Picosulfate', value: 'Sodium Picosulfate' },
                            { label: 'Miralax', value: 'Miralax' },
                            { label: 'Split-Dose', value: 'Split-Dose' },
                        ]}
                        value={data.bowelPrep.agent}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateBowelPrep('agent', e.target.value)}
                    />

                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                        <Label className="text-blue-800 mb-2 font-semibold">Boston Bowel Preparation Scale (BBPS)</Label>
                        <div className="flex gap-4 items-end">
                            <Input label="Right" type="number" min="0" max="3" className="w-20" value={data.bowelPrep.quality.right} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBowelPrep('right', e.target.value)} />
                            <Input label="Transverse" type="number" min="0" max="3" className="w-20" value={data.bowelPrep.quality.transverse} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBowelPrep('transverse', e.target.value)} />
                            <Input label="Left" type="number" min="0" max="3" className="w-20" value={data.bowelPrep.quality.left} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBowelPrep('left', e.target.value)} />
                            <div className="font-bold text-xl text-blue-700 ml-auto flex flex-col items-end leading-tight">
                                <span>{data.bowelPrep.quality.total}/9</span>
                                <span className="text-xs font-normal">Total Score</span>
                            </div>
                        </div>
                    </div>

                    <Select
                        label="Digital Rectal Exam"
                        options={[
                            { label: 'Normal', value: 'Normal' },
                            { label: 'Hemorrhoids', value: 'Hemorrhoids' },
                            { label: 'Mass', value: 'Mass' },
                            { label: 'Blood on glove', value: 'Blood on glove' },
                        ]}
                        value={data.dre}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('dre', e.target.value)}
                    />
                </div>
            </Card>

            {/* Section 2: Procedure Metrics */}
            <Card>
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Procedure Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Extent Reached"
                        options={[
                            { label: 'Cecum (Complete)', value: 'Cecum' },
                            { label: 'Terminal Ileum', value: 'Terminal Ileum' },
                            { label: 'Anastomosis', value: 'Anastomosis' },
                            { label: 'Splenic Flexure (Incomplete)', value: 'Splenic Flexure' },
                        ]}
                        value={data.extentReached}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('extentReached', e.target.value)}
                    />
                    <Input
                        label="Withdrawal Time (min)"
                        type="number"
                        value={data.withdrawalTime}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('withdrawalTime', Number(e.target.value))}
                        className={data.withdrawalTime < 6 ? "border-red-300 text-red-600 bg-red-50" : "border-green-300 text-green-600 bg-green-50"}
                    />
                    <div className="col-span-2">
                        <Label>Landmarks Identified</Label>
                        <div className="flex gap-4 mt-2">
                            {['Appendiceal Orifice', 'Ileo-cecal Valve', 'Tri-radiate fold'].map((lm: string) => (
                                <label key={lm} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.landmarks.includes(lm)}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            if (e.target.checked) updateField('landmarks', [...data.landmarks, lm]);
                                            else updateField('landmarks', data.landmarks.filter((l: string) => l !== lm));
                                        }}
                                        className="rounded text-blue-600"
                                    />
                                    <span className="text-sm">{lm}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Section 3: Findings (Repeater) */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-blue-900">Findings</h3>
                    <Button onClick={addFinding} size="sm" variant="secondary" className="gap-2">
                        <Plus size={16} /> Add Finding
                    </Button>
                </div>

                {data.findings.length === 0 && (
                    <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-slate-500">
                        No abnormal findings recorded. Click "Add Finding" to document observations.
                    </div>
                )}

                {data.findings.map((finding: GIFinding, index: number) => (
                    <Card key={finding.id} className="relative border-l-4 border-l-blue-600">
                        <button
                            onClick={() => removeFinding(finding.id)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                            title="Remove Finding"
                        >
                            <Trash2 size={18} />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-8">
                            <Select
                                label="Location"
                                options={[
                                    { label: 'Rectum', value: 'Rectum' },
                                    { label: 'Sigmoid', value: 'Sigmoid' },
                                    { label: 'Descending', value: 'Descending' },
                                    { label: 'Splenic Flexure', value: 'Splenic Flexure' },
                                    { label: 'Transverse', value: 'Transverse' },
                                    { label: 'Hepatic Flexure', value: 'Hepatic Flexure' },
                                    { label: 'Ascending', value: 'Ascending' },
                                    { label: 'Cecum', value: 'Cecum' },
                                    { label: 'Terminal Ileum', value: 'Terminal Ileum' },
                                ]}
                                value={finding.location}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateFinding(finding.id, 'location', e.target.value)}
                            />
                            <Select
                                label="Finding Type"
                                options={[
                                    { label: 'Normal', value: 'Normal' },
                                    { label: 'Polyp', value: 'Polyp' },
                                    { label: 'Diverticulosis', value: 'Diverticulosis' },
                                    { label: 'Ulcer', value: 'Ulcer' },
                                    { label: 'Inflammation (Colitis)', value: 'Inflammation' },
                                    { label: 'Tumor/Mass', value: 'Tumor/Mass' },
                                    { label: 'Hemorrhoids', value: 'Hemorrhoids' },
                                ]}
                                value={finding.type}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateFinding(finding.id, 'type', e.target.value)}
                            />
                        </div>

                        {/* Sub-Forms */}
                        {finding.type === 'Polyp' && finding.polyp && (
                            <div className="bg-slate-50 p-4 rounded-md border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Input label="Size (mm)" type="number" value={finding.polyp.size} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSubFinding(finding.id, 'polyp', 'size', Number(e.target.value))} />
                                <Input label="Number" type="number" value={finding.polyp.number} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSubFinding(finding.id, 'polyp', 'number', Number(e.target.value))} />
                                <Select label="Morphology" options={[{ label: 'Sessile (Is)', value: 'Sessile (Is)' }, { label: 'Pedunculated (Ip)', value: 'Pedunculated (Ip)' }, { label: 'Flat (IIa)', value: 'Flat (IIa)' }]} value={finding.polyp.morphology} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateSubFinding(finding.id, 'polyp', 'morphology', e.target.value)} />
                                <Select label="Intervention" options={[{ label: 'Cold Biopsy', value: 'Cold Biopsy' }, { label: 'Cold Snare', value: 'Cold Snare' }, { label: 'Hot Snare', value: 'Hot Snare' }, { label: 'EMR', value: 'EMR' }]} value={finding.polyp.intervention} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateSubFinding(finding.id, 'polyp', 'intervention', e.target.value)} />
                                <label className="flex items-center gap-2 mt-6">
                                    <input type="checkbox" checked={finding.polyp.retrieved} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSubFinding(finding.id, 'polyp', 'retrieved', e.target.checked)} />
                                    <span className="text-sm font-medium">Retrieved</span>
                                </label>
                            </div>
                        )}

                        {finding.type === 'Diverticulosis' && finding.diverticulosis && (
                            <div className="bg-slate-50 p-4 rounded-md border border-slate-200 grid grid-cols-2 gap-4">
                                <Select label="Severity" options={[{ label: 'Sparse', value: 'Sparse' }, { label: 'Moderate', value: 'Moderate' }, { label: 'Pan-colonic', value: 'Pan-colonic' }]} value={finding.diverticulosis.severity} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateSubFinding(finding.id, 'diverticulosis', 'severity', e.target.value)} />
                                <div className="flex gap-4 mt-6">
                                    {['Inflammation', 'Bleeding'].map((sign: string) => (
                                        <label key={sign} className="flex items-center gap-2">
                                            <input type="checkbox" checked={finding.diverticulosis!.signs.includes(sign)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const current = finding.diverticulosis!.signs;
                                                const next = e.target.checked ? [...current, sign] : current.filter((s: string) => s !== sign);
                                                updateSubFinding(finding.id, 'diverticulosis', 'signs', next);
                                            }} />
                                            <span className="text-sm font-medium">{sign}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {finding.type === 'Inflammation' && finding.colitis && (
                            <div className="bg-red-50 p-4 rounded-md border border-red-100 grid grid-cols-2 gap-4">
                                <Input label="Mayo Score (0-3)" type="number" min="0" max="3" value={finding.colitis.mayoScore} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSubFinding(finding.id, 'colitis', 'mayoScore', Number(e.target.value))} />
                                <div className="flex flex-wrap gap-2 mt-6">
                                    {['Erythema', 'Loss of vascular pattern', 'Friability', 'Ulceration'].map((app: string) => (
                                        <label key={app} className="flex items-center gap-2">
                                            <input type="checkbox" checked={finding.colitis!.appearance.includes(app)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const current = finding.colitis!.appearance;
                                                const next = e.target.checked ? [...current, app] : current.filter((a: string) => a !== app);
                                                updateSubFinding(finding.id, 'colitis', 'appearance', next);
                                            }} />
                                            <span className="text-sm font-medium">{app}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
