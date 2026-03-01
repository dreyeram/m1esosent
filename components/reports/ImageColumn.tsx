'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, GripVertical, Type, Info, FileText } from 'lucide-react';

interface ImageData {
    id: string;
    url: string;
    caption?: string;
    maskType?: 'circle' | 'square' | 'rectangle' | 'full';
    originalWidth?: number;
    originalHeight?: number;
}

interface ImageColumnProps {
    images: ImageData[];
    captions: Record<string, string>;
    onCaptionChange: (id: string, caption: string) => void;
    onAddImage: () => void;
    onRemoveImage?: (id: string) => void;
    onReorder?: (images: ImageData[]) => void;
    maxImages?: number;
    readOnly?: boolean;
}

export default function ImageColumn({
    images,
    captions,
    onCaptionChange,
    onAddImage,
    onRemoveImage,
    onReorder,
    maxImages = 6,
    readOnly = false
}: ImageColumnProps) {
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [editingCaption, setEditingCaption] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetId || !onReorder) return;

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
        <div className="w-full h-full flex flex-col bg-slate-50/30">
            {/* Sticky Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        Report Gallery
                    </h3>
                    <span className="text-[10px] font-black px-2 py-1 bg-slate-100 text-slate-500 rounded-lg uppercase tracking-tight">
                        {images.length} / {maxImages}
                    </span>
                </div>
            </div>

            {/* Images List - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {images.map((image, index) => (
                        <motion.div
                            key={image.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                boxShadow: draggedId === image.id
                                    ? '0 30px 60px rgba(0,0,0,0.15)'
                                    : '0 4px 12px rgba(0,0,0,0.03)'
                            }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            draggable={!readOnly}
                            onDragStart={(e) => handleDragStart(e as any, image.id)}
                            onDragOver={(e) => handleDragOver(e as any, image.id)}
                            onDragEnd={handleDragEnd}
                            className={`group relative bg-white rounded-3xl overflow-hidden border-2 transition-all duration-500 ${draggedId === image.id
                                ? 'border-blue-500 z-10 scale-[1.02]'
                                : 'border-slate-100 hover:border-blue-200'
                                }`}
                        >
                            {/* Medical Index Badge */}
                            <div className="absolute top-4 left-4 z-10 px-2 py-1 bg-slate-900/90 text-white text-[9px] font-black rounded-lg uppercase tracking-widest backdrop-blur-sm border border-white/20">
                                FIG {index + 1}
                            </div>

                            {/* Toolbar - Visible on Hover */}
                            {!readOnly && (
                                <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                    <div className="cursor-grab active:cursor-grabbing p-1.5 bg-white shadow-xl rounded-xl border border-slate-100 text-slate-400 hover:text-blue-600 hover:scale-110 transition-all">
                                        <GripVertical size={14} />
                                    </div>
                                    {onRemoveImage && (
                                        <button
                                            onClick={() => onRemoveImage(image.id)}
                                            className="p-1.5 bg-white shadow-xl rounded-xl border border-slate-100 text-slate-400 hover:text-red-600 hover:scale-110 transition-all"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Image Container */}
                            <div className="w-full flex items-center justify-center p-3 bg-slate-50/30 min-h-[160px]">
                                <img
                                    src={image.url}
                                    alt={`Capture ${index + 1}`}
                                    className={`max-w-full h-auto shadow-2xl transition-transform duration-700 group-hover:scale-[1.03] ${image.maskType === 'circle'
                                        ? 'rounded-full'
                                        : 'rounded-2xl'
                                        }`}
                                    style={{
                                        width: image.originalWidth ? `${Math.min(image.originalWidth, 320)}px` : 'auto',
                                        objectFit: 'contain'
                                    }}
                                />
                            </div>

                            {/* Caption - Integrated look */}
                            <div className="px-5 py-4 bg-white/80 border-t border-slate-50">
                                {editingCaption === image.id && !readOnly ? (
                                    <input
                                        autoFocus
                                        type="text"
                                        value={captions[image.id] || ''}
                                        onChange={(e) => onCaptionChange(image.id, e.target.value)}
                                        onBlur={() => setEditingCaption(null)}
                                        onKeyDown={(e) => e.key === 'Enter' && setEditingCaption(null)}
                                        placeholder="Add diagnostic caption..."
                                        className="w-full text-xs font-bold bg-slate-50 border-none rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-300 placeholder:font-normal"
                                    />
                                ) : (
                                    <div
                                        onClick={() => !readOnly && setEditingCaption(image.id)}
                                        className={`flex items-center gap-3 text-xs font-black transition-colors ${captions[image.id]
                                            ? 'text-slate-700'
                                            : 'text-slate-300 italic'
                                            } ${!readOnly && 'cursor-text hover:text-blue-600'}`}
                                    >
                                        <div className="p-1 bg-slate-100 rounded-lg group-hover:bg-blue-50 transition-colors">
                                            <Info size={10} className={captions[image.id] ? "text-blue-600" : "text-slate-300"} />
                                        </div>
                                        {captions[image.id] || 'Click to add caption...'}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Add More Button */}
                {!readOnly && images.length < maxImages && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={onAddImage}
                        className="w-full py-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-500 group flex flex-col items-center justify-center gap-4 shadow-sm"
                    >
                        <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-white group-hover:scale-110 group-hover:shadow-xl transition-all duration-500">
                            <Plus size={28} className="text-slate-300 group-hover:text-blue-600" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Add Findings</span>
                    </motion.button>
                )}
            </div>

            {/* Empty State */}
            {images.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-pulse">
                    <div className="w-20 h-20 rounded-full bg-slate-100/50 flex items-center justify-center mb-6">
                        <FileText size={32} className="text-slate-200" />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Findings Selected</p>
                    {!readOnly && (
                        <button
                            onClick={onAddImage}
                            className="mt-6 px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
                        >
                            Select Media
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
