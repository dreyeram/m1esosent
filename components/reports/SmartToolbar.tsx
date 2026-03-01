'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Wand2,
    Save,
    Download,
    Check,
    FileText,
    Printer,
    Mail,
    MessageCircle,
    ChevronDown,
    RefreshCw
} from 'lucide-react';

interface TemplateOption {
    id: string;
    name: string;
    shortName?: string;
}

interface SmartToolbarProps {
    onBack: () => void;
    onNormalMacro: () => void;
    onSave: () => void;
    onDownload: () => void;
    onFinalize: () => void;
    reportTitle?: string;
    isSaving?: boolean;
    isFinalized?: boolean;
    // Template switching props
    currentProcedureType?: string;
    availableTemplates?: TemplateOption[];
    onTemplateChange?: (newType: string) => void;
}

export default function SmartToolbar({
    onBack,
    onNormalMacro,
    onSave,
    onDownload,
    onFinalize,
    reportTitle = "Report Editor",
    isSaving = false,
    isFinalized = false,
    currentProcedureType,
    availableTemplates = [],
    onTemplateChange
}: SmartToolbarProps) {
    const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

    const currentTemplate = availableTemplates.find(t =>
        t.id === currentProcedureType ||
        currentProcedureType?.includes(t.id)
    );

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-0 left-0 right-0 z-50 h-16 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl"
        >
            <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
                {/* Left Section - Back & Title */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-105"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <FileText size={16} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white">{reportTitle}</h1>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                                {isFinalized ? '✓ Finalized' : 'Editing'}
                            </p>
                        </div>
                    </div>

                    {/* Template Dropdown */}
                    {availableTemplates.length > 0 && onTemplateChange && !isFinalized && (
                        <div className="relative ml-2">
                            <button
                                onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                                className="flex items-center gap-2 h-9 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white text-xs font-medium transition-all"
                            >
                                <RefreshCw size={14} className="text-blue-400" />
                                <span className="max-w-[120px] truncate">
                                    {currentTemplate?.shortName || currentTemplate?.name || 'Change Template'}
                                </span>
                                <ChevronDown size={14} className={`transition-transform ${showTemplateDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {showTemplateDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50"
                                    >
                                        <div className="px-3 py-2 border-b border-slate-800">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Report Template</span>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {availableTemplates.map(template => (
                                                <button
                                                    key={template.id}
                                                    onClick={() => {
                                                        onTemplateChange(template.id);
                                                        setShowTemplateDropdown(false);
                                                    }}
                                                    className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-slate-800 border-b border-slate-800/50 last:border-0 ${(currentProcedureType === template.id || currentProcedureType?.includes(template.id))
                                                            ? 'bg-blue-600/20 text-blue-400'
                                                            : 'text-slate-300'
                                                        }`}
                                                >
                                                    {template.name}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Backdrop to close dropdown */}
                            {showTemplateDropdown && (
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowTemplateDropdown(false)}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Center Section - Quick Actions */}
                <div className="flex items-center gap-2">
                    {/* Normal Macro Button - Highlighted */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onNormalMacro}
                        disabled={isFinalized}
                        className="h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Wand2 size={16} />
                        <span className="hidden sm:inline">Auto-Fill Normal</span>
                        <span className="sm:hidden">Normal</span>
                    </motion.button>

                    <div className="w-px h-6 bg-slate-700 mx-2" />

                    {/* Save Draft */}
                    <button
                        onClick={onSave}
                        disabled={isFinalized || isSaving}
                        className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        <span className="hidden sm:inline">Save Draft</span>
                    </button>

                    {/* Download PDF */}
                    <button
                        onClick={onDownload}
                        className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-sm flex items-center gap-2 transition-all"
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">Download PDF</span>
                    </button>
                </div>

                {/* Right Section - Finalize */}
                <div className="flex items-center gap-3">
                    {isFinalized ? (
                        <>
                            <button className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white font-medium text-sm flex items-center gap-2 transition-all">
                                <Printer size={16} />
                                <span className="hidden sm:inline">Print</span>
                            </button>
                            <button className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white font-medium text-sm flex items-center gap-2 transition-all">
                                <Mail size={16} />
                                <span className="hidden sm:inline">Email</span>
                            </button>
                            <button className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-green-600 text-slate-300 hover:text-white font-medium text-sm flex items-center gap-2 transition-all">
                                <MessageCircle size={16} />
                                <span className="hidden sm:inline">WhatsApp</span>
                            </button>
                        </>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onFinalize}
                            className="h-10 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
                        >
                            <Check size={18} />
                            <span>Finalize</span>
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
