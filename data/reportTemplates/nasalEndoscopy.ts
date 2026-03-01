// Diagnostic Nasal Endoscopy (DNE) Template
import { ReportTemplate, createSection, COMMON_FIELDS, ENT_FIELDS } from '@/types/reportTemplates';

export const NASAL_ENDOSCOPY_TEMPLATE: ReportTemplate = {
    id: 'nasal_endoscopy',
    name: 'Diagnostic Nasal Endoscopy',
    shortName: 'DNE',
    specialty: 'ENT',
    pdfLayout: 'detailed',
    imageCount: 4,
    normalMacroLabel: 'Normal DNE',

    sections: [
        createSection('indication', 'Indication', [
            {
                id: 'indication',
                label: 'Indication for Endoscopy',
                type: 'multiselect',
                options: [
                    'Nasal obstruction',
                    'Chronic rhinosinusitis',
                    'Epistaxis',
                    'Post-nasal drip',
                    'Headache',
                    'Post-operative evaluation',
                    'Others'
                ],
                placeholder: 'Select indications...',
                required: true,
                width: 'full'
            }
        ], { icon: '📋', collapsible: false }),

        createSection('preparation', 'Preparation', [
            {
                id: 'decongestant',
                label: 'Topical decongestant used',
                type: 'radio',
                options: ['Yes', 'No'],
                width: 'third'
            },
            {
                id: 'lignocaine',
                label: 'Topical lignocaine spray',
                type: 'radio',
                options: ['Yes', 'No'],
                width: 'third'
            },
            {
                id: 'tolerance',
                label: 'Patient tolerance',
                type: 'radio',
                options: ['Good', 'Fair', 'Poor'],
                width: 'third'
            }
        ], { icon: '💉' }),

        createSection('equipment', 'Equipment Details', [
            {
                id: 'endoscopeType',
                label: 'Endoscope type',
                type: 'select',
                options: ['Rigid', 'Flexible'],
                defaultValue: 'Rigid',
                width: 'quarter'
            },
            {
                id: 'diameter',
                label: 'Diameter',
                type: 'select',
                options: ['4 mm', '2.7 mm', 'Others'],
                defaultValue: '4 mm',
                width: 'quarter'
            },
            {
                id: 'angle',
                label: 'Angle',
                type: 'select',
                options: ['0°', '30°', '45°', 'Others'],
                defaultValue: '0°',
                width: 'quarter'
            },
            {
                id: 'lightSource',
                label: 'Light source & camera',
                type: 'select',
                options: ['Item 1', 'Item 2', 'Item 3', 'Others'],
                width: 'quarter'
            }
        ], { icon: '🔧' }),

        createSection('findings', 'Endoscopic Findings', [], { icon: '🔍', collapsible: false }),

        createSection('nasalCavity', '(A) Nasal Cavity', [
            {
                id: 'nasalVestibule',
                label: 'Nasal vestibule',
                type: 'bilateral',
                options: ['Normal', 'Abnormal'],
                width: 'full'
            },
            {
                id: 'septum',
                label: 'Septum',
                type: 'bilateral',
                options: ['Central', 'Deviated', 'Spur'],
                width: 'full'
            },
            {
                id: 'inferiorTurbinate',
                label: 'Inferior turbinate',
                type: 'bilateral',
                options: ['Normal', 'Hypertrophied'],
                width: 'full'
            },
            {
                id: 'middleTurbinate',
                label: 'Middle turbinate',
                type: 'bilateral',
                options: ['Normal', 'Paradoxical', 'Concha bullosa'],
                width: 'full'
            },
            {
                id: 'superiorTurbinate',
                label: 'Superior turbinate',
                type: 'bilateral',
                options: ['Normal', 'Abnormal'],
                width: 'full'
            }
        ], { icon: '👃', collapsible: false }),

        createSection('osteomeatal', '(B) Osteomeatal Complex', [
            {
                id: 'middleMeatus',
                label: 'Middle meatus',
                type: 'bilateral',
                options: ['Clear', 'Blocked'],
                width: 'full'
            },
            {
                id: 'secretions',
                label: 'Secretions',
                type: 'bilateral',
                options: ['Nil', 'Mucoid', 'Purulent'],
                width: 'full'
            },
            {
                id: 'polyps',
                label: 'Polyps',
                type: 'bilateral',
                options: ['Absent', 'Present'],
                width: 'full'
            }
        ], { icon: '🔬', collapsible: false }),

        createSection('posteriorNasal', '(C) Posterior Nasal Cavity', [
            {
                id: 'superiorMeatus',
                label: 'Superior meatus',
                type: 'select',
                options: ['Normal', 'Abnormal'],
                width: 'full'
            },
            {
                id: 'sphenoethmoidal',
                label: 'Sphenoethmoidal recess',
                type: 'select',
                options: ['Clear', 'Discharge', 'Polyp'],
                width: 'full'
            },
            {
                id: 'choana',
                label: 'Choana',
                type: 'select',
                options: ['Patent', 'Blocked'],
                width: 'full'
            }
        ], { icon: '🗣️', collapsible: false }),

        createSection('nasopharynx', '(D) Nasopharynx', [
            {
                id: 'adenoids',
                label: 'Adenoids',
                type: 'select',
                options: ['Normal', 'Hypertrophied'],
                width: 'full'
            },
            {
                id: 'eustachianTube',
                label: 'Eustachian tube opening',
                type: 'select',
                options: ['Normal', 'Edematous'],
                width: 'full'
            },
            {
                id: 'mass',
                label: 'Mass / Growth',
                type: 'select',
                options: ['Absent', 'Present'],
                width: 'full'
            }
        ], { icon: '👄', collapsible: false }),

        createSection('complications', 'Complications & Outcome', [
            {
                id: 'bleeding',
                label: 'Bleeding / Discharge',
                type: 'multiselect',
                options: ['Nil', 'Mucoid', 'Purulent', 'Blood-stained', 'Others'],
                width: 'full'
            },
            {
                id: 'complications',
                label: 'Complications During Procedure',
                type: 'multiselect',
                options: ['None', 'Epistaxis', 'Vasovagal symptoms', 'Others'],
                width: 'full'
            }
        ], { icon: '⚠️', collapsible: false }),

        createSection('conclusion', 'Impression & Plan', [
            COMMON_FIELDS.impression,
            {
                id: 'plan',
                label: 'Advice / Plan',
                type: 'multiselect',
                options: [
                    'Medical management',
                    'Imaging (CT PNS)',
                    'Surgical opinion',
                    'Follow-up endoscopy',
                    'Others'
                ],
                width: 'full'
            }
        ], { icon: '📝', collapsible: false })
    ]
};

// Normal findings macro for DNE
export const DNE_NORMAL_VALUES: Record<string, any> = {
    indication: [],
    decongestant: 'Yes',
    lignocaine: 'Yes',
    tolerance: 'Good',
    endoscopeType: 'Rigid',
    diameter: '4 mm',
    angle: '0°',
    lightSource: 'Item 1',

    // Nasal Cavity
    nasalVestibule: { right: 'Normal', left: 'Normal' },
    septum: { right: 'Central', left: 'Central' },
    inferiorTurbinate: { right: 'Normal', left: 'Normal' },
    middleTurbinate: { right: 'Normal', left: 'Normal' },
    superiorTurbinate: { right: 'Normal', left: 'Normal' },

    // OMC
    middleMeatus: { right: 'Clear', left: 'Clear' },
    secretions: { right: 'Nil', left: 'Nil' },
    polyps: { right: 'Absent', left: 'Absent' },

    // Posterior
    superiorMeatus: 'Normal',
    sphenoethmoidal: 'Clear',
    choana: 'Patent',

    // Nasopharynx
    adenoids: 'Normal',
    eustachianTube: 'Normal',
    mass: 'Absent',

    bleeding: ['Nil'],
    complications: ['None'],
    impression: 'Normal diagnostic nasal endoscopy.',
    plan: []
};
