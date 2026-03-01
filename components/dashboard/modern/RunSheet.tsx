"use client";

import React from "react";
import { Clock, MoreVertical, FileText, AlertTriangle, CheckCircle, XCircle, Play, Eye } from "lucide-react";
import { motion } from "framer-motion";

interface Procedure {
    id: string;
    time: string;
    patientName: string;
    patientId: string;
    type: string;
    status: 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    duration: number;
    hasWarnings?: boolean;
    reportStatus?: 'draft' | 'signed' | 'missing';
}

interface RunSheetProps {
    procedures: Procedure[];
    onAction: (id: string, action: string) => void;
    onStartProcedure?: (id: string) => void;
}

const STATUS_STYLES = {
    SCHEDULED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', icon: Clock },
    CHECKED_IN: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: CheckCircle },
    IN_PROGRESS: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', icon: Play },
    COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: CheckCircle },
    CANCELLED: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-100', icon: XCircle },
};

export default function RunSheet({ procedures, onAction, onStartProcedure }: RunSheetProps) {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-700">Daily Run Sheet</h3>
                <div className="flex gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1 bg-white rounded-lg border border-slate-100">
                        {procedures.length} Procedures
                    </span>
                </div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-50">
                {procedures.map((proc, index) => {
                    const statusStyle = STATUS_STYLES[proc.status] || STATUS_STYLES.SCHEDULED;
                    const StatusIcon = statusStyle.icon;
                    const canStart = proc.status === 'SCHEDULED' || proc.status === 'CHECKED_IN';
                    const isInProgress = proc.status === 'IN_PROGRESS';
                    const isCompleted = proc.status === 'COMPLETED';

                    return (
                        <motion.div
                            key={proc.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group hover:bg-slate-50/50 transition-colors p-4 flex items-center gap-4 relative"
                        >
                            {/* Time Column */}
                            <div className="w-20 flex flex-col items-center">
                                <span className="text-lg font-black text-slate-700">{proc.time}</span>
                                <span className="text-xs text-slate-400 font-medium">{proc.duration}m</span>
                            </div>

                            {/* Status Line */}
                            <div className={`w-1 self-stretch rounded-full ${proc.status === 'COMPLETED' ? 'bg-emerald-500' :
                                    proc.status === 'IN_PROGRESS' ? 'bg-purple-500' :
                                        proc.status === 'CHECKED_IN' ? 'bg-amber-500' :
                                            'bg-blue-500'
                                }`} />

                            {/* Patient Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4
                                        className="font-bold text-slate-900 text-lg truncate cursor-pointer hover:text-blue-600 transition-colors"
                                        onClick={() => onAction(proc.id, 'view-patient')}
                                    >
                                        {proc.patientName}
                                    </h4>
                                    {proc.hasWarnings && (
                                        <AlertTriangle size={16} className="text-rose-500 animate-pulse" />
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                        {proc.type}
                                    </span>
                                    <span className={`flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                                        <StatusIcon size={10} />
                                        {proc.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                {/* Start Procedure Button - Only for SCHEDULED or CHECKED_IN */}
                                {canStart && (
                                    <button
                                        onClick={() => onStartProcedure?.(proc.id)}
                                        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-green-200 transition-all hover:scale-105"
                                    >
                                        <Play size={14} fill="white" />
                                        Start
                                    </button>
                                )}

                                {/* Continue Button - For IN_PROGRESS */}
                                {isInProgress && (
                                    <button
                                        onClick={() => onStartProcedure?.(proc.id)}
                                        className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-purple-200 transition-all hover:scale-105"
                                    >
                                        <Play size={14} fill="white" />
                                        Continue
                                    </button>
                                )}

                                {/* Report Status - For COMPLETED */}
                                {isCompleted && (
                                    <div className="px-2">
                                        {proc.reportStatus === 'signed' ? (
                                            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl font-bold text-xs">
                                                <CheckCircle size={14} />
                                                Report Signed
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => onAction(proc.id, 'sign-report')}
                                                className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl font-bold text-xs hover:bg-amber-100 transition-colors"
                                            >
                                                <FileText size={14} />
                                                Sign Report
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* View Patient Details */}
                                <button
                                    onClick={() => onAction(proc.id, 'view-patient')}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                    title="View Patient"
                                >
                                    <Eye size={18} />
                                </button>

                                {/* More Actions */}
                                <button
                                    onClick={() => onAction(proc.id, 'menu')}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {procedures.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                    <p>No procedures scheduled for today.</p>
                </div>
            )}
        </div>
    );
}
