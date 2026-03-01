"use client";

import React, { useState, useEffect } from "react";
import { X, Download, Share2, Mail, MessageCircle, Loader2, FileText, Send, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generatePDF } from "@/lib/ReportGenerator";
import { sendReportEmail } from "@/app/actions/communication";

interface ReportPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: {
        id: string;
        procedureId?: string;
        procedureType: string;
        date: Date | string;
        content: string; // JSON string of report data
        doctorName?: string;
    } | null;
    patient: {
        id: string;
        name?: string;
        fullName?: string;
        age?: number;
        gender?: string;
        mrn?: string;
    } | null;
    organizationName?: string;
    onShare?: (report: any) => void;
}

export default function ReportPreviewModal({
    isOpen,
    onClose,
    report,
    patient,
    organizationName = "Endoscopy Center",
    onShare
}: ReportPreviewModalProps) {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Email Share State
    const [isEmailShareOpen, setIsEmailShareOpen] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState("");
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailSuccess, setEmailSuccess] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && report && patient) {
            generatePreview();
        } else {
            setPdfUrl(null);
        }

        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [isOpen, report?.id]);

    const generatePreview = async () => {
        if (!report || !patient) {
            setError("Missing report or patient data");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            // Parse the report content - this is the full saved reportData
            const savedData = JSON.parse(report.content || '{}');
            console.log("[ReportPreviewModal] Generating preview with saved data:", savedData);

            // The saved data structure is: { formData, captures, imageCaptions, selectedImages, ... }
            // Extract the formData or use the saved data itself if it contains form fields directly
            let formData = savedData.formData || savedData;

            // 1. Check for modern 'segments' structure (The source of truth)
            let reportSegments = savedData.segments;

            // 2. Fallback for legacy reports: Reconstruct single segment
            if (!reportSegments || !Array.isArray(reportSegments) || reportSegments.length === 0) {
                console.warn("[ReportPreviewModal] Legacy report structure detected. Reconstructing segment...");

                // Improve title formatting: "NASAL_ENDOSCOPY" -> "NASAL ENDOSCOPY REPORT"
                const typeLabel = (report.procedureType || 'UNDEFINED').replace(/_/g, ' ');
                const title = typeLabel.toUpperCase().endsWith('REPORT')
                    ? typeLabel.toUpperCase()
                    : `${typeLabel.toUpperCase()} REPORT`;

                reportSegments = [{
                    procedureId: report.procedureId || report.id,
                    procedureType: report.procedureType,
                    title: title,
                    formData: formData,
                    selectedImages: savedData.selectedImages || formData.selectedImages || [],
                    imageCaptions: savedData.imageCaptions || formData.imageCaptions || {},
                    captures: savedData.captures || formData.captures || []
                }];
            }

            // Generate PDF blob
            const pdfBlob = await generatePDF({
                patient: {
                    ...patient,
                    fullName: patient.name || patient.fullName,
                    name: patient.name || patient.fullName,
                    procedureType: report.procedureType
                },
                doctor: {
                    name: report.doctorName || "Doctor",
                    sign: ""
                },
                hospital: {
                    name: organizationName,
                    address: savedData.hospital?.address || "",
                    mobile: savedData.hospital?.mobile || "",
                    email: savedData.hospital?.email || ""
                },
                segments: reportSegments,
                action: 'preview'
            });

            // Create blob URL for iframe preview
            const url = URL.createObjectURL(pdfBlob);
            setPdfUrl(url);
        } catch (e) {
            console.error("Failed to generate PDF preview:", e);
            setError("Failed to generate PDF. The report data may be corrupted.");
        }

        setIsGenerating(false);
    };

    const handleDownload = async () => {
        if (!report || !patient) return;

        try {
            const savedData = JSON.parse(report.content || '{}');
            const formData = savedData.formData || savedData;

            await generatePDF({
                patient: {
                    ...patient,
                    fullName: patient.name || patient.fullName,
                    name: patient.name || patient.fullName,
                    procedureType: report.procedureType
                },
                doctor: {
                    name: report.doctorName || "Doctor",
                    sign: ""
                },
                hospital: {
                    name: organizationName,
                    address: savedData.hospital?.address || "",
                    mobile: savedData.hospital?.mobile || "",
                    email: savedData.hospital?.email || ""
                },
                segments: savedData.segments || [{
                    procedureId: report.procedureId || report.id,
                    procedureType: report.procedureType,
                    title: (report.procedureType || 'UNDEFINED').replace(/_/g, ' ').toUpperCase() + " REPORT",
                    formData: formData,
                    selectedImages: savedData.selectedImages || formData.selectedImages || [],
                    imageCaptions: savedData.imageCaptions || formData.imageCaptions || {},
                    captures: savedData.captures || formData.captures || []
                }],
                action: 'download'
            });
        } catch (e) {
            console.error("Failed to download PDF:", e);
            alert("Failed to download PDF");
        }
    };


    const handleEmailShare = async () => {
        if (!report || !recipientEmail) return;

        setIsSendingEmail(true);
        setEmailError(null);
        setEmailSuccess(false);

        try {
            const result = await sendReportEmail({
                procedureId: report.procedureId || report.id,
                email: recipientEmail
            });

            if (result.success) {
                setEmailSuccess(true);
                setTimeout(() => {
                    setIsEmailShareOpen(false);
                    setEmailSuccess(false);
                    setRecipientEmail("");
                }, 2000);
            } else {
                setEmailError(result.error || "Failed to send email");
            }
        } catch (e) {
            setEmailError("An unexpected error occurred");
        } finally {
            setIsSendingEmail(false);
        }
    };

    const handleOpenInNewTab = () => {
        // Disabled in kiosk mode - just trigger download instead
        handleDownload();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: "spring", duration: 0.3 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900">
                                    {report?.procedureType} Report
                                </h2>
                                <p className="text-xs text-slate-500">
                                    {patient?.name} • {report?.doctorName}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDownload}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-colors"
                            >
                                <Download size={16} /> Download
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors ml-2"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* PDF Preview Area */}
                    <div className="flex-1 bg-slate-800 relative">
                        {isGenerating && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
                                <div className="text-center">
                                    <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
                                    <p className="text-white font-medium">Generating PDF Preview...</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center p-8">
                                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <X className="text-rose-500" size={32} />
                                    </div>
                                    <p className="text-white font-medium mb-2">Preview Failed</p>
                                    <p className="text-slate-400 text-sm">{error}</p>
                                    <button
                                        onClick={generatePreview}
                                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        )}

                        {pdfUrl && !isGenerating && !error && (
                            <>
                                <iframe
                                    src={pdfUrl}
                                    className="w-full h-full border-0"
                                    title="PDF Preview"
                                />
                                {/* KIOSK-SAFE: Floating Close Button */}
                                <button
                                    onClick={onClose}
                                    className="absolute bottom-6 right-6 z-50 px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-lg rounded-2xl shadow-2xl flex items-center gap-3 transition-all hover:scale-105"
                                >
                                    <X size={24} />
                                    CLOSE
                                </button>
                            </>
                        )}

                        {!pdfUrl && !isGenerating && !error && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-slate-400">No PDF to display</p>
                            </div>
                        )}
                    </div>

                    {/* Footer with sharing options */}
                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div className="text-xs text-slate-400">
                            Report ID: {report?.id?.slice(0, 8)}...
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 mr-2">Share via:</span>
                            <button
                                onClick={() => onShare && onShare(report)}
                                className="p-2 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
                                title="WhatsApp"
                            >
                                <MessageCircle size={16} />
                            </button>
                            <button
                                onClick={() => setIsEmailShareOpen(true)}
                                className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                title="Email"
                            >
                                <Mail size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Email Share Overlay */}
                    <AnimatePresence>
                        {isEmailShareOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="absolute bottom-20 right-4 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-[10000]"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                        <Mail size={14} className="text-blue-500" />
                                        Share via Email
                                    </h4>
                                    <button
                                        onClick={() => setIsEmailShareOpen(false)}
                                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>

                                {emailSuccess ? (
                                    <div className="py-4 text-center">
                                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <Check size={20} />
                                        </div>
                                        <p className="text-emerald-700 font-bold text-sm">Report sent successfully!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                Recipient Email
                                            </label>
                                            <input
                                                type="email"
                                                value={recipientEmail}
                                                onChange={e => setRecipientEmail(e.target.value)}
                                                placeholder="patient@example.com"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                autoFocus
                                            />
                                        </div>

                                        {emailError && (
                                            <p className="text-[10px] text-rose-500 font-bold bg-rose-50 p-2 rounded-lg border border-rose-100">
                                                {emailError}
                                            </p>
                                        )}

                                        <button
                                            onClick={handleEmailShare}
                                            disabled={isSendingEmail || !recipientEmail}
                                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
                                        >
                                            {isSendingEmail ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                            {isSendingEmail ? 'Sending...' : 'Send Report'}
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence >
    );
}
