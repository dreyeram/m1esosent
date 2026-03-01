"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
    Play,
    Edit3,
    X,
    Calendar,
    Eye,
    MoreHorizontal,
    Clock,
    User,
    FileText,
    CheckCircle,
    AlertCircle,
    XCircle,
    Loader2,
    UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScheduledProcedure, ScheduleSettingsData } from "@/app/actions/schedule";
import { cancelProcedure, checkInPatient, markNoShow } from "@/app/actions/schedule";
import { decodeProcedureType, getProcedureDisplayName } from "@/types/procedureTypes";

interface ProcedureBlockProps {
    procedure: ScheduledProcedure;
    settings: ScheduleSettingsData;
    onStartProcedure: (procedureId: string, patient: any) => void;
    onRefresh: () => void;
    onEditSchedule?: (procedure: ScheduledProcedure) => void;
    onViewPatient?: (patient: any) => void;
    compact?: boolean;
}

// Status configurations
const STATUS_CONFIG: Record<string, {
    bg: string;
    border: string;
    text: string;
    icon: React.ElementType;
    label: string;
}> = {
    SCHEDULED: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        icon: Clock,
        label: "Scheduled"
    },
    CHECKED_IN: {
        bg: "bg-cyan-50",
        border: "border-cyan-200",
        text: "text-cyan-700",
        icon: UserCheck,
        label: "Checked In"
    },
    IN_PROGRESS: {
        bg: "bg-amber-50",
        border: "border-amber-300",
        text: "text-amber-700",
        icon: Loader2,
        label: "In Progress"
    },
    COMPLETED: {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-700",
        icon: CheckCircle,
        label: "Completed"
    },
    CANCELLED: {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-600",
        icon: XCircle,
        label: "Cancelled"
    },
    NO_SHOW: {
        bg: "bg-slate-100",
        border: "border-slate-300",
        text: "text-slate-500",
        icon: AlertCircle,
        label: "No Show"
    }
};

export function ProcedureBlock({
    procedure,
    settings,
    onStartProcedure,
    onRefresh,
    onEditSchedule,
    onViewPatient,
    compact = false
}: ProcedureBlockProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [isActioning, setIsActioning] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const statusConfig = STATUS_CONFIG[procedure.status] || STATUS_CONFIG.SCHEDULED;
    const StatusIcon = statusConfig.icon;

    // Get procedure display name
    const getProcedureName = () => {
        try {
            const decoded = decodeProcedureType(procedure.type);
            return getProcedureDisplayName(decoded.specialtyId, decoded.categoryId, decoded.subtypeId) || procedure.type;
        } catch {
            return procedure.type;
        }
    };

    // Format time display
    const formatTime = (time: string | null) => {
        if (!time) return "";
        const [hours, minutes] = time.split(":").map(Number);
        const ampm = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    };

    // Actions
    const handleStart = async () => {
        // If check-in is enabled and not checked in, check in first
        if (settings.enableCheckIn && procedure.status === "SCHEDULED") {
            setIsActioning(true);
            await checkInPatient(procedure.id);
            onRefresh();
            setIsActioning(false);
            return;
        }

        onStartProcedure(procedure.id, procedure.patient);
    };

    const handleCheckIn = async () => {
        setIsActioning(true);
        await checkInPatient(procedure.id);
        onRefresh();
        setIsActioning(false);
        setShowMenu(false);
    };

    const handleNoShow = async () => {
        setIsActioning(true);
        await markNoShow(procedure.id);
        onRefresh();
        setIsActioning(false);
        setShowMenu(false);
    };

    const handleCancel = async (reason: string) => {
        setIsActioning(true);
        await cancelProcedure(procedure.id, reason);
        onRefresh();
        setIsActioning(false);
        setShowCancelModal(false);
        setShowMenu(false);
    };

    // Determine primary action
    const getPrimaryAction = () => {
        switch (procedure.status) {
            case "SCHEDULED":
                return settings.enableCheckIn
                    ? { label: "Check In", icon: UserCheck, action: handleCheckIn }
                    : { label: "Start", icon: Play, action: handleStart };
            case "CHECKED_IN":
                return { label: "Start", icon: Play, action: () => onStartProcedure(procedure.id, procedure.patient) };
            case "IN_PROGRESS":
                return { label: "View", icon: Eye, action: () => onStartProcedure(procedure.id, procedure.patient) };
            case "COMPLETED":
                return { label: "Report", icon: FileText, action: () => { } }; // TODO: Open report
            case "CANCELLED":
            case "NO_SHOW":
                return { label: "Reschedule", icon: Calendar, action: () => { } }; // TODO: Reschedule
            default:
                return null;
        }
    };

    const primaryAction = getPrimaryAction();

    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`h-full rounded-lg border-l-4 shadow-sm cursor-pointer transition-shadow hover:shadow-md overflow-hidden ${statusConfig.bg} ${statusConfig.border}`}
                onClick={(e) => {
                    e.stopPropagation();
                    if (procedure.status !== "CANCELLED" && procedure.status !== "NO_SHOW") {
                        handleStart();
                    }
                }}
            >
                <div className="h-full p-2 flex flex-col">
                    {/* Time */}
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium ${statusConfig.text}`}>
                            {formatTime(procedure.scheduledTime)}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="p-1 rounded hover:bg-white/50 transition-colors"
                        >
                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>

                    {/* Patient Name */}
                    <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                            <span className="text-xs font-medium text-slate-600">
                                {procedure.patient.fullName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <span className="text-sm font-semibold text-slate-800 truncate">
                            {procedure.patient.fullName}
                        </span>
                    </div>

                    {/* Procedure Type */}
                    <span className="text-xs text-slate-600 truncate mb-auto">
                        {getProcedureName()}
                    </span>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1 mt-1">
                        <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.text} ${procedure.status === "IN_PROGRESS" ? "animate-spin" : ""
                            }`} />
                        <span className={`text-xs font-medium ${statusConfig.text}`}>
                            {statusConfig.label}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Quick Menu Dropdown */}
            <AnimatePresence>
                {showMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowMenu(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 top-8 z-50 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 overflow-hidden"
                        >
                            {/* Primary Action */}
                            {primaryAction && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        primaryAction.action();
                                    }}
                                    disabled={isActioning}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 text-blue-600 font-medium"
                                >
                                    <primaryAction.icon className="w-4 h-4" />
                                    {primaryAction.label}
                                </button>
                            )}

                            <div className="border-t border-slate-100 my-1" />

                            {/* View Patient */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onViewPatient) {
                                        onViewPatient(procedure.patient);
                                    }
                                    setShowMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
                            >
                                <User className="w-4 h-4" />
                                View Patient
                            </button>

                            {/* Edit (only for scheduled) */}
                            {(procedure.status === "SCHEDULED" || procedure.status === "CHECKED_IN") && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onEditSchedule) {
                                            onEditSchedule(procedure);
                                        }
                                        setShowMenu(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    Edit Schedule
                                </button>
                            )}

                            {/* No Show (only for scheduled/checked in) */}
                            {(procedure.status === "SCHEDULED" || procedure.status === "CHECKED_IN") && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleNoShow();
                                    }}
                                    disabled={isActioning}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    Mark No Show
                                </button>
                            )}

                            {/* Cancel (only for scheduled/checked in) */}
                            {(procedure.status === "SCHEDULED" || procedure.status === "CHECKED_IN") && (
                                <>
                                    <div className="border-t border-slate-100 my-1" />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowCancelModal(true);
                                        }}
                                        disabled={isActioning}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-600"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel Procedure
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Cancel Modal */}
            <AnimatePresence>
                {showCancelModal && (
                    <CancelModal
                        onCancel={() => setShowCancelModal(false)}
                        onConfirm={handleCancel}
                        isLoading={isActioning}
                        patientName={procedure.patient.fullName}
                        procedureType={getProcedureName()}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

// Cancel Modal Component
function CancelModal({
    onCancel,
    onConfirm,
    isLoading,
    patientName,
    procedureType
}: {
    onCancel: () => void;
    onConfirm: (reason: string) => void;
    isLoading: boolean;
    patientName: string;
    procedureType: string;
}) {
    const [reason, setReason] = useState("");
    const [customReason, setCustomReason] = useState("");

    const reasons = [
        "Patient requested",
        "Patient no-show",
        "Doctor unavailable",
        "Equipment issue",
        "Medical reason",
        "Other"
    ];

    const handleConfirm = () => {
        const finalReason = reason === "Other" ? customReason : reason;
        if (finalReason) {
            onConfirm(finalReason);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={onCancel}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-1">
                        Cancel Procedure
                    </h2>
                    <p className="text-sm text-slate-600 mb-4">
                        {procedureType} for {patientName}
                    </p>

                    <div className="space-y-2 mb-4">
                        <label className="text-sm font-medium text-slate-700">
                            Reason for cancellation
                        </label>
                        {reasons.map((r) => (
                            <label key={r} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="reason"
                                    value={r}
                                    checked={reason === r}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm text-slate-700">{r}</span>
                            </label>
                        ))}
                    </div>

                    {reason === "Other" && (
                        <input
                            type="text"
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            placeholder="Specify reason..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4"
                        />
                    )}
                </div>

                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        Keep Scheduled
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!reason || (reason === "Other" && !customReason) || isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isLoading ? "Cancelling..." : "Cancel Procedure"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default ProcedureBlock;
