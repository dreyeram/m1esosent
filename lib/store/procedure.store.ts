/**
 * Procedure Store - Zustand
 * 
 * Manages active procedure state including captures and recordings.
 * Optimized for real-time procedure mode.
 */

import { create } from 'zustand';

/**
 * Captured image/video data
 */
export interface Capture {
    id: string;
    url: string;
    timestamp: string;
    type: 'image' | 'video';
    category?: 'raw' | 'polyp' | 'ulcer' | 'inflammation' | 'bleeding' | 'tumor' | 'other' | 'report';
    deleted?: boolean;
    thumbnail?: string;
}

/**
 * Active procedure patient data
 */
export interface ProcedurePatient {
    id: string;
    fullName: string;
    mrn: string;
    age?: number;
    gender?: string;
}

/**
 * Filter settings for live feed
 */
export interface FilterSettings {
    brightness: number;
    contrast: number;
    saturation: number;
    activeFilter: string | null;
}

/**
 * Procedure store state
 */
interface ProcedureState {
    // State
    procedureId: string | null;
    patient: ProcedurePatient | null;
    procedureType: string | null;
    isActive: boolean;
    startTime: Date | null;

    // Captures
    captures: Capture[];
    selectedCaptureId: string | null;

    // Recording
    isRecording: boolean;
    recordingDuration: number;

    // Filters
    filterSettings: FilterSettings;

    // Camera
    cameraIndex: number;
    isMirrored: boolean;
    isFreezed: boolean;

    // Actions
    startProcedure: (data: { procedureId: string; patient: ProcedurePatient; type: string }) => void;
    endProcedure: () => void;

    // Capture actions
    addCapture: (capture: Capture) => void;
    updateCapture: (id: string, updates: Partial<Capture>) => void;
    deleteCapture: (id: string) => void;
    restoreCapture: (id: string) => void;
    setSelectedCapture: (id: string | null) => void;
    clearCaptures: () => void;

    // Recording actions
    startRecording: () => void;
    stopRecording: () => void;
    updateRecordingDuration: (duration: number) => void;

    // Filter actions
    setFilter: (filter: string | null) => void;
    updateFilterSettings: (settings: Partial<FilterSettings>) => void;
    resetFilters: () => void;

    // Camera actions
    setCameraIndex: (index: number) => void;
    toggleMirror: () => void;
    toggleFreeze: () => void;
}

const DEFAULT_FILTER_SETTINGS: FilterSettings = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    activeFilter: null,
};

/**
 * Procedure store
 */
export const useProcedureStore = create<ProcedureState>()((set, get) => ({
    // Initial state
    procedureId: null,
    patient: null,
    procedureType: null,
    isActive: false,
    startTime: null,
    captures: [],
    selectedCaptureId: null,
    isRecording: false,
    recordingDuration: 0,
    filterSettings: { ...DEFAULT_FILTER_SETTINGS },
    cameraIndex: 0,
    isMirrored: false,
    isFreezed: false,

    // Start a new procedure
    startProcedure: ({ procedureId, patient, type }) => set({
        procedureId,
        patient,
        procedureType: type,
        isActive: true,
        startTime: new Date(),
        captures: [],
        selectedCaptureId: null,
        isRecording: false,
        recordingDuration: 0,
        filterSettings: { ...DEFAULT_FILTER_SETTINGS },
        isFreezed: false,
    }),

    // End the current procedure
    endProcedure: () => set({
        procedureId: null,
        patient: null,
        procedureType: null,
        isActive: false,
        startTime: null,
        captures: [],
        selectedCaptureId: null,
        isRecording: false,
        recordingDuration: 0,
        filterSettings: { ...DEFAULT_FILTER_SETTINGS },
        isFreezed: false,
    }),

    // Add a new capture
    addCapture: (capture) => set((state) => ({
        captures: [...state.captures, capture],
        selectedCaptureId: capture.id,
    })),

    // Update a capture
    updateCapture: (id, updates) => set((state) => ({
        captures: state.captures.map((c) =>
            c.id === id ? { ...c, ...updates } : c
        ),
    })),

    // Soft delete a capture
    deleteCapture: (id) => set((state) => ({
        captures: state.captures.map((c) =>
            c.id === id ? { ...c, deleted: true } : c
        ),
    })),

    // Restore a deleted capture
    restoreCapture: (id) => set((state) => ({
        captures: state.captures.map((c) =>
            c.id === id ? { ...c, deleted: false } : c
        ),
    })),

    // Set selected capture
    setSelectedCapture: (id) => set({ selectedCaptureId: id }),

    // Clear all captures
    clearCaptures: () => set({ captures: [], selectedCaptureId: null }),

    // Start recording
    startRecording: () => set({ isRecording: true, recordingDuration: 0 }),

    // Stop recording
    stopRecording: () => set({ isRecording: false }),

    // Update recording duration
    updateRecordingDuration: (duration) => set({ recordingDuration: duration }),

    // Set active filter
    setFilter: (filter) => set((state) => ({
        filterSettings: { ...state.filterSettings, activeFilter: filter },
    })),

    // Update filter settings
    updateFilterSettings: (settings) => set((state) => ({
        filterSettings: { ...state.filterSettings, ...settings },
    })),

    // Reset filters to default
    resetFilters: () => set({ filterSettings: { ...DEFAULT_FILTER_SETTINGS } }),

    // Set camera index
    setCameraIndex: (index) => set({ cameraIndex: index }),

    // Toggle mirror mode
    toggleMirror: () => set((state) => ({ isMirrored: !state.isMirrored })),

    // Toggle freeze mode
    toggleFreeze: () => set((state) => ({ isFreezed: !state.isFreezed })),
}));

/**
 * Get active (non-deleted) captures
 */
export function useActiveCaptures(): Capture[] {
    return useProcedureStore((state) =>
        state.captures.filter((c) => !c.deleted)
    );
}

/**
 * Get capture count
 */
export function useCaptureCount(): number {
    return useProcedureStore((state) =>
        state.captures.filter((c) => !c.deleted).length
    );
}

/**
 * Get procedure duration in seconds
 */
export function useProcedureDuration(): number {
    const startTime = useProcedureStore((state) => state.startTime);
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime.getTime()) / 1000);
}
