"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/security/password";

// ============================================================================
// ADMIN STATS
// ============================================================================

export async function getAdminStats() {
    try {
        // Run all counts in parallel for performance
        const [
            totalStaff,
            totalPatients,
            totalProcedures,
            completedProcedures,
            totalMedia
        ] = await Promise.all([
            prisma.user.count(),
            prisma.patient.count(),
            prisma.procedure.count(),
            prisma.procedure.count({ where: { status: 'COMPLETED' } }),
            prisma.media.count()
        ]);

        // Calculate estimated revenue ($150 per completed procedure)
        const estimatedRevenue = completedProcedures * 150;

        // Estimate storage (5MB per media file avg)
        const storageGB = ((totalMedia * 5) / 1024).toFixed(2);

        return {
            success: true,
            stats: {
                totalStaff,
                totalPatients,
                totalProcedures,
                completedProcedures,
                estimatedRevenue,
                storageGB
            }
        };
    } catch (error) {
        console.error("getAdminStats error:", error);
        return { success: false, error: "Failed to load stats" };
    }
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function getAllUsers() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
                createdAt: true,
                organization: {
                    select: { name: true }
                }
            }
        });

        return { success: true, users };
    } catch (error) {
        console.error("getAllUsers error:", error);
        return { success: false, error: "Failed to load users", users: [] };
    }
}

export async function createNewUser(data: {
    username: string;
    fullName: string;
    role: string;
    password: string;
}) {
    try {
        // Validate inputs
        if (!data.username?.trim() || !data.fullName?.trim()) {
            return { success: false, error: "Username and Full Name are required" };
        }

        if (!data.password || data.password.length < 6) {
            return { success: false, error: "Password must be at least 6 characters" };
        }

        // Check if username already exists
        const existing = await prisma.user.findUnique({
            where: { username: data.username }
        });

        if (existing) {
            return { success: false, error: "Username already taken" };
        }

        // Get default organization (first one)
        const org = await prisma.organization.findFirst();
        if (!org) {
            return { success: false, error: "No organization found. Please set up the system first." };
        }

        // Hash password
        const passwordHash = await hashPassword(data.password);

        // Create user
        const user = await prisma.user.create({
            data: {
                username: data.username.trim(),
                fullName: data.fullName.trim(),
                role: data.role || 'DOCTOR',
                passwordHash,
                organizationId: org.id
            }
        });

        revalidatePath('/admin');

        return {
            success: true,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role
            }
        };
    } catch (error) {
        console.error("createNewUser error:", error);
        return { success: false, error: "Failed to create user" };
    }
}

export async function removeUser(userId: string) {
    try {
        if (!userId) {
            return { success: false, error: "User ID is required" };
        }

        // Delete the user (hard delete for simplicity)
        await prisma.user.delete({
            where: { id: userId }
        });

        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error("removeUser error:", error);
        return { success: false, error: "Failed to remove user" };
    }
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export async function getAuditLogs(limit = 50) {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: limit
        });

        return { success: true, logs };
    } catch (error) {
        console.error("getAuditLogs error:", error);
        return { success: false, error: "Failed to load audit logs", logs: [] };
    }
}

// ============================================================================
// DATA MANAGEMENT
// ============================================================================

export async function purgeAllData() {
    try {
        // Delete in order of dependencies
        await prisma.shareToken.deleteMany({});
        await prisma.media.deleteMany({});
        await prisma.report.deleteMany({});
        await prisma.procedure.deleteMany({});
        await prisma.patient.deleteMany({});

        revalidatePath('/admin');
        revalidatePath('/doctor');
        revalidatePath('/assistant');

        return { success: true, message: "All patient data has been purged" };
    } catch (error) {
        console.error("purgeAllData error:", error);
        return { success: false, error: "Failed to purge data" };
    }
}

// ============================================================================
// SETTINGS MANAGEMENT
// ============================================================================

export async function updateUHIDConfig(orgId: string, config: {
    prefix: string;
    suffix: string;
    currentSerial: number;
    digits: number;
}) {
    try {
        if (!orgId) return { success: false, error: "Organization ID required" };

        await prisma.organization.update({
            where: { id: orgId },
            data: {
                uhidConfig: JSON.stringify(config)
            }
        });

        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error("updateUHIDConfig error:", error);
        return { success: false, error: "Failed to update settings" };
    }
}

export async function getUHIDConfig(orgId: string) {
    try {
        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: { uhidConfig: true }
        });

        if (org?.uhidConfig) {
            return { success: true, config: JSON.parse(org.uhidConfig) };
        }

        // Default config if none exists
        return {
            success: true,
            config: { prefix: "MRN-", suffix: "", currentSerial: 1000, digits: 6 }
        };
    } catch (error) {
        return { success: false, error: "Failed to fetch settings" };
    }
}
