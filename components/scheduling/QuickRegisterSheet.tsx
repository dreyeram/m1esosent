"use client";

import React, { useState, useEffect, useRef } from "react";
import { User, Phone, Calendar as CalendarIcon, ArrowRight, Loader2 } from "lucide-react";
import { ContextSheet } from "../ui/ContextSheet";
import { createPatient } from "@/app/actions/auth";

interface QuickRegisterSheetProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate?: Date;
    initialTime?: string;
    doctorId: string;
    onSuccess: (patient: any) => void;
}

export function QuickRegisterSheet({
    isOpen,
    onClose,
    initialDate,
    initialTime,
    doctorId,
    onSuccess,
}: QuickRegisterSheetProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const firstNameRef = useRef<HTMLInputElement>(null);

    // Form state - Mandatory fields
    const [formData, setFormData] = useState({
        fullName: "",
        age: "",
        gender: "Male",
        mobile: "",
        email: "",
        address: "",
    });

    // Auto-focus on name field when opening
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => firstNameRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Validation
        if (!formData.fullName || !formData.age || !formData.mobile) {
            setError("Full Name, Age, and Mobile are mandatory.");
            return;
        }

        const name = formData.fullName.trim();
        if (name.length < 4) {
            setError("Name must be at least 4 characters");
            return;
        }
        if (!/^[a-zA-Z\s]+$/.test(name)) {
            setError("Name can only contain letters, spaces");
            return;
        }

        const ageNum = parseInt(formData.age, 10);
        if (isNaN(ageNum)) {
            setError("Valid age required");
            return;
        }
        if (ageNum < 0) {
            setError("Age cannot be negative");
            return;
        }
        if (ageNum > 150) {
            setError("Age must be realistic");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Register patient
            const result = await createPatient({
                fullName: formData.fullName,
                age: Number(formData.age),
                gender: formData.gender,
                mobile: formData.mobile,
                email: formData.email || undefined,
                address: formData.address || undefined,
                refId: (formData as any).refId || undefined,
            });

            if (result.success && result.patient) {
                onSuccess(result.patient);
            } else {
                setError(result.error || "Failed to register patient");
            }
        } catch (err) {
            setError("A network error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ContextSheet
            isOpen={isOpen}
            onClose={onClose}
            title="Quick Registration"
            description="Enter patient details to start the procedure instantly."
            footer={
                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm uppercase tracking-wider hover:bg-slate-200 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleSubmit()}
                        disabled={isLoading}
                        className="flex-[2] flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Register & Start
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-8 py-4">
                {/* Identity Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        <User className="w-3.5 h-3.5" />
                        Identity Details
                    </div>

                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Full Name *</label>
                            <input
                                ref={firstNameRef}
                                type="text"
                                placeholder="e.g. John Doe"
                                value={formData.fullName}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^[a-zA-Z\s]+$/.test(val)) {
                                        setFormData({ ...formData, fullName: val });
                                    }
                                }}
                                className="w-full h-12 px-5 bg-slate-100/50 border-0 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Age *</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={formData.age}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '') {
                                            setFormData({ ...formData, age: val });
                                            return;
                                        }
                                        const num = parseInt(val, 10);
                                        if (!isNaN(num) && num >= 0 && num <= 150) {
                                            setFormData({ ...formData, age: val });
                                        }
                                    }}
                                    min="0"
                                    max="150"
                                    className="w-full h-12 px-5 bg-slate-100/50 border-0 rounded-2xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Gender *</label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    className="w-full h-12 px-5 bg-slate-100/50 border-0 rounded-2xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
                                >
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>


                    </div>
                </div>

                {/* Contact Section */}
                <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        <Phone className="w-3.5 h-3.5" />
                        Contact Information
                    </div>

                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Mobile Number *</label>
                            <input
                                type="tel"
                                placeholder="+91 00000 00000"
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                className="w-full h-12 px-5 bg-slate-100/50 border-0 rounded-2xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Email (Optional)</label>
                            <input
                                type="email"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full h-12 px-5 bg-slate-100/50 border-0 rounded-2xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Address</label>
                            <textarea
                                placeholder="House No, Street, City"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full h-24 px-5 py-4 bg-slate-100/50 border-0 rounded-2xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Ref ID (OH)</label>
                            <input
                                type="text"
                                placeholder="Ref ID"
                                value={(formData as any).refId || ''}
                                onChange={(e) => setFormData({ ...formData, refId: e.target.value } as any)}
                                className="w-full h-12 px-5 bg-slate-100/50 border-0 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Slot Info (Optional Visual) */}
                {(initialTime || initialDate) && (
                    <div className="mt-8 p-4 bg-blue-50 rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                            <CalendarIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none">Selected Slot</p>
                            <p className="text-sm font-bold text-blue-900 mt-1">
                                {initialTime || "All Day"} • {initialDate?.toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-medium animate-in fade-in zoom-in duration-300">
                        {error}
                    </div>
                )}
            </form>
        </ContextSheet>
    );
}
