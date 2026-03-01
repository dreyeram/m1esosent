"use server";

import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

/**
 * Save report PDF to the filesystem (Raspberry Pi storage)
 * and update the database record.
 */
export async function saveReportPDF(procedureId: string, pdfBase64: string) {
    try {
        if (!procedureId || !pdfBase64) {
            return { success: false, error: "Missing procedureId or PDF data" };
        }

        // 1. Prepare directory
        const reportsDir = path.join(process.cwd(), "public", "reports");
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        // 2. Extract buffer from base64
        // The pdfBase64 might have a prefix like "data:application/pdf;base64,"
        const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // 3. Define filename and path
        const fileName = `report_${procedureId}.pdf`;
        const filePath = path.join(reportsDir, fileName);
        const relativePath = `/reports/${fileName}`;

        // 4. Write to file
        fs.writeFileSync(filePath, buffer);
        console.log(`Report saved to ${filePath}`);

        // 5. Update Report record in DB
        await prisma.report.update({
            where: { procedureId },
            data: {
                pdfPath: relativePath
            }
        });

        return { success: true, filePath: relativePath };
    } catch (error: any) {
        console.error("Save Report PDF Error:", error);
        return { success: false, error: error?.message || "Failed to save report PDF to disk" };
    }
}
