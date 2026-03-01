/**
 * Procedure Validation Schemas
 * 
 * Zod schemas for validating procedure-related requests.
 */

import { z } from 'zod';

/**
 * Valid procedure types
 */
export const procedureTypes = [
    'nasal_endoscopy',
    'laryngoscopy',
    'stroboscopy',
    'otoendoscopy',
    'fob',
    'egd',
    'colonoscopy',
    'sigmoidoscopy',
    'ercp',
    'bronchoscopy',
    'osa_evaluation',
    'generic',
] as const;

export type ProcedureType = (typeof procedureTypes)[number];

/**
 * Procedure status values
 */
export const procedureStatuses = [
    'SCHEDULED',
    'CHECKED_IN',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
] as const;

export type ProcedureStatus = (typeof procedureStatuses)[number];

/**
 * Create procedure schema
 */
export const createProcedureSchema = z.object({
    patientId: z.string().uuid('Invalid patient ID'),
    doctorId: z.string().uuid('Invalid doctor ID'),
    type: z.enum(procedureTypes),
    scheduledDate: z.string().datetime().optional(),
    scheduledTime: z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)')
        .optional(),
    durationMinutes: z
        .number()
        .int()
        .min(5, 'Duration must be at least 5 minutes')
        .max(240, 'Duration must not exceed 4 hours')
        .default(30),
    notes: z
        .string()
        .max(1000, 'Notes must not exceed 1000 characters')
        .optional(),
});

export type CreateProcedureInput = z.infer<typeof createProcedureSchema>;

/**
 * Update procedure status schema
 */
export const updateProcedureStatusSchema = z.object({
    procedureId: z.string().uuid('Invalid procedure ID'),
    status: z.enum(procedureStatuses),
    cancelReason: z
        .string()
        .max(500, 'Cancel reason must not exceed 500 characters')
        .optional(),
});

export type UpdateProcedureStatusInput = z.infer<typeof updateProcedureStatusSchema>;

/**
 * Procedure ID parameter schema
 */
export const procedureIdSchema = z.object({
    id: z.string().uuid('Invalid procedure ID'),
});

export type ProcedureIdInput = z.infer<typeof procedureIdSchema>;

/**
 * Save media schema
 */
export const saveMediaSchema = z.object({
    procedureId: z.string().uuid('Invalid procedure ID'),
    type: z.enum(['IMAGE', 'VIDEO']),
    filePath: z
        .string()
        .min(1, 'File path is required')
        .max(500, 'File path too long'),
    thumbnailPath: z
        .string()
        .max(500, 'Thumbnail path too long')
        .optional(),
});

export type SaveMediaInput = z.infer<typeof saveMediaSchema>;

/**
 * Save report schema
 */
export const saveReportSchema = z.object({
    procedureId: z.string().uuid('Invalid procedure ID'),
    content: z.string().min(1, 'Report content is required'),
    finalize: z.boolean().default(false),
});

export type SaveReportInput = z.infer<typeof saveReportSchema>;
