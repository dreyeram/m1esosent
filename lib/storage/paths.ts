/**
 * Storage Path Configuration - Medical Grade
 * 
 * Centralized path management for internal (hidden) and external (USB) storage.
 * Internal storage is never exposed to the user.
 */

import path from 'path';
import fs from 'fs';

/**
 * Base paths - configured for Pi5 deployment
 */
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// On Pi5, these will be encrypted partitions
const INTERNAL_BASE = IS_PRODUCTION
    ? '/data'
    : process.env.INTERNAL_STORAGE_PATH || './data';

const EXTERNAL_BASE = IS_PRODUCTION
    ? '/media/usb'
    : process.env.EXTERNAL_STORAGE_PATH || './usb-mock';

/**
 * Internal storage paths (NEVER exposed to user)
 */
export const INTERNAL_PATHS = {
    /** Root of internal storage */
    root: INTERNAL_BASE,

    /** SQLite/SQLCipher database */
    database: path.join(INTERNAL_BASE, 'db', 'endoscopy.db'),

    /** Media storage (images, videos) */
    media: path.join(INTERNAL_BASE, 'media'),

    /** Captured images */
    images: path.join(INTERNAL_BASE, 'media', 'images'),

    /** Recorded videos */
    videos: path.join(INTERNAL_BASE, 'media', 'videos'),

    /** Thumbnails */
    thumbnails: path.join(INTERNAL_BASE, 'media', 'thumbnails'),

    /** Generated reports (PDFs) */
    reports: path.join(INTERNAL_BASE, 'reports'),

    /** Application configuration */
    config: path.join(INTERNAL_BASE, 'config'),

    /** Audit logs (append-only) */
    logs: path.join(INTERNAL_BASE, 'logs'),

    /** Temporary files (cleared on startup) */
    temp: path.join(INTERNAL_BASE, 'temp'),

    /** Organization assets (logos, letterheads) */
    assets: path.join(INTERNAL_BASE, 'assets'),

    /** User signatures */
    signatures: path.join(INTERNAL_BASE, 'assets', 'signatures'),
} as const;

/**
 * External storage paths (USB only)
 */
export const EXTERNAL_PATHS = {
    /** Root of external storage (USB mount point) */
    root: EXTERNAL_BASE,

    /** Encrypted database backups */
    backups: path.join(EXTERNAL_BASE, 'backups'),

    /** Exported patient data (CSV, PDF) */
    exports: path.join(EXTERNAL_BASE, 'exports'),

    /** Data to import */
    imports: path.join(EXTERNAL_BASE, 'imports'),
} as const;

/**
 * Ensure a directory exists
 */
export function ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Initialize all internal storage directories
 */
export function initializeInternalStorage(): void {
    Object.values(INTERNAL_PATHS).forEach((dirPath) => {
        // Don't create the database file, only directories
        if (!dirPath.endsWith('.db')) {
            ensureDirectoryExists(dirPath);
        } else {
            // Ensure parent directory of database exists
            ensureDirectoryExists(path.dirname(dirPath));
        }
    });
}

/**
 * Check if USB storage is mounted
 */
export function isUSBMounted(): boolean {
    try {
        // Check if the USB mount point exists and is a directory
        const stats = fs.statSync(EXTERNAL_PATHS.root);
        if (!stats.isDirectory()) return false;

        // Check if it's actually mounted (has content or is writable)
        const testFile = path.join(EXTERNAL_PATHS.root, '.mount-check');
        try {
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            return true;
        } catch {
            // Can't write - not properly mounted
            return false;
        }
    } catch {
        return false;
    }
}

/**
 * Get path for a new capture file
 */
export function getCaptureFilePath(type: 'image' | 'video', procedureId: string): string {
    const timestamp = Date.now();
    const extension = type === 'image' ? 'jpg' : 'webm';
    const subdir = type === 'image' ? INTERNAL_PATHS.images : INTERNAL_PATHS.videos;

    ensureDirectoryExists(subdir);

    return path.join(subdir, `${procedureId}_${timestamp}.${extension}`);
}

/**
 * Get path for a thumbnail
 */
export function getThumbnailPath(originalPath: string): string {
    const basename = path.basename(originalPath, path.extname(originalPath));
    ensureDirectoryExists(INTERNAL_PATHS.thumbnails);
    return path.join(INTERNAL_PATHS.thumbnails, `${basename}_thumb.jpg`);
}

/**
 * Get path for generated report PDF
 */
export function getReportPath(procedureId: string): string {
    ensureDirectoryExists(INTERNAL_PATHS.reports);
    return path.join(INTERNAL_PATHS.reports, `report_${procedureId}.pdf`);
}

/**
 * Get export path on USB
 * @throws Error if USB is not mounted
 */
export function getExportPath(filename: string): string {
    if (!isUSBMounted()) {
        throw new Error('USB storage not mounted. Please insert a USB drive.');
    }

    ensureDirectoryExists(EXTERNAL_PATHS.exports);
    return path.join(EXTERNAL_PATHS.exports, filename);
}

/**
 * Get backup path on USB
 * @throws Error if USB is not mounted
 */
export function getBackupPath(filename: string): string {
    if (!isUSBMounted()) {
        throw new Error('USB storage not mounted. Please insert a USB drive.');
    }

    ensureDirectoryExists(EXTERNAL_PATHS.backups);
    return path.join(EXTERNAL_PATHS.backups, filename);
}

/**
 * Validate that a path is within allowed directories
 * Prevents path traversal attacks
 */
export function isPathAllowed(filePath: string, allowedBase: string): boolean {
    const resolvedPath = path.resolve(filePath);
    const resolvedBase = path.resolve(allowedBase);
    return resolvedPath.startsWith(resolvedBase);
}

/**
 * Safely read a file from internal storage
 * @throws Error if path is not within internal storage
 */
export function safeReadInternal(filePath: string): Buffer {
    if (!isPathAllowed(filePath, INTERNAL_PATHS.root)) {
        throw new Error('Access denied: Path outside internal storage');
    }
    return fs.readFileSync(filePath);
}

/**
 * Safely write a file to internal storage
 * @throws Error if path is not within internal storage
 */
export function safeWriteInternal(filePath: string, data: Buffer | string): void {
    if (!isPathAllowed(filePath, INTERNAL_PATHS.root)) {
        throw new Error('Access denied: Path outside internal storage');
    }
    ensureDirectoryExists(path.dirname(filePath));
    fs.writeFileSync(filePath, data);
}

/**
 * Safely delete a file from internal storage
 * @throws Error if path is not within internal storage
 */
export function safeDeleteInternal(filePath: string): void {
    if (!isPathAllowed(filePath, INTERNAL_PATHS.root)) {
        throw new Error('Access denied: Path outside internal storage');
    }
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

/**
 * Clear temporary files
 */
export function clearTempFiles(): void {
    const tempDir = INTERNAL_PATHS.temp;
    if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
            const filePath = path.join(tempDir, file);
            try {
                fs.unlinkSync(filePath);
            } catch {
                // Ignore errors during cleanup
            }
        }
    }
}

/**
 * Convert internal path to URL for serving
 * This is the ONLY way media should be served
 */
export function getMediaUrl(internalPath: string): string {
    // Verify the path is within media directory
    if (!isPathAllowed(internalPath, INTERNAL_PATHS.media)) {
        throw new Error('Access denied: Not a media file');
    }

    // Convert to relative path for API serving
    const relativePath = path.relative(INTERNAL_PATHS.media, internalPath);
    return `/api/storage/media/${encodeURIComponent(relativePath)}`;
}
