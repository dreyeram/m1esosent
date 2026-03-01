"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    format,
    addDays,
    subDays,
    startOfWeek,
    endOfWeek,
    addWeeks,
    subWeeks,
    isToday,
    isSameDay,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    addMonths,
    subMonths
} from "date-fns";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Settings,
    Search,
    UserPlus,
    Bell,
    ChevronDown,
    LogOut,
    User,
    Building2,
    Calendar,
    Layout
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DayView } from "./DayView";
import { WeekView } from "./WeekView";
import { AgendaView } from "./AgendaView";
import { PatientList } from "./PatientList";
import { PatientRegistrationModal } from "@/components/dashboard/PatientRegistrationModal";
import { ScheduleModal } from "./ScheduleModal";
import { EditScheduleModal } from "./EditScheduleModal";
import {
    getDaySchedule,
    getScheduleForDateRange,
    getScheduleSettings,
    ScheduledProcedure,
    ScheduleSettingsData
} from "@/app/actions/schedule";

export type ViewMode = "day" | "week" | "agenda" | "patients"; // Removed 'register' - now modal-based

interface ScheduleViewProps {
    doctorId: string;
    organizationId: string;
    // Shell props
    userName?: string;
    userRole?: string;
    orgName?: string;
    orgLogo?: string;
    onStartProcedure: (procedureId: string, patient: any) => void;
    onNavigateToSettings?: () => void;
    onRegisterPatient?: () => void; // This might become deprecated/secondary
    onLogout?: () => void;
    onViewChange?: (view: string) => void;
    onViewPatient?: (patient: any) => void;
}

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
    },
    enableCheckIn: true,
    showCancelledSlots: true,
    workingDays: [1, 2, 3, 4, 5, 6],
};

export function ScheduleView({
    doctorId,
    organizationId,
    userName = "Dr. User",
    userRole = "DOCTOR",
    orgName = "Medical Clinic",
    orgLogo,
    onStartProcedure,
    onNavigateToSettings,
    onRegisterPatient,
    onLogout,
    onViewChange,
    onViewPatient
}: ScheduleViewProps) {
    // Persist viewMode across refreshes
    const getInitialViewMode = (): ViewMode => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('scheduleViewMode') as ViewMode;
            if (saved && ['day', 'week', 'agenda', 'patients'].includes(saved)) {
                return saved;
            }
        }
        return 'day';
    };

    const [showRegistrationModal, setShowRegistrationModal] = useState(false); // New modal state
    const [viewMode, setViewModeState] = useState<ViewMode>(() => getInitialViewMode());
    const [currentDate, setCurrentDate] = useState(new Date());
    const [procedures, setProcedures] = useState<ScheduledProcedure[]>([]);
    const [settings, setSettings] = useState<ScheduleSettingsData>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null);
    const [miniCalendarMonth, setMiniCalendarMonth] = useState(new Date());
    const [globalSearchQuery, setGlobalSearchQuery] = useState("");
    const [editingProcedure, setEditingProcedure] = useState<ScheduledProcedure | null>(null);

    // Wrapper to persist viewMode to localStorage
    const setViewMode = (mode: ViewMode) => {
        setViewModeState(mode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('scheduleViewMode', mode);
        }
    };

    // Dropdown states
    const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

    // Refs for clicking outside
    const createDropdownRef = useRef<HTMLDivElement>(null);
    const profileDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdowns on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (createDropdownRef.current && !createDropdownRef.current.contains(event.target as Node)) {
                setCreateDropdownOpen(false);
            }
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
                setProfileDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    // Load procedures based on view mode and date
    const loadProcedures = useCallback(async () => {
        if (viewMode === "patients") return;

        setIsLoading(true);
        try {
            let result;
            if (viewMode === "day") {
                result = await getDaySchedule(currentDate, doctorId, settings.showCancelledSlots);
            } else if (viewMode === "week") {
                const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
                const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
                result = await getScheduleForDateRange(weekStart, weekEnd, doctorId, settings.showCancelledSlots);
            } else {
                // Agenda: next 7 days
                const end = addDays(currentDate, 7);
                result = await getScheduleForDateRange(currentDate, end, doctorId, settings.showCancelledSlots);
            }

            if (result && result.success && result.procedures) {
                setProcedures(result.procedures);
            }
        } catch (error) {
            console.error("Error loading procedures:", error);
        } finally {
            setIsLoading(false);
        }
    }, [viewMode, currentDate, doctorId, settings.showCancelledSlots]);

    useEffect(() => {
        loadProcedures();
    }, [loadProcedures]);

    // Navigation handlers
    const goToToday = () => {
        setCurrentDate(new Date());
        setMiniCalendarMonth(new Date());
    };

    const goToPrevious = () => {
        if (viewMode === "day") {
            setCurrentDate(prev => subDays(prev, 1));
        } else if (viewMode === "week") {
            setCurrentDate(prev => subWeeks(prev, 1));
        } else {
            setCurrentDate(prev => subDays(prev, 7));
        }
    };

    const goToNext = () => {
        if (viewMode === "day") {
            setCurrentDate(prev => addDays(prev, 1));
        } else if (viewMode === "week") {
            setCurrentDate(prev => addWeeks(prev, 1));
        } else {
            setCurrentDate(prev => addDays(prev, 7));
        }
    };

    // Handle empty slot click
    const handleSlotClick = (date: Date, time: string) => {
        setSelectedSlot({ date, time });
        setShowScheduleModal(true);
    };

    // Handle date selection from mini calendar
    const handleMiniCalendarDateSelect = (date: Date) => {
        setCurrentDate(date);
        if (viewMode !== "day") {
            setViewMode("day");
        }
    };

    // Get display title
    const getDateTitle = () => {
        if (viewMode === "patients") return "Patient List";
        if (viewMode === "day") {
            return format(currentDate, "MMMM d, yyyy");
        } else if (viewMode === "week") {
            const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
            const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
            if (format(weekStart, "MMM") === format(weekEnd, "MMM")) {
                return `${format(weekStart, "MMMM d")} – ${format(weekEnd, "d, yyyy")}`;
            }
            return `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;
        } else {
            return format(currentDate, "MMMM yyyy");
        }
    };

    // Mini Calendar Component
    const MiniCalendar = () => {
        const monthStart = startOfMonth(miniCalendarMonth);
        const monthEnd = endOfMonth(miniCalendarMonth);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
        const days = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <div className="p-3">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4 px-2">
                    <span className="text-sm font-semibold text-slate-700">
                        {format(miniCalendarMonth, "MMMM yyyy")}
                    </span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setMiniCalendarMonth(prev => subMonths(prev, 1))}
                            className="p-1 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 text-slate-500" />
                        </button>
                        <button
                            onClick={() => setMiniCalendarMonth(prev => addMonths(prev, 1))}
                            className="p-1 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 mb-2">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                        <div key={i} className="text-center text-[10px] font-bold text-slate-400">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-y-1 gap-x-0.5">
                    {days.map((day) => {
                        const isSelected = isSameDay(day, currentDate);
                        const isCurrentMonth = isSameMonth(day, miniCalendarMonth);
                        const isTodayDate = isToday(day);

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => handleMiniCalendarDateSelect(day)}
                                className={`
                                    w-7 h-7 rounded-full text-xs font-medium flex items-center justify-center mx-auto
                                    transition-all
                                    ${isSelected
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : isTodayDate
                                            ? "bg-blue-100 text-blue-700"
                                            : isCurrentMonth
                                                ? "text-slate-700 hover:bg-slate-100"
                                                : "text-slate-300"
                                    }
                                `}
                            >
                                {format(day, "d")}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="w-screen h-screen flex flex-col bg-white overflow-hidden">
            {/* GOOGLE CALENDAR STYLE HEADER */}
            <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-slate-200 bg-white z-20 shadow-sm relative">

                {/* LEFT: Branding + Navigation Controls */}
                <div className="flex items-center gap-2 lg:gap-3">
                    {/* Logo - Large, matching Today button height */}
                    <div className="flex items-center mr-2 shrink-0">
                        {orgLogo ? (() => {
                            const resolved = orgLogo.startsWith('data:') || orgLogo.startsWith('http')
                                ? orgLogo
                                : `/api/capture-serve?path=${encodeURIComponent(orgLogo.startsWith('/') ? orgLogo.substring(1) : orgLogo)}`;
                            return (
                                <img src={resolved} className="h-8 w-auto max-w-[110px] object-contain" alt="Logo" />
                            );
                        })() : (
                            <div className="h-9 px-3 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm gap-2">
                                <Building2 className="w-5 h-5" />
                                <span className="font-semibold text-sm">{orgName || 'Clinic'}</span>
                            </div>
                        )}
                    </div>

                    {/* Today */}
                    <button
                        onClick={goToToday}
                        className="px-5 py-2 border border-slate-200 rounded text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors mr-2 ml-2"
                    >
                        Today
                    </button>

                    {/* Nav Arrows */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={goToPrevious}
                            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600"
                            disabled={viewMode === "patients"}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600"
                            disabled={viewMode === "patients"}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Date Title */}
                    <h2 className="text-xl font-normal text-slate-700 ml-4">
                        {getDateTitle()}
                    </h2>
                </div>

                {/* RIGHT: Global Controls + Profile */}
                <div className="flex items-center gap-2 lg:gap-3">
                    {/* Search - Working (Visual) */}
                    <div className="relative hidden sm:block">
                        <div className="flex items-center px-3 py-2 bg-slate-100 rounded-lg w-64 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                            <Search className="w-4 h-4 text-slate-500 mr-2" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={globalSearchQuery}
                                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setViewMode('patients');
                                    }
                                }}
                                className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Settings */}
                    <button
                        onClick={onNavigateToSettings}
                        className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 transition-colors hidden sm:block"
                    >
                        <Settings className="w-5 h-5" />
                    </button>

                    {/* Horizontal Tab Navigation */}
                    <nav className="flex items-center border border-slate-200 rounded-lg overflow-hidden mr-4">
                        <button
                            onClick={() => setViewMode('day')}
                            className={`px-4 py-1.5 text-sm font-medium transition-colors ${viewMode === 'day' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            Day
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-4 py-1.5 text-sm font-medium border-l border-slate-200 transition-colors ${viewMode === 'week' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setViewMode('agenda')}
                            className={`px-4 py-1.5 text-sm font-medium border-l border-slate-200 transition-colors ${viewMode === 'agenda' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            Agenda
                        </button>
                        <button
                            onClick={() => setViewMode('patients')}
                            className={`px-4 py-1.5 text-sm font-medium border-l border-slate-200 transition-colors ${viewMode === 'patients' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            Patients
                        </button>
                    </nav>


                    {/* Profile Dropdown */}
                    <div className="relative" ref={profileDropdownRef}>
                        <button
                            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                            className="flex items-center gap-2 p-1 pl-2 hover:bg-slate-100 rounded-full transition-colors ml-1"
                        >
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                                {userName.charAt(0)}
                            </div>
                        </button>

                        <AnimatePresence>
                            {profileDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden z-50 py-2"
                                >
                                    <div className="px-4 py-3 border-b border-slate-50">
                                        <p className="text-sm font-semibold text-slate-900">{userName}</p>
                                        <p className="text-xs text-slate-500">{userRole} • {orgName}</p>
                                    </div>
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                onViewChange?.('profile');
                                                setProfileDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            <User className="w-4 h-4" /> My Profile
                                        </button>
                                        {onNavigateToSettings && (
                                            <button
                                                onClick={() => {
                                                    onNavigateToSettings?.();
                                                    setProfileDropdownOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                            >
                                                <Settings className="w-4 h-4" /> Schedule Settings
                                            </button>
                                        )}
                                        <button
                                            onClick={onLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <LogOut className="w-4 h-4" /> Sign Out
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* MAIN WORKSPACE */}
            <div className="flex-1 flex overflow-hidden">

                {/* LEFT SIDEBAR - Fixed width, no collapse */}
                <aside
                    className="w-64 shrink-0 flex flex-col border-r border-slate-200 bg-white"
                >
                    {/* Register Patient Button - Simple single action */}
                    <div className="p-3 pl-4 pt-6">
                        <button
                            onClick={() => setShowRegistrationModal(true)}
                            className="flex items-center gap-3 pl-3 pr-5 py-3 bg-white border border-slate-200 rounded-full shadow hover:shadow-md transition-all group w-full"
                        >
                            {/* Blue Plus Icon */}
                            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                                <UserPlus className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="text-base font-medium text-slate-600 group-hover:text-slate-800">Register Patient</span>
                        </button>
                    </div>

                    {/* Mini Calendar */}
                    <div className="mt-2 pl-2 pr-4">
                        <MiniCalendar />
                    </div>

                    {/* New Functionality: Patient List in Sidebar */}
                    <div className="px-4 mt-4">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Navigation</h3>
                        <button
                            onClick={() => setViewMode('patients')}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${viewMode === 'patients'
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-600 hover:bg-slate-100"
                                }`}
                        >
                            <Layout className="w-5 h-5" />
                            <span>Patient List</span>
                        </button>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />
                </aside>

                {/* MAIN CONTENT AREA */}
                <main className="flex-1 overflow-hidden bg-white relative">
                    <AnimatePresence mode="wait">


                        {viewMode === "day" && (
                            <motion.div
                                key="day"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full"
                            >
                                <DayView
                                    date={currentDate}
                                    procedures={procedures}
                                    settings={settings}
                                    onSlotClick={handleSlotClick}
                                    onStartProcedure={onStartProcedure}
                                    onRefresh={loadProcedures}
                                    onEditSchedule={(proc) => setEditingProcedure(proc)}
                                    onViewPatient={(patient) => onViewPatient?.(patient)}
                                />
                            </motion.div>
                        )}

                        {viewMode === "week" && (
                            <motion.div
                                key="week"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full"
                            >
                                <WeekView
                                    currentDate={currentDate}
                                    procedures={procedures}
                                    settings={settings}
                                    onDateClick={(date) => {
                                        setCurrentDate(date);
                                        setViewMode("day");
                                    }}
                                    onSlotClick={handleSlotClick}
                                    onStartProcedure={onStartProcedure}
                                    onRefresh={loadProcedures}
                                />
                            </motion.div>
                        )}

                        {viewMode === "agenda" && (
                            <motion.div
                                key="agenda"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full"
                            >
                                <AgendaView
                                    startDate={currentDate}
                                    procedures={procedures}
                                    settings={settings}
                                    onStartProcedure={onStartProcedure}
                                    onRefresh={loadProcedures}
                                />
                            </motion.div>
                        )}

                        {viewMode === "patients" && (
                            <motion.div
                                key="patients"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full"
                            >
                                <PatientList
                                    initialQuery={globalSearchQuery}
                                    onViewPatient={(patient) => onViewPatient?.(patient)}
                                    // Navigate to procedure scheduling with this patient pre-selected
                                    onScheduleProcedure={(patient) => {
                                        // TODO: Implement logic to open modal with patient
                                        // For now we just open the modal.
                                        // ideally pass patient info to ScheduleModal
                                        setShowScheduleModal(true);
                                    }}
                                    onRegisterPatient={onRegisterPatient}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* Schedule Modal */}
            {showScheduleModal && (
                <ScheduleModal
                    isOpen={showScheduleModal}
                    onClose={() => {
                        setShowScheduleModal(false);
                        setSelectedSlot(null);
                    }}
                    doctorId={doctorId}
                    settings={settings}
                    initialDate={selectedSlot?.date || currentDate}
                    initialTime={selectedSlot?.time}
                    onSuccess={() => {
                        setShowScheduleModal(false);
                        setSelectedSlot(null);
                        loadProcedures();
                    }}
                />
            )}

            {/* Edit Schedule Modal */}
            {editingProcedure && (
                <EditScheduleModal
                    isOpen={!!editingProcedure}
                    onClose={() => setEditingProcedure(null)}
                    procedure={editingProcedure}
                    settings={settings}
                    doctorId={doctorId}
                    onSuccess={() => {
                        setEditingProcedure(null);
                        loadProcedures();
                    }}
                />
            )}

            {/* Patient Registration Modal */}
            <PatientRegistrationModal
                isOpen={showRegistrationModal}
                onClose={() => setShowRegistrationModal(false)}
                onSuccess={() => {
                    setShowRegistrationModal(false);
                    loadProcedures();
                }}
            />
        </div>
    );
}

export default ScheduleView;
