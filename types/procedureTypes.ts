// ENT Procedure Types for ENT Solution Suite V1.0
// Cleaned for ENT-only functionality

export interface ProcedureSubtype {
    id: string;
    name: string;
    description?: string;
}

export interface ProcedureCategory {
    id: string;
    name: string;
    subtypes: ProcedureSubtype[];
}

export interface ProcedureSpecialty {
    id: string;
    name: string;
    icon?: string;
    categories: ProcedureCategory[];
}

// ENT-ONLY PROCEDURE TYPES
export const PROCEDURE_TYPES: ProcedureSpecialty[] = [
    {
        id: 'ent',
        name: 'ENT (Otolaryngology)',
        icon: '👂',
        categories: [
            {
                id: 'nasal_sinus',
                name: 'Nasal & Sinus',
                subtypes: [
                    { id: 'nasal_endoscopy', name: 'Diagnostic Nasal Endoscopy (DNE)', description: 'Examination of nasal cavity and sinuses' },
                    { id: 'rhinoscopy', name: 'Rhinoscopy (Anterior/Posterior)', description: 'Direct examination of nasal passages' },
                    { id: 'nasopharyngoscopy', name: 'Nasopharyngoscopy', description: 'Examination of nasopharynx via nasal route' },
                    { id: 'fess', name: 'FESS (Functional Endoscopic Sinus Surgery)', description: 'Endoscopic sinus surgery' },
                ]
            },
            {
                id: 'laryngeal',
                name: 'Laryngeal (Voice)',
                subtypes: [
                    { id: 'rigid_laryngoscopy', name: 'Rigid Video Laryngoscopy (RVL)', description: 'High-definition larynx examination with rigid scope' },
                    { id: 'flexible_laryngoscopy', name: 'Flexible Video Laryngoscopy (FVL)', description: 'Flexible scope examination of larynx' },
                    { id: 'stroboscopy', name: 'Video Stroboscopy', description: 'Vocal cord vibration analysis' },
                    { id: 'direct_laryngoscopy', name: 'Direct Laryngoscopy', description: 'Direct visualization under anesthesia' },
                    { id: 'indirect_laryngoscopy', name: 'Indirect Laryngoscopy', description: 'Mirror-assisted larynx examination' },
                ]
            },
            {
                id: 'pharyngeal',
                name: 'Pharyngeal',
                subtypes: [
                    { id: 'pharyngoscopy', name: 'Pharyngoscopy', description: 'Examination of pharynx' },
                    { id: 'oropharyngoscopy', name: 'Oropharyngoscopy', description: 'Examination of oral pharynx' },
                ]
            },
            {
                id: 'otology',
                name: 'Otology (Ear)',
                subtypes: [
                    { id: 'otoendoscopy', name: 'Otoendoscopy', description: 'Endoscopic ear examination' },
                    { id: 'otoscopy', name: 'Otoscopy', description: 'Standard ear examination' },
                    { id: 'ees', name: 'Endoscopic Ear Surgery (EES)', description: 'Minimally invasive ear surgery' },
                    { id: 'myringotomy', name: 'Myringotomy', description: 'Eardrum incision procedure' },
                ]
            },
            {
                id: 'sleep',
                name: 'Sleep Medicine',
                subtypes: [
                    { id: 'sleep_apnea', name: 'Sleep Apnea Endoscopy (DISE)', description: 'Drug-induced sleep endoscopy' },
                    { id: 'upper_airway', name: 'Upper Airway Assessment', description: 'Airway evaluation for OSA' },
                ]
            },
            {
                id: 'head_neck',
                name: 'Head & Neck',
                subtypes: [
                    { id: 'neck_mass', name: 'Neck Mass Evaluation', description: 'Endoscopic neck mass assessment' },
                    { id: 'thyroid_exam', name: 'Thyroid Examination', description: 'Thyroid and parathyroid assessment' },
                    { id: 'salivary_gland', name: 'Salivary Gland Endoscopy', description: 'Sialendoscopy' },
                ]
            }
        ]
    }
];

// Helper functions
export function getProcedureDisplayName(
    specialtyId: string,
    categoryId: string,
    subtypeId: string
): string {
    const specialty = PROCEDURE_TYPES.find(s => s.id === specialtyId);
    if (!specialty) return subtypeId;

    const category = specialty.categories.find(c => c.id === categoryId);
    if (!category) return subtypeId;

    const subtype = category.subtypes.find(s => s.id === subtypeId);
    return subtype?.name || subtypeId;
}

export function getProcedureFullPath(
    specialtyId: string,
    categoryId: string,
    subtypeId: string
): string {
    const specialty = PROCEDURE_TYPES.find(s => s.id === specialtyId);
    if (!specialty) return subtypeId;

    const category = specialty.categories.find(c => c.id === categoryId);
    if (!category) return `${specialty.name} > ${subtypeId}`;

    const subtype = category.subtypes.find(s => s.id === subtypeId);
    return `${specialty.name} > ${category.name} > ${subtype?.name || subtypeId}`;
}

export function findProcedureBySubtypeId(subtypeId: string): {
    specialty: ProcedureSpecialty;
    category: ProcedureCategory;
    subtype: ProcedureSubtype;
} | null {
    for (const specialty of PROCEDURE_TYPES) {
        for (const category of specialty.categories) {
            const subtype = category.subtypes.find(s => s.id === subtypeId);
            if (subtype) {
                return { specialty, category, subtype };
            }
        }
    }
    return null;
}

// Combined procedure type string for database storage
export function encodeProcedureType(
    specialtyId: string,
    categoryId: string,
    subtypeId: string
): string {
    return `${specialtyId}:${categoryId}:${subtypeId}`;
}

export function decodeProcedureType(encoded: string): {
    specialtyId: string;
    categoryId: string;
    subtypeId: string;
} {
    const [specialtyId, categoryId, subtypeId] = encoded.split(':');
    return { specialtyId: specialtyId || '', categoryId: categoryId || '', subtypeId: subtypeId || '' };
}

// Get all procedure subtypes as a flat list
export function getAllProcedureSubtypes(): Array<{
    specialty: ProcedureSpecialty;
    category: ProcedureCategory;
    subtype: ProcedureSubtype;
    encoded: string;
}> {
    const result: Array<{
        specialty: ProcedureSpecialty;
        category: ProcedureCategory;
        subtype: ProcedureSubtype;
        encoded: string;
    }> = [];

    for (const specialty of PROCEDURE_TYPES) {
        for (const category of specialty.categories) {
            for (const subtype of category.subtypes) {
                result.push({
                    specialty,
                    category,
                    subtype,
                    encoded: encodeProcedureType(specialty.id, category.id, subtype.id)
                });
            }
        }
    }

    return result;
}

// Get categories for a specialty
export function getCategoriesForSpecialty(specialtyId: string): ProcedureCategory[] {
    const specialty = PROCEDURE_TYPES.find(s => s.id === specialtyId);
    return specialty?.categories || [];
}

// Get subtypes for a category
export function getSubtypesForCategory(specialtyId: string, categoryId: string): ProcedureSubtype[] {
    const specialty = PROCEDURE_TYPES.find(s => s.id === specialtyId);
    if (!specialty) return [];

    const category = specialty.categories.find(c => c.id === categoryId);
    return category?.subtypes || [];
}
