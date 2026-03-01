"use client";

import React, { useEffect, useState } from "react";
import { getAdminStats } from "@/app/actions/admin";
import {
    Users, Activity, DollarSign, Database,
    HardDrive, FileText, Loader2, RefreshCw,
    Settings,
    LayoutDashboard,
    Building2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PatientIdentitySettings from "./settings/PatientIdentitySettings";

import OrganizationSettings from "@/components/settings/OrganizationSettings";

interface Stats {
    totalStaff: number;
    totalPatients: number;
    totalProcedures: number;
    completedProcedures: number;
    estimatedRevenue: number;
    storageGB: string;
}

interface AdminDashboardProps {
    user?: any;
    organization?: any;
    onUpdate?: () => void;
}

export default function AdminDashboard({ user, organization, onUpdate }: AdminDashboardProps) {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    async function loadStats() {
        setLoading(true);
        const result = await getAdminStats();
        if (result.success && result.stats) {
            setStats(result.stats as Stats);
        }
        setLoading(false);
    }

    useEffect(() => {
        loadStats();
    }, []);



    return (
        <div className="w-full max-w-6xl mx-auto">
            <Tabs defaultValue="overview" className="w-full">
                <div className="mb-10 flex justify-center">
                    <TabsList className="bg-white/60 backdrop-blur-xl border border-white/80 p-1.5 rounded-3xl shadow-xl shadow-slate-200/50 inline-flex h-auto gap-1">
                        <TabsTrigger
                            value="overview"
                            className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-lg px-8 py-3 rounded-[1.25rem] text-slate-500 font-semibold text-xs uppercase tracking-widest flex items-center gap-3 transition-all"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="branding"
                            className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-lg px-8 py-3 rounded-[1.25rem] text-slate-500 font-semibold text-xs uppercase tracking-widest flex items-center gap-3 transition-all"
                        >
                            <Building2 className="w-4 h-4" />
                            Branding
                        </TabsTrigger>
                        <TabsTrigger
                            value="settings"
                            className="data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-lg px-8 py-3 rounded-[1.25rem] text-slate-500 font-semibold text-xs uppercase tracking-widest flex items-center gap-3 transition-all"
                        >
                            <Users className="w-4 h-4" />
                            Patient Identity
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="view-enter">
                    <TabsContent value="overview">
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">System Overview</h2>
                                    <p className="text-slate-500 text-sm mt-1 font-medium">Real-time statistics across all users</p>
                                </div>
                                <button
                                    onClick={loadStats}
                                    className="p-3 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-200 rounded-2xl transition-all shadow-sm hover:shadow-lg active:scale-95"
                                    title="Refresh Stats"
                                >
                                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            {loading && !stats ? (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-400 font-medium bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60">
                                    <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-600" />
                                    <p>Loading dashboard...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {/* Revenue */}
                                        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] p-7 relative overflow-hidden group hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500">
                                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
                                                <DollarSign className="w-20 h-20 text-emerald-600" />
                                            </div>
                                            <div className="text-emerald-700 text-[11px] font-semibold uppercase tracking-wider mb-2">
                                                Est. Revenue
                                            </div>
                                            <div className="text-3xl font-bold text-slate-900 mb-2 truncate">
                                                ${stats?.estimatedRevenue.toLocaleString() || 0}
                                            </div>
                                            <div className="text-xs text-emerald-700 font-medium bg-emerald-50/80 inline-block px-3 py-1.5 rounded-xl border border-emerald-100/50">
                                                {stats?.completedProcedures || 0} procedures
                                            </div>
                                        </div>

                                        {/* Staff */}
                                        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] p-7 relative overflow-hidden group hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500">
                                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-500">
                                                <Users className="w-20 h-20 text-blue-600" />
                                            </div>
                                            <div className="text-blue-700 text-[11px] font-semibold uppercase tracking-wider mb-2">
                                                Total Staff
                                            </div>
                                            <div className="text-3xl font-bold text-slate-900 mb-2">
                                                {stats?.totalStaff || 0}
                                            </div>
                                            <div className="text-xs text-blue-700 font-medium bg-blue-50/80 inline-block px-3 py-1.5 rounded-xl border border-blue-100/50">
                                                Active accounts
                                            </div>
                                        </div>

                                        {/* Patients */}
                                        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] p-7 relative overflow-hidden group hover:shadow-2xl hover:shadow-rose-900/5 transition-all duration-500">
                                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
                                                <Activity className="w-20 h-20 text-rose-600" />
                                            </div>
                                            <div className="text-rose-700 text-[11px] font-semibold uppercase tracking-wider mb-2">
                                                Total Patients
                                            </div>
                                            <div className="text-3xl font-bold text-slate-900 mb-2">
                                                {stats?.totalPatients || 0}
                                            </div>
                                            <div className="text-xs text-rose-700 font-medium bg-rose-50/80 inline-block px-3 py-1.5 rounded-xl border border-rose-100/50">
                                                Registered
                                            </div>
                                        </div>

                                        {/* Procedures */}
                                        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] p-7 relative overflow-hidden group hover:shadow-2xl hover:shadow-violet-900/5 transition-all duration-500">
                                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-500">
                                                <FileText className="w-20 h-20 text-violet-600" />
                                            </div>
                                            <div className="text-violet-700 text-[11px] font-semibold uppercase tracking-wider mb-2">
                                                Total Procedures
                                            </div>
                                            <div className="text-3xl font-bold text-slate-900 mb-2">
                                                {stats?.totalProcedures || 0}
                                            </div>
                                            <div className="text-xs text-violet-700 font-medium bg-violet-50/80 inline-block px-3 py-1.5 rounded-xl border border-violet-100/50">
                                                All time
                                            </div>
                                        </div>
                                    </div>

                                    {/* System Health */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white/50 backdrop-blur-md border border-white/70 rounded-[2.5rem] p-8 shadow-sm">
                                            <h3 className="text-lg font-semibold text-slate-800 mb-8 flex items-center gap-4">
                                                <div className="p-3 bg-sky-100 rounded-2xl text-sky-600 shadow-inner">
                                                    <HardDrive className="w-6 h-6" />
                                                </div>
                                                Storage Usage
                                            </h3>
                                            <div className="space-y-8">
                                                <div>
                                                    <div className="flex justify-between text-sm mb-4 font-semibold">
                                                        <span className="text-slate-500 uppercase tracking-wider text-[10px]">Media Storage</span>
                                                        <span className="text-slate-900 font-semibold">{stats?.storageGB || "0.00"} GB</span>
                                                    </div>
                                                    <div className="h-4 bg-slate-100/50 rounded-full overflow-hidden border border-slate-200/50 p-1">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-1000 shadow-lg shadow-sky-500/20"
                                                            style={{ width: `${Math.min(parseFloat(stats?.storageGB || "0") * 10, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 p-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl text-[11px] text-blue-600 font-semibold">
                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                    ESTIMATED BASED ON MEDIA FILE COUNT & METADATA
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white/50 backdrop-blur-md border border-white/70 rounded-[2.5rem] p-8 shadow-sm">
                                            <h3 className="text-lg font-semibold text-slate-800 mb-8 flex items-center gap-4">
                                                <div className="p-3 bg-amber-100 rounded-2xl text-amber-600 shadow-inner">
                                                    <Database className="w-6 h-6" />
                                                </div>
                                                Database Health
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-5 bg-emerald-50/80 border border-emerald-100/50 rounded-2xl shadow-sm">
                                                    <div className="flex flex-col">
                                                        <span className="text-emerald-900 font-semibold text-sm uppercase tracking-tight">Active Connection</span>
                                                        <span className="text-[10px] text-emerald-600 font-semibold">Latency: &lt; 2ms</span>
                                                    </div>
                                                    <span className="text-[10px] bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 tracking-wider">STABLE</span>
                                                </div>
                                                <div className="flex items-center justify-between p-5 bg-white/80 border border-slate-100 rounded-2xl shadow-sm">
                                                    <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Engine Type</span>
                                                    <span className="text-slate-900 text-sm font-semibold font-mono px-3 py-1.5 bg-slate-100/50 rounded-xl border border-slate-100">SQLite v3.x</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="branding">
                        {organization && (
                            <OrganizationSettings
                                organization={organization}
                                onUpdate={onUpdate || (() => { })}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="settings">
                        <PatientIdentitySettings />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
