'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown,
    ChevronUp,
    Sparkles,
    Save,
    FileText,
    AlertCircle
} from 'lucide-react';
import { TagField, TextField } from './TagField';
import { BilateralDropdown } from './InlineDropdown';
import { ReportTemplate, ReportSection, ReportField, ReportData } from '@/types/reportTemplates';
import { getTemplate, getNormalValues } from '@/data/reportTemplates';

interface DynamicReportEditorProps {
    procedureType: string;
    initialData?: Partial<ReportData>;
    onSave?: (data: ReportData) => void;
    onDataChange?: (data: Record<string, any>) => void;
    readOnly?: boolean;
}

/**
 * DynamicReportEditor - Renders procedure-specific report forms dynamically
 * Based on template definitions with tag-based selection for fast reporting
 */
export function DynamicReportEditor({
    procedureType,
    initialData,
    onSave,
    onDataChange,
    readOnly = false
}: DynamicReportEditorProps) {
    const [template, setTemplate] = useState<ReportTemplate | null>(null);
    const [values, setValues] = useState<Record<string, any>>({});
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
    const [hasChanges, setHasChanges] = useState(false);

    // Load template on mount or when procedureType changes
    useEffect(() => {
        const loadedTemplate = getTemplate(procedureType);
        setTemplate(loadedTemplate);

        if (loadedTemplate && initialData?.values) {
            setValues(initialData.values);
        } else {
            setValues({});
        }

        // Initialize collapsed state for collapsible sections
        if (loadedTemplate) {
            const collapsed = new Set<string>();
            loadedTemplate.sections.forEach(section => {
                if (section.defaultCollapsed) {
                    collapsed.add(section.id);
                }
            });
            setCollapsedSections(collapsed);
        }
    }, [procedureType, initialData]);

    // Notify parent of changes
    useEffect(() => {
        if (onDataChange) {
            onDataChange(values);
        }
        if (Object.keys(values).length > 0) {
            setHasChanges(true);
        }
    }, [values, onDataChange]);

    // Update a field value
    const updateValue = useCallback((fieldId: string, value: any) => {
        setValues(prev => ({
            ...prev,
            [fieldId]: value
        }));
    }, []);

    // Toggle section collapse
    const toggleSection = (sectionId: string) => {
        setCollapsedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    // Apply normal findings macro
    const applyNormalMacro = () => {
        const normalValues = getNormalValues(procedureType);
        if (normalValues) {
            setValues(prev => ({
                ...prev,
                ...normalValues
            }));
        }
    };

    // Save report
    const handleSave = () => {
        if (!template || !onSave) return;

        const reportData: ReportData = {
            templateId: template.id,
            values,
            images: [],
            impression: values.impression || '',
            plan: Array.isArray(values.plan) ? values.plan : [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        onSave(reportData);
        setHasChanges(false);
    };

    // Render a single field
    const renderField = (field: ReportField) => {
        const value = values[field.id] ?? field.defaultValue ?? (field.type === 'multiselect' ? [] : '');

        // Check conditional display
        if (field.showIf) {
            const conditionValue = values[field.showIf.fieldId];
            const requiredValues = Array.isArray(field.showIf.value) ? field.showIf.value : [field.showIf.value];
            if (!requiredValues.includes(conditionValue)) {
                return null;
            }
        }

        switch (field.type) {
            case 'select':
            case 'multiselect':
                return (
                    <TagField
                        key={field.id}
                        label={field.label}
                        type={field.type}
                        options={field.options || []}
                        value={value}
                        onChange={(v) => updateValue(field.id, v)}
                        width={field.width}
                        placeholder={field.placeholder}
                        required={field.required}
                    />
                );

            case 'text':
            case 'textarea':
            case 'number':
                return (
                    <TextField
                        key={field.id}
                        label={field.label}
                        type={field.type}
                        value={String(value)}
                        onChange={(v) => updateValue(field.id, v)}
                        width={field.width}
                        placeholder={field.placeholder}
                        required={field.required}
                    />
                );

            case 'radio':
                return (
                    <div key={field.id} className={`${field.width === 'full' ? 'w-full' : field.width === 'half' ? 'w-1/2' : 'w-1/3'}`}>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{field.label}</label>
                        <div className="flex flex-wrap gap-2">
                            {field.options?.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => updateValue(field.id, opt)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${value === opt
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'bilateral':
                return (
                    <div key={field.id} className="w-full">
                        <BilateralDropdown
                            label={field.label}
                            rightValue={value?.right || ''}
                            leftValue={value?.left || ''}
                            options={field.options || []}
                            onRightChange={(v) => updateValue(field.id, { ...value, right: v })}
                            onLeftChange={(v) => updateValue(field.id, { ...value, left: v })}
                            showBoth={true}
                        />
                    </div>
                );

            case 'checkbox':
                return (
                    <div key={field.id} className={`flex items-center gap-3 ${field.width === 'full' ? 'w-full' : field.width === 'half' ? 'w-1/2' : 'w-1/3'}`}>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={Boolean(value)}
                                onChange={(e) => updateValue(field.id, e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-slate-700">{field.label}</span>
                        </label>
                    </div>
                );

            default:
                return null;
        }
    };

    // Render a section
    const renderSection = (section: ReportSection) => {
        const isCollapsed = collapsedSections.has(section.id);
        const canCollapse = section.collapsible !== false;

        return (
            <motion.div
                key={section.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
            >
                {/* Section Header */}
                <div
                    onClick={() => canCollapse && toggleSection(section.id)}
                    className={`
            flex items-center justify-between px-5 py-4 
            bg-gradient-to-r from-slate-50 to-white
            ${canCollapse ? 'cursor-pointer hover:from-slate-100' : ''}
            transition-colors
          `}
                >
                    <div className="flex items-center gap-3">
                        {section.icon && <span className="text-lg">{section.icon}</span>}
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                            {section.title}
                        </h3>
                    </div>
                    {canCollapse && (
                        <motion.div
                            animate={{ rotate: isCollapsed ? 0 : 180 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronUp size={18} className="text-slate-400" />
                        </motion.div>
                    )}
                </div>

                {/* Section Content */}
                <AnimatePresence initial={false}>
                    {!isCollapsed && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="px-5 py-4 flex flex-wrap gap-3 border-t border-slate-100">
                                {section.fields.map(field => renderField(field))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    // No template found
    if (!template) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle size={48} className="text-amber-500 mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2">No Template Found</h3>
                <p className="text-sm text-slate-500 max-w-md">
                    No report template found for procedure type: <code className="bg-slate-100 px-2 py-0.5 rounded">{procedureType}</code>
                </p>
                <p className="text-xs text-slate-400 mt-2">
                    Using default report format instead.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with Template Info & Actions */}
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl px-5 py-4 border border-blue-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">{template.name}</h2>
                        <p className="text-xs text-slate-500">{template.sections.length} sections • {template.specialty}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Normal Macro Button */}
                    <button
                        onClick={applyNormalMacro}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-500/30 transition-all active:scale-95"
                    >
                        <Sparkles size={14} />
                        {template.normalMacroLabel || 'Normal'}
                    </button>

                    {/* Save Button */}
                    {onSave && (
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges}
                            className={`
                flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95
                ${hasChanges
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                }
              `}
                        >
                            <Save size={14} />
                            Save Report
                        </button>
                    )}
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-3">
                {template.sections.map(section => renderSection(section))}
            </div>
        </div>
    );
}

export default DynamicReportEditor;
