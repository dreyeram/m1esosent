"use client";

import React, { useState, useEffect } from "react";
import { Clock, Coffee, Save, Check, AlertCircle, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    getScheduleSettings,
    updateScheduleSettings,
    ScheduleSettingsData
} from "@/app/actions/schedule";

interface SchedulePanelProps {
    organizationId?: string;
    onUpdate: () => void;
    onUnsavedChange: (hasChanges: boolean) => void;
}

const DAYS = [
    { id: 0, label: 'Sunday', short: 'Sun' },
    { id: 1, label: 'Monday', short: 'Mon' },
    { id: 2, label: 'Tuesday', short: 'Tue' },
    { id: 3, label: 'Wednesday', short: 'Wed' },
    { id: 4, label: 'Thursday', short: 'Thu' },
    { id: 5, label: 'Friday', short: 'Fri' },
    { id: 6, label: 'Saturday', short: 'Sat' },
];

const DEFAULT_SETTINGS: ScheduleSettingsData = {
    dayStartTime: "09:00",
    dayEndTime: "18:00",
    lunchBreakEnabled: true,
    lunchStartTime: "13:00",
    lunchEndTime: "14:00",
    slotDurationMinutes: 30,
    procedureDurations: {},
    enableCheckIn: true,
    showCancelledSlots: true,
    workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
};

export default function SchedulePanel({ organizationId, onUpdate, onUnsavedChange }: SchedulePanelProps) {
    const [settings, setSettings] = useState<ScheduleSettingsData>(DEFAULT_SETTINGS);
    const [originalSettings, setOriginalSettings] = useState<ScheduleSettingsData>(DEFAULT_SETTINGS);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');

    // Load settings on mount
    useEffect(() => {
        if (organizationId) {
            loadSettings();
        } else {
            // Use localStorage fallback if no org
            const saved = localStorage.getItem('scheduleSettings');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setSettings({ ...DEFAULT_SETTINGS, ...parsed });
                    setOriginalSettings({ ...DEFAULT_SETTINGS, ...parsed });
                } catch (e) { }
            }
            setIsLoading(false);
        }
    }, [organizationId]);

    const loadSettings = async () => {
        setIsLoading(true);
        if (organizationId) {
            const result = await getScheduleSettings(organizationId);
            if (result.success && result.settings) {
                setSettings(result.settings);
                setOriginalSettings(result.settings);
            }
        }
        setIsLoading(false);
    };

    const hasChanges = () => {
        return JSON.stringify(settings) !== JSON.stringify(originalSettings);
    };

    useEffect(() => {
        onUnsavedChange(hasChanges());
    }, [settings, originalSettings]);

    const handleDayToggle = (dayId: number) => {
        setSettings(prev => {
            const newDays = prev.workingDays.includes(dayId)
                ? prev.workingDays.filter(d => d !== dayId)
                : [...prev.workingDays, dayId].sort();
            return { ...prev, workingDays: newDays };
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError('');
        setSaveSuccess(false);

        try {
            if (organizationId) {
                const result = await updateScheduleSettings(organizationId, settings);
                if (result.success) {
                    setSaveSuccess(true);
                    setOriginalSettings(settings);
                    onUnsavedChange(false);
                    onUpdate();
                    setTimeout(() => setSaveSuccess(false), 3000);
                } else {
                    setSaveError(result.error || 'Failed to save');
                }
            } else {
                // localStorage fallback
                localStorage.setItem('scheduleSettings', JSON.stringify(settings));
                setSaveSuccess(true);
                setOriginalSettings(settings);
                onUnsavedChange(false);
                setTimeout(() => setSaveSuccess(false), 3000);
            }
        } catch (error) {
            console.error(error);
            setSaveError('Error saving schedule settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl space-y-8">
            {/* Working Hours */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <Clock size={16} className="text-slate-500" />
                    <div>
                        <h4 className="text-sm font-bold text-slate-700">Working Hours</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Set daily start and end times</p>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Day Starts At
                        </label>
                        <input
                            type="time"
                            value={settings.dayStartTime}
                            onChange={e => setSettings(prev => ({ ...prev, dayStartTime: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Day Ends At
                        </label>
                        <input
                            type="time"
                            value={settings.dayEndTime}
                            onChange={e => setSettings(prev => ({ ...prev, dayEndTime: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>
            </div>

            {/* Lunch Break */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Coffee size={16} className="text-amber-500" />
                        <div>
                            <h4 className="text-sm font-bold text-slate-700">Lunch Break</h4>
                            <p className="text-xs text-slate-500 mt-0.5">Block time for breaks</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSettings(prev => ({ ...prev, lunchBreakEnabled: !prev.lunchBreakEnabled }))}
                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.lunchBreakEnabled ? 'bg-amber-500' : 'bg-slate-300'
                            }`}
                    >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.lunchBreakEnabled ? 'left-6' : 'left-0.5'
                            }`} />
                    </button>
                </div>

                {settings.lunchBreakEnabled && (
                    <div className="p-6 grid grid-cols-2 gap-6 bg-amber-50">
                        <div>
                            <label className="block text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
                                Break Starts
                            </label>
                            <input
                                type="time"
                                value={settings.lunchStartTime}
                                onChange={e => setSettings(prev => ({ ...prev, lunchStartTime: e.target.value }))}
                                className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 font-mono font-semibold text-amber-700 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
                                Break Ends
                            </label>
                            <input
                                type="time"
                                value={settings.lunchEndTime}
                                onChange={e => setSettings(prev => ({ ...prev, lunchEndTime: e.target.value }))}
                                className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 font-mono font-semibold text-amber-700 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Appointment Slots */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <Calendar size={16} className="text-slate-500" />
                    <div>
                        <h4 className="text-sm font-bold text-slate-700">Slot Duration</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Default appointment length</p>
                    </div>
                </div>

                <div className="p-6">
                    <select
                        value={settings.slotDurationMinutes}
                        onChange={e => setSettings(prev => ({ ...prev, slotDurationMinutes: Number(e.target.value) }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value={10}>10 minutes</option>
                        <option value={15}>15 minutes</option>
                        <option value={20}>20 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>1 hour</option>
                    </select>
                </div>
            </div>

            {/* Working Days */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h4 className="text-sm font-bold text-slate-700">Working Days</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Select which days the clinic is open</p>
                </div>

                <div className="p-6">
                    <div className="flex flex-wrap gap-2">
                        {DAYS.map(day => {
                            const isActive = settings.workingDays.includes(day.id);
                            return (
                                <button
                                    key={day.id}
                                    onClick={() => handleDayToggle(day.id)}
                                    className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${isActive
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                >
                                    {day.short}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Options */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-bold text-slate-700">Enable Patient Check-In</h4>
                            <p className="text-xs text-slate-500">Allow marking patients as arrived</p>
                        </div>
                        <button
                            onClick={() => setSettings(prev => ({ ...prev, enableCheckIn: !prev.enableCheckIn }))}
                            className={`w-12 h-6 rounded-full transition-colors relative ${settings.enableCheckIn ? 'bg-blue-600' : 'bg-slate-300'
                                }`}
                        >
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.enableCheckIn ? 'left-6' : 'left-0.5'
                                }`} />
                        </button>
                    </div>

                    <div className="px-6 py-4 flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-bold text-slate-700">Show Cancelled Slots</h4>
                            <p className="text-xs text-slate-500">Display cancelled appointments in calendar</p>
                        </div>
                        <button
                            onClick={() => setSettings(prev => ({ ...prev, showCancelledSlots: !prev.showCancelledSlots }))}
                            className={`w-12 h-6 rounded-full transition-colors relative ${settings.showCancelledSlots ? 'bg-blue-600' : 'bg-slate-300'
                                }`}
                        >
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.showCancelledSlots ? 'left-6' : 'left-0.5'
                                }`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
                <div>
                    <AnimatePresence>
                        {saveSuccess && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex items-center gap-2 text-emerald-600"
                            >
                                <Check size={18} />
                                <span className="text-sm font-semibold">Schedule saved!</span>
                            </motion.div>
                        )}
                        {saveError && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex items-center gap-2 text-rose-600"
                            >
                                <AlertCircle size={18} />
                                <span className="text-sm font-semibold">{saveError}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges()}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save size={16} />
                    {isSaving ? 'Saving...' : 'Save Schedule'}
                </button>
            </div>
        </div>
    );
}
