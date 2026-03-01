"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, GripVertical, ImageIcon, Trash2 } from "lucide-react";

interface CaptureItem {
    id: string;
    url: string;
    caption?: string;
    findings?: { location?: string };
}

interface ImageGalleryPickerProps {
    isOpen: boolean;
    onClose: () => void;
    allCaptures: CaptureItem[];
    selectedIds: string[];
    onConfirm: (selectedIds: string[], captions: Record<string, string>) => void;
    captions: Record<string, string>;
}

export default function ImageGalleryPicker({
    isOpen,
    onClose,
    allCaptures,
    selectedIds: initialSelectedIds,
    onConfirm,
    captions: initialCaptions
}: ImageGalleryPickerProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
    const [captions, setCaptions] = useState<Record<string, string>>(initialCaptions);

    useEffect(() => {
        if (isOpen) {
            setSelectedIds(initialSelectedIds);
            setCaptions(initialCaptions);
        }
    }, [isOpen, initialSelectedIds, initialCaptions]);

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : prev.length < 8 ? [...prev, id] : prev
        );
    };

    const updateCaption = (id: string, text: string) => {
        setCaptions(prev => ({ ...prev, [id]: text }));
    };

    const handleConfirm = () => {
        onConfirm(selectedIds, captions);
        onClose();
    };

    const moveUp = (id: string) => {
        const idx = selectedIds.indexOf(id);
        if (idx > 0) {
            const newArr = [...selectedIds];
            [newArr[idx - 1], newArr[idx]] = [newArr[idx], newArr[idx - 1]];
            setSelectedIds(newArr);
        }
    };

    const moveDown = (id: string) => {
        const idx = selectedIds.indexOf(id);
        if (idx < selectedIds.length - 1) {
            const newArr = [...selectedIds];
            [newArr[idx], newArr[idx + 1]] = [newArr[idx + 1], newArr[idx]];
            setSelectedIds(newArr);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-white">Image Gallery</h2>
                            <p className="text-slate-400 text-sm mt-1">
                                Select up to 8 images • {selectedIds.length}/8 selected
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden flex">
                        {/* Left: All Captures Grid */}
                        <div className="flex-1 p-6 overflow-y-auto border-r border-slate-700">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">All Captured Images</h3>
                            {allCaptures.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                                    <ImageIcon size={48} className="mb-2 opacity-50" />
                                    <p>No images captured</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-3">
                                    {allCaptures.map(cap => {
                                        const isSelected = selectedIds.includes(cap.id);
                                        const selIndex = selectedIds.indexOf(cap.id);
                                        return (
                                            <div
                                                key={cap.id}
                                                onClick={() => toggleSelection(cap.id)}
                                                className={`relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group transition-all duration-200 ${isSelected
                                                    ? 'ring-4 ring-emerald-500 shadow-lg shadow-emerald-500/30'
                                                    : 'ring-2 ring-transparent hover:ring-slate-600'
                                                    }`}
                                            >
                                                <img
                                                    src={cap.url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                                {/* Selection Badge */}
                                                {isSelected && (
                                                    <div className="absolute top-2 left-2 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                                        {selIndex + 1}
                                                    </div>
                                                )}
                                                {/* Hover Overlay */}
                                                <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isSelected ? 'bg-emerald-500/20' : 'bg-black/40 opacity-0 group-hover:opacity-100'
                                                    }`}>
                                                    {!isSelected && (
                                                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                                            <Check size={24} className="text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Right: Selected Images with Captions */}
                        <div className="w-80 p-6 overflow-y-auto bg-slate-800/50">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Selected Order & Captions</h3>
                            {selectedIds.length === 0 ? (
                                <div className="text-center text-slate-500 py-8">
                                    <p>Click images to select</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedIds.map((id, idx) => {
                                        const cap = allCaptures.find(c => c.id === id);
                                        if (!cap) return null;
                                        return (
                                            <div key={id} className="bg-slate-700/50 rounded-xl p-3 group">
                                                <div className="flex gap-3">
                                                    {/* Thumbnail */}
                                                    <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                                        <img src={cap.url} className="w-full h-full object-cover" />
                                                    </div>
                                                    {/* Controls */}
                                                    <div className="flex-1 flex flex-col justify-center">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                                {idx + 1}
                                                            </span>
                                                            <div className="flex gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => moveUp(id)}
                                                                    disabled={idx === 0}
                                                                    className="w-6 h-6 rounded bg-slate-600 hover:bg-slate-500 flex items-center justify-center text-slate-300 disabled:opacity-30"
                                                                >
                                                                    ↑
                                                                </button>
                                                                <button
                                                                    onClick={() => moveDown(id)}
                                                                    disabled={idx === selectedIds.length - 1}
                                                                    className="w-6 h-6 rounded bg-slate-600 hover:bg-slate-500 flex items-center justify-center text-slate-300 disabled:opacity-30"
                                                                >
                                                                    ↓
                                                                </button>
                                                                <button
                                                                    onClick={() => toggleSelection(id)}
                                                                    className="w-6 h-6 rounded bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-red-400"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Caption Input */}
                                                <input
                                                    type="text"
                                                    value={captions[id] || cap.findings?.location || ''}
                                                    onChange={e => updateCaption(id, e.target.value)}
                                                    placeholder="Enter caption..."
                                                    className="w-full mt-2 px-3 py-2 bg-slate-600/50 border border-slate-500/50 rounded-lg text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-700 flex items-center justify-end gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-slate-400 hover:text-white font-bold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2"
                        >
                            <Check size={20} />
                            Apply Selection
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
