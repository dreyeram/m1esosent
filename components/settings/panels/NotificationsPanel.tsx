"use client";

import React, { useState } from "react";
import { Bell, BellOff, Volume2, VolumeX, Clock, Moon, Save, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/contexts/SettingsContext";

interface NotificationsPanelProps {
    onUnsavedChange: (hasChanges: boolean) => void;
}

export default function NotificationsPanel({ onUnsavedChange }: NotificationsPanelProps) {
    const { settings, updateSetting, saveSettings, hasChanges } = useSettings();
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Local state for DND (not in global settings, we'll add it)
    const [dndEnabled, setDndEnabled] = useState(false);
    const [dndStart, setDndStart] = useState('22:00');
    const [dndEnd, setDndEnd] = useState('08:00');

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveSettings();
            setSaveSuccess(true);
            onUnsavedChange(false);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to save', error);
        }
        setIsSaving(false);
    };

    const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
        <button
            onClick={onChange}
            className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-blue-600' : 'bg-slate-300'
                }`}
        >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'left-6' : 'left-0.5'
                }`} />
        </button>
    );

    return (
        <div className="max-w-2xl space-y-8">
            {/* Master Notification Toggle */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {settings.notificationsEnabled ? <Bell size={20} className="text-blue-600" /> : <BellOff size={20} className="text-slate-400" />}
                        <div>
                            <h4 className="text-sm font-bold text-slate-700">Enable Notifications</h4>
                            <p className="text-xs text-slate-500">Master toggle for all notifications</p>
                        </div>
                    </div>
                    <Toggle
                        enabled={settings.notificationsEnabled}
                        onChange={() => {
                            updateSetting('notificationsEnabled', !settings.notificationsEnabled);
                            onUnsavedChange(true);
                        }}
                    />
                </div>
            </div>

            {/* Notification Types */}
            {settings.notificationsEnabled && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                        <Bell size={16} className="text-slate-500" />
                        <div>
                            <h4 className="text-sm font-bold text-slate-700">Notification Types</h4>
                            <p className="text-xs text-slate-500 mt-0.5">Choose what alerts you receive</p>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        <div className="px-6 py-4 flex items-center justify-between">
                            <div>
                                <h5 className="text-sm font-bold text-slate-700">Desktop Notifications</h5>
                                <p className="text-xs text-slate-500 mt-0.5">Browser push notifications</p>
                            </div>
                            <Toggle
                                enabled={settings.desktopNotifications}
                                onChange={() => {
                                    updateSetting('desktopNotifications', !settings.desktopNotifications);
                                    onUnsavedChange(true);
                                }}
                            />
                        </div>

                        <div className="px-6 py-4 flex items-center justify-between">
                            <div>
                                <h5 className="text-sm font-bold text-slate-700">Email Notifications</h5>
                                <p className="text-xs text-slate-500 mt-0.5">Receive updates via email</p>
                            </div>
                            <Toggle
                                enabled={settings.emailNotifications}
                                onChange={() => {
                                    updateSetting('emailNotifications', !settings.emailNotifications);
                                    onUnsavedChange(true);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Sound Settings */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <Volume2 size={16} className="text-slate-500" />
                    <div>
                        <h4 className="text-sm font-bold text-slate-700">Sound Settings</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Audio alerts and feedback</p>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {settings.soundEnabled ? <Volume2 size={20} className="text-blue-600" /> : <VolumeX size={20} className="text-slate-400" />}
                            <div>
                                <h5 className="text-sm font-bold text-slate-700">Enable Sound Effects</h5>
                                <p className="text-xs text-slate-500">Play audio for actions and alerts</p>
                            </div>
                        </div>
                        <Toggle
                            enabled={settings.soundEnabled}
                            onChange={() => {
                                updateSetting('soundEnabled', !settings.soundEnabled);
                                onUnsavedChange(true);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Do Not Disturb */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <Moon size={16} className="text-slate-500" />
                    <div>
                        <h4 className="text-sm font-bold text-slate-700">Do Not Disturb</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Silence notifications during specific hours</p>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h5 className="text-sm font-bold text-slate-700">Enable Quiet Hours</h5>
                            <p className="text-xs text-slate-500">Mute all notifications during set time</p>
                        </div>
                        <Toggle enabled={dndEnabled} onChange={() => setDndEnabled(!dndEnabled)} />
                    </div>

                    {dndEnabled && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    <Clock size={12} className="inline mr-1" /> From
                                </label>
                                <input
                                    type="time"
                                    value={dndStart}
                                    onChange={e => setDndStart(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-mono font-semibold text-slate-700 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    <Clock size={12} className="inline mr-1" /> Until
                                </label>
                                <input
                                    type="time"
                                    value={dndEnd}
                                    onChange={e => setDndEnd(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-mono font-semibold text-slate-700 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end pt-4">
                <div className="flex items-center gap-4">
                    <AnimatePresence>
                        {saveSuccess && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="flex items-center gap-2 text-emerald-600"
                            >
                                <Check size={18} />
                                <span className="text-sm font-semibold">Saved!</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save size={16} />
                        {isSaving ? 'Saving...' : 'Save Preferences'}
                    </button>
                </div>
            </div>
        </div>
    );
}
