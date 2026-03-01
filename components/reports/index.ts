// Report Components Index
// Export all report-related components for easy imports

export { TagField, TextField } from './TagField';
export { DynamicReportEditor } from './DynamicReportEditor';
export { ImageGallery } from './ImageGallery';

// Re-export template utilities
export {
    getTemplate,
    getNormalValues,
    getAllTemplates,
    getTemplatesBySpecialty,
    resolveTemplate,
    REPORT_TEMPLATES
} from '@/data/reportTemplates';
