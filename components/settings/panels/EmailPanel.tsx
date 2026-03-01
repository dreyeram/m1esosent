"use client";

import React, { useState, useEffect } from "react";
import { Mail, Shield, Server, User, Key, Send, Check, AlertCircle, Save, Loader2, Info, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { updateOrganizationSettings } from "@/app/actions/settings";
import { testSmtpConnection } from "@/app/actions/communication";

interface Organization {
    id: string;
    smtpConfig?: string | null;
}

interface EmailPanelProps {
    organization: Organization;
    onUpdate: () => void;
    onUnsavedChange: (hasChanges: boolean) => void;
}

// Preset configurations for popular email providers
const EMAIL_PRESETS = {
    gmail: {
        label: "Gmail",
        host: "smtp.gmail.com",
        port: "587",
        secure: false,
        note: "Requires App Password. Go to myaccount.google.com → Security → 2-Step Verification → App Passwords"
    },
    outlook: {
        label: "Outlook / Office 365",
        host: "smtp.office365.com",
        port: "587",
        secure: false,
        note: "Use your Microsoft account email and password"
    },
    yahoo: {
        label: "Yahoo Mail",
        host: "smtp.mail.yahoo.com",
        port: "587",
        secure: false,
        note: "Requires App Password from Yahoo Account Security settings"
    },
    custom: {
        label: "Custom SMTP",
        host: "",
        port: "587",
        secure: false,
        note: "Configure your own SMTP server settings"
    }
};

export default function EmailPanel({ organization, onUpdate, onUnsavedChange }: EmailPanelProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [selectedPreset, setSelectedPreset] = useState<string>("custom");
    const [showPresetDropdown, setShowPresetDropdown] = useState(false);

    const initialConfig = organization.smtpConfig ? JSON.parse(organization.smtpConfig) : {
        host: '',
        port: '587',
        secure: false,
        user: '',
        pass: '',
        fromEmail: '',
        fromName: ''
    };

    const [formData, setFormData] = useState(initialConfig);

    // Detect preset on mount
    useEffect(() => {
        if (formData.host === 'smtp.gmail.com') setSelectedPreset('gmail');
        else if (formData.host === 'smtp.office365.com') setSelectedPreset('outlook');
        else if (formData.host === 'smtp.mail.yahoo.com') setSelectedPreset('yahoo');
        else if (formData.host) setSelectedPreset('custom');
    }, []);

    const handlePresetSelect = (presetKey: string) => {
        const preset = EMAIL_PRESETS[presetKey as keyof typeof EMAIL_PRESETS];
        setSelectedPreset(presetKey);
        setFormData((prev: any) => ({
            ...prev,
            host: preset.host,
            port: preset.port,
            secure: preset.secure
        }));
        setShowPresetDropdown(false);
        onUnsavedChange(true);
    };

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
        onUnsavedChange(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError('');
        setSaveSuccess(false);

        try {
            const result = await updateOrganizationSettings({
                id: organization.id,
                smtpConfig: JSON.stringify(formData)
            });

            if (result.success) {
                setSaveSuccess(true);
                onUnsavedChange(false);
                onUpdate();
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                setSaveError(result.error || 'Failed to save');
            }
        } catch (error) {
            console.error(error);
            setSaveError('Error saving email settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTest = async () => {
        setIsTesting(true);
        setTestResult(null);

        try {
            const result = await testSmtpConnection(formData);
            setTestResult(result);
        } catch (error) {
            setTestResult({ success: false, message: 'Unexpected error during test' });
        } finally {
            setIsTesting(false);
        }
    };

    const currentPreset = EMAIL_PRESETS[selectedPreset as keyof typeof EMAIL_PRESETS];

    return (
        <div className="max-w-4xl space-y-8">
            <div className="p-6 border rounded-xl bg-white shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Mail className="w-6 h-6 text-blue-600" />
                            Email Configuration (SMTP)
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Configure your SMTP settings to allow patients to receive report links via email.
                        </p>
                    </div>
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <Server size={20} />
                    </div>
                </div>

                {/* Quick Setup Dropdown */}
                <div className="relative">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Setup</label>
                    <button
                        onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                        className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-left hover:border-blue-300 transition-colors"
                    >
                        <span className="font-semibold text-slate-700">{currentPreset.label}</span>
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showPresetDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showPresetDropdown && (
                        <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                            {Object.entries(EMAIL_PRESETS).map(([key, preset]) => (
                                <button
                                    key={key}
                                    onClick={() => handlePresetSelect(key)}
                                    className={`w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between ${selectedPreset === key ? 'bg-blue-50' : ''}`}
                                >
                                    <span className="font-medium text-slate-700">{preset.label}</span>
                                    {selectedPreset === key && <Check className="w-4 h-4 text-blue-600" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Preset-specific instructions */}
                {selectedPreset !== 'custom' && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-4">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                            <Info size={16} />
                        </div>
                        <div className="text-sm text-amber-800">
                            <p className="font-semibold mb-1">{currentPreset.label} Setup Instructions:</p>
                            <p className="text-xs leading-relaxed">{currentPreset.note}</p>
                            {selectedPreset === 'gmail' && (
                                <a
                                    href="https://myaccount.google.com/apppasswords"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block mt-2 text-xs text-blue-600 hover:underline font-medium"
                                >
                                    → Open Gmail App Passwords
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* SMTP Config */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h4 className="text-sm font-bold text-slate-700">SMTP Server Configuration</h4>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Host */}
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">SMTP Host</label>
                            <div className="relative">
                                <Server size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={formData.host}
                                    onChange={e => handleChange('host', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    placeholder="smtp.example.com"
                                />
                            </div>
                        </div>

                        {/* Port */}
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Port</label>
                            <input
                                value={formData.port}
                                onChange={e => handleChange('port', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                placeholder="587"
                            />
                        </div>

                        {/* User */}
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                {selectedPreset === 'gmail' ? 'Gmail Address' : 'Username'}
                            </label>
                            <div className="relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={formData.user}
                                    onChange={e => handleChange('user', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    placeholder={selectedPreset === 'gmail' ? "doctor@gmail.com" : "your-email@example.com"}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                {selectedPreset === 'gmail' ? 'App Password' : 'Password'}
                            </label>
                            <div className="relative">
                                <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    value={formData.pass}
                                    onChange={e => handleChange('pass', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                        <input
                            type="checkbox"
                            id="secure"
                            checked={formData.secure}
                            onChange={e => handleChange('secure', e.target.checked)}
                            className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="secure" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                            Use SSL (Port 465)
                        </label>
                    </div>
                </div>
            </div>

            {/* Sender Info */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h4 className="text-sm font-bold text-slate-700">Sender Information</h4>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sender Name</label>
                        <input
                            value={formData.fromName}
                            onChange={e => handleChange('fromName', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="Dr. Smith's Clinic"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sender Email Address</label>
                        <input
                            value={formData.fromEmail}
                            onChange={e => handleChange('fromEmail', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder={selectedPreset === 'gmail' ? formData.user || "doctor@gmail.com" : "reports@clinic.com"}
                        />
                    </div>
                </div>
            </div>

            {/* Test & Save Actions */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleTest}
                            disabled={isTesting || !formData.host || !formData.user}
                            className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${isTesting || !formData.host || !formData.user
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-white border border-blue-200 text-blue-600 hover:bg-blue-50'
                                }`}
                        >
                            {isTesting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                            {isTesting ? 'Testing...' : 'Test Connection'}
                        </button>

                        <AnimatePresence mode="wait">
                            {testResult && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className={`flex items-center gap-2 text-sm font-semibold ${testResult.success ? 'text-emerald-600' : 'text-rose-600'}`}
                                >
                                    {testResult.success ? <Check size={18} /> : <AlertCircle size={18} />}
                                    {testResult.message}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save size={16} />
                        {isSaving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>

                {saveError && (
                    <div className="flex items-center gap-2 text-rose-600 text-sm font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">
                        <AlertCircle size={18} />
                        {saveError}
                    </div>
                )}

                {saveSuccess && (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                        <Check size={18} />
                        Email configuration saved successfully!
                    </div>
                )}
            </div>
        </div>
    );
}
