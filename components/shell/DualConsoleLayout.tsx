"use client";

import React from "react";

interface DualConsoleLayoutProps {
    leftPanel: React.ReactNode;
    rightPanel: React.ReactNode;
    isSheetOpen?: boolean;
    // New Props for Controlled State
    focusedPanel?: 'left' | 'right' | 'both';
    onFocusChange?: (panel: 'left' | 'right' | 'both') => void;
}

export default function DualConsoleLayout({
    leftPanel,
    rightPanel,
    isSheetOpen = false,
}: DualConsoleLayoutProps) {
    return (
        <div className={`h-full w-full flex overflow-hidden relative transition-all duration-1000 ${isSheetOpen ? 'is-active-sheet' : ''}`}>

            {/* Left Console: The Roster */}
            <div className="h-full flex flex-col relative group flex-[65]">
                <div className="flex-1 overflow-hidden">
                    {leftPanel}
                </div>
            </div>

            {/* Right Console: The Intake Form */}
            <div className="h-full flex flex-col relative group flex-[35]">
                <div className="flex-1 overflow-hidden">
                    {rightPanel}
                </div>
            </div>
        </div>
    );
}
