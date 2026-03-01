"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Types for schedule settings
export interface ScheduleSettingsData {
    dayStartTime: string;
    dayEndTime: string;
    lunchBreakEnabled: boolean;
    lunchStartTime: string;
    lunchEndTime: string;
    slotDurationMinutes: number;
    procedureDurations: Record<string, number>;
    enableCheckIn: boolean;
    showCancelledSlots: boolean;
    workingDays: number[];
}

export interface ScheduleProcedureData {
    patientId: string;
    doctorId: string;
    type: string;
    scheduledDate: Date;
    scheduledTime: string;
    durationMinutes?: number;
    schedulingNotes?: string;
}

export interface DaySchedule {
    date: Date;
    procedures: ScheduledProcedure[];
}

export interface ScheduledProcedure {
    id: string;
    type: string;
    status: string;
    scheduledDate: Date | null;
    scheduledTime: string | null;
    durationMinutes: number;
    startTime: Date | null;
    endTime: Date | null;
    checkedInAt: Date | null;
    cancelledAt: Date | null;
    cancelReason: string | null;
    schedulingNotes: string | null;
    patient: {
        id: string;
        fullName: string;
        mrn: string;
    };
    doctor: {
        id: string;
        fullName: string;
    };
}

// Default schedule settings
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
    workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
};

/**
 * Get schedule settings for an organization
 */
export async function getScheduleSettings(organizationId: string): Promise<{
    success: boolean;
    settings?: ScheduleSettingsData;
    error?: string;
}> {
    try {
        const settings = await prisma.scheduleSettings.findUnique({
            where: { organizationId },
        });

        if (!settings) {
            // Return defaults if no settings exist
            return { success: true, settings: DEFAULT_SETTINGS };
        }

        return {
            success: true,
            settings: {
                dayStartTime: settings.dayStartTime,
                dayEndTime: settings.dayEndTime,
                lunchBreakEnabled: settings.lunchBreakEnabled,
                lunchStartTime: settings.lunchStartTime,
                lunchEndTime: settings.lunchEndTime,
                slotDurationMinutes: settings.slotDurationMinutes,
                procedureDurations: JSON.parse(settings.procedureDurations),
                enableCheckIn: settings.enableCheckIn,
                showCancelledSlots: settings.showCancelledSlots,
                workingDays: JSON.parse(settings.workingDays),
            },
        };
    } catch (error) {
        console.error("Error getting schedule settings:", error);
        return { success: false, error: "Failed to get schedule settings" };
    }
}

/**
 * Update schedule settings for an organization
 */
export async function updateScheduleSettings(
    organizationId: string,
    data: Partial<ScheduleSettingsData>
): Promise<{ success: boolean; error?: string }> {
    try {
        const updateData: any = {};

        if (data.dayStartTime !== undefined) updateData.dayStartTime = data.dayStartTime;
        if (data.dayEndTime !== undefined) updateData.dayEndTime = data.dayEndTime;
        if (data.lunchBreakEnabled !== undefined) updateData.lunchBreakEnabled = data.lunchBreakEnabled;
        if (data.lunchStartTime !== undefined) updateData.lunchStartTime = data.lunchStartTime;
        if (data.lunchEndTime !== undefined) updateData.lunchEndTime = data.lunchEndTime;
        if (data.slotDurationMinutes !== undefined) updateData.slotDurationMinutes = data.slotDurationMinutes;
        if (data.procedureDurations !== undefined) updateData.procedureDurations = JSON.stringify(data.procedureDurations);
        if (data.enableCheckIn !== undefined) updateData.enableCheckIn = data.enableCheckIn;
        if (data.showCancelledSlots !== undefined) updateData.showCancelledSlots = data.showCancelledSlots;
        if (data.workingDays !== undefined) updateData.workingDays = JSON.stringify(data.workingDays);

        await prisma.scheduleSettings.upsert({
            where: { organizationId },
            update: updateData,
            create: {
                organizationId,
                ...updateData,
            },
        });

        revalidatePath("/doctor");
        return { success: true };
    } catch (error) {
        console.error("Error updating schedule settings:", error);
        return { success: false, error: "Failed to update schedule settings" };
    }
}

/**
 * Get procedures for a specific date range
 */
export async function getScheduleForDateRange(
    startDate: Date,
    endDate: Date,
    doctorId?: string,
    showCancelled: boolean = true
): Promise<{ success: boolean; procedures?: ScheduledProcedure[]; error?: string }> {
    try {
        // Set time to start/end of day for proper range
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const whereClause: any = {
            OR: [
                // Procedures with scheduled date in range
                {
                    scheduledDate: {
                        gte: start,
                        lte: end,
                    },
                },
                // Fallback: procedures created in range if no scheduledDate
                {
                    scheduledDate: null,
                    createdAt: {
                        gte: start,
                        lte: end,
                    },
                },
            ],
        };

        if (doctorId) {
            whereClause.doctorId = doctorId;
        }

        if (!showCancelled) {
            whereClause.status = {
                notIn: ["CANCELLED", "NO_SHOW"],
            };
        }

        const procedures = await prisma.procedure.findMany({
            where: whereClause,
            include: {
                patient: {
                    select: {
                        id: true,
                        fullName: true,
                        mrn: true,
                    },
                },
                doctor: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
            orderBy: [
                { scheduledDate: "asc" },
                { scheduledTime: "asc" },
                { createdAt: "asc" },
            ],
        });

        return { success: true, procedures: procedures as ScheduledProcedure[] };
    } catch (error) {
        console.error("Error getting schedule:", error);
        return { success: false, error: "Failed to get schedule" };
    }
}

/**
 * Get procedures for a single day
 */
export async function getDaySchedule(
    date: Date,
    doctorId?: string,
    showCancelled: boolean = true
): Promise<{ success: boolean; procedures?: ScheduledProcedure[]; error?: string }> {
    return getScheduleForDateRange(date, date, doctorId, showCancelled);
}

/**
 * Schedule a new procedure
 */
export async function scheduleProcedureWithTime(
    data: ScheduleProcedureData
): Promise<{ success: boolean; procedureId?: string; error?: string }> {
    try {
        // Conflict check
        const conflictCheck = await checkScheduleConflict(
            data.scheduledDate,
            data.scheduledTime,
            data.durationMinutes || 30,
            data.doctorId
        );

        if (!conflictCheck.success) {
            return { success: false, error: conflictCheck.error };
        }

        if (conflictCheck.hasConflict) {
            return {
                success: false,
                error: `Time slot conflicts with: ${conflictCheck.conflictingProcedure}`,
            };
        }

        // Normalize date to start of day to avoid timezone drift
        const normalizedDate = new Date(data.scheduledDate);
        normalizedDate.setHours(0, 0, 0, 0);

        const procedure = await prisma.procedure.create({
            data: {
                type: data.type,
                status: "SCHEDULED",
                scheduledDate: normalizedDate,
                scheduledTime: data.scheduledTime,
                durationMinutes: data.durationMinutes || 30,
                schedulingNotes: data.schedulingNotes,
                patientId: data.patientId,
                doctorId: data.doctorId,
            },
        });

        // Removed: revalidatePath causes full page refresh - client handles refresh via onRefresh callback
        // revalidatePath("/doctor");
        return { success: true, procedureId: procedure.id };
    } catch (error) {
        console.error("Error scheduling procedure:", error);
        return { success: false, error: "Failed to schedule procedure" };
    }
}

/**
 * Check for scheduling conflicts
 */
export async function checkScheduleConflict(
    date: Date | string,
    time: string,
    durationMinutes: number,
    doctorId: string,
    excludeProcedureId?: string
): Promise<{
    success: boolean;
    hasConflict?: boolean;
    conflictingProcedure?: string;
    error?: string;
}> {
    try {
        // Ensure date is a proper Date object (handles serialization from client)
        const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);

        const dayStart = new Date(dateObj);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dateObj);
        dayEnd.setHours(23, 59, 59, 999);

        // Get all procedures for that day
        const procedures = await prisma.procedure.findMany({
            where: {
                doctorId,
                scheduledDate: {
                    gte: dayStart,
                    lte: dayEnd,
                },
                status: {
                    notIn: ["CANCELLED", "NO_SHOW", "COMPLETED"],
                },
                ...(excludeProcedureId ? { id: { not: excludeProcedureId } } : {}),
            },
            include: {
                patient: { select: { fullName: true } },
            },
        });

        // Convert times to minutes for easier comparison
        const newStartMinutes = timeToMinutes(time);
        const newEndMinutes = newStartMinutes + durationMinutes;

        for (const proc of procedures) {
            if (!proc.scheduledTime) continue;

            const procStartMinutes = timeToMinutes(proc.scheduledTime);
            const procEndMinutes = procStartMinutes + proc.durationMinutes;

            // Check for overlap
            if (newStartMinutes < procEndMinutes && newEndMinutes > procStartMinutes) {
                return {
                    success: true,
                    hasConflict: true,
                    conflictingProcedure: `${proc.type} for ${proc.patient.fullName} at ${proc.scheduledTime}`,
                };
            }
        }

        return { success: true, hasConflict: false };
    } catch (error) {
        console.error("Error checking conflict:", error);
        return { success: false, error: "Failed to check conflicts" };
    }
}

/**
 * Cancel a procedure
 */
export async function cancelProcedure(
    procedureId: string,
    reason: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.procedure.update({
            where: { id: procedureId },
            data: {
                status: "CANCELLED",
                cancelledAt: new Date(),
                cancelReason: reason,
            },
        });

        // Removed: client handles refresh via onRefresh callback
        // revalidatePath("/doctor");
        return { success: true };
    } catch (error) {
        console.error("Error cancelling procedure:", error);
        return { success: false, error: "Failed to cancel procedure" };
    }
}

/**
 * Reschedule a cancelled procedure
 */
export async function rescheduleProcedure(
    originalProcedureId: string,
    newDate: Date,
    newTime: string
): Promise<{ success: boolean; newProcedureId?: string; error?: string }> {
    try {
        const original = await prisma.procedure.findUnique({
            where: { id: originalProcedureId },
        });

        if (!original) {
            return { success: false, error: "Original procedure not found" };
        }

        // Create new procedure
        const newProcedure = await prisma.procedure.create({
            data: {
                type: original.type,
                status: "SCHEDULED",
                scheduledDate: newDate,
                scheduledTime: newTime,
                durationMinutes: original.durationMinutes,
                schedulingNotes: original.schedulingNotes
                    ? `${original.schedulingNotes} [Rescheduled]`
                    : "Rescheduled",
                patientId: original.patientId,
                doctorId: original.doctorId,
                rescheduledFromId: originalProcedureId,
            },
        });

        // Update original to point to new one
        await prisma.procedure.update({
            where: { id: originalProcedureId },
            data: {
                rescheduledToId: newProcedure.id,
            },
        });

        // Removed: client handles refresh via onRefresh callback
        // revalidatePath("/doctor");
        return { success: true, newProcedureId: newProcedure.id };
    } catch (error) {
        console.error("Error rescheduling:", error);
        return { success: false, error: "Failed to reschedule" };
    }
}

/**
 * Check in a patient
 */
export async function checkInPatient(
    procedureId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.procedure.update({
            where: { id: procedureId },
            data: {
                status: "CHECKED_IN",
                checkedInAt: new Date(),
            },
        });

        // Removed: client handles refresh via onRefresh callback
        // revalidatePath("/doctor");
        return { success: true };
    } catch (error) {
        console.error("Error checking in:", error);
        return { success: false, error: "Failed to check in patient" };
    }
}

/**
 * Mark as no-show
 */
export async function markNoShow(
    procedureId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.procedure.update({
            where: { id: procedureId },
            data: {
                status: "NO_SHOW",
                cancelledAt: new Date(),
                cancelReason: "Patient did not arrive",
            },
        });

        // Removed: client handles refresh via onRefresh callback
        // revalidatePath("/doctor");
        return { success: true };
    } catch (error) {
        console.error("Error marking no-show:", error);
        return { success: false, error: "Failed to mark as no-show" };
    }
}

/**
 * Update procedure schedule (time/date/duration)
 */
export async function updateProcedureSchedule(
    procedureId: string,
    data: {
        scheduledDate?: Date;
        scheduledTime?: string;
        durationMinutes?: number;
        schedulingNotes?: string;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.procedure.update({
            where: { id: procedureId },
            data,
        });

        // Removed: client handles refresh via onRefresh callback
        // revalidatePath("/doctor");
        return { success: true };
    } catch (error) {
        console.error("Error updating schedule:", error);
        return { success: false, error: "Failed to update schedule" };
    }
}

/**
 * Get available time slots for a date
 */
export async function getAvailableSlots(
    date: Date,
    durationMinutes: number,
    doctorId: string,
    settings: ScheduleSettingsData
): Promise<{ success: boolean; slots?: string[]; error?: string }> {
    try {
        // Get existing procedures for that day
        const result = await getDaySchedule(date, doctorId, false);
        if (!result.success || !result.procedures) {
            return { success: false, error: "Failed to get existing schedule" };
        }

        const bookedSlots: { start: number; end: number }[] = result.procedures
            .filter(p => p.scheduledTime)
            .map(p => ({
                start: timeToMinutes(p.scheduledTime!),
                end: timeToMinutes(p.scheduledTime!) + p.durationMinutes,
            }));

        // Generate available slots
        const dayStartMinutes = timeToMinutes(settings.dayStartTime);
        const dayEndMinutes = timeToMinutes(settings.dayEndTime);
        const lunchStartMinutes = settings.lunchBreakEnabled ? timeToMinutes(settings.lunchStartTime) : -1;
        const lunchEndMinutes = settings.lunchBreakEnabled ? timeToMinutes(settings.lunchEndTime) : -1;

        const availableSlots: string[] = [];

        for (let slotStart = dayStartMinutes; slotStart + durationMinutes <= dayEndMinutes; slotStart += settings.slotDurationMinutes) {
            const slotEnd = slotStart + durationMinutes;

            // Skip lunch break
            if (settings.lunchBreakEnabled) {
                if (slotStart < lunchEndMinutes && slotEnd > lunchStartMinutes) {
                    continue;
                }
            }

            // Check for conflicts
            const hasConflict = bookedSlots.some(
                booked => slotStart < booked.end && slotEnd > booked.start
            );

            if (!hasConflict) {
                availableSlots.push(minutesToTime(slotStart));
            }
        }

        return { success: true, slots: availableSlots };
    } catch (error) {
        console.error("Error getting available slots:", error);
        return { success: false, error: "Failed to get available slots" };
    }
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
