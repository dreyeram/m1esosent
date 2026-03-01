"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { PROCEDURE_TYPES, encodeProcedureType, decodeProcedureType, getProcedureDisplayName } from "@/types/procedureTypes";

interface ProcedureTypeSelectorProps {
    value: string; // Encoded procedure type: "specialty:category:subtype"
    onChange: (encoded: string, displayName: string) => void;
    className?: string;
}

export default function ProcedureTypeSelector({ value, onChange, className = "" }: ProcedureTypeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedSpecialty, setExpandedSpecialty] = useState<string | null>(null);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Decode current value for display
    const decoded = value ? decodeProcedureType(value) : null;
    const displayName = decoded
        ? getProcedureDisplayName(decoded.specialtyId, decoded.categoryId, decoded.subtypeId)
        : "Select Procedure Type";

    // Handle selection
    const handleSelect = (specialtyId: string, categoryId: string, subtypeId: string, subtypeName: string) => {
        const encoded = encodeProcedureType(specialtyId, categoryId, subtypeId);
        onChange(encoded, subtypeName);
        setIsOpen(false);
        setSearchQuery("");
    };

    // Filter logic for search
    const filterProcedures = () => {
        if (!searchQuery.trim()) return PROCEDURE_TYPES;

        const query = searchQuery.toLowerCase();
        return PROCEDURE_TYPES.map(specialty => ({
            ...specialty,
            categories: specialty.categories.map(category => ({
                ...category,
                subtypes: category.subtypes.filter(subtype =>
                    subtype.name.toLowerCase().includes(query) ||
                    category.name.toLowerCase().includes(query) ||
                    specialty.name.toLowerCase().includes(query)
                )
            })).filter(category => category.subtypes.length > 0)
        })).filter(specialty => specialty.categories.length > 0);
    };

    const filteredProcedures = filterProcedures();

    return (
        <div className={`relative ${className}`}>
            {/* Selected Value Display */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-semibold text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-left flex items-center justify-between hover:bg-slate-100 transition-colors"
            >
                <span className={value ? "text-slate-900" : "text-slate-400"}>
                    {displayName}
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => { setIsOpen(false); setSearchQuery(""); }}
                    />

                    {/* Dropdown Content */}
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-2xl z-50 max-h-[400px] overflow-hidden flex flex-col">
                        {/* Search */}
                        <div className="p-3 border-b border-slate-100 sticky top-0 bg-white">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search procedures..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Procedure List */}
                        <div className="overflow-y-auto flex-1 p-2">
                            {filteredProcedures.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    No procedures found
                                </div>
                            ) : (
                                filteredProcedures.map(specialty => (
                                    <div key={specialty.id} className="mb-1">
                                        {/* Specialty Header */}
                                        <button
                                            type="button"
                                            onClick={() => setExpandedSpecialty(expandedSpecialty === specialty.id ? null : specialty.id)}
                                            className="w-full flex items-center gap-2 p-2.5 rounded-lg hover:bg-slate-100 transition-colors text-left"
                                        >
                                            <ChevronRight
                                                size={14}
                                                className={`text-slate-400 transition-transform ${expandedSpecialty === specialty.id ? 'rotate-90' : ''}`}
                                            />
                                            <span className="text-sm font-bold text-slate-800">{specialty.name}</span>
                                            <span className="text-[10px] text-slate-400 ml-auto">
                                                {specialty.categories.reduce((acc, c) => acc + c.subtypes.length, 0)} procedures
                                            </span>
                                        </button>

                                        {/* Categories */}
                                        {(expandedSpecialty === specialty.id || searchQuery) && (
                                            <div className="ml-4 border-l-2 border-slate-100 pl-2">
                                                {specialty.categories.map(category => (
                                                    <div key={category.id} className="mb-0.5">
                                                        {/* Category Header */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                                                            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 transition-colors text-left"
                                                        >
                                                            <ChevronRight
                                                                size={12}
                                                                className={`text-blue-400 transition-transform ${expandedCategory === category.id || searchQuery ? 'rotate-90' : ''}`}
                                                            />
                                                            <span className="text-xs font-semibold text-blue-700">{category.name}</span>
                                                        </button>

                                                        {/* Subtypes */}
                                                        {(expandedCategory === category.id || searchQuery) && (
                                                            <div className="ml-4 space-y-0.5">
                                                                {category.subtypes.map(subtype => (
                                                                    <button
                                                                        key={subtype.id}
                                                                        type="button"
                                                                        onClick={() => handleSelect(specialty.id, category.id, subtype.id, subtype.name)}
                                                                        className="w-full text-left p-2 pl-4 rounded-lg text-xs font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                                                    >
                                                                        {subtype.name}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
