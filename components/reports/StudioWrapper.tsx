'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    StudioToolbar,
    ImageLayoutPicker,
    ImageSidebar,
    ImageLayout,
    LAYOUT_OPTIONS
} from './ReportStudio';
import ImageGalleryPicker from './ImageGalleryPicker';
import { getAllTemplates } from '@/data/reportTemplates';
import { updateProcedureType } from '@/app/actions/procedure';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface StudioWrapperProps {
    patient: {
        id?: string;
        name: string;
        age?: number;
        gender?: string;
        mrn?: string;
        procedureType?: string;
        procedureId?: string;
    };
    captures: Array<{
        id: string;
        url: string;
        timestamp?: string;
        type?: 'image' | 'video';
        category?: string;
        deleted?: boolean;
    }>;
    onBack: () => void;
    onComplete?: () => void;
    onGeneratePDF: (reportData: any, action?: 'download' | 'preview' | 'print' | 'save') => Promise<void>;
    hospital?: {
        name?: string;
        address?: string;
        mobile?: string;
        email?: string;
        logoPath?: string;
    };
    doctor?: {
        fullName?: string;
        specialty?: string;
        signaturePath?: string;
    };
    procedureId?: string;
    children: React.ReactNode; // This will be the existing form content
    formData: Record<string, any>;
    onFieldChange: (id: string, value: any) => void;
    onNormalMacro: () => void;
    onSave: () => void;
    onDownload: () => void;
    onFinalize: () => void;
    isFinalized?: boolean;
    isSaving?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// IMAGE LAYOUT RENDERER
// ═══════════════════════════════════════════════════════════════

interface LayoutRendererProps {
    layout: ImageLayout;
    images: Array<{ id: string; url: string; caption?: string }>;
    captions: Record<string, string>;
}

function ImageLayoutRenderer({ layout, images, captions }: LayoutRendererProps) {
    if (images.length === 0) return null;

    const renderImage = (img: { id: string; url: string }, index: number) => (
        <div key={img.id} className="relative bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
            <img src={img.url} alt={`Fig ${index + 1}`} className="w-full h-full object-contain" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <span className="text-white text-xs font-bold">Fig {index + 1}</span>
                {captions[img.id] && (
                    <p className="text-white/80 text-[10px] mt-0.5">{captions[img.id]}</p>
                )}
            </div>
        </div>
    );

    switch (layout) {
        case 'grid-2x2':
            return (
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {images.slice(0, 4).map((img, i) => renderImage(img, i))}
                </div>
            );

        case 'grid-3x2':
            return (
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {images.slice(0, 6).map((img, i) => renderImage(img, i))}
                </div>
            );

        case 'header-row':
            return (
                <div className="flex gap-3 mb-6">
                    {images.slice(0, 4).map((img, i) => (
                        <div key={img.id} className="flex-1 aspect-[4/3]">
                            {renderImage(img, i)}
                        </div>
                    ))}
                </div>
            );

        case 'footer-row':
            return (
                <div className="flex gap-3 mt-6">
                    {images.slice(0, 4).map((img, i) => (
                        <div key={img.id} className="flex-1 aspect-[4/3]">
                            {renderImage(img, i)}
                        </div>
                    ))}
                </div>
            );

        case 'l-shape-top':
            return (
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="col-span-2 row-span-2 aspect-video">
                        {images[0] && renderImage(images[0], 0)}
                    </div>
                    <div className="aspect-video">
                        {images[1] && renderImage(images[1], 1)}
                    </div>
                    <div className="aspect-video">
                        {images[2] && renderImage(images[2], 2)}
                    </div>
                </div>
            );

        case 'right-panel':
        case 'left-panel':
        case 'inline':
        default:
            // These are handled differently in the main layout
            return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// STUDIO WRAPPER COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function StudioWrapper({
    patient,
    captures,
    onBack,
    onComplete,
    onGeneratePDF,
    hospital,
    doctor,
    procedureId,
    children,
    formData,
    onFieldChange,
    onNormalMacro,
    onSave,
    onDownload,
    onFinalize,
    isFinalized = false,
    isSaving = false
}: StudioWrapperProps) {
    // State
    const [imageLayout, setImageLayout] = useState<ImageLayout>('grid-2x2');
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [imageCaptions, setImageCaptions] = useState<Record<string, string>>({});
    const [showGalleryPicker, setShowGalleryPicker] = useState(false);
    const [currentProcedureType, setCurrentProcedureType] = useState(patient.procedureType || '');

    // Get templates for dropdown
    const allTemplates = getAllTemplates();
    const availableTemplates = allTemplates.map(t => ({
        id: t.id,
        name: t.name,
        shortName: t.shortName
    }));

    // Filter available images
    const availableCaptures = captures.filter(c =>
        c.type !== 'video' && !c.deleted
    );

    const selectedImageData = selectedImages
        .map(id => availableCaptures.find(c => c.id === id))
        .filter(Boolean) as typeof availableCaptures;

    // Handle template change
    const handleTemplateChange = async (newType: string) => {
        setCurrentProcedureType(newType);
        if (procedureId) {
            try {
                await updateProcedureType(procedureId, newType);
            } catch (err) {
                console.error('Failed to update procedure type:', err);
            }
        }
    };

    // Handle caption change
    const handleCaptionChange = (id: string, caption: string) => {
        setImageCaptions(prev => ({ ...prev, [id]: caption }));
    };

    // Handle image reorder
    const handleImageReorder = (newOrder: Array<{ id: string; url: string }>) => {
        setSelectedImages(newOrder.map(img => img.id));
    };

    // Handle remove image
    const handleRemoveImage = (id: string) => {
        setSelectedImages(prev => prev.filter(imgId => imgId !== id));
    };

    // Handle gallery picker confirm
    const handleGalleryConfirm = (newSelectedIds: string[], newCaptions: Record<string, string>) => {
        setSelectedImages(newSelectedIds);
        setImageCaptions(prev => ({ ...prev, ...newCaptions }));
        setShowGalleryPicker(false);
    };

    // Report title
    const reportTitle = patient.procedureType?.split(':').pop()?.replace(/_/g, ' ') || 'Medical Report';

    // Determine layout structure
    const showRightPanel = imageLayout === 'right-panel';
    const showLeftPanel = imageLayout === 'left-panel';
    const showInlineImages = ['grid-2x2', 'grid-3x2', 'header-row', 'l-shape-top'].includes(imageLayout);
    const showFooterImages = imageLayout === 'footer-row';

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
            {/* Toolbar */}
            <StudioToolbar
                onBack={onBack}
                onNormalMacro={onNormalMacro}
                onSave={onSave}
                onDownload={onDownload}
                onFinalize={onFinalize}
                reportTitle={reportTitle}
                isSaving={isSaving}
                isFinalized={isFinalized}
                currentProcedureType={currentProcedureType}
                availableTemplates={availableTemplates}
                onTemplateChange={handleTemplateChange}
                currentLayout={imageLayout}
                onLayoutChange={setImageLayout}
            />

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Layout Picker */}
                <ImageLayoutPicker
                    currentLayout={imageLayout}
                    onLayoutChange={setImageLayout}
                />

                {/* Center: PDF Canvas */}
                <div className="flex-1 overflow-auto p-8 flex justify-center">
                    <div className={`flex gap-6 max-w-6xl w-full ${showLeftPanel ? 'flex-row-reverse' : ''}`}>
                        {/* Paper */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex-1 bg-white rounded-xl shadow-2xl shadow-black/30 min-h-[800px] p-8 overflow-hidden"
                            style={{ maxWidth: showRightPanel || showLeftPanel ? '65%' : '100%' }}
                        >
                            {/* Letterhead */}
                            <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-200">
                                <div className="flex items-center gap-4">
                                    {hospital?.logoPath && (
                                        <img src={hospital.logoPath} alt="" className="w-16 h-16 object-contain" />
                                    )}
                                    <div>
                                        <h1 className="text-xl font-black text-slate-900">{hospital?.name || 'Medical Center'}</h1>
                                        <p className="text-xs text-slate-500">{hospital?.address}</p>
                                        <p className="text-xs text-slate-500">{hospital?.mobile} • {hospital?.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-slate-900">{doctor?.fullName || 'Doctor'}</p>
                                    <p className="text-xs text-slate-500">{doctor?.specialty}</p>
                                </div>
                            </div>

                            {/* Report Title */}
                            <div className="text-center mb-6">
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider">Medical Report</h2>
                                <p className="text-xs text-blue-600 font-medium">
                                    {currentProcedureType?.split(':').pop()?.replace(/_/g, ' ').toUpperCase()}
                                </p>
                            </div>

                            {/* Patient Info */}
                            <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
                                <div>
                                    <p className="text-[9px] uppercase text-slate-400 font-bold">Name</p>
                                    <p className="text-sm font-bold text-slate-900">{patient.name}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase text-slate-400 font-bold">MRN / ID</p>
                                    <p className="text-sm font-bold text-slate-900">{patient.mrn || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase text-slate-400 font-bold">Age / Sex</p>
                                    <p className="text-sm font-bold text-slate-900">{patient.age}Y / {patient.gender}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase text-slate-400 font-bold">Date</p>
                                    <p className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Images - Header Position */}
                            {showInlineImages && selectedImageData.length > 0 && (
                                <ImageLayoutRenderer
                                    layout={imageLayout}
                                    images={selectedImageData}
                                    captions={imageCaptions}
                                />
                            )}

                            {/* Form Content (passed as children) */}
                            <div className="report-form-content">
                                {children}
                            </div>

                            {/* Images - Footer Position */}
                            {showFooterImages && selectedImageData.length > 0 && (
                                <ImageLayoutRenderer
                                    layout={imageLayout}
                                    images={selectedImageData}
                                    captions={imageCaptions}
                                />
                            )}
                        </motion.div>

                        {/* Side Panel Images (Right or Left) */}
                        {(showRightPanel || showLeftPanel) && selectedImageData.length > 0 && (
                            <div className="w-64 space-y-4">
                                {selectedImageData.map((img, i) => (
                                    <div key={img.id} className="bg-white rounded-xl overflow-hidden shadow-lg">
                                        <img src={img.url} alt="" className="w-full aspect-[4/3] object-cover" />
                                        <div className="p-3">
                                            <span className="text-[10px] font-black text-slate-400">FIG {i + 1}</span>
                                            {imageCaptions[img.id] && (
                                                <p className="text-xs text-slate-600 mt-1">{imageCaptions[img.id]}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Image Sidebar */}
                <ImageSidebar
                    images={selectedImageData.map(img => ({ id: img.id, url: img.url }))}
                    captions={imageCaptions}
                    onCaptionChange={handleCaptionChange}
                    onAddImage={() => setShowGalleryPicker(true)}
                    onRemoveImage={handleRemoveImage}
                    onReorder={handleImageReorder}
                    maxImages={6}
                />
            </div>

            {/* Gallery Picker Modal */}
            <ImageGalleryPicker
                isOpen={showGalleryPicker}
                onClose={() => setShowGalleryPicker(false)}
                allCaptures={availableCaptures}
                selectedIds={selectedImages}
                captions={imageCaptions}
                onConfirm={handleGalleryConfirm}
            />
        </div>
    );
}
