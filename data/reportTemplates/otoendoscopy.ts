// ENT6 - Otology (Ear Examination) Report - Based on Specification
import { ReportTemplate, createSection, createField } from '@/types/reportTemplates';

// ============================================================================
// ENT6 - OTOLOGY (EAR EXAMINATION) REPORT
// ============================================================================
export const OTOENDOSCOPY_TEMPLATE: ReportTemplate = {
    id: 'otoendoscopy',
    name: 'Otology (Ear Examination) Report',
    shortName: 'OTO',
    specialty: 'ENT',
    pdfLayout: 'detailed',
    imageCount: 4,
    normalMacroLabel: 'Normal Otoscopy',

    sections: [
        // 1. Indication for Endoscopy
        createSection('indication', 'Indication for Endoscopy', [
            createField('indication', 'Indication', 'multiselect', [
                'Ear discharge',
                'Hearing loss',
                'Ear pain',
                'Tinnitus',
                'Vertigo',
                'Ear block / fullness',
                'Post-operative follow-up',
                'Others'
            ], { width: 'full', required: true }),
            createField('indicationOther', 'Other Indication', 'text', undefined, {
                placeholder: 'Specify if Others selected',
                width: 'full'
            }),
            createField('duration', 'Duration', 'text', undefined, {
                placeholder: 'mins',
                width: 'third'
            })
        ], { icon: '📋', collapsible: false }),

        // 2. Preparation
        createSection('preparation', 'Preparation', [
            createField('fasting', 'Fasting', 'select', [
                'Yes', 'No', 'NA'
            ], { width: 'quarter' }),
            createField('topicalAnesthesia', 'Topical Anesthesia (Lignocaine) Spray', 'radio', [
                'Yes', 'No'
            ], { width: 'quarter' }),
            createField('sedation', 'Sedation', 'radio', [
                'Yes', 'No (specify)'
            ], { width: 'quarter' }),
            createField('monitoring', 'Monitoring (SpO2 / BP)', 'text', undefined, {
                placeholder: 'SpO2: ___ / BP: ___',
                width: 'quarter'
            }),
            createField('patientTolerance', 'Patient Tolerance', 'radio', [
                'Good', 'Fair', 'Poor'
            ], { width: 'half' })
        ], { icon: '💉' }),

        // 3. Equipment Details
        createSection('equipment', 'Equipment Details', [
            createField('endoscopeType', 'Endoscope Type', 'select', [
                'Otoscope', 'Otoendoscope'
            ], { defaultValue: 'Otoscope', width: 'quarter' }),
            createField('diameter', 'Diameter', 'select', [
                '2.7 mm', '4.0 mm', 'Others'
            ], { width: 'quarter' }),
            createField('angle', 'Angle', 'select', [
                '0°', '30°'
            ], { width: 'quarter' }),
            createField('lightSourceCamera', 'Light Source & Camera', 'select', [
                'Item 1', 'Item 2', 'Item 3', 'Others'
            ], { width: 'quarter' })
        ], { icon: '🔧' }),

        // 4. Relevant History
        createSection('relevantHistory', 'Relevant History', [
            createField('previousEarSurgery', 'Previous Ear Surgery', 'radio', [
                'Yes', 'No (specify)'
            ], { width: 'half' }),
            createField('previousEarSurgeryDetails', 'Surgery Details', 'text', undefined, {
                placeholder: 'Specify details',
                width: 'full'
            }),
            createField('recurrentInfections', 'Recurrent Infections', 'radio', [
                'Yes', 'No'
            ], { width: 'half' }),
            createField('trauma', 'Trauma', 'radio', [
                'Yes', 'No'
            ], { width: 'half' }),
            createField('swimmingWaterExposure', 'Swimming / Water Exposure', 'radio', [
                'Yes', 'No'
            ], { width: 'half' }),
            createField('vertigoFacialWeakness', 'Vertigo / Facial Weakness', 'radio', [
                'Yes', 'No'
            ], { width: 'half' })
        ], { icon: '📋' }),

        // 5. Endoscopic Findings - (A) External Ear & Canal
        createSection('externalEarCanal', '(A) External Ear & Canal', [
            createField('pinnaRight', 'Pinna (Right)', 'select', [
                'Normal', 'Abnormal'
            ], { width: 'half', required: true }),
            createField('pinnaLeft', 'Pinna (Left)', 'select', [
                'Normal', 'Abnormal'
            ], { width: 'half', required: true }),
            createField('externalAuditoryCanRight', 'External Auditory Canal (Right)', 'select', [
                'Normal', 'Edematous', 'Discharge'
            ], { width: 'half', required: true }),
            createField('externalAuditoryCanLeft', 'External Auditory Canal (Left)', 'select', [
                'Normal', 'Edematous', 'Discharge'
            ], { width: 'half', required: true }),
            createField('waxRight', 'Wax (Right)', 'select', [
                'Absent', 'Present'
            ], { width: 'half' }),
            createField('waxLeft', 'Wax (Left)', 'select', [
                'Absent', 'Present'
            ], { width: 'half' })
        ], { icon: '👂' }),

        // 5. (B) Tympanic Membrane
        createSection('tympanicMembrane', '(B) Tympanic Membrane', [
            createField('tmColorRight', 'Color (Right)', 'select', [
                'Normal', 'Congested'
            ], { width: 'half', required: true }),
            createField('tmColorLeft', 'Color (Left)', 'select', [
                'Normal', 'Congested'
            ], { width: 'half', required: true }),
            createField('tmPositionRight', 'Position (Right)', 'select', [
                'Normal', 'Retracted', 'Bulging'
            ], { width: 'half', required: true }),
            createField('tmPositionLeft', 'Position (Left)', 'select', [
                'Normal', 'Retracted', 'Bulging'
            ], { width: 'half', required: true }),
            createField('tmMobilityRight', 'Mobility (if tested) (Right)', 'select', [
                'Normal', 'Reduced'
            ], { width: 'half' }),
            createField('tmMobilityLeft', 'Mobility (if tested) (Left)', 'select', [
                'Normal', 'Reduced'
            ], { width: 'half' }),
            createField('tmPerforationRight', 'Perforation (Right)', 'select', [
                'Nil', 'Central', 'Marginal', 'Attic'
            ], { width: 'half', required: true }),
            createField('tmPerforationLeft', 'Perforation (Left)', 'select', [
                'Nil', 'Central', 'Marginal', 'Attic'
            ], { width: 'half', required: true }),
            createField('sizeOfPerforationRight', 'Size of Perforation (Right)', 'select', [
                '-', 'Small', 'Medium', 'Large'
            ], { width: 'half' }),
            createField('sizeOfPerforationLeft', 'Size of Perforation (Left)', 'select', [
                '-', 'Small', 'Medium', 'Large'
            ], { width: 'half' })
        ], { icon: '🔴' }),

        // 5. (C) Middle Ear (If Visible)
        createSection('middleEar', '(C) Middle Ear (If Visible)', [
            createField('mucosaRight', 'Mucosa (Right)', 'radio', [
                'Normal', 'Edematous'
            ], { width: 'half' }),
            createField('mucosaLeft', 'Mucosa (Left)', 'radio', [
                'Normal', 'Edematous'
            ], { width: 'half' }),
            createField('ossiclesVisible', 'Ossicles Visible', 'radio', [
                'Yes', 'No'
            ], { width: 'half' }),
            createField('discharge', 'Discharge', 'radio', [
                'Nil', 'Mucoid', 'Purulent'
            ], { width: 'half' })
        ], { icon: '🔊' }),

        // 5. (D) Special Findings (if any)
        createSection('specialFindings', '(D) Special Findings (if any)', [
            createField('specialFindings', 'Findings', 'multiselect', [
                'No.',
                'Retraction pocket',
                'Cholesteatoma',
                'Granulation tissue',
                'Polyp',
                'Post-operative cavity'
            ], { width: 'full' })
        ], { icon: '🎯' }),

        // 6. Hearing Assessment
        createSection('hearingAssessment', 'Hearing Assessment', [
            createField('tuningForkTests', 'Tuning Fork Tests', 'multiselect', [
                'Rinne', 'Weber', 'ABC'
            ], { width: 'full' }),
            createField('audiometryAdvised', 'Audiometry Advised', 'radio', [
                'Yes', 'No'
            ], { width: 'half' })
        ], { icon: '🔊' }),

        // 7. Complications / Associated Findings
        createSection('complications', 'Complications / Associated Findings', [
            createField('complications', 'Complications', 'multiselect', [
                'Facial nerve weakness',
                'Vertigo',
                'Mastoid tenderness',
                'Post-auricular swelling',
                'None',
                'Others'
            ], { width: 'full', required: true }),
            createField('complicationsOther', 'Other Complications', 'text', undefined, {
                placeholder: 'Specify if Others selected',
                width: 'full'
            })
        ], { icon: '⚠️' }),

        // 8. Interventions (If Any)
        createSection('interventions', 'Interventions (If Any)', [
            createField('interventions', 'Interventions', 'multiselect', [
                'None',
                'Suctioning',
                'Bronchoalveolar lavage',
                'Biopsy',
                'Foreign body removal'
            ], { width: 'full' })
        ], { icon: '🔧' }),

        // 9. Impression / Endoscopic Diagnosis
        createSection('impression', 'Impression / Endoscopic Diagnosis', [
            createField('impression', 'Impression', 'textarea', undefined, {
                placeholder: 'Use clear diagnostic terminology',
                width: 'full',
                required: true
            })
        ], { icon: '📋' }),

        // 10. Advice / Plan
        createSection('plan', 'Advice / Plan', [
            createField('plan', 'Plan', 'multiselect', [
                'Medical management',
                'Aural toileting',
                'Audiological evaluation',
                'Imaging (CT temporal bone)',
                'Surgical opinion',
                'Follow-up visit',
                'Others'
            ], { width: 'full', required: true }),
            createField('planOther', 'Other Plan', 'text', undefined, {
                placeholder: 'Specify if Others selected',
                width: 'full'
            })
        ], { icon: '📝', collapsible: false })
    ]
};

// Normal values for Otoendoscopy template
export const OTOENDOSCOPY_NORMAL_VALUES: Record<string, string | string[]> = {
    patientTolerance: 'Good',
    pinnaRight: 'Normal',
    pinnaLeft: 'Normal',
    externalAuditoryCanRight: 'Normal',
    externalAuditoryCanLeft: 'Normal',
    waxRight: 'Absent',
    waxLeft: 'Absent',
    tmColorRight: 'Normal',
    tmColorLeft: 'Normal',
    tmPositionRight: 'Normal',
    tmPositionLeft: 'Normal',
    tmPerforationRight: 'Nil',
    tmPerforationLeft: 'Nil',
    mucosaRight: 'Normal',
    mucosaLeft: 'Normal',
    discharge: 'Nil',
    complications: ['None'],
    interventions: ['None'],
    impression: 'Normal bilateral otoscopy. Tympanic membranes intact with normal appearance.',
    plan: []
};
