/**
 * Role-Based Access Control (RBAC) - Medical Grade
 * 
 * Implements permission checking based on user roles.
 * Compliant with healthcare access control requirements.
 */

import { PERMISSIONS, ROLES, type Role, type Permission } from './constants';

/**
 * Check if a role has a specific permission
 * @param role - User's role
 * @param permission - Permission to check
 * @returns true if role has the permission
 */
export function hasPermission(role: Role, permission: string): boolean {
    const rolePermissions = PERMISSIONS[role] as readonly string[];

    if (!rolePermissions) {
        return false;
    }

    // Admin has all permissions (check for wildcard)
    if (rolePermissions.includes('*')) {
        return true;
    }

    // Check exact permission match
    if (rolePermissions.includes(permission)) {
        return true;
    }

    // Check wildcard permissions (e.g., "procedure:*" matches "procedure:read")
    const [resource, action] = permission.split(':');
    const wildcardPermission = `${resource}:*`;

    if (rolePermissions.includes(wildcardPermission)) {
        return true;
    }

    return false;
}

/**
 * Check if a role has ALL of the specified permissions
 * @param role - User's role
 * @param permissions - Array of permissions to check
 * @returns true if role has all permissions
 */
export function hasAllPermissions(role: Role, permissions: string[]): boolean {
    return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Check if a role has ANY of the specified permissions
 * @param role - User's role
 * @param permissions - Array of permissions to check
 * @returns true if role has at least one permission
 */
export function hasAnyPermission(role: Role, permissions: string[]): boolean {
    return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 * @param role - User's role
 * @returns Array of permission strings
 */
export function getRolePermissions(role: Role): readonly string[] {
    return PERMISSIONS[role] || [];
}

/**
 * Check if a role is valid
 * @param role - Role string to validate
 * @returns true if role exists
 */
export function isValidRole(role: string): role is Role {
    return Object.keys(ROLES).includes(role);
}

/**
 * Get role hierarchy level (higher = more permissions)
 * @param role - User's role
 * @returns Numeric hierarchy level
 */
export function getRoleLevel(role: Role): number {
    const levels: Record<Role, number> = {
        ADMIN: 100,
        DOCTOR: 50,
        ASSISTANT: 25,
    };
    return levels[role] || 0;
}

/**
 * Check if one role outranks another
 * @param role1 - First role
 * @param role2 - Second role
 * @returns true if role1 outranks role2
 */
export function outranks(role1: Role, role2: Role): boolean {
    return getRoleLevel(role1) > getRoleLevel(role2);
}

/**
 * Permission guard for server actions
 * Throws an error if permission is not granted
 * @param role - User's role
 * @param permission - Required permission
 * @throws Error if permission denied
 */
export function requirePermission(role: Role, permission: string): void {
    if (!hasPermission(role, permission)) {
        throw new Error(`Permission denied: ${permission} requires role higher than ${role}`);
    }
}

/**
 * Permission guard for multiple permissions
 * @param role - User's role
 * @param permissions - Required permissions (all must be present)
 * @throws Error if any permission denied
 */
export function requireAllPermissions(role: Role, permissions: string[]): void {
    const missing = permissions.filter(p => !hasPermission(role, p));
    if (missing.length > 0) {
        throw new Error(`Permission denied: Missing permissions: ${missing.join(', ')}`);
    }
}
