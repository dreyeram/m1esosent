// ENT Anatomical Templates for AnnotateX
// These templates serve as base layers for clinical annotations

export interface AnatomyTemplate {
    id: string;
    name: string;
    description: string;
    imagePath: string;
    procedureTypes: string[];  // Which procedures use this template
    hotspots?: {               // Pre-defined annotation points (optional)
        id: string;
        label: string;
        x: number;             // Percentage from left
        y: number;             // Percentage from top
    }[];
}

export const ENT_TEMPLATES: AnatomyTemplate[] = [
    {
        id: 'sinus_map',
        name: 'Sinus Map',
        description: 'Paranasal sinuses frontal view - mark polyp locations, debrided areas',
        imagePath: '/templates/ent/sinus_map.png',
        procedureTypes: ['nasal_endoscopy', 'nasal_sinus_nasal_endoscopy', 'dne', 'fess'],
        hotspots: [
            { id: 'frontal_left', label: 'Left Frontal Sinus', x: 35, y: 20 },
            { id: 'frontal_right', label: 'Right Frontal Sinus', x: 65, y: 20 },
            { id: 'ethmoid', label: 'Ethmoid Sinuses', x: 50, y: 35 },
            { id: 'maxillary_left', label: 'Left Maxillary Sinus', x: 30, y: 55 },
            { id: 'maxillary_right', label: 'Right Maxillary Sinus', x: 70, y: 55 },
        ]
    },
    {
        id: 'larynx_map',
        name: 'Larynx / Vocal Cords',
        description: 'Superior view of vocal folds - mark lesion positions',
        imagePath: '/templates/ent/larynx_map.png',
        procedureTypes: ['laryngoscopy', 'stroboscopy', 'vl_flexible', 'vl_rigid'],
        hotspots: [
            { id: 'epiglottis', label: 'Epiglottis', x: 50, y: 15 },
            { id: 'left_vocal_fold', label: 'Left Vocal Fold', x: 35, y: 50 },
            { id: 'right_vocal_fold', label: 'Right Vocal Fold', x: 65, y: 50 },
            { id: 'left_arytenoid', label: 'Left Arytenoid', x: 35, y: 75 },
            { id: 'right_arytenoid', label: 'Right Arytenoid', x: 65, y: 75 },
            { id: 'glottis', label: 'Glottis', x: 50, y: 55 },
        ]
    },
    {
        id: 'nasal_septum',
        name: 'Nasal Septum',
        description: 'Frontal cross-section - mark deviations, perforations',
        imagePath: '/templates/ent/nasal_septum.png',
        procedureTypes: ['nasal_endoscopy', 'septoplasty', 'dne'],
        hotspots: [
            { id: 'septum_upper', label: 'Upper Septum', x: 50, y: 25 },
            { id: 'septum_middle', label: 'Middle Septum', x: 50, y: 50 },
            { id: 'septum_lower', label: 'Lower Septum', x: 50, y: 75 },
            { id: 'left_turbinate', label: 'Left Inferior Turbinate', x: 25, y: 60 },
            { id: 'right_turbinate', label: 'Right Inferior Turbinate', x: 75, y: 60 },
        ]
    },
    {
        id: 'tympanic_membrane',
        name: 'Tympanic Membrane',
        description: 'Otoscopic view - mark perforations, retractions',
        imagePath: '/templates/ent/tympanic_membrane.png',
        procedureTypes: ['otoendoscopy', 'otoscopy', 'ees'],
        hotspots: [
            { id: 'pars_flaccida', label: 'Pars Flaccida', x: 50, y: 15 },
            { id: 'malleus_handle', label: 'Handle of Malleus', x: 45, y: 45 },
            { id: 'umbo', label: 'Umbo', x: 45, y: 60 },
            { id: 'cone_of_light', label: 'Cone of Light', x: 60, y: 70 },
            { id: 'pars_tensa', label: 'Pars Tensa', x: 55, y: 50 },
        ]
    }
];

// Helper to get template by procedure type
export function getTemplateForProcedure(procedureType: string): AnatomyTemplate | null {
    if (!procedureType) return null;
    const lower = procedureType.toLowerCase();

    // Extract subtype from encoded format (specialty:category:subtype)
    const parts = procedureType.split(':');
    const subtype = parts.length === 3 ? parts[2].toLowerCase() : lower;

    return ENT_TEMPLATES.find(t =>
        t.procedureTypes.some(pt => subtype.includes(pt) || pt.includes(subtype))
    ) || null;
}

// Get all templates
export function getAllTemplates(): AnatomyTemplate[] {
    return ENT_TEMPLATES;
}
