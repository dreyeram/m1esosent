import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

/**
 * POST /api/settings/upload
 * Purpose: Upload for profile pictures, logos, and signatures.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { data, type, userId, organizationId } = body;

        if (!data || !type) {
            return NextResponse.json({ success: false, error: "Missing data or type" }, { status: 400 });
        }

        // Determine directory based on type
        // types: PROFILE_PICTURE, ORG_LOGO, SIGNATURE
        let subDir = "others";
        if (type === "PROFILE_PICTURE") subDir = "profiles";
        else if (type === "ORG_LOGO") subDir = "logos";
        else if (type === "SIGNATURE") subDir = "signatures";

        const uploadsDir = path.join(process.cwd(), "uploads", subDir);
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Determine extension
        let ext = "jpg";
        if (data.startsWith("data:image/png")) ext = "png";
        else if (data.startsWith("data:image/webp")) ext = "webp";

        // Generate filename
        const identifier = userId || organizationId || Date.now();
        const filename = `${subDir}_${identifier}_${Date.now()}.${ext}`;
        const filePath = path.join(uploadsDir, filename);

        // Save file
        const base64Data = data.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        fs.writeFileSync(filePath, buffer);

        const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");

        return NextResponse.json({
            success: true,
            filePath: relativePath,
        });
    } catch (error: any) {
        console.error("Settings upload error:", error);
        return NextResponse.json({ success: false, error: error?.message || "Upload failed" }, { status: 500 });
    }
}
