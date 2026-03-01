'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface TagFieldProps {
    label: string;
    type: 'select' | 'multiselect';
    options: string[];
    value: string | string[];
    onChange: (value: string | string[]) => void;
    width?: 'full' | 'half' | 'third' | 'quarter';
    placeholder?: string;
    required?: boolean;
}

/**
 * TagField - Clickable tag-based field for easy selection
 * Supports single select (dropdown style) and multi-select (tags)
 */
export function TagField({
    label,
    type,
    options,
    value,
    onChange,
    width = 'full',
    placeholder,
    required
}: TagFieldProps) {
    const widthClass = {
        full: 'w-full',
        half: 'w-full md:w-[calc(50%-0.5rem)]',
        third: 'w-full md:w-[calc(33.333%-0.5rem)]',
        quarter: 'w-full md:w-[calc(25%-0.5rem)]'
    }[width];

    const isSelected = (option: string): boolean => {
        if (type === 'multiselect') {
            return Array.isArray(value) && value.includes(option);
        }
        return value === option;
    };

    const handleSelect = (option: string) => {
        if (type === 'multiselect') {
            const currentValues = Array.isArray(value) ? value : [];
            if (currentValues.includes(option)) {
                // Remove
                onChange(currentValues.filter(v => v !== option));
            } else {
                // Add
                onChange([...currentValues, option]);
            }
        } else {
            // Single select - toggle or set
            if (value === option) {
                onChange('');
            } else {
                onChange(option);
            }
        }
    };

    const clearAll = () => {
        onChange(type === 'multiselect' ? [] : '');
    };

    const hasValue = type === 'multiselect'
        ? Array.isArray(value) && value.length > 0
        : Boolean(value);

    return (
        <div className={`${widthClass} space-y-2`}>
            {/* Label */}
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {label}
                    {required && <span className="text-rose-500 ml-1">*</span>}
                </label>
                {hasValue && (
                    <button
                        onClick={clearAll}
                        className="text-[10px] text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
                    >
                        <X size={10} /> Clear
                    </button>
                )}
            </div>

            {/* Tags Container */}
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50/80 rounded-xl border border-slate-200/80 min-h-[44px]">
                <AnimatePresence mode="popLayout">
                    {options.map((option) => {
                        const selected = isSelected(option);
                        return (
                            <motion.button
                                key={option}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.15 }}
                                onClick={() => handleSelect(option)}
                                className={`
                  px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                  flex items-center gap-1.5
                  ${selected
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-300'
                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:border-blue-300'
                                    }
                `}
                            >
                                {selected && <Check size={12} strokeWidth={3} />}
                                {option}
                            </motion.button>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Selected Summary for MultiSelect */}
            {type === 'multiselect' && Array.isArray(value) && value.length > 0 && (
                <div className="text-[10px] text-slate-400 font-medium">
                    {value.length} selected
                </div>
            )}
        </div>
    );
}

/**
 * TextField - Simple text input styled consistently
 */
interface TextFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: 'text' | 'textarea' | 'number';
    width?: 'full' | 'half' | 'third' | 'quarter';
    placeholder?: string;
    required?: boolean;
}

export function TextField({
    label,
    value,
    onChange,
    type = 'text',
    width = 'full',
    placeholder,
    required
}: TextFieldProps) {
    const widthClass = {
        full: 'w-full',
        half: 'w-full md:w-[calc(50%-0.5rem)]',
        third: 'w-full md:w-[calc(33.333%-0.5rem)]',
        quarter: 'w-full md:w-[calc(25%-0.5rem)]'
    }[width];

    const inputClass = `
    w-full bg-white border border-slate-200 rounded-xl px-4 py-3
    text-sm font-medium text-slate-700 placeholder:text-slate-400
    focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
    transition-all
  `;

    return (
        <div className={`${widthClass} space-y-2`}>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {label}
                {required && <span className="text-rose-500 ml-1">*</span>}
            </label>

            {type === 'textarea' ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={3}
                    className={inputClass + ' resize-none'}
                />
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={inputClass}
                />
            )}
        </div>
    );
}

export default TagField;
