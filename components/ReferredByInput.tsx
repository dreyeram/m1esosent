"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Plus, User } from "lucide-react";

const STORAGE_KEY = "endoscopy_referred_doctors";

interface ReferredByInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export default function ReferredByInput({ value, onChange, className = "" }: ReferredByInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load saved doctors from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setSuggestions(JSON.parse(saved));
            } catch {
                setSuggestions([]);
            }
        }
    }, []);

    // Filter suggestions based on input
    const filteredSuggestions = React.useMemo(() => {
        if (value.trim()) {
            return suggestions.filter(doc =>
                doc.toLowerCase().includes(value.toLowerCase())
            );
        }
        return suggestions;
    }, [value, suggestions]);

    // Save new doctor to localStorage
    const saveDoctorToStorage = (doctorName: string) => {
        if (!doctorName.trim()) return;

        const trimmed = doctorName.trim();
        if (!suggestions.includes(trimmed)) {
            const updated = [...suggestions, trimmed].sort();
            setSuggestions(updated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
    };

    // Handle selection from dropdown
    const handleSelect = (doctorName: string) => {
        onChange(doctorName);
        setIsOpen(false);
    };

    // Handle blur - save if new doctor name
    const handleBlur = () => {
        setTimeout(() => {
            if (value.trim() && !suggestions.includes(value.trim())) {
                saveDoctorToStorage(value);
            }
            setIsOpen(false);
        }, 200);
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Dr. Name (e.g., Dr. Sharma)"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onBlur={handleBlur}
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 pl-10 pr-10 rounded-xl font-semibold text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                    <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                    {filteredSuggestions.length > 0 ? (
                        <>
                            <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                Previously Used
                            </p>
                            {filteredSuggestions.map((doc, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleSelect(doc)}
                                    className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <User size={14} className="text-slate-400" />
                                    {doc}
                                </button>
                            ))}
                        </>
                    ) : value.trim() ? (
                        <div className="px-3 py-3 text-center">
                            <p className="text-xs text-slate-500 mb-2">New referral doctor</p>
                            <div className="flex items-center gap-2 justify-center text-sm font-semibold text-blue-600">
                                <Plus size={14} />
                                <span>Add "{value.trim()}"</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Will be saved for future use</p>
                        </div>
                    ) : (
                        <div className="px-3 py-4 text-center text-sm text-slate-400">
                            Type a doctor name to add
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Export helper to get all saved doctors
export function getSavedReferredDoctors(): string[] {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch {
            return [];
        }
    }
    return [];
}
