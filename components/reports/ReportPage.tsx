"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Check, Download, Wand2, Save, Printer, Mail, MessageCircle,
    FileText, Calendar, User, ChevronDown, LayoutGrid, Image as ImageIcon,
    Loader2, Search, Settings, HelpCircle, Share2, Type, Layout, Eye, AlertCircle,
    Undo2, Redo2, Scissors, Copy, Clipboard, Minus, Maximize2, X, Trash2, Plus, Home
} from "lucide-react";
import { useSessionStore } from "@/lib/store/session.store";
import { getPatientDetails, updateProcedureType, saveReport } from "@/app/actions/procedure";
import { getEquipment } from "@/app/actions/equipment";
import { getMedicines } from "@/app/actions/inventory";
import { getAllTemplates, resolveTemplate, getNormalValues } from "@/data/reportTemplates";
import { resolveImageUrl } from "@/lib/utils/image";

// --- Components ---
import { StudioToolbar, ImageSidebar, ImageLayout } from "./ReportStudio";
import InlineDropdown, { BilateralDropdown } from "./InlineDropdown";

const WORD_BLUE = "#2b579a";
const WORD_RIBBON_BG = "#f3f2f1";

// --- Sub-components for A4 Context (Moved outside to fix typing focus) ---

const Letterhead = ({ doctor, patient, hospital, reportName }: any) => {
    const orgName = hospital?.name || 'PREDISCAN HOSPITAL';
    const orgAddress = hospital?.address || 'IITM Research Park, Chennai';
    const orgEmail = hospital?.contactEmail || hospital?.email || 'prediscan@gmail.com';
    const orgPhone = hospital?.mobile || '+91 7339286710';
    const rawLogo = hospital?.logoPath || '';

    // Resolve logo using centralized utility
    const orgLogo = useMemo(() => resolveImageUrl(rawLogo), [rawLogo]);

    const doctorName = doctor?.fullName || 'Shara';
    const doctorDegree = doctor?.degree ? `, ${doctor.degree}` : '';
    const doctorRole = doctor?.role || 'Consultant Specialist';
    const hasDrPrefix = doctorName.toLowerCase().startsWith('dr');
    const formattedDrName = hasDrPrefix ? doctorName : `Dr. ${doctorName}`;
    const [logoError, setLogoError] = React.useState(false);

    return (
        <div className="flex flex-col mb-6 select-none bg-white w-full">
            {/* Top Row: Brand & Contact */}
            <div className="flex items-center justify-between py-4 relative">
                <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0 pr-4">
                    {/* Logo Area */}
                    {orgLogo && !logoError ? (
                        <div className="h-14 w-auto max-w-[140px] flex items-center justify-center shrink-0">
                            <img src={orgLogo} alt={orgName} className="max-w-full h-full object-contain" onError={() => setLogoError(true)} />
                        </div>
                    ) : (
                        <div className="h-14 w-14 bg-blue-900 rounded-full flex items-center justify-center shrink-0 text-white font-serif font-black text-2xl">
                            {orgName.charAt(0)}
                        </div>
                    )}

                    {/* Hospital Name & Address */}
                    <div className="flex flex-col gap-0.5 mt-1 min-w-0">
                        <h1 className="text-[20px] sm:text-[22px] font-bold text-zinc-900 uppercase tracking-wide leading-tight">{orgName}</h1>
                        <p className="text-[13px] font-medium text-zinc-900 leading-tight">{orgAddress}</p>
                    </div>
                </div>

                {/* Right: Contact Info */}
                <div className="flex flex-col items-start gap-1 text-[13px] font-bold text-zinc-900 shrink-0">
                    {orgPhone && <div>Contact: {orgPhone}</div>}
                    {orgEmail && <div>Mail: &nbsp;&nbsp;{orgEmail}</div>}
                </div>
            </div>

            {/* Solid Horizontal Divider */}
            <div className="h-[1.5px] w-full bg-zinc-900" />

            {/* Bottom Row: Demographics & Report/Doctor */}
            <div className="py-4 flex justify-between items-start gap-4">
                {/* Left: Demographics Table */}
                <div className="grid grid-cols-[85px_12px_auto] gap-y-[3px] text-[13px] text-zinc-900 font-medium">
                    <span className="text-zinc-600">MRN No</span><span>:</span><span className="font-bold">{patient.mrn}</span>
                    <span className="text-zinc-600">Name</span><span>:</span><span className="font-bold uppercase">{patient.fullName || 'PATIENT'}</span>
                    <span className="text-zinc-600">Age/Sex</span><span>:</span><span className="font-bold">{patient.age || '--'} Years/{patient.gender || '--'}</span>
                    <span className="text-zinc-600">Address</span><span>:</span><span className="font-bold uppercase">{patient.address || 'N/A'}</span>
                    <span className="text-zinc-600">Report Date</span><span>:</span><span className="font-bold uppercase">
                        {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, ' ')}/{new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-zinc-600">Ref</span><span>:</span><span className="font-bold uppercase">{patient.referringDoctor || 'N/A'}</span>
                </div>

                {/* Right: Pill & Doctor */}
                <div className="flex flex-col items-end gap-5 pt-1 border-l-0 shrink-0">
                    <div className="bg-[#1f3a8a] px-6 py-2 rounded-xl">
                        <h2 className="text-[14px] font-bold text-white uppercase tracking-tight">
                            {reportName || "DIAGNOSTIC NASAL ENDOSCOPY REPORT"}
                        </h2>
                    </div>

                    <div className="flex flex-col items-end text-[13px] gap-[2px]">
                        <div className="flex items-center gap-2">
                            <span className="text-zinc-600 font-medium">Consultant Name :</span>
                            <span className="font-bold text-zinc-900">{formattedDrName}{doctorDegree}</span>
                        </div>
                        <span className="text-zinc-700 font-medium">{doctorRole}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Footer = ({ doctor }: any) => {
    // The new design incorporates consultant info into the header
    return null;
};

const VisualSelectorA4 = ({ segments, activeTabId, onSelect }: any) => (
    <div className="space-y-6 py-8 flex-1 flex flex-col items-center justify-center">
        <div className="text-center space-y-2">
            <h3 className="text-lg font-serif text-zinc-900 italic">Select Procedure Template</h3>
            <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Segment P{segments.find((s: any) => s.id === activeTabId)?.index}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-md">
            {getAllTemplates().map(t => (
                <button
                    key={t.id}
                    onClick={() => onSelect(t.id)}
                    className="group p-3 bg-white border border-zinc-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center gap-2 text-center"
                >
                    <div className="w-8 h-8 rounded-md bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileText size={16} />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-bold text-zinc-800 leading-tight">{t.name}</h4>
                        <p className="text-[8px] text-zinc-400">{t.shortName}</p>
                    </div>
                </button>
            ))}
        </div>
    </div>
);

function RenderField({ field, value, onChange, colSpan = 1 }: any) {
    const isFullWidth = field.type === 'textarea' || field.type === 'bilateral' || colSpan === 2;

    const label = (
        <div className="w-[160px] shrink-0">
            <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 select-none group-hover:text-zinc-500 transition-colors whitespace-nowrap overflow-hidden text-ellipsis block">
                {field.label}
            </span>
        </div>
    );

    if (field.type === 'textarea') {
        return (
            <div className="group mt-4 mb-6">
                <div className="flex items-center mb-2">
                    {field.label && (
                        <span className="text-[10px] uppercase tracking-widest font-extrabold text-blue-900/60 mr-3">{field.label}</span>
                    )}
                    <div className="h-px flex-1 bg-zinc-100" />
                </div>
                <textarea
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full min-h-[60px] p-4 text-[12px] font-serif text-zinc-900 bg-white border border-zinc-200 rounded-lg focus:ring-1 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-zinc-200 resize-none leading-relaxed shadow-sm"
                    placeholder="Enter details..."
                    rows={field.rows || 3}
                />
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-[160px_1fr] items-center gap-3 group min-h-[28px] border-b border-zinc-50 hover:border-zinc-100 transition-all pb-1 ${isFullWidth ? 'max-w-3xl' : ''}`}>
            {label}
            <div className="flex-1 min-w-0">
                {field.type === 'bilateral' ? (
                    <BilateralDropdown
                        label={field.label}
                        leftValue={value?.left || ''}
                        rightValue={value?.right || ''}
                        options={field.options || []}
                        onLeftChange={(v) => onChange({ ...value, left: v })}
                        onRightChange={(v) => onChange({ ...value, right: v })}
                    />
                ) : field.type === 'select' || field.type === 'multiselect' || field.type === 'radio' ? (
                    <InlineDropdown
                        value={value}
                        options={field.options || []}
                        onChange={onChange}
                        placeholder="Select..."
                        multiple={field.type === 'multiselect'}
                    />
                ) : (
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full bg-transparent border-none text-[11px] font-medium text-zinc-900 p-0 focus:ring-0 placeholder:text-zinc-200 h-[22px]"
                        placeholder="..."
                    />
                )}
            </div>
        </div>
    );
}

const PrescriptionSection = ({ prescriptions = [], availableMedicines = [], onChange }: any) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const filteredMeds = (availableMedicines || []).filter((m: any) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.genericName?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);

    const addMed = (med: any) => {
        const newItem = {
            id: med.id,
            name: med.name,
            generic: med.genericName,
            dosage: "",
            frequency: "1-0-1",
            duration: "5 Days",
            instruction: "After Food"
        };
        onChange([...prescriptions, newItem]);
        setIsAdding(false);
        setSearchTerm("");
    };

    const removeMed = (index: number) => {
        onChange(prescriptions.filter((_: any, i: number) => i !== index));
    };

    const updateMed = (index: number, key: string, val: string) => {
        const next = [...prescriptions];
        next[index] = { ...next[index], [key]: val };
        onChange(next);
    };

    return (
        <div className="mt-8 border-t-[1.5px] border-zinc-900 pt-4 select-none">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-blue-900 rounded-full" />
                    <h2 className="text-[11px] font-black text-blue-900 uppercase tracking-[0.15em]">Prescription / Rx</h2>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="text-[9px] font-bold text-blue-700 hover:text-blue-900 uppercase tracking-wider flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full transition-colors border border-blue-100 shadow-sm"
                    >
                        <Plus size={10} /> Add Rx
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="mb-4 p-3 bg-white rounded-xl border border-blue-100 shadow-xl relative z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-3 mb-3 pb-2 border-b border-zinc-50">
                        <Search size={12} className="text-zinc-400" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Find medicine by name or generic..."
                            className="flex-1 bg-transparent border-none text-[11px] focus:ring-0 p-0 text-zinc-900"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button onClick={() => setIsAdding(false)} className="text-zinc-300 hover:text-zinc-500"><X size={14} /></button>
                    </div>
                    <div className="space-y-1">
                        {filteredMeds.map((m: any) => (
                            <button
                                key={m.id}
                                onClick={() => addMed(m)}
                                className="w-full text-left p-2 hover:bg-zinc-50 rounded-lg text-[11px] flex items-center justify-between group transition-colors"
                            >
                                <div className="flex flex-col">
                                    <span className="font-bold text-zinc-800">{m.name}</span>
                                    <span className="text-[9px] text-zinc-400 font-serif italic">{m.genericName}</span>
                                </div>
                                <Plus size={12} className="text-zinc-200 group-hover:text-blue-600" />
                            </button>
                        ))}
                        {searchTerm && filteredMeds.length === 0 && (
                            <div className="text-center py-4 text-[10px] text-zinc-400 italic">No medicines found</div>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {prescriptions.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 text-[11px] group bg-zinc-50/50 p-2.5 rounded-lg border border-transparent hover:border-zinc-200 hover:bg-white transition-all">
                        <div className="flex-1 flex flex-col min-w-0">
                            <span className="font-bold text-zinc-900 truncate uppercase">{p.name}</span>
                            <span className="text-[9px] text-zinc-400 font-serif italic truncate">{p.generic}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                className="w-16 bg-transparent border-none text-[10px] text-zinc-600 p-0 focus:ring-0 placeholder:text-zinc-200"
                                placeholder="Dosage (e.g. 500mg)"
                                value={p.dosage}
                                onChange={(e) => updateMed(i, "dosage", e.target.value)}
                            />
                            <div className="h-3 w-px bg-zinc-100" />
                            <input
                                className="w-12 bg-transparent border-none text-[10px] text-zinc-600 p-0 focus:ring-0 text-center"
                                value={p.frequency}
                                onChange={(e) => updateMed(i, "frequency", e.target.value)}
                            />
                            <div className="h-3 w-px bg-zinc-100" />
                            <input
                                className="w-12 bg-transparent border-none text-[10px] text-zinc-600 p-0 focus:ring-0 text-center"
                                value={p.duration}
                                onChange={(e) => updateMed(i, "duration", e.target.value)}
                            />
                            <button onClick={() => removeMed(i)} className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 transition-all">
                                <Trash2 size={10} />
                            </button>
                        </div>
                    </div>
                ))}
                {prescriptions.length === 0 && !isAdding && (
                    <div className="text-[9px] text-zinc-300 italic py-2">No medications prescribed.</div>
                )}
            </div>
        </div>
    );
};

// --- Main Component ---
interface ReportPageProps {
    patient: any;
    doctor: any;
    hospital: any;
    captures?: any[];
    onBack: () => void;
    onBackToAnnotate?: () => void;
    onComplete: () => void;
    onSave: (data: any, action?: string) => Promise<Blob | void | undefined>;
    onGeneratePDF: (data: any, action?: string) => Promise<Blob | undefined>;
    onSaveSuccess?: () => void;
}

export default function ReportPage({
    patient,
    doctor,
    hospital,
    captures = [],
    onBack,
    onBackToAnnotate,
    onComplete,
    onSave,
    onGeneratePDF,
    onSaveSuccess
}: ReportPageProps) {
    const { segments, activeSegmentIndex, setActiveSegment } = useSessionStore();

    // --- Doctor Format ---
    const rawDoctorName = doctor?.fullName || doctor?.name || 'Shara';
    const doctorDegree = doctor?.degree ? `, ${doctor.degree}` : '';
    const doctorRole = doctor?.role || 'Consultant Specialist';
    const hasDrPrefix = rawDoctorName.toLowerCase().startsWith('dr');
    const formattedDrName = hasDrPrefix ? rawDoctorName : `Dr. ${rawDoctorName}`;

    // --- State ---
    const [isLoading, setIsLoading] = useState(true);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const [activeRibbonTab, setActiveRibbonTab] = useState('Home');

    const [proceduresData, setProceduresData] = useState<Record<string, any>>({});
    const [mediaCache, setMediaCache] = useState<Record<string, any[]>>({});
    const [formState, setFormState] = useState<Record<string, any>>({});
    const [selectedImagesMap, setSelectedImagesMap] = useState<Record<string, string[]>>({});
    const [captionsMap, setCaptionsMap] = useState<Record<string, Record<string, string>>>({});

    const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
    const [availableMedicines, setAvailableMedicines] = useState<any[]>([]);
    const [selectedEquipment, setSelectedEquipment] = useState<Record<string, string[]>>({});
    const [prescriptions, setPrescriptions] = useState<Record<string, any[]>>({});

    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

    // Stable refs to prevent useEffect re-triggers from prop reference changes
    const capturesRef = useRef(captures);
    capturesRef.current = captures;
    const segmentIdsKey = useMemo(() => segments.map(s => s.id).sort().join(','), [segments]);
    const hasLoadedRef = useRef(false);

    // --- Effects ---
    useEffect(() => {
        hasLoadedRef.current = false; // reset on patient/segment change
        const load = async () => {
            setIsLoading(true);
            const res = await getPatientDetails(patient.id);
            if (res.success && res.procedures) {
                const pData: any = {};
                const mCache: any = {};
                const fState: any = {};
                const sImages: any = {};
                const cMap: any = {};

                // [FIX] Initialize proceduresData from segments prop FIRST (persists in-memory types)
                // Then merge DB data
                segments.forEach((s: any) => {
                    pData[s.id] = {
                        id: s.id,
                        type: s.type || 'generic',
                        status: s.status || 'draft',
                        finalized: false
                    };
                    mCache[s.id] = [];
                });

                res.procedures.forEach((proc: any) => {
                    pData[proc.id] = {
                        id: proc.id,
                        type: (proc.type && proc.type !== 'generic') ? proc.type : (pData[proc.id]?.type || 'generic'),
                        status: proc.status,
                        finalized: proc.report?.finalized
                    };

                    // DB Media
                    const dbMedia = (proc.media || []).map((m: any) => ({
                        id: m.id,
                        url: m.url || (m.filePath ? resolveImageUrl(m.filePath) : ''),
                        type: m.type === 'VIDEO' ? 'video' : 'image',
                        timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        category: m.type === 'ANNOTATED' ? 'report' : 'raw',
                        originId: m.originId // [ADDED]
                    }));
                    mCache[proc.id] = dbMedia;

                    if (proc.report?.content) {
                        try {
                            const parsed = typeof proc.report.content === 'string' ? JSON.parse(proc.report.content) : proc.report.content;
                            fState[proc.id] = parsed.formData || {};

                            // [FIX] Recover type from report content if DB/Segment is currently 'generic'
                            const recoveredType = parsed.procedureType || parsed.type;
                            if (recoveredType && recoveredType !== 'generic' && pData[proc.id].type === 'generic') {
                                console.log(`Recovered type for ${proc.id}: ${recoveredType}`);
                                pData[proc.id].type = recoveredType;
                            }
                            sImages[proc.id] = (parsed.selectedImages || []).map((img: any) => {
                                const found = mCache[proc.id].find((m: any) => m.url === img.url || m.id === img.id);
                                return found ? found.id : null;
                            }).filter(Boolean);

                            const caps: any = {};
                            (parsed.selectedImages || []).forEach((img: any) => {
                                const found = mCache[proc.id].find((m: any) => m.url === img.url || m.id === img.id);
                                if (found) caps[found.id] = img.caption;
                            });
                            cMap[proc.id] = caps;

                            // Extract imports from report content
                            if (parsed.captures && Array.isArray(parsed.captures)) {
                                const importedMedia = parsed.captures.map((m: any) => ({
                                    id: m.id,
                                    url: m.url || (m.filePath ? resolveImageUrl(m.filePath) : ''),
                                    type: m.type || 'image',
                                    timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                                    category: m.type === 'ANNOTATED' ? 'report' : (m.category || 'raw'),
                                    originId: m.originId // [ADDED]
                                }));

                                const existingIds = new Set(mCache[proc.id].map((x: any) => x.id));
                                const existingUrls = new Set(mCache[proc.id].map((x: any) => x.url).filter(Boolean));
                                importedMedia.forEach((im: any) => {
                                    if (!existingIds.has(im.id) && !(im.url && existingUrls.has(im.url))) {
                                        mCache[proc.id].push(im);
                                        existingIds.add(im.id);
                                        if (im.url) existingUrls.add(im.url);
                                    }
                                });
                            }
                        } catch (e) { }
                    }
                });

                // [FIX] Merge prop 'captures' (from Annotator - in-memory) for ALL segments
                const currentCaptures = capturesRef.current;
                if (currentCaptures && currentCaptures.length > 0) {
                    const capturesByProc: Record<string, any[]> = {};
                    const unassigned: any[] = [];

                    currentCaptures.forEach((m: any) => {
                        const pid = m.procedureId;
                        if (pid) {
                            if (!capturesByProc[pid]) capturesByProc[pid] = [];
                            capturesByProc[pid].push(m);
                        } else {
                            unassigned.push(m);
                        }
                    });

                    // Helper to merge media into cache — dedup by ID AND URL
                    const mergeMedia = (pid: string, mediaList: any[]) => {
                        if (!mCache[pid]) mCache[pid] = [];
                        const propMedia = mediaList.map((m: any) => ({
                            id: m.id,
                            url: m.url || m.base64 || (m.filePath ? resolveImageUrl(m.filePath) : ''),
                            base64: m.base64,
                            type: m.type || 'image',
                            timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                            category: 'report'
                        }));
                        const existingIds = new Set(mCache[pid].map((x: any) => x.id));
                        const existingUrls = new Set(mCache[pid].map((x: any) => x.url).filter(Boolean));
                        propMedia.forEach((im: any) => {
                            if (!existingIds.has(im.id) && !(im.url && existingUrls.has(im.url))) {
                                mCache[pid].push(im);
                                existingIds.add(im.id);
                                if (im.url) existingUrls.add(im.url);
                            }
                        });
                    };

                    // 1. Add assigned images
                    Object.keys(capturesByProc).forEach(pid => {
                        mergeMedia(pid, capturesByProc[pid]);
                    });

                    // 2. Add unassigned images to ALL known segments
                    if (unassigned.length > 0) {
                        const allIds = new Set([...segments.map((s: any) => s.id), ...Object.keys(pData)]);
                        allIds.forEach(pid => {
                            mergeMedia(pid, unassigned);
                        });
                    }

                    // [FIX] Auto-select captures according strictly to the final selections array
                    currentCaptures.forEach((c: any) => {
                        const pidsToSelect = c.procedureId ? [c.procedureId] : Object.keys(mCache);
                        pidsToSelect.forEach(pid => {
                            if (!sImages[pid]) sImages[pid] = [];
                            sImages[pid].push(c.id);
                        });
                    });

                    // Ensure explicit selection maps are perfectly unique to drop duplicates
                    Object.keys(sImages).forEach(pid => {
                        sImages[pid] = Array.from(new Set(sImages[pid]));
                    });
                }

                setProceduresData(pData);
                setMediaCache(mCache);
                setFormState(fState);
                setSelectedImagesMap(sImages);
                setCaptionsMap(cMap);

                // Load Prescriptions & Equipment from saved report
                const savedEquip: any = {};
                const savedRx: any = {};
                res.procedures.forEach((proc: any) => {
                    if (proc.report?.content) {
                        try {
                            const parsed = typeof proc.report.content === 'string' ? JSON.parse(proc.report.content) : proc.report.content;
                            if (parsed.equipment) savedEquip[proc.id] = parsed.equipment;
                            if (parsed.prescriptions) savedRx[proc.id] = parsed.prescriptions;
                        } catch (e) { }
                    }
                });
                setSelectedEquipment(savedEquip);
                setPrescriptions(savedRx);
            }

            // Load Inventory
            const [equipRes, medRes] = await Promise.all([getEquipment(), getMedicines()]);
            if (equipRes.success) setAvailableEquipment(equipRes.data || []);
            if (medRes.success) setAvailableMedicines(medRes.medicines || []);

            setIsLoading(false);
        };
        load();
        hasLoadedRef.current = true;
    }, [patient.id, segmentIdsKey]);

    // Handle initial segment selection
    useEffect(() => {
        if (!activeTabId && segments.length > 0) {
            setActiveTabId(segments[0].id);
        }
    }, [segments, activeTabId]);

    const handleTypeSelect = async (type: string) => {
        if (!activeTabId) return;
        try {
            console.log(`[ReportPage] Updating procedure type for ${activeTabId} to ${type}`);
            const res = await updateProcedureType(activeTabId, type);
            if (res.success) {
                // 1. Update local procedures data state
                setProceduresData(prev => ({
                    ...prev,
                    [activeTabId]: {
                        ...(prev[activeTabId] || {}),
                        type
                    }
                }));

                // 2. Also update the session store to persist across refreshes
                const updatedSegments = segments.map(s =>
                    s.id === activeTabId ? { ...s, type } : s
                );
                useSessionStore.setState({ segments: updatedSegments });
                setIsDirty(true);
            } else {
                console.error("Failed to update procedure type:", res.error);
                alert("Failed to update procedure type. Please check your connection.");
            }
        } catch (err) {
            console.error("Type update error:", err);
        }
    };

    const handleSave = async (finalize = false, overrideId?: string) => {
        setIsSaving(true);
        let allSuccess = true;

        try {
            const allSegmentsData = assembleAllSegmentsData();

            // If overrideId is provided, save just that one (for targeted actions if needed)
            const segmentsToSave = overrideId
                ? segments.filter(s => s.id === overrideId)
                : segments;

            const savePromises = segmentsToSave.map(async (segment) => {
                const targetId = segment.id;
                const segmentData = allSegmentsData.find((s: any) => s.procedureId === targetId);

                const reportContent = {
                    formData: formState[targetId] || {},
                    procedureId: targetId,
                    procedureType: segmentData?.procedureType || 'generic',
                    segments: segmentData ? [segmentData] : [],
                    // Legacy top-level fields for backwards compatibility with onViewReport matching logic
                    selectedImages: segmentData?.selectedImages || [],
                    captures: segmentData?.captures || [],
                    imageCaptions: captionsMap[targetId] || {},
                    equipment: segmentData?.equipment || [],
                    prescriptions: prescriptions[targetId] || []
                };

                const res = await saveReport({
                    procedureId: targetId,
                    content: JSON.stringify(reportContent),
                    isFinalized: finalize || hasPreviewed
                });
                return res.success;
            });

            const results = await Promise.all(savePromises);
            allSuccess = results.every(res => res === true);

        } catch (error) {
            console.error("Failed to save all segments:", error);
            allSuccess = false;
        }

        if (allSuccess) {
            setIsDirty(false);
            if (finalize) {
                handleGeneratePDF('preview');
            }
        }
        setIsSaving(false);
    };

    const handleAutoFill = () => {
        const type = activeTabId ? proceduresData[activeTabId]?.type : 'generic';
        const template = resolveTemplate(type);
        const normalValues = getNormalValues(template ? template.id : type);

        if (!template && !normalValues) return;

        let newForm = { ...(formState[activeTabId!] || {}) };

        // 1. Apply Standard Normal Values from Registry
        if (normalValues) {
            newForm = { ...newForm, ...normalValues };
        }

        // 2. Apply Defaults from Template Definition (as fallback)
        template?.sections.forEach((s: any) => s.fields.forEach((f: any) => {
            if ((f as any).default && !newForm[f.id]) {
                newForm[f.id] = (f as any).default;
            }
        }));

        setFormState({ ...formState, [activeTabId!]: newForm });
        setIsDirty(true);
    };

    const handleFieldChange = (procedureId: string, fieldId: string, val: any) => {
        setFormState(prev => ({ ...prev, [procedureId]: { ...(prev[procedureId] || {}), [fieldId]: val } }));
        setIsDirty(true);
    };


    // --- Autosave Implementation ---
    useEffect(() => {
        if (!isDirty) return;

        const timer = setTimeout(() => {
            handleSave(false);
        }, 5000); // 5 second debounce for auto-save

        return () => clearTimeout(timer);
    }, [formState, selectedEquipment, prescriptions, isDirty]);

    // --- PDF Preview State ---
    const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
    const [hasPreviewed, setHasPreviewed] = useState(false);

    // --- Data Assembly --
    const assembleAllSegmentsData = () => {
        return segments.map(seg => {
            const pid = seg.id;
            const pType = proceduresData[pid]?.type || 'generic';
            const rawForm = formState[pid] || {};
            const structure = resolveTemplate(pType)?.sections || [];

            const printableSections = structure.map((sect: any) => ({
                title: sect.title,
                items: sect.fields.map((f: any) => {
                    let val = rawForm[f.id];
                    if (f.type === 'bilateral' && val) {
                        val = `R: ${val.right || '—'} | L: ${val.left || '—'}`;
                    } else if (Array.isArray(val)) {
                        val = val.join(', ');
                    }
                    return { label: f.label, value: val, type: f.type, rawValue: rawForm[f.id] };
                })
            }));

            let selIds = selectedImagesMap[pid] || [];
            const media = mediaCache[pid] || [];

            const selectedImages = Array.from(new Set(selIds)).map((id: string) => {
                const m = media.find(x => x.id === id);
                return { url: m?.url, caption: captionsMap[pid]?.[id] || '' };
            }).filter(img => img.url);

            return {
                procedureId: pid,
                procedureType: pType,
                title: resolveTemplate(pType)?.name || 'Report',
                formData: { printableSections },
                selectedImages,
                imageCaptions: captionsMap[pid] || {},
                captures: media,
                equipment: selectedEquipment[pid]?.map(id => availableEquipment.find(e => e.id === id)).filter(Boolean) || [],
                prescriptions: prescriptions[pid] || []
            };
        });
    };

    const handleGeneratePDF = async (action: 'download' | 'preview' | 'print') => {
        setIsLoading(true);
        const allSegments = assembleAllSegmentsData();
        try {
            const blob = await onGeneratePDF({
                patient,
                doctor,
                hospital,
                segments: allSegments,
                action: action === 'preview' ? undefined : action
            });

            if (!blob) {
                setIsLoading(false);
                return;
            }

            if (action === 'print') {
                // Use a hidden iframe to trigger the browser's native print dialog directly
                const url = URL.createObjectURL(blob as Blob);
                const printFrame = document.createElement('iframe');
                printFrame.style.position = 'fixed';
                printFrame.style.right = '0';
                printFrame.style.bottom = '0';
                printFrame.style.width = '0';
                printFrame.style.height = '0';
                printFrame.style.border = 'none';
                printFrame.style.opacity = '0';
                printFrame.src = url;
                document.body.appendChild(printFrame);
                printFrame.onload = () => {
                    try {
                        printFrame.contentWindow?.focus();
                        printFrame.contentWindow?.print();
                    } catch (e) {
                        // Fallback: open in new tab if iframe print fails (e.g. cross-origin)
                        window.open(url, '_blank');
                    }
                    // Clean up after a delay to let the print dialog finish
                    setTimeout(() => {
                        document.body.removeChild(printFrame);
                        URL.revokeObjectURL(url);
                    }, 60000);
                };
                return;
            }

            if (action === 'preview') {
                const url = URL.createObjectURL(blob as Blob);
                setPreviewBlobUrl(url);
                setHasPreviewed(true);
                // PDF is already saved to disk by the upstream handleSaveReport (via saveReportPDF)
            }
        } catch (e) {
            console.error("PDF Gen Error", e);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Navigation Safety ---
    const handleNavigationAttempt = (action: () => void) => {
        if (isDirty) {
            setPendingNavigation(() => action);
            setShowUnsavedModal(true);
        } else {
            action();
        }
    };

    const handleConfirmExit = async (save: boolean) => {
        if (save) await handleSave();
        setShowUnsavedModal(false);
        setIsDirty(false);
        if (pendingNavigation) pendingNavigation();
    };

    const handleHomeClick = () => {
        setPendingNavigation(() => onComplete);
        if (isDirty || !hasPreviewed) {
            setShowUnsavedModal(true);
        } else {
            onComplete();
        }
    };

    const UnsavedChangesModal = () => (
        <AnimatePresence>
            {showUnsavedModal && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-zinc-950 border border-white/10 rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden p-10 flex flex-col items-center text-center gap-6"
                    >
                        <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <AlertCircle size={40} className="text-amber-500" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-black uppercase tracking-tighter text-white">
                                {isDirty ? "Unsaved Changes" : (!hasPreviewed ? "Report Not Finalized" : "Exit to Dashboard?")}
                            </h3>
                            <p className="text-zinc-400 text-[12px] font-medium leading-relaxed px-4">
                                {isDirty
                                    ? "You have unsaved edits. Exiting now will discard your report draft and return you to the patient queue."
                                    : (!hasPreviewed
                                        ? "You haven't clicked 'Save and Preview' to finalize this report. Are you sure you want to return to the dashboard?"
                                        : "Are you sure you want to return to the patient dashboard?")}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full pt-2">
                            <button
                                onClick={() => setShowUnsavedModal(false)}
                                className="h-14 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all font-sans"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleConfirmExit(false)}
                                className="h-14 rounded-2xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all shadow-xl shadow-rose-900/20 font-sans"
                            >
                                Exit Now
                            </button>
                        </div>

                        {isDirty && (
                            <button
                                onClick={() => handleConfirmExit(true)}
                                className="w-full py-3 rounded-xl text-blue-400 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all -mt-2 font-sans"
                            >
                                Save & Exit
                            </button>
                        )}
                        {!isDirty && !hasPreviewed && (
                            <button
                                onClick={() => {
                                    setShowUnsavedModal(false);
                                    handleGeneratePDF('preview');
                                }}
                                className="w-full py-3 rounded-xl text-emerald-400 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all -mt-2 font-sans"
                            >
                                Finalize Now
                            </button>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    const EmbeddedPDFModal = () => {
        if (!previewBlobUrl) return null;
        return (
            <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-8">
                <div className="bg-white w-full h-full max-w-5xl rounded-2xl overflow-hidden flex flex-col">
                    <div className="h-14 border-b border-zinc-100 flex items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <FileText className="text-blue-600" size={18} />
                            <span className="text-sm font-bold uppercase tracking-tight">Finalized Report</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { URL.revokeObjectURL(previewBlobUrl); setPreviewBlobUrl(null); }}
                                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100 flex items-center gap-2"
                            >
                                <Check size={14} /> Finish & Return
                            </button>
                            <button
                                className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-all"
                                onClick={() => { URL.revokeObjectURL(previewBlobUrl); setPreviewBlobUrl(null); }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    <iframe src={`${previewBlobUrl}#toolbar=0`} className="flex-1 w-full" />
                </div>
            </div>
        );
    };

    if (isLoading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50">
            <Loader2 className="animate-spin text-zinc-400 mb-2" />
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Initializing Editor...</p>
        </div>
    );

    const activeForm = activeTabId ? formState[activeTabId] || {} : {};
    const activeType = (activeTabId && proceduresData[activeTabId]) ? proceduresData[activeTabId].type : (segments.find(s => s.id === activeTabId)?.type || 'generic');
    const isGeneric = !activeType || activeType === 'generic';
    const activeMedia = activeTabId ? mediaCache[activeTabId] || [] : [];
    const activeSelectedIds = activeTabId ? selectedImagesMap[activeTabId] || [] : [];

    return (
        <div className="flex h-screen bg-[#f5f5f5] overflow-hidden">
            <UnsavedChangesModal />
            <EmbeddedPDFModal />



            <div className="flex-1 overflow-hidden relative flex flex-col items-center p-8 overflow-y-auto bg-zinc-100">
                <div
                    className="bg-white shadow-2xl flex flex-col shrink-0"
                    style={{ width: '250mm', minHeight: '297mm', padding: '20mm', marginBottom: '4rem' }}
                >
                    <Letterhead
                        doctor={doctor}
                        patient={patient}
                        hospital={hospital}
                        reportName={!isGeneric ? (resolveTemplate(activeType)?.name || "Medical Report") : null}
                    />

                    <div className="mt-4">
                        {isGeneric ? (
                            <VisualSelectorA4 segments={segments} activeTabId={activeTabId} onSelect={handleTypeSelect} />
                        ) : (
                            <div className="grid grid-cols-12 gap-8 h-full">
                                <div className="col-span-9 space-y-6">
                                    {(resolveTemplate(activeType)?.sections || []).map((sect: any) => {
                                        // Auto-detect if section should be 1-column based on field types
                                        const hasComplexFields = sect.fields.some((f: any) =>
                                            f.type === 'textarea' ||
                                            f.type === 'bilateral' ||
                                            f.width === 'full'
                                        );

                                        return (
                                            <div key={sect.id} className="pb-4">
                                                <h3 className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-4 border-b-[1.5px] border-zinc-100 pb-2 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1 h-3 bg-blue-600 rounded-px" />
                                                        {sect.title}
                                                    </div>
                                                </h3>
                                                <div className={`grid ${hasComplexFields ? 'grid-cols-1' : 'grid-cols-2'} gap-x-12 gap-y-3`}>
                                                    {sect.fields.map((field: any) => (
                                                        <div key={field.id} className={field.type === 'textarea' ? 'col-span-1' : 'col-span-1'}>
                                                            <RenderField
                                                                field={field}
                                                                value={activeForm[field.id]}
                                                                onChange={(v: any) => handleFieldChange(activeTabId!, field.id, v)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <PrescriptionSection
                                        prescriptions={prescriptions[activeTabId!] || []}
                                        availableMedicines={availableMedicines}
                                        onChange={(rx: any) => {
                                            setPrescriptions(prev => ({ ...prev, [activeTabId!]: rx }));
                                            setIsDirty(true);
                                        }}
                                    />

                                    {/* Footer Signature Block */}
                                    {(() => {
                                        const resolvedSignature = doctor?.signaturePath ? resolveImageUrl(doctor.signaturePath) : null;
                                        return (
                                            <div className="mt-16 flex flex-col items-end pb-8">
                                                <div className="h-16 w-48 mb-2 flex items-end justify-center border-b-[1.5px] border-zinc-300 border-dashed">
                                                    {resolvedSignature ? (
                                                        <img src={resolvedSignature} alt="Doctor Signature" className="max-h-14 max-w-full object-contain mb-1" />
                                                    ) : (
                                                        <span className="text-[9px] text-zinc-300 font-bold uppercase tracking-widest mb-2">Signature Placeholder</span>
                                                    )}
                                                </div>
                                                <div className="text-[13px] font-bold text-zinc-900">{formattedDrName}{doctorDegree}</div>
                                                <div className="text-[11px] font-medium text-zinc-500">{doctorRole}</div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div className="col-span-3 border-l border-zinc-50 pl-6 space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        {(() => {
                                            const uniqueDisplayIds = Array.from(new Set(activeSelectedIds));
                                            return uniqueDisplayIds.slice(0, 6).map((id: string, i: number) => {
                                                const m = activeMedia.find((x: any) => x.id === id);
                                                if (!m) return null;
                                                return (
                                                    <div key={`${id}-${i}`} className="space-y-1 group">
                                                        <div className="aspect-square bg-white rounded-full border border-zinc-200 overflow-hidden relative shadow-sm">
                                                            <img src={m.url} className="w-full h-full object-contain" />
                                                            <div className="absolute top-2 left-2 w-4 h-4 bg-black/50 backdrop-blur text-white text-[8px] flex items-center justify-center rounded-full font-bold">{i + 1}</div>
                                                        </div>
                                                        <div className="flex items-center justify-center gap-1 mt-1">
                                                            <span className="text-[9px] text-zinc-400 italic font-bold whitespace-nowrap">Fig {i + 1}</span>
                                                            <input
                                                                className="flex-1 min-w-0 text-[9px] text-left bg-transparent border-none focus:ring-0 italic text-zinc-500 placeholder:text-zinc-300 p-0 h-4"
                                                                placeholder="Add caption..."
                                                                value={captionsMap[activeTabId!]?.[id] || ''}
                                                                onChange={(e) => {
                                                                    setCaptionsMap(prev => ({ ...prev, [activeTabId!]: { ...(prev[activeTabId!] || {}), [id]: e.target.value } }));
                                                                    setIsDirty(true);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <Footer doctor={doctor} />
                </div>
            </div>

            {/* Sidebar */}
            <div className="w-72 bg-white border-l border-zinc-100 flex flex-col z-50">
                <div className="p-6 border-b border-zinc-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {onBackToAnnotate && (
                            <button
                                onClick={onBackToAnnotate}
                                className="flex items-center gap-1.5 text-zinc-500 hover:text-blue-600 transition-all font-bold uppercase text-[9px] bg-zinc-50 px-2 flex-1 justify-center py-1.5 rounded-md border border-zinc-100 shadow-sm"
                                title="Back to Annotation"
                            >
                                <ArrowLeft size={12} /> Annotate
                            </button>
                        )}
                        <button
                            onClick={handleHomeClick}
                            className="flex items-center gap-1.5 text-zinc-500 hover:text-rose-600 transition-all font-bold uppercase text-[9px] flex-1 justify-center bg-zinc-50 px-2 py-1.5 rounded-md border border-zinc-100 shadow-sm"
                            title="Exit to Patient List"
                        >
                            <Home size={12} /> Home
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-6 space-y-8 overflow-y-auto">
                    {/* 1. Procedures List (TOP) */}
                    <div className="space-y-4">
                        <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest block">Procedure List</span>
                        <div className="space-y-1">
                            {segments.map(s => {
                                const sType = proceduresData[s.id]?.type || s.type || 'generic';
                                const template = resolveTemplate(sType);
                                const name = template?.shortName || template?.name || `Segment P${s.index}`;
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => handleNavigationAttempt(() => { setActiveTabId(s.id); setActiveSegment(s.index); })}
                                        className={`w-full text-left p-3 rounded-xl text-[10px] font-bold transition-all border ${activeTabId === s.id
                                            ? 'bg-blue-50/50 border-blue-100 text-blue-600 shadow-sm'
                                            : 'border-transparent text-zinc-400 hover:bg-zinc-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${activeTabId === s.id ? 'bg-blue-600' : 'bg-transparent'}`} />
                                            {name}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. Action Buttons */}
                    <div className="pt-6 border-t border-zinc-50 space-y-4">
                        <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest block">Report Actions</span>
                        <div className="space-y-2">
                            <button
                                onClick={handleAutoFill}
                                disabled={isGeneric}
                                className="w-full py-3.5 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all flex items-center justify-center gap-2 border border-blue-100 mb-4 disabled:opacity-50 disabled:grayscale"
                            >
                                <Wand2 size={14} /> Auto-Fill Normal
                            </button>

                            <button
                                onClick={() => handleSave(true)}
                                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                            >
                                <Eye size={14} /> Save and Preview
                            </button>
                            <button
                                onClick={async () => { await handleSave(false); handleGeneratePDF('print'); }}
                                className="w-full py-3.5 bg-zinc-900 text-white rounded-xl font-bold text-xs hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-zinc-200"
                            >
                                <Printer size={14} /> Sign and Print
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
