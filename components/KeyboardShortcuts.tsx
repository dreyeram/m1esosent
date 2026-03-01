"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X, Command } from "lucide-react";

interface KeyboardShortcutsProps {
    isOpen: boolean;
    onClose: () => void;
}

const SHORTCUT_GROUPS = [
    {
        title: "Navigation",
        shortcuts: [
            { keys: ["Ctrl", ","], description: "Open Settings" },
            { keys: ["Ctrl", "K"], description: "Quick Search" },
            { keys: ["Ctrl", "/"], description: "Show Shortcuts" },
            { keys: ["Esc"], description: "Close Modal / Go Back" },
        ],
    },
    {
        title: "Patient Management",
        shortcuts: [
            { keys: ["Ctrl", "N"], description: "New Patient" },
            { keys: ["Ctrl", "F"], description: "Search Patients" },
        ],
    },
    {
        title: "Procedure Mode",
        shortcuts: [
            { keys: ["Space"], description: "Capture Image" },
            { keys: ["R"], description: "Toggle Recording" },
            { keys: ["G"], description: "Open Gallery" },
            { keys: ["Right Click"], description: "Quick Capture" },
            { keys: ["Esc"], description: "Exit Procedure" },
        ],
    },
    {
        title: "Reports",
        shortcuts: [
            { keys: ["Ctrl", "S"], description: "Save Report" },
            { keys: ["Ctrl", "P"], description: "Print Report" },
            { keys: ["Ctrl", "D"], description: "Download PDF" },
        ],
    },
];

export default function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
    // Close on Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                                    <Keyboard size={20} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-900">Keyboard Shortcuts</h2>
                                    <p className="text-xs text-slate-500">Quick actions to boost your workflow</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-white text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid gap-6">
                                {SHORTCUT_GROUPS.map((group, groupIndex) => (
                                    <div key={group.title}>
                                        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-3">
                                            {group.title}
                                        </h3>
                                        <div className="bg-slate-50 rounded-xl divide-y divide-slate-100 overflow-hidden">
                                            {group.shortcuts.map((shortcut, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between px-4 py-3"
                                                >
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {shortcut.description}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        {shortcut.keys.map((key, keyIndex) => (
                                                            <React.Fragment key={keyIndex}>
                                                                <kbd className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm min-w-[28px] text-center">
                                                                    {key === "Ctrl" ? (
                                                                        <Command size={12} className="inline" />
                                                                    ) : (
                                                                        key
                                                                    )}
                                                                </kbd>
                                                                {keyIndex < shortcut.keys.length - 1 && (
                                                                    <span className="text-slate-300 text-xs">+</span>
                                                                )}
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-center">
                            <p className="text-[10px] text-slate-400">
                                Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold">/</kbd> to toggle this menu
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Hook to use keyboard shortcuts globally
export function useGlobalShortcuts(onOpenShortcuts: () => void, onOpenSettings?: () => void) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl + / - Show shortcuts
            if (e.ctrlKey && e.key === "/") {
                e.preventDefault();
                onOpenShortcuts();
            }
            // Ctrl + , - Open settings
            if (e.ctrlKey && e.key === ",") {
                e.preventDefault();
                onOpenSettings?.();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onOpenShortcuts, onOpenSettings]);
}
