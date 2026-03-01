"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import {
    X, User, Building2, Pill, ShieldCheck,
    AlertTriangle, Camera, Save, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProfileTab from "./ProfileTab";
import OrganizationTab from "./OrganizationTab";
import MedicinesTab from "./MedicinesTab";
import SecurityTab from "./SecurityTab";
import DangerZoneTab from "./DangerZoneTab";
import { getUserProfile } from "@/app/actions/settings";

interface SettingsDialogProps {
    userId: string;
    isOpen: boolean;
    onClose: () => void;
    onRefresh?: () => void;
    onUpdate?: () => void;
}

export default function SettingsDialog({ userId, isOpen, onClose, onRefresh, onUpdate }: SettingsDialogProps) {
    const [activeTab, setActiveTab] = useState("profile");
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && userId) {
            loadUserProfile();
        }
    }, [isOpen, userId]);

    const loadUserProfile = async () => {
        setLoading(true);
        const result = await getUserProfile(userId);
        if (result.success) {
            setUser(result.user);
        }
        setLoading(false);
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] animate-in fade-in duration-300" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[80vh] bg-white rounded-2xl shadow-2xl z-[101] overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-300">

                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/50 backdrop-blur-md">
                        <div>
                            <Dialog.Title className="text-xl font-black text-slate-900 tracking-tight">System Settings</Dialog.Title>
                            <Dialog.Description className="text-slate-500 text-xs font-medium">Manage your profile, organization, and system preferences</Dialog.Description>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tabs Interface */}
                    <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex-1 flex overflow-hidden">
                        {/* Sidebar Tabs */}
                        <Tabs.List className="w-52 border-r border-slate-100 flex flex-col p-3 gap-1 bg-slate-50/50 shrink-0">
                            <TabTrigger value="profile" icon={<User size={18} />} label="My Profile" />
                            <TabTrigger value="organization" icon={<Building2 size={18} />} label="Organization" />
                            <TabTrigger value="medicines" icon={<Pill size={18} />} label="Medicines" />
                            <TabTrigger value="security" icon={<ShieldCheck size={18} />} label="Security & Privacy" />
                            <div className="mt-auto pt-4 border-t border-slate-200">
                                <TabTrigger
                                    value="danger"
                                    icon={<AlertTriangle size={18} />}
                                    label="Danger Zone"
                                    variant="danger"
                                />
                            </div>
                        </Tabs.List>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto bg-white p-6">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest animate-pulse">Loading Preferences...</p>
                                </div>
                            ) : (
                                <>
                                    <Tabs.Content value="profile" className="h-full outline-none">
                                        <ProfileTab user={user} onUpdate={() => { loadUserProfile(); onUpdate?.(); }} />
                                    </Tabs.Content>
                                    <Tabs.Content value="organization" className="h-full outline-none">
                                        <OrganizationTab orgId={user?.organizationId} onUpdate={onUpdate} />
                                    </Tabs.Content>
                                    <Tabs.Content value="medicines" className="h-full outline-none">
                                        <MedicinesTab orgId={user?.organizationId} />
                                    </Tabs.Content>
                                    <Tabs.Content value="security" className="h-full outline-none">
                                        <SecurityTab user={user} />
                                    </Tabs.Content>
                                    <Tabs.Content value="danger" className="h-full outline-none">
                                        <DangerZoneTab userId={userId} onRefresh={onRefresh} />
                                    </Tabs.Content>
                                </>
                            )}
                        </div>
                    </Tabs.Root>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

function TabTrigger({ value, icon, label, variant = "default" }: {
    value: string, icon: React.ReactNode, label: string, variant?: "default" | "danger"
}) {
    return (
        <Tabs.Trigger
            value={value}
            className={`
                flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all text-left outline-none
                data-[state=active]:shadow-md data-[state=active]:shadow-slate-200/40
                ${variant === "danger"
                    ? "text-rose-600 hover:bg-rose-50 data-[state=active]:bg-rose-600 data-[state=active]:text-white"
                    : "text-slate-600 hover:bg-white data-[state=active]:bg-white data-[state=active]:text-blue-600"
                }
            `}
        >
            {icon}
            {label}
        </Tabs.Trigger>
    );
}
