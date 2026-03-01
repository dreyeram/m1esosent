'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
    Image as ImageIcon,
    Plus,
    Trash2,
    Edit3,
    GripVertical,
    Camera,
    X,
    Check
} from 'lucide-react';
import { ReportImage } from '@/types/reportTemplates';

interface ImageGalleryProps {
    images: ReportImage[];
    maxImages?: 4 | 6;
    onImagesChange: (images: ReportImage[]) => void;
    onAddImage?: () => void;
    readOnly?: boolean;
}

/**
 * ImageGallery - 4-6 image grid for report images with captions
 * Supports reordering, caption editing, and image replacement
 */
export function ImageGallery({
    images,
    maxImages = 4,
    onImagesChange,
    onAddImage,
    readOnly = false
}: ImageGalleryProps) {
    const [editingCaption, setEditingCaption] = useState<string | null>(null);
    const [captionText, setCaptionText] = useState('');

    // Pad images to max slots for empty placeholders
    const imageSlots = Array.from({ length: maxImages }, (_, i) => {
        return images.find(img => img.position === i + 1) || null;
    });

    // Start editing caption
    const startEditCaption = (imageId: string, currentCaption: string) => {
        setEditingCaption(imageId);
        setCaptionText(currentCaption);
    };

    // Save caption
    const saveCaption = (imageId: string) => {
        const updatedImages = images.map(img =>
            img.id === imageId ? { ...img, caption: captionText } : img
        );
        onImagesChange(updatedImages);
        setEditingCaption(null);
        setCaptionText('');
    };

    // Cancel caption edit
    const cancelEditCaption = () => {
        setEditingCaption(null);
        setCaptionText('');
    };

    // Remove an image
    const removeImage = (imageId: string) => {
        const updatedImages = images.filter(img => img.id !== imageId);
        // Re-number positions
        const renumbered = updatedImages.map((img, idx) => ({
            ...img,
            position: idx + 1
        }));
        onImagesChange(renumbered);
    };

    // Handle reorder
    const handleReorder = (reorderedImages: (ReportImage | null)[]) => {
        const validImages = reorderedImages
            .filter((img): img is ReportImage => img !== null)
            .map((img, idx) => ({
                ...img,
                position: idx + 1
            }));
        onImagesChange(validImages);
    };

    // Render empty slot
    const renderEmptySlot = (position: number) => (
        <motion.div
            key={`empty-${position}`}
            className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
            onClick={onAddImage}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <Plus size={24} className="text-slate-400 group-hover:text-blue-500" />
            </div>
            <span className="text-xs font-medium text-slate-400 group-hover:text-blue-500">
                Fig {position}
            </span>
        </motion.div>
    );

    // Render image slot
    const renderImageSlot = (image: ReportImage) => (
        <motion.div
            key={image.id}
            layout
            className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 group shadow-sm"
        >
            {/* Image */}
            <img
                src={image.url}
                alt={image.caption || `Figure ${image.position}`}
                className="w-full h-full object-cover"
            />

            {/* Overlay on hover */}
            {!readOnly && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Top actions */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                        <button
                            onClick={() => removeImage(image.id)}
                            className="p-2 bg-red-500/90 hover:bg-red-600 rounded-lg text-white transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>

                    {/* Drag handle */}
                    <div className="absolute top-2 left-2 p-2 bg-white/20 rounded-lg cursor-grab active:cursor-grabbing">
                        <GripVertical size={14} className="text-white" />
                    </div>
                </div>
            )}

            {/* Caption */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                {editingCaption === image.id ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={captionText}
                            onChange={(e) => setCaptionText(e.target.value)}
                            placeholder="Enter caption..."
                            className="flex-1 bg-white/20 border border-white/30 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') saveCaption(image.id);
                                if (e.key === 'Escape') cancelEditCaption();
                            }}
                        />
                        <button
                            onClick={() => saveCaption(image.id)}
                            className="p-1.5 bg-emerald-500 rounded-lg text-white hover:bg-emerald-600"
                        >
                            <Check size={14} />
                        </button>
                        <button
                            onClick={cancelEditCaption}
                            className="p-1.5 bg-slate-500 rounded-lg text-white hover:bg-slate-600"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div
                        className="flex items-center justify-between cursor-pointer group/caption"
                        onClick={() => !readOnly && startEditCaption(image.id, image.caption)}
                    >
                        <span className="text-sm font-medium text-white truncate">
                            Fig {image.position}: {image.caption || 'Add caption...'}
                        </span>
                        {!readOnly && (
                            <Edit3 size={12} className="text-white/60 group-hover/caption:text-white ml-2 flex-shrink-0" />
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Camera size={18} className="text-slate-400" />
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                        Images ({images.length}/{maxImages})
                    </h3>
                </div>
                {!readOnly && images.length < maxImages && onAddImage && (
                    <button
                        onClick={onAddImage}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium text-xs transition-colors"
                    >
                        <Plus size={14} />
                        Add Image
                    </button>
                )}
            </div>

            {/* Image Grid */}
            <div className={`grid gap-3 ${maxImages === 6 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {imageSlots.map((image, idx) =>
                    image ? renderImageSlot(image) : renderEmptySlot(idx + 1)
                )}
            </div>

            {/* Instructions */}
            {!readOnly && images.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-4">
                    Click an empty slot or use "Add Image" to add images to your report
                </p>
            )}
        </div>
    );
}

export default ImageGallery;
