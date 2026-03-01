"use client";

import React, { useState } from "react";
import {
    Plus, Trash2, Pill, Clock, Calendar,
    AlertCircle, Search, ChevronDown, ListCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface PrescriptionItem {
    id: string;
    medicineId: string;
    name: string;
    dosage: string; // e.g. 1-0-1
    duration: string; // e.g. 5 days
    instruction: string; // e.g. After food
}

interface PrescriptionSectionProps {
    items: PrescriptionItem[];
    availableMedicines: any[];
    onChange: (items: PrescriptionItem[]) => void;
    disabled?: boolean;
}

export default function PrescriptionSection({
    items,
    availableMedicines,
    onChange,
    disabled
}: PrescriptionSectionProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [showResults, setShowResults] = useState(false);

    const filteredMedicines = availableMedicines.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.composition?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);

    const addItem = (medicine: any) => {
        const newItem: PrescriptionItem = {
            id: Math.random().toString(36).substr(2, 9),
            medicineId: medicine.id,
            name: medicine.name,
            dosage: "1-0-1",
            duration: "5 Days",
            instruction: "After Food"
        };
        onChange([...items, newItem]);
        setSearchTerm("");
        setShowResults(false);
    };

    const removeItem = (id: string) => {
        onChange(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: keyof PrescriptionItem, value: string) => {
        onChange(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const dosageOptions = ["1-0-1", "1-1-1", "1-0-0", "0-0-1", "0-1-0", "1-1-0", "SOC", "As needed"];
    const instructionOptions = ["After Food", "Before Food", "Empty Stomach", "At Bedtime", "With Milk"];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-950 uppercase tracking-widest flex items-center gap-2">
                        <Pill size={16} className="text-emerald-500" />
                        Prescription
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Add medications and instructions for the patient.</p>
                </div>
            </div>

            {/* Medicine Selector */}
            {!disabled && (
                <div className="relative">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search medicine from inventory..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowResults(true);
                            }}
                            onFocus={() => setShowResults(true)}
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-500 outline-none focus:bg-white focus:border-emerald-400 focus:shadow-lg focus:shadow-emerald-100 transition-all"
                        />
                    </div>

                    <AnimatePresence>
                        {showResults && searchTerm && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowResults(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border-2 border-slate-200 rounded-xl shadow-2xl overflow-hidden"
                                >
                                    {filteredMedicines.length > 0 ? (
                                        <div className="p-2">
                                            {filteredMedicines.map(m => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => addItem(m)}
                                                    className="w-full text-left p-3 hover:bg-emerald-50 rounded-lg flex items-center gap-3 group transition-colors"
                                                >
                                                    <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                        <Plus size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-900">{m.name}</div>
                                                        <div className="text-[10px] text-slate-600 font-medium">{m.composition} • {m.strength}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-slate-500">
                                            <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm font-bold">No medicines found in inventory</p>
                                        </div>
                                    )}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Current Prescription List */}
            <div className="space-y-2">
                {items.length === 0 ? (
                    <div className="py-10 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                        <ListCheck size={32} className="opacity-20 mb-2" />
                        <p className="text-sm italic">No medications prescribed yet.</p>
                    </div>
                ) : (
                    <div className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                                    <th className="px-4 py-3">Medicine</th>
                                    <th className="px-4 py-3">Dosage</th>
                                    <th className="px-4 py-3">Duration</th>
                                    <th className="px-4 py-3">Instruction</th>
                                    {!disabled && <th className="px-4 py-3 text-right"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {items.map((item) => (
                                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {disabled ? (
                                                <span className="text-sm text-slate-900 font-medium">{item.dosage}</span>
                                            ) : (
                                                <select
                                                    value={item.dosage}
                                                    onChange={(e) => updateItem(item.id, 'dosage', e.target.value)}
                                                    className="bg-emerald-100 border-2 border-emerald-200 rounded-lg px-2 py-1 text-sm font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                >
                                                    {dosageOptions.map(opt => <option key={opt} value={opt} className="text-slate-900 font-medium">{opt}</option>)}
                                                </select>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {disabled ? (
                                                <span className="text-sm text-slate-900 font-medium">{item.duration}</span>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={item.duration}
                                                    onChange={(e) => updateItem(item.id, 'duration', e.target.value)}
                                                    className="w-24 bg-slate-100 border-2 border-slate-200 rounded-lg px-3 py-1 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all"
                                                />
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {disabled ? (
                                                <span className="text-sm text-slate-900 font-medium">{item.instruction}</span>
                                            ) : (
                                                <select
                                                    value={item.instruction}
                                                    onChange={(e) => updateItem(item.id, 'instruction', e.target.value)}
                                                    className="bg-blue-100 border-2 border-blue-200 rounded-lg px-2 py-1 text-sm font-bold text-blue-900 outline-none focus:border-blue-500"
                                                >
                                                    {instructionOptions.map(opt => <option key={opt} value={opt} className="text-slate-900 font-medium">{opt}</option>)}
                                                </select>
                                            )}
                                        </td>
                                        {!disabled && (
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
