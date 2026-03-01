"use client";

import React, { useState } from 'react';
import { useSessionStore } from '@/lib/store/session.store';
import { createProcedure } from '@/app/actions/procedure';
import { Plus, Check, Loader2, Camera, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SegmentControllerProps {
    patientId: string;
    doctorId: string;
}

export default function SegmentController({ patientId, doctorId }: SegmentControllerProps) {
    const {
        segments,
        activeSegmentIndex,
        addSegment,
        setActiveSegment
    } = useSessionStore();

    const [isCreating, setIsCreating] = useState(false);

    const handleCreateSegment = async () => {
        if (isCreating) return;
        setIsCreating(true);
        try {
            const nextIndex = segments.length + 1;
            const res = await createProcedure({
                patientId,
                doctorId,
                type: 'generic'
            });

            if (res.success && res.procedureId) {
                addSegment({
                    id: res.procedureId,
                    index: nextIndex,
                    status: 'draft',
                    createdAt: new Date(),
                    type: 'generic'
                });
            } else {
                console.error("Failed to create segment:", res.error);
                // Optionally show toast
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-2 py-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl transition-all hover:bg-black/50">
            {/* Segment List */}
            <div className="flex items-center gap-1">
                <AnimatePresence>
                    {segments.map((segment) => {
                        const isActive = activeSegmentIndex === segment.index;
                        return (
                            <motion.button
                                key={segment.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={() => setActiveSegment(segment.index)}
                                className={`
                                    relative group flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all
                                    ${isActive
                                        ? 'bg-white text-black shadow-lg shadow-white/10 scale-100'
                                        : 'bg-transparent text-white/60 hover:text-white hover:bg-white/10'
                                    }
                                `}
                            >
                                <span>P{segment.index}</span>
                                {/* Thumbnail Preview (Ghost) on Hover could go here later */}
                            </motion.button>
                        );
                    })}
                </AnimatePresence>
            </div>

            <div className="w-px h-6 bg-white/20 mx-1" />

            {/* Add Button */}
            <button
                onClick={handleCreateSegment}
                disabled={isCreating}
                className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                title="New Segment"
            >
                {isCreating ? (
                    <Loader2 size={14} className="animate-spin" />
                ) : (
                    <Plus size={16} strokeWidth={3} />
                )}
            </button>
        </div>
    );
}
