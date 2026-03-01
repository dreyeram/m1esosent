"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Camera,
    Circle,
    Square,
    Clock,
    FileText,
    Maximize2,
    Move3d,
    PanelRightOpen,
    Plus,
    RotateCcw,
    RotateCw,
    Save,
    Scan,
    Settings2,
    StopCircle,
    Target,
    Trash2,
    User,
    Video,
    ZoomIn,
    ZoomOut,
    ArrowUp,
    ArrowDown,
    ArrowRight,
    ArrowLeft,
    AlertCircle,
    ChevronDown,
    SwitchCamera,
    Microscope,
    Copy,
    Edit2,
    Star,
    RectangleHorizontal,
    X,
    PlusCircle,
    MinusCircle,
    Maximize,
    ChevronUp
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ProcedureSettingsSidebarOverlay } from "./ProcedureSettingsSidebarOverlay";
import { ScopeProfile } from "@/contexts/SettingsContext";

// ═══════════════════════════════════════════════════════════
//  Icons & Components
// ═══════════════════════════════════════════════════════════

const EndoscopeIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M7 12h10" />
        <path d="M12 7v10" />
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
);

// ═══════════════════════════════════════════════════════════
//  ProcedureToolPanel — Right-Side Control Panel (v4)
// ═══════════════════════════════════════════════════════════

interface Capture {
    id: string;
    timestamp: string;
    url: string;
    type?: "image" | "video";
    thumbnailUrl?: string;
    category?: string; // P1, P2...
    segmentIndex?: number;
    selected?: boolean;
    [key: string]: any;
}

interface Segment {
    id: string;
    index: number;
    status: string;
    limit?: number; // visual marker
}

export interface ProcedureToolPanelProps {
    patient: any;
    timer: number;
    timerDisplayRef?: React.RefObject<HTMLSpanElement | null>;
    formatTime: (t: number) => string;
    onCapture: () => void;
    onToggleRecording: () => void;
    isRecording: boolean;
    zoom: number;
    zoomRange: { min: number; max: number };
    onZoomChange: (z: number) => void;
    frozenFrame: string | null;
    onToggleFreeze: () => void;
    isCompareMode: boolean;
    onToggleCompare: () => void;
    deviceId?: string;
    devices?: MediaDeviceInfo[]; // Added
    onSwitchCamera?: () => void; // Added
    scopeScale?: number;
    onSetScopeScale?: (s: number) => void;



    segments: Segment[]; // From props, but UI might handle add locally if parent allows
    activeSegmentIndex: number;
    onSetActiveSegment: (i: number) => void;
    onAddSegment: () => void;

    captures: Capture[];
    // activeProcedureId derived from activeSegmentIndex

    onOpenStudio: (cap: Capture) => void;
    onPlayVideo: (cap: Capture) => void;
    history: any[];
    comparisonImage: string | null;
    onSelectComparisonImage: (url: string | null, isHistory?: boolean) => void;
    onBack: () => void;
    onEndProcedure: () => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
    previewImage?: string | null;
    onClearPreview?: () => void;

    historyExpanded?: boolean;
    setHistoryExpanded?: (v: boolean) => void;

    // Calibration
    isCalibrating?: boolean;
    onStartCalibration?: () => void;
    onStopCalibration?: () => void;
    onConfirmCalibration?: (profileData: Partial<ScopeProfile>) => void;
    onChangeCalibrationShape?: (shape: 'circle' | 'rectangle') => void;
    calibrationArea?: { x: number; y: number; width: number; height: number };
    resolution?: { w: number; h: number };

    // Settings
    settings: any;
    updateSetting: (key: any, value: any) => void;
    activeScopeId: string | null;
    scopeProfiles?: any[];
    onSelectProfile?: (id: string) => void;
}

export default function ProcedureToolPanel({
    patient,
    timer,
    timerDisplayRef,
    formatTime,
    onCapture,
    onToggleRecording,
    isRecording,
    zoom,
    zoomRange,
    onZoomChange,
    frozenFrame,
    onToggleFreeze,
    isCompareMode,
    onToggleCompare,
    deviceId,
    devices = [], // Added
    onSwitchCamera, // Added
    scopeScale,
    onSetScopeScale,
    historyExpanded = false,
    setHistoryExpanded = () => { },
    settings,
    updateSetting,
    activeScopeId,
    scopeProfiles = [],
    onSelectProfile,

    segments,
    activeSegmentIndex,
    onSetActiveSegment,
    onAddSegment,
    isCalibrating,
    onStartCalibration,
    onStopCalibration,
    onConfirmCalibration,
    onChangeCalibrationShape,
    calibrationArea,
    captures,
    onOpenStudio,
    onPlayVideo,
    history,
    comparisonImage,
    onSelectComparisonImage,
    onBack,
    onEndProcedure,
    collapsed = false,
    onToggleCollapse,
    previewImage,
    onClearPreview,

}: ProcedureToolPanelProps) {
    const [activeView, setActiveView] = useState<"images" | "videos">("images");
    const [showSettings, setShowSettings] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [historyTabs, setHistoryTabs] = useState<{ [procedureId: string]: 'image' | 'video' | 'report' }>({});
    const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);



    // Derived State
    const currentProcId = `P${activeSegmentIndex + 1}`;

    // Auto-hide toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
    };

    // Filter captures logic
    // We filter by `segmentIndex` if available, or fall back to category matching 'P...'
    const currentCaptures = captures.filter(c => {
        if (c.segmentIndex !== undefined) return c.segmentIndex === activeSegmentIndex;
        // Fallback
        return c.category === currentProcId || (!c.category && activeSegmentIndex === 0);
    });

    const imageCaptures = currentCaptures.filter((c) => c.type === "image" || !c.type);
    const videoCaptures = currentCaptures.filter((c) => c.type === "video");

    // Handlers


    if (collapsed) {
        return (
            <div className="w-16 bg-[#050505] border-l border-white/5 flex flex-col items-center py-6 gap-6 shrink-0 shadow-[20px_0_50px_rgba(0,0,0,1)] relative z-10">
                <button onClick={onToggleCollapse} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all shadow-xl"><PanelRightOpen size={20} /></button>
                <div className="w-8 h-px bg-white/5" />
                <button onClick={onCapture} className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]"><Camera size={20} strokeWidth={2.5} /></button>
            </div>
        );
    }

    return (
        <>
            <aside className="w-full h-full bg-[#09090b]/95 backdrop-blur-3xl border border-white/10 flex flex-col overflow-hidden select-none shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative z-50 pointer-events-auto rounded-[32px]">

                {/* ══════════════════════════════════════════════════════
                1. HEADER SECTION (Fixed Height & Overlay)
               ══════════════════════════════════════════════════════ */}
                <div className="flex flex-col bg-zinc-900/40 backdrop-blur-xl border-b border-white/5 shrink-0 relative">

                    {/* HEADER ROW: [Scope] [Time] [End] */}
                    <div className="flex items-center justify-between px-3 py-2.5 min-h-[48px] relative z-20">

                        {/* LEFT: Camera Switcher Only */}
                        <div className="flex items-center min-w-[120px] gap-2">
                            {devices && devices.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSwitchCamera?.();
                                    }}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors border border-white/10"
                                    title="Switch Camera"
                                >
                                    <SwitchCamera size={16} />
                                </button>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowSettings(true);
                                }}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors border border-white/10"
                                title="Calibration Settings"
                            >
                                <Settings2 size={16} />
                            </button>
                        </div>

                        {/* CENTER: Timer */}
                        <div className="absolute left-1/2 -translate-x-1/2">
                            <div className="flex items-center gap-2.5 h-9 px-4 bg-black/40 rounded-xl border border-white/10 backdrop-blur-md shadow-inner">
                                <Clock size={12} className="text-emerald-400" />
                                <span ref={timerDisplayRef} className="text-sm font-mono font-bold text-white tabular-nums leading-none tracking-tight">
                                    {formatTime(timer)}
                                </span>
                            </div>
                        </div>

                        {/* RIGHT: End Button */}
                        <button
                            onClick={onEndProcedure}
                            className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-rose-900/40 transition-all active:scale-95 border border-rose-500/50"
                        >
                            <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                            <span>End</span>
                        </button>
                    </div>



                    {/* Live Preview (Visible when Frozen) - Placed outside collapsible area */}


                    {/* Live Preview (Visible when Frozen) - Placed outside collapsible area */}

                    {/* ROW 2: [Patient Info] & [Tabs] Stacked */}
                    <div className="flex flex-col px-4 py-2 bg-black/40 border-t border-white/5 relative z-10 shrink-0">
                        {/* Patient Info Line: Single Line, Compact */}
                        <div className="flex items-center min-w-0 mb-2 mt-1">
                            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                                <span className="text-[14px] font-bold text-white truncate leading-none" title={patient.name}>{patient.name}</span>
                                <span className="text-white/10 text-[10px] font-thin">|</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter tabular-nums whitespace-nowrap">
                                        {(patient.age !== undefined && patient.age !== null) ? `${patient.age}Y` : '??Y'} · {patient.gender?.[0] || patient.gender || 'U'}
                                    </span>
                                    <span className="text-white/10 text-[10px] font-thin">|</span>
                                    <span className="text-[10px] font-mono font-black text-indigo-400/50 truncate" title="Patient MRN / UUIHID">
                                        {patient.mrn || patient.refId || `#${patient.id.slice(-4)}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Session Tabs Line: Scroll Area + Fixed Plus Button */}
                        <div className="flex items-center gap-2 pb-1.5">
                            <div className="flex-1 overflow-x-auto scroll-smooth custom-scrollbar-h">
                                <div className="flex items-center gap-1.5 pr-4 pb-1">
                                    {segments.sort((a, b) => a.index - b.index).map((s, idx) => {
                                        const pid = `P${idx + 1}`;
                                        const isActive = s.index === activeSegmentIndex;
                                        return (
                                            <button
                                                key={`segment-tab-${idx}-${s.id || s.index}`}
                                                onClick={() => onSetActiveSegment(s.index)}
                                                className={`h-7 px-3.5 rounded-lg text-[10px] font-black transition-all active:scale-95 shrink-0 ${isActive
                                                    ? "bg-white text-black shadow-[0_4px_12px_rgba(255,255,255,0.2)]"
                                                    : "bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10"
                                                    }`}
                                            >
                                                {pid}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Fixed Add Button */}
                            <button
                                onClick={onAddSegment}
                                className="w-8 h-7 rounded-lg flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 transition-all active:scale-95 shrink-0 shadow-lg shadow-emerald-900/10"
                                title="Add New Session"
                            >
                                <Plus size={14} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    {/* (Duplicate scope selector removed — using pill-based switcher in Row 2 above) */}
                </div>

                {/* ══════════════════════════════════════════════════════
                2. SESSION GALLERY (Flex-1, Scrollable)
               ══════════════════════════════════════════════════════ */}
                <div className="flex flex-col flex-1 min-h-0 border-b border-white/5">
                    <div className="px-6 py-3 border-b border-white/5 bg-white/[0.01]">
                        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
                            <button
                                onClick={() => setActiveView("images")}
                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeView === "images" ? "bg-white text-black shadow-md" : "text-zinc-500 hover:text-zinc-300"}`}
                            >
                                Images <span className="opacity-50 ml-1">({imageCaptures.length})</span>
                            </button>
                            <button
                                onClick={() => setActiveView("videos")}
                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeView === "videos" ? "bg-white text-black shadow-md" : "text-zinc-500 hover:text-zinc-300"}`}
                            >
                                Videos <span className="opacity-50 ml-1">({videoCaptures.length})</span>
                            </button>
                        </div>
                    </div>

                    {/* Gallery Grid */}
                    <div className="flex-1 overflow-y-auto p-4 bg-[#0A0A0A] min-h-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {activeView === "images" && (
                            <div className="grid grid-cols-2 gap-3 min-h-0">
                                {imageCaptures.map((cap, i) => (
                                    <div key={cap.id || i} className="aspect-square rounded-[24px] bg-zinc-900/50 border border-white/5 overflow-hidden group cursor-pointer relative shadow-lg hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all duration-300">
                                        <img src={cap.url} onClick={() => onOpenStudio(cap)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                        {/* Compare Icon */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onSelectComparisonImage(cap.url, false); }}
                                            className="absolute top-3 right-3 w-9 h-9 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-indigo-600 transition-all opacity-0 translate-y-[-10px] group-hover:opacity-100 group-hover:translate-y-0 z-10"
                                            title="Compare with live feed"
                                        >
                                            <Move3d size={16} />
                                        </button>

                                        {/* Timestamp/Label Overlay */}
                                        <div className="absolute bottom-3 left-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                            <span className="text-[9px] font-black text-white/50 uppercase tracking-widest bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/5">
                                                {cap.timestamp?.split(' ')[1] || 'Captured'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {imageCaptures.length === 0 && (
                                    <div className="col-span-2 py-16 flex flex-col items-center justify-center gap-3 opacity-20">
                                        <Camera size={32} strokeWidth={1} />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">No Media Captured</span>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeView === "videos" && (
                            <div className="grid grid-cols-2 gap-3">
                                {videoCaptures.map((cap, i) => (
                                    <div key={cap.id || i} onClick={() => onPlayVideo(cap)} className="aspect-video rounded-[24px] bg-zinc-900/50 border border-white/5 overflow-hidden group cursor-pointer relative shadow-lg hover:border-indigo-500/50 transition-all duration-300">
                                        {cap.thumbnailUrl ? (
                                            <img src={cap.thumbnailUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                                        ) : (
                                            <video src={cap.url} className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-indigo-500 group-hover:border-indigo-400">
                                                <Video size={18} className="fill-white text-white translate-x-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════
                3. HISTORY TRIGGER (Static Bottom)
               ══════════════════════════════════════════════════════ */}
                <div className="flex flex-col shrink-0 border-t border-white/5 bg-zinc-900/40 backdrop-blur-xl h-12 relative z-30">
                    <button
                        onClick={() => {
                            setHistoryExpanded(!historyExpanded);
                        }}
                        className="px-6 h-full flex justify-between items-center hover:bg-white/10 transition-colors shrink-0"
                    >
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="text-zinc-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Patient History</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{history.length} Cases</span>
                            <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-500 ${historyExpanded ? "rotate-180" : ""}`} />
                        </div>
                    </button>
                </div>

                {/* ══════════════════════════════════════════════════════
                4. CONTROLS FOOTER (Premium High-Contrast)
               ══════════════════════════════════════════════════════ */}
                <div className="flex flex-col bg-[#050505] border-t border-white/5 shrink-0 relative z-[60] shadow-[0_-20px_60px_rgba(0,0,0,0.8)] px-8 pb-10 pt-6">

                    {/* Scope Scale Control */}
                    <div className="mb-4 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/5 transition-all">
                        <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Scope Zoom</span>
                                <button
                                    onClick={() => onSetScopeScale?.(1)}
                                    className="w-5 h-5 rounded-md flex items-center justify-center bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all active:scale-90"
                                    title="Reset Zoom"
                                >
                                    <RotateCcw size={10} />
                                </button>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-white tabular-nums">{(scopeScale || 1).toFixed(2)}x</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <ZoomOut size={12} className="text-zinc-600 shrink-0" />
                            <div className="flex-1 relative h-4 flex items-center">
                                {/* Track Background */}
                                <div className="absolute inset-x-0 h-1 bg-white/10 rounded-full top-1/2 -translate-y-1/2" />

                                {/* Progress Fill (White) */}
                                <motion.div
                                    className="h-1 bg-white rounded-full absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none"
                                    initial={false}
                                    animate={{ width: `${(((scopeScale || 1) - 1.0) / 4.0) * 100}%` }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />

                                {/* Transparent Input Layer */}
                                <input
                                    type="range"
                                    min={1.0}
                                    max={5.0}
                                    step={0.01}
                                    value={scopeScale || 1}
                                    onChange={(e) => onSetScopeScale?.(parseFloat(e.target.value))}
                                    className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                                />

                                {/* Custom Thumb (White Circle) */}
                                <motion.div
                                    className="absolute top-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.5)] pointer-events-none ring-4 ring-black/20"
                                    initial={false}
                                    animate={{ left: `${(((scopeScale || 1) - 1.0) / 4.0) * 100}%` }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    style={{ transform: 'translate(-50%, -50%)' }}
                                />
                            </div>
                            <ZoomIn size={12} className="text-zinc-600 shrink-0" />
                        </div>
                    </div>

                    {/* Main Action Buttons */}
                    <div className="flex items-center justify-center gap-8">
                        {/* Recording Button */}
                        <div className="flex flex-col items-center gap-3">
                            <button
                                onClick={onToggleRecording}
                                className={`w-14 h-14 rounded-[20px] border flex items-center justify-center transition-all duration-300 relative group overflow-hidden ${isRecording ? "bg-rose-500 border-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.3)] ring-4 ring-rose-500/10" : "bg-zinc-900 border-white/5 hover:border-white/10 hover:bg-zinc-800"}`}
                            >
                                <div className={`transition-all duration-300 ${isRecording ? "w-4 h-4 rounded-sm bg-white" : "w-5 h-5 rounded-full bg-rose-600 group-hover:scale-110"}`} />
                                {isRecording && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                            </button>
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isRecording ? "text-rose-500" : "text-zinc-600"}`}>
                                {isRecording ? "Stop" : "Record"}
                            </span>
                        </div>

                        {/* CAPTURE BUTTON (MAIN) */}
                        <div className="flex flex-col items-center gap-4">
                            <button
                                onClick={onCapture}
                                className="w-20 h-20 rounded-[30px] bg-white text-black shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:shadow-[0_25px_60px_rgba(255,255,255,0.3)] flex items-center justify-center border-[4px] border-black/5 ring-1 ring-white/50 relative overflow-hidden transition-all active:scale-90 group active:shadow-inner"
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/5 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Camera size={32} className="text-black relative z-10" strokeWidth={2.5} />
                            </button>
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Capture</span>
                        </div>

                        {/* FREEZE BUTTON */}
                        <div className="flex flex-col items-center gap-3">
                            <button
                                onClick={onToggleFreeze}
                                className={`w-14 h-14 rounded-[20px] border flex items-center justify-center transition-all duration-300 group ${frozenFrame ? "bg-cyan-500 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)] ring-4 ring-cyan-500/10" : "bg-zinc-900 border-white/5 hover:border-white/10 hover:bg-zinc-800"}`}
                            >
                                <StopCircle size={22} className={`transition-colors duration-300 ${frozenFrame ? "text-white fill-none" : "text-zinc-600 group-hover:text-zinc-400"}`} />
                            </button>
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${frozenFrame ? "text-cyan-400" : "text-zinc-600"}`}>
                                {frozenFrame ? "Live" : "Freeze"}
                            </span>
                        </div>
                    </div>
                </div>



                {/* 5b. Patient History Overlay (Slides UP from bottom of Gallery area) */}
                <AnimatePresence>
                    {historyExpanded && (
                        <>
                            {/* Click-Away Overlay */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setHistoryExpanded(false)}
                                className="absolute inset-0 z-[40] bg-black/40 backdrop-blur-md"
                            />

                            {/* History Panel Overlay */}
                            <motion.div
                                initial={{ y: "100%", opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: "100%", opacity: 0 }}
                                className="absolute inset-0 z-[70] flex flex-col overflow-hidden bg-zinc-950 border border-white/10 shadow-2xl rounded-[24px]"
                            >
                                {/* Header inside overlay (optional, but good for context) */}
                                <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center gap-3">
                                        <Clock size={16} className="text-indigo-400" />
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Full Patient History</span>
                                    </div>
                                    <button
                                        onClick={() => setHistoryExpanded(false)}
                                        className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                                    >
                                        <ChevronDown size={18} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto bg-black/20 p-6 space-y-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                    {(() => {
                                        const dates = Array.from(new Set(history.map(h => h.date || 'Recent')));
                                        if (dates.length === 0) return (
                                            <div className="h-full flex flex-col items-center justify-center opacity-20 gap-3 py-16">
                                                <FileText size={48} strokeWidth={1} />
                                                <span className="text-[11px] font-bold uppercase tracking-[0.3em]">Empty Medical Archive</span>
                                            </div>
                                        );

                                        return dates.map(date => {
                                            const procedures = history.filter(h => (h.date || 'Recent') === date);
                                            return (
                                                <div key={date} className="space-y-4">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] font-black text-indigo-400/80 uppercase tracking-widest whitespace-nowrap">{date}</span>
                                                        <div className="h-px w-full bg-white/5" />
                                                    </div>
                                                    <div className="grid gap-5">
                                                        {procedures.map((proc, i) => {
                                                            const activeTab = historyTabs[proc.id] || (proc.media?.some((m: any) => m.type === 'image') ? 'image' : proc.media?.some((m: any) => m.type === 'video') ? 'video' : 'report');
                                                            const filteredMedia = (proc.media || []).filter((m: any) => m.type === activeTab);
                                                            const hasImages = (proc.media || []).some((m: any) => m.type === 'image');
                                                            const hasVideos = (proc.media || []).some((m: any) => m.type === 'video');
                                                            const hasReports = (proc.media || []).some((m: any) => m.type === 'report');

                                                            return (
                                                                <div key={proc.id || i} className="bg-white/[0.03] border border-white/5 rounded-[32px] p-5 space-y-4 hover:bg-white/[0.05] transition-all group/card">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[14px] text-white font-bold tracking-tight">{proc.procedure}</span>
                                                                            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">{proc.doctor}</span>
                                                                        </div>
                                                                        <button className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all opacity-0 group-hover/card:opacity-100">
                                                                            <PanelRightOpen size={16} />
                                                                        </button>
                                                                    </div>

                                                                    {/* Media Type Tabs */}
                                                                    <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
                                                                        {hasImages && (
                                                                            <button
                                                                                onClick={() => setHistoryTabs(prev => ({ ...prev, [proc.id]: 'image' }))}
                                                                                className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'image' ? "bg-white text-black shadow-md" : "text-zinc-500 hover:text-zinc-300"}`}
                                                                            >
                                                                                Images
                                                                            </button>
                                                                        )}
                                                                        {hasVideos && (
                                                                            <button
                                                                                onClick={() => setHistoryTabs(prev => ({ ...prev, [proc.id]: 'video' }))}
                                                                                className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'video' ? "bg-white text-black shadow-md" : "text-zinc-500 hover:text-zinc-300"}`}
                                                                            >
                                                                                Videos
                                                                            </button>
                                                                        )}
                                                                        {hasReports && (
                                                                            <button
                                                                                onClick={() => setHistoryTabs(prev => ({ ...prev, [proc.id]: 'report' }))}
                                                                                className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'report' ? "bg-white text-black shadow-md" : "text-zinc-500 hover:text-zinc-300"}`}
                                                                            >
                                                                                Reports
                                                                            </button>
                                                                        )}
                                                                    </div>

                                                                    {/* Media Content */}
                                                                    {filteredMedia.length > 0 ? (
                                                                        <div className={activeTab === 'image' ? "grid grid-cols-3 gap-3" : "space-y-3"}>
                                                                            {filteredMedia.map((m: any) => (
                                                                                <div
                                                                                    key={m.id}
                                                                                    className={`rounded-[20px] bg-zinc-950 border border-white/10 overflow-hidden cursor-pointer hover:border-indigo-500/50 transition-all relative group shadow-2xl ${activeTab === 'image' ? 'aspect-square' : activeTab === 'video' ? 'aspect-video' : 'p-4 flex items-center gap-3'}`}
                                                                                    onClick={() => {
                                                                                        if (m.type === 'image') onOpenStudio({ ...m, timestamp: date });
                                                                                        else if (m.type === 'video') onPlayVideo({ ...m, timestamp: date });
                                                                                        else if (m.type === 'report') setActivePdfUrl(m.url);
                                                                                    }}
                                                                                >
                                                                                    {m.type === 'image' ? (
                                                                                        <>
                                                                                            <img src={m.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
                                                                                            <button
                                                                                                onClick={(e) => { e.stopPropagation(); onSelectComparisonImage(m.url, true); }}
                                                                                                className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-indigo-600 transition-all opacity-0 group-hover:opacity-100 z-10"
                                                                                                title="Compare"
                                                                                            >
                                                                                                <Move3d size={12} />
                                                                                            </button>
                                                                                        </>
                                                                                    ) : m.type === 'video' ? (
                                                                                        <>
                                                                                            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                                                                                <Video size={24} className="text-indigo-400" />
                                                                                            </div>
                                                                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <FileText size={20} className="text-red-400 shrink-0" />
                                                                                            <div className="flex flex-col min-w-0">
                                                                                                <span className="text-[11px] font-bold text-white truncate">{m.title || 'PDF Report'}</span>
                                                                                                <span className="text-[9px] text-zinc-500 uppercase tracking-widest">View PDF</span>
                                                                                            </div>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-3 py-3 px-4 rounded-2xl bg-white/5 text-[10px] text-zinc-600 font-bold uppercase tracking-widest border border-white/5">
                                                                            <AlertCircle size={12} />
                                                                            No {activeTab}s for this session
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Sidebar Settings Overlay */}
                <AnimatePresence>
                    {showSettings && (
                        <ProcedureSettingsSidebarOverlay
                            isOpen={showSettings}
                            onClose={() => setShowSettings(false)}
                            settings={settings}
                            updateSetting={updateSetting}
                            showToast={showToast}
                            isCalibrating={isCalibrating}
                            onStartCalibration={onStartCalibration}
                            onStopCalibration={onStopCalibration}
                            onConfirmCalibration={onConfirmCalibration}
                            calibrationArea={calibrationArea}
                            onChangeCalibrationShape={onChangeCalibrationShape}
                        />
                    )}
                </AnimatePresence>

                {/* Local Toast System for Settings */}
                <AnimatePresence>
                    {toast && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-2xl ${toast.type === 'success' ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'
                                }`}
                        >
                            {toast.message}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {activePdfUrl && (
                        <div
                            className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8"
                            onClick={() => setActivePdfUrl(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-full h-full max-w-5xl bg-[#121214] rounded-[32px] border border-white/10 overflow-hidden shadow-[0_32px_128px_rgba(0,0,0,0.8)] flex flex-col"
                            >
                                {/* PDF Viewer Header */}
                                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#121214] z-20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                                            <FileText size={16} className="text-red-500" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest text-white">Medical Report Viewer</span>
                                    </div>

                                    <button
                                        onClick={() => setActivePdfUrl(null)}
                                        className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-red-500 transition-all font-black"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* PDF Content Workspace - Standard Full-Height View */}
                                <div className="flex-1 relative w-full bg-[#09090b] overflow-hidden">
                                    <iframe
                                        src={`${activePdfUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                                        className="w-full h-full border-0"
                                        title="PDF Report"
                                    />
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </aside >

            <style jsx global>{`
                ::-webkit-scrollbar { width: 4px; height: 4px; } 
                ::-webkit-scrollbar-track { background: #09090b; } 
                ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; } 
                .custom-scrollbar-h::-webkit-scrollbar { height: 2px !important; }
                .custom-scrollbar-h::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
                .custom-scrollbar-h:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }
                input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 12px; height: 12px; border-radius: 50%; background: white; cursor: pointer; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
            `}</style>
        </>
    );
}
