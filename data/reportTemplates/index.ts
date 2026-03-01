// Template Registry - Central registry for all ENT report templates
// ENT Solution Suite V1.0 - Cleaned for ENT-only functionality
import { ReportTemplate } from '@/types/reportTemplates';

// Import all ENT templates
import { NASAL_ENDOSCOPY_TEMPLATE, DNE_NORMAL_VALUES } from './nasalEndoscopy';
import {
    RIGID_LARYNGOSCOPY_TEMPLATE,
    FLEXIBLE_LARYNGOSCOPY_TEMPLATE,
    STROBOSCOPY_TEMPLATE,
    VL_RIGID_NORMAL_VALUES,
    VL_FLEXIBLE_NORMAL_VALUES,
    STROBOSCOPY_NORMAL_VALUES
} from './laryngoscopy';
import { OTOENDOSCOPY_TEMPLATE, OTOENDOSCOPY_NORMAL_VALUES } from './otoendoscopy';
import { SLEEP_APNEA_TEMPLATE, OSA_NORMAL_VALUES } from './sleepApnea';
import {
    PHARYNGOSCOPY_TEMPLATE,
    NASOPHARYNGOSCOPY_TEMPLATE,
    PHARYNGOSCOPY_NORMAL_VALUES,
    NASOPHARYNGOSCOPY_NORMAL_VALUES
} from './pharyngoscopy';

// Template Registry Map - ENT ONLY
export const REPORT_TEMPLATES: Record<string, ReportTemplate> = {
    // ===== ENT TEMPLATES =====

    // Nasal & Sinus
    'nasal_endoscopy': NASAL_ENDOSCOPY_TEMPLATE,
    'rhinoscopy': NASAL_ENDOSCOPY_TEMPLATE, // Alias
    'dne': NASAL_ENDOSCOPY_TEMPLATE, // DNE Alias

    // Laryngeal (Voice)
    'rigid_laryngoscopy': RIGID_LARYNGOSCOPY_TEMPLATE,
    'vl_rigid': RIGID_LARYNGOSCOPY_TEMPLATE,
    'direct_laryngoscopy': RIGID_LARYNGOSCOPY_TEMPLATE,
    'flexible_laryngoscopy': FLEXIBLE_LARYNGOSCOPY_TEMPLATE,
    'vl_flexible': FLEXIBLE_LARYNGOSCOPY_TEMPLATE,
    'indirect_laryngoscopy': FLEXIBLE_LARYNGOSCOPY_TEMPLATE,
    'stroboscopy': STROBOSCOPY_TEMPLATE,
    'videostroboscopy': STROBOSCOPY_TEMPLATE,

    // Otology (Ear)
    'otoendoscopy': OTOENDOSCOPY_TEMPLATE,
    'otoscopy': OTOENDOSCOPY_TEMPLATE,
    'oto': OTOENDOSCOPY_TEMPLATE,
    'ees': OTOENDOSCOPY_TEMPLATE, // Endoscopic Ear Surgery

    // Sleep Medicine
    'sleep_apnea': SLEEP_APNEA_TEMPLATE,
    'osa': SLEEP_APNEA_TEMPLATE,
    'dise': SLEEP_APNEA_TEMPLATE, // Drug-Induced Sleep Endoscopy

    // Pharynx
    'pharyngoscopy': PHARYNGOSCOPY_TEMPLATE,
    'nasopharyngoscopy': NASOPHARYNGOSCOPY_TEMPLATE,
};

// Normal Values Registry - ENT ONLY
export const NORMAL_VALUES: Record<string, Record<string, string | string[]>> = {
    // Nasal
    'nasal_endoscopy': DNE_NORMAL_VALUES,
    'rhinoscopy': DNE_NORMAL_VALUES,
    'dne': DNE_NORMAL_VALUES,

    // Laryngeal
    'rigid_laryngoscopy': VL_RIGID_NORMAL_VALUES,
    'vl_rigid': VL_RIGID_NORMAL_VALUES,
    'direct_laryngoscopy': VL_RIGID_NORMAL_VALUES,
    'flexible_laryngoscopy': VL_FLEXIBLE_NORMAL_VALUES,
    'vl_flexible': VL_FLEXIBLE_NORMAL_VALUES,
    'indirect_laryngoscopy': VL_FLEXIBLE_NORMAL_VALUES,
    'stroboscopy': STROBOSCOPY_NORMAL_VALUES,
    'videostroboscopy': STROBOSCOPY_NORMAL_VALUES,

    // Otology
    'otoendoscopy': OTOENDOSCOPY_NORMAL_VALUES,
    'otoscopy': OTOENDOSCOPY_NORMAL_VALUES,
    'oto': OTOENDOSCOPY_NORMAL_VALUES,
    'ees': OTOENDOSCOPY_NORMAL_VALUES,

    // Sleep
    'sleep_apnea': OSA_NORMAL_VALUES,
    'osa': OSA_NORMAL_VALUES,
    'dise': OSA_NORMAL_VALUES,

    // Pharynx
    'pharyngoscopy': PHARYNGOSCOPY_NORMAL_VALUES,
    'nasopharyngoscopy': NASOPHARYNGOSCOPY_NORMAL_VALUES,
};

/**
 * Get a report template by procedure ID
 */
export function getTemplate(procedureId: string): ReportTemplate | null {
    if (!procedureId) return null;

    // Try direct lookup
    if (REPORT_TEMPLATES[procedureId]) {
        return REPORT_TEMPLATES[procedureId];
    }

    // Try matching by checking if procedureId contains template key
    for (const key of Object.keys(REPORT_TEMPLATES)) {
        if (procedureId.toLowerCase().includes(key.toLowerCase())) {
            return REPORT_TEMPLATES[key];
        }
    }

    // Try to extract subtype from encoded procedure type (specialty:category:subtype)
    const parts = procedureId.split(':');
    if (parts.length === 3) {
        const subtypeId = parts[2];
        if (REPORT_TEMPLATES[subtypeId]) {
            return REPORT_TEMPLATES[subtypeId];
        }
    }

    return null;
}

/**
 * Get normal values for a procedure
 */
export function getNormalValues(procedureId: string): Record<string, string | string[]> | null {
    if (!procedureId) return null;

    // Try direct lookup
    if (NORMAL_VALUES[procedureId]) {
        return NORMAL_VALUES[procedureId];
    }

    // Try matching by subtype
    const parts = procedureId.split(':');
    if (parts.length === 3) {
        const subtypeId = parts[2];
        if (NORMAL_VALUES[subtypeId]) {
            return NORMAL_VALUES[subtypeId];
        }
    }

    return null;
}

/**
 * Get all available templates
 */
export function getAllTemplates(): ReportTemplate[] {
    const uniqueTemplates = new Map<string, ReportTemplate>();

    for (const template of Object.values(REPORT_TEMPLATES)) {
        uniqueTemplates.set(template.id, template);
    }

    return Array.from(uniqueTemplates.values());
}

/**
 * Get templates by specialty
 */
export function getTemplatesBySpecialty(specialty: string): ReportTemplate[] {
    return getAllTemplates().filter(t =>
        t.specialty.toLowerCase() === specialty.toLowerCase()
    );
}

/**
 * Map a procedure type string to a template
 * Handles various formats: "subtype_id", "specialty:category:subtype", display names
 */
export function resolveTemplate(procedureType: string): ReportTemplate | null {
    if (!procedureType) return null;

    // 1. Direct match
    let template = getTemplate(procedureType);
    if (template) return template;

    // 2. Try lowercase
    template = getTemplate(procedureType.toLowerCase());
    if (template) return template;

    // 3. Try underscore conversion (e.g., "Nasal Endoscopy" -> "nasal_endoscopy")
    const underscored = procedureType.toLowerCase().replace(/\s+/g, '_');
    template = getTemplate(underscored);
    if (template) return template;

    // 4. Check display name match
    for (const t of getAllTemplates()) {
        if (t.name.toLowerCase() === procedureType.toLowerCase() ||
            t.shortName.toLowerCase() === procedureType.toLowerCase()) {
            return t;
        }
    }

    return null;
}

// Re-export all ENT templates for direct access
export {
    // Nasal
    NASAL_ENDOSCOPY_TEMPLATE,
    // Laryngeal
    RIGID_LARYNGOSCOPY_TEMPLATE,
    FLEXIBLE_LARYNGOSCOPY_TEMPLATE,
    STROBOSCOPY_TEMPLATE,
    // Otology
    OTOENDOSCOPY_TEMPLATE,
    // Sleep
    SLEEP_APNEA_TEMPLATE,
    // Pharynx
    PHARYNGOSCOPY_TEMPLATE,
    NASOPHARYNGOSCOPY_TEMPLATE,
};
