"use client";

import React from 'react';
// import { motion, AnimatePresence } from 'framer-motion'; // Performance Optimization
import { X, Plus } from 'lucide-react';
import { Tab } from '@/hooks/useTabManager';

interface TabBarProps {
    tabs: Tab[];
    activeTabId: string;
    onTabClick: (tabId: string) => void;
    onTabClose: (tabId: string) => void;
    onNewTab: () => void;
}

export default function TabBar({ tabs, activeTabId, onTabClick, onTabClose, onNewTab }: TabBarProps) {
    return (
        <div className="flex items-end h-full flex-1 min-w-0 overflow-hidden px-1 gap-1 pt-2" suppressHydrationWarning>
            {tabs.map((tab) => (
                <div
                    key={tab.id}
                    className="relative h-full shrink-0 group animate-in fade-in zoom-in-95 duration-150"
                >
                    <button
                        onClick={() => onTabClick(tab.id)}
                        className={`
                            group relative flex items-center gap-2 px-3 py-2 rounded-t-lg text-xs font-medium h-[34px]
                            transition-all duration-200 whitespace-nowrap
                            ${activeTabId === tab.id
                                ? 'bg-white text-slate-800 shadow-sm z-10'
                                : 'bg-transparent text-slate-600 hover:bg-white/50'
                            }
                        `}
                    >
                        {/* Visual connector for active tab */}
                        {activeTabId === tab.id && (
                            <>
                                <div className="absolute -bottom-1 -left-2 w-2 h-2 bg-transparent shadow-[2px_2px_0_white] rounded-br-full" />
                                <div className="absolute -bottom-1 -right-2 w-2 h-2 bg-transparent shadow-[-2px_2px_0_white] rounded-bl-full" />
                            </>
                        )}

                        {/* Icon */}
                        <span className={`text-base shrink-0 ${activeTabId === tab.id ? 'text-blue-600' : 'text-slate-500'}`}>
                            {tab.icon}
                        </span>

                        {/* Label */}
                        <span className="truncate max-w-[100px]">{tab.label}</span>

                        {/* Close button */}
                        {tab.closable && (
                            <span
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTabClose(tab.id);
                                }}
                                className={`
                                    shrink-0 w-4 h-4 rounded-full flex items-center justify-center
                                    transition-all duration-150 ml-1
                                    ${activeTabId === tab.id
                                        ? 'opacity-0 group-hover:opacity-100 hover:bg-slate-200 text-slate-500'
                                        : 'opacity-0 group-hover:opacity-100 hover:bg-slate-300/50 text-slate-500'
                                    }
                                `}
                            >
                                <X size={10} strokeWidth={3} />
                            </span>
                        )}
                    </button>
                </div>
            ))}

            {/* New Tab Button */}
            <button
                onClick={onNewTab}
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white/60 transition-colors ml-1 mb-1"
                title="New Patient (Ctrl+N)"
            >
                <Plus size={16} strokeWidth={2.5} />
            </button>
        </div>
    );
}
