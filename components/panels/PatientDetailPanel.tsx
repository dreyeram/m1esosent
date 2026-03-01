"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Calendar,
    Play,
    Phone,
    Mail,
    MapPin,
    FileText,
    Loader2,
    Download,
    CheckCircle,
    UserCircle,
    ClipboardList,
    MessageCircle,
    AlertCircle,
    X
} from "lucide-react";
import { format } from "date-fns";
import { getPatientDetails } from "@/app/actions/procedure";

interface PatientDetailPanelProps {
    patient: any;
    onBack: () => void;
    onStartProcedure: (patient: any, procedureId?: string) => void;
    onViewReport?: (report: any) => void;
    onDownloadReport?: (report: any) => void;
    onShareReport?: (report: any, patient?: any) => void;
    onCreateReport?: (media: any[], procedure: any) => void;
    onGenerateReport?: (report: any, procedure: any) => void;
    onEndAndAnnotate?: (procedure: any) => void;
}

export default function PatientDetailPanel({
    patient,
    onBack,
    onStartProcedure,
    onViewReport,
    onDownloadReport,
    onShareReport,
    onCreateReport,
    onGenerateReport,
    onEndAndAnnotate
}: PatientDetailPanelProps) {
    const [fullPatient, setFullPatient] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'procedures' | 'info'>('procedures');
    const [resumePromptProc, setResumePromptProc] = useState<any>(null);

    useEffect(() => {
        loadPatientDetails();
    }, [patient?.id]);

    const loadPatientDetails = async () => {
        if (!patient?.id) return;
        setIsLoading(true);
        try {
            const result = await getPatientDetails(patient.id);
            if (result.success && result.patient) {
                setFullPatient({
                    ...result.patient,
                    procedures: result.procedures || [],
                });
            }
        } catch (error) {
            console.error("Failed to load patient:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const displayPatient = fullPatient || patient;

    const getProcedureState = (proc: any) => {
        if (proc.status === 'IN_PROGRESS' || proc.status === 'SCHEDULED') return 'RESUME';

        // CAPTURED = has media but no report yet → ready for annotation
        if (proc.status === 'CAPTURED') return 'ANNOTATE';

        // If completed but no report or report is just raw import source
        const hasRealReport = proc.report && (
            proc.report.finalized ||
            (typeof proc.report.content === 'object' ? !!proc.report.content.formData : proc.report.content.includes('formData'))
        );

        if (proc.status === 'COMPLETED' && !hasRealReport) return 'ANNOTATE';

        if (proc.status === 'COMPLETED' && proc.report && !proc.report.finalized) return 'GENERATE_REPORT';

        if (proc.status === 'COMPLETED' && proc.report?.finalized) return 'COMPLETED';

        return proc.status; // Fallback
    };

    return (
        <div className="h-full flex flex-col bg-white/70 backdrop-blur-3xl border-l border-white/60 shadow-2xl relative overflow-hidden">
            {/* Resume Procedure Modal */}
            <AnimatePresence>
                {resumePromptProc && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center text-center p-6 border border-slate-100"
                        >
                            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
                                <AlertCircle size={24} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Resume Procedure?</h3>
                            <p className="text-[11px] text-slate-500 mb-6 leading-relaxed">
                                This procedure was not finalized. You have <strong className="text-slate-700">{resumePromptProc.media?.length || 0} captures</strong> saved.
                                Would you like to continue capturing, or end it now and proceed to annotation?
                            </p>
                            <div className="grid grid-cols-2 gap-3 w-full">
                                <button
                                    onClick={() => setResumePromptProc(null)}
                                    className="h-10 rounded-xl bg-slate-50 text-slate-600 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        onEndAndAnnotate?.(resumePromptProc);
                                        setResumePromptProc(null);
                                    }}
                                    className="h-10 rounded-xl bg-purple-600 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-purple-700 transition-all shadow-md shadow-purple-500/20"
                                >
                                    End & Annotate
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    onStartProcedure(displayPatient, resumePromptProc.id);
                                    setResumePromptProc(null);
                                }}
                                className="w-full h-12 mt-3 rounded-xl bg-blue-600 text-white font-bold text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                            >
                                Continue Capturing
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header: Compact Clinical Insight */}
            <div className="p-6 pb-4 shrink-0 border-b border-black/[0.03]">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 bg-white/50 border border-white rounded-xl text-slate-400 hover:text-slate-900 shadow-sm transition-all active:scale-90 flex items-center justify-center p-0"
                    >
                        <X size={18} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={() => onStartProcedure(displayPatient)}
                        className="flex items-center gap-2 h-10 px-4 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-500/10 hover:bg-slate-900 transition-all active:scale-95"
                    >
                        <Play size={14} fill="currentColor" />
                        Initiate Lab
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white border border-black/[0.02] rounded-2xl shadow-inner flex items-center justify-center text-xl font-black text-slate-200">
                        {displayPatient?.fullName?.charAt(0) || 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight truncate">
                            {displayPatient?.fullName || 'Identity Core'}
                        </h2>
                        <div className="flex items-center gap-2.5 mt-1">
                            <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase tracking-widest">
                                #{displayPatient?.mrn || '00000'}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                {displayPatient?.age}Y • {displayPatient?.gender}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Compact Tab Control */}
                <div className="flex gap-1.5 bg-slate-900/[0.03] p-1 rounded-xl mt-6">
                    <button
                        onClick={() => setActiveTab('procedures')}
                        className={`flex-1 py-2 px-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'procedures' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Procedure History
                    </button>
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`flex-1 py-2 px-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Clinical Profile
                    </button>
                </div>
            </div>

            {/* Content Area: Precision Cards */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-200">
                        <Loader2 className="w-8 h-8 animate-spin mb-3" strokeWidth={3} />
                        <span className="text-[8px] font-bold uppercase tracking-widest">Syncing Records...</span>
                    </div>
                ) : activeTab === 'procedures' ? (
                    <div className="space-y-3">
                        {(!fullPatient?.procedures || fullPatient.procedures.length === 0) ? (
                            <div className="py-12 text-center bg-white/40 rounded-3xl border border-white border-dashed">
                                <p className="text-slate-300 font-bold text-[8px] uppercase tracking-widest">No cases indexed</p>
                            </div>
                        ) : (
                            fullPatient.procedures.map((proc: any, idx: number) => {
                                const state = getProcedureState(proc);

                                return (
                                    <motion.div
                                        key={proc.id}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className="bg-white/60 p-4 rounded-2xl border border-white shadow-sm hover:shadow-md hover:bg-white transition-all group"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                                    <ClipboardList size={16} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <h4 className="text-[11px] font-bold text-slate-900 tracking-tight uppercase">
                                                        {proc.type?.replace(/_/g, ' ') || 'Procedure Name'}
                                                    </h4>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                        {proc.date ? format(new Date(proc.date), 'MMM d, yyyy') : 'Archive'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border ${state === 'RESUME' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                state === 'ANNOTATE' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                    state === 'GENERATE_REPORT' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                                                        state === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                            'bg-slate-50 text-slate-600 border-slate-100'
                                                }`}>
                                                {state.replace('_', ' ')}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 pt-3 border-t border-black/[0.02]">
                                            {state === 'RESUME' && (
                                                <button
                                                    onClick={() => setResumePromptProc(proc)}
                                                    className="flex-1 h-8 bg-amber-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-md shadow-amber-500/10"
                                                >
                                                    Resume Procedure
                                                </button>
                                            )}

                                            {state === 'ANNOTATE' && (
                                                <button
                                                    onClick={() => onCreateReport?.(proc.media || [], proc)}
                                                    className="flex-1 h-8 bg-purple-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-md shadow-purple-500/10"
                                                >
                                                    Annotate Findings
                                                </button>
                                            )}

                                            {state === 'GENERATE_REPORT' && (
                                                <button
                                                    onClick={() => onGenerateReport?.(proc.report, proc)}
                                                    className="flex-1 h-8 bg-pink-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-pink-700 transition-all shadow-md shadow-pink-500/10"
                                                >
                                                    Generate Report
                                                </button>
                                            )}

                                            {state === 'COMPLETED' && (
                                                <>
                                                    <button
                                                        onClick={() => onViewReport?.({
                                                            ...proc.report,
                                                            procedureType: proc.type,
                                                            doctorName: proc.doctorName,
                                                            date: proc.date,
                                                            procedureId: proc.id
                                                        })}
                                                        className="flex-1 h-8 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all"
                                                    >
                                                        View Report
                                                    </button>
                                                    <button
                                                        onClick={() => onShareReport?.({ ...proc.report, procedureId: proc.id }, displayPatient)}
                                                        className="w-8 h-8 bg-slate-900/[0.03] hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-all flex items-center justify-center p-0"
                                                    >
                                                        <MessageCircle size={14} strokeWidth={2.5} />
                                                    </button>
                                                    <button
                                                        onClick={() => onDownloadReport?.(proc.report)}
                                                        className="w-8 h-8 bg-slate-900/[0.03] hover:bg-white border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all flex items-center justify-center p-0"
                                                    >
                                                        <Download size={14} strokeWidth={2.5} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                )
                            })
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-white/60 p-6 rounded-3xl border border-white shadow-sm">
                            <h3 className="text-[8px] font-black text-slate-900 uppercase tracking-[0.25em] mb-6 pb-2 border-b border-black/[0.02]">Record Core</h3>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl border border-black/[0.02] flex items-center justify-center text-slate-300">
                                        <Phone size={16} strokeWidth={2.5} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Mobile</p>
                                        <p className="text-[13px] font-bold text-slate-800 break-all">{displayPatient.mobile || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl border border-black/[0.02] flex items-center justify-center text-slate-300">
                                        <Mail size={16} strokeWidth={2.5} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Email</p>
                                        <p className="text-[13px] font-bold text-slate-800 truncate">{displayPatient.email || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl border border-black/[0.02] flex items-center justify-center text-slate-300">
                                        <MapPin size={16} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Address</p>
                                        <p className="text-[13px] font-bold text-slate-800 leading-tight">{displayPatient.address || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl border border-black/[0.02] flex items-center justify-center text-slate-300">
                                        <Calendar size={16} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Registry Date</p>
                                        <p className="text-[13px] font-bold text-slate-800 uppercase">
                                            {displayPatient?.createdAt ? format(new Date(displayPatient.createdAt), 'MMM d, yyyy') : 'Clinical Archive'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Bar: Compact */}
            <div className="p-6 pb-10 border-t border-black/[0.03] bg-white/20">
                <button
                    onClick={() => onStartProcedure(displayPatient)}
                    className="w-full h-12 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                    Finalize & Open Lab
                    <Play size={14} fill="currentColor" />
                </button>
            </div>
        </div>
    );
}
