"use client";

import React from "react";
import { format } from "date-fns";
import {
    Calendar,
    Clock,
    FileText,
    CheckCircle,
    Play,
    ImageIcon,
    MoreVertical,
    AlertTriangle,
    ChevronRight,
    Eye
} from "lucide-react";
import { motion } from "framer-motion";
// Using native img for compatibility with base64/blob URLs

interface TimelineCardProps {
    procedure: any;
    media: any[];
    report: any;
    onViewReport: () => void;
    onSignReport?: () => void;
    onViewGallery: () => void;
    onContinue?: () => void;
}

const STATUS_CONFIG = {
    SCHEDULED: { color: "blue", label: "Scheduled", icon: Clock },
    CHECKED_IN: { color: "amber", label: "Checked In", icon: CheckCircle },
    IN_PROGRESS: { color: "purple", label: "In Progress", icon: Play },
    COMPLETED: { color: "emerald", label: "Completed", icon: CheckCircle },
    CANCELLED: { color: "slate", label: "Cancelled", icon: AlertTriangle },
};

export default function ProcedureTimelineCard({
    procedure,
    media,
    report,
    onViewReport,
    onSignReport,
    onViewGallery,
    onContinue
}: TimelineCardProps) {
    const [activeTab, setActiveTab] = React.useState<'images' | 'videos'>('images');

    const images = media.filter(m => m.type !== 'video');
    const videos = media.filter(m => m.type === 'video');

    const status = STATUS_CONFIG[procedure.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.SCHEDULED;
    const StatusIcon = status.icon;

    // Clean doctor name - simple and robust
    const doctorName = procedure.doctorName?.replace(/^(Dr\.?\s*)+/i, '') || '';

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="group relative pl-8 pb-8 last:pb-0"
        >
            {/* Timeline Line */}
            <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-slate-200 group-last:bg-transparent" />

            {/* Timeline Dot */}
            <div className={`absolute left-0 top-6 w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 
                ${procedure.status === 'COMPLETED' ? 'bg-emerald-500' :
                    procedure.status === 'IN_PROGRESS' ? 'bg-purple-500' :
                        'bg-blue-500'}`}
            />

            {/* Card Content */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Header */}
                <div className="p-5 flex items-start justify-between">
                    <div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1">
                            {procedure.type}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <Calendar size={14} />
                                {format(new Date(procedure.date), "MMMM d, yyyy")}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock size={14} />
                                {format(new Date(procedure.date), "h:mm a")}
                            </span>
                            {doctorName && (
                                <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium">
                                    Dr. {doctorName}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border
                        bg-${status.color}-50 text-${status.color}-700 border-${status.color}-100`}>
                        <StatusIcon size={12} />
                        {status.label}
                    </div>
                </div>

                {/* Media Section with Tabs */}
                {media.length > 0 && (
                    <div className="border-t border-slate-100 bg-slate-50/50">
                        {/* Tabs */}
                        <div className="flex items-center gap-6 px-5 border-b border-slate-100">
                            <button
                                onClick={() => setActiveTab('images')}
                                className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'images'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <ImageIcon size={14} />
                                Images ({images.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('videos')}
                                className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'videos'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <Play size={14} />
                                Videos ({videos.length})
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 overflow-x-auto">
                            {activeTab === 'images' && images.length > 0 ? (
                                <div className="flex gap-3">
                                    {images.map((item, idx) => (
                                        <div
                                            key={idx}
                                            onClick={onViewGallery}
                                            className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-slate-200 bg-white shadow-sm"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={item.url}
                                                alt="Thumbnail"
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : activeTab === 'videos' && videos.length > 0 ? (
                                <div className="flex gap-3">
                                    {videos.map((item, idx) => (
                                        <div
                                            key={idx}
                                            onClick={onViewGallery}
                                            className="relative w-32 h-24 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-slate-200 bg-slate-900 shadow-sm group/video"
                                        >
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover/video:scale-110 transition-transform">
                                                    <Play size={20} className="text-white fill-white" />
                                                </div>
                                            </div>
                                            {/* Video thumbnail would be better if available, but for now placeholder */}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-xs text-slate-400 italic">
                                    No {activeTab} recorded for this procedure.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions Footer */}
                <div className="bg-slate-50 border-t border-slate-100 p-3 flex items-center justify-between">
                    <div className="flex gap-2">
                        {report ? (
                            <button
                                onClick={onViewReport}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors"
                            >
                                <FileText size={14} />
                                {report.finalized ? "View Report" : "Draft Report"}
                            </button>
                        ) : procedure.status === 'COMPLETED' ? (
                            <button
                                onClick={onSignReport}
                                className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors"
                            >
                                <FileText size={14} />
                                Sign Report
                            </button>
                        ) : null}

                        {media.length > 0 && (
                            <button
                                onClick={onViewGallery}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-purple-600 hover:border-purple-200 transition-colors"
                            >
                                <ImageIcon size={14} />
                                Open Gallery
                            </button>
                        )}
                    </div>

                    {procedure.status === 'IN_PROGRESS' && (
                        <button
                            onClick={onContinue}
                            className="flex items-center gap-2 px-4 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 shadow-sm transition-colors"
                        >
                            <Play size={12} fill="white" />
                            Continue Procedure
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
