/**
 * Schedule Store - Zustand
 * 
 * Manages schedule state with in-memory caching for fast access.
 * Optimized for Pi5 performance.
 */

import { create } from 'zustand';

/**
 * Scheduled procedure data
 */
export interface ScheduledProcedure {
    id: string;
    type: string;
    status: string;
    scheduledDate: string | null;
    scheduledTime: string | null;
    durationMinutes: number;
    checkedInAt: string | null;
    patient: {
        id: string;
        fullName: string;
        mrn: string;
    };
    doctor: {
        id: string;
        fullName: string;
    };
    schedulingNotes: string | null;
}

/**
 * Schedule store state
 */
interface ScheduleState {
    // State
    procedures: ScheduledProcedure[];
    selectedDate: Date;
    viewMode: 'day' | 'week' | 'agenda';
    isLoading: boolean;
    lastFetched: number;
    error: string | null;

    // Actions
    setProcedures: (procedures: ScheduledProcedure[]) => void;
    addProcedure: (procedure: ScheduledProcedure) => void;
    updateProcedure: (id: string, updates: Partial<ScheduledProcedure>) => void;
    removeProcedure: (id: string) => void;
    setSelectedDate: (date: Date) => void;
    setViewMode: (mode: 'day' | 'week' | 'agenda') => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // Cache management
    isCacheValid: () => boolean;
    invalidateCache: () => void;
}

/**
 * Cache TTL in milliseconds (30 seconds)
 */
const CACHE_TTL = 30 * 1000;

/**
 * Schedule store
 */
export const useScheduleStore = create<ScheduleState>()((set, get) => ({
    // Initial state
    procedures: [],
    selectedDate: new Date(),
    viewMode: 'day',
    isLoading: false,
    lastFetched: 0,
    error: null,

    // Set all procedures (from API)
    setProcedures: (procedures) => set({
        procedures,
        lastFetched: Date.now(),
        isLoading: false,
        error: null,
    }),

    // Add a new procedure
    addProcedure: (procedure) => set((state) => ({
        procedures: [...state.procedures, procedure],
    })),

    // Update a procedure
    updateProcedure: (id, updates) => set((state) => ({
        procedures: state.procedures.map((p) =>
            p.id === id ? { ...p, ...updates } : p
        ),
    })),

    // Remove a procedure
    removeProcedure: (id) => set((state) => ({
        procedures: state.procedures.filter((p) => p.id !== id),
    })),

    // Set selected date
    setSelectedDate: (date) => set({
        selectedDate: date,
        // Invalidate cache when date changes
        lastFetched: 0,
    }),

    // Set view mode
    setViewMode: (mode) => set({ viewMode: mode }),

    // Set loading state
    setLoading: (loading) => set({ isLoading: loading }),

    // Set error
    setError: (error) => set({ error, isLoading: false }),

    // Check if cache is still valid
    isCacheValid: () => {
        const { lastFetched } = get();
        return Date.now() - lastFetched < CACHE_TTL;
    },

    // Invalidate cache (force refetch)
    invalidateCache: () => set({ lastFetched: 0 }),
}));

/**
 * Get procedures for a specific date
 */
export function useProceduresForDate(date: Date): ScheduledProcedure[] {
    const procedures = useScheduleStore((state) => state.procedures);
    const dateStr = date.toISOString().split('T')[0];

    return procedures.filter((p) => {
        if (!p.scheduledDate) return false;
        return p.scheduledDate.split('T')[0] === dateStr;
    });
}

/**
 * Get today's procedures
 */
export function useTodaysProcedures(): ScheduledProcedure[] {
    return useProceduresForDate(new Date());
}

/**
 * Get next procedure (nearest upcoming)
 */
export function useNextProcedure(): ScheduledProcedure | null {
    const procedures = useScheduleStore((state) => state.procedures);
    const now = new Date();

    const upcoming = procedures
        .filter((p) => {
            if (!p.scheduledDate || !p.scheduledTime) return false;
            if (p.status === 'COMPLETED' || p.status === 'CANCELLED') return false;
            const procedureTime = new Date(`${p.scheduledDate.split('T')[0]}T${p.scheduledTime}`);
            return procedureTime > now;
        })
        .sort((a, b) => {
            const timeA = new Date(`${a.scheduledDate!.split('T')[0]}T${a.scheduledTime}`);
            const timeB = new Date(`${b.scheduledDate!.split('T')[0]}T${b.scheduledTime}`);
            return timeA.getTime() - timeB.getTime();
        });

    return upcoming[0] || null;
}
