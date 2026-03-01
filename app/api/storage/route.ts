
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const copyFile = promisify(fs.copyFile);

// Helper to get drives (Windows/Linux compat)
async function getDrives() {
    if (process.platform === 'win32') {
        const drives = [];
        // Simple check for common drive letters
        for (const letter of "DEFGHIJKLMNOPQRSTUVWXYZ".split("")) {
            try {
                const root = `${letter}:\\`;
                await fs.promises.access(root);
                drives.push({ name: `${letter}:`, path: root, type: 'drive' });
            } catch (e) { }
        }
        return drives;
    } else {
        // Linux / Raspberry Pi: Look in /media/pi
        const mediaPath = '/media/pi';
        try {
            const mounts = await readdir(mediaPath);
            return mounts.map(m => ({
                name: m,
                path: path.join(mediaPath, m),
                type: 'drive'
            }));
        } catch (e) {
            return [];
        }
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const dirPath = searchParams.get('path');

    try {
        if (!dirPath || dirPath === 'root') {
            const drives = await getDrives();
            return NextResponse.json({ success: true, items: drives });
        }

        // Security Check: prevent accessing critical system paths? 
        // For now, we trust the local user/admin.

        const files = await readdir(dirPath);
        const items = await Promise.all(files.map(async (file) => {
            try {
                const fullPath = path.join(dirPath, file);
                const stats = await stat(fullPath);
                return {
                    name: file,
                    path: fullPath,
                    type: stats.isDirectory() ? 'directory' : 'file',
                    size: stats.size,
                    mtime: stats.mtime
                };
            } catch (e) {
                return null;
            }
        }));

        return NextResponse.json({ success: true, items: items.filter(Boolean) });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, sourcePath, destPath } = body;

        if (action === 'copy') {
            // Ensure destination directory exists
            const destDir = path.dirname(destPath);
            if (!fs.existsSync(destDir)) {
                await fs.promises.mkdir(destDir, { recursive: true });
            }

            await copyFile(sourcePath, destPath);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
