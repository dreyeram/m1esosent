'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, ChevronDown, Wand2, Save, Download, Check, FileText,
    Printer, Mail, MessageCircle, Grid, Columns, LayoutGrid, Square,
    AlignHorizontalJustifyStart, AlignVerticalJustifyStart, Loader2
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type ImageLayout =
    | 'grid-2x2'
    | 'grid-3x2'
    | 'right-panel'
    | 'left-panel'
    | 'header-row'
    | 'footer-row'
    | 'l-shape-top'
    | 'inline';

interface LayoutOption {
    id: ImageLayout;
    name: string;
    icon: React.ReactNode;
    description: string;
}

interface StudioToolbarProps {
    onBack: () => void;
    onNormalMacro: () => void;
    onSave: () => void;
    onDownload: () => void;
    onFinalize: () => void;
    reportTitle?: string;
    isSaving?: boolean;
    isFinalized?: boolean;
    currentProcedureType?: string;
    availableTemplates?: { id: string; name: string; shortName?: string }[];
    onTemplateChange?: (newType: string) => void;
    // Layout props
    currentLayout: ImageLayout;
    onLayoutChange: (layout: ImageLayout) => void;
}

// ═══════════════════════════════════════════════════════════════
// LAYOUT OPTIONS
// ═══════════════════════════════════════════════════════════════

const LAYOUT_OPTIONS: LayoutOption[] = [
    { id: 'grid-2x2', name: '2×2 Grid', icon: <Grid size={16} />, description: '4 images in grid' },
    { id: 'grid-3x2', name: '3×2 Grid', icon: <LayoutGrid size={16} />, description: '6 images in grid' },
    { id: 'right-panel', name: 'Right Panel', icon: <Columns size={16} />, description: 'Images on right' },
    { id: 'left-panel', name: 'Left Panel', icon: <Columns size={16} className="rotate-180" />, description: 'Images on left' },
    { id: 'header-row', name: 'Header Row', icon: <AlignHorizontalJustifyStart size={16} />, description: 'Row above content' },
    { id: 'footer-row', name: 'Footer Row', icon: <AlignHorizontalJustifyStart size={16} className="rotate-180" />, description: 'Row below content' },
    { id: 'l-shape-top', name: 'L-Shape', icon: <Square size={16} />, description: '1 large + 2 small' },
    { id: 'inline', name: 'Inline', icon: <AlignVerticalJustifyStart size={16} />, description: 'Between sections' },
];

// ═══════════════════════════════════════════════════════════════
// STUDIO TOOLBAR COMPONENT
// ═══════════════════════════════════════════════════════════════

export function StudioToolbar({
    onBack,
    onNormalMacro,
    onSave,
    onDownload,
    onFinalize,
    reportTitle = "Report Editor",
    isSaving = false,
    isFinalized = false,
    currentProcedureType,
    availableTemplates = [],
    onTemplateChange,
    currentLayout,
    onLayoutChange
}: StudioToolbarProps) {
    const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
    const [showLayoutDropdown, setShowLayoutDropdown] = useState(false);

    const currentTemplate = availableTemplates.find(t =>
        t.id === currentProcedureType || currentProcedureType?.includes(t.id)
    );

    const currentLayoutOption = LAYOUT_OPTIONS.find(l => l.id === currentLayout);

    return (
        <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4">
            {/* Left Section - Back & Title */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
                >
                    <ArrowLeft size={18} />
                </button>

                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                        <FileText size={14} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white">{reportTitle}</h1>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider">
                            {isFinalized ? '✓ Finalized' : 'Editing'}
                        </p>
                    </div>
                </div>

                {/* Template Dropdown */}
                {availableTemplates.length > 0 && onTemplateChange && !isFinalized && (
                    <div className="relative ml-2">
                        <button
                            onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                            className="flex items-center gap-2 h-8 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-all"
                        >
                            <span className="max-w-[100px] truncate">
                                {currentTemplate?.shortName || currentTemplate?.name || 'Template'}
                            </span>
                            <ChevronDown size={12} className={`transition-transform ${showTemplateDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showTemplateDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowTemplateDropdown(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="absolute top-full left-0 mt-1 w-56 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50"
                                    >
                                        <div className="px-3 py-2 border-b border-zinc-800">
                                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Report Template</span>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                            {availableTemplates.map(template => (
                                                <button
                                                    key={template.id}
                                                    onClick={() => {
                                                        onTemplateChange(template.id);
                                                        setShowTemplateDropdown(false);
                                                    }}
                                                    className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-zinc-800 ${(currentProcedureType === template.id || currentProcedureType?.includes(template.id))
                                                        ? 'bg-blue-600/20 text-blue-400'
                                                        : 'text-zinc-300'
                                                        }`}
                                                >
                                                    {template.name}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Center Section - Layout Picker & Actions */}
            <div className="flex items-center gap-2">
                {/* Layout Picker */}
                {!isFinalized && (
                    <div className="relative">
                        <button
                            onClick={() => setShowLayoutDropdown(!showLayoutDropdown)}
                            className="flex items-center gap-2 h-9 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-all"
                        >
                            {currentLayoutOption?.icon}
                            <span className="hidden sm:inline">{currentLayoutOption?.name}</span>
                            <ChevronDown size={12} className={`transition-transform ${showLayoutDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showLayoutDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowLayoutDropdown(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50"
                                    >
                                        <div className="px-3 py-2 border-b border-zinc-800">
                                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Image Layout</span>
                                        </div>
                                        <div className="p-2 grid grid-cols-2 gap-1">
                                            {LAYOUT_OPTIONS.map(layout => (
                                                <button
                                                    key={layout.id}
                                                    onClick={() => {
                                                        onLayoutChange(layout.id);
                                                        setShowLayoutDropdown(false);
                                                    }}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-medium transition-all ${currentLayout === layout.id
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                                        }`}
                                                >
                                                    {layout.icon}
                                                    <span>{layout.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                <div className="w-px h-6 bg-zinc-700 mx-1" />

                {/* Auto-Fill Normal */}
                <button
                    onClick={onNormalMacro}
                    disabled={isFinalized}
                    className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Wand2 size={14} />
                    <span className="hidden sm:inline">Auto-Fill Normal</span>
                </button>

                <div className="w-px h-6 bg-zinc-700 mx-1" />

                {/* Save Draft */}
                <button
                    onClick={onSave}
                    disabled={isFinalized || isSaving}
                    className="h-9 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium text-xs flex items-center gap-2 transition-all disabled:opacity-50"
                >
                    {isSaving ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <Save size={14} />
                    )}
                    <span className="hidden sm:inline">Save</span>
                </button>

                {/* Download PDF */}
                <button
                    onClick={onDownload}
                    className="h-9 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium text-xs flex items-center gap-2 transition-all"
                >
                    <Download size={14} />
                    <span className="hidden sm:inline">PDF</span>
                </button>
            </div>

            {/* Right Section - Finalize */}
            <div className="flex items-center gap-2">
                {isFinalized ? (
                    <>
                        <button className="h-9 px-3 rounded-lg bg-zinc-800 hover:bg-blue-600 text-zinc-300 hover:text-white font-medium text-xs flex items-center gap-2 transition-all">
                            <Printer size={14} />
                            <span className="hidden sm:inline">Print</span>
                        </button>
                        <button className="h-9 px-3 rounded-lg bg-zinc-800 hover:bg-blue-600 text-zinc-300 hover:text-white font-medium text-xs flex items-center gap-2 transition-all">
                            <Mail size={14} />
                            <span className="hidden sm:inline">Email</span>
                        </button>
                        <button className="h-9 px-3 rounded-lg bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white font-medium text-xs flex items-center gap-2 transition-all">
                            <MessageCircle size={14} />
                            <span className="hidden sm:inline">WhatsApp</span>
                        </button>
                    </>
                ) : (
                    <button
                        onClick={onFinalize}
                        className="h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all"
                    >
                        <Check size={16} />
                        <span>Finalize</span>
                    </button>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// IMAGE LAYOUT PICKER (Left Sidebar)
// ═══════════════════════════════════════════════════════════════

interface ImageLayoutPickerProps {
    currentLayout: ImageLayout;
    onLayoutChange: (layout: ImageLayout) => void;
}

export function ImageLayoutPicker({ currentLayout, onLayoutChange }: ImageLayoutPickerProps) {
    return (
        <div className="w-16 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4 gap-1">
            <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider mb-2 -rotate-90 origin-center whitespace-nowrap">
                Layout
            </div>
            {LAYOUT_OPTIONS.map(layout => (
                <button
                    key={layout.id}
                    onClick={() => onLayoutChange(layout.id)}
                    title={layout.name}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${currentLayout === layout.id
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-500 hover:bg-zinc-800 hover:text-white'
                        }`}
                >
                    {layout.icon}
                </button>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// IMAGE SIDEBAR (Right Panel)
// ═══════════════════════════════════════════════════════════════

interface ImageSidebarImage {
    id: string;
    url: string;
    caption?: string;
}

interface ImageSidebarProps {
    images: ImageSidebarImage[];
    captions: Record<string, string>;
    onCaptionChange: (id: string, caption: string) => void;
    onAddImage: () => void;
    onRemoveImage: (id: string) => void;
    onReorder: (images: ImageSidebarImage[]) => void;
    maxImages?: number;
}

export function ImageSidebar({
    images,
    captions,
    onCaptionChange,
    onAddImage,
    onRemoveImage,
    onReorder,
    maxImages = 6
}: ImageSidebarProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draggedId, setDraggedId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetId) return;

        const draggedIndex = images.findIndex(img => img.id === draggedId);
        const targetIndex = images.findIndex(img => img.id === targetId);

        if (draggedIndex !== targetIndex) {
            const newImages = [...images];
            const [removed] = newImages.splice(draggedIndex, 1);
            newImages.splice(targetIndex, 0, removed);
            onReorder(newImages);
        }
    };

    const handleDragEnd = () => {
        setDraggedId(null);
    };

    return (
        <div className="w-64 h-full bg-zinc-900 border-l border-zinc-800 flex flex-col">
            {/* Header */}
            <div className="h-12 px-4 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white">Images</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded">
                    {images.length}/{maxImages}
                </span>
            </div>

            {/* Image List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {images.map((img, index) => (
                    <div
                        key={img.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, img.id)}
                        onDragOver={(e) => handleDragOver(e, img.id)}
                        onDragEnd={handleDragEnd}
                        className={`group relative bg-zinc-800 rounded-xl overflow-hidden border transition-all cursor-grab active:cursor-grabbing ${draggedId === img.id ? 'border-blue-500 scale-[1.02]' : 'border-zinc-700 hover:border-zinc-600'
                            }`}
                    >
                        {/* Image */}
                        <div className="relative aspect-video bg-zinc-950 flex items-center justify-center">
                            <img src={img.url} alt="" className="max-w-full max-h-full object-contain" />

                            {/* Index Badge */}
                            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/80 text-[9px] font-bold text-white rounded">
                                FIG {index + 1}
                            </div>

                            {/* Remove Button */}
                            <button
                                onClick={() => onRemoveImage(img.id)}
                                className="absolute top-2 right-2 w-5 h-5 bg-red-600 hover:bg-red-500 text-white rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                ×
                            </button>
                        </div>

                        {/* Caption */}
                        <div className="p-2">
                            {editingId === img.id ? (
                                <input
                                    autoFocus
                                    type="text"
                                    value={captions[img.id] || ''}
                                    onChange={(e) => onCaptionChange(img.id, e.target.value)}
                                    onBlur={() => setEditingId(null)}
                                    onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                                    placeholder="Add caption..."
                                    className="w-full text-[10px] font-medium bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white placeholder:text-zinc-600 outline-none focus:border-blue-500"
                                />
                            ) : (
                                <div
                                    onClick={() => setEditingId(img.id)}
                                    className="text-[10px] font-medium text-zinc-400 hover:text-white cursor-text truncate"
                                >
                                    {captions[img.id] || 'Click to add caption...'}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Add Button */}
                {images.length < maxImages && (
                    <button
                        onClick={onAddImage}
                        className="w-full py-6 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/5 transition-all flex flex-col items-center gap-2"
                    >
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                            <span className="text-xl">+</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Add Image</span>
                    </button>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════

export { LAYOUT_OPTIONS };
