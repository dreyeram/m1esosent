"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { X, Calendar, Clock, Save, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import {
    updateProcedureSchedule,
    getAvailableSlots,
    ScheduleSettingsData,
    ScheduledProcedure
} from "@/app/actions/schedule";

interface EditScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    procedure: ScheduledProcedure;
    settings: ScheduleSettingsData;
    doctorId: string;
    onSuccess: () => void;
}

export function EditScheduleModal({
    isOpen,
    onClose,
    procedure,
    settings,
    doctorId,
    onSuccess,
}: EditScheduleModalProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(
        procedure.scheduledDate ? new Date(procedure.scheduledDate) : new Date()
    );
    const [selectedTime, setSelectedTime] = useState<string>(
        procedure.scheduledTime || ""
    );
    const [duration, setDuration] = useState<number>(
        procedure.durationMinutes || 30
    );
    const [notes, setNotes] = useState<string>(
        procedure.schedulingNotes || ""
    );
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load available slots when date changes
    useEffect(() => {
        const loadSlots = async () => {
            if (!selectedDate) return;

            setLoadingSlots(true);
            try {
                const result = await getAvailableSlots(
                    selectedDate,
                    duration,
                    doctorId,
                    settings
                );
                if (result.success && result.slots) {
                    // Include current time as available (since we're editing)
                    const slots = result.slots;
                    if (procedure.scheduledTime && !slots.includes(procedure.scheduledTime)) {
                        slots.push(procedure.scheduledTime);
                        slots.sort();
                    }
                    setAvailableSlots(slots);
                }
            } catch (err) {
                console.error("Error loading slots:", err);
            } finally {
                setLoadingSlots(false);
            }
        };

        loadSlots();
    }, [selectedDate, duration, doctorId, settings, procedure.scheduledTime]);

    const formatTimeDisplay = (time: string) => {
        const [hours, minutes] = time.split(":").map(Number);
        const ampm = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    };

    const handleSubmit = async () => {
        if (!selectedTime) {
            setError("Please select a time slot");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const result = await updateProcedureSchedule(procedure.id, {
                scheduledDate: selectedDate,
                scheduledTime: selectedTime,
                durationMinutes: duration,
                schedulingNotes: notes,
            });

            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setError(result.error || "Failed to update schedule");
            }
        } catch (err) {
            setError("An error occurred while updating");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800">
                        Edit Schedule
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-4">
                    {/* Patient Info */}
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-500">Patient</div>
                        <div className="font-medium text-slate-800">
                            {procedure.patient.fullName}
                        </div>
                        <div className="text-xs text-slate-400">
                            MRN: {procedure.patient.mrn}
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                            <Calendar className="w-4 h-4" />
                            Date
                        </label>
                        <input
                            type="date"
                            value={format(selectedDate, "yyyy-MM-dd")}
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                            <Clock className="w-4 h-4" />
                            Duration
                        </label>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={45}>45 minutes</option>
                            <option value={60}>60 minutes</option>
                            <option value={90}>90 minutes</option>
                        </select>
                    </div>

                    {/* Available Times */}
                    <div>
                        <label className="text-sm font-medium text-slate-600 mb-2 block">
                            Available Times
                        </label>
                        {loadingSlots ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                            </div>
                        ) : availableSlots.length === 0 ? (
                            <div className="text-sm text-slate-400 text-center py-4">
                                No available slots for this date
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                {availableSlots.map((slot) => (
                                    <button
                                        key={slot}
                                        onClick={() => setSelectedTime(slot)}
                                        className={`px-2 py-2 text-xs rounded-lg border transition-colors ${selectedTime === slot
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                                            } ${slot === procedure.scheduledTime
                                                ? "ring-2 ring-green-500 ring-offset-1"
                                                : ""
                                            }`}
                                    >
                                        {formatTimeDisplay(slot)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-sm font-medium text-slate-600 mb-2 block">
                            Notes (optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any special instructions..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={2}
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 rounded-lg text-sm text-red-600">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedTime}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Save Changes
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default EditScheduleModal;
