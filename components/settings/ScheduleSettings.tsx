"use client";

import React, { useState, useEffect } from "react";
import {
    Clock,
    Calendar,
    Settings,
    Save,
    RotateCcw,
    Coffee,
    Timer,
    CheckSquare,
    Eye,
    EyeOff
} from "lucide-react";
import {
    getScheduleSettings,
    updateScheduleSettings,
    ScheduleSettingsData
} from "@/app/actions/schedule";

interface ScheduleSettingsProps {
    organizationId: string;
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
        nasal_endoscopy: 15,
        laryngoscopy: 20,
        otoendoscopy: 20,
        bronchoscopy: 30,
    },
    enableCheckIn: true,
    showCancelledSlots: true,
    workingDays: [1, 2, 3, 4, 5, 6],
};

const WEEKDAYS = [
    { value: 0, label: "Sun" },
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
];

const PROCEDURE_LABELS: Record<string, string> = {
    egd: "EGD (Upper GI)",
    colonoscopy: "Colonoscopy",
    ercp: "ERCP",
    sigmoidoscopy: "Sigmoidoscopy",
    nasal_endoscopy: "Nasal Endoscopy",
    laryngoscopy: "Laryngoscopy",
    otoendoscopy: "Otoendoscopy",
    bronchoscopy: "Bronchoscopy",
};

export function ScheduleSettings({ organizationId }: ScheduleSettingsProps) {
    const [settings, setSettings] = useState<ScheduleSettingsData>(DEFAULT_SETTINGS);
    const [originalSettings, setOriginalSettings] = useState<ScheduleSettingsData>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Load settings
    useEffect(() => {
        async function loadSettings() {
            const result = await getScheduleSettings(organizationId);
            if (result.success && result.settings) {
                setSettings(result.settings);
                setOriginalSettings(result.settings);
            }
            setIsLoading(false);
        }
        loadSettings();
    }, [organizationId]);

    // Track changes
    useEffect(() => {
        setHasChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings));
    }, [settings, originalSettings]);

    // Update helper
    const updateSetting = <K extends keyof ScheduleSettingsData>(
        key: K,
        value: ScheduleSettingsData[K]
    ) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    // Update procedure duration
    const updateProcedureDuration = (procedureKey: string, duration: number) => {
        setSettings(prev => ({
            ...prev,
            procedureDurations: {
                ...prev.procedureDurations,
                [procedureKey]: duration,
            },
        }));
    };

    // Toggle working day
    const toggleWorkingDay = (day: number) => {
        setSettings(prev => {
            const days = new Set(prev.workingDays);
            if (days.has(day)) {
                days.delete(day);
            } else {
                days.add(day);
            }
            return { ...prev, workingDays: Array.from(days).sort() };
        });
    };

    // Save
    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);

        const result = await updateScheduleSettings(organizationId, settings);

        if (result.success) {
            setOriginalSettings(settings);
            setMessage({ type: "success", text: "Settings saved successfully!" });
        } else {
            setMessage({ type: "error", text: result.error || "Failed to save settings" });
        }

        setIsSaving(false);
        setTimeout(() => setMessage(null), 3000);
    };

    // Reset
    const handleReset = () => {
        setSettings(originalSettings);
    };

    if (isLoading) {
        return (
            <div className="p-6 text-center text-slate-500">
                Loading settings...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800">Schedule Settings</h3>
                        <p className="text-sm text-slate-500">Configure calendar and scheduling options</p>
                    </div>
                </div>

                {hasChanges && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                )}
            </div>

            {/* Message */}
            {message && (
                <div className={`p-3 rounded-lg text-sm ${message.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Working Hours */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-slate-600" />
                    <h4 className="font-medium text-slate-800">Working Hours</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Day Starts At</label>
                        <input
                            type="time"
                            value={settings.dayStartTime}
                            onChange={(e) => updateSetting("dayStartTime", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Day Ends At</label>
                        <input
                            type="time"
                            value={settings.dayEndTime}
                            onChange={(e) => updateSetting("dayEndTime", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Working Days */}
                <div className="mt-4">
                    <label className="block text-sm text-slate-600 mb-2">Working Days</label>
                    <div className="flex gap-2">
                        {WEEKDAYS.map(day => (
                            <button
                                key={day.value}
                                onClick={() => toggleWorkingDay(day.value)}
                                className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${settings.workingDays.includes(day.value)
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    }`}
                            >
                                {day.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lunch Break */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Coffee className="w-5 h-5 text-slate-600" />
                        <h4 className="font-medium text-slate-800">Lunch Break</h4>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.lunchBreakEnabled}
                            onChange={(e) => updateSetting("lunchBreakEnabled", e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-slate-600">Enable</span>
                    </label>
                </div>

                {settings.lunchBreakEnabled && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">Starts At</label>
                            <input
                                type="time"
                                value={settings.lunchStartTime}
                                onChange={(e) => updateSetting("lunchStartTime", e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">Ends At</label>
                            <input
                                type="time"
                                value={settings.lunchEndTime}
                                onChange={(e) => updateSetting("lunchEndTime", e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Time Slots */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Timer className="w-5 h-5 text-slate-600" />
                    <h4 className="font-medium text-slate-800">Time Slot Duration</h4>
                </div>

                <div className="flex gap-2">
                    {[15, 30].map(mins => (
                        <button
                            key={mins}
                            onClick={() => updateSetting("slotDurationMinutes", mins)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${settings.slotDurationMinutes === mins
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            {mins} minutes
                        </button>
                    ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    This determines the granularity of available time slots
                </p>
            </div>

            {/* Procedure Durations */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Settings className="w-5 h-5 text-slate-600" />
                    <h4 className="font-medium text-slate-800">Default Procedure Durations</h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(settings.procedureDurations).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                            <span className="text-sm text-slate-700">
                                {PROCEDURE_LABELS[key] || key}
                            </span>
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    value={value}
                                    onChange={(e) => updateProcedureDuration(key, Number(e.target.value))}
                                    min={5}
                                    max={180}
                                    step={5}
                                    className="w-16 px-2 py-1 text-sm border border-slate-200 rounded text-center"
                                />
                                <span className="text-xs text-slate-500">min</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Workflow Options */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <CheckSquare className="w-5 h-5 text-slate-600" />
                    <h4 className="font-medium text-slate-800">Workflow Options</h4>
                </div>

                <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
                        <div>
                            <div className="font-medium text-slate-700">Enable Check-In Step</div>
                            <div className="text-xs text-slate-500">
                                Patients must be checked in before starting procedure
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.enableCheckIn}
                            onChange={(e) => updateSetting("enableCheckIn", e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
                        <div className="flex items-center gap-2">
                            {settings.showCancelledSlots ? (
                                <Eye className="w-4 h-4 text-slate-500" />
                            ) : (
                                <EyeOff className="w-4 h-4 text-slate-500" />
                            )}
                            <div>
                                <div className="font-medium text-slate-700">Show Cancelled Procedures</div>
                                <div className="text-xs text-slate-500">
                                    Display cancelled/no-show slots on calendar
                                </div>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.showCancelledSlots}
                            onChange={(e) => updateSetting("showCancelledSlots", e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded"
                        />
                    </label>
                </div>
            </div>
        </div>
    );
}

export default ScheduleSettings;
