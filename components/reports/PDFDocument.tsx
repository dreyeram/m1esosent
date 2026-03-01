'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, User, Phone, Mail, Calendar, FileText, Check, X } from 'lucide-react';
import InlineDropdown, { BilateralDropdown } from './InlineDropdown';
import { resolveImageUrl } from '@/lib/utils/image';

interface PDFDocumentProps {
    // Patient & Hospital Data
    patient: {
        name: string;
        age?: number;
        gender?: string;
        mrn?: string;
        procedureType?: string;
    };
    hospital?: {
        name?: string;
        address?: string;
        mobile?: string;
        email?: string;
        logoPath?: string;
    };
    doctor?: {
        fullName?: string;
        specialty?: string;
        signaturePath?: string;
    };
    procedureDate?: string;
    referredBy?: string;
    onReferredByChange?: (value: string) => void;

    // Report Data
    reportTitle: string;
    reportData: Record<string, any>;
    onFieldChange: (fieldId: string, value: any) => void;

    // Sections configuration
    sections: {
        id: string;
        title: string;
        type: 'indication' | 'equipment' | 'findings' | 'bilateral' | 'impression' | 'plan' | 'custom';
        fields: {
            id: string;
            label: string;
            type: 'text' | 'textarea' | 'select' | 'bilateral' | 'checkbox' | 'multiselect';
            options?: string[];
            placeholder?: string;
            showBoth?: boolean; // For bilateral fields
        }[];
    }[];

    // State
    isFinalized?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Multi-Select Chip Component
// ═══════════════════════════════════════════════════════════════
const MultiSelectField = ({
    value,
    options,
    onChange,
    placeholder,
    disabled
}: {
    value: string[];
    options: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (opt: string) => {
        if (disabled) return;
        const current = value || [];
        if (current.includes(opt)) {
            onChange(current.filter(v => v !== opt));
        } else {
            onChange([...current, opt]);
        }
    };

    const formatSelectedText = () => {
        if (!value || value.length === 0) return null;
        if (value.length === 1) return value[0];
        if (value.length === 2) return `${value[0]} and ${value[1]}`;
        return value.slice(0, -1).join(', ') + ', and ' + value[value.length - 1];
    };

    return (
        <div className="relative">
            {/* Display selected as prose */}
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`min-h-[36px] px-3 py-2 rounded-lg border-2 ${isOpen
                    ? 'border-blue-400 bg-blue-50'
                    : value?.length
                        ? 'border-slate-200 bg-white hover:border-blue-300'
                        : 'border-slate-200 bg-slate-50 hover:border-blue-300'
                    } cursor-pointer transition-all`}
            >
                {value?.length ? (
                    <p className="text-sm text-slate-800">
                        <span className="font-medium">• </span>
                        {formatSelectedText()}
                    </p>
                ) : (
                    <p className="text-sm text-slate-400 italic">{placeholder || 'Click to select...'}</p>
                )}
            </div>

            {/* Dropdown options */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-full left-0 right-0 mt-1 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-64 overflow-y-auto"
                    >
                        <div className="p-2 border-b border-slate-100 bg-slate-50">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                Select all that apply ({value?.length || 0} selected)
                            </p>
                        </div>
                        {options.map(opt => {
                            const isSelected = value?.includes(opt);
                            return (
                                <button
                                    key={opt}
                                    onClick={() => toggleOption(opt)}
                                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${isSelected
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 ${isSelected
                                        ? 'bg-blue-500 border-blue-500'
                                        : 'border-slate-300'
                                        }`}>
                                        {isSelected && <Check size={12} className="text-white" />}
                                    </div>
                                    <span className={isSelected ? 'font-medium' : ''}>{opt}</span>
                                </button>
                            );
                        })}
                    </motion.div>
                </>
            )}
        </div>
    );
};

export default function PDFDocument({
    patient,
    hospital,
    doctor,
    procedureDate,
    referredBy = '',
    onReferredByChange,
    reportTitle,
    reportData,
    onFieldChange,
    sections,
    isFinalized = false
}: PDFDocumentProps) {
    // Inline editable text component
    const EditableText = ({
        value,
        onChange,
        placeholder = "Click to edit...",
        className = "",
        multiline = false
    }: {
        value: string;
        onChange: (v: string) => void;
        placeholder?: string;
        className?: string;
        multiline?: boolean;
    }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [localValue, setLocalValue] = useState(value);

        const handleBlur = () => {
            setIsEditing(false);
            onChange(localValue);
        };

        if (isFinalized) {
            return <span className={className}>{value || <span className="text-slate-300 italic">{placeholder}</span>}</span>;
        }

        if (isEditing) {
            if (multiline) {
                return (
                    <textarea
                        autoFocus
                        value={localValue}
                        onChange={(e) => setLocalValue(e.target.value)}
                        onBlur={handleBlur}
                        placeholder={placeholder}
                        className={`w-full min-h-[100px] bg-blue-50 border-2 border-blue-400 rounded-lg p-3 outline-none text-slate-800 text-sm leading-relaxed ${className}`}
                    />
                );
            }
            return (
                <input
                    autoFocus
                    type="text"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
                    placeholder={placeholder}
                    className={`bg-blue-50 border-b-2 border-blue-400 outline-none px-1 ${className}`}
                />
            );
        }

        return (
            <span
                onClick={() => { setIsEditing(true); setLocalValue(value); }}
                className={`cursor-text hover:bg-blue-50 rounded px-1 py-0.5 transition-colors border-b border-transparent hover:border-blue-300 ${className}`}
            >
                {value || <span className="text-slate-300 italic">{placeholder}</span>}
            </span>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white shadow-2xl rounded-lg overflow-hidden border border-slate-200"
            style={{ minHeight: '297mm' }}
        >
            {/* ═══════════════════════════════════════════════════════════════
                LETTERHEAD HEADER
            ═══════════════════════════════════════════════════════════════ */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white px-8 py-6">
                <div className="flex items-center gap-6">
                    {/* Logo */}
                    {hospital?.logoPath ? (
                        <img
                            src={hospital.logoPath}
                            alt="Logo"
                            className="h-16 w-auto rounded-lg bg-white/90 p-1.5"
                        />
                    ) : (
                        <div className="h-16 w-20 bg-white/20 rounded-lg flex items-center justify-center border-2 border-white/30">
                            <Building2 size={24} className="text-white/60" />
                        </div>
                    )}

                    {/* Hospital Info */}
                    <div className="flex-1 text-center">
                        <h1 className="text-2xl font-bold tracking-wide uppercase">
                            {hospital?.name || "Hospital Name"}
                        </h1>
                        {doctor?.specialty && (
                            <p className="text-blue-200 text-sm mt-1">
                                Department of {doctor.specialty}
                            </p>
                        )}
                        {hospital?.address && (
                            <p className="text-blue-100/80 text-xs mt-1">{hospital.address}</p>
                        )}
                        <div className="flex items-center justify-center gap-4 text-blue-200/80 text-xs mt-2">
                            {hospital?.mobile && (
                                <span className="flex items-center gap-1">
                                    <Phone size={10} /> {hospital.mobile}
                                </span>
                            )}
                            {hospital?.email && (
                                <span className="flex items-center gap-1">
                                    <Mail size={10} /> {hospital.email}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Spacer for balance */}
                    <div className="w-20" />
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                PATIENT INFO BAR
            ═══════════════════════════════════════════════════════════════ */}
            <div className="mx-6 mt-5 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400" />
                        <span className="text-slate-500">Patient Name:</span>
                        <span className="font-bold text-slate-900">{patient.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FileText size={14} className="text-slate-400" />
                        <span className="text-slate-500">MRN:</span>
                        <span className="font-bold text-slate-900">{patient.mrn || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 ml-5">Age/Sex:</span>
                        <span className="text-slate-800">{patient.age || '—'} / {patient.gender || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-slate-500">Procedure Date:</span>
                        <span className="font-bold text-slate-900">{procedureDate || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 ml-5">Referring Doctor:</span>
                        <EditableText
                            value={referredBy}
                            onChange={(v) => onReferredByChange?.(v)}
                            placeholder="Enter name..."
                            className="text-slate-800"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 ml-5">Physician:</span>
                        <span className="font-bold text-slate-900">
                            {doctor?.fullName || 'Dr. Name'}
                            {doctor?.specialty && (
                                <span className="font-normal text-slate-500">, {doctor.specialty}</span>
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                REPORT TITLE
            ═══════════════════════════════════════════════════════════════ */}
            <div className="mx-6 mt-6">
                <h2 className="text-xl font-bold text-blue-900 border-b-3 border-blue-900 pb-2 inline-block uppercase tracking-wide">
                    {reportTitle}
                </h2>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                DYNAMIC SECTIONS
            ═══════════════════════════════════════════════════════════════ */}
            <div className="px-6 py-4 space-y-6">
                {sections.map((section) => (
                    <div key={section.id} className="space-y-3">
                        {/* Section Header */}
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1">
                            {section.title}
                        </h3>

                        {/* Section Content */}
                        <div className="space-y-1">
                            {section.type === 'bilateral' ? (
                                // Bilateral Table Header
                                <>
                                    <div className="grid grid-cols-[1fr_100px_100px] gap-2 text-xs font-bold text-slate-400 uppercase pb-1 border-b border-slate-100">
                                        <span>Structure</span>
                                        <span className="text-center">Right</span>
                                        <span className="text-center">Left</span>
                                    </div>
                                    {section.fields.map((field) => (
                                        <BilateralDropdown
                                            key={field.id}
                                            label={field.label}
                                            rightValue={reportData[`${field.id}_right`] || ''}
                                            leftValue={reportData[`${field.id}_left`] || ''}
                                            options={field.options || []}
                                            onRightChange={(v) => onFieldChange(`${field.id}_right`, v)}
                                            onLeftChange={(v) => onFieldChange(`${field.id}_left`, v)}
                                            disabled={isFinalized}
                                            showBoth={field.showBoth !== false}
                                        />
                                    ))}
                                </>
                            ) : (
                                // Regular Fields
                                section.fields.map((field) => (
                                    <div
                                        key={field.id}
                                        className="py-2"
                                    >
                                        <div className="flex items-start gap-4">
                                            <span className="text-sm font-medium text-slate-500 w-40 flex-shrink-0 pt-1">
                                                {field.label}:
                                            </span>

                                            <div className="flex-1">
                                                {field.type === 'multiselect' ? (
                                                    <MultiSelectField
                                                        value={reportData[field.id] || []}
                                                        options={field.options || []}
                                                        onChange={(v) => onFieldChange(field.id, v)}
                                                        placeholder={field.placeholder}
                                                        disabled={isFinalized}
                                                    />
                                                ) : field.type === 'select' ? (
                                                    <InlineDropdown
                                                        value={reportData[field.id] || ''}
                                                        options={field.options || []}
                                                        onChange={(v) => onFieldChange(field.id, v)}
                                                        disabled={isFinalized}
                                                        placeholder={field.placeholder || 'Select...'}
                                                    />
                                                ) : field.type === 'textarea' ? (
                                                    <EditableText
                                                        value={reportData[field.id] || ''}
                                                        onChange={(v) => onFieldChange(field.id, v)}
                                                        placeholder={field.placeholder || 'Click to enter...'}
                                                        className="flex-1 text-slate-800"
                                                        multiline
                                                    />
                                                ) : (
                                                    <EditableText
                                                        value={reportData[field.id] || ''}
                                                        onChange={(v) => onFieldChange(field.id, v)}
                                                        placeholder={field.placeholder || 'Click to enter...'}
                                                        className="text-slate-800"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                FOOTER
            ═══════════════════════════════════════════════════════════════ */}
            <div className="mt-auto px-6 py-6 border-t border-slate-200 flex justify-between items-end">
                <div className="text-xs text-slate-400">
                    Generated by LoyalMed Suite
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-3">
                        {(() => {
                            const resolvedSig = doctor?.signaturePath ? resolveImageUrl(doctor.signaturePath) : null;
                            return resolvedSig ? (
                                <img
                                    src={resolvedSig}
                                    alt="Signature"
                                    className="h-10 w-auto opacity-80"
                                />
                            ) : null;
                        })()}
                        <div>
                            <p className="font-bold text-slate-900">{doctor?.fullName || 'Doctor Name'}</p>
                            <p className="text-xs text-slate-500">{doctor?.specialty || 'Specialist'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
