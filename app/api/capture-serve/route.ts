import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

/**
 * GET /api/capture-serve?path=uploads/captures/<procedureId>/capture_123.jpg
 * Serves captured images from disk — async I/O to avoid blocking event loop on Pi 5
 */
export async function GET(req: NextRequest) {
    try {
        const filePath = req.nextUrl.searchParams.get("path");
        if (!filePath) {
            return NextResponse.json({ error: "No path provided" }, { status: 400 });
        }

        // Resolve to absolute path from project root
        // Windows Fix: Ensure path uses forward slashes for internal logic, 
        // but resolve correctly for the filesystem
        const cleanPath = filePath.replace(/\\/g, '/');
        const normalizedPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
        const absolutePath = path.resolve(process.cwd(), normalizedPath);

        console.log(`[capture-serve] Resolving: ${filePath} -> ${absolutePath}`);
        console.log(`[capture-serve] CWD: ${process.cwd()}`);

        // Security: ensure the file is within the uploads directory
        const uploadsDir = path.resolve(process.cwd(), "uploads");

        // Case-insensitive check for Windows and absolute path validation
        const relative = path.relative(uploadsDir, absolutePath);
        const isSafe = relative && !relative.startsWith('..') && !path.isAbsolute(relative);

        if (!isSafe) {
            console.warn(`Access denied to: ${absolutePath}`);
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Check file existence (async)
        try {
            await fs.access(absolutePath);
        } catch {
            // Log missing files for easier debugging
            console.error(`File not found: ${absolutePath}`);
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // Read file (async — does not block event loop)
        const fileBuffer = await fs.readFile(absolutePath);

        // Determine content type
        const ext = path.extname(absolutePath).toLowerCase();
        const contentTypes: Record<string, string> = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".webm": "video/webm",
            ".mp4": "video/mp4",
        };
        const contentType = contentTypes[ext] || "application/octet-stream";

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error: any) {
        console.error("Capture serve error:", error);
        return NextResponse.json({ error: error?.message || "Failed to serve file" }, { status: 500 });
    }
}
