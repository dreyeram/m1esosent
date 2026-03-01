"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Clock, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";

interface SmartBriefingProps {
    doctorName: string;
    stats: {
        totalPatients: number;
        completedPatients: number;
        pendingReports: number;
        nextBreak: string;
        isBehind: boolean;
        minutesBehind: number;
    };
    nextPatient?: {
        name: string;
        time: string;
        procedure: string;
    };
    onDismiss?: () => void;
}

export default function SmartBriefing({ doctorName, stats, nextPatient, onDismiss }: SmartBriefingProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!isExpanded) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-8 mb-6"
            >
                <button
                    onClick={() => setIsExpanded(true)}
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors"
                >
                    <Sparkles size={16} />
                    <span>Show Daily Briefing</span>
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-8 mb-8"
        >
            {/* Solid Blue Background - Customizable */}
            <div className="bg-blue-600 rounded-2xl p-6 shadow-xl shadow-blue-200 text-white relative overflow-hidden">
                {/* Subtle Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-32 translate-x-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-24 -translate-x-12" />

                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Sparkles className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Daily Briefing</h3>
                                <p className="text-blue-100 text-sm">AI Analysis • {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-blue-100 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Schedule Health */}
                        <div className="bg-black/20 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                            <div className="flex items-center gap-2 mb-2 text-blue-200 text-sm font-medium">
                                <Clock size={14} />
                                <span>Schedule Velocity</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold">
                                    {stats.isBehind ? `${stats.minutesBehind}m Late` : 'On Track'}
                                </span>
                                {stats.isBehind && (
                                    <span className="text-xs bg-red-500/80 px-2 py-0.5 rounded text-white animate-pulse">
                                        High Traffic
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-blue-200 mt-2">
                                {stats.totalPatients - stats.completedPatients} procedures remaining. Next break at {stats.nextBreak}.
                            </p>
                        </div>

                        {/* Next Up */}
                        <div className="bg-black/20 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                            <div className="flex items-center gap-2 mb-2 text-blue-200 text-sm font-medium">
                                <ChevronRight size={14} />
                                <span>Up Next</span>
                            </div>
                            {nextPatient ? (
                                <>
                                    <div className="text-lg font-bold truncate">{nextPatient.name}</div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-sm bg-white/20 px-2 py-0.5 rounded text-white">
                                            {nextPatient.time}
                                        </span>
                                        <span className="text-sm text-blue-100 truncate">
                                            {nextPatient.procedure}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-lg font-bold text-blue-200">No upcoming patients</div>
                            )}
                        </div>

                        {/* Action Items */}
                        <div className="bg-black/20 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                            <div className="flex items-center gap-2 mb-2 text-blue-200 text-sm font-medium">
                                <AlertCircle size={14} />
                                <span>Attention Needed</span>
                            </div>
                            <div className="space-y-2">
                                {stats.pendingReports > 0 ? (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-white">Sign Reports</span>
                                        <span className="bg-yellow-500 text-black font-bold px-2 py-0.5 rounded-full text-xs">
                                            {stats.pendingReports} Pending
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-green-300 text-sm">
                                        <CheckCircle2 size={16} />
                                        <span>All reports signed</span>
                                    </div>
                                )}
                                <div className="text-xs text-blue-300 mt-2">
                                    System is running optimally. No critical alerts.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
