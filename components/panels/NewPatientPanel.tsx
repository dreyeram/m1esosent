"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Phone,
    Mail,
    MapPin,
    Loader2,
    Check,
    ArrowRight,
    Zap
} from "lucide-react";
import { createPatient } from "@/app/actions/auth";
import { encodeProcedureType } from "@/types/procedureTypes";

interface NewPatientPanelProps {
    onSuccess: (patient: any, procedureType?: string) => void;
    onCancel: () => void;
}

export default function NewPatientPanel({ onSuccess, onCancel }: NewPatientPanelProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        age: '',
        gender: 'Male',
        mobile: '',
        email: '',
        address: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.fullName.trim() || !formData.mobile.trim() || !formData.age) {
            setError('Please complete all primary fields');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const result = await createPatient({
                fullName: formData.fullName.trim(),
                age: parseInt(formData.age) || 0,
                gender: formData.gender as any,
                mobile: formData.mobile.trim(),
                email: formData.email.trim() || undefined,
                address: formData.address.trim() || undefined,
            });

            if (result.success && result.patient) {
                // Return a default procedure type for the "Rapid" flow
                const defaultType = encodeProcedureType("1", "1", "1");
                onSuccess(result.patient, defaultType);
            } else {
                setError(result.error || 'Identity conflict detected');
            }
        } catch (err) {
            setError('Biometric link failure. Try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-full bg-transparent flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-4xl glass-floating p-12 relative overflow-hidden"
            >
                {/* Accent Decor */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full" />

                <form onSubmit={handleSubmit} className="relative z-10">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20">
                                    Rapid Entry
                                </span>
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
                                Register Identity
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="p-3 rounded-2xl glass-surface hover:bg-rose-50 hover:text-rose-500 transition-all text-slate-400 active:scale-95"
                        >
                            Cancel
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Identity Section */}
                        <div className="space-y-8">
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 group-focus-within:text-blue-600 transition-colors">
                                    Full Name <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Enter Legal Name"
                                        className="w-full h-14 bg-white/40 glass-surface px-6 rounded-2xl text-lg font-bold text-slate-900 outline-none focus:bg-white focus:shadow-2xl focus:shadow-blue-500/10 transition-all placeholder:text-slate-300"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Age</label>
                                    <input
                                        type="number"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleChange}
                                        placeholder="00"
                                        className="w-full h-14 bg-white/40 glass-surface px-6 rounded-2xl text-lg font-bold text-slate-900 outline-none focus:bg-white transition-all"
                                    />
                                </div>
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Gender</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full h-14 bg-white/40 glass-surface px-6 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-700 outline-none appearance-none cursor-pointer focus:bg-white transition-all"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Connection Section */}
                        <div className="space-y-8">
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Mobile Interface</label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        placeholder="00000 00000"
                                        maxLength={10}
                                        className="w-full h-14 bg-white/40 glass-surface px-6 rounded-2xl text-lg font-bold text-slate-900 outline-none focus:bg-white transition-all placeholder:text-slate-300"
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Location Details</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="City, Province"
                                    className="w-full h-14 bg-white/40 glass-surface px-6 rounded-2xl text-lg font-bold text-slate-900 outline-none focus:bg-white transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-300 italic">
                            * Required for immediate procedure initialization
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-16 px-10 rounded-[2rem] bg-slate-900 text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/40 hover:shadow-slate-900/60 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all flex items-center gap-4 group disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Register & Initiate
                                        <Zap size={18} fill="currentColor" className="text-blue-400 group-hover:scale-125 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Error Sub-Modal */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-6 py-3 rounded-2xl shadow-2xl text-xs font-black uppercase tracking-widest z-50 flex items-center gap-3"
                            >
                                <span>{error}</span>
                                <button onClick={() => setError('')} className="p-1 rounded-full hover:bg-white/20">
                                    <Check size={14} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </motion.div>
        </div>
    );
}
