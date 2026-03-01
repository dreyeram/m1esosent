"use client";
import { motion, AnimatePresence } from "framer-motion";

import React, { useState, useEffect } from "react";
import { MessageCircle, Mail, Plus, Trash2, Save, Check, AlertCircle, Loader2, Edit2, Star, X } from "lucide-react";
import { getMessageTemplates, saveMessageTemplate } from "@/app/actions/communication";

interface Template {
    id: string;
    name: string;
    channel: string;
    subject?: string | null;
    body: string;
    isDefault: boolean;
    createdAt: string;
}

interface MessageTemplatesPanelProps {
    organization: { id: string };
    onUpdate: () => void;
    onUnsavedChange: (hasChanges: boolean) => void;
}

export default function MessageTemplatesPanel({ organization, onUpdate, onUnsavedChange }: MessageTemplatesPanelProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Editor state
    const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);
    const [activeChannel, setActiveChannel] = useState<"whatsapp" | "email">("whatsapp");

    async function loadTemplates() {
        setLoading(true);
        const result = await getMessageTemplates();
        if (result.success) {
            setTemplates(result.templates);
        }
        setLoading(false);
    }

    useEffect(() => {
        loadTemplates();
    }, []);

    function startNewTemplate() {
        setEditingTemplate({
            name: "",
            channel: activeChannel,
            subject: activeChannel === "email" ? "" : undefined,
            body: activeChannel === "whatsapp"
                ? "Hello! Your medical report is ready.\n\n{{link}}\n\nThis link expires in 7 days."
                : "Dear {{patientName}},\n\nYour medical report is now available. Click below to view:\n\n{{link}}\n\nBest regards,\n{{doctorName}}",
            isDefault: false
        });
    }

    function editTemplate(template: Template) {
        setEditingTemplate({ ...template });
    }

    async function handleSave() {
        if (!editingTemplate?.name?.trim() || !editingTemplate?.body?.trim()) {
            setError("Please fill in template name and body");
            return;
        }

        setSaving(true);
        setError("");

        const result = await saveMessageTemplate({
            id: editingTemplate.id,
            name: editingTemplate.name!,
            channel: editingTemplate.channel || activeChannel,
            subject: editingTemplate.subject || undefined,
            body: editingTemplate.body!,
            isDefault: editingTemplate.isDefault || false
        });

        setSaving(false);

        if (result.success) {
            setSuccess("Template saved!");
            setEditingTemplate(null);
            loadTemplates();
            setTimeout(() => setSuccess(""), 3000);
        } else {
            setError(result.error || "Failed to save template");
        }
    }

    function cancelEdit() {
        setEditingTemplate(null);
    }

    const filteredTemplates = templates.filter(t => t.channel === activeChannel);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 p-2">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-indigo-100 rounded-[1.5rem] text-indigo-600 shadow-inner">
                        <MessageCircle size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Message Templates</h2>
                        <p className="text-slate-500 text-xs font-medium mt-1 uppercase tracking-wider">Communication Customization</p>
                    </div>
                </div>
            </div>

            {/* Channel Tabs */}
            <div className="flex gap-4 p-1.5 bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl shadow-lg shadow-slate-200/40 w-fit">
                <button
                    onClick={() => { setActiveChannel("whatsapp"); setEditingTemplate(null); }}
                    className={`px-8 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all flex items-center gap-3 ${activeChannel === "whatsapp"
                        ? 'bg-white text-emerald-700 shadow-md ring-1 ring-black/5'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                </button>
                <button
                    onClick={() => { setActiveChannel("email"); setEditingTemplate(null); }}
                    className={`px-8 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all flex items-center gap-3 ${activeChannel === "email"
                        ? 'bg-white text-indigo-700 shadow-md ring-1 ring-black/5'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Mail className="w-4 h-4" />
                    Email
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Templates List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/40 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/60 transition-all">
                        <div className="px-8 py-6 border-b border-white/50 bg-white/30 flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Saved Templates
                            </h4>
                            {!editingTemplate && (
                                <button
                                    onClick={startNewTemplate}
                                    className="p-2 bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl transition-all shadow-sm active:scale-95"
                                >
                                    <Plus size={20} className="stroke-[2.5]" />
                                </button>
                            )}
                        </div>

                        <div className="max-h-[500px] overflow-auto divide-y divide-white/50">
                            {loading ? (
                                <div className="p-12 text-center">
                                    <Loader2 size={32} className="animate-spin mx-auto text-indigo-400 mb-4" />
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Syncing Templates</p>
                                </div>
                            ) : filteredTemplates.length === 0 ? (
                                <div className="p-12 text-center">
                                    <MessageCircle size={40} className="mx-auto mb-4 opacity-20 text-slate-400" />
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">No content found</p>
                                    <button
                                        onClick={startNewTemplate}
                                        className="text-xs font-semibold text-indigo-600 uppercase tracking-wider hover:underline"
                                    >
                                        Create First Template
                                    </button>
                                </div>
                            ) : (
                                filteredTemplates.map((template) => (
                                    <div
                                        key={template.id}
                                        onClick={() => editTemplate(template)}
                                        className={`p-6 cursor-pointer transition-all duration-300 group ${editingTemplate?.id === template.id ? 'bg-indigo-50/50 ring-2 ring-indigo-500/20 inset-shadow-sm' : 'hover:bg-white/50'}`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h5 className="font-semibold text-slate-800 tracking-tight truncate">
                                                        {template.name}
                                                    </h5>
                                                    {template.isDefault && (
                                                        <span className="flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-200">
                                                            <Star size={8} fill="currentColor" />
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-medium text-slate-500 line-clamp-2 leading-relaxed italic">
                                                    "{template.body}"
                                                </p>
                                            </div>
                                            <Edit2 size={16} className={`shrink-0 transition-all ${editingTemplate?.id === template.id ? 'text-indigo-600 scale-110' : 'text-slate-300 group-hover:text-slate-500 group-hover:scale-110'}`} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        {editingTemplate ? (
                            <motion.div
                                key="editor"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-white/40 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/60 sticky top-8"
                            >
                                <div className="flex items-center justify-between mb-10">
                                    <h4 className="text-lg font-semibold text-slate-800 tracking-tight">
                                        {editingTemplate.id ? "Refine Template" : "New Template Definition"}
                                    </h4>
                                    <button
                                        onClick={cancelEdit}
                                        className="p-2 hover:bg-white/50 rounded-xl transition-all text-slate-400 hover:text-slate-600"
                                    >
                                        <X size={20} className="stroke-[2.5]" />
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 ml-2">
                                            Definition Name
                                        </label>
                                        <input
                                            value={editingTemplate.name || ""}
                                            onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                            className="w-full bg-white/50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-semibold text-sm"
                                            placeholder="e.g. Report Share - Friendly"
                                        />
                                    </div>

                                    {activeChannel === "email" && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 ml-2">
                                                Transmission Subject
                                            </label>
                                            <input
                                                value={editingTemplate.subject || ""}
                                                onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                                className="w-full bg-white/50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-semibold text-sm"
                                                placeholder="Your Medical Report is Ready"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 ml-2">
                                            Content Schema
                                        </label>
                                        <textarea
                                            value={editingTemplate.body || ""}
                                            onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                                            rows={8}
                                            className="w-full bg-white/50 border border-slate-100 rounded-3xl px-6 py-4 text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-medium text-sm leading-relaxed outline-none resize-none"
                                            placeholder="Structure your template content here..."
                                        />
                                        <div className="flex flex-wrap items-center gap-2 mt-4 ml-1">
                                            {["{{link}}", "{{patientName}}", "{{doctorName}}"].map((tag) => (
                                                <code key={tag} className="px-3 py-1 bg-white/60 border border-slate-100 rounded-lg text-xs font-semibold text-indigo-500 cursor-default hover:bg-white hover:shadow-sm transition-all uppercase tracking-wider">
                                                    {tag}
                                                </code>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 ml-2">
                                        <input
                                            type="checkbox"
                                            id="isDefault"
                                            checked={editingTemplate.isDefault || false}
                                            onChange={(e) => setEditingTemplate({ ...editingTemplate, isDefault: e.target.checked })}
                                            className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <label htmlFor="isDefault" className="text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none">
                                            Designate as System Default
                                        </label>
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-3 text-rose-700 text-xs font-semibold uppercase tracking-wider bg-rose-50/50 p-4 rounded-2xl border border-rose-100 animate-in shake duration-300">
                                            <AlertCircle size={14} className="stroke-[2.5]" />
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 pt-4">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex-1 py-4 bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl font-semibold text-sm uppercase tracking-wider transition-all shadow-xl shadow-indigo-900/5 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} className="stroke-[2.5]" />}
                                            {saving ? "Deploying..." : "Commit Template"}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] opacity-40"
                            >
                                <div className="p-6 bg-slate-100 rounded-full mb-6">
                                    <Edit2 size={32} className="text-slate-400" />
                                </div>
                                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Editor Idle</h4>
                                <p className="text-xs font-medium text-slate-400 mt-2 uppercase tracking-wider">Select a template to begin tailoring</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Success Notification */}
            <AnimatePresence>
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed bottom-10 right-10 flex items-center gap-4 bg-emerald-600 text-white px-8 py-4 rounded-[1.5rem] shadow-2xl shadow-emerald-900/40 z-50 ring-4 ring-emerald-500/20"
                    >
                        <div className="bg-white/20 p-2 rounded-full">
                            <Check size={18} className="stroke-[2.5]" />
                        </div>
                        <span className="font-semibold text-xs uppercase tracking-wider">{success}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
