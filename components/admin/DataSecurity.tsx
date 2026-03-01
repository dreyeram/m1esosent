"use client";

import React, { useEffect, useState } from "react";
import { getAuditLogs, purgeAllData } from "@/app/actions/admin";
import {
    Shield, FileText, Download, RefreshCw,
    AlertTriangle, Loader2, Trash2
} from "lucide-react";

interface AuditLog {
    id: string;
    timestamp: string;
    eventType: string;
    action: string;
    username: string | null;
    success: boolean;
}

export default function DataSecurity() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [activeTab, setActiveTab] = useState<"audit" | "danger">("audit");

    // Danger Zone state
    const [confirmText, setConfirmText] = useState("");
    const [isPurging, setIsPurging] = useState(false);
    const [showPurgeModal, setShowPurgeModal] = useState(false);

    async function loadLogs() {
        setLoadingLogs(true);
        const result = await getAuditLogs(50);
        if (result.success && result.logs) {
            setLogs(result.logs as AuditLog[]);
        }
        setLoadingLogs(false);
    }

    useEffect(() => {
        loadLogs();
    }, []);

    function exportLogsAsCSV() {
        if (logs.length === 0) {
            alert("No logs to export");
            return;
        }

        const csvContent = "data:text/csv;charset=utf-8,"
            + "Timestamp,Event,Action,User,Status\n"
            + logs.map(log =>
                `"${log.timestamp}","${log.eventType}","${log.action}","${log.username || 'System'}","${log.success ? 'Success' : 'Failed'}"`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async function handlePurge() {
        if (confirmText !== "DELETE ALL") return;

        setIsPurging(true);
        const result = await purgeAllData();
        setIsPurging(false);

        if (result.success) {
            alert("All patient data has been purged successfully.");
            setShowPurgeModal(false);
            setConfirmText("");
            loadLogs(); // Refresh to show purge event
        } else {
            alert(result.error || "Failed to purge data");
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center gap-5 p-2">
                <div className="p-4 bg-indigo-100 rounded-[1.5rem] text-indigo-600 shadow-inner">
                    <Shield size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Data & Security</h2>
                    <p className="text-slate-500 text-xs font-medium mt-1 uppercase tracking-wider">Audit Trails & Integrity</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 p-1.5 bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl shadow-lg shadow-slate-200/40 w-fit">
                <button
                    onClick={() => setActiveTab("audit")}
                    className={`px-8 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all flex items-center gap-3 ${activeTab === "audit"
                        ? "bg-white text-indigo-700 shadow-md ring-1 ring-black/5"
                        : "text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <FileText className="w-4 h-4" />
                    Audit Logs
                </button>
                <button
                    onClick={() => setActiveTab("danger")}
                    className={`px-8 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all flex items-center gap-3 ${activeTab === "danger"
                        ? "bg-white text-rose-600 shadow-md ring-1 ring-black/5"
                        : "text-rose-400 group-hover:text-rose-500"
                        }`}
                >
                    <AlertTriangle className="w-4 h-4" />
                    Danger Zone
                </button>
            </div>

            {/* Content Container */}
            <div className="view-enter">
                {/* Audit Logs Tab */}
                {activeTab === "audit" && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center px-2">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-4">
                                <span className="w-2 h-8 bg-indigo-500 rounded-full" />
                                System Activity
                            </h3>
                            <div className="flex gap-3">
                                <button
                                    onClick={loadLogs}
                                    className="p-3 text-slate-400 hover:text-indigo-600 bg-white border border-slate-100 hover:border-indigo-100 rounded-xl transition-all shadow-sm hover:shadow-lg active:scale-95"
                                    title="Refresh"
                                >
                                    <RefreshCw className={`w-5 h-5 ${loadingLogs ? 'animate-spin' : ''}`} />
                                </button>
                                <button
                                    onClick={exportLogsAsCSV}
                                    className="flex items-center gap-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-100 px-6 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider shadow-sm hover:shadow-lg transition-all"
                                >
                                    <Download className="w-4 h-4" />
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        <div className="bg-white/40 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/60 transition-all">
                            {loadingLogs ? (
                                <div className="p-32 text-center text-slate-400">
                                    <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-6" />
                                    <p className="font-black uppercase tracking-widest text-[10px] animate-pulse">Scanning audit history...</p>
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="p-32 text-center text-slate-400">
                                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner mx-auto">
                                        <Shield className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-2">No activity recorded</h3>
                                    <p className="text-sm font-medium mx-auto">System events will appear here as they occur.</p>
                                </div>
                            ) : (
                                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-white/90 backdrop-blur-md z-10">
                                            <tr className="border-b border-white text-xs uppercase font-semibold tracking-wider text-slate-400">
                                                <th className="px-10 py-6">Timestamp</th>
                                                <th className="px-10 py-6">Event</th>
                                                <th className="px-10 py-6">User</th>
                                                <th className="px-10 py-6">Details</th>
                                                <th className="px-10 py-6 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/50">
                                            {logs.map((log) => (
                                                <tr key={log.id} className="hover:bg-white/60 transition-all group">
                                                    <td className="px-10 py-6 text-slate-400 font-semibold text-xs tracking-wider whitespace-nowrap">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <span className="font-semibold text-slate-800 tracking-tight group-hover:text-indigo-700 transition-colors">{log.eventType}</span>
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <span className="text-indigo-600 font-medium bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 text-xs uppercase tracking-wider">
                                                            {log.username || 'System'}
                                                        </span>
                                                    </td>
                                                    <td className="px-10 py-6 text-slate-500 text-sm font-medium truncate max-w-[200px]">
                                                        {log.action}
                                                    </td>
                                                    <td className="px-10 py-6 text-right">
                                                        {log.success
                                                            ? <span className="text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 text-xs font-semibold tracking-wider">SUCCESS</span>
                                                            : <span className="text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 text-xs font-semibold tracking-wider">FAILED</span>
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Danger Zone Tab */}
                {activeTab === "danger" && (
                    <div className="bg-rose-50/50 backdrop-blur-md border border-rose-100 rounded-[3rem] p-12 shadow-xl shadow-rose-900/5 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-start gap-8">
                            <div className="p-6 bg-rose-100 rounded-[2rem] text-rose-600 shadow-inner">
                                <AlertTriangle className="w-12 h-12" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-semibold text-slate-800 mb-2 tracking-tight">Destructive Actions</h3>
                                <p className="text-slate-500 font-medium mb-12 max-w-2xl text-lg underline decoration-rose-200 underline-offset-8">
                                    Warning: These actions are non-reversible and will permanently erase data.
                                </p>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-8 bg-white border border-rose-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group">
                                        <div className="flex items-center gap-6">
                                            <div className="p-4 bg-rose-50 rounded-2xl text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all">
                                                <Trash2 size={24} />
                                            </div>
                                            <div>
                                                <div className="text-slate-900 font-semibold text-lg tracking-tight">Purge All Patient Data</div>
                                                <div className="text-slate-400 text-sm font-medium mt-1">
                                                    Deletes all patients, procedures, reports, and media files.
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowPurgeModal(true)}
                                            className="bg-white hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-100 px-8 py-4 rounded-2xl font-semibold text-sm uppercase tracking-wider transition-all shadow-sm hover:shadow-xl hover:shadow-rose-900/20 active:scale-95 ml-8"
                                        >
                                            Purge Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Purge Confirmation Modal */}
            <AnimatePresence>
                {showPurgeModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPurgeModal(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-xl bg-white/95 backdrop-blur-2xl border border-rose-100 rounded-[3.5rem] shadow-[0_32px_128px_-16px_rgba(159,18,57,0.2)] overflow-hidden"
                        >
                            <div className="p-12 text-center">
                                <div className="w-24 h-24 bg-rose-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-rose-600 shadow-inner">
                                    <AlertTriangle size={48} />
                                </div>
                                <h3 className="text-2xl font-semibold text-slate-800 mb-4 tracking-tight">Final Confirmation</h3>
                                <p className="text-slate-500 font-medium mb-10 leading-relaxed px-4">
                                    This will permanently delete <span className="text-rose-600 font-semibold">ALL</span> records and media.
                                    This action <span className="underline decoration-rose-300 decoration-2">cannot be undone</span>.
                                </p>

                                <div className="space-y-6 mb-10">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                                        Type <span className="text-rose-600 underline">DELETE ALL</span> to proceed
                                    </label>
                                    <input
                                        type="text"
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value)}
                                        className="w-full bg-rose-50/50 border border-rose-100 rounded-3xl px-8 py-6 text-rose-600 placeholder:text-rose-200 font-semibold text-center text-2xl tracking-widest uppercase focus:outline-none focus:ring-8 focus:ring-rose-500/5 transition-all"
                                        placeholder="REQUIRED"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            setShowPurgeModal(false);
                                            setConfirmText("");
                                        }}
                                        className="flex-1 py-6 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-[2rem] font-semibold uppercase tracking-wider transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handlePurge}
                                        disabled={confirmText !== "DELETE ALL" || isPurging}
                                        className="flex-[2] py-6 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-[2rem] font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-3 shadow-2xl shadow-rose-500/30 active:scale-95"
                                    >
                                        {isPurging ? <Loader2 className="w-6 h-6 animate-spin" /> : <Trash2 size={24} />}
                                        {isPurging ? "Purging..." : "Confirm Purge"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

import { AnimatePresence, motion } from "framer-motion";
