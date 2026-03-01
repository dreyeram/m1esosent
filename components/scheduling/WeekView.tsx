"use client";

import React, { useMemo } from "react";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import { ScheduledProcedure, ScheduleSettingsData } from "@/app/actions/schedule";
import { decodeProcedureType, getProcedureDisplayName } from "@/types/procedureTypes";

interface WeekViewProps {
    currentDate: Date;
    procedures: ScheduledProcedure[];
    settings: ScheduleSettingsData;
    onDateClick: (date: Date) => void;
    onSlotClick: (date: Date, time: string) => void;
    onStartProcedure: (procedureId: string, patient: any) => void;
    onRefresh: () => void;
}

// Status colors (compact for week view)
const STATUS_COLORS: Record<string, string> = {
    SCHEDULED: "bg-blue-500",
    CHECKED_IN: "bg-cyan-500",
    IN_PROGRESS: "bg-amber-500",
    COMPLETED: "bg-green-500",
    CANCELLED: "bg-red-400",
    NO_SHOW: "bg-slate-400"
};

export function WeekView({
    currentDate,
    procedures,
    settings,
    onDateClick,
    onSlotClick,
    onStartProcedure,
    onRefresh,
}: WeekViewProps) {
    // Generate week days
    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, [currentDate]);

    // Generate time slots
    const timeSlots = useMemo(() => {
        const slots: string[] = [];
        const startMinutes = timeToMinutes(settings.dayStartTime);
        const endMinutes = timeToMinutes(settings.dayEndTime);

        // Use 1-hour intervals for week view
        for (let m = startMinutes; m < endMinutes; m += 60) {
            slots.push(minutesToTime(m));
        }

        return slots;
    }, [settings.dayStartTime, settings.dayEndTime]);

    // Group procedures by day - normalize dates to avoid timezone issues
    const proceduresByDay = useMemo(() => {
        const grouped: Record<string, ScheduledProcedure[]> = {};

        weekDays.forEach(day => {
            const key = format(day, "yyyy-MM-dd");
            const normalizedDay = new Date(day);
            normalizedDay.setHours(0, 0, 0, 0);

            grouped[key] = procedures.filter(proc => {
                if (!proc.scheduledDate) return false;
                const procDate = new Date(proc.scheduledDate);
                procDate.setHours(0, 0, 0, 0);
                return procDate.getTime() === normalizedDay.getTime();
            });
        });

        return grouped;
    }, [procedures, weekDays]);

    // Get procedures for a specific day and hour
    const getProceduresForSlot = (day: Date, hour: string) => {
        const key = format(day, "yyyy-MM-dd");
        const dayProcs = proceduresByDay[key] || [];

        const hourStart = timeToMinutes(hour);
        const hourEnd = hourStart + 60;

        return dayProcs.filter(proc => {
            if (!proc.scheduledTime) return false;
            const procStart = timeToMinutes(proc.scheduledTime);
            // Show in slot if procedure starts within this hour
            return procStart >= hourStart && procStart < hourEnd;
        });
    };

    // Check if hour is during lunch
    const isLunchHour = (hour: string) => {
        if (!settings.lunchBreakEnabled) return false;
        const hourMinutes = timeToMinutes(hour);
        const lunchStart = timeToMinutes(settings.lunchStartTime);
        const lunchEnd = timeToMinutes(settings.lunchEndTime);
        return hourMinutes >= lunchStart && hourMinutes < lunchEnd;
    };

    // Get procedure display name
    const getProcedureName = (type: string) => {
        try {
            const decoded = decodeProcedureType(type);
            const name = getProcedureDisplayName(decoded.specialtyId, decoded.categoryId, decoded.subtypeId);
            return name || type;
        } catch {
            return type;
        }
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Day Headers */}
            <div className="flex border-b border-slate-200 shrink-0">
                {/* Time column spacer */}
                <div className="w-16 shrink-0" />

                {/* Day headers */}
                {weekDays.map(day => (
                    <div
                        key={day.toISOString()}
                        className={`flex-1 text-center py-3 border-l border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${isToday(day) ? "bg-blue-50" : ""
                            }`}
                        onClick={() => onDateClick(day)}
                    >
                        <span className={`text-xs font-medium uppercase ${isToday(day) ? "text-blue-600" : "text-slate-500"
                            }`}>
                            {format(day, "EEE")}
                        </span>
                        <div className={`text-lg font-semibold ${isToday(day) ? "text-blue-700" : "text-slate-700"
                            }`}>
                            {format(day, "d")}
                        </div>
                    </div>
                ))}
            </div>

            {/* Time Grid - Added pt-2 to prevent clipping of first row */}
            <div className="flex-1 overflow-y-auto pt-2">
                {timeSlots.map(hour => {
                    const isLunch = isLunchHour(hour);

                    return (
                        <div
                            key={hour}
                            className={`flex border-b border-slate-100 ${isLunch ? "bg-slate-50" : ""}`}
                            style={{ minHeight: "60px" }}
                        >
                            {/* Time Label */}
                            <div className="w-16 shrink-0 pr-2 text-right relative">
                                <span className="text-xs text-slate-400 absolute -top-2 right-2">
                                    {formatTimeDisplay(hour)}
                                </span>
                            </div>

                            {/* Day Columns */}
                            {weekDays.map(day => {
                                const slotProcs = getProceduresForSlot(day, hour);

                                return (
                                    <div
                                        key={day.toISOString()}
                                        className={`flex-1 border-l border-slate-100 p-0.5 ${isLunch ? "" : "cursor-pointer hover:bg-blue-50/30"
                                            }`}
                                        onClick={() => {
                                            if (!isLunch && slotProcs.length === 0) {
                                                onSlotClick(day, hour);
                                            }
                                        }}
                                    >
                                        {slotProcs.map(proc => (
                                            <div
                                                key={proc.id}
                                                className={`text-xs p-1.5 rounded mb-0.5 cursor-pointer hover:opacity-90 ${STATUS_COLORS[proc.status]} text-white shadow-sm`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (proc.status !== "CANCELLED" && proc.status !== "NO_SHOW") {
                                                        onStartProcedure(proc.id, proc.patient);
                                                    }
                                                }}
                                                title={`${proc.patient.fullName} - ${getProcedureName(proc.type)}`}
                                            >
                                                <div className="font-semibold truncate text-[11px]">
                                                    {proc.patient.fullName.split(" ")[0]}
                                                </div>
                                                <div className="truncate opacity-90 text-[10px]">
                                                    {getProcedureName(proc.type)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Helper functions
function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

function formatTimeDisplay(time: string): string {
    const [hours] = time.split(":").map(Number);
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours} ${ampm}`;
}

export default WeekView;
