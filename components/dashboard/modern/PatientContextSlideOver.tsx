"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Calendar, FileText, Activity, AlertTriangle, Phone, Mail, MapPin } from "lucide-react";

interface PatientContextSlideOverProps {
    isOpen: boolean;
    onClose: () => void;
    patient: {
        id: string;
        name: string;
        mrn: string;
        age?: number;
        gender?: string;
        mobile?: string;
        email?: string;
        address?: string;
        history?: string[]; // Mock history or real
        allergies?: string[];
    } | null;
}

export default function PatientContextSlideOver({ isOpen, onClose, patient }: PatientContextSlideOverProps) {
    if (!patient) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">{patient.name}</h2>
                                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                    <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-700 font-mono text-xs">MRN: {patient.mrn}</span>
                                    <span>{patient.age ? `${patient.age} yrs` : 'Age N/A'}</span>
                                    <span>{patient.gender || 'Unknown'}</span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">

                            {/* Contact Info */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Details</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <Phone size={16} className="text-slate-400" />
                                        <span>{patient.mobile || "No mobile number"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <Mail size={16} className="text-slate-400" />
                                        <span>{patient.email || "No email address"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <MapPin size={16} className="text-slate-400" />
                                        <span>{patient.address || "No address on file"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Clinical Alerts */}
                            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                                <div className="flex items-center gap-2 mb-3 text-red-700 font-bold">
                                    <AlertTriangle size={18} />
                                    <h3>Clinical Alerts</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {patient.allergies && patient.allergies.length > 0 ? (
                                        patient.allergies.map((allergy, i) => (
                                            <span key={i} className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm border border-red-200">
                                                {allergy}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-red-400/80 italic">No known allergies</span>
                                    )}
                                </div>
                            </div>

                            {/* Recent History */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Activity</h3>
                                <div className="relative border-l-2 border-slate-100 ml-2 space-y-6">
                                    <div className="pl-6 relative">
                                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
                                        <div className="text-sm font-bold text-slate-700">Today</div>
                                        <div className="text-sm text-slate-500">Scheduled for procedure</div>
                                    </div>

                                    {/* Mock Data */}
                                    <div className="pl-6 relative">
                                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
                                        <div className="text-sm font-bold text-slate-700">Dec 12, 2024</div>
                                        <div className="text-sm text-slate-500">Consultation - Initial Assessment</div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50">
                            <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all">
                                View Full Record
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
