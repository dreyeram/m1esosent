/**
 * Security Module - Main Export
 * 
 * Centralizes all security-related functionality for the medical application.
 */

// Password hashing
export { hashPassword, verifyPassword, validatePasswordStrength } from './password';

// JWT token management
export {
    generateAccessToken,
    generateRefreshToken,
    generateTokenPair,
    verifyAccessToken,
    verifyRefreshToken,
    isTokenExpiringSoon,
    extractTokenFromHeader,
    type TokenPayload,
    type DecodedToken,
    type TokenPair,
} from './jwt';

// Role-Based Access Control
export {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    getRolePermissions,
    isValidRole,
    getRoleLevel,
    outranks,
    requirePermission,
    requireAllPermissions,
} from './rbac';

// Audit logging
export {
    createAuditLog,
    queryAuditLogs,
    AuditLogger,
    type AuditLogEntry,
    type AuditEventType,
} from './audit';

// Constants and types
export {
    PASSWORD_CONFIG,
    JWT_CONFIG,
    SESSION_CONFIG,
    AUDIT_CONFIG,
    ROLES,
    PERMISSIONS,
    type Role,
    type Permission,
} from './constants';
