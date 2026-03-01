/**
 * Authentication Validation Schemas
 * 
 * Zod schemas for validating authentication-related requests.
 */

import { z } from 'zod';

/**
 * Login request schema
 * Allows both email-style usernames (legacy) and simple usernames
 */
export const loginSchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, 'Username must be at least 3 characters')
        .max(100, 'Username must not exceed 100 characters'),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .max(72, 'Password must not exceed 72 characters'),
}).strict();

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Password change schema
 */
export const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(72, 'Password must not exceed 72 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
}).strict().refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

/**
 * User registration schema (for admin creating users)
 */
export const userRegistrationSchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must not exceed 50 characters')
        .regex(/^[a-zA-Z0-9_@.]+$/, 'Username can only contain letters, numbers, underscores, @ and dots'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(72, 'Password must not exceed 72 characters'),
    fullName: z
        .string()
        .trim()
        .min(2, 'Full name must be at least 2 characters')
        .max(100, 'Full name must not exceed 100 characters'),
    role: z.enum(['ADMIN', 'DOCTOR', 'ASSISTANT']),
    contactDetails: z.string().optional(),
}).strict();

export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;

/**
 * Organization registration schema
 */
export const organizationRegistrationSchema = z.object({
    organizationName: z
        .string()
        .trim()
        .min(2, 'Organization name must be at least 2 characters')
        .max(100, 'Organization name must not exceed 100 characters'),
    organizationType: z.enum(['CLINIC', 'HOSPITAL', 'MEDICAL_CENTER']),
    adminUsername: z
        .string()
        .trim()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must not exceed 50 characters')
        .regex(/^[a-zA-Z0-9_@.]+$/, 'Username can only contain letters, numbers, underscores, @ and dots'),
    adminPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(72, 'Password must not exceed 72 characters'),
    adminName: z
        .string()
        .trim()
        .min(2, 'Admin name must be at least 2 characters')
        .max(100, 'Admin name must not exceed 100 characters'),
}).strict();

export type OrganizationRegistrationInput = z.infer<typeof organizationRegistrationSchema>;
