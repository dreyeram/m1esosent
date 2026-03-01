// Video Laryngoscopy Templates (Rigid and Flexible) - Based on ENT2/ENT3 Specifications
import { ReportTemplate, createSection, createField, COMMON_FIELDS } from '@/types/reportTemplates';

// ============================================================================
// ENT2 - VIDEO LARYNGOSCOPY - RIGID (VL-Rigid)
// ============================================================================
export const RIGID_LARYNGOSCOPY_TEMPLATE: ReportTemplate = {
    id: 'rigid_laryngoscopy',
    name: 'Video Laryngoscopy - Rigid',
    shortName: 'VL-Rigid',
    specialty: 'ENT',
    pdfLayout: 'detailed',
    imageCount: 4,
    normalMacroLabel: 'Normal VL-Rigid',

    sections: [
        // 1. Indication for Endoscopy
        createSection('indication', 'Indication for Endoscopy', [
            createField('indication', 'Indications', 'multiselect', [
                'Hoarseness of voice',
                'Dysphagia / odynophagia',
                'Chronic cough',
                'Suspected vocal cord lesion',
                'Professional voice assessment',
                'Airway evaluation / stridor',
                'Post-operative evaluation',
                'Others'
            ], { width: 'full', required: true }),
            createField('indicationOther', 'Other Indication', 'text', undefined, {
                placeholder: 'Specify if Others selected',
                width: 'full'
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

        // 4. Endoscopic Findings
        createSection('findings', 'Endoscopic Findings', [
            createField('baseOfTongue', 'Base of tongue', 'select', [
                'Normal', 'Abnormal'
            ], { width: 'half', required: true }),
            createField('vallecula', 'Vallecula', 'select', [
                'Clear', 'Pooling'
            ], { width: 'half', required: true }),
            createField('epiglottis', 'Epiglottis', 'select', [
                'Normal', 'Edematous'
            ], { width: 'half', required: true }),
            createField('aryepiglotticFolds', 'Aryepiglottic folds', 'select', [
                'Normal', 'Edematous'
            ], { width: 'half', required: true }),
            createField('arytenoids', 'Arytenoids', 'select', [
                'Normal', 'Congested'
            ], { width: 'half', required: true }),
            createField('falseCords', 'False vocal cords', 'select', [
                'Normal', 'Edematous'
            ], { width: 'half', required: true }),
            createField('trueVocalCords', 'True vocal cords', 'select', [
                'Normal', 'Lesion'
            ], { width: 'half', required: true }),
            createField('vocalCordMobility', 'Vocal cord mobility', 'select', [
                'Normal', 'Reduced', 'Fixed'
            ], { width: 'half', required: true }),
            createField('glotticClosure', 'Glottic closure', 'select', [
                'Complete', 'Incomplete'
            ], { width: 'half', required: true }),
            createField('subglottis', 'Subglottis', 'select', [
                'Normal', 'Not visualized'
            ], { width: 'half', required: true })
        ], { icon: '🔍', collapsible: false }),

        // 5. Lesion (If Present)
        createSection('lesion', 'Lesion (If Present)', [
            createField('lesionSite', 'Site', 'select', [
                'Right', 'Left', 'Bilateral'
            ], { width: 'third' }),
            createField('lesionType', 'Type', 'select', [
                'Nodule', 'Polyp', 'Cyst', 'Leukoplakia', 'Growth'
            ], { width: 'third' }),
            createField('lesionSurface', 'Surface', 'select', [
                'Smooth', 'Irregular'
            ], { width: 'third' })
        ], { icon: '🎯' }),

        // 6. Complications During Procedure
        createSection('complications', 'Complications During Procedure', [
            createField('complications', 'Complications', 'multiselect', [
                'None', 'Gagging', 'Minor bleed', 'Others'
            ], { width: 'full', required: true }),
            createField('complicationsOther', 'Other Complications', 'text', undefined, {
                placeholder: 'Specify if Others selected',
                width: 'full'
            })
        ], { icon: '⚠️' }),

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
                'Voice therapy',
                'Medical management',
                'Laryngeal stroboscopy',
                'Biopsy / MLS',
                'Others'
            ], { width: 'full', required: true }),
            createField('planOther', 'Other Plan', 'text', undefined, {
                placeholder: 'Specify if Others selected',
                width: 'full'
            })
        ], { icon: '📝', collapsible: false })
    ]
};

// ============================================================================
// ENT3 - VIDEO LARYNGOSCOPY - FLEXIBLE (VL-Flexible)
// ============================================================================
export const FLEXIBLE_LARYNGOSCOPY_TEMPLATE: ReportTemplate = {
    id: 'flexible_laryngoscopy',
    name: 'Video Laryngoscopy - Flexible',
    shortName: 'VL-Flexible',
    specialty: 'ENT',
    pdfLayout: 'detailed',
    imageCount: 4,
    normalMacroLabel: 'Normal VL-Flexible',

    sections: [
        // 1. Indication for Endoscopy
        createSection('indication', 'Indication for Endoscopy', [
            createField('indication', 'Indication', 'multiselect', [
                'Suspected vocal cord lesion',
                'Professional voice assessment',
                'Airway evaluation / stridor',
                'Post-operative evaluation',
                'Others'
            ], { width: 'full', required: true }),
            createField('indicationOther', 'Other Indication', 'text', undefined, {
                placeholder: 'Specify if Others selected',
                width: 'full'
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

        // 4. Endoscopic Findings
        createSection('findings', 'Endoscopic Findings', [
            createField('nasopharynx', 'Nasopharynx', 'select', [
                'Normal', 'Abnormal'
            ], { width: 'half', required: true }),
            createField('oropharynx', 'Oropharynx', 'select', [
                'Normal', 'Abnormal'
            ], { width: 'half', required: true }),
            createField('baseOfTongue', 'Base of Tongue', 'select', [
                'Normal', 'Abnormal'
            ], { width: 'half', required: true }),
            createField('epiglottis', 'Epiglottis', 'select', [
                'Normal', 'Omega-shaped'
            ], { width: 'half', required: true }),
            createField('aryepiglotticFolds', 'Aryepiglottic Folds', 'select', [
                'Normal', 'Edematous'
            ], { width: 'half', required: true }),
            createField('arytenoids', 'Arytenoids', 'select', [
                'Normal', 'Congested'
            ], { width: 'half', required: true }),
            createField('interarytenoidRegion', 'Interarytenoid Region', 'select', [
                'Normal', 'Pachydermia'
            ], { width: 'half', required: true }),
            createField('falseCords', 'False Vocal Cords', 'select', [
                'Normal', 'Edematous'
            ], { width: 'half', required: true }),
            createField('trueVocalCords', 'True Vocal Cords', 'select', [
                'Normal', 'Lesion'
            ], { width: 'half', required: true }),
            createField('vocalCordMobility', 'Vocal Cord Mobility', 'select', [
                'Normal', 'Paresis', 'Paralysis'
            ], { width: 'half', required: true }),
            createField('glotticClosure', 'Glottic Closure (Phonation)', 'select', [
                'Complete', 'Incomplete'
            ], { width: 'half', required: true }),
            createField('subglottis', 'Subglottis', 'select', [
                'Normal', 'Narrowed'
            ], { width: 'half', required: true })
        ], { icon: '🔍', collapsible: false }),

        // 5. Voice Assessment
        createSection('voiceAssessment', 'Voice Assessment', [
            createField('voiceQuality', 'Quality', 'select', [
                'Normal', 'Breathy', 'Hoarse'
            ], { width: 'half' }),
            createField('voicePitch', 'Pitch', 'select', [
                'Normal', 'Low', 'High'
            ], { width: 'half' })
        ], { icon: '🎤' }),

        // 6. Complications During Procedure
        createSection('complications', 'Complications During Procedure', [
            createField('complications', 'Complications', 'multiselect', [
                'None', 'Epistaxis', 'Cough', 'Others'
            ], { width: 'full', required: true }),
            createField('complicationsOther', 'Other Complications', 'text', undefined, {
                placeholder: 'Specify if Others selected',
                width: 'full'
            })
        ], { icon: '⚠️' }),

        // 7. Impression / Endoscopic Diagnosis
        createSection('impression', 'Impression / Endoscopic Diagnosis', [
            createField('impression', 'Impression', 'textarea', undefined, {
                placeholder: 'Use clear diagnostic terminology for AI suggestions',
                width: 'full',
                required: true
            })
        ], { icon: '📋' }),

        // 8. Advice / Plan
        createSection('plan', 'Advice / Plan', [
            createField('plan', 'Plan', 'multiselect', [
                'Voice therapy',
                'Medical therapy',
                'Laryngeal stroboscopy',
                'Biopsy / MLS',
                'Others'
            ], { width: 'full', required: true }),
            createField('planOther', 'Other Plan', 'text', undefined, {
                placeholder: 'Specify if Others selected',
                width: 'full'
            })
        ], { icon: '📝', collapsible: false })
    ]
};

// ============================================================================
// ENT6 - LARYNGEAL STROBOSCOPY REPORT (Updated per Specification)
// ============================================================================
export const STROBOSCOPY_TEMPLATE: ReportTemplate = {
    id: 'stroboscopy',
    name: 'Laryngeal Stroboscopy Report',
    shortName: 'STB',
    specialty: 'ENT',
    pdfLayout: 'detailed',
    imageCount: 4,
    normalMacroLabel: 'Normal Stroboscopy',

    sections: [
        // 1. Indication for Endoscopy
        createSection('indication', 'Indication for Endoscopy', [
            createField('indication', 'Indication', 'multiselect', [
                'Hoarseness of voice',
                'Professional voice user',
                'Suspected vocal cord lesion',
                'Voice fatigue',
                'Post-operative / Post-therapy assessment',
                'Others'
            ], { width: 'full', required: true }),
            createField('indicationOther', 'Other Indication', 'text', undefined, {
                placeholder: 'Specify if Others selected',
                width: 'full'
            })
        ], { icon: '📋', collapsible: false }),

        // 2. Voice History
        createSection('voiceHistory', 'Voice History', [
            createField('durationOfSymptoms', 'Duration of Symptoms', 'text', undefined, {
                placeholder: 'days',
                width: 'quarter'
            }),
            createField('voiceAbuseOveruse', 'Voice Abuse / Overuse', 'radio', [
                'Yes', 'No'
            ], { width: 'quarter' }),
            createField('smokingAlcohol', 'Smoking / Alcohol', 'radio', [
                'Yes', 'No'
            ], { width: 'quarter' }),
            createField('gerd', 'GERD', 'radio', [
                'Yes', 'No'
            ], { width: 'quarter' })
        ], { icon: '🗣️' }),

        // 3. Equipment Details
        createSection('equipment', 'Equipment Details', [
            createField('endoscopeType', 'Endoscope Type', 'select', [
                'Rigid Stroboscope', 'Flexible Stroboscope'
            ], { defaultValue: 'Rigid Stroboscope', width: 'quarter' }),
            createField('diameter', 'Diameter', 'select', [
                '2.7 mm', '4.0 mm', 'Others'
            ], { width: 'quarter' }),
            createField('angle', 'Angle', 'select', [
                '0°', '30°', '70°', '90°'
            ], { width: 'quarter' }),
            createField('lightSourceCamera', 'Light Source & Camera', 'select', [
                'Item 1', 'Item 2', 'Item 3', 'Others'
            ], { width: 'quarter' })
        ], { icon: '🔧' }),

        // 4. Relevant History
        createSection('relevantHistory', 'Relevant History', [
            createField('previousEarSurgery', 'Previous Ear/Throat Surgery', 'radio', [
                'Yes', 'No'
            ], { width: 'half' }),
            createField('previousSurgeryDetails', 'Surgery Details', 'text', undefined, {
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

        // 5. Stroboscopic Findings - Right Vocal Fold
        createSection('rightVocalFold', 'Right Vocal Fold', [
            createField('rightVocalFoldEdge', 'Vocal Fold Edge', 'select', [
                'Smooth', 'Irregular'
            ], { normalValue: 'Smooth', width: 'half' }),
            createField('rightColor', 'Color', 'select', [
                'Normal', 'Congested'
            ], { normalValue: 'Normal', width: 'half' }),
            createField('rightAmplitude', 'Amplitude', 'select', [
                'Normal', 'Reduced', 'Increased'
            ], { normalValue: 'Normal', width: 'half' }),
            createField('rightMucosalWave', 'Mucosal Wave', 'select', [
                'Normal', 'Reduced', 'Absent'
            ], { normalValue: 'Normal', width: 'half' }),
            createField('rightPhaseSymmetry', 'Phase Symmetry', 'select', [
                'Symmetric', 'Asymmetric'
            ], { normalValue: 'Symmetric', width: 'half' }),
            createField('rightPeriodicity', 'Periodicity', 'select', [
                'Regular', 'Irregular'
            ], { normalValue: 'Regular', width: 'half' }),
            createField('rightWaveformDifference', 'Waveform Pattern Difference', 'select', [
                'Present', 'Reduced', 'Absent'
            ], { normalValue: 'Absent', width: 'half' }),
            createField('rightNonVibratingSegment', 'Non-vibrating Segment', 'select', [
                'Absent', 'Present'
            ], { normalValue: 'Absent', width: 'half' })
        ], { icon: '➡️' }),

        // 5. Stroboscopic Findings - Left Vocal Fold
        createSection('leftVocalFold', 'Left Vocal Fold', [
            createField('leftVocalFoldEdge', 'Vocal Fold Edge', 'select', [
                'Smooth', 'Irregular'
            ], { normalValue: 'Smooth', width: 'half' }),
            createField('leftColor', 'Color', 'select', [
                'Normal', 'Congested'
            ], { normalValue: 'Normal', width: 'half' }),
            createField('leftAmplitude', 'Amplitude', 'select', [
                'Normal', 'Reduced', 'Increased'
            ], { normalValue: 'Normal', width: 'half' }),
            createField('leftMucosalWave', 'Mucosal Wave', 'select', [
                'Normal', 'Reduced', 'Absent'
            ], { normalValue: 'Normal', width: 'half' }),
            createField('leftPhaseSymmetry', 'Phase Symmetry', 'select', [
                'Symmetric', 'Asymmetric'
            ], { normalValue: 'Symmetric', width: 'half' }),
            createField('leftPeriodicity', 'Periodicity', 'select', [
                'Regular', 'Irregular'
            ], { normalValue: 'Regular', width: 'half' }),
            createField('leftWaveformDifference', 'Waveform Pattern Difference', 'select', [
                'Present', 'Reduced', 'Absent'
            ], { normalValue: 'Absent', width: 'half' }),
            createField('leftNonVibratingSegment', 'Non-vibrating Segment', 'select', [
                'Absent', 'Present'
            ], { normalValue: 'Absent', width: 'half' })
        ], { icon: '⬅️' }),

        // 6. Glottic Closure Pattern
        createSection('glotticClosurePattern', 'Glottic Closure Pattern', [
            createField('closurePattern', 'Pattern', 'multiselect', [
                'Complete',
                'Anterior gap',
                'Posterior gap',
                'Hourglass',
                'Spindle',
                'Irregular / Incomplete'
            ], { width: 'full' })
        ], { icon: '🔄' }),

        // 7. Characteristics
        createSection('characteristics', 'Characteristics', [
            createField('falseVocalCordCompression', 'False Vocal Cord Compression', 'radio', [
                'Absent', 'Present'
            ], { width: 'half' }),
            createField('arytenoidRotation', 'Arytenoid Rotation', 'radio', [
                'Absent', 'Present'
            ], { width: 'half' })
        ], { icon: '🎯' }),

        // 8. Lesion Assessment (if any)
        createSection('lesionAssessment', 'Lesion Assessment (if any)', [
            createField('lesionSite', 'Site', 'multiselect', [
                'Right', 'Left', 'Bilateral'
            ], { width: 'full' }),
            createField('lesionType', 'Type', 'multiselect', [
                'Nodule', 'Polyp', 'Cyst', 'Scar', 'Sulcus', 'Leukoplakia'
            ], { width: 'full' }),
            createField('effectOnVibration', 'Effect on Vibration', 'textarea', undefined, {
                placeholder: 'Describe effect on vibration',
                width: 'full'
            })
        ], { icon: '🔍' }),

        // 9. Voice Task Performance
        createSection('voiceTaskPerformance', 'Voice Task Performance', [
            createField('sustainedPhonation', 'Sustained Phonation', 'radio', [
                'Adequate', 'Poor'
            ], { width: 'third' }),
            createField('pitchRange', 'Pitch Range', 'radio', [
                'Normal', 'Reduced'
            ], { width: 'third' }),
            createField('loudnessControl', 'Loudness Control', 'radio', [
                'Normal', 'Reduced'
            ], { width: 'third' })
        ], { icon: '🎤' }),

        // 10. Complications / Associated Findings
        createSection('complications', 'Complications / Associated Findings', [
            createField('complications', 'Complications', 'multiselect', [
                'None',
                'Gagging',
                'Cough',
                'Others'
            ], { width: 'full' }),
            createField('complicationsOther', 'Other Complications', 'text', undefined, {
                placeholder: 'Specify if Others selected',
                width: 'full'
            })
        ], { icon: '⚠️' }),

        // 11. Interventions (If Any)
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

        // 12. Advice / Plan
        createSection('plan', 'Advice / Plan', [
            createField('plan', 'Plan', 'multiselect', [
                'Voice therapy',
                'Medical management',
                'Microlaryngeal surgery',
                'Voice rest',
                'Follow-up stroboscopy',
                'Others'
            ], { width: 'full', required: true }),
            createField('planOther', 'Other Plan', 'text', undefined, {
                placeholder: 'Specify if Others selected',
                width: 'full'
            })
        ], { icon: '📝', collapsible: false })
    ]
};

// Normal values for templates
export const VL_RIGID_NORMAL_VALUES: Record<string, string | string[]> = {
    topicalDecongestant: 'Yes',
    topicalLignocaine: 'Yes',
    patientTolerance: 'Good',
    endoscopeType: 'Rigid',
    diameter: '8 mm',
    angle: '70°',
    baseOfTongue: 'Normal',
    vallecula: 'Clear',
    epiglottis: 'Normal',
    aryepiglotticFolds: 'Normal',
    arytenoids: 'Normal',
    falseCords: 'Normal',
    trueVocalCords: 'Normal',
    vocalCordMobility: 'Normal',
    glotticClosure: 'Complete',
    subglottis: 'Normal',
    // Lesion fields left empty for normal
    complications: ['None'],
    impression: 'Normal laryngoscopic examination. Bilateral vocal cords are mobile with complete glottic closure.',
    plan: []
};

export const VL_FLEXIBLE_NORMAL_VALUES: Record<string, string | string[]> = {
    ...VL_RIGID_NORMAL_VALUES,
    nasopharynx: 'Normal',
    oropharynx: 'Normal',
    epiglottis: 'Normal',
    interarytenoidRegion: 'Normal',
    voiceQuality: 'Normal',
    voicePitch: 'Normal'
};

export const STROBOSCOPY_NORMAL_VALUES: Record<string, string | string[]> = {
    voiceAbuseOveruse: 'No',
    smokingAlcohol: 'No',
    gerd: 'No',
    previousEarSurgery: 'No',
    recurrentInfections: 'No',
    trauma: 'No',
    swimmingWaterExposure: 'No',
    vertigoFacialWeakness: 'No',
    endoscopeType: 'Rigid Stroboscope',
    // Right Vocal Fold
    rightVocalFoldEdge: 'Smooth',
    rightColor: 'Normal',
    rightAmplitude: 'Normal',
    rightMucosalWave: 'Normal',
    rightPhaseSymmetry: 'Symmetric',
    rightPeriodicity: 'Regular',
    rightWaveformDifference: 'Absent',
    rightNonVibratingSegment: 'Absent',
    // Left Vocal Fold
    leftVocalFoldEdge: 'Smooth',
    leftColor: 'Normal',
    leftAmplitude: 'Normal',
    leftMucosalWave: 'Normal',
    leftPhaseSymmetry: 'Symmetric',
    leftPeriodicity: 'Regular',
    leftWaveformDifference: 'Absent',
    leftNonVibratingSegment: 'Absent',
    // Glottic Closure Pattern
    closurePattern: ['Complete'],
    // Characteristics
    falseVocalCordCompression: 'Absent',
    arytenoidRotation: 'Absent',
    // Voice Task Performance
    sustainedPhonation: 'Adequate',
    pitchRange: 'Normal',
    loudnessControl: 'Normal',
    // Complications & Interventions
    complications: ['None'],
    interventions: ['None'],
    impression: 'Normal stroboscopy. Bilateral vocal folds show symmetric vibration with normal mucosal wave and complete glottic closure.',
    plan: []
};

// Backwards compatibility exports
export const RVL_NORMAL_VALUES = VL_RIGID_NORMAL_VALUES;
export const FVL_NORMAL_VALUES = VL_FLEXIBLE_NORMAL_VALUES;
