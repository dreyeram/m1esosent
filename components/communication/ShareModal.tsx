"use client";

import React, { useState } from "react";
import { generateShareLink, sendReportEmail } from "@/app/actions/communication";
import { X, Loader2, Send, Mail, MessageCircle, Check, Copy, AlertCircle, ExternalLink } from "lucide-react";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    procedureId: string;
    patientName: string;
    patientPhone?: string;
    patientEmail?: string;
}

export default function ShareModal({
    isOpen,
    onClose,
    procedureId,
    patientName,
    patientPhone,
    patientEmail
}: ShareModalProps) {
    const [activeTab, setActiveTab] = useState<"whatsapp" | "email">("whatsapp");
    const [phone, setPhone] = useState(patientPhone || "");
    const [email, setEmail] = useState(patientEmail || "");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [shareLink, setShareLink] = useState("");
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");
    const [fallbackUrl, setFallbackUrl] = useState("");

    if (!isOpen) return null;

    async function handleWhatsAppShare() {
        if (!phone.trim()) {
            setError("Please enter a phone number");
            return;
        }

        setLoading(true);
        setError("");
        setFallbackUrl("");

        try {
            // Step 1: Generate share link using server action (for DB writing)
            const linkResult = await generateShareLink({
                procedureId,
                recipient: phone.trim(),
                channel: "whatsapp"
            });

            if (!linkResult.success || !linkResult.url) {
                setError(linkResult.error || "Failed to generate share link");
                setLoading(false);
                return;
            }

            // Step 2: Construct message
            const cleanPhone = phone.trim().replace(/[\s\-\(\)]/g, "");
            const message = `Hello! Your medical report is ready. Please click the link below to view it securely:\n\n${linkResult.url}\n\nThis link will expire in 7 days.`;

            // Step 3: Call the WhatsApp API directly from browser
            // Using unified communication API
            const response = await fetch('/api/communication', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    service: 'whatsapp',
                    action: 'send',
                    phone: cleanPhone,
                    message: message,
                    procedureId: procedureId
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                // WhatsApp client not connected - offer fallback
                const fallback = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
                setFallbackUrl(fallback);
                setError(result.error || "WhatsApp is not connected. Please connect in Admin Settings → Communication.");
                setLoading(false);
                return;
            }

            // Success!
            setShareLink(linkResult.url);
            setSuccess(true);
        } catch (err: any) {
            console.error("WhatsApp share error:", err);
            setError(err.message || "An unexpected error occurred");
        }

        setLoading(false);
    }

    async function handleEmailShare() {
        if (!email.trim()) {
            setError("Please enter an email address");
            return;
        }

        setLoading(true);
        setError("");

        const result = await sendReportEmail({
            procedureId,
            email: email.trim()
        });

        setLoading(false);

        if (result.success) {
            setShareLink(result.shareLink || "");
            setSuccess(true);
        } else {
            setError(result.error || "Failed to send email");
        }
    }

    async function copyToClipboard() {
        if (shareLink) {
            await navigator.clipboard.writeText(shareLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    function openFallback() {
        if (fallbackUrl) {
            window.open(fallbackUrl, "_blank");
            setSuccess(true);
        }
    }

    function resetAndClose() {
        setSuccess(false);
        setShareLink("");
        setError("");
        setCopied(false);
        setFallbackUrl("");
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h2 className="text-lg font-bold text-white">Share Report</h2>
                    <button
                        onClick={resetAndClose}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Success State */}
                {success ? (
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {activeTab === "whatsapp" ? "Message Sent!" : "Email Sent!"}
                        </h3>
                        <p className="text-slate-400 text-sm mb-6">
                            {activeTab === "whatsapp"
                                ? "The report link has been sent via WhatsApp."
                                : "The email has been queued for delivery."}
                        </p>

                        {shareLink && (
                            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 mb-4">
                                <div className="text-xs text-slate-500 mb-2">Secure Link:</div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={shareLink}
                                        readOnly
                                        className="flex-1 bg-transparent text-slate-300 text-sm truncate"
                                    />
                                    <button
                                        onClick={copyToClipboard}
                                        className="text-slate-400 hover:text-white p-1"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={resetAndClose}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-medium"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Tabs */}
                        <div className="flex border-b border-slate-800">
                            <button
                                onClick={() => setActiveTab("whatsapp")}
                                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === "whatsapp"
                                    ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5"
                                    : "text-slate-500 hover:text-white"
                                    }`}
                            >
                                <MessageCircle className="w-4 h-4" />
                                WhatsApp
                            </button>
                            <button
                                onClick={() => setActiveTab("email")}
                                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === "email"
                                    ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5"
                                    : "text-slate-500 hover:text-white"
                                    }`}
                            >
                                <Mail className="w-4 h-4" />
                                Email
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="mb-4">
                                <div className="text-sm text-slate-400 mb-1">Sharing report for:</div>
                                <div className="text-white font-medium">{patientName}</div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm mb-4">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <div>
                                            <p>{error}</p>
                                            {fallbackUrl && (
                                                <button
                                                    onClick={openFallback}
                                                    className="mt-2 flex items-center gap-1 text-red-300 hover:text-white underline text-xs"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    Open WhatsApp Web instead
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "whatsapp" ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1.5">
                                            Phone Number (with country code)
                                        </label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+91 98765 43210"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <button
                                        onClick={handleWhatsAppShare}
                                        disabled={loading}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                        {loading ? "Sending..." : "Send via WhatsApp"}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1.5">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="patient@email.com"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                    <button
                                        onClick={handleEmailShare}
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Mail className="w-4 h-4" />
                                        )}
                                        {loading ? "Sending..." : "Send Email"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
