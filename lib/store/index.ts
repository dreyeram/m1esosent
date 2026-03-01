/**
 * Store Module - Main Export
 * 
 * Centralizes all Zustand stores for the application.
 */

// Authentication store
export {
    useAuthStore,
    useCurrentUser,
    useHasRole,
    useIsAdmin,
    useIsDoctor,
    type AuthUser,
} from './auth.store';

// Schedule store
export {
    useScheduleStore,
    useProceduresForDate,
    useTodaysProcedures,
    useNextProcedure,
    type ScheduledProcedure,
} from './schedule.store';

// Procedure store
export {
    useProcedureStore,
    useActiveCaptures,
    useCaptureCount,
    useProcedureDuration,
    type Capture,
    type ProcedurePatient,
    type FilterSettings,
} from './procedure.store';

// UI store
export {
    useUIStore,
    useNotify,
    useIsModalOpen,
    useModalData,
    type Notification,
    type ModalState,
} from './ui.store';
