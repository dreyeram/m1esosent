"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Plus,
    CalendarDays,
    List,
    Loader2
} from "lucide-react";

import { format, addDays, subDays, isToday, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { getDaySchedule, getScheduleForDateRange, getScheduleSettings, ScheduledProcedure, ScheduleSettingsData } from "@/app/actions/schedule";
import { DayView } from "../scheduling/DayView";
import { WeekView } from "../scheduling/WeekView";
import { AgendaView } from "../scheduling/AgendaView";
import { QuickRegisterSheet } from "../scheduling/QuickRegisterSheet";
import { EditScheduleModal } from "../scheduling/EditScheduleModal";

interface SchedulePanelProps {
    doctorId: string;
    organizationId: string;
    onStartProcedure: (procedureId: string, patient: any, procedureType?: string) => void;
    onViewPatient: (patient: any) => void;
    onNewPatient: () => void;
}

type ViewMode = 'day' | 'week' | 'agenda';

const DEFAULT_SETTINGS: ScheduleSettingsData = {
    dayStartTime: "08:00",
    dayEndTime: "18:00",
    lunchBreakEnabled: true,
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
    slotDurationMinutes: 15,
    procedureDurations: {
        egd: 30,
        colonoscopy: 45,
        ercp: 60,
        sigmoidoscopy: 30,
        nasal_endoscopy: 15,
        laryngoscopy: 20,
        otoendoscopy: 20,
        bronchoscopy: 30,
    },
    enableCheckIn: true,
    showCancelledSlots: true,
    workingDays: [1, 2, 3, 4, 5, 6],
};

export default function SchedulePanel({
    doctorId,
    organizationId,
    onStartProcedure,
    onViewPatient,
    onNewPatient
}: SchedulePanelProps) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('day');
    const [procedures, setProcedures] = useState<ScheduledProcedure[]>([]);
    const [settings, setSettings] = useState<ScheduleSettingsData>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [showRegisterSheet, setShowRegisterSheet] = useState(false);
    const [editingProcedure, setEditingProcedure] = useState<ScheduledProcedure | null>(null);

    // Load settings
    useEffect(() => {
        async function loadSettings() {
            const result = await getScheduleSettings(organizationId);
            if (result.success && result.settings) {
                setSettings(result.settings);
            }
        }
        loadSettings();
    }, [organizationId]);

    const loadSchedule = useCallback(async () => {
        setIsLoading(true);
        try {
            let result;
            if (viewMode === "day") {
                result = await getDaySchedule(selectedDate, doctorId, settings.showCancelledSlots);
            } else if (viewMode === "week") {
                const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
                const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
                result = await getScheduleForDateRange(weekStart, weekEnd, doctorId, settings.showCancelledSlots);
            } else {
                const end = addDays(selectedDate, 7);
                result = await getScheduleForDateRange(selectedDate, end, doctorId, settings.showCancelledSlots);
            }

            if (result && result.success && result.procedures) {
                setProcedures(result.procedures);
            }
        } catch (error) {
            console.error("Failed to load schedule:", error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate, doctorId, viewMode, settings.showCancelledSlots]);

    useEffect(() => {
        loadSchedule();
    }, [loadSchedule]);

    const goToToday = () => setSelectedDate(new Date());
    const goToPrevious = () => {
        if (viewMode === 'day') setSelectedDate(prev => subDays(prev, 1));
        else if (viewMode === 'week') setSelectedDate(prev => subWeeks(prev, 1));
        else setSelectedDate(prev => subDays(prev, 7));
    };
    const goToNext = () => {
        if (viewMode === 'day') setSelectedDate(prev => addDays(prev, 1));
        else if (viewMode === 'week') setSelectedDate(prev => addWeeks(prev, 1));
        else setSelectedDate(prev => addDays(prev, 7));
    };

    const getDateTitle = () => {
        if (viewMode === "day") {
            return format(selectedDate, "MMMM d, yyyy");
        } else if (viewMode === "week") {
            const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
            const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
            if (format(weekStart, "MMM") === format(weekEnd, "MMM")) {
                return `${format(weekStart, "MMMM d")} – ${format(weekEnd, "d, yyyy")}`;
            }
            return `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;
        } else {
            return format(selectedDate, "MMMM yyyy");
        }
    };

    return (
        <div className="h-full flex flex-col bg-transparent">
            {/* Transparent Glass Header */}
            <div className="px-6 py-6 glass-surface rounded-3xl mb-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1 glass-surface rounded-2xl p-1 bg-white/20">
                        <button
                            onClick={goToPrevious}
                            className="p-2.5 rounded-xl hover:bg-white/40 transition-all text-slate-700 active:scale-95"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={goToToday}
                            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isToday(selectedDate)
                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20'
                                : 'hover:bg-white/40 text-slate-600'
                                }`}
                        >
                            Today
                        </button>
                        <button
                            onClick={goToNext}
                            className="p-2.5 rounded-xl hover:bg-white/40 transition-all text-slate-700 active:scale-95"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">
                            {getDateTitle()}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                {procedures.length} Active Procedures
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Toggle */}
                    <div className="flex glass-surface rounded-2xl p-1 bg-white/10">
                        {[
                            { id: 'day', icon: CalendarDays, label: 'Day' },
                            { id: 'week', icon: Calendar, label: 'Week' },
                            { id: 'agenda', icon: List, label: 'Agenda' }
                        ].map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setViewMode(mode.id as any)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${viewMode === mode.id ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-500/60 hover:text-slate-900'}`}
                            >
                                <mode.icon size={14} strokeWidth={mode.id === 'day' ? 3 : 2} />
                                {mode.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowRegisterSheet(true)}
                        className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-2xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all group"
                    >
                        <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
                            <Plus size={14} strokeWidth={3} />
                        </div>
                        New Schedule
                    </button>
                </div>
            </div>

            {/* Content Stage */}
            <div className="flex-1 glass-surface rounded-3xl overflow-hidden relative border-none">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center z-50"
                        >
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" strokeWidth={3} />
                            <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
                                Indexing...
                            </p>
                        </motion.div>
                    ) : null}

                    <div className="h-full view-enter">
                        {viewMode === "day" && (
                            <DayView
                                date={selectedDate}
                                procedures={procedures}
                                settings={settings}
                                onSlotClick={(date, time) => {
                                    setSelectedDate(date);
                                    setShowRegisterSheet(true);
                                }}
                                onStartProcedure={onStartProcedure}
                                onRefresh={loadSchedule}
                                onEditSchedule={(proc) => setEditingProcedure(proc)}
                                onViewPatient={onViewPatient}
                            />
                        )}

                        {viewMode === "week" && (
                            <WeekView
                                currentDate={selectedDate}
                                procedures={procedures}
                                settings={settings}
                                onDateClick={(date) => {
                                    setSelectedDate(date);
                                    setViewMode("day");
                                }}
                                onSlotClick={(date, time) => {
                                    setSelectedDate(date);
                                    setShowRegisterSheet(true);
                                }}
                                onStartProcedure={onStartProcedure}
                                onRefresh={loadSchedule}
                            />
                        )}

                        {viewMode === "agenda" && (
                            <AgendaView
                                startDate={selectedDate}
                                procedures={procedures}
                                settings={settings}
                                onStartProcedure={onStartProcedure}
                                onRefresh={loadSchedule}
                            />
                        )}
                    </div>
                </AnimatePresence>
            </div>

            {/* Context Sheet Integration */}
            <QuickRegisterSheet
                isOpen={showRegisterSheet}
                onClose={() => setShowRegisterSheet(false)}
                doctorId={doctorId}
                initialDate={selectedDate}
                onSuccess={(patient) => {
                    setShowRegisterSheet(false);
                    onStartProcedure(undefined as any, patient);
                    loadSchedule();
                }}
            />

            {editingProcedure && (
                <EditScheduleModal
                    isOpen={!!editingProcedure}
                    onClose={() => setEditingProcedure(null)}
                    procedure={editingProcedure}
                    settings={settings}
                    doctorId={doctorId}
                    onSuccess={() => {
                        setEditingProcedure(null);
                        loadSchedule();
                    }}
                />
            )}
        </div>
    );
}
