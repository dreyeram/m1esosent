"use client";

import React from 'react';

interface ZoomMiniMapProps {
    imageUrl: string;
    zoom: number;
    offset: { x: number; y: number };
    className?: string;
}

export default function ZoomMiniMap({ imageUrl, zoom, offset, className = "" }: ZoomMiniMapProps) {
    if (zoom <= 1) return null;

    // The "viewport" box size in the minimap is 1 / zoom
    const boxWidth = (1 / zoom) * 100;
    const boxHeight = (1 / zoom) * 100;

    // Offset is in pixels.
    // Heuristic: map image panned pixels (offset.x) to mini-map focus box position.
    // Normalized offset: 0 is center.
    const leftPos = 50 - (boxWidth / 2) - (offset.x / 10);
    const topPos = 50 - (boxHeight / 2) - (offset.y / 10);

    return (
        <div className={`relative w-28 h-28 rounded-2xl overflow-hidden border border-white/20 bg-black/60 backdrop-blur-xl shadow-2xl ${className}`}>
            <img src={imageUrl} className="w-full h-full object-cover opacity-30" alt="Minimap" />
            <div
                className="absolute border-2 border-emerald-500 bg-emerald-500/10 transition-none"
                style={{
                    width: `${boxWidth}%`,
                    height: `${boxHeight}%`,
                    left: `${leftPos}%`,
                    top: `${topPos}%`,
                }}
            />
            <div className="absolute top-2 left-3">
                <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Focus</span>
            </div>
            <div className="absolute bottom-2 right-3">
                <span className="text-[10px] font-black text-emerald-400 tabular-nums">{zoom.toFixed(1)}x</span>
            </div>
        </div>
    );
}
