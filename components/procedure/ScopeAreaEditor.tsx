"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Maximize2, Move } from "lucide-react";

interface ScopeAreaEditorProps {
    shape: 'circle' | 'square' | 'rect';
    captureArea: { x: number; y: number; width: number; height: number };
    baseScale: number;
    onChange: (data: { captureArea?: { x: number; y: number; width: number; height: number }, baseScale?: number }) => void;
}

export default function ScopeAreaEditor({ shape, captureArea, baseScale, onChange }: ScopeAreaEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [localArea, setLocalArea] = useState(captureArea);
    const [localScale, setLocalScale] = useState(baseScale);

    useEffect(() => {
        setLocalArea(captureArea);
        setLocalScale(baseScale);
    }, [captureArea, baseScale]);

    const handleDrag = (_: any, info: any) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        // Calculate new normalized center
        const newX = localArea.x + (info.delta.x / rect.width);
        const newY = localArea.y + (info.delta.y / rect.height);

        // Calculate effective height for clamping
        const effectiveHeight = (shape === 'circle' || shape === 'square')
            ? localArea.width * (rect.width / rect.height)
            : localArea.height;

        // Clamp centers
        const clampedX = Math.max(localArea.width / 2, Math.min(1 - localArea.width / 2, newX));
        const clampedY = Math.max(effectiveHeight / 2, Math.min(1 - effectiveHeight / 2, newY));

        const updated = { ...localArea, x: clampedX, y: clampedY, height: effectiveHeight };
        setLocalArea(updated);
        onChange({ captureArea: updated });
    };

    const handleSizeChange = (dim: 'width' | 'height', val: number) => {
        const updated = { ...localArea, [dim]: val };

        if (shape === 'circle' || shape === 'square') {
            // In a 16:9 container, to be visually square:
            // normalizedHeight = normalizedWidth * (16/9)
            updated.height = val * (16 / 9);
        }

        setLocalArea(updated);
        onChange({ captureArea: updated });
    };

    const handleScaleChange = (val: number) => {
        setLocalScale(val);
        onChange({ baseScale: val });
    };

    const visualHeight = (shape === 'circle' || shape === 'square')
        ? localArea.width * 100 * (16 / 9)
        : localArea.height * 100;

    const visualTop = (localArea.y * 100) - (visualHeight / 2);

    return (
        <div className="space-y-4">
            {/* Visual Preview */}
            <div
                ref={containerRef}
                className="relative aspect-video w-full bg-zinc-950 rounded-2xl border border-white/10 overflow-hidden cursor-crosshair shadow-inner ring-1 ring-white/5"
            >
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,rgba(255,255,255,0.3)_1px,transparent_1px)] bg-[size:16px_16px]" />

                {/* Instructions */}
                <div className="absolute top-2 left-3 flex items-center gap-1.5 opacity-30 pointer-events-none">
                    <Move size={10} className="text-white" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white">Drag to position</span>
                </div>

                {/* The Draggable Area */}
                <motion.div
                    drag
                    dragMomentum={false}
                    dragElastic={0}
                    onDrag={handleDrag}
                    className={`absolute border-2 border-indigo-500 bg-indigo-500/20 cursor-move flex items-center justify-center transition-shadow hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] shadow-xl ${shape === 'circle' ? 'rounded-full' : ''
                        }`}
                    style={{
                        width: `${localArea.width * 100}%`,
                        height: `${visualHeight}%`,
                        // (x,y) is center
                        left: `${(localArea.x * 100) - (localArea.width * 100 / 2)}%`,
                        top: `${visualTop}%`,
                    }}
                >
                    {/* Crosshair */}
                    <div className="w-4 h-px bg-indigo-500/50 absolute" />
                    <div className="h-4 w-px bg-indigo-500/50 absolute" />
                    <div className="w-1.5 h-1.5 bg-white rounded-full shadow-lg" />
                </motion.div>
            </div>

            {/* Size Sliders */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Width</label>
                        <span className="text-[9px] font-mono text-indigo-400 font-bold">{Math.round(localArea.width * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.01"
                        value={localArea.width}
                        onChange={(e) => handleSizeChange('width', parseFloat(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>
                {shape === 'rect' && (
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Height</label>
                            <span className="text-[9px] font-mono text-indigo-400 font-bold">{Math.round(localArea.height * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.01"
                            value={localArea.height}
                            onChange={(e) => handleSizeChange('height', parseFloat(e.target.value))}
                            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>
                )}
            </div>

            {/* Scale Slider */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
                <div className="flex justify-between items-center px-1">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Base Calibration Scale</label>
                    <span className="text-[9px] font-mono text-cyan-400 font-bold">{(localScale || 1).toFixed(2)}x</span>
                </div>
                <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.01"
                    value={localScale || 1}
                    onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
            </div>
        </div>
    );
}
