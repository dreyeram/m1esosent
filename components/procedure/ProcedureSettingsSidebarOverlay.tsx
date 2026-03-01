"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Settings2,
    Microscope,
    Plus,
    Star,
    Trash2,
    Eye,
    EyeOff,
    Search,
    Edit2,
    Save,
    ChevronLeft,
    ChevronDown,
    MousePointer2,
    Check,
    Bell,
    Circle,
    Square,
    RectangleHorizontal,
    Crosshair,
    Target,
    Sparkles,
} from "lucide-react";
import { ScopeProfile, HardwareDevice, ProcedureToolSettings, SettingsState } from "@/contexts/SettingsContext";

// ═══════════════════════════════════════════════════════════
//  Procedure Settings Sidebar — Scope Calibration Wizard
// ═══════════════════════════════════════════════════════════

type CalibrationStep = 'list' | 'drawing' | 'confirm';

interface ProcedureSettingsSidebarOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    settings: SettingsState;
    updateSetting: (key: any, value: any) => void;
    showToast: (type: 'success' | 'error', message: string) => void;
    isCalibrating?: boolean;
    onStartCalibration?: () => void;
    onStopCalibration?: () => void;
    onConfirmCalibration?: (profileData: Partial<ScopeProfile>) => void;
    calibrationArea?: { x: number; y: number; width: number; height: number };
    onChangeCalibrationShape?: (shape: 'circle' | 'rectangle') => void;
}

export function ProcedureSettingsSidebarOverlay({
    isOpen,
    onClose,
    settings,
    updateSetting,
    showToast,
    isCalibrating,
    onStartCalibration,
    onStopCalibration,
    onConfirmCalibration,
    calibrationArea,
    onChangeCalibrationShape
}: ProcedureSettingsSidebarOverlayProps) {
    const [step, setStep] = useState<CalibrationStep>('list');
    const [editingProfile, setEditingProfile] = useState<Partial<ScopeProfile> | null>(null);
    const [profileName, setProfileName] = useState('');
    const [selectedHardwareId, setSelectedHardwareId] = useState<string | 'custom'>('');
    const [manufacturer, setManufacturer] = useState('');
    const [model, setModel] = useState('');
    const [viewingAngle, setViewingAngle] = useState('0°');
    const [hardwareSearch, setHardwareSearch] = useState('');
    const [isHardwareDropdownOpen, setIsHardwareDropdownOpen] = useState(false);
    const [showTools, setShowTools] = useState(false);
    const [shape, setShape] = useState<'circle' | 'rectangle'>('rectangle');

    // Sync direct feed calibration area
    useEffect(() => {
        if (isCalibrating && calibrationArea && editingProfile) {
            setEditingProfile(prev => ({
                ...prev,
                captureArea: calibrationArea
            }));
        }
    }, [calibrationArea, isCalibrating]);

    // Reset when sidebar closes
    useEffect(() => {
        if (!isOpen) {
            setStep('list');
            setEditingProfile(null);
            setProfileName('');
            setSelectedHardwareId('');
            setManufacturer('');
            setModel('');
            setViewingAngle('0°');
            setHardwareSearch('');
            setIsHardwareDropdownOpen(false);
            setShape('rectangle');
        }
    }, [isOpen]);

    // ── Profile Actions ──
    const handleStartNewCalibration = () => {
        setEditingProfile({
            id: `scope-${Date.now()}`,
            name: '',
            captureArea: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
            isDefault: false,
            lastUsed: Date.now(),
            baseScale: 1.0,
            manufacturer: '',
            model: '',
            viewingAngle: '0°',
            shape: 'rectangle'
        });
        setProfileName('');
        setSelectedHardwareId('');
        setManufacturer('');
        setModel('');
        setViewingAngle('0°');
        setShape('rectangle');
        onChangeCalibrationShape?.('rectangle');
        setStep('drawing');
        onStartCalibration?.();
    };

    const handleEditProfile = (profile: ScopeProfile) => {
        setEditingProfile({ ...profile });
        setProfileName(profile.name);

        // Find if this matches a catalog item
        const catalogMatch = settings.hardwareCatalog.find(h =>
            h.manufacturer === profile.manufacturer &&
            h.model === profile.model &&
            h.viewingAngle === profile.viewingAngle
        );

        if (catalogMatch) {
            setSelectedHardwareId(catalogMatch.id);
        } else {
            setSelectedHardwareId('custom');
        }

        setManufacturer(profile.manufacturer || '');
        setModel(profile.model || '');
        setViewingAngle(profile.viewingAngle || '0°');
        setShape(profile.shape || 'rectangle');
        onChangeCalibrationShape?.(profile.shape || 'rectangle');
        setStep('drawing');
        onStartCalibration?.();
    };

    const handleConfirmDrawing = () => {
        // Stop calibration mode
        onStopCalibration?.();
        setStep('confirm');
    };

    const handleSaveProfile = () => {
        if (!editingProfile || !profileName.trim()) {
            showToast('error', 'Please enter a scope name');
            return;
        }

        const finalProfile: ScopeProfile = {
            id: editingProfile.id || `scope-${Date.now()}`,
            name: profileName.trim(),
            captureArea: editingProfile.captureArea || { x: 0.5, y: 0.5, width: 0.8, height: 0.8 },
            isDefault: editingProfile.isDefault || false,
            lastUsed: Date.now(),
            baseScale: editingProfile.baseScale || 1.0,
            manufacturer: manufacturer.trim(),
            model: model.trim(),
            viewingAngle: viewingAngle,
            shape: shape
        };

        // baseScale is computed dynamically in SurgicalCameraStream from captureArea.
        // Store 1.0 as the default scopeScale (no additional zoom on top of auto-fill).

        let updatedProfiles = [...(settings.scopeProfiles || [])];
        const index = updatedProfiles.findIndex(p => p.id === finalProfile.id);

        if (index >= 0) {
            updatedProfiles[index] = finalProfile;
        } else {
            updatedProfiles.push(finalProfile);
        }

        // If it's a custom device, add it to the hardware catalog for future use
        if (selectedHardwareId === 'custom') {
            const isExisting = settings.hardwareCatalog.some(h =>
                h.manufacturer.toLowerCase() === manufacturer.trim().toLowerCase() &&
                h.model.toLowerCase() === model.trim().toLowerCase() &&
                h.viewingAngle === viewingAngle
            );

            if (!isExisting) {
                const newDevice: HardwareDevice = {
                    id: `hw-${Date.now()}`,
                    manufacturer: manufacturer.trim(),
                    model: model.trim(),
                    viewingAngle: viewingAngle,
                    isCustom: true
                };
                updateSetting('hardwareCatalog', [...settings.hardwareCatalog, newDevice]);
            }
        }

        // Ensure at least one default
        if (updatedProfiles.length === 1) updatedProfiles[0].isDefault = true;

        updateSetting('scopeProfiles', updatedProfiles);
        updateSetting('activeScopeId', finalProfile.id);

        // Notify parent to apply
        onConfirmCalibration?.(finalProfile);

        setEditingProfile(null);
        setProfileName('');
        setSelectedHardwareId('');
        setManufacturer('');
        setModel('');
        setViewingAngle('0°');
        setShape('rectangle');
        onChangeCalibrationShape?.('rectangle');
        setStep('list');
        showToast('success', `Scope "${finalProfile.name}" saved`);
    };

    const handleSetDefault = (profileId: string) => {
        const updatedProfiles = (settings.scopeProfiles || []).map(p => ({
            ...p,
            isDefault: p.id === profileId
        }));
        updateSetting('scopeProfiles', updatedProfiles);
        showToast('success', 'Default scope updated');
    };

    const handleDeleteProfile = (profileId: string) => {
        const updatedProfiles = (settings.scopeProfiles || []).filter(p => p.id !== profileId);
        // Ensure at least one default
        if (updatedProfiles.length > 0 && !updatedProfiles.some(p => p.isDefault)) {
            updatedProfiles[0].isDefault = true;
        }
        updateSetting('scopeProfiles', updatedProfiles);
        // If we deleted the active profile, switch to default
        if (settings.activeScopeId === profileId) {
            const defaultP = updatedProfiles.find(p => p.isDefault);
            if (defaultP) updateSetting('activeScopeId', defaultP.id);
        }
        showToast('success', 'Scope profile deleted');
    };

    const handleToggleHardwareVisibility = (deviceId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updatedCatalog = settings.hardwareCatalog.map(h =>
            h.id === deviceId ? { ...h, isHidden: !h.isHidden } : h
        );
        updateSetting('hardwareCatalog', updatedCatalog);
    };

    const handleToggleTool = (key: keyof ProcedureToolSettings) => {
        const currentTools = settings.procedureTools;
        updateSetting('procedureTools', {
            ...currentTools,
            [key]: !currentTools[key]
        });
    };

    const handleCancelCalibration = () => {
        onStopCalibration?.();
        setEditingProfile(null);
        setProfileName('');
        setSelectedHardwareId('');
        setManufacturer('');
        setModel('');
        setViewingAngle('0°');
        setStep('list');
    };

    const handleBack = () => {
        if (step === 'confirm') {
            setStep('drawing');
            onStartCalibration?.();
        } else if (step === 'drawing') {
            onStopCalibration?.();
            setEditingProfile(null);
            setStep('list');
        }
    };

    const activeProfiles = settings.scopeProfiles || [];
    const activeProfile = activeProfiles.find(p => p.id === settings.activeScopeId);

    return (
        <motion.div
            initial={{ x: "100%" }}
            animate={{ x: isOpen ? 0 : "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-[100] bg-zinc-950 flex flex-col overflow-hidden border-l border-white/10"
        >
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-white/5 bg-zinc-900/50">
                <div className="flex items-center gap-3">
                    {step !== 'list' ? (
                        <button
                            onClick={handleBack}
                            className="p-1 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    ) : (
                        <Settings2 size={16} className="text-indigo-400" />
                    )}
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
                        {step === 'list' ? 'Scope Settings' :
                            step === 'drawing' ? 'Draw on Feed' :
                                'Confirm & Save'}
                    </span>
                </div>
                <button
                    onClick={() => { handleCancelCalibration(); onClose(); }}
                    className="w-9 h-9 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
                <AnimatePresence mode="wait">
                    {/* ═══ STEP: PROFILE LIST ═══ */}
                    {step === 'list' && (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            {/* Scope Profiles */}
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Scope Profiles</h4>
                                    <button
                                        onClick={handleStartNewCalibration}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all text-[9px] font-black uppercase tracking-widest"
                                    >
                                        <Plus size={12} />
                                        Add Scope
                                    </button>
                                </div>

                                <div className="grid gap-2">
                                    {activeProfiles.map((profile: ScopeProfile) => {
                                        const isActive = profile.id === settings.activeScopeId;
                                        return (
                                            <div
                                                key={profile.id}
                                                onClick={() => updateSetting('activeScopeId', profile.id)}
                                                className={`group bg-white/5 border rounded-2xl p-3 flex items-center gap-3 transition-all cursor-pointer hover:bg-white/10 ${isActive
                                                    ? 'border-indigo-500/40 ring-1 ring-indigo-500/20 bg-indigo-500/5'
                                                    : 'border-white/5'
                                                    }`}
                                            >
                                                {/* Shape Icon */}
                                                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0">
                                                    <Target size={16} className="text-indigo-400" />
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-white truncate">{profile.name}</span>
                                                        {profile.isDefault && <Star size={10} className="fill-amber-500 text-amber-500 shrink-0" />}
                                                        {isActive && (
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] shrink-0" />
                                                        )}
                                                    </div>
                                                    <div className="text-[9px] text-zinc-500 font-medium uppercase tracking-tighter">
                                                        {Math.round((profile.captureArea?.width || 1) * 100)}% capture width
                                                    </div>
                                                    {(profile.manufacturer || profile.model) && (
                                                        <div className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5 truncate">
                                                            {profile.manufacturer} {profile.model} {profile.viewingAngle && `| ${profile.viewingAngle}`}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleSetDefault(profile.id); }}
                                                        className={`p-1.5 rounded-lg transition-all ${profile.isDefault
                                                            ? 'text-amber-500'
                                                            : 'hover:bg-amber-500/20 text-zinc-600 hover:text-amber-400'
                                                            }`}
                                                        title="Set as Default"
                                                    >
                                                        <Star size={12} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEditProfile(profile); }}
                                                        className="p-1.5 hover:bg-indigo-500/20 text-zinc-600 hover:text-indigo-400 rounded-lg"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                    {activeProfiles.length > 1 && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteProfile(profile.id); }}
                                                            className="p-1.5 hover:bg-red-500/20 text-zinc-600 hover:text-red-400 rounded-lg"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {activeProfiles.length === 0 && (
                                        <div className="text-center py-8 text-zinc-600">
                                            <Microscope size={32} className="mx-auto mb-3 opacity-30" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">No scope profiles</p>
                                            <p className="text-[9px] mt-1 opacity-50">Click "Add Scope" to calibrate</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </motion.div>
                    )}



                    {/* ═══ STEP: DRAWING MODE ═══ */}
                    {step === 'drawing' && (
                        <motion.div
                            key="drawing"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="text-center space-y-3">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto animate-pulse">
                                    <Crosshair size={24} className="text-indigo-400" />
                                </div>
                                <h3 className="text-sm font-bold text-white">Drawing Mode Active</h3>
                                <p className="text-[10px] text-zinc-500 max-w-[200px] mx-auto leading-relaxed">
                                    Click and drag on the live feed to draw the capture area
                                </p>
                            </div>

                            {/* Status */}
                            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Calibrating...</span>
                                </div>

                                {calibrationArea && calibrationArea.width > 0 && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Position</span>
                                            <p className="text-[10px] font-mono text-white">{Math.round(calibrationArea.x * 100)}%, {Math.round(calibrationArea.y * 100)}%</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Size</span>
                                            <p className="text-[10px] font-mono text-white">{Math.round(calibrationArea.width * 100)}% × {Math.round(calibrationArea.height * 100)}%</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Visual Shape Preview */}
                            <div className="relative aspect-video w-full bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden">
                                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,rgba(255,255,255,0.3)_1px,transparent_1px)] bg-[size:16px_16px]" />
                                {calibrationArea && calibrationArea.width > 0 && (
                                    <svg width="100%" height="100%" className="absolute inset-0">
                                        <defs>
                                            <mask id="preview-mask">
                                                <rect width="100%" height="100%" fill="white" />
                                                <rect
                                                    x={`${(calibrationArea.x - calibrationArea.width / 2) * 100}%`}
                                                    y={`${(calibrationArea.y - calibrationArea.height / 2) * 100}%`}
                                                    width={`${calibrationArea.width * 100}%`}
                                                    height={`${calibrationArea.height * 100}%`}
                                                    fill="black"
                                                />
                                            </mask>
                                        </defs>
                                        <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#preview-mask)" />
                                        <rect
                                            x={`${(calibrationArea.x - calibrationArea.width / 2) * 100}%`}
                                            y={`${(calibrationArea.y - calibrationArea.height / 2) * 100}%`}
                                            width={`${calibrationArea.width * 100}%`}
                                            height={`${calibrationArea.height * 100}%`}
                                            fill="none"
                                            stroke="#6366f1"
                                            strokeWidth="2"
                                            strokeDasharray="6 3"
                                        />
                                    </svg>
                                )}
                                {(!calibrationArea || calibrationArea.width <= 0) && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Draw on feed →</p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Button */}
                            <button
                                onClick={handleConfirmDrawing}
                                disabled={!calibrationArea || calibrationArea.width <= 0}
                                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-3 active:scale-[0.98] disabled:cursor-not-allowed"
                            >
                                <Check size={16} />
                                Confirm Capture Area
                            </button>
                        </motion.div>
                    )}

                    {/* ═══ STEP: CONFIRM & SAVE ═══ */}
                    {step === 'confirm' && (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="text-center space-y-2">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                                    <Sparkles size={24} className="text-emerald-400" />
                                </div>
                                <h3 className="text-sm font-bold text-white">Area Captured!</h3>
                                <p className="text-[10px] text-zinc-500 max-w-[200px] mx-auto">Name your scope profile and save</p>
                            </div>

                            {/* Preview */}
                            <div className="relative aspect-video w-full bg-zinc-900 rounded-2xl border border-emerald-500/20 overflow-hidden shadow-lg shadow-emerald-500/5">
                                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle,rgba(255,255,255,0.3)_1px,transparent_1px)] bg-[size:16px_16px]" />
                                {editingProfile?.captureArea && (
                                    <svg width="100%" height="100%" className="absolute inset-0">
                                        <rect
                                            x={`${(editingProfile.captureArea.x - editingProfile.captureArea.width / 2) * 100}%`}
                                            y={`${(editingProfile.captureArea.y - editingProfile.captureArea.height / 2) * 100}%`}
                                            width={`${editingProfile.captureArea.width * 100}%`}
                                            height={`${editingProfile.captureArea.height * 100}%`}
                                            fill="rgba(16,185,129,0.1)"
                                            stroke="#10b981"
                                            strokeWidth="2"
                                        />
                                    </svg>
                                )}
                                <div className="absolute bottom-2 right-3 px-2 py-1 rounded-lg bg-black/50 border border-white/10">
                                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                                        {Math.round((editingProfile?.captureArea?.width || 0) * 100)}% capture
                                    </span>
                                </div>
                            </div>

                            {/* Name Input */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Scope Name</label>
                                <input
                                    type="text"
                                    value={profileName}
                                    onChange={e => setProfileName(e.target.value)}
                                    placeholder="e.g. GI Scope Room 1"
                                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:ring-2 ring-emerald-500/50 placeholder:text-zinc-700"
                                />
                            </div>

                            {/* Shape Selection */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Capture Shape</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => {
                                            setShape('circle');
                                            onChangeCalibrationShape?.('circle');
                                        }}
                                        className={`py-3 rounded-2xl text-[10px] font-bold border transition-all flex flex-col items-center gap-1 ${shape === 'circle'
                                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                            : 'bg-zinc-900 border-white/5 text-zinc-500 hover:bg-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        <Circle size={16} />
                                        Circle Mask
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShape('rectangle');
                                            onChangeCalibrationShape?.('rectangle');
                                        }}
                                        className={`py-3 rounded-2xl text-[10px] font-bold border transition-all flex flex-col items-center gap-1 ${shape === 'rectangle'
                                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                            : 'bg-zinc-900 border-white/5 text-zinc-500 hover:bg-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        <RectangleHorizontal size={16} />
                                        Target Crop
                                    </button>
                                </div>
                            </div>

                            {/* Hardware Selection */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Medical Hardware</label>
                                    <button
                                        onClick={() => {
                                            setSelectedHardwareId('custom');
                                            setIsHardwareDropdownOpen(false);
                                        }}
                                        className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest"
                                    >
                                        Add Custom
                                    </button>
                                </div>

                                <div className="relative">
                                    <button
                                        onClick={() => setIsHardwareDropdownOpen(!isHardwareDropdownOpen)}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-left flex items-center justify-between group hover:bg-zinc-800 transition-all shadow-lg border-l-4 border-l-indigo-500/0 hover:border-l-indigo-500/50"
                                    >
                                        <div className="flex-1 min-w-0">
                                            {selectedHardwareId === 'custom' ? (
                                                <span className="text-[11px] text-indigo-400 font-black uppercase tracking-widest">Custom: {manufacturer || '...'} {model || '...'}</span>
                                            ) : selectedHardwareId ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-bold text-white truncate">
                                                        {settings.hardwareCatalog.find(h => h.id === selectedHardwareId)?.manufacturer} {' '}
                                                        {settings.hardwareCatalog.find(h => h.id === selectedHardwareId)?.model}
                                                    </span>
                                                    <span className="text-[9px] text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded-md font-black uppercase">
                                                        {settings.hardwareCatalog.find(h => h.id === selectedHardwareId)?.viewingAngle}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-zinc-700 font-bold">Select hardware device...</span>
                                            )}
                                        </div>
                                        <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-500 ${isHardwareDropdownOpen ? 'rotate-180 text-white' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isHardwareDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                                className="absolute z-50 left-0 right-0 mt-3 bg-zinc-900/90 border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-2xl ring-1 ring-white/5"
                                            >
                                                <div className="p-3 border-b border-white/5 bg-white/5">
                                                    <div className="relative">
                                                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={hardwareSearch}
                                                            onChange={e => setHardwareSearch(e.target.value)}
                                                            placeholder="Search manufacturer or model..."
                                                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-10 py-2.5 text-[10px] text-white outline-none focus:ring-2 ring-indigo-500/20 placeholder:text-zinc-700"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="max-h-[300px] overflow-y-auto no-scrollbar py-2">
                                                    {settings.hardwareCatalog
                                                        .filter(h => !h.isHidden || hardwareSearch) // Show hidden if searching
                                                        .filter(h => {
                                                            const query = hardwareSearch.toLowerCase();
                                                            return h.manufacturer.toLowerCase().includes(query) || h.model.toLowerCase().includes(query);
                                                        })
                                                        .map(device => (
                                                            <div
                                                                key={device.id}
                                                                onClick={() => {
                                                                    setSelectedHardwareId(device.id);
                                                                    setManufacturer(device.manufacturer);
                                                                    setModel(device.model);
                                                                    setViewingAngle(device.viewingAngle);
                                                                    setIsHardwareDropdownOpen(false);
                                                                }}
                                                                className={`px-4 py-3 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-all ${selectedHardwareId === device.id ? 'bg-indigo-500/10' : ''} ${device.isHidden ? 'opacity-30' : ''}`}
                                                            >
                                                                <div className="flex-1 min-w-0 pr-4">
                                                                    <div className="text-[11px] font-bold text-white truncate group-hover:text-indigo-300 transition-colors">{device.manufacturer} {device.model}</div>
                                                                    <div className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">{device.viewingAngle} Viewing Angle</div>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => handleToggleHardwareVisibility(device.id, e)}
                                                                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${device.isHidden ? 'bg-zinc-800 text-zinc-600 hover:text-zinc-400' : 'bg-white/5 text-zinc-500 hover:bg-indigo-500/20 hover:text-indigo-400'}`}
                                                                    title={device.isHidden ? "Unhide from list" : "Hide from list"}
                                                                >
                                                                    {device.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                                                                </button>
                                                            </div>
                                                        ))
                                                    }
                                                    {hardwareSearch && settings.hardwareCatalog.filter(h => {
                                                        const query = hardwareSearch.toLowerCase();
                                                        return h.manufacturer.toLowerCase().includes(query) || h.model.toLowerCase().includes(query);
                                                    }).length === 0 && (
                                                            <div className="px-4 py-8 text-center">
                                                                <Search size={24} className="mx-auto mb-2 text-zinc-800" />
                                                                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">No matching hardware</p>
                                                            </div>
                                                        )}
                                                    <div
                                                        onClick={() => {
                                                            setSelectedHardwareId('custom');
                                                            setIsHardwareDropdownOpen(false);
                                                        }}
                                                        className="mx-2 mt-2 px-3 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:bg-indigo-500/10 cursor-pointer transition-all border border-dashed border-white/5 hover:border-indigo-500/30 text-center"
                                                    >
                                                        + Add Custom Device
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Custom Metadata (Only if selectedHardwareId === 'custom') */}
                            <AnimatePresence>
                                {selectedHardwareId === 'custom' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4 overflow-hidden pt-1"
                                    >
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Manufacturer</label>
                                                <input
                                                    type="text"
                                                    value={manufacturer}
                                                    onChange={e => setManufacturer(e.target.value)}
                                                    placeholder="e.g. Olympus"
                                                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:ring-2 ring-emerald-500/50 placeholder:text-zinc-700"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Model Name</label>
                                                <input
                                                    type="text"
                                                    value={model}
                                                    onChange={e => setModel(e.target.value)}
                                                    placeholder="e.g. GIF-H190"
                                                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:ring-2 ring-emerald-500/50 placeholder:text-zinc-700"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Scope View Angle (Degree)</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {['0°', '30°', '45°', '70°'].map(angle => (
                                                    <button
                                                        key={angle}
                                                        onClick={() => setViewingAngle(angle)}
                                                        className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${viewingAngle === angle
                                                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                                            : 'bg-zinc-900 border-white/5 text-zinc-500 hover:bg-white/5 hover:border-white/10'
                                                            }`}
                                                    >
                                                        {angle}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>


                            {/* Save Button */}
                            <button
                                onClick={handleSaveProfile}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                <Save size={16} />
                                Save Scope Profile
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
