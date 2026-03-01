/**
 * Security Constants - Medical Grade Configuration
 * 
 * These constants define the security parameters for the application.
 * All values are set for HIPAA/FDA compliance.
 */

// Password hashing configuration
export const PASSWORD_CONFIG = {
    /** Salt rounds for bcrypt - 12 is medical-grade (higher = more secure but slower) */
    SALT_ROUNDS: 12,
    /** Minimum password length */
    MIN_LENGTH: 8,
    /** Maximum password length (bcrypt limit) */
    MAX_LENGTH: 72,
} as const;

// JWT Configuration
export const JWT_CONFIG = {
    /** Access token expiry - short-lived for security */
    ACCESS_TOKEN_EXPIRY: '15m',
    /** Refresh token expiry - shift-based (8 hours) */
    REFRESH_TOKEN_EXPIRY: '8h',
    /** Algorithm for signing - RS256 preferred, HS256 for simplicity */
    ALGORITHM: 'HS256' as const,
    /** Token issuer */
    ISSUER: 'endoscopy-suite',
    /** Token audience */
    AUDIENCE: 'medical-device',
    /** Cookie name for access token */
    ACCESS_COOKIE_NAME: 'es_access_token',
    /** Cookie name for refresh token */
    REFRESH_COOKIE_NAME: 'es_refresh_token',
} as const;

// Session configuration
export const SESSION_CONFIG = {
    /** Maximum concurrent sessions per user */
    MAX_SESSIONS: 3,
    /** Inactivity timeout in minutes */
    INACTIVITY_TIMEOUT: 30,
    /** Rate limit for login attempts */
    LOGIN_RATE_LIMIT: 5,
    /** Rate limit window in minutes */
    RATE_LIMIT_WINDOW: 15,
} as const;

// Audit log configuration
export const AUDIT_CONFIG = {
    /** Events that must be logged (FDA 21 CFR Part 11) */
    MANDATORY_EVENTS: [
        'LOGIN_SUCCESS',
        'LOGIN_FAILURE',
        'LOGOUT',
        'PASSWORD_CHANGE',
        'PATIENT_CREATE',
        'PATIENT_UPDATE',
        'PATIENT_DELETE',
        'REPORT_CREATE',
        'REPORT_UPDATE',
        'REPORT_FINALIZE',
        'DATA_EXPORT',
        'DATA_IMPORT',
        'SETTINGS_CHANGE',
        'PROCEDURE_CREATE',
        'PROCEDURE_UPDATE',
    ] as const,
    /** Log retention period in days */
    RETENTION_DAYS: 365,
    /** Maximum log file size in MB before rotation */
    MAX_FILE_SIZE_MB: 50,
} as const;

// Role definitions
export const ROLES = {
    ADMIN: 'ADMIN',
    DOCTOR: 'DOCTOR',
    ASSISTANT: 'ASSISTANT',
} as const;

export type Role = keyof typeof ROLES;

// Permission definitions per role
export const PERMISSIONS = {
    ADMIN: ['*'] as const,
    DOCTOR: [
        'procedure:create',
        'procedure:read',
        'procedure:update',
        'procedure:start',
        'procedure:end',
        'report:create',
        'report:read',
        'report:update',
        'report:finalize',
        'patient:create',
        'patient:read',
        'patient:update',
        'schedule:read',
        'media:create',
        'media:read',
        'media:update',
        'settings:read',
        'export:patient',
        'export:report',
    ] as const,
    ASSISTANT: [
        'patient:create',
        'patient:read',
        'schedule:create',
        'schedule:read',
        'schedule:update',
        'procedure:checkin',
        'procedure:read',
    ] as const,
} as const;

export type Permission = (typeof PERMISSIONS)[Role][number];
