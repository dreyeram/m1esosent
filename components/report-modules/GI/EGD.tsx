import React from 'react';
import { Card, Input, Select, Label, cn } from '@/components/ui/base';
import { EGDData } from '@/types/schema';

interface EGDProps {
    data: EGDData;
    onChange: (data: EGDData) => void;
}

export function EGD({ data, onChange }: EGDProps) {
    const updateSection = (section: keyof EGDData, field: string, value: any) => {
        onChange({
            ...data,
            [section]: { ...data[section], [field]: value }
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Section 1: Esophagus */}
            <Card>
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Esophagus</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Mucosa"
                        options={[
                            { label: 'Normal', value: 'Normal' },
                            { label: 'Esophagitis', value: 'Esophagitis' },
                            { label: "Barrett's Esophagus", value: "Barrett's Esophagus" },
                            { label: 'Candidiasis', value: 'Candidiasis' },
                        ]}
                        value={data.esophagus.mucosa}
                        onChange={(e) => updateSection('esophagus', 'mucosa', e.target.value)}
                    />

                    {data.esophagus.mucosa === 'Esophagitis' && (
                        <Select
                            label="LA Classification"
                            options={[
                                { label: 'Grade A', value: 'Grade A' },
                                { label: 'Grade B', value: 'Grade B' },
                                { label: 'Grade C', value: 'Grade C' },
                                { label: 'Grade D', value: 'Grade D' },
                            ]}
                            value={data.esophagus.esophagitisGrade}
                            onChange={(e) => updateSection('esophagus', 'esophagitisGrade', e.target.value)}
                        />
                    )}

                    {data.esophagus.mucosa === "Barrett's Esophagus" && (
                        <div className="col-span-2 bg-orange-50 p-4 rounded border border-orange-200">
                            <Label className="text-orange-800 mb-2">Prague Criteria</Label>
                            <div className="flex gap-4">
                                <Input
                                    label="C length (cm)"
                                    type="number"
                                    value={data.esophagus.barretts?.c || 0}
                                    onChange={(e) => updateSection('esophagus', 'barretts', { ...data.esophagus.barretts, c: Number(e.target.value) })}
                                />
                                <Input
                                    label="M length (cm)"
                                    type="number"
                                    value={data.esophagus.barretts?.m || 0}
                                    onChange={(e) => updateSection('esophagus', 'barretts', { ...data.esophagus.barretts, m: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                    )}

                    <Select
                        label="Varices"
                        options={[
                            { label: 'None', value: 'None' },
                            { label: 'Grade 1 (Small)', value: 'Grade 1' },
                            { label: 'Grade 2 (Medium)', value: 'Grade 2' },
                            { label: 'Grade 3 (Large)', value: 'Grade 3' },
                        ]}
                        value={data.esophagus.varices}
                        onChange={(e) => updateSection('esophagus', 'varices', e.target.value)}
                    />

                    <div className="flex items-center gap-2 mt-6">
                        <input
                            type="checkbox"
                            id="stricture"
                            checked={data.esophagus.stricture}
                            onChange={(e) => updateSection('esophagus', 'stricture', e.target.checked)}
                            className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                        />
                        <label htmlFor="stricture" className="font-medium text-sm text-slate-700">Stricture Present?</label>
                    </div>
                </div>
            </Card>

            {/* Section 2: Stomach */}
            <Card>
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Stomach</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Gastritis Type"
                        options={[
                            { label: 'None', value: 'None' },
                            { label: 'Erythematous', value: 'Erythematous' },
                            { label: 'Erosive', value: 'Erosive' },
                            { label: 'Atrophic', value: 'Atrophic' },
                        ]}
                        value={data.stomach.gastritisType}
                        onChange={(e) => updateSection('stomach', 'gastritisType', e.target.value)}
                    />

                    <div className="col-span-2">
                        <Label>Location</Label>
                        <div className="flex gap-4 mt-2">
                            {['Antrum', 'Body', 'Fundus', 'Cardia'].map(loc => (
                                <label key={loc} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.stomach.location.includes(loc)}
                                        onChange={(e) => {
                                            const current = data.stomach.location;
                                            const next = e.target.checked ? [...current, loc] : current.filter(l => l !== loc);
                                            updateSection('stomach', 'location', next);
                                        }}
                                        className="rounded text-blue-600"
                                    />
                                    <span className="text-sm font-medium">{loc}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="col-span-2 flex items-center gap-2 mt-2 bg-blue-50 p-3 rounded border border-blue-100">
                        <input
                            type="checkbox"
                            id="biopsy"
                            checked={data.stomach.biopsy}
                            onChange={(e) => updateSection('stomach', 'biopsy', e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded"
                        />
                        <label htmlFor="biopsy" className="font-medium text-blue-900">Biopsy Taken (H. Pylori CLO Test)</label>
                    </div>
                </div>
            </Card>

            {/* Section 3: Duodenum */}
            <Card>
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Duodenum</h3>
                <Select
                    label="Bulb / D2 Findings"
                    options={[
                        { label: 'Normal', value: 'Normal' },
                        { label: 'Duodenitis', value: 'Duodenitis' },
                        { label: 'Ulcer', value: 'Ulcer' },
                        { label: 'Villous Atrophy (Celiac suspicion)', value: 'Villous Atrophy' },
                    ]}
                    value={data.duodenum.bulbD2}
                    onChange={(e) => updateSection('duodenum', 'bulbD2', e.target.value)}
                />
            </Card>
        </div>
    );
}
