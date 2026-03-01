/**
 * PatientManager Component
 * 
 * Patient management interface for listing and managing patients.
 */

"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, UserPlus, Filter, ChevronRight, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QuickRegisterSheet } from "../scheduling/QuickRegisterSheet";
import { searchPatients } from '@/app/actions/auth';
import { clsx } from 'clsx';

interface PatientManagerProps {
    role: 'ADMIN' | 'DOCTOR' | 'ASSISTANT';
    onSelectPatient?: (patient: Patient) => void;
}

interface Patient {
    id: string;
    mrn: string;
    fullName: string;
    gender?: string | null;
    age?: number; // Added for premium design
    mobile?: string; // Added for premium design
    lastVisit?: Date; // Added for premium design
    procedures: Array<{
        id: string;
        type: string;
        status: string;
        createdAt: Date;
    }>;
}

export default function PatientManager({ role, onSelectPatient }: PatientManagerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [showRegisterSheet, setShowRegisterSheet] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadPatients();
    }, [searchQuery]); // Added searchQuery to dependencies to trigger search on change

    const loadPatients = async () => {
        setIsLoading(true);
        try {
            const result = await searchPatients(searchQuery);
            setPatients(result as Patient[]);
        } catch (error) {
            console.error('Failed to load patients:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // handleSearch and handleKeyDown are no longer directly used by the new search input,
    // as the search now triggers on searchQuery change via useEffect.
    // Keeping them for now in case they are intended for other uses or future changes.
    const handleSearch = async () => {
        await loadPatients();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const onPatientSelect = (patient: Patient) => {
        onSelectPatient?.(patient);
    };

    return (
        <div className="h-full flex flex-col bg-[#F5F5F7]">
            {/* Action Bar */}
            <header className="px-10 py-6 border-b border-slate-200/50 bg-white/40 backdrop-blur-lg flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-6">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patients</h1>
                    <div className="flex bg-slate-100 rounded-xl p-1 shadow-inner">
                        <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-blue-600 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                            All Patients
                        </button>
                        <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-600 transition-all">
                            Recent
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find by name, MRN, mobile..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-72 h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowRegisterSheet(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                    >
                        <UserPlus size={16} />
                        New Patient
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-auto px-10 py-8 scrollbar-hide">
                <div className="max-w-7xl mx-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                        </div>
                    ) : patients.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <User className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">No patients found</h3>
                            <p className="text-slate-500 mb-8 max-w-sm mx-auto">Start by adding your first patient to the medical suite.</p>
                            <button
                                onClick={() => setShowRegisterSheet(true)}
                                className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25"
                            >
                                Register New Patient
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {patients.map((patient, idx) => (
                                    <motion.div
                                        key={patient.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.03 }}
                                        onClick={() => onPatientSelect(patient)}
                                        className="group bg-white squircle-xl p-6 border border-slate-200/50 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/15 transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                <ChevronRight size={18} />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-100 to-white border border-slate-200 flex items-center justify-center text-xl font-bold text-slate-700 shadow-sm group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300">
                                                {patient.fullName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight italic">
                                                    {patient.fullName}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{patient.mrn}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                    <span className="text-xs font-medium text-slate-500">{patient.gender}, {patient.age}y</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                                                    <ArrowRight size={14} className="text-slate-400" />
                                                </div>
                                                <span className="text-sm font-medium truncate">{patient.mobile}</span>
                                            </div>
                                            {patient.lastVisit && (
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 mt-2 border-t border-slate-50">
                                                    Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            <QuickRegisterSheet
                isOpen={showRegisterSheet}
                onClose={() => setShowRegisterSheet(false)}
                doctorId={""} // Handle this depending on app architecture
                onSuccess={(patient) => {
                    setShowRegisterSheet(false);
                    onPatientSelect(patient);
                    loadPatients(); // Re-fetch patients after successful registration
                }}
            />
        </div>
    );
}
