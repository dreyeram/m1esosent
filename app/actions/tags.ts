"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/app/actions/auth";
import { revalidatePath } from "next/cache";

export async function getTags() {
    try {
        const session = await getCurrentSession();
        if (!session.success || !session.user) {
            return { success: false, error: "Unauthorized" };
        }

        const tags = await prisma.tag.findMany({
            where: {
                organizationId: session.user.orgId
            },
            orderBy: {
                label: 'asc'
            }
        });

        return { success: true, tags };
    } catch (error) {
        console.error("Get Tags Error:", error);
        return { success: false, error: "Failed to fetch tags" };
    }
}

export async function createTag(label: string, color: string = "#ef4444") {
    try {
        const session = await getCurrentSession();
        if (!session.success || !session.user) {
            return { success: false, error: "Unauthorized" };
        }

        const tag = await prisma.tag.create({
            data: {
                label,
                color,
                organizationId: session.user.orgId
            }
        });

        revalidatePath('/doctor');
        return { success: true, tag };
    } catch (error) {
        console.error("Create Tag Error:", error);
        return { success: false, error: "Failed to create tag" };
    }
}
