export type ReportType = 'GI' | 'ENT' | 'Pulmonology' | 'Orthopedics';

export interface ReportHeader {
    procedureDate: string;
    endoscopist: string;
    patientMRN: string;
    ageSex: string;
    referredBy: string;
    sedation: {
        drug: string;
        dose: number;
    };
    anesthesiaGrade: 'ASA I' | 'ASA II' | 'ASA III' | 'ASA IV';
    instrument: string;
    assistant: string;
}

// --- GI Module ---

export interface ColonoscopyData {
    indication: string[];
    bowelPrep: {
        agent: string;
        quality: {
            right: number;
            transverse: number;
            left: number;
            total: number;
        };
    };
    dre: string;
    extentReached: string;
    landmarks: string[];
    withdrawalTime: number;
    findings: GIFinding[];
}

export interface GIFinding {
    id: string;
    location: string;
    type: 'Normal' | 'Polyp' | 'Diverticulosis' | 'Ulcer' | 'Inflammation' | 'Tumor/Mass' | 'Hemorrhoids';
    // Sub-forms
    polyp?: {
        size: number;
        number: number;
        morphology: string;
        intervention: string;
        retrieved: boolean;
    };
    diverticulosis?: {
        severity: string;
        signs: string[];
    };
    colitis?: {
        mayoScore: number;
        appearance: string[];
    };
    hemorrhoids?: {
        grade: string;
        bleeding: boolean;
        therapy: string;
    };
}

export interface EGDData {
    esophagus: {
        mucosa: string;
        esophagitisGrade?: string; // LA Class
        barretts?: { c: number; m: number }; // Prague
        varices: string;
        stricture: boolean;
    };
    stomach: {
        gastritisType: string;
        location: string[];
        ulcers: {
            size: number;
            forrestClass: string;
            treatment: string;
        }[];
        biopsy: boolean; // H. Pylori
    };
    duodenum: {
        bulbD2: string;
    };
}

// --- ENT Module ---

export interface NasalCavitySide {
    septum: string;
    inferiorTurbinate: string;
    middleTurbinate: string;
    meatus: string;
    polyps: string;
}

export interface DNEData {
    left: NasalCavitySide;
    right: NasalCavitySide;
    nasopharynx: {
        adenoids: string;
        eustachianTube: string;
        mass: string;
    };
}

export interface LaryngoscopyData {
    epiglottis: string;
    arytenoids: string;
    vocalCords: string;
    cordMovement: string;
    glotticGap: string;
    pyriformFossa: string;
}

// --- Pulmonology Module ---

export interface BronchialFindings {
    mucosa: string;
    secretions: string;
    mass: string;
}

export interface BronchoscopyData {
    route: string;
    vocalCords: string;
    trachea: string;
    carina: string;
    rightLung: {
        segments: string[]; // RUL, RML, RLL
        findings: BronchialFindings;
    };
    leftLung: {
        segments: string[]; // LUL, Lingula, LLL
        findings: BronchialFindings;
    };
    samples: string[];
}

// --- Orthopedics Module ---

export interface KneeCompartment {
    meniscus?: string; // Medial/Lateral only
    meniscusTearType?: string;
    cartilage: string;
}

export interface KneeArthroscopyData {
    patellofemoral: {
        patellaCartilage: string;
        trochlea: string;
        tracking: string;
    };
    medialCompartment: KneeCompartment;
    lateralCompartment: KneeCompartment;
    intercondylarNotch: {
        acl: string;
        pcl: string;
    };
    procedures: {
        meniscus: string[];
        cartilage: string[];
        ligament: string[];
    };
}

// --- Root Report State ---

export interface EndoscopyReport {
    header: ReportHeader;
    type: ReportType;
    gi?: {
        colonoscopy?: ColonoscopyData;
        egd?: EGDData;
    };
    ent?: {
        dne?: DNEData;
        laryngoscopy?: LaryngoscopyData;
    };
    pulmonology?: {
        bronchoscopy?: BronchoscopyData;
    };
    orthopedics?: {
        knee?: KneeArthroscopyData;
    };
    footer: {
        impression: string;
        icd10: string[];
        recommendations: string;
        followUp: string;
        pathologyRequest: boolean;
    };
}
