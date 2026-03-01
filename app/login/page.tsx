"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Eye, EyeOff, ArrowRight, Lock, Command } from "lucide-react";
import { loginUser } from "@/app/actions/auth";
import { getDefaultOrganization } from "@/app/actions/settings";
import { useRouter } from "next/navigation";
import { resolveImageUrl } from "@/lib/utils/image";

// --- Configuration ---
const DEFAULT_CONFIG = {
    appName: "Endoscopy Suite",
    appTagline: "Medical Imaging System",
    logoFallbackColor: "from-blue-600 to-indigo-600"
};


type Phase = "splash" | "login";

interface OrgBranding {
    name: string;
    logoPath: string | null;
}

export default function LoginPage() {
    const router = useRouter();

    const [branding, setBranding] = useState<OrgBranding>({ name: DEFAULT_CONFIG.appName, logoPath: null });
    const [phase, setPhase] = useState<Phase>("splash"); // Start with splash
    const [loginCreds, setLoginCreds] = useState({ user: '', pass: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [logoError, setLogoError] = useState(false);

    // Fetch organization branding
    useEffect(() => {
        async function fetchBranding() {
            try {
                const result = await getDefaultOrganization();
                if (result.success && result.organization) {
                    setBranding({
                        name: result.organization.name || DEFAULT_CONFIG.appName,
                        logoPath: result.organization.logoPath || null
                    });
                }
            } catch (e) {
                console.error("Failed to fetch branding:", e);
            }
        }
        fetchBranding();
    }, []);

    // Transition to login after delay
    useEffect(() => {
        const timer = setTimeout(() => setPhase("login"), 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleLogin = async () => {
        if (!loginCreds.user || !loginCreds.pass) {
            setError("Please enter your credentials");
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const result = await loginUser(loginCreds.user, loginCreds.pass);
            if (result.success && result.user) {
                switch (result.user.role) {
                    case 'ADMIN': router.push('/admin'); break;
                    case 'DOCTOR': router.push('/doctor'); break;
                    case 'ASSISTANT': router.push('/assistant'); break;
                    default: setError("Access denied");
                }
            } else {
                setError(result.error || "Invalid credentials");
            }
        } catch (e) {
            console.error(e);
            setError("Connection failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleLogin();
    };

    // 1. Splash Screen Render
    if (phase === "splash") {
        return (
            <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
                <div className="w-24 h-24 mb-6 rounded-2xl bg-white shadow-xl border border-slate-100 flex items-center justify-center p-4">
                    {resolveImageUrl(branding.logoPath) && !logoError ? (
                        <img
                            src={resolveImageUrl(branding.logoPath)!}
                            alt="Logo"
                            className="w-full h-full object-contain"
                            onError={() => setLogoError(true)}
                        />
                    ) : (
                        <Command className="w-10 h-10 text-blue-600" />
                    )}
                </div>
                <h1 className="text-xl font-bold text-slate-800">{branding.name}</h1>
                <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    <Lock size={12} /> Loading Secure Environment
                </div>
            </div>
        );
    }

    // 2. Login Screen Render
    return (
        <div className="min-h-screen aurora-bg font-sans flex items-center justify-center p-6 text-slate-800">
            <div className="w-full max-w-[420px] relative z-10">
                {/* Floating Glass Card */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl rounded-[2rem] p-8 sm:p-10 relative overflow-hidden">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center">
                            {resolveImageUrl(branding.logoPath) && !logoError ? (
                                <img
                                    src={resolveImageUrl(branding.logoPath)!}
                                    alt="Logo"
                                    className="w-10 h-10 object-contain"
                                    onError={() => setLogoError(true)}
                                />
                            ) : (
                                <Command className="w-8 h-8 text-blue-600" />
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Welcome</h1>
                        <p className="text-slate-500 text-sm mt-1">Sign in to {branding.name}</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex items-center justify-center">
                            {error}
                        </div>
                    )}

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-1">Username</label>
                            <input
                                value={loginCreds.user}
                                onChange={e => setLoginCreds({ ...loginCreds, user: e.target.value })}
                                onKeyPress={handleKeyPress}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 font-medium placeholder:text-slate-400"
                                placeholder="Enter username"
                                autoComplete="username"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={loginCreds.pass}
                                    onChange={e => setLoginCreds({ ...loginCreds, pass: e.target.value })}
                                    onKeyPress={handleKeyPress}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pr-12 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 font-medium placeholder:text-slate-400"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="w-full mt-8 py-4 rounded-xl bg-slate-900 text-white font-bold shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <span className="animate-pulse">Verifying...</span>
                        ) : (
                            <>
                                Sign In <ArrowRight size={16} />
                            </>
                        )}
                    </button>

                    {/* Footer */}
                    <div className="mt-8 flex justify-center">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1 rounded-full bg-slate-50 border border-slate-100">
                            <ShieldCheck size={12} /> Secure
                        </div>
                    </div>
                </div>

                <div className="text-center mt-8 text-xs text-slate-400 font-medium">
                    © {new Date().getFullYear()} {DEFAULT_CONFIG.appName}
                </div>
            </div>
        </div>
    );
}
