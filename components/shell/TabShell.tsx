"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    Search,
    Home,
    Settings,
    LogOut,
    Building2
} from "lucide-react";
import TabBar from "./TabBar";
import { Tab } from "@/hooks/useTabManager";

interface TabShellProps {
    orgName?: string;
    orgLogo?: string;
    userName: string;
    role: "ADMIN" | "DOCTOR" | "ASSISTANT";
    tabs: Tab[];
    activeTabId: string;
    onTabClick: (tabId: string) => void;
    onTabClose: (tabId: string) => void;
    onNewTab: () => void;
    onLogout: () => void;
    onOpenSettings?: () => void;
    onSearch?: (query: string) => void;
    searchQuery?: string;
    children: React.ReactNode;
}

// Get time-based greeting
function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
}

export default function TabShell({
    orgName,
    orgLogo,
    userName,
    role,
    tabs,
    activeTabId,
    onTabClick,
    onTabClose,
    onNewTab,
    onLogout,
    onOpenSettings,
    onSearch,
    searchQuery = '',
    children
}: TabShellProps) {
    // Use state for greeting to avoid hydration mismatch (server time vs client time)
    const [greeting, setGreeting] = useState("Hello");

    // Format name with title
    const displayName = useMemo(() => {
        const name = userName || 'Doctor';
        // Add Dr. prefix if it's a doctor role and name doesn't already have it
        if ((role === 'DOCTOR' || role === 'ADMIN') && !name.toLowerCase().startsWith('dr')) {
            return `Dr. ${name}`;
        }
        return name;
    }, [userName, role]);

    // Set greeting on client side only to avoid hydration mismatch
    useEffect(() => {
        setGreeting(getGreeting());
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                onNewTab();
            }
            if (e.ctrlKey && e.key === 'w') {
                e.preventDefault();
                const activeTab = tabs.find(t => t.id === activeTabId);
                if (activeTab?.closable) onTabClose(activeTabId);
            }
            if (e.ctrlKey && e.key === 'Tab') {
                e.preventDefault();
                const currentIndex = tabs.findIndex(t => t.id === activeTabId);
                const nextIndex = e.shiftKey
                    ? (currentIndex - 1 + tabs.length) % tabs.length
                    : (currentIndex + 1) % tabs.length;
                onTabClick(tabs[nextIndex].id);
            }
            if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName))) {
                e.preventDefault();
                document.getElementById('omnibox-input')?.focus();
            }
            if (e.ctrlKey && e.key === ',') {
                e.preventDefault();
                onOpenSettings?.();
            }
            if (e.ctrlKey && e.key === '1') {
                e.preventDefault();
                onTabClick('schedule');
            }
            if (e.ctrlKey && e.key === '2') {
                e.preventDefault();
                onTabClick('patients');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [tabs, activeTabId, onTabClick, onTabClose, onNewTab, onOpenSettings]);

    return (
        <div className="w-full h-screen bg-slate-100 flex flex-col overflow-hidden font-sans" suppressHydrationWarning>
            {/* ROW 1: Tabs Strip */}
            <div className="h-10 bg-[#dee1e6] flex items-end shrink-0 overflow-hidden" suppressHydrationWarning>
                <div className="w-2 shrink-0" />
                <div className="flex-1 min-w-0 h-full overflow-hidden">
                    <TabBar
                        tabs={tabs}
                        activeTabId={activeTabId}
                        onTabClick={onTabClick}
                        onTabClose={onTabClose}
                        onNewTab={onNewTab}
                    />
                </div>
            </div>

            {/* ROW 2: Navigation Toolbar */}
            <div className="h-12 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0 overflow-hidden" suppressHydrationWarning>
                {/* Home Button */}
                <button
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 shrink-0"
                    onClick={() => onTabClick('patients')}
                    title="Home (Ctrl+1)"
                >
                    <Home size={18} />
                </button>

                {/* Greeting - Left Aligned */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm text-slate-600">{greeting},</span>
                    <span className="text-sm font-bold text-slate-900">{displayName}!</span>
                </div>

                {/* Omnibox / Search Bar - Centered */}
                <div className="flex-1 min-w-0 max-w-xl mx-auto">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            id="omnibox-input"
                            suppressHydrationWarning
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearch?.(e.target.value)}
                            placeholder="Search patients... (Ctrl+K)"
                            className="w-full h-9 pl-9 pr-3 bg-slate-100 hover:bg-slate-200/80 focus:bg-white border-0 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:shadow-md"
                        />
                    </div>
                </div>

                {/* Right Side: Org + Settings + Logout */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Organization Badge - Modern */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                        {orgLogo ? (() => {
                            const resolved = orgLogo.startsWith('data:') || orgLogo.startsWith('http')
                                ? orgLogo
                                : `/api/capture-serve?path=${encodeURIComponent(orgLogo.startsWith('/') ? orgLogo.substring(1) : orgLogo)}`;
                            return (
                                <img src={resolved} className="w-5 h-5 rounded object-contain shrink-0" alt="Logo" />
                            );
                        })() : (
                            <Building2 size={14} className="text-slate-500" />
                        )}
                        <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">
                            {orgName || 'LoyalMed Clinic'}
                        </span>
                    </div>

                    {/* Settings Button */}
                    {onOpenSettings && (
                        <button
                            onClick={onOpenSettings}
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            title="User Settings"
                        >
                            <Settings size={20} />
                        </button>
                    )}

                    {/* Logout Button - Direct */}
                    <button
                        onClick={onLogout}
                        className="p-2 rounded-lg hover:bg-rose-50 transition-colors text-slate-400 hover:text-rose-600"
                        title="Sign Out"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <main className="flex-1 overflow-hidden bg-white relative">
                {children}
            </main>
        </div>
    );
}
