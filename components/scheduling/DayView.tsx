"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { format, isToday, isSameDay } from "date-fns";
import { ProcedureBlock } from "./ProcedureBlock";
import { NowIndicator } from "./NowIndicator";
import { ScheduledProcedure, ScheduleSettingsData } from "@/app/actions/schedule";

interface DayViewProps {
    date: Date;
    procedures: ScheduledProcedure[];
    settings: ScheduleSettingsData;
    onSlotClick: (date: Date, time: string) => void;
    onStartProcedure: (procedureId: string, patient: any) => void;
    onRefresh: () => void;
    onEditSchedule?: (procedure: ScheduledProcedure) => void;
    onViewPatient?: (patient: any) => void;
}

export function DayView({
    date,
    procedures,
    settings,
    onSlotClick,
    onStartProcedure,
    onRefresh,
    onEditSchedule,
    onViewPatient,
}: DayViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Generate time slots
    const timeSlots = useMemo(() => {
        const slots: string[] = [];
        const startMinutes = timeToMinutes(settings.dayStartTime);
        const endMinutes = timeToMinutes(settings.dayEndTime);

        for (let m = startMinutes; m < endMinutes; m += settings.slotDurationMinutes) {
            slots.push(minutesToTime(m));
        }

        return slots;
    }, [settings.dayStartTime, settings.dayEndTime, settings.slotDurationMinutes]);

    // Filter procedures for this day - normalize dates to avoid timezone issues
    const dayProcedures = useMemo(() => {
        const normalizedTargetDate = new Date(date);
        normalizedTargetDate.setHours(0, 0, 0, 0);

        return procedures.filter(proc => {
            if (proc.scheduledDate) {
                const procDate = new Date(proc.scheduledDate);
                procDate.setHours(0, 0, 0, 0);
                return procDate.getTime() === normalizedTargetDate.getTime();
            }
            return false;
        });
    }, [procedures, date]);

    // Scrollto current time on mount if today
    useEffect(() => {
        if (isToday(date) && containerRef.current) {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const startMinutes = timeToMinutes(settings.dayStartTime);
            const pixelsPerMinute = 80 / settings.slotDurationMinutes; // 80px per slot
            const scrollPosition = (currentMinutes - startMinutes) * pixelsPerMinute - 200;

            containerRef.current.scrollTop = Math.max(0, scrollPosition);
        }
    }, [date, settings.dayStartTime, settings.slotDurationMinutes]);

    // Check if a slot is during lunch break
    const isLunchTime = (time: string) => {
        if (!settings.lunchBreakEnabled) return false;
        const minutes = timeToMinutes(time);
        const lunchStart = timeToMinutes(settings.lunchStartTime);
        const lunchEnd = timeToMinutes(settings.lunchEndTime);
        return minutes >= lunchStart && minutes < lunchEnd;
    };

    // Get procedure for a time slot
    const getProcedureAtSlot = (time: string) => {
        const slotMinutes = timeToMinutes(time);
        return dayProcedures.find(proc => {
            if (!proc.scheduledTime) return false;
            const procStart = timeToMinutes(proc.scheduledTime);
            const procEnd = procStart + proc.durationMinutes;
            return slotMinutes >= procStart && slotMinutes < procEnd;
        });
    };

    // Check if this slot is the start of a procedure
    const isProcedureStart = (time: string) => {
        return dayProcedures.some(proc => proc.scheduledTime === time);
    };

    // Calculate block height based on duration
    const getBlockHeight = (durationMinutes: number) => {
        const slotsNeeded = durationMinutes / settings.slotDurationMinutes;
        return slotsNeeded * 80 - 8; // 80px per slot, minus padding
    };

    return (
        <div className="h-full flex flex-col">
            {/* Day Header */}
            {/* Day Header - REMOVED as per user request (redundant with main header) */}
            {/* <div className={`shrink-0 text-center py-3 border-b border-slate-200 ...`}> ... </div> */}

            {/* Time Grid */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto bg-white"
            >
                {/* Added pt-4 to prevent first time label from being clipped */}
                <div className="relative min-h-full pt-4">
                    {/* Now Indicator */}
                    {isToday(date) && (
                        <NowIndicator
                            dayStartTime={settings.dayStartTime}
                            slotDuration={settings.slotDurationMinutes}
                        />
                    )}

                    {/* Time Slots */}
                    {timeSlots.map((time, index) => {
                        const isLunch = isLunchTime(time);
                        const procedure = getProcedureAtSlot(time);
                        const isStart = isProcedureStart(time);

                        return (
                            <div
                                key={time}
                                className={`flex border-b border-slate-100 ${isLunch ? "bg-slate-50" : ""
                                    }`}
                                style={{ height: "80px" }}
                            >
                                {/* Time Label */}
                                <div className="w-20 shrink-0 pr-3 text-right border-r border-slate-200 relative">
                                    <span className="text-xs text-slate-400 absolute -top-2 right-3">
                                        {formatTimeDisplay(time)}
                                    </span>
                                </div>

                                {/* Slot Content */}
                                <div
                                    className={`flex-1 relative ${isLunch
                                        ? "cursor-not-allowed"
                                        : procedure && !isStart
                                            ? ""
                                            : "cursor-pointer hover:bg-blue-50/50"
                                        }`}
                                    onClick={() => {
                                        if (!isLunch && !procedure) {
                                            onSlotClick(date, time);
                                        }
                                    }}
                                >
                                    {/* Lunch Break Label */}
                                    {isLunch && time === settings.lunchStartTime && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-sm text-slate-400 font-medium">
                                                🍽️ Lunch Break
                                            </span>
                                        </div>
                                    )}

                                    {/* Procedure Block */}
                                    {isStart && procedure && (
                                        <div
                                            className="absolute left-2 right-2 top-1 z-10"
                                            style={{ height: getBlockHeight(procedure.durationMinutes) }}
                                        >
                                            <ProcedureBlock
                                                procedure={procedure}
                                                settings={settings}
                                                onStartProcedure={onStartProcedure}
                                                onRefresh={onRefresh}
                                                onEditSchedule={onEditSchedule}
                                                onViewPatient={onViewPatient}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
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
    const [hours, minutes] = time.split(":").map(Number);
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

export default DayView;
