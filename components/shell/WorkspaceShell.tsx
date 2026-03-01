"use client";

import React from "react";
import {
    Calendar,
    Users,
    LogOut,
    LayoutDashboard,
    Search,
    Bell,
    Plus,
    UserCircle
} from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion"; // Performance Optimization

interface WorkspaceShellProps {
    orgName?: string;
    orgLogo?: string;
    userName: string;
    activeTab: string;
    onTabChange: (tabId: string) => void;
    onLogout: () => void;
    isSheetOpen?: boolean;
    children: React.ReactNode;
}

export default function WorkspaceShell({
    orgName,
    orgLogo,
    userName,
    activeTab,
    onTabChange,
    onLogout,
    isSheetOpen = false,
    children
}: WorkspaceShellProps) {
    const navItems = [
        { id: "schedule", label: "Schedule", icon: Calendar },
        { id: "patients", label: "Patients", icon: Users },
        { id: "inventory", label: "Inventory", icon: LayoutDashboard },
    ];

    return (
        <div className={`w-full h-screen flex overflow-hidden aurora-bg transition-colors duration-1000 ${isSheetOpen ? 'is-active-sheet' : ''}`}>
            {/* Aurora Background Layer */}
            <div className="aurora-particle" />

            {/* Floating Sidebar */}
            <aside className="w-72 flex flex-col z-40 p-6">
                <div className="glass-floating h-full flex flex-col p-4">
                    {/* Brand */}
                    <div className="px-4 py-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 glass-surface rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                                <Plus className="w-7 h-7 rotate-45" strokeWidth={2.5} />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-base font-bold text-slate-800 tracking-tight leading-none italic uppercase">
                                    {orgName || 'LoyalMed'}
                                </h1>
                                <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.2em] mt-2">
                                    Clinical Suite
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-2 mt-8">
                        {navItems.map((item) => {
                            const IsActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onTabChange(item.id)}
                                    className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all group relative ${IsActive
                                        ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                                        }`}
                                >
                                    <item.icon className={`w-5 h-5 ${IsActive ? "text-white" : "text-slate-400 group-hover:text-slate-900"} transition-colors`} />
                                    {item.label}
                                    {IsActive && (
                                        <div
                                            className="absolute inset-0 bg-blue-600 rounded-2xl z-[-1] shadow-lg shadow-blue-500/40"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* User & Logout */}
                    <div className="mt-auto pt-6 space-y-4 border-t border-slate-100/50">
                        <div className="px-4 py-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                    <UserCircle size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-800 truncate">{userName}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Provider</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-4 px-5 py-3 rounded-2xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition-all uppercase tracking-widest"
                        >
                            <LogOut className="w-4 h-4" />
                            Log Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Stage */}
            <main className="flex-1 flex flex-col min-w-0 receding-content overflow-hidden">
                {/* Spotlight Header */}
                <header className="h-24 flex items-center justify-between px-12 z-30">
                    <div className="flex-1 flex justify-center max-w-2xl px-4">
                        <div className="spotlight-pill w-full max-w-lg group">
                            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search Patients or Reports... (Alt + S)"
                                className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
                            />
                            <div className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-400 border border-slate-200">
                                ⌘ S
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-3 rounded-full glass-surface hover:bg-white group transition-all">
                            <Bell className="w-5 h-5 text-slate-500 group-hover:text-blue-500 transition-colors" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-white animate-pulse" />
                        </button>
                    </div>
                </header>

                {/* Content Canvas */}
                <div className="flex-1 p-8 pt-0 overflow-auto scrollbar-hide">
                    {children}
                </div>
            </main>
        </div>
    );
}
