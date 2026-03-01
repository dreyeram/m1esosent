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

export async function getMedicines() {
    try {
        const orgId = await getOrganizationId();
        if (!orgId) return { success: false, error: "Unauthorized" };

        const medicines = await prisma.medicine.findMany({
            where: { organizationId: orgId },
            orderBy: { name: 'asc' }
        });
        return { success: true, medicines };
    } catch (error) {
        console.error("Get Medicines Error:", error);
        return { success: false, error: "Failed to fetch medicines." };
    }
}

export async function addMedicine(data: {
    name: string;
    composition?: string;
    strength?: string;
    category?: string;
    dosageForm?: string;
    description?: string;
    organizationId: string;
}) {
    try {
        const medicine = await prisma.medicine.create({
            data: {
                name: data.name,
                composition: data.composition,
                strength: data.strength,
                category: data.category,
                dosageForm: data.dosageForm,
                description: data.description,
                organizationId: data.organizationId
            }
        });

        revalidatePath('/admin');
        return { success: true, medicine };
    } catch (error) {
        console.error("Add Medicine Error:", error);
        return { success: false, error: "Failed to add medicine." };
    }
}

export async function updateMedicine(id: string, data: {
    name?: string;
    composition?: string;
    strength?: string;
    category?: string;
    dosageForm?: string;
    description?: string;
}) {
    try {
        const medicine = await prisma.medicine.update({
            where: { id },
            data
        });

        revalidatePath('/admin');
        return { success: true, medicine };
    } catch (error) {
        console.error("Update Medicine Error:", error);
        return { success: false, error: "Failed to update medicine." };
    }
}

export async function deleteMedicine(id: string) {
    try {
        await prisma.medicine.delete({
            where: { id }
        });

        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error("Delete Medicine Error:", error);
        return { success: false, error: "Failed to delete medicine." };
    }
}
