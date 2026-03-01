'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, GripVertical, Camera } from 'lucide-react';

interface ImageData {
    id: string;
    url: string;
    caption?: string;
    maskType?: 'circle' | 'square' | 'rectangle' | 'full';
}

interface DocumentImageGridProps {
    images: ImageData[];
    captions: Record<string, string>;
    onCaptionChange: (id: string, caption: string) => void;
    onAddImage: () => void;
    onRemoveImage?: (id: string) => void;
    onReorder?: (images: ImageData[]) => void;
    maxImages?: number;
    readOnly?: boolean;
}

export default function DocumentImageGrid({
    images,
    captions,
    onCaptionChange,
    onAddImage,
    onRemoveImage,
    maxImages = 6,
    readOnly = false
}: DocumentImageGridProps) {
    const [editingCaption, setEditingCaption] = useState<string | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    return (
        <div className="mt-6 mb-4">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Camera size={14} className="text-blue-500" />
                    Endoscopic Images
                    <span className="text-[10px] font-medium text-slate-400 normal-case tracking-normal">
                        ({images.length}/{maxImages})
                    </span>
                </h3>
                {!readOnly && images.length < maxImages && (
                    <button
                        onClick={onAddImage}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                        <Plus size={14} />
                        Add Images
                    </button>
                )}
            </div>

            {/* Image Grid - 4 columns */}
            {images.length > 0 ? (
                <div className="grid grid-cols-4 gap-4">
                    {images.map((image, index) => (
                        <motion.div
                            key={image.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="group relative"
                            onMouseEnter={() => setHoveredId(image.id)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                            {/* Image Container */}
                            <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-lg">
                                {/* Figure Badge */}
                                <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-slate-900/80 text-white text-[10px] font-bold rounded-md backdrop-blur-sm">
                                    Fig {index + 1}
                                </div>

                                {/* Remove Button */}
                                {!readOnly && onRemoveImage && hoveredId === image.id && (
                                    <button
                                        onClick={() => onRemoveImage(image.id)}
                                        className="absolute top-2 right-2 z-10 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all"
                                    >
                                        <X size={12} />
                                    </button>
                                )}

                                {/* Image */}
                                <img
                                    src={image.url}
                                    alt={`Figure ${index + 1}`}
                                    className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${image.maskType === 'circle' ? 'rounded-full' : ''
                                        }`}
                                />
                            </div>

                            {/* Caption */}
                            <div className="mt-2">
                                {editingCaption === image.id && !readOnly ? (
                                    <input
                                        autoFocus
                                        type="text"
                                        value={captions[image.id] || ''}
                                        onChange={(e) => onCaptionChange(image.id, e.target.value)}
                                        onBlur={() => setEditingCaption(null)}
                                        onKeyDown={(e) => e.key === 'Enter' && setEditingCaption(null)}
                                        placeholder="Add caption..."
                                        className="w-full text-xs text-center bg-blue-50 border border-blue-200 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-blue-400/30"
                                    />
                                ) : (
                                    <p
                                        onClick={() => !readOnly && setEditingCaption(image.id)}
                                        className={`text-xs text-center truncate px-1 py-0.5 rounded transition-colors ${captions[image.id]
                                                ? 'text-slate-600 font-medium'
                                                : 'text-slate-400 italic'
                                            } ${!readOnly && 'cursor-text hover:bg-slate-50'}`}
                                    >
                                        {captions[image.id] || 'Click to add caption'}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {/* Add More Placeholder */}
                    {!readOnly && images.length < maxImages && images.length > 0 && (
                        <button
                            onClick={onAddImage}
                            className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 flex flex-col items-center justify-center gap-2 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-200 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                                <Plus size={20} className="text-slate-400 group-hover:text-blue-500" />
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-500 uppercase tracking-wide">
                                Add
                            </span>
                        </button>
                    )}
                </div>
            ) : (
                /* Empty State */
                <div className="py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                        <Camera size={24} className="text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-400">No images selected</p>
                    {!readOnly && (
                        <button
                            onClick={onAddImage}
                            className="mt-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                        >
                            Select Images
                        </button>
                    )}
                </div>
            )}

            {/* Help Text */}
            {images.length > 0 && !readOnly && (
                <p className="mt-3 text-[10px] text-slate-400 text-center">
                    Click on caption to edit • Images will appear in final PDF
                </p>
            )}
        </div>
    );
}
