"use client"
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    X, Trash2, RotateCw, Save, MousePointer2, Pen, Sticker, Undo2, Redo2, CheckCircle2,
    MoveUpRight, CheckSquare, Square, Circle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
    Image as ImageIcon, Video, Edit3, Trash, Camera, Play, Pause, Loader2, FileImage, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveMediaMetadata, getProcedureMedia } from '@/app/actions/procedure';
import { getAllTemplates, type AnatomyTemplate } from '@/data/entTemplates';
import { getTags, createTag } from '@/app/actions/tags';
import { useSessionStore } from '@/lib/store/session.store';

interface Tag { id: string; label: string; color: string; }
const MOCK_TAGS: Tag[] = [
    { id: 'normal', label: 'Normal', color: '#10b981' },
    { id: 'polyp', label: 'Polyp', color: '#ef4444' },
    { id: 'inflammation', label: 'Inflammation', color: '#f59e0b' },
    { id: 'discharge', label: 'Discharge', color: '#8b5cf6' },
    { id: 'deviated', label: 'Deviated Septum', color: '#3b82f6' },
    { id: 'edema', label: 'Edema', color: '#ec4899' },
    { id: 'mass', label: 'Mass/Tumor', color: '#dc2626' },
    { id: 'foreign', label: 'Foreign Body', color: '#6366f1' },
    { id: 'scarring', label: 'Scarring', color: '#78716c' },
    { id: 'hypertrophy', label: 'Hypertrophy', color: '#0891b2' },
    { id: 'bleeding', label: 'Bleeding', color: '#be123c' },
    { id: 'ulcer', label: 'Ulcer', color: '#fbbf24' },
    { id: 'granulation', label: 'Granulation', color: '#be185d' },
    { id: 'fungal', label: 'Fungal Debris', color: '#a21caf' },
];

// --- Types ---
type Tool = 'select' | 'pen' | 'arrow' | 'rect' | 'circle' | 'tag';
type SidebarTab = 'images' | 'videos' | 'annotated' | 'trashed';

interface ShapeBase {
    id: string;
    type: string;
    x: number;
    y: number;
    rotation: number;
    opacity: number;
    color: string;
    thickness: number;
}

interface PathShape extends ShapeBase {
    type: 'path';
    points: { x: number, y: number }[];
    w: number;
    h: number;
}

interface RectShape extends ShapeBase {
    type: 'rect' | 'circle';
    w: number;
    h: number;
}

interface ArrowShape extends ShapeBase {
    type: 'arrow';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface PinShape extends ShapeBase {
    type: 'pin';
    text: string;
}

type Shape = PathShape | RectShape | ArrowShape | PinShape;

export interface Capture {
    id: string;
    url: string;
    timestamp: string;
    type?: 'image' | 'video';
    category?: 'raw' | 'polyp' | 'ulcer' | 'inflammation' | 'bleeding' | 'tumor' | 'other' | 'report';
    deleted?: boolean;
    procedureId?: string; // Added to track which procedure this belongs to
}

interface AdvancedImageSuiteProps {
    captures: Capture[]; // Initial captures (legacy/prop fallback)
    onUpdateCaptures: (captures: Capture[]) => void;
    onClose: () => void;
    onGenerateReport?: (selectedIds: string[]) => void;
    initialImageId?: string;
    initialSelectedIds?: string[];
    procedureId?: string;  // Fallback procedureId
}

// ENT-specific finding tags


export default function AdvancedImageSuite({
    captures: initialCaptures,
    onUpdateCaptures,
    onClose,
    onGenerateReport,
    initialImageId,
    initialSelectedIds,
    procedureId
}: AdvancedImageSuiteProps) {
    // --- Store & Session State ---
    const { segments, activeSegmentIndex, setActiveSegment } = useSessionStore();
    const [localCaptures, setLocalCaptures] = useState<Capture[]>(initialCaptures);
    const [isLoadingMedia, setIsLoadingMedia] = useState(false);

    // Determines the effectively active segment ID (default to prop or store)
    const activeSegment = segments.find(s => s.index === activeSegmentIndex)
        || (procedureId ? { id: procedureId, index: 1 } : null);

    // --- State ---
    const [activeImageId, setActiveImageId] = useState<string | null>(initialImageId || null);
    const [tool, setTool] = useState<Tool>('select');

    // Tags State
    const [tags, setTags] = useState<Tag[]>(MOCK_TAGS);
    const [activeTag, setActiveTag] = useState<Tag>(MOCK_TAGS[0]);
    const [newTagLabel, setNewTagLabel] = useState("");
    const [isCreatingTag, setIsCreatingTag] = useState(false);

    // Properties (moved up for closure access in handleCreateTag if needed, though state is available)
    const [color, setColor] = useState('#ef4444');
    const [thickness, setThickness] = useState(4);

    // Fetch Tags - Merge defaults with DB tags
    useEffect(() => {
        let mounted = true;
        const loadTags = async () => {
            // Start with defaults
            let finalTags = [...MOCK_TAGS];

            try {
                const res = await getTags();
                if (mounted && res.success && res.tags && res.tags.length > 0) {
                    const dbTags = res.tags;
                    const uniqueDbTags = dbTags.filter(dbTag =>
                        !MOCK_TAGS.some(defaultTag => defaultTag.id === dbTag.id || defaultTag.label.toLowerCase() === dbTag.label.toLowerCase())
                    );
                    finalTags = [...MOCK_TAGS, ...uniqueDbTags];
                }
            } catch (e) {
                console.error("Failed to fetch tags, using defaults", e);
            }

            if (mounted) {
                setTags(finalTags);
                // Ensure active tag is valid and defaults to first item if current active is invalid
                if (!finalTags.find(t => t.id === activeTag.id)) {
                    setActiveTag(finalTags[0]);
                }
            }
        };
        loadTags();
        return () => { mounted = false; };
    }, []);

    const handleCreateTag = async () => {
        if (!newTagLabel.trim()) return;
        setIsCreatingTag(true);
        try {
            const res = await createTag(newTagLabel.trim(), color);
            if (res.success && res.tag) {
                setTags(prev => [...prev, res.tag!]);
                setActiveTag(res.tag!);
                setNewTagLabel("");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsCreatingTag(false);
        }
    };

    const [sidebarTab, setSidebarTab] = useState<SidebarTab>('images');

    // Annotation State
    const [annotations, setAnnotations] = useState<Record<string, Shape[]>>({});
    const [history, setHistory] = useState<Record<string, Shape[][]>>({});
    const [historyStep, setHistoryStep] = useState<Record<string, number>>({});

    // Properties


    // Canvas Selection & Interaction
    const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
    const [transformAction, setTransformAction] = useState<{
        type: 'move' | 'resize',
        handle?: string,
        startShape?: Shape,
        startPoint?: { x: number, y: number }
    } | null>(null);

    // Zoom State
    const [zoom, setZoom] = useState(1);
    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 3;

    // Video State
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // UI State
    const [showReportSelection, setShowReportSelection] = useState(false);
    const [selectedForReport, setSelectedForReport] = useState<Set<string>>(new Set(initialSelectedIds || [])); // Restore missing state
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Template State
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [naturalSize, setNaturalSize] = useState<{ w: number, h: number } | null>(null);

    // --- Media Fetching for Logic ---
    useEffect(() => {
        const fetchSessionMedia = async () => {
            // If we have segments, let's try to fetch all media for them
            if (segments.length === 0) return;

            setIsLoadingMedia(true);
            try {
                let allFetched: Capture[] = [];

                for (const seg of segments) {
                    const res = await getProcedureMedia(seg.id);
                    if (res.success && res.media) {
                        const mapped: Capture[] = res.media.map((m: any) => {
                            // Correctly map backend types to frontend Capture types
                            const isVideo = m.type === 'VIDEO';
                            const isAnnotated = m.type === 'ANNOTATED';

                            return {
                                id: m.id,
                                url: m.url || m.filePath,
                                timestamp: m.timestamp,
                                type: isVideo ? 'video' : 'image',
                                category: isAnnotated ? 'report' : 'raw',
                                procedureId: seg.id
                            };
                        });
                        allFetched = [...allFetched, ...mapped];
                    }
                }


                // De-duplicate by ID and URL (to prevent Local vs DB ID clash)
                const combined = [...allFetched];
                // Add initial captures if not present
                for (const init of initialCaptures) {
                    const existsById = combined.some(c => c.id === init.id);
                    const existsByUrl = combined.some(c => c.url === init.url); // Check URL too

                    if (!existsById && !existsByUrl) {
                        // Enrich with current procedureId if missing
                        const pId = activeSegment?.id || procedureId;
                        combined.push({ ...init, procedureId: pId });
                    }
                }

                setLocalCaptures(combined);

                // If no active image, set last one
                if (!activeImageId && combined.length > 0) {
                    setActiveImageId(combined[combined.length - 1].id);
                }

            } catch (e) {
                console.error("Failed to fetch session media", e);
            } finally {
                setIsLoadingMedia(false);
            }
        };

        fetchSessionMedia();
    }, [segments, initialCaptures]);


    const activeCapture = localCaptures.find(c => c.id === activeImageId);

    // Filter by Tab AND Active Segment
    const getFilteredCaptures = () => {
        // Filter by Procedure Segment first
        let segmentCaptures = localCaptures;

        // Only filter by segment if we successfully identified an active segment
        if (activeSegment?.id) {
            segmentCaptures = localCaptures.filter(c => c.procedureId === activeSegment.id);

            // Fallback: If captures don't have procedureId (legacy/prop), 
            // assign them to the "current" active segment for display purposes if unique?
            // Actually, safely assuming if procedureId is undefined, it might belong to the initial prop set.
            // Let's include undefined procedureId only if activeSegment is the "first" or "default"?
            // Simplification: Include items where procedureId matches OR is undefined (legacy compatibility)
            const orphans = localCaptures.filter(c => !c.procedureId);
            if (activeSegmentIndex === 1 || segments.length === 0) {
                segmentCaptures = [...segmentCaptures, ...orphans];
            }
        }

        switch (sidebarTab) {
            case 'images':
                return segmentCaptures.filter(c => c.type !== 'video' && !c.deleted && c.category !== 'report');
            case 'videos':
                return segmentCaptures.filter(c => c.type === 'video' && !c.deleted);
            case 'annotated':
                return segmentCaptures.filter(c => c.category === 'report' && !c.deleted);
            case 'trashed':
                return segmentCaptures.filter(c => c.deleted);
            default:
                return [];
        }
    };

    const filteredCaptures = getFilteredCaptures();

    // --- Helpers ---
    const getCurrentShapes = useCallback(() => {
        if (!activeImageId) return [];
        return annotations[activeImageId] || [];
    }, [activeImageId, annotations]);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const updateShape = (id: string, updates: Partial<Shape>) => {
        if (!activeImageId) return;
        setAnnotations(prev => ({
            ...prev,
            [activeImageId]: prev[activeImageId].map(s => s.id === id ? { ...s, ...updates } as Shape : s)
        }));
    };

    const commitToHistory = (newShapes: Shape[]) => {
        if (!activeImageId) return;
        const currentStep = historyStep[activeImageId] || 0;
        const currentHistory = history[activeImageId] || [];
        const newHistory = [...currentHistory.slice(0, currentStep + 1), newShapes];
        setHistory(prev => ({ ...prev, [activeImageId]: newHistory }));
        setHistoryStep(prev => ({ ...prev, [activeImageId]: newHistory.length - 1 }));
        setAnnotations(prev => ({ ...prev, [activeImageId]: newShapes }));
    };

    const handleUndo = () => {
        if (!activeImageId) return;
        const currentStep = historyStep[activeImageId] || 0;
        const currentHistory = history[activeImageId] || [];
        if (currentStep > 0) {
            const newStep = currentStep - 1;
            setHistoryStep(prev => ({ ...prev, [activeImageId]: newStep }));
            setAnnotations(prev => ({ ...prev, [activeImageId]: currentHistory[newStep] || [] }));
        }
    };

    const handleRedo = () => {
        if (!activeImageId) return;
        const currentStep = historyStep[activeImageId] || 0;
        const currentHistory = history[activeImageId] || [];
        if (currentStep < currentHistory.length - 1) {
            const newStep = currentStep + 1;
            setHistoryStep(prev => ({ ...prev, [activeImageId]: newStep }));
            setAnnotations(prev => ({ ...prev, [activeImageId]: currentHistory[newStep] || [] }));
        }
    };

    const canUndo = activeImageId ? (historyStep[activeImageId] || 0) > 0 : false;
    const canRedo = activeImageId ? (historyStep[activeImageId] || 0) < (history[activeImageId]?.length || 0) - 1 : false;

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, MAX_ZOOM));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, MIN_ZOOM));
    const handleZoomReset = () => setZoom(1);

    const handleCaptureVideoFrame = () => {
        if (!videoRef.current || !activeCapture) return;
        // Logic same as before...
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);
        const frameUrl = canvas.toDataURL('image/jpeg', 0.9);
        const newCapture: Capture = {
            id: Math.random().toString(36).substr(2, 9),
            url: frameUrl,
            timestamp: new Date().toLocaleTimeString(),
            type: 'image',
            category: 'raw',
            procedureId: activeCapture.procedureId // Inherit procedure ID
        };
        setLocalCaptures(prev => [...prev, newCapture]);
        onUpdateCaptures([...localCaptures, newCapture]); // Keep parent in sync roughly
        showNotification('Frame captured!', 'success');
    };

    const getMousePos = (e: React.MouseEvent) => {
        const svg = svgRef.current;
        if (!svg) return { x: 0, y: 0 };
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const cursorPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
        return { x: cursorPt.x, y: cursorPt.y };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!activeImageId || !tool || activeCapture?.type === 'video') return;
        if (tool !== 'select') setSelectedShapeId(null);

        const pos = getMousePos(e);

        if (tool === 'select' && selectedShapeId) {
            const target = e.target as Element;
            const handle = target.getAttribute('data-handle');
            if (handle) {
                const shape = getCurrentShapes().find(s => s.id === selectedShapeId);
                if (shape) {
                    setTransformAction({ type: 'resize', handle, startShape: shape, startPoint: pos });
                    setDragStart(pos);
                    return;
                }
            }
        }

        if (tool === 'select') {
            if (e.target === svgRef.current) {
                setSelectedShapeId(null);
                return;
            } else {
                const targetId = (e.target as Element).getAttribute('data-id');
                if (targetId) {
                    setSelectedShapeId(targetId);
                    const shape = getCurrentShapes().find(s => s.id === targetId);
                    if (shape) {
                        setTransformAction({ type: 'move', startShape: shape, startPoint: pos });
                        setDragStart(pos);
                    }
                }
                return;
            }
        }

        setIsDrawing(true);
        setDragStart(pos);
        const newId = Math.random().toString(36).substr(2, 9);
        const currentShapes = getCurrentShapes();

        let newShape: Shape | null = null;
        if (tool === 'pen') {
            newShape = { type: 'path', id: newId, color, thickness, points: [pos], x: pos.x, y: pos.y, w: 0, h: 0, rotation: 0, opacity: 1 } as PathShape;
        } else if (tool === 'tag') {
            newShape = { type: 'pin', id: newId, color: activeTag.color, thickness, x: pos.x, y: pos.y, text: activeTag.label, rotation: 0, opacity: 1 } as PinShape;
            commitToHistory([...currentShapes, newShape]);
            setIsDrawing(false);
            return;
        } else if (tool === 'arrow') {
            newShape = { type: 'arrow', id: newId, color, thickness, x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, x: pos.x, y: pos.y, rotation: 0, opacity: 1 } as ArrowShape;
        } else if (tool === 'rect' || tool === 'circle') {
            newShape = { type: tool, id: newId, color, thickness, x: pos.x, y: pos.y, w: 0, h: 0, rotation: 0, opacity: 1 } as RectShape;
        }

        if (newShape) {
            setAnnotations(prev => ({ ...prev, [activeImageId]: [...currentShapes, newShape!] }));
            setSelectedShapeId(newId);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const pos = getMousePos(e);
        if (transformAction && dragStart && transformAction.startShape) {
            const { type, handle, startShape, startPoint } = transformAction;
            if (!startPoint) return;
            const dx = pos.x - startPoint.x;
            const dy = pos.y - startPoint.y;

            if (type === 'move') {
                if (startShape.type === 'arrow') {
                    const s = startShape as ArrowShape;
                    updateShape(s.id, { x1: s.x1 + dx, y1: s.y1 + dy, x2: s.x2 + dx, y2: s.y2 + dy });
                } else {
                    updateShape(startShape.id, { x: startShape.x + dx, y: startShape.y + dy });
                }
            } else if (type === 'resize') {
                // Resize logic...
                if (startShape.type === 'arrow') {
                    const s = startShape as ArrowShape;
                    updateShape(s.id, { x2: s.x2 + dx, y2: s.y2 + dy });
                } else if ('w' in startShape && 'h' in startShape) {
                    const s = startShape as RectShape;
                    let { x, y, w, h } = s;
                    if (handle?.includes('e')) w += dx;
                    if (handle?.includes('s')) h += dy;
                    if (handle?.includes('w')) { x += dx; w -= dx; }
                    if (handle?.includes('n')) { y += dy; h -= dy; }
                    updateShape(s.id, { x, y, w, h });
                }
            }
            return;
        }

        if (isDrawing && dragStart && tool !== 'select') {
            const currentShapes = getCurrentShapes();
            const activeShape = currentShapes[currentShapes.length - 1];
            if (!activeShape) return;
            if (activeShape.type === 'path') {
                const newPoints = [...(activeShape as PathShape).points, pos];
                const xs = newPoints.map(p => p.x);
                const ys = newPoints.map(p => p.y);
                updateShape(activeShape.id, {
                    points: newPoints,
                    x: Math.min(...xs), y: Math.min(...ys),
                    w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)
                } as Partial<PathShape>);
            } else if (activeShape.type === 'rect' || activeShape.type === 'circle') {
                updateShape(activeShape.id, { w: pos.x - dragStart.x, h: pos.y - dragStart.y });
            } else if (activeShape.type === 'arrow') {
                updateShape(activeShape.id, { x2: pos.x, y2: pos.y });
            }
        }
    };

    const handleMouseUp = () => {
        if (isDrawing) { setIsDrawing(false); commitToHistory(getCurrentShapes()); }
        if (transformAction) { setTransformAction(null); commitToHistory(getCurrentShapes()); }
    };

    const handleSave = async () => {
        if (!activeCapture || !containerRef.current || activeCapture.type === 'video') return;
        const canvas = document.createElement('canvas');
        const img = new Image();
        img.src = activeCapture.url;
        img.crossOrigin = "anonymous";
        await new Promise(r => img.onload = r);
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const shapes = getCurrentShapes();
        shapes.forEach(shape => {
            // ... (Same drawing logic as provided) ...
            ctx.save();
            ctx.globalAlpha = shape.opacity ?? 1;
            ctx.strokeStyle = shape.color;
            ctx.fillStyle = shape.color;
            ctx.lineWidth = shape.thickness;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            if (shape.type === 'rect') { ctx.strokeRect(shape.x, shape.y, (shape as RectShape).w, (shape as RectShape).h); }
            else if (shape.type === 'circle') {
                const s = shape as RectShape; ctx.beginPath();
                ctx.ellipse(s.x + (s.w || 0) / 2, s.y + (s.h || 0) / 2, Math.abs((s.w || 0) / 2), Math.abs((s.h || 0) / 2), 0, 0, 2 * Math.PI);
                ctx.stroke();
            }
            else if (shape.type === 'path') {
                const s = shape as PathShape; ctx.beginPath();
                s.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                ctx.stroke();
            }
            else if (shape.type === 'pin') {
                const s = shape as PinShape;
                ctx.translate(s.x, s.y);
                ctx.fillStyle = s.color;

                // Scale Pin Icon - Drastically larger
                const iconScale = Math.max(4, img.width / 300); // e.g. 1920 / 300 = ~6.4x scale
                ctx.scale(iconScale, iconScale);

                const path = new Path2D("M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z M12 11.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z");
                ctx.translate(-12, -24); // Center the pin tip at (0,0) before scaling
                ctx.fill(path);

                // Reset scale for text to ensure crisp text rendering (or handle text scaling separately)
                // Actually, easier to keep context scaled? No, font size is better handled explicitly.
                ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to identity
                // Re-apply translation to shape position
                ctx.translate(s.x, s.y);

                // Font logic - MAXIMIZED FONT SIZE
                const fontSize = Math.max(200, img.width / 10); // ~200px on 1080p width
                ctx.font = `900 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
                ctx.fillStyle = "white";
                ctx.textAlign = "center";
                ctx.shadowColor = "rgba(0,0,0,1)";
                ctx.shadowBlur = 15;
                ctx.lineWidth = 12; // Thick stroke
                ctx.strokeStyle = "rgba(0,0,0,0.9)"; // Dark stroke

                // Draw text BELOW the pin (since pin is huge now)
                const textOffset = (iconScale * 10) + (fontSize * 0.8);
                // Pin is ~24 units tall * iconScale. Tip is at 0,0. Top is at -24*scale. 
                // Let's put text ABOVE the pin.
                // Pin top is approx -28 * iconScale.
                const textY = -(28 * iconScale);

                ctx.strokeText(s.text, 0, textY);
                ctx.fillText(s.text, 0, textY);
                ctx.restore();
            } else if (shape.type === 'arrow') {
                const s = shape as ArrowShape;
                ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke();
                const angle = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
                ctx.beginPath();
                ctx.moveTo(s.x2, s.y2);
                ctx.lineTo(s.x2 - 15 * Math.cos(angle - Math.PI / 6), s.y2 - 15 * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(s.x2, s.y2);
                ctx.lineTo(s.x2 - 15 * Math.cos(angle + Math.PI / 6), s.y2 - 15 * Math.sin(angle + Math.PI / 6));
                ctx.stroke();
            }
            ctx.restore();
        });

        const newUrl = canvas.toDataURL("image/jpeg", 0.9);
        const targetProcedureId = activeCapture.procedureId || activeSegment?.id || procedureId;

        const newCapture: Capture = {
            id: Math.random().toString(36).substr(2, 9),
            url: newUrl,
            timestamp: new Date().toLocaleTimeString(),
            type: 'image',
            category: 'report',
            procedureId: targetProcedureId
        };

        setLocalCaptures(prev => [...prev, newCapture]);
        onUpdateCaptures([...localCaptures, newCapture]);

        if (targetProcedureId) {
            try {
                await saveMediaMetadata({
                    procedureId: targetProcedureId,
                    type: 'ANNOTATED', // Distinct type for persistence
                    filePath: newUrl,
                    timestamp: new Date(),
                });
            } catch (err) {
                console.error('Failed to save annotated image to database:', err);
            }
        }

        setActiveImageId(newCapture.id);
        setSidebarTab('annotated');
        showNotification("Copy saved to Edited", "success");
    };

    const toggleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setLocalCaptures(localCaptures.map(c => c.id === id ? { ...c, deleted: !c.deleted } : c));
    };

    const restoreCapture = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setLocalCaptures(localCaptures.map(c => c.id === id ? { ...c, deleted: false } : c));
    };

    const handleSelectTemplate = (template: AnatomyTemplate) => {
        const newCapture: Capture = {
            id: `template_${template.id}_${Date.now()}`,
            url: template.imagePath,
            timestamp: new Date().toLocaleTimeString(),
            type: 'image',
            category: 'raw',
            procedureId: activeSegment?.id
        };
        setLocalCaptures([...localCaptures, newCapture]);
        setActiveImageId(newCapture.id);
        setSidebarTab('images');
        setShowTemplatePicker(false);
        showNotification(`${template.name} template added`, 'success');
    };

    const allNonDeleted = localCaptures.filter(c => !c.deleted);
    const currentIndex = allNonDeleted.findIndex(c => c.id === activeImageId);
    const goToPrev = () => { if (currentIndex > 0) setActiveImageId(allNonDeleted[currentIndex - 1].id); };
    const goToNext = () => { if (currentIndex < allNonDeleted.length - 1) setActiveImageId(allNonDeleted[currentIndex + 1].id); };

    // Transformer (Defined internally to access scope, but could be extracted)
    const Transformer = ({ shape }: { shape: Shape }) => {
        let bx = 0, by = 0, bw = 0, bh = 0;
        if ('w' in shape) { bx = shape.x; by = shape.y; bw = shape.w; bh = shape.h; }
        else if ('x1' in shape) {
            bx = Math.min(shape.x1, shape.x2); by = Math.min(shape.y1, shape.y2);
            bw = Math.abs(shape.x2 - shape.x1); bh = Math.abs(shape.y2 - shape.y1);
        }
        if (bw < 0) { bx += bw; bw = Math.abs(bw); }
        if (bh < 0) { by += bh; bh = Math.abs(bh); }

        return (
            <g>
                <rect x={bx} y={by} width={bw} height={bh} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 3" pointerEvents="none" />
                {('w' in shape) && (
                    <>
                        <rect x={bx - 5} y={by - 5} width={10} height={10} fill="white" stroke="#3b82f6" strokeWidth={2} cursor="nw-resize" data-handle="nw" rx="2" />
                        <rect x={bx + bw - 5} y={by - 5} width={10} height={10} fill="white" stroke="#3b82f6" strokeWidth={2} cursor="ne-resize" data-handle="ne" rx="2" />
                        <rect x={bx - 5} y={by + bh - 5} width={10} height={10} fill="white" stroke="#3b82f6" strokeWidth={2} cursor="sw-resize" data-handle="sw" rx="2" />
                        <rect x={bx + bw - 5} y={by + bh - 5} width={10} height={10} fill="white" stroke="#3b82f6" strokeWidth={2} cursor="se-resize" data-handle="se" rx="2" />
                    </>
                )}
                {('x1' in shape) && (
                    <>
                        <circle cx={shape.x1} cy={shape.y1} r={6} fill="white" stroke="#3b82f6" strokeWidth={2} cursor="move" data-handle="start" />
                        <circle cx={shape.x2} cy={shape.y2} r={6} fill="white" stroke="#3b82f6" strokeWidth={2} cursor="move" data-handle="end" />
                    </>
                )}
            </g>
        );
    };

    // --- Render ---
    return (
        <div className="fixed inset-0 z-[100] flex bg-zinc-950">
            {/* === SIDEBAR === */}
            <div className="w-72 h-full border-r border-zinc-800 bg-zinc-900 flex flex-col">
                <div className="h-14 flex items-center px-4 border-b border-zinc-800">
                    <h1 className="text-base font-bold text-white tracking-tight">AnnotateX</h1>
                </div>

                {/* --- SEGMENT SELECTOR --- */}
                {segments.length > 0 && (
                    <div className="p-2 border-b border-zinc-800 bg-zinc-900/50">
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                            {segments.map((seg) => (
                                <button
                                    key={seg.id}
                                    onClick={() => setActiveSegment(seg.index)}
                                    className={`
                                        h-7 px-3 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all
                                        flex-shrink-0 flex items-center justify-center border
                                        ${activeSegmentIndex === seg.index
                                            ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/40'
                                            : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300'
                                        }
                                    `}
                                >
                                    P{seg.index}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-zinc-800">
                    {[
                        { id: 'images' as SidebarTab, label: 'Images', icon: ImageIcon },
                        { id: 'videos' as SidebarTab, label: 'Videos', icon: Video },
                        { id: 'annotated' as SidebarTab, label: 'Edited', icon: Edit3 },
                        { id: 'trashed' as SidebarTab, label: 'Trash', icon: Trash },
                    ].map(tab => {
                        // Count within the ACTIVE SEGMENT
                        const count = localCaptures.filter(c => {
                            const matchesSeg = activeSegment?.id ? c.procedureId === activeSegment.id : true; // Simplify
                            // For simplicity in tabs we might just count what's in filtered list if we re-ran filter
                            // But let's do it manually for accuracy
                            if (activeSegment?.id && c.procedureId && c.procedureId !== activeSegment.id) return false;
                            if (tab.id === 'images') return c.type !== 'video' && !c.deleted && c.category !== 'report';
                            if (tab.id === 'videos') return c.type === 'video' && !c.deleted;
                            if (tab.id === 'annotated') return c.category === 'report' && !c.deleted;
                            if (tab.id === 'trashed') return c.deleted;
                            return false;
                        }).length;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setSidebarTab(tab.id)}
                                className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-1 ${sidebarTab === tab.id
                                    ? 'text-white bg-zinc-800 border-b-2 border-blue-500'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                                    }`}
                            >
                                <tab.icon size={14} />
                                <span className="flex items-center gap-1">
                                    {tab.label}
                                    {count > 0 && <span className="text-[9px] bg-zinc-700 px-1.5 rounded">{count}</span>}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* Gallery */}
                <div className="flex-1 overflow-y-auto p-2">
                    {isLoadingMedia ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2">
                            <Loader2 className="animate-spin" size={20} />
                            <span className="text-xs">Loading media...</span>
                        </div>
                    ) : filteredCaptures.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-600 text-xs">
                            <ImageIcon size={32} className="mb-2 opacity-50" />
                            No items in P{activeSegmentIndex || 1}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {filteredCaptures.slice().reverse().map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => setActiveImageId(c.id)}
                                    className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer border transition-all ${activeImageId === c.id
                                        ? 'border-blue-500 ring-2 ring-blue-500/30'
                                        : 'border-zinc-700 hover:border-zinc-600'
                                        }`}
                                >
                                    {c.type === 'video' ? (
                                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                            <Video size={24} className="text-zinc-500" />
                                        </div>
                                    ) : (
                                        <img src={c.url} className="w-full h-full object-cover" alt="" />
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button onClick={(e) => sidebarTab === 'trashed' ? restoreCapture(c.id, e) : toggleDelete(c.id, e)}
                                            className={`p-2 rounded-full transition-all ${sidebarTab === 'trashed' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500' : 'bg-red-500/20 text-red-400 hover:bg-red-500'} hover:text-white`}>
                                            {sidebarTab === 'trashed' ? <RotateCw size={14} /> : <Trash2 size={14} />}
                                        </button>
                                    </div>
                                    {c.type === 'video' && <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white font-mono">VIDEO</div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-3 border-t border-zinc-800 space-y-2">
                    <button onClick={() => setShowTemplatePicker(true)} className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-2">
                        <Layers size={16} /> Use Anatomy Template
                    </button>
                    <button onClick={onClose} className="w-full py-2.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white text-sm font-medium transition-all flex items-center justify-center gap-2">
                        <X size={16} /> Exit
                    </button>
                </div>
            </div>

            {/* === MAIN AREA === */}
            <div className="flex-1 flex flex-col relative bg-zinc-950">
                <div className="h-12 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <button onClick={goToPrev} disabled={currentIndex <= 0} className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronLeft size={18} /></button>
                        <span className="text-xs text-zinc-500 font-mono min-w-[60px] text-center">{currentIndex >= 0 ? currentIndex + 1 : 0} / {allNonDeleted.length}</span>
                        <button onClick={goToNext} disabled={currentIndex >= allNonDeleted.length - 1} className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronRight size={18} /></button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <button onClick={handleZoomOut} disabled={zoom <= MIN_ZOOM} className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30"><ZoomOut size={16} /></button>
                            <button onClick={handleZoomReset} className="px-2 py-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-mono min-w-[50px]">{Math.round(zoom * 100)}%</button>
                            <button onClick={handleZoomIn} disabled={zoom >= MAX_ZOOM} className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30"><ZoomIn size={16} /></button>
                        </div>
                        <div className="w-px h-5 bg-zinc-700" />
                        <div className="flex items-center gap-1">
                            <button onClick={handleUndo} disabled={!canUndo} className={`p-1.5 rounded transition-all ${canUndo ? 'hover:bg-zinc-800 hover:text-white' : 'text-zinc-700'}`}><Undo2 size={16} /></button>
                            <button onClick={handleRedo} disabled={!canRedo} className={`p-1.5 rounded transition-all ${canRedo ? 'hover:bg-zinc-800 hover:text-white' : 'text-zinc-700'}`}><Redo2 size={16} /></button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {activeCapture?.type !== 'video' && (
                            <button onClick={handleSave} className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-all flex items-center gap-2 border border-zinc-700">
                                <Save size={14} /> Save
                            </button>
                        )}
                        <button onClick={() => {
                            if (onGenerateReport) onGenerateReport(localCaptures.filter(c => selectedForReport.has(c.id) || true).map(c => c.id));
                        }} className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2">
                            Continue <MoveUpRight size={14} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center p-6 relative overflow-auto bg-zinc-950" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>

                    {/* --- TOOLBAR OVERLAY --- */}
                    {activeCapture && activeCapture.type !== 'video' && (
                        <div className="absolute left-4 top-4 z-50 flex flex-col gap-2">
                            <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-2 rounded-xl shadow-2xl flex flex-col gap-1">
                                <div className="grid grid-cols-2 gap-1 mb-1">
                                    {[
                                        { id: 'select', icon: MousePointer2, label: 'Select' },
                                        { id: 'pen', icon: Pen, label: 'Pen' },
                                        { id: 'arrow', icon: MoveUpRight, label: 'Arrow' },
                                        { id: 'rect', icon: Square, label: 'Rect' },
                                        { id: 'circle', icon: Circle, label: 'Circle' },
                                        { id: 'tag', icon: Sticker, label: 'Tag' },
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTool(t.id as Tool)}
                                            className={`p-2 rounded-lg flex items-center justify-center transition-all ${tool === t.id
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                                                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                                                }`}
                                            title={t.label}
                                        >
                                            <t.icon size={18} />
                                        </button>
                                    ))}
                                </div>

                                {/* Properties */}
                                {tool !== 'select' && (
                                    <>
                                        <div className="h-px bg-zinc-700/50 my-1" />

                                        {/* Color Picker */}
                                        <div className="grid grid-cols-4 gap-1.5 p-1">
                                            {['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff'].map((c) => (
                                                <button
                                                    key={c}
                                                    onClick={() => setColor(c)}
                                                    className={`w-6 h-6 rounded-full border border-zinc-700 transition-transform ${color === c ? 'scale-110 ring-2 ring-white' : 'hover:scale-110'}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>

                                        {/* Thickness */}
                                        <div className="px-1 py-2">
                                            <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                                                <span>Stroke</span>
                                                <span>{thickness}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="20"
                                                value={thickness}
                                                onChange={(e) => setThickness(parseInt(e.target.value))}
                                                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Tag Selection Sidetray */}
                            {tool === 'tag' && (
                                <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-2 rounded-xl shadow-2xl max-h-[400px] w-64 overflow-y-auto no-scrollbar animate-in slide-in-from-left-2 flex flex-col">
                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">Findings</div>
                                    <div className="space-y-1 mb-2">
                                        {tags.map((tag) => (
                                            <button
                                                key={tag.id}
                                                onClick={() => setActiveTag(tag)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${activeTag.id === tag.id
                                                    ? 'bg-zinc-800 text-white border border-zinc-700'
                                                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                                                    }`}
                                            >
                                                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: tag.color }} />
                                                <span className="truncate">{tag.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="pt-2 border-t border-zinc-800 mt-auto">
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">Add New Tag</div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newTagLabel}
                                                onChange={(e) => setNewTagLabel(e.target.value)}
                                                placeholder="New tag..."
                                                className="flex-1 bg-zinc-800 border-zinc-700 text-xs text-white rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-zinc-600"
                                                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                                            />
                                            <button
                                                onClick={handleCreateTag}
                                                disabled={!newTagLabel.trim() || isCreatingTag}
                                                className="bg-blue-600 hover:bg-blue-500 text-white rounded px-3 py-1.5 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isCreatingTag ? <Loader2 size={12} className="animate-spin" /> : 'Add'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                    {activeCapture ? (
                        activeCapture.type === 'video' ? (
                            <div className="relative flex flex-col items-center">
                                <video ref={videoRef} src={activeCapture.url} className="max-w-full max-h-[65vh] rounded-lg shadow-2xl" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }} onPlay={() => setIsVideoPlaying(true)} onPause={() => setIsVideoPlaying(false)} controls />
                                <div className="mt-4 flex items-center gap-3">
                                    <button onClick={handleCaptureVideoFrame} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-all"><Camera size={14} /> Capture Frame</button>
                                </div>
                            </div>
                        ) : (
                            <div ref={containerRef} onMouseDown={handleMouseDown} className="relative rounded-lg overflow-hidden shadow-2xl" style={{ cursor: tool === 'select' ? 'default' : 'crosshair', transform: `scale(${zoom})`, transformOrigin: 'center' }}>
                                <img src={activeCapture.url} className="max-w-full max-h-[65vh] block object-contain pointer-events-none" draggable={false} onLoad={(e) => setNaturalSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} alt="" />
                                <svg ref={svgRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} viewBox={naturalSize ? `0 0 ${naturalSize.w} ${naturalSize.h}` : undefined}>
                                    <defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill={color} /></marker></defs>
                                    {getCurrentShapes().map(shape => {
                                        // Shape rendering logic (abbreviated for cleanliness in this tool call, but full logic was preserved in handleSave/render)
                                        // Re-implementing simplified render for the view:
                                        let element = null;
                                        const commonProps = { stroke: shape.color, strokeWidth: shape.thickness, opacity: shape.opacity, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

                                        if (shape.type === 'rect') { const s = shape as RectShape; element = <rect x={s.x} y={s.y} width={s.w} height={s.h} {...commonProps} />; }
                                        else if (shape.type === 'circle') { const s = shape as RectShape; element = <ellipse cx={s.x + (s.w || 0) / 2} cy={s.y + (s.h || 0) / 2} rx={Math.abs((s.w || 0) / 2)} ry={Math.abs((s.h || 0) / 2)} {...commonProps} />; }
                                        else if (shape.type === 'path') { const s = shape as PathShape; const d = s.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '); element = <path d={d} {...commonProps} />; }
                                        else if (shape.type === 'arrow') {
                                            const s = shape as ArrowShape;
                                            element = <g opacity={shape.opacity}><line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={shape.color} strokeWidth={shape.thickness} markerEnd="url(#arrowhead)" /></g>;
                                        }
                                        else if (shape.type === 'pin') {
                                            const s = shape as PinShape;
                                            element = <g transform={`translate(${s.x},${s.y})`} opacity={shape.opacity}>
                                                <defs>
                                                    <filter id="solid-shadow">
                                                        <feFlood floodColor="black" result="flooded" />
                                                        <feComposite operator="in" in="flooded" in2="SourceGraphic" result="shadow" />
                                                        <feOffset in="shadow" dx="2" dy="2" result="offsetShadow" />
                                                        <feMerge>
                                                            <feMergeNode in="offsetShadow" />
                                                            <feMergeNode in="SourceGraphic" />
                                                        </feMerge>
                                                    </filter>
                                                </defs>
                                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z M12 11.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill={shape.color} transform="translate(-12,-24) scale(4)" />
                                                <text x="0" y="-100" textAnchor="middle" fill="white" fontWeight="900" fontSize="80" stroke="black" strokeWidth="3" style={{ textShadow: '0 4px 8px rgba(0,0,0,1)', fontFamily: 'system-ui, sans-serif' }}>{s.text}</text>
                                            </g>;
                                        }

                                        return (
                                            <g key={shape.id} onMouseDown={(e) => {
                                                if (tool === 'select') { e.stopPropagation(); setSelectedShapeId(shape.id); setTransformAction({ type: 'move', startShape: shape, startPoint: getMousePos(e) }); setDragStart(getMousePos(e)); }
                                            }} data-id={shape.id} style={{ pointerEvents: tool === 'select' ? 'auto' : 'none', cursor: tool === 'select' ? 'move' : 'none' }}>
                                                {element}
                                                {selectedShapeId === shape.id && <Transformer shape={shape} />}
                                            </g>
                                        );
                                    })}
                                </svg>
                            </div>
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-600">
                            <p>Select an image to preview</p>
                        </div>
                    )}
                </div>
            </div>
            {notification && (
                <div className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg text-white font-medium animate-in fade-in slide-in-from-bottom-4 ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    {notification.message}
                </div>
            )}
        </div>
    );
}
