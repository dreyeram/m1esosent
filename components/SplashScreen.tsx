"use client";

import React, { useEffect, useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion'; // Performance Optimization
import { Activity, Radio, Cpu, CheckCircle2 } from 'lucide-react';

interface SplashScreenProps {
    onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("Initializing...");

    useEffect(() => {
        // Fast Progress simulation
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 5; // Much faster increment
            });
        }, 30); // Faster interval

        // Status text sequence - Shortened
        const timeouts = [
            setTimeout(() => { setStatusText("Loading Core..."); }, 300),
            setTimeout(() => { setStatusText("System Ready"); }, 800),
            setTimeout(() => onComplete(), 1200) // Total time ~1.2s instead of 4.8s
        ];

        return () => {
            clearInterval(interval);
            timeouts.forEach(clearTimeout);
        };
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col items-center justify-center font-sans overflow-hidden">
            {/* Simple Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-black to-black" />

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-md animate-in fade-in duration-500">
                {/* Logo Container */}
                <div className="relative w-32 h-32 mb-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <img
                        src="/logo-hd.jpg"
                        alt="LoyalMed Logo"
                        className="w-20 h-20 object-contain"
                    />
                </div>

                {/* Company Name */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black tracking-widest uppercase text-white mb-1">
                        Loyal<span className="text-blue-500">Med</span>
                    </h1>
                </div>

                {/* Loading Bar */}
                <div className="w-64 h-1 bg-zinc-800 rounded-full overflow-hidden relative mb-4">
                    <div
                        className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-100 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Status Text */}
                <div className="flex items-center gap-2">
                    <Activity size={14} className="text-blue-500" />
                    <span className="text-xs font-mono text-zinc-400">{statusText}</span>
                </div>
            </div>
        </div>
    );
}
