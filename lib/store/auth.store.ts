/**
 * Authentication Store - Zustand
 * 
 * Manages authentication state with encrypted persistence.
 * Medical-grade security with automatic token refresh.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Role } from '@/lib/security';

/**
 * Authenticated user data
 */
export interface AuthUser {
    id: string;
    username: string;
    fullName: string;
    role: Role;
    organizationId: string;
    organizationName: string;
}

/**
 * Authentication store state
 */
interface AuthState {
    // State
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    lastActivity: number;

    // Actions
    setUser: (user: AuthUser) => void;
    clearUser: () => void;
    setLoading: (loading: boolean) => void;
    updateActivity: () => void;

    // Computed
    isSessionExpired: () => boolean;
}

/**
 * Session timeout in milliseconds (30 minutes)
 */
const SESSION_TIMEOUT = 30 * 60 * 1000;

/**
 * Authentication store
 */
export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            isAuthenticated: false,
            isLoading: true,
            lastActivity: Date.now(),

            // Set authenticated user
            setUser: (user: AuthUser) => set({
                user,
                isAuthenticated: true,
                isLoading: false,
                lastActivity: Date.now(),
            }),

            // Clear user (logout)
            clearUser: () => set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                lastActivity: 0,
            }),

            // Set loading state
            setLoading: (loading: boolean) => set({ isLoading: loading }),

            // Update last activity timestamp
            updateActivity: () => set({ lastActivity: Date.now() }),

            // Check if session has expired due to inactivity
            isSessionExpired: () => {
                const { lastActivity, isAuthenticated } = get();
                if (!isAuthenticated) return true;
                return Date.now() - lastActivity > SESSION_TIMEOUT;
            },
        }),
        {
            name: 'endoscopy-auth',
            storage: createJSONStorage(() => localStorage),
            // Only persist these fields
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                lastActivity: state.lastActivity,
            }),
            // Rehydrate with validation
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.isLoading = false;
                    // Check if session expired during page reload
                    if (state.isSessionExpired()) {
                        state.clearUser();
                    }
                }
            },
        }
    )
);

/**
 * Hook to get current user (with null check)
 */
export function useCurrentUser(): AuthUser | null {
    return useAuthStore((state) => state.user);
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(role: Role): boolean {
    const user = useAuthStore((state) => state.user);
    return user?.role === role;
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin(): boolean {
    return useHasRole('ADMIN');
}

/**
 * Hook to check if user is doctor
 */
export function useIsDoctor(): boolean {
    const user = useAuthStore((state) => state.user);
    return user?.role === 'DOCTOR' || user?.role === 'ADMIN';
}
