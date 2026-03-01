/**
 * Storage Module - Main Export
 * 
 * Centralizes all storage-related functionality.
 */

// Path management
export {
    INTERNAL_PATHS,
    EXTERNAL_PATHS,
    ensureDirectoryExists,
    initializeInternalStorage,
    isUSBMounted,
    getCaptureFilePath,
    getThumbnailPath,
    getReportPath,
    getExportPath,
    getBackupPath,
    isPathAllowed,
    safeReadInternal,
    safeWriteInternal,
    safeDeleteInternal,
    clearTempFiles,
    getMediaUrl,
} from './paths';

// Export functions
export {
    canExport,
    exportPatientCSV,
    exportReportPDF,
    exportProcedureImages,
    createDatabaseBackup,
    listAvailableBackups,
    listImportableFiles,
    type ExportResult,
} from './export';
