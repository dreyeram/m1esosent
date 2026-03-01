"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- Organization Settings ---

export async function getOrganizationSettings(orgId: string) {
    try {
        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: {
                id: true,
                name: true,
                type: true,
                logoPath: true,
                address: true,
                mobile: true,
                contactEmail: true,
                letterheadConfig: true,
                smtpConfig: true,
            }
        });
        return { success: true, organization: org };
    } catch (error) {
        console.error("Get Organization Error:", error);
        return { success: false, error: "Failed to fetch organization settings." };
    }
}

export async function updateOrganizationSettings(data: {
    id: string;
    name?: string;
    type?: string;
    logoPath?: string;
    address?: string;
    mobile?: string;
    contactEmail?: string;
    letterheadConfig?: string;
    smtpConfig?: string;
}) {
    try {
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.type) updateData.type = data.type;
        if (data.logoPath !== undefined) updateData.logoPath = data.logoPath;
        if (data.address !== undefined) updateData.address = data.address;
        if (data.mobile !== undefined) updateData.mobile = data.mobile;
        if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail;
        if (data.letterheadConfig) updateData.letterheadConfig = data.letterheadConfig;
        if (data.smtpConfig !== undefined) updateData.smtpConfig = data.smtpConfig;

        const org = await prisma.organization.update({
            where: { id: data.id },
            data: updateData,
        });

        revalidatePath('/doctor');
        revalidatePath('/assistant');
        revalidatePath('/admin');

        return { success: true, organization: org };
    } catch (error: any) {
        console.error("Update Organization Error:", error);
        return { success: false, error: error?.message || "Failed to update organization settings." };
    }
}

// --- User Profile ---

export async function getUserProfile(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { organization: true }
        });
        return { success: true, user };
    } catch (error) {
        console.error("Get User Profile Error:", error);
        return { success: false, error: "Failed to fetch user profile." };
    }
}

export async function updateUserProfile(data: {
    userId: string;
    fullName?: string;
    degree?: string;
    contactDetails?: string;
    signaturePath?: string;
    profilePicturePath?: string;
}) {
    try {
        const updateData: any = {};
        if (data.fullName) updateData.fullName = data.fullName;
        if (data.degree !== undefined) updateData.degree = data.degree;
        if (data.contactDetails) updateData.contactDetails = data.contactDetails;
        if (data.signaturePath !== undefined) updateData.signaturePath = data.signaturePath;
        if (data.profilePicturePath !== undefined) updateData.profilePicturePath = data.profilePicturePath;

        const user = await prisma.user.update({
            where: { id: data.userId },
            data: updateData,
        });

        revalidatePath('/doctor');
        revalidatePath('/assistant');
        revalidatePath('/admin');

        return { success: true, user };
    } catch (error) {
        console.error("Update User Profile Error:", error);
        return { success: false, error: "Failed to update user profile." };
    }
}

// --- Get Current User (by username for session) ---

export async function getCurrentUser(username: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { username },
            include: { organization: true }
        });
        return { success: true, user };
    } catch (error) {
        console.error("Get Current User Error:", error);
        return { success: false, error: "Failed to fetch current user." };
    }
}

// --- Danger Zone PIN ---

export async function setDangerZonePin(userId: string, pin: string) {
    try {
        if (pin.length < 4 || pin.length > 6) {
            return { success: false, error: "PIN must be 4-6 digits" };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { dangerZonePin: pin }
        });

        return { success: true };
    } catch (error) {
        console.error("Set PIN Error:", error);
        return { success: false, error: "Failed to set Danger Zone PIN" };
    }
}

export async function verifyDangerZonePin(userId: string, pin: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { dangerZonePin: true }
        });

        if (!user?.dangerZonePin) {
            return { success: false, valid: false, error: "No PIN set. Please set a PIN in your profile first.", needsSetup: true };
        }

        if (user.dangerZonePin !== pin) {
            return { success: false, valid: false, error: "Incorrect PIN" };
        }

        return { success: true, valid: true };
    } catch (error) {
        console.error("Verify PIN Error:", error);
        return { success: false, valid: false, error: "Failed to verify PIN" };
    }
}

export async function hasDangerZonePin(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { dangerZonePin: true }
        });
        return { success: true, hasPin: !!user?.dangerZonePin };
    } catch (error) {
        return { success: false, hasPin: false };
    }
}

// --- Soft Delete (Move to Trash) ---

export async function softDeletePatient(patientId: string) {
    try {
        await prisma.patient.update({
            where: { id: patientId },
            data: { deletedAt: new Date() }
        });

        revalidatePath('/doctor');
        revalidatePath('/assistant');

        return { success: true };
    } catch (error) {
        console.error("Soft Delete Error:", error);
        return { success: false, error: "Failed to move patient to trash" };
    }
}

export async function softDeleteMultiplePatients(patientIds: string[]) {
    try {
        await prisma.patient.updateMany({
            where: { id: { in: patientIds } },
            data: { deletedAt: new Date() }
        });

        revalidatePath('/doctor');
        revalidatePath('/assistant');

        return { success: true, count: patientIds.length };
    } catch (error) {
        console.error("Bulk Soft Delete Error:", error);
        return { success: false, error: "Failed to move patients to trash" };
    }
}

// --- Restore from Trash ---

export async function restorePatient(patientId: string) {
    try {
        await prisma.patient.update({
            where: { id: patientId },
            data: { deletedAt: null }
        });

        revalidatePath('/doctor');
        revalidatePath('/assistant');

        return { success: true };
    } catch (error) {
        console.error("Restore Patient Error:", error);
        return { success: false, error: "Failed to restore patient" };
    }
}

// --- Get Trashed Patients ---

export async function getTrashedPatients() {
    try {
        const patients = await prisma.patient.findMany({
            where: { deletedAt: { not: null } },
            include: {
                procedures: {
                    include: {
                        report: { select: { id: true } },
                        media: { select: { id: true } }
                    }
                }
            },
            orderBy: { deletedAt: 'desc' }
        });

        return { success: true, patients };
    } catch (error) {
        console.error("Get Trashed Error:", error);
        return { success: false, error: "Failed to fetch trashed patients" };
    }
}

// --- Permanent Delete (from Trash only) ---

export async function permanentDeletePatient(patientId: string) {
    try {
        // First verify patient is already in trash
        const patient = await prisma.patient.findUnique({
            where: { id: patientId },
            select: { deletedAt: true }
        });

        if (!patient?.deletedAt) {
            return { success: false, error: "Patient must be in trash before permanent deletion" };
        }

        // Get all procedures
        const procedures = await prisma.procedure.findMany({
            where: { patientId },
            select: { id: true }
        });

        const procedureIds = procedures.map((p: { id: string }) => p.id);

        // Delete cascade: Reports -> Media -> Procedures -> Patient
        if (procedureIds.length > 0) {
            await prisma.report.deleteMany({
                where: { procedureId: { in: procedureIds } }
            });

            await prisma.media.deleteMany({
                where: { procedureId: { in: procedureIds } }
            });

            await prisma.procedure.deleteMany({
                where: { patientId }
            });
        }

        await prisma.patient.delete({
            where: { id: patientId }
        });

        revalidatePath('/doctor');
        return { success: true };
    } catch (error) {
        console.error("Permanent Delete Error:", error);
        return { success: false, error: "Failed to permanently delete patient" };
    }
}

// --- Get First Org for Default (single-org mode) ---

export async function getDefaultOrganization() {
    try {
        const org = await prisma.organization.findFirst({
            orderBy: { createdAt: 'asc' }
        });
        return { success: true, organization: org };
    } catch (error) {
        console.error("Get Default Org Error:", error);
        return { success: false, error: "Failed to fetch organization." };
    }
}

// --- Delete All Patients (Danger Zone) ---

export async function deleteAllPatients() {
    try {
        // Get all patients
        const patients = await prisma.patient.findMany({
            select: { id: true }
        });

        const patientIds = patients.map((p: { id: string }) => p.id);

        if (patientIds.length === 0) {
            return { success: true, count: 0 };
        }

        // Get all procedures
        const procedures = await prisma.procedure.findMany({
            where: { patientId: { in: patientIds } },
            select: { id: true }
        });

        const procedureIds = procedures.map((p: { id: string }) => p.id);

        // Delete in order: ShareTokens -> Reports -> Media -> Procedures -> Patients
        if (procedureIds.length > 0) {
            await prisma.shareToken.deleteMany({
                where: { procedureId: { in: procedureIds } }
            });

            await prisma.report.deleteMany({
                where: { procedureId: { in: procedureIds } }
            });

            await prisma.media.deleteMany({
                where: { procedureId: { in: procedureIds } }
            });

            await prisma.procedure.deleteMany({
                where: { id: { in: procedureIds } }
            });
        }

        await prisma.patient.deleteMany({});

        revalidatePath('/doctor');
        revalidatePath('/assistant');

        return { success: true, count: patientIds.length };
    } catch (error) {
        console.error("Delete All Patients Error:", error);
        return { success: false, error: "Failed to delete all patients" };
    }
}


