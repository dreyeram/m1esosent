"use client";

import React, { useState, useEffect } from "react";
import { getUHIDConfig, updateUHIDConfig } from "@/app/actions/admin";
import { Loader2, Save, CreditCard, RefreshCw } from "lucide-react";
import { getCurrentSession } from "@/app/actions/auth";

export default function PatientIdentitySettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [orgId, setOrgId] = useState<string | null>(null);

    const [config, setConfig] = useState({
        prefix: "MRN-",
        suffix: "",
        currentSerial: 1000,
        digits: 6
    });

    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const session = await getCurrentSession();
            if (session.success && session.user) {
                setOrgId(session.user.orgId);
                const res = await getUHIDConfig(session.user.orgId);
                if (res.success && res.config) {
                    setConfig(res.config);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!orgId) return;
        setSaving(true);
        setMessage(null);
        try {
            // Validate
            if (config.digits < 3) {
                setMessage({ type: 'error', text: "Serial digits must be at least 3" });
                setSaving(false);
                return;
            }

            const res = await updateUHIDConfig(orgId, config);
            if (res.success) {
                setMessage({ type: 'success', text: "Settings saved successfully" });
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: res.error || "Failed to save" });
            }
        } catch (e) {
            setMessage({ type: 'error', text: "An unexpected error occurred" });
        } finally {
            setSaving(false);
        }
    };

    // Calculate preview
    const serialPreview = config.currentSerial.toString().padStart(config.digits, '0');
    const previewId = `${config.prefix}${serialPreview}${config.suffix}`;
    const nextPreviewId = `${config.prefix}${(config.currentSerial + 1).toString().padStart(config.digits, '0')}${config.suffix}`;

    if (loading) return <div className="p-8"><Loader2 className="animate-spin text-slate-400" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 p-2">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-purple-100 rounded-2xl text-purple-600 shadow-inner">
                            <CreditCard size={24} />
                        </div>
                        <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Identity Config</h2>
                    </div>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider ml-1">MRN Generation & Patient Indexing</p>
                    <div className="mt-4 max-w-xl">
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Customize how Patient Medical Record Numbers are generated.
                            <span className="text-slate-900 font-semibold ml-1">Changes apply to new patients only.</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Configuration Area */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white/40 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/60">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 ml-2">Prefix</label>
                                <input
                                    type="text"
                                    value={config.prefix}
                                    onChange={e => setConfig({ ...config, prefix: e.target.value })}
                                    className="w-full bg-white/50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-800 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 transition-all font-semibold text-sm"
                                    placeholder="MRN-"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 ml-2">Suffix</label>
                                <input
                                    type="text"
                                    value={config.suffix}
                                    onChange={e => setConfig({ ...config, suffix: e.target.value })}
                                    className="w-full bg-white/50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-800 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 transition-all font-semibold text-sm"
                                    placeholder="/24"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 ml-2">Starting Serial</label>
                                <input
                                    type="number"
                                    value={config.currentSerial}
                                    onChange={e => setConfig({ ...config, currentSerial: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-white/50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-800 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 transition-all font-semibold text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 ml-2">Min Digits</label>
                                <input
                                    type="number"
                                    value={config.digits}
                                    onChange={e => setConfig({ ...config, digits: parseInt(e.target.value) || 6 })}
                                    min={3} max={12}
                                    className="w-full bg-white/50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-800 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 transition-all font-semibold text-sm"
                                />
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-white/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {saving ? (
                                    <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 text-slate-400 rounded-xl font-semibold text-xs uppercase tracking-wider">
                                        <Loader2 className="animate-spin w-4 h-4" />
                                        Processing
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-8 py-3.5 bg-white hover:bg-purple-50 text-purple-600 border border-purple-100 rounded-xl font-semibold text-[11px] uppercase tracking-wider transition-all shadow-xl shadow-purple-900/5 active:scale-95 flex items-center gap-3"
                                    >
                                        <Save className="w-4 h-4 stroke-[2.5]" />
                                        Save Changes
                                    </button>
                                )}
                            </div>

                            {message && (
                                <div className={`animate-in slide-in-from-right-4 px-6 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                    {message.text}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="lg:col-span-2">
                    <div className="bg-white/40 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/60 sticky top-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
                                <RefreshCw size={14} />
                            </div>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Preview</span>
                        </div>

                        <div className="space-y-10">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Current Format</label>
                                <div className="text-3xl font-semibold text-slate-900 tracking-tighter break-all">
                                    {previewId}
                                </div>
                            </div>

                            <div className="p-6 bg-white/50 rounded-2xl border border-white">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Generation Logic</label>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-500">Next ID</span>
                                        <span className="text-xs font-semibold text-slate-900 tabular-nums">{nextPreviewId}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-500">Increment</span>
                                        <span className="text-xs font-semibold text-slate-900 tabular-nums">+1 Unit</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
