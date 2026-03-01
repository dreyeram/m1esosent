/**
 * Validators Module - Main Export
 * 
 * Centralizes all Zod validation schemas for the application.
 */

// Authentication schemas
export {
    loginSchema,
    passwordChangeSchema,
    userRegistrationSchema,
    organizationRegistrationSchema,
    type LoginInput,
    type PasswordChangeInput,
    type UserRegistrationInput,
    type OrganizationRegistrationInput,
} from './auth.schema';

// Patient schemas
export {
    createPatientSchema,
    updatePatientSchema,
    patientSearchSchema,
    patientIdSchema,
    type CreatePatientInput,
    type UpdatePatientInput,
    type PatientSearchInput,
    type PatientIdInput,
} from './patient.schema';

// Procedure schemas
export {
    createProcedureSchema,
    updateProcedureStatusSchema,
    procedureIdSchema,
    saveMediaSchema,
    saveReportSchema,
    procedureTypes,
    procedureStatuses,
    type CreateProcedureInput,
    type UpdateProcedureStatusInput,
    type ProcedureIdInput,
    type SaveMediaInput,
    type SaveReportInput,
    type ProcedureType,
    type ProcedureStatus,
} from './procedure.schema';

// Schedule schemas
export {
    scheduleProcedureSchema,
    rescheduleProcedureSchema,
    cancelProcedureSchema,
    dateRangeSchema,
    scheduleSettingsSchema,
    checkConflictSchema,
    type ScheduleProcedureInput,
    type RescheduleProcedureInput,
    type CancelProcedureInput,
    type DateRangeInput,
    type ScheduleSettingsInput,
    type CheckConflictInput,
} from './schedule.schema';

import { ZodSchema, ZodError } from 'zod';

/**
 * Utility function to safely parse and validate input
 * @param schema - Zod schema to use for validation
 * @param data - Data to validate
 * @returns Object with success flag and either data or errors
 */
export function safeValidate<T>(
    schema: ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors = result.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
        return `${path}${issue.message}`;
    });

    return { success: false, errors };
}
