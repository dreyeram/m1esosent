'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

interface InlineDropdownProps {
    value: string | string[];
    options: string[];
    onChange: (value: any) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    multiple?: boolean;
}

export default function InlineDropdown({
    value,
    options,
    onChange,
    placeholder = "Select...",
    disabled = false,
    className = "",
    multiple = false
}: InlineDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (option: string) => {
        if (multiple) {
            const current = Array.isArray(value) ? value : [];
            const next = current.includes(option)
                ? current.filter(x => x !== option)
                : [...current, option];
            onChange(next);
        } else {
            onChange(option);
            setIsOpen(false);
        }
        setSearchTerm('');
    };

    const displayValue = useMemo(() => {
        if (multiple) {
            const vals = Array.isArray(value) ? value : [];
            return vals.length > 0 ? vals.join(', ') : '';
        }
        return (value as string) || '';
    }, [value, multiple]);

    return (
        <div className={`relative inline-block w-full ${className}`}>
            {/* Trigger - Minimalist Text Style */}
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    group flex items-center justify-between w-full gap-1 py-0.5 text-[10px] font-medium transition-all
                    border-b border-transparent hover:border-zinc-300 min-h-[18px]
                    ${displayValue ? 'text-zinc-900' : 'text-zinc-300 italic'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                title={displayValue}
            >
                <span className="truncate flex-1 text-left max-w-[calc(100%-12px)]">
                    {displayValue || placeholder}
                </span>
                <ChevronDown
                    size={8}
                    className={`text-zinc-300 group-hover:text-zinc-500 transition-all shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                            className="absolute top-full left-0 mt-1 z-50 min-w-[200px] max-w-[300px] bg-white rounded-lg shadow-2xl border border-zinc-100 overflow-hidden"
                        >
                            {/* Search Input */}
                            {(options.length > 5 || multiple) && (
                                <div className="p-1.5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Filter..."
                                        className="flex-1 px-2 py-1 text-[10px] bg-white border border-zinc-200 rounded outline-none focus:border-blue-400 font-sans"
                                    />
                                    {multiple && (
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="ml-2 px-2 py-1 bg-zinc-900 text-white text-[9px] font-bold rounded hover:bg-zinc-800"
                                        >
                                            Done
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Options List */}
                            <div className="max-h-56 overflow-y-auto py-1 custom-scrollbar">
                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map((option) => {
                                        const isSelected = multiple
                                            ? (Array.isArray(value) && value.includes(option))
                                            : option === value;

                                        return (
                                            <button
                                                key={option}
                                                onClick={() => handleSelect(option)}
                                                className={`
                                                    w-full text-left px-3 py-1.5 text-[10px] transition-colors flex items-center gap-2
                                                    ${isSelected
                                                        ? 'bg-blue-50 text-blue-700 font-bold'
                                                        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                                                    }
                                                `}
                                            >
                                                <div className={`
                                                    w-2.5 h-2.5 rounded flex items-center justify-center transition-all border
                                                    ${isSelected
                                                        ? 'bg-blue-600 border-blue-600'
                                                        : 'bg-transparent border-zinc-200'
                                                    }
                                                `}>
                                                    {isSelected && <Check size={8} className="text-white" strokeWidth={4} />}
                                                </div>
                                                {option}
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="px-3 py-4 text-[10px] text-zinc-400 italic text-center">
                                        No results found
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

// Bilateral dropdown for Left/Right anatomical fields - Minimalist
interface BilateralDropdownProps {
    label: string;
    leftValue: string;
    rightValue: string;
    options: string[];
    onLeftChange: (value: string) => void;
    onRightChange: (value: string) => void;
    disabled?: boolean;
    showBoth?: boolean;
}

export function BilateralDropdown({
    label,
    leftValue,
    rightValue,
    options,
    onLeftChange,
    onRightChange,
    disabled = false,
    showBoth = true
}: BilateralDropdownProps) {
    return (
        <div className="flex items-center gap-2 py-0.5 flex-1">
            {/* Right Side */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-[7.5px] font-bold text-zinc-400 uppercase tracking-widest select-none w-[32px] shrink-0">Right</span>
                <div className="flex-1 min-w-0">
                    <InlineDropdown
                        value={rightValue}
                        options={options}
                        onChange={onRightChange}
                        disabled={disabled}
                        placeholder="Normal"
                    />
                </div>
            </div>

            {/* Left Side */}
            {showBoth && (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-[7.5px] font-bold text-zinc-400 uppercase tracking-widest select-none w-[32px] shrink-0">Left</span>
                    <div className="flex-1 min-w-0">
                        <InlineDropdown
                            value={leftValue}
                            options={options}
                            onChange={onLeftChange}
                            disabled={disabled}
                            placeholder="Normal"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
