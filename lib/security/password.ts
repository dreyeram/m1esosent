/**
 * Password Hashing Module - Medical Grade
 * 
 * Uses bcrypt with high salt rounds for HIPAA-compliant password security.
 * All passwords MUST be hashed using these functions.
 */

import bcrypt from 'bcrypt';
import { PASSWORD_CONFIG } from './constants';

/**
 * Hash a plaintext password using bcrypt
 * @param plainPassword - The plaintext password to hash
 * @returns Promise resolving to the hashed password
 * @throws Error if password validation fails
 */
export async function hashPassword(plainPassword: string): Promise<string> {
    // Validate password length
    if (plainPassword.length < PASSWORD_CONFIG.MIN_LENGTH) {
        throw new Error(`Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters`);
    }

    if (plainPassword.length > PASSWORD_CONFIG.MAX_LENGTH) {
        throw new Error(`Password must not exceed ${PASSWORD_CONFIG.MAX_LENGTH} characters`);
    }

    // Hash with configured salt rounds
    const hash = await bcrypt.hash(plainPassword, PASSWORD_CONFIG.SALT_ROUNDS);
    return hash;
}

/**
 * Verify a plaintext password against a hash
 * @param plainPassword - The plaintext password to verify
 * @param hashedPassword - The stored hash to compare against
 * @returns Promise resolving to true if password matches
 */
export async function verifyPassword(
    plainPassword: string,
    hashedPassword: string
): Promise<boolean> {
    try {
        const isValid = await bcrypt.compare(plainPassword, hashedPassword);
        return isValid;
    } catch {
        // Return false on any error (e.g., invalid hash format)
        return false;
    }
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with isValid flag and any error messages
 */
export function validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (password.length < PASSWORD_CONFIG.MIN_LENGTH) {
        errors.push(`Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters`);
    }

    if (password.length > PASSWORD_CONFIG.MAX_LENGTH) {
        errors.push(`Password must not exceed ${PASSWORD_CONFIG.MAX_LENGTH} characters`);
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    // Check for at least one number
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    // Check for at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}
