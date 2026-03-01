import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProcedureSegment {
    id: string; // The database procedure table ID
    index: number; // 1, 2, 3...
    type?: string;
    status: 'draft' | 'saved' | 'completed';
    createdAt: Date;
    thumbnailUrl?: string; // For the segment bar snapshot
}

interface SessionState {
    activePatientId: string | null;
    segments: ProcedureSegment[];
    activeSegmentIndex: number; // The currently selected index (1-based)

    // Actions
    startSession: (patientId: string) => void;
    addSegment: (segment: ProcedureSegment) => void;
    updateSegment: (index: number, updates: Partial<ProcedureSegment>) => void;
    setActiveSegment: (index: number) => void;
    updateSegmentThumbnail: (id: string, url: string) => void;
    endSession: () => void;

    // Recovery
    hydrateSession: (patientId: string, savedSegments: ProcedureSegment[]) => void;
}

export const useSessionStore = create<SessionState>()(
    persist(
        (set, get) => ({
            activePatientId: null,
            segments: [],
            activeSegmentIndex: 1,

            startSession: (patientId) => set({
                activePatientId: patientId,
                segments: [],
                activeSegmentIndex: 1
            }),

            addSegment: (segment) => set((state) => ({
                segments: [...state.segments, segment],
                activeSegmentIndex: segment.index
            })),

            updateSegment: (index, updates) => set((state) => ({
                segments: state.segments.map(s => s.index === index ? { ...s, ...updates } : s)
            })),

            setActiveSegment: (index) => set({ activeSegmentIndex: index }),

            updateSegmentThumbnail: (id, url) => set((state) => ({
                segments: state.segments.map(s => s.id === id ? { ...s, thumbnailUrl: url } : s)
            })),

            endSession: () => set({
                activePatientId: null,
                segments: [],
                activeSegmentIndex: 1
            }),

            hydrateSession: (patientId, savedSegments) => set({
                activePatientId: patientId,
                segments: savedSegments,
                activeSegmentIndex: savedSegments.length > 0 ? savedSegments[savedSegments.length - 1].index : 1
            })
        }),
        {
            name: 'session-storage',
            partialize: (state) => ({
                activePatientId: state.activePatientId,
                // capturing simplified segments for persistence
                segments: state.segments,
                activeSegmentIndex: state.activeSegmentIndex
            })
        }
    )
);
