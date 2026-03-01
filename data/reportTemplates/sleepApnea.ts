// ENT4 - Obstructive Sleep Apnea Report (OSA) - Based on Specification
import { ReportTemplate, createSection, createField } from '@/types/reportTemplates';

// ============================================================================
// ENT4 - OBSTRUCTIVE SLEEP APNEA REPORT (OSA)
// ============================================================================
export const SLEEP_APNEA_TEMPLATE: ReportTemplate = {
    id: 'sleep_apnea',
    name: 'Obstructive Sleep Apnea Report',
    shortName: 'OSA',
    specialty: 'ENT',
    pdfLayout: 'detailed',
    imageCount: 4,
    normalMacroLabel: 'Normal OSA Evaluation',

    sections: [
        // 1. Indication for Endoscopy
        createSection('indication', 'Indication for Endoscopy', [
            createField('indication', 'Indication', 'multiselect', [
                'Snoring',
                'Unrefreshing sleep',
                'Morning headache',
                'Nocturia',
                'Poor concentration',
                'Hypertension / Diabetes / CAD',
                'Post-operative evaluation',
                'Others'
            ], { width: 'full', required: true }),
            createField('indicationOther', 'Other Indication', 'text', undefined, {
                placeholder: 'Specify if Others selected',
                width: 'full'
            }),
            createField('essScore', 'Epworth Sleepiness Scale (ESS)', 'text', undefined, {
                placeholder: '/24',
                width: 'third'
            }),
            createField('bmi', 'BMI', 'text', undefined, {
                placeholder: 'kg/m²',
                width: 'third'
            }),
            createField('neckCircumference', 'Neck Circumference', 'text', undefined, {
                placeholder: 'cm',
                width: 'third'
            })
        ], { icon: '📋', collapsible: false }),

        // 2. Preparation
        createSection('preparation', 'Preparation', [
            createField('topicalDecongestant', 'Topical Decongestant Used', 'radio', [
                'Yes', 'No'
            ], { width: 'half', required: true }),
            createField('topicalLignocaine', 'Topical Lignocaine Spray', 'radio', [
                'Yes', 'No'
            ], { width: 'half', required: true }),
            createField('patientTolerance', 'Patient Tolerance', 'radio', [
                'Good', 'Fair', 'Poor'
            ], { width: 'half', required: true })
        ], { icon: '💉' }),

        // 3. Equipment Details
        createSection('equipment', 'Equipment Details', [
            createField('endoscopeType', 'Endoscope Type', 'select', [
                'Rigid'
            ], { defaultValue: 'Rigid', width: 'quarter' }),
            createField('diameter', 'Diameter', 'select', [
                '8 mm', '10 mm', 'Others'
            ], { width: 'quarter' }),
            createField('angle', 'Angle', 'select', [
                '70°', '90°', 'Others'
            ], { width: 'quarter' }),
            createField('lightSourceCamera', 'Light Source & Camera', 'select', [
                'Item 1', 'Item 2', 'Item 3', 'Others'
            ], { width: 'quarter' })
        ], { icon: '🔧' }),

        // 4. Endoscopic Findings - (A) Nasal Cavity
        createSection('nasalCavity', '(A) Nasal Cavity', [
            createField('nasalVestibuleRight', 'Nasal Vestibule (Right)', 'select', [
                'Normal', 'Abnormal'
            ], { width: 'half', required: true }),
            createField('nasalVestibuleLeft', 'Nasal Vestibule (Left)', 'select', [
                'Normal', 'Abnormal'
            ], { width: 'half', required: true }),
            createField('septumRight', 'Septum (Right)', 'select', [
                'Central', 'Deviated', 'Spur'
            ], { width: 'half', required: true }),
            createField('septumLeft', 'Septum (Left)', 'select', [
                'Central', 'Deviated', 'Spur'
            ], { width: 'half', required: true }),
            createField('inferiorTurbinateRight', 'Inferior Turbinate (Right)', 'select', [
                'Normal', 'Hypertrophied'
            ], { width: 'half', required: true }),
            createField('inferiorTurbinateLeft', 'Inferior Turbinate (Left)', 'select', [
                'Normal', 'Hypertrophied'
            ], { width: 'half', required: true }),
            createField('middleTurbinateRight', 'Middle Turbinate (Right)', 'select', [
                'Normal', 'Paradoxical', 'Concha bullosa'
            ], { width: 'half' }),
            createField('middleTurbinateLeft', 'Middle Turbinate (Left)', 'select', [
                'Normal', 'Paradoxical', 'Concha bullosa'
            ], { width: 'half' }),
            createField('superiorTurbinateRight', 'Superior Turbinate (Right)', 'select', [
                'Normal', 'Abnormal'
            ], { width: 'half' }),
            createField('superiorTurbinateLeft', 'Superior Turbinate (Left)', 'select', [
                'Normal', 'Abnormal'
            ], { width: 'half' })
        ], { icon: '👃' }),

        // 4. (B) Oral Cavity & Oropharynx
        createSection('oralCavity', '(B) Oral Cavity & Oropharynx', [
            createField('mallampatiGrade', 'Mallampati Grade', 'radio', [
                'I', 'II', 'III', 'IV'
            ], { width: 'half', required: true }),
            createField('tonsilsGrade', 'Tonsils', 'radio', [
                'Grade 0', 'I', 'II', 'III', 'IV'
            ], { width: 'half', required: true }),
            createField('uvula', 'Uvula', 'radio', [
                'Normal', 'Elongated'
            ], { width: 'half', required: true }),
            createField('softPalate', 'Soft Palate', 'radio', [
                'Normal', 'Redundant'
            ], { width: 'half', required: true })
        ], { icon: '👅' }),

        // 4. (C) Tongue Base
        createSection('tongueBase', '(C) Tongue Base', [
            createField('tongueBase', 'Tongue Base', 'radio', [
                'Normal', 'Bulky', 'Retroglossal narrowing'
            ], { width: 'full', required: true })
        ], { icon: '👅' }),

        // 4. (D) Neck
        createSection('neck', '(D) Neck', [
            createField('neck', 'Neck', 'radio', [
                'Normal', 'Short', 'Thick'
            ], { width: 'full', required: true })
        ], { icon: '🦴' }),

        // 5. Endoscopic Evaluation
        createSection('endoscopicEvaluation', 'Endoscopic Evaluation', [
            createField('procedure', 'Procedure', 'multiselect', [
                'Awake nasopharyngolaryngoscopy',
                'DISE'
            ], { width: 'full' }),
            createField('levelOfObstruction', 'Level of Obstruction', 'multiselect', [
                'Nasal',
                'Velopharyngeal',
                'Oropharyngeal',
                'Tongue base',
                'Epiglottic',
                'Others'
            ], { width: 'full' }),
            createField('pattern', 'Pattern', 'multiselect', [
                'Anteroposterior',
                'Lateral',
                'Circumferential'
            ], { width: 'full' })
        ], { icon: '🔍' }),

        // 6. Sleep Study Details
        createSection('sleepStudy', 'Sleep Study Details', [
            createField('studyType', 'Type of Study', 'multiselect', [
                'Level I (PSG)',
                'Level II',
                'Level III (Home Sleep Study)'
            ], { width: 'full' }),
            createField('totalSleepTime', 'Total Sleep Time', 'text', undefined, {
                placeholder: 'hrs',
                width: 'third'
            }),
            createField('ahi', 'Apnea-Hypopnea Index (AHI)', 'text', undefined, {
                placeholder: '/hr',
                width: 'third'
            }),
            createField('lowestSpo2', 'Lowest SpO2', 'text', undefined, {
                placeholder: '%',
                width: 'third'
            }),
            createField('averageSpo2', 'Average SpO2', 'text', undefined, {
                placeholder: '%',
                width: 'third'
            }),
            createField('snoringIndex', 'Snoring Index', 'select', [
                'Mild', 'Moderate', 'Severe'
            ], { width: 'third' })
        ], { icon: '😴' }),

        // 6. Severity Classification
        createSection('severityClassification', 'Severity Classification (Based on AHI)', [
            createField('osaSeverity', 'OSA Severity', 'multiselect', [
                'Normal (<5)',
                'Mild OSA (5-14.9)',
                'Moderate OSA (15-29.9)',
                'Severe OSA (≥30)'
            ], { width: 'full', required: true })
        ], { icon: '📊' }),

        // 7. Impression / Endoscopic Diagnosis
        createSection('impression', 'Impression / Endoscopic Diagnosis', [
            createField('impression', 'Impression', 'textarea', undefined, {
                placeholder: 'Use clear diagnostic terminology',
                width: 'full',
                required: true
            })
        ], { icon: '📋' }),

        // 8. Advice / Plan
        createSection('plan', 'Advice / Plan', [
            createField('plan', 'Plan', 'multiselect', [
                'CPAP therapy',
                'BiPAP therapy',
                'Septoplasty',
                'Turbinate reduction',
                'UPPP',
                'Tongue base surgery',
                'MMA surgery',
                'Weight reduction',
                'Positional therapy',
                'Others'
            ], { width: 'full', required: true }),
            createField('planOther', 'Other Plan', 'text', undefined, {
                placeholder: 'Specify if Others selected',
                width: 'full'
            })
        ], { icon: '📝', collapsible: false })
    ]
};

// Normal values for OSA template
export const OSA_NORMAL_VALUES: Record<string, string | string[]> = {
    topicalDecongestant: 'Yes',
    topicalLignocaine: 'Yes',
    patientTolerance: 'Good',
    nasalVestibuleRight: 'Normal',
    nasalVestibuleLeft: 'Normal',
    septumRight: 'Central',
    septumLeft: 'Central',
    inferiorTurbinateRight: 'Normal',
    inferiorTurbinateLeft: 'Normal',
    mallampatiGrade: 'I',
    tonsilsGrade: 'Grade 0',
    uvula: 'Normal',
    softPalate: 'Normal',
    tongueBase: 'Normal',
    neck: 'Normal',
    osaSeverity: ['Normal (<5)'],
    impression: 'Normal upper airway examination. No significant obstruction identified.',
    plan: []
};

// Backwards compatibility
export const SLEEP_APNEA_NORMAL_VALUES = OSA_NORMAL_VALUES;
