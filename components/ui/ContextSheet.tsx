"use client";

import React, { useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion"; // Performance Optimization
import { X } from "lucide-react";

interface ContextSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export function ContextSheet({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
}: ContextSheetProps) {
    // Prevent scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop - Subtle Dimming */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-[100] transition-opacity duration-200"
            />

            {/* Sheet - Floating Glass */}
            <div
                className="fixed right-4 top-4 bottom-4 w-full max-w-xl glass-floating z-[101] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
            >
                {/* Edge highlight */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/40" />

                {/* Header */}
                <div className="px-10 pt-12 pb-8 shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-3 rounded-full hover:bg-slate-100/50 transition-all text-slate-400 hover:text-slate-900 active:scale-90"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    {description && (
                        <p className="text-sm text-slate-500 font-semibold tracking-wide">
                            {description}
                        </p>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-10 pb-12 scrollbar-hide">
                    <div>
                        {children}
                    </div>
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-10 py-8 bg-slate-50/30 backdrop-blur-md border-t border-white/20 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </>
    );
}

export default ContextSheet;
