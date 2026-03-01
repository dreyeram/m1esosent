"use client";

import React, { useState, useEffect } from 'react';
import { useSettings } from "@/contexts/SettingsContext"; // Assume used for some global settings if needed, or local
import { AlertCircle, HardDrive, Download, Upload, RefreshCw, Folder, File, ArrowLeft } from 'lucide-react';

interface FileItem {
    name: string;
    path: string;
    type: 'drive' | 'directory' | 'file';
    size?: number;
    mtime?: string;
}

export default function DataManagement() {
    const [isLocalDriveDisabled, setIsLocalDriveDisabled] = useState(false);
    const [browserPath, setBrowserPath] = useState<string>('root');
    const [items, setItems] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [mode, setMode] = useState<'none' | 'import_logo' | 'import_header' | 'export_backup'>('none');

    useEffect(() => {
        if (mode !== 'none') {
            fetchItems('root');
        }
    }, [mode]);

    const fetchItems = async (path: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/storage?path=${encodeURIComponent(path)}`);
            const data = await res.json();
            if (data.success) {
                setItems(data.items);
                setBrowserPath(path);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleItemClick = (item: FileItem) => {
        if (item.type === 'directory' || item.type === 'drive') {
            fetchItems(item.path);
        } else {
            setSelectedFile(item);
        }
    };

    const handleBack = () => {
        if (browserPath === 'root') return;
        // Simple parent calculation (very basic, assumes Windows/Linux separators)
        // For 'root', we stay root. 
        // If path is a drive 'E:\', parent is 'root'.
        // If path is '/media/pi', parent is '/media' (but we might want to go to root if restrictive)

        // Better: just go to root for now if we don't implement full path parsing
        fetchItems('root');
    };

    const handleAction = async () => {
        if (!selectedFile && mode.startsWith('import')) return;

        // Mock Implementation for now -> In real app, we would POST to /api/storage
        if (mode === 'import_logo' || mode === 'import_header') {
            if (selectedFile) {
                const dest = mode === 'import_logo' ? '/public/uploads/logo.png' : '/public/uploads/header.png'; // Example
                try {
                    const res = await fetch('/api/storage', {
                        method: 'POST',
                        body: JSON.stringify({ action: 'copy', sourcePath: selectedFile.path, destPath: dest })
                    });
                    const data = await res.json();
                    if (data.success) {
                        alert(`Successfully imported ${selectedFile.name}`);
                    } else {
                        alert(`Import failed: ${data.error}`);
                    }
                } catch (e) {
                    alert(`Import error: ${e}`);
                }
            }
        } else if (mode === 'export_backup') {
            // For export, we need a directory, not a file. 
            // Current browsing logic selects files. 
            // We'll assume exporting to current browserPath
            alert(`Exporting backup to ${browserPath}...`);
        }
        setMode('none');
    };

    return (
        <div className="space-y-8 p-6">
            {/* 1. Drive Security */}
            <section className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-blue-500" />
                    Storage Configuration
                </h3>

                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">Disable Local Drive Access</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Restrict import/export operations to External USB Drives only.
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={isLocalDriveDisabled}
                            onChange={(e) => setIsLocalDriveDisabled(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </section>

            {/* 2. Operations */}
            <section className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-green-500" />
                    Data Operations
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setMode('import_logo')}
                        className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col items-center gap-2 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Upload className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Import Logo</span>
                    </button>

                    <button
                        onClick={() => setMode('import_header')}
                        className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col items-center gap-2 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <File className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Import Header/Footer</span>
                    </button>

                    <button
                        onClick={() => setMode('export_backup')}
                        className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col items-center gap-2 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                            <Download className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Export Backup</span>
                    </button>
                </div>
            </section>

            {/* File Browser Modal (Embedded) */}
            {mode !== 'none' && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button onClick={handleBack} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <span className="font-mono text-sm truncate max-w-[300px]">{browserPath}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                {mode.replace('_', ' ')}
                            </span>
                            <button onClick={() => setMode('none')} className="text-xs text-red-500 hover:text-red-600">Cancel</button>
                        </div>
                    </div>

                    <div className="h-[300px] overflow-y-auto p-2 space-y-1">
                        {loading ? (
                            <div className="text-center py-10 text-slate-500">Loading...</div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">No text files found</div>
                        ) : (
                            items.map((item, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleItemClick(item)}
                                    className={`flex items-center gap-3 p-2 rounded cursor-pointer ${selectedFile?.path === item.path ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    {item.type === 'drive' ? <HardDrive className="w-4 h-4 text-slate-400" /> :
                                        item.type === 'directory' ? <Folder className="w-4 h-4 text-yellow-500" /> :
                                            <File className="w-4 h-4 text-slate-400" />}
                                    <span className="text-sm truncate flex-1">{item.name}</span>
                                    {item.size && <span className="text-xs text-slate-400">{(item.size / 1024).toFixed(1)} KB</span>}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                        <button
                            onClick={handleAction}
                            disabled={!selectedFile && !mode.includes('export')} // Export might be dir based
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirm {mode.split('_')[0]}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
