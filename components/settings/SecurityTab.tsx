"use client";

import React, { useState } from "react";
import { ShieldCheck, KeyRound, Lock, Check, Loader2, Save, AlertCircle } from "lucide-react";
import { changePassword } from "@/app/actions/auth";
import { setDangerZonePin as savePinAction } from "@/app/actions/settings";
import { motion } from "framer-motion";

interface SecurityTabProps {
    user: any;
}

export default function SecurityTab({ user }: SecurityTabProps) {
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
    const [pinData, setPinData] = useState({ pin: "", confirmPin: "" });
    const [isSavingPass, setIsSavingPass] = useState(false);
    const [isSavingPin, setIsSavingPin] = useState(false);
    const [passMessage, setPassMessage] = useState({ text: "", type: "" });
    const [pinMessage, setPinMessage] = useState({ text: "", type: "" });

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setPassMessage({ text: "Passwords do not match!", type: "error" });
            return;
        }
        setIsSavingPass(true);
        const result = await changePassword(user.id, passwords.current, passwords.new);
        if (result.success) {
            setPassMessage({ text: "Password changed successfully!", type: "success" });
            setPasswords({ current: "", new: "", confirm: "" });
        } else {
            setPassMessage({ text: result.error || "Failed to change password.", type: "error" });
        }
        setIsSavingPass(false);
    };

    const handlePinSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pinData.pin !== pinData.confirmPin) {
            setPinMessage({ text: "PINs do not match!", type: "error" });
            return;
        }
        setIsSavingPin(true);
        const result = await savePinAction(user.id, pinData.pin);
        if (result.success) {
            setPinMessage({ text: "Danger Zone PIN updated!", type: "success" });
            setPinData({ pin: "", confirmPin: "" });
        } else {
            setPinMessage({ text: result.error || "Failed to update PIN.", type: "error" });
        }
        setIsSavingPin(false);
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto pr-2 pb-10">
            {/* Password Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                        <KeyRound size={20} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">Change Password</h3>
                </div>

                <form onSubmit={handlePasswordChange} className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Current Password</label>
                        <input
                            type="password" required value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono tracking-widest"
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password</label>
                            <input
                                type="password" required value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono tracking-widest"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm New Password</label>
                            <input
                                type="password" required value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono tracking-widest"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    {passMessage.text && (
                        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${passMessage.type === "success" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                            {passMessage.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
                            {passMessage.text}
                        </div>
                    )}
                    <button type="submit" disabled={isSavingPass} className="w-max px-8 py-3.5 bg-slate-900 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
                        {isSavingPass ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Update Password
                    </button>
                </form>
            </div>

            <hr className="border-slate-100" />

            {/* Danger Zone PIN section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                        <ShieldCheck size={20} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">Danger Zone Access</h3>
                </div>

                <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100/50 mb-6">
                    <p className="text-xs font-medium text-amber-700 leading-relaxed italic">
                        The Danger Zone PIN is required to perform sensitive operations like permanent patient deletion.
                    </p>
                </div>

                <form onSubmit={handlePinSave} className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Set PIN (4-6 digits)</label>
                            <input
                                type="password" required maxLength={6} minLength={4} value={pinData.pin} onChange={e => setPinData({ ...pinData, pin: e.target.value.replace(/\D/g, "") })}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-rose-500/10 transition-all text-center tracking-[0.5em] font-mono"
                                placeholder="••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm PIN</label>
                            <input
                                type="password" required maxLength={6} minLength={4} value={pinData.confirmPin} onChange={e => setPinData({ ...pinData, confirmPin: e.target.value.replace(/\D/g, "") })}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-rose-500/10 transition-all text-center tracking-[0.5em] font-mono"
                                placeholder="••••"
                            />
                        </div>
                    </div>
                    {pinMessage.text && (
                        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${pinMessage.type === "success" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                            {pinMessage.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
                            {pinMessage.text}
                        </div>
                    )}
                    <button type="submit" disabled={isSavingPin} className="w-max px-8 py-3.5 bg-rose-600 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-rose-500 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
                        {isSavingPin ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Update Access PIN
                    </button>
                </form>
            </div>
        </div>
    );
}
