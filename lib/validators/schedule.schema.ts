/**
 * Schedule Validation Schemas
 * 
 * Zod schemas for validating schedule-related requests.
 */

import { z } from 'zod';
import { procedureTypes } from './procedure.schema';

/**
 * Time format regex (HH:mm)
 */
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Schedule procedure schema
 */
export const scheduleProcedureSchema = z.object({
    patientId: z.string().uuid('Invalid patient ID'),
    doctorId: z.string().uuid('Invalid doctor ID'),
    type: z.enum(procedureTypes),
    scheduledDate: z.string().datetime('Invalid date format'),
    scheduledTime: z
        .string()
        .regex(timeRegex, 'Invalid time format (HH:mm)'),
    durationMinutes: z
        .number()
        .int()
        .min(5)
        .max(240)
        .default(30),
    schedulingNotes: z
        .string()
        .max(500, 'Notes must not exceed 500 characters')
        .optional(),
});

export type ScheduleProcedureInput = z.infer<typeof scheduleProcedureSchema>;

/**
 * Reschedule procedure schema
 */
export const rescheduleProcedureSchema = z.object({
    procedureId: z.string().uuid('Invalid procedure ID'),
    newDate: z.string().datetime('Invalid date format'),
    newTime: z.string().regex(timeRegex, 'Invalid time format (HH:mm)'),
});

export type RescheduleProcedureInput = z.infer<typeof rescheduleProcedureSchema>;

/**
 * Cancel procedure schema
 */
export const cancelProcedureSchema = z.object({
    procedureId: z.string().uuid('Invalid procedure ID'),
    reason: z
        .string()
        .min(1, 'Cancellation reason is required')
        .max(500, 'Reason must not exceed 500 characters'),
});

export type CancelProcedureInput = z.infer<typeof cancelProcedureSchema>;

/**
 * Date range query schema
 */
export const dateRangeSchema = z.object({
    startDate: z.string().datetime('Invalid start date'),
    endDate: z.string().datetime('Invalid end date'),
    doctorId: z.string().uuid().optional(),
    showCancelled: z.boolean().default(true),
});

export type DateRangeInput = z.infer<typeof dateRangeSchema>;

/**
 * Schedule settings schema
 */
export const scheduleSettingsSchema = z.object({
    dayStartTime: z.string().regex(timeRegex, 'Invalid start time'),
    dayEndTime: z.string().regex(timeRegex, 'Invalid end time'),
    lunchBreakEnabled: z.boolean(),
    lunchStartTime: z.string().regex(timeRegex, 'Invalid lunch start time'),
    lunchEndTime: z.string().regex(timeRegex, 'Invalid lunch end time'),
    slotDurationMinutes: z.number().int().min(5).max(60),
    procedureDurations: z.record(z.string(), z.number().int().min(5).max(240)),
    enableCheckIn: z.boolean(),
    showCancelledSlots: z.boolean(),
    workingDays: z.array(z.number().int().min(0).max(6)),
});

export type ScheduleSettingsInput = z.infer<typeof scheduleSettingsSchema>;

/**
 * Check conflict schema
 */
export const checkConflictSchema = z.object({
    date: z.string().datetime('Invalid date'),
    time: z.string().regex(timeRegex, 'Invalid time format'),
    durationMinutes: z.number().int().min(5).max(240),
    doctorId: z.string().uuid('Invalid doctor ID'),
    excludeProcedureId: z.string().uuid().optional(),
});

export type CheckConflictInput = z.infer<typeof checkConflictSchema>;
