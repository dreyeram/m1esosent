"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/security/jwt";

import { getSeededAdminId } from "@/app/actions/auth";


// Helper to get current user organization
async function getOrganizationId() {
    const token = (await cookies()).get('accessToken')?.value;
    if (token) {
        const decoded = verifyAccessToken(token);
        if (decoded?.organizationId) return decoded.organizationId;
    }

    // Fallback for dev/seeded admin if no token
    // In production, this should likely be stricter, but for this issue we allow it if we can verify it's an admin context or just default to the first org for the seeded admin
    const adminId = await getSeededAdminId();
    if (adminId) {
        const admin = await prisma.user.findUnique({
            where: { id: adminId },
            select: { organizationId: true }
        });
        return admin?.organizationId;
    }

    return null;
}

export async function getEquipment() {
    const orgId = await getOrganizationId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    try {
        const equipment = await prisma.equipment.findMany({
            where: { organizationId: orgId },
            orderBy: { name: 'asc' }
        });
        return { success: true, data: equipment };
    } catch (error) {
        console.error("Get Equipment Error:", error);
        return { success: false, error: "Failed to fetch equipment." };
    }
}

export async function createEquipment(data: {
    name: string;
    type: string;
    serialNumber?: string;
    modelNumber?: string;
    isDefault?: boolean;
    procedureTypes?: string[]; // Array of strings
}) {
    const orgId = await getOrganizationId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    try {
        await prisma.equipment.create({
            data: {
                name: data.name,
                type: data.type,
                serialNumber: data.serialNumber,
                modelNumber: data.modelNumber,
                isDefault: data.isDefault || false,
                procedureTypes: data.procedureTypes ? JSON.stringify(data.procedureTypes) : undefined,
                organizationId: orgId
            }
        });
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error("Create Equipment Error:", error);
        return { success: false, error: "Failed to create equipment." };
    }
}

export async function updateEquipment(id: string, data: {
    name?: string;
    type?: string;
    serialNumber?: string;
    modelNumber?: string;
    isDefault?: boolean;
    procedureTypes?: string[];
}) {
    const orgId = await getOrganizationId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    try {
        await prisma.equipment.update({
            where: { id },
            data: {
                ...data,
                procedureTypes: data.procedureTypes ? JSON.stringify(data.procedureTypes) : undefined
            }
        });
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error("Update Equipment Error:", error);
        return { success: false, error: "Failed to update equipment." };
    }
}

export async function deleteEquipment(id: string) {
    const orgId = await getOrganizationId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    try {
        await prisma.equipment.delete({
            where: { id }
        });
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error("Delete Equipment Error:", error);
        return { success: false, error: "Failed to delete equipment." };
    }
}
