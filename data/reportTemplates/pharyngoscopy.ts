// Pharyngoscopy & Nasopharyngoscopy Templates
import { ReportTemplate, createSection, createField, COMMON_FIELDS, ENT_FIELDS } from '@/types/reportTemplates';

export const PHARYNGOSCOPY_TEMPLATE: ReportTemplate = {
    id: 'pharyngoscopy',
    name: 'Pharyngoscopy',
    shortName: 'Pharynx',
    specialty: 'ENT',
    pdfLayout: 'detailed',
    imageCount: 4,
    normalMacroLabel: 'Normal Pharyngoscopy',

    sections: [
        createSection('indication', 'Indication', [
            COMMON_FIELDS.indication
        ], { icon: '📋', collapsible: false }),

        createSection('preparation', 'Procedure Preparation', [
            COMMON_FIELDS.preparation
        ], { icon: '💉' }),

        createSection('equipment', 'Equipment', [
            createField('equipment', 'Equipment Used', 'text', undefined, {
                defaultValue: 'Flexible Nasopharyngoscope',
                width: 'full'
            })
        ], { icon: '🔧' }),

        createSection('findings', 'Findings', [
            createField('oropharynx', 'Oropharynx', 'select', [
                'Normal',
                'Congested',
                'Granular pharyngitis',
                'Mass lesion',
                'Post-nasal drip'
            ], { normalValue: 'Normal', width: 'half' }),
            createField('tonsils', 'Tonsils', 'select', [
                'Normal',
                'Hypertrophied',
                'Cryptic',
                'Inflamed',
                'Absent (Post-tonsillectomy)'
            ], { normalValue: 'Normal', width: 'half' }),
            createField('posteriorPharyngealWall', 'Posterior Pharyngeal Wall', 'select', [
                'Normal',
                'Granular',
                'Cobblestone appearance',
                'Mass lesion'
            ], { normalValue: 'Normal', width: 'half' }),
            createField('tongueBase', 'Tongue Base', 'select', [
                'Normal',
                'Lingual tonsil hypertrophy',
                'Vallecular cyst',
                'Mass lesion'
            ], { normalValue: 'Normal', width: 'half' }),
            createField('hypopharynx', 'Hypopharynx', 'select', [
                'Normal',
                'Pooling of secretions',
                'Mass lesion - left',
                'Mass lesion - right',
                'Stricture'
            ], { normalValue: 'Normal', width: 'half' }),
            createField('pyriformSinus', 'Pyriform Sinus', 'select', [
                'Normal bilaterally',
                'Pooling on left',
                'Pooling on right',
                'Mass on left',
                'Mass on right'
            ], { normalValue: 'Normal bilaterally', width: 'half' })
        ], { icon: '🔍', collapsible: false }),

        createSection('conclusion', 'Impression & Plan', [
            COMMON_FIELDS.impression,
            createField('plan', 'Plan', 'multiselect', [
                'Medical management',
                'Antireflux therapy',
                'Biopsy recommended',
                'CT scan advised',
                'MRI advised',
                'Review after 2 weeks'
            ], { width: 'full' })
        ], { icon: '📝', collapsible: false })
    ]
};

export const NASOPHARYNGOSCOPY_TEMPLATE: ReportTemplate = {
    id: 'nasopharyngoscopy',
    name: 'Nasopharyngoscopy',
    shortName: 'NP Scope',
    specialty: 'ENT',
    pdfLayout: 'detailed',
    imageCount: 4,
    normalMacroLabel: 'Normal NP Scope',

    sections: [
        createSection('indication', 'Indication', [
            COMMON_FIELDS.indication
        ], { icon: '📋', collapsible: false }),

        createSection('preparation', 'Procedure Preparation', [
            COMMON_FIELDS.preparation
        ], { icon: '💉' }),

        createSection('equipment', 'Equipment', [
            createField('equipment', 'Equipment Used', 'text', undefined, {
                defaultValue: 'Flexible Nasopharyngoscope',
                width: 'full'
            })
        ], { icon: '🔧' }),

        createSection('nasalCavity', 'Nasal Cavity', [
            ENT_FIELDS.septum,
            ENT_FIELDS.inferiorTurbinates,
            ENT_FIELDS.middleTurbinateLeft,
            ENT_FIELDS.middleTurbinateRight,
            ENT_FIELDS.middleMeatusLeft,
            ENT_FIELDS.middleMeatusRight
        ], { icon: '👃' }),

        createSection('nasopharynx', 'Nasopharynx', [
            createField('adenoids', 'Adenoids', 'select', [
                'Absent/Atrophic',
                'Grade I (0-25%)',
                'Grade II (25-50%)',
                'Grade III (50-75%)',
                'Grade IV (>75%)'
            ], { normalValue: 'Absent/Atrophic', width: 'half' }),
            createField('eustachianTubeRight', 'Eustachian Tube Opening (Right)', 'select', [
                'Normal',
                'Edematous',
                'Mass lesion'
            ], { normalValue: 'Normal', width: 'half' }),
            createField('eustachianTubeLeft', 'Eustachian Tube Opening (Left)', 'select', [
                'Normal',
                'Edematous',
                'Mass lesion'
            ], { normalValue: 'Normal', width: 'half' }),
            createField('fossaOfRosenmuller', 'Fossa of Rosenmüller', 'select', [
                'Normal bilaterally',
                'Mass on right',
                'Mass on left'
            ], { normalValue: 'Normal bilaterally', width: 'half' }),
            createField('posteriorChoana', 'Posterior Choana', 'select', [
                'Patent bilaterally',
                'Choanal atresia - right',
                'Choanal atresia - left',
                'Polyp extending'
            ], { normalValue: 'Patent bilaterally', width: 'half' })
        ], { icon: '🔍' }),

        createSection('conclusion', 'Impression & Plan', [
            COMMON_FIELDS.impression,
            createField('plan', 'Plan', 'multiselect', [
                'Medical management',
                'Adenoidectomy advised',
                'Biopsy recommended',
                'MRI advised',
                'Review after 2 weeks'
            ], { width: 'full' })
        ], { icon: '📝', collapsible: false })
    ]
};

// Normal values
export const PHARYNGOSCOPY_NORMAL_VALUES: Record<string, string | string[]> = {
    preparation: ['Topical decongestant used', 'Lignocaine spray used', 'Procedure well tolerated'],
    equipment: 'Flexible Nasopharyngoscope',
    oropharynx: 'Normal',
    tonsils: 'Normal',
    posteriorPharyngealWall: 'Normal',
    tongueBase: 'Normal',
    hypopharynx: 'Normal',
    pyriformSinus: 'Normal bilaterally',
    impression: 'Normal pharyngoscopy.',
    plan: ['No specific follow-up required']
};

export const NASOPHARYNGOSCOPY_NORMAL_VALUES: Record<string, string | string[]> = {
    preparation: ['Topical decongestant used', 'Lignocaine spray used', 'Procedure well tolerated'],
    equipment: 'Flexible Nasopharyngoscope',
    septum: 'Normal',
    inferiorTurbinates: 'Normal bilaterally',
    middleTurbinateLeft: 'Normal',
    middleTurbinateRight: 'Normal',
    middleMeatusLeft: 'Clear',
    middleMeatusRight: 'Clear',
    adenoids: 'Absent/Atrophic',
    eustachianTubeRight: 'Normal',
    eustachianTubeLeft: 'Normal',
    fossaOfRosenmuller: 'Normal bilaterally',
    posteriorChoana: 'Patent bilaterally',
    impression: 'Normal nasopharyngoscopy.',
    plan: ['No specific follow-up required']
};
