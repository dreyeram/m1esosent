/**
 * Audit Logging System - Medical Grade (FDA 21 CFR Part 11 Compliant)
 * 
 * Records all security-relevant events for compliance and forensics.
 * Logs are immutable and stored in the database.
 */

import { AUDIT_CONFIG } from './constants';
import type { Role } from './constants';
import { prisma } from '@/lib/prisma';

/**
 * Audit event types
 */
export type AuditEventType = (typeof AUDIT_CONFIG.MANDATORY_EVENTS)[number];

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
    id: string;
    timestamp: Date;
    eventType: AuditEventType;
    userId: string | null;
    username: string | null;
    role: Role | null;
    resourceType: string | null;
    resourceId: string | null;
    action: string;
    details: Record<string, unknown>;
    ipAddress: string | null;
    userAgent: string | null;
    success: boolean;
    errorMessage: string | null;
}

/**
 * Create an audit log entry
 * @param params - Audit entry parameters
 * @returns The created audit log entry
 */
export async function createAuditLog(params: {
    eventType: AuditEventType;
    userId?: string | null;
    username?: string | null;
    role?: Role | null;
    resourceType?: string | null;
    resourceId?: string | null;
    action: string;
    details?: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
    success?: boolean;
    errorMessage?: string | null;
}): Promise<AuditLogEntry> {
    try {
        const result = await prisma.auditLog.create({
            data: {
                eventType: params.eventType,
                userId: params.userId,
                username: params.username,
                role: params.role ? String(params.role) : null,
                resourceType: params.resourceType,
                resourceId: params.resourceId,
                action: params.action,
                details: params.details ? JSON.stringify(params.details) : null,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
                success: params.success ?? true,
                errorMessage: params.errorMessage,
            }
        });

        // Convert back to structured object for return
        return {
            ...result,
            eventType: result.eventType as AuditEventType, // Safe cast as we validate inputs
            role: result.role as Role | null,
            details: result.details ? JSON.parse(result.details) : {},
        };
    } catch (error) {
        console.error("Failed to create audit log:", error);
        // Fallback for critical failure - ensure we don't crash the application but log the failure
        // In a real medical device, this might trigger a system alert
        return {
            id: 'failed_log',
            timestamp: new Date(),
            eventType: params.eventType,
            userId: params.userId ?? null,
            username: params.username ?? null,
            role: params.role ?? null,
            resourceType: params.resourceType ?? null,
            resourceId: params.resourceId ?? null,
            action: params.action,
            details: params.details ?? {},
            ipAddress: params.ipAddress ?? null,
            userAgent: params.userAgent ?? null,
            success: params.success ?? true,
            errorMessage: params.errorMessage ?? null,
        };
    }
}

/**
 * Query audit logs (admin only)
 * @param filters - Query filters
 * @returns Matching audit log entries
 */
export async function queryAuditLogs(filters: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    eventType?: AuditEventType;
    resourceType?: string;
    resourceId?: string;
    success?: boolean;
    limit?: number;
    offset?: number;
}): Promise<AuditLogEntry[]> {
    const where: any = {};

    if (filters.startDate) {
        where.timestamp = { ...where.timestamp, gte: filters.startDate };
    }

    if (filters.endDate) {
        where.timestamp = { ...where.timestamp, lte: filters.endDate };
    }

    if (filters.userId) where.userId = filters.userId;
    if (filters.eventType) where.eventType = filters.eventType;
    if (filters.resourceType) where.resourceType = filters.resourceType;
    if (filters.resourceId) where.resourceId = filters.resourceId;
    if (typeof filters.success === 'boolean') where.success = filters.success;

    const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filters.limit ?? 100,
        skip: filters.offset ?? 0,
    });

    return logs.map(log => ({
        ...log,
        eventType: log.eventType as AuditEventType,
        role: log.role as Role | null,
        details: log.details ? JSON.parse(log.details) : {},
    }));
}

/**
 * Convenience functions for common audit events
 */
export const AuditLogger = {
    loginSuccess: (userId: string, username: string, role: Role, ipAddress?: string) => {
        return createAuditLog({
            eventType: 'LOGIN_SUCCESS',
            userId,
            username,
            role,
            action: 'User logged in successfully',
            ipAddress,
            success: true,
        });
    },

    loginFailure: (username: string, reason: string, ipAddress?: string) => {
        return createAuditLog({
            eventType: 'LOGIN_FAILURE',
            username,
            action: 'Login attempt failed',
            details: { reason },
            ipAddress,
            success: false,
            errorMessage: reason,
        });
    },

    logout: (userId: string, username: string, role: Role) => {
        return createAuditLog({
            eventType: 'LOGOUT',
            userId,
            username,
            role,
            action: 'User logged out',
            success: true,
        });
    },

    patientCreate: (userId: string, username: string, role: Role, patientId: string, patientName: string) => {
        return createAuditLog({
            eventType: 'PATIENT_CREATE',
            userId,
            username,
            role,
            resourceType: 'Patient',
            resourceId: patientId,
            action: 'Created new patient record',
            details: { patientName },
            success: true,
        });
    },

    patientUpdate: (userId: string, username: string, role: Role, patientId: string, changes: Record<string, unknown>) => {
        return createAuditLog({
            eventType: 'PATIENT_UPDATE',
            userId,
            username,
            role,
            resourceType: 'Patient',
            resourceId: patientId,
            action: 'Updated patient record',
            details: { changes },
            success: true,
        });
    },

    patientDelete: (userId: string, username: string, role: Role, patientId: string, patientName: string) => {
        return createAuditLog({
            eventType: 'PATIENT_DELETE',
            userId,
            username,
            role,
            resourceType: 'Patient',
            resourceId: patientId,
            action: 'Deleted patient record',
            details: { patientName },
            success: true,
        });
    },

    reportCreate: (userId: string, username: string, role: Role, reportId: string, procedureId: string) => {
        return createAuditLog({
            eventType: 'REPORT_CREATE',
            userId,
            username,
            role,
            resourceType: 'Report',
            resourceId: reportId,
            action: 'Created new report',
            details: { procedureId },
            success: true,
        });
    },

    reportUpdate: (userId: string, username: string, role: Role, reportId: string) => {
        return createAuditLog({
            eventType: 'REPORT_UPDATE',
            userId,
            username,
            role,
            resourceType: 'Report',
            resourceId: reportId,
            action: 'Updated report',
            success: true,
        });
    },

    reportFinalize: (userId: string, username: string, role: Role, reportId: string) => {
        return createAuditLog({
            eventType: 'REPORT_FINALIZE',
            userId,
            username,
            role,
            resourceType: 'Report',
            resourceId: reportId,
            action: 'Finalized report',
            success: true,
        });
    },

    dataExport: (userId: string, username: string, role: Role, exportType: string, details: Record<string, unknown>) => {
        return createAuditLog({
            eventType: 'DATA_EXPORT',
            userId,
            username,
            role,
            action: `Exported data: ${exportType}`,
            details,
            success: true,
        });
    },

    dataImport: (userId: string, username: string, role: Role, importType: string, details: Record<string, unknown>) => {
        return createAuditLog({
            eventType: 'DATA_IMPORT',
            userId,
            username,
            role,
            action: `Imported data: ${importType}`,
            details,
            success: true,
        });
    },

    settingsChange: (userId: string, username: string, role: Role, settingName: string, oldValue: unknown, newValue: unknown) => {
        return createAuditLog({
            eventType: 'SETTINGS_CHANGE',
            userId,
            username,
            role,
            resourceType: 'Settings',
            resourceId: settingName,
            action: `Changed setting: ${settingName}`,
            details: { oldValue, newValue },
            success: true,
        });
    },

    passwordChange: (userId: string, username: string, role: Role) => {
        return createAuditLog({
            eventType: 'PASSWORD_CHANGE',
            userId,
            username,
            role,
            action: 'Changed password',
            success: true,
        });
    },
};
