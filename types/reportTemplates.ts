// Report Template Type Definitions
// Defines the structure for procedure-specific report templates

/**
 * Field types for report template fields
 */
export type ReportFieldType =
    | 'text'           // Free text input
    | 'textarea'       // Multi-line text
    | 'select'         // Single selection dropdown
    | 'multiselect'    // Multiple selection tags
    | 'radio'          // Radio button group
    | 'bilateral'      // Right/Left values
    | 'number'         // Numeric input
    | 'checkbox';      // Boolean toggle

/**
 * Individual field definition within a report section
 */
export interface ReportField {
    id: string;
    label: string;
    type: ReportFieldType;
    options?: string[];           // For select/multiselect
    defaultValue?: string | string[] | boolean | number;
    normalValue?: string | string[];  // Value for "Normal" macro
    placeholder?: string;
    required?: boolean;
    width?: 'full' | 'half' | 'third' | 'quarter';  // Layout width
    showIf?: {                    // Conditional display
        fieldId: string;
        value: string | string[];
    };
}

/**
 * Section within a report (e.g., "Septum", "Findings")
 */
export interface ReportSection {
    id: string;
    title: string;
    icon?: string;                // Emoji or icon name
    fields: ReportField[];
    collapsible?: boolean;
    defaultCollapsed?: boolean;
}

/**
 * Complete report template for a procedure type
 */
export interface ReportTemplate {
    id: string;                   // Matches procedure subtype ID
    name: string;                 // Display name (e.g., "Diagnostic Nasal Endoscopy")
    shortName: string;            // Short name for tabs (e.g., "DNE")
    specialty: string;            // ENT, GI, etc.
    sections: ReportSection[];
    pdfLayout: 'standard' | 'detailed' | 'compact';
    imageCount: 4 | 6;            // Number of images in report
    normalMacroLabel?: string;    // Label for normal button (e.g., "Normal DNE")
}

/**
 * Report data structure (saved to database)
 */
export interface ReportData {
    templateId: string;
    values: Record<string, string | string[] | boolean | number>;
    images: ReportImage[];
    impression: string;
    plan: string[];
    createdAt: string;
    updatedAt: string;
}

/**
 * Image in a report
 */
export interface ReportImage {
    id: string;
    url: string;
    caption: string;
    position: number;             // 1-6
}

/**
 * Template registry lookup result
 */
export interface TemplateRegistry {
    getTemplate(procedureId: string): ReportTemplate | null;
    getAllTemplates(): ReportTemplate[];
    getTemplatesBySpecialty(specialty: string): ReportTemplate[];
}

// Helper function to create a field
export function createField(
    id: string,
    label: string,
    type: ReportFieldType,
    options?: string[],
    config?: Partial<ReportField>
): ReportField {
    return {
        id,
        label,
        type,
        options,
        ...config
    };
}

// Helper function to create a section
export function createSection(
    id: string,
    title: string,
    fields: ReportField[],
    config?: Partial<ReportSection>
): ReportSection {
    return {
        id,
        title,
        fields,
        collapsible: true,
        ...config
    };
}

// Common field presets for reuse across templates
export const COMMON_FIELDS = {
    indication: createField('indication', 'Indication', 'textarea', undefined, {
        placeholder: 'Reason for procedure...',
        required: true,
        width: 'full'
    }),

    preparation: createField('preparation', 'Procedure Preparation', 'multiselect', [
        'Topical decongestant used',
        'Lignocaine spray used',
        'Procedure well tolerated',
        'Patient cooperative',
        'Mild discomfort',
        'NA'
    ], {
        normalValue: ['Topical decongestant used', 'Lignocaine spray used', 'Procedure well tolerated']
    }),

    impression: createField('impression', 'Impression', 'textarea', undefined, {
        placeholder: 'Final impression...',
        required: true,
        width: 'full'
    }),

    plan: createField('plan', 'Plan', 'multiselect', [
        'Medical management',
        'Antibiotics advised',
        'Nasal spray advised',
        'Voice therapy advised',
        'Surgery recommended',
        'Biopsy recommended',
        'CT scan advised',
        'MRI advised',
        'Audiometry advised',
        'Review after 2 weeks',
        'Review after 1 month',
        'No specific follow-up required'
    ], {
        width: 'full'
    }),

    bleeding: createField('bleeding', 'Bleeding', 'select', [
        'Nil',
        'Minimal',
        'Moderate',
        'Severe'
    ], {
        normalValue: 'Nil',
        width: 'third'
    })
};

// ENT-specific field presets
export const ENT_FIELDS = {
    // Nasal
    septum: createField('septum', 'Septum', 'select', [
        'Normal',
        'DNS to left',
        'DNS to right',
        'DNS to left with spur',
        'DNS to right with spur',
        'S-shaped deviation',
        'Septal perforation'
    ], { normalValue: 'Normal', width: 'half' }),

    inferiorTurbinates: createField('inferiorTurbinates', 'Inferior Turbinates', 'select', [
        'Normal bilaterally',
        'Hypertrophied bilaterally',
        'Hypertrophied left',
        'Hypertrophied right',
        'Atrophic'
    ], { normalValue: 'Normal bilaterally', width: 'half' }),

    middleTurbinateLeft: createField('middleTurbinateLeft', 'Middle Turbinate (Left)', 'select', [
        'Normal',
        'Medialized',
        'Lateralized',
        'Concha bullosa',
        'Paradoxical'
    ], { normalValue: 'Normal', width: 'half' }),

    middleTurbinateRight: createField('middleTurbinateRight', 'Middle Turbinate (Right)', 'select', [
        'Normal',
        'Medialized',
        'Lateralized',
        'Concha bullosa',
        'Paradoxical'
    ], { normalValue: 'Normal', width: 'half' }),

    middleMeatusLeft: createField('middleMeatusLeft', 'Middle Meatus (Left)', 'select', [
        'Clear',
        'Mucopurulent discharge',
        'Mucoid discharge',
        'Polyp seen',
        'Edematous mucosa'
    ], { normalValue: 'Clear', width: 'half' }),

    middleMeatusRight: createField('middleMeatusRight', 'Middle Meatus (Right)', 'select', [
        'Clear',
        'Mucopurulent discharge',
        'Mucoid discharge',
        'Polyp seen',
        'Edematous mucosa'
    ], { normalValue: 'Clear', width: 'half' }),

    sphenoethmoidal: createField('sphenoethmoidal', 'Sphenoethmoidal Recess', 'select', [
        'Clear bilaterally',
        'Discharge on left',
        'Discharge on right',
        'Discharge bilaterally'
    ], { normalValue: 'Clear bilaterally', width: 'half' }),

    nasopharynx: createField('nasopharynx', 'Nasopharynx', 'select', [
        'Normal, no adenoid hypertrophy',
        'Adenoid hypertrophy Grade I',
        'Adenoid hypertrophy Grade II',
        'Adenoid hypertrophy Grade III',
        'Adenoid hypertrophy Grade IV',
        'Mass lesion seen'
    ], { normalValue: 'Normal, no adenoid hypertrophy', width: 'half' }),

    // Laryngeal
    vocalCordsAppearance: createField('vocalCordsAppearance', 'Vocal Cords Appearance', 'multiselect', [
        'Normal bilaterally',
        'Congested',
        'Edematous',
        'Nodule present',
        'Polyp present',
        'Cyst present',
        'Leukoplakia',
        'Suspicious lesion'
    ], { normalValue: ['Normal bilaterally'], width: 'full' }),

    vocalCordMobility: createField('vocalCordMobility', 'Vocal Cord Mobility', 'select', [
        'Normal bilaterally',
        'Left vocal cord paralysis',
        'Right vocal cord paralysis',
        'Bilateral vocal cord paralysis',
        'Left cord paresis',
        'Right cord paresis'
    ], { normalValue: 'Normal bilaterally', width: 'half' }),

    glotticClosure: createField('glotticClosure', 'Glottic Closure', 'select', [
        'Complete',
        'Incomplete - hourglass',
        'Incomplete - posterior chink',
        'Incomplete - spindle',
        'Incomplete - anterior'
    ], { normalValue: 'Complete', width: 'half' }),

    // Ear
    eacRight: createField('eacRight', 'EAC (Right)', 'select', [
        'Normal',
        'Wax present',
        'Discharge present',
        'Debris present',
        'Stenosis',
        'Exostosis'
    ], { normalValue: 'Normal', width: 'half' }),

    eacLeft: createField('eacLeft', 'EAC (Left)', 'select', [
        'Normal',
        'Wax present',
        'Discharge present',
        'Debris present',
        'Stenosis',
        'Exostosis'
    ], { normalValue: 'Normal', width: 'half' }),

    tmRight: createField('tmRight', 'Tympanic Membrane (Right)', 'select', [
        'Normal',
        'Retracted',
        'Bulging',
        'Perforation - central small',
        'Perforation - central medium',
        'Perforation - central large',
        'Perforation - marginal',
        'Perforation - subtotal',
        'Cholesteatoma'
    ], { normalValue: 'Normal', width: 'half' }),

    tmLeft: createField('tmLeft', 'Tympanic Membrane (Left)', 'select', [
        'Normal',
        'Retracted',
        'Bulging',
        'Perforation - central small',
        'Perforation - central medium',
        'Perforation - central large',
        'Perforation - marginal',
        'Perforation - subtotal',
        'Cholesteatoma'
    ], { normalValue: 'Normal', width: 'half' })
};
