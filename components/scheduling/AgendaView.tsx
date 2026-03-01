"use client";

import React, { useMemo } from "react";
import { format, addDays, isSameDay, isToday } from "date-fns";
import {
    Play,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
    UserCheck,
    Calendar,
    FileText
} from "lucide-react";
import { ScheduledProcedure, ScheduleSettingsData } from "@/app/actions/schedule";
import { decodeProcedureType, getProcedureDisplayName } from "@/types/procedureTypes";

interface AgendaViewProps {
    startDate: Date;
    procedures: ScheduledProcedure[];
    settings: ScheduleSettingsData;
    onStartProcedure: (procedureId: string, patient: any) => void;
    onRefresh: () => void;
}

// Status configurations
const STATUS_CONFIG: Record<string, {
    color: string;
    icon: React.ElementType;
    label: string;
}> = {
    SCHEDULED: { color: "text-blue-600", icon: Clock, label: "Scheduled" },
    CHECKED_IN: { color: "text-cyan-600", icon: UserCheck, label: "Checked In" },
    IN_PROGRESS: { color: "text-amber-600", icon: Loader2, label: "In Progress" },
    COMPLETED: { color: "text-green-600", icon: CheckCircle, label: "Completed" },
    CANCELLED: { color: "text-red-500", icon: XCircle, label: "Cancelled" },
    NO_SHOW: { color: "text-slate-500", icon: AlertCircle, label: "No Show" }
};

export function AgendaView({
    startDate,
    procedures,
    settings,
    onStartProcedure,
    onRefresh,
}: AgendaViewProps) {
    // Group procedures by day
    const groupedProcedures = useMemo(() => {
        const days: { date: Date; procedures: ScheduledProcedure[] }[] = [];

        // Create 7 days
        for (let i = 0; i < 7; i++) {
            const day = addDays(startDate, i);
            const dayProcs = procedures.filter(proc => {
                if (!proc.scheduledDate) return false;
                return isSameDay(new Date(proc.scheduledDate), day);
            }).sort((a, b) => {
                if (!a.scheduledTime || !b.scheduledTime) return 0;
                return a.scheduledTime.localeCompare(b.scheduledTime);
            });

            if (dayProcs.length > 0 || isToday(day)) {
                days.push({ date: day, procedures: dayProcs });
            }
        }

        return days;
    }, [procedures, startDate]);

    // Get procedure display name
    const getProcedureName = (type: string) => {
        try {
            const decoded = decodeProcedureType(type);
            return getProcedureDisplayName(decoded.specialtyId, decoded.categoryId, decoded.subtypeId) || type;
        } catch {
            return type;
        }
    };

    // Format time
    const formatTime = (time: string | null) => {
        if (!time) return "";
        const [hours, minutes] = time.split(":").map(Number);
        const ampm = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    };

    // Get action button
    const getActionButton = (proc: ScheduledProcedure) => {
        switch (proc.status) {
            case "SCHEDULED":
            case "CHECKED_IN":
                return (
                    <button
                        onClick={() => onStartProcedure(proc.id, proc.patient)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Play className="w-4 h-4" />
                        Start
                    </button>
                );
            case "IN_PROGRESS":
                return (
                    <button
                        onClick={() => onStartProcedure(proc.id, proc.patient)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
                    >
                        <Play className="w-4 h-4" />
                        Continue
                    </button>
                );
            case "COMPLETED":
                return (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors">
                        <FileText className="w-4 h-4" />
                        Report
                    </button>
                );
            case "CANCELLED":
            case "NO_SHOW":
                return (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors">
                        <Calendar className="w-4 h-4" />
                        Reschedule
                    </button>
                );
            default:
                return null;
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {groupedProcedures.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                        <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600 mb-2">
                            No Procedures Scheduled
                        </h3>
                        <p className="text-sm text-slate-500">
                            Click "Schedule Procedure" to add a new appointment
                        </p>
                    </div>
                ) : (
                    groupedProcedures.map(({ date, procedures: dayProcs }) => (
                        <div key={date.toISOString()}>
                            {/* Day Header */}
                            <div className={`flex items-center gap-3 mb-3 ${isToday(date) ? "text-blue-600" : "text-slate-700"
                                }`}>
                                <div className={`font-semibold ${isToday(date) ? "text-lg" : ""
                                    }`}>
                                    {isToday(date) ? "Today" : format(date, "EEEE")}
                                </div>
                                <div className="text-sm text-slate-500">
                                    {format(date, "MMMM d, yyyy")}
                                </div>
                                {isToday(date) && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                        Today
                                    </span>
                                )}
                                <div className="flex-1 border-t border-slate-200" />
                            </div>

                            {/* Procedures */}
                            <div className="space-y-2">
                                {dayProcs.length === 0 ? (
                                    <div className="bg-white rounded-lg border border-slate-200 p-4 text-center text-slate-500 text-sm">
                                        No procedures scheduled
                                    </div>
                                ) : (
                                    dayProcs.map(proc => {
                                        const status = STATUS_CONFIG[proc.status] || STATUS_CONFIG.SCHEDULED;
                                        const StatusIcon = status.icon;

                                        return (
                                            <div
                                                key={proc.id}
                                                className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-center gap-4">
                                                    {/* Time */}
                                                    <div className="w-20 shrink-0">
                                                        <span className="text-sm font-medium text-slate-600">
                                                            {formatTime(proc.scheduledTime)}
                                                        </span>
                                                    </div>

                                                    {/* Patient Avatar */}
                                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                                        <span className="text-sm font-semibold text-slate-600">
                                                            {proc.patient.fullName.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>

                                                    {/* Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-slate-800">
                                                            {proc.patient.fullName}
                                                        </div>
                                                        <div className="text-sm text-slate-500 flex items-center gap-2">
                                                            <span>{getProcedureName(proc.type)}</span>
                                                            <span>•</span>
                                                            <span>{proc.durationMinutes} min</span>
                                                        </div>
                                                    </div>

                                                    {/* Status */}
                                                    <div className={`flex items-center gap-1.5 ${status.color}`}>
                                                        <StatusIcon className={`w-4 h-4 ${proc.status === "IN_PROGRESS" ? "animate-spin" : ""
                                                            }`} />
                                                        <span className="text-sm font-medium">
                                                            {status.label}
                                                        </span>
                                                    </div>

                                                    {/* Action */}
                                                    <div className="shrink-0">
                                                        {getActionButton(proc)}
                                                    </div>
                                                </div>

                                                {/* Cancel reason */}
                                                {proc.cancelReason && (
                                                    <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                                                        Cancelled: {proc.cancelReason}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default AgendaView;
