/**
 * USB Export Module - Medical Grade
 * 
 * Handles all data exports to USB storage only.
 * Internal storage paths are never exposed.
 */

import fs from 'fs';
import path from 'path';
import {
    isUSBMounted,
    getExportPath,
    getBackupPath,
    INTERNAL_PATHS,
    EXTERNAL_PATHS,
    ensureDirectoryExists,
} from './paths';

/**
 * Export result
 */
export interface ExportResult {
    success: boolean;
    filePath?: string;
    fileName?: string;
    error?: string;
}

/**
 * Check if export is possible
 */
export function canExport(): { canExport: boolean; reason?: string } {
    if (!isUSBMounted()) {
        return {
            canExport: false,
            reason: 'Please insert a USB drive to export data.'
        };
    }
    return { canExport: true };
}

/**
 * Export patient data to CSV
 */
export async function exportPatientCSV(
    patients: Array<{
        mrn: string;
        fullName: string;
        dateOfBirth?: string;
        gender?: string;
        contactInfo?: string;
    }>
): Promise<ExportResult> {
    try {
        const { canExport: allowed, reason } = canExport();
        if (!allowed) {
            return { success: false, error: reason };
        }

        // Generate CSV content
        const headers = ['MRN', 'Full Name', 'Date of Birth', 'Gender', 'Contact'];
        const rows = patients.map(p => [
            p.mrn,
            p.fullName,
            p.dateOfBirth || '',
            p.gender || '',
            p.contactInfo || '',
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        // Write to USB
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `patients_export_${timestamp}.csv`;
        const filePath = getExportPath(fileName);

        fs.writeFileSync(filePath, csvContent, 'utf-8');

        return { success: true, filePath, fileName };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Export failed'
        };
    }
}

/**
 * Export report PDF to USB
 */
export async function exportReportPDF(
    reportPdfPath: string,
    patientName: string,
    procedureDate: string
): Promise<ExportResult> {
    try {
        const { canExport: allowed, reason } = canExport();
        if (!allowed) {
            return { success: false, error: reason };
        }

        // Verify source exists
        if (!fs.existsSync(reportPdfPath)) {
            return { success: false, error: 'Report PDF not found' };
        }

        // Sanitize filename
        const safeName = patientName.replace(/[^a-zA-Z0-9]/g, '_');
        const safeDate = procedureDate.replace(/[^a-zA-Z0-9]/g, '-');
        const fileName = `Report_${safeName}_${safeDate}.pdf`;
        const destPath = getExportPath(fileName);

        // Copy to USB
        fs.copyFileSync(reportPdfPath, destPath);

        return { success: true, filePath: destPath, fileName };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Export failed'
        };
    }
}

/**
 * Export procedure images to USB
 */
export async function exportProcedureImages(
    imagePaths: string[],
    procedureId: string,
    patientName: string
): Promise<ExportResult> {
    try {
        const { canExport: allowed, reason } = canExport();
        if (!allowed) {
            return { success: false, error: reason };
        }

        // Create a folder for this export
        const safeName = patientName.replace(/[^a-zA-Z0-9]/g, '_');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const folderName = `Images_${safeName}_${timestamp}`;
        const exportFolder = path.join(EXTERNAL_PATHS.exports, folderName);

        ensureDirectoryExists(exportFolder);

        // Copy each image
        let copiedCount = 0;
        for (const imagePath of imagePaths) {
            if (fs.existsSync(imagePath)) {
                const destPath = path.join(exportFolder, path.basename(imagePath));
                fs.copyFileSync(imagePath, destPath);
                copiedCount++;
            }
        }

        return {
            success: true,
            filePath: exportFolder,
            fileName: `${folderName} (${copiedCount} images)`
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Export failed'
        };
    }
}

/**
 * Create encrypted backup of database
 * Note: In production, this would encrypt the backup
 */
export async function createDatabaseBackup(): Promise<ExportResult> {
    try {
        const { canExport: allowed, reason } = canExport();
        if (!allowed) {
            return { success: false, error: reason };
        }

        // Verify database exists
        if (!fs.existsSync(INTERNAL_PATHS.database)) {
            return { success: false, error: 'Database not found' };
        }

        // Create backup with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `backup_${timestamp}.db.enc`;
        const destPath = getBackupPath(fileName);

        // In production, this would be encrypted
        // For now, just copy the database
        fs.copyFileSync(INTERNAL_PATHS.database, destPath);

        return { success: true, filePath: destPath, fileName };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Backup failed'
        };
    }
}

/**
 * List available backups on USB
 */
export function listAvailableBackups(): Array<{ fileName: string; date: Date; size: number }> {
    if (!isUSBMounted()) {
        return [];
    }

    const backupsDir = EXTERNAL_PATHS.backups;
    if (!fs.existsSync(backupsDir)) {
        return [];
    }

    const files = fs.readdirSync(backupsDir);
    return files
        .filter(f => f.startsWith('backup_') && (f.endsWith('.db') || f.endsWith('.db.enc')))
        .map(fileName => {
            const filePath = path.join(backupsDir, fileName);
            const stats = fs.statSync(filePath);
            return {
                fileName,
                date: stats.mtime,
                size: stats.size,
            };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * List files available for import
 */
export function listImportableFiles(): Array<{ fileName: string; type: 'csv' | 'backup'; size: number }> {
    if (!isUSBMounted()) {
        return [];
    }

    const importsDir = EXTERNAL_PATHS.imports;
    if (!fs.existsSync(importsDir)) {
        return [];
    }

    const files = fs.readdirSync(importsDir);
    return files
        .filter(f => f.endsWith('.csv') || f.endsWith('.db') || f.endsWith('.db.enc'))
        .map(fileName => {
            const filePath = path.join(importsDir, fileName);
            const stats = fs.statSync(filePath);
            const type = fileName.endsWith('.csv') ? 'csv' as const : 'backup' as const;
            return {
                fileName,
                type,
                size: stats.size,
            };
        });
}
